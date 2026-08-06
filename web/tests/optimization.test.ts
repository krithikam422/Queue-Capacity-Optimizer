import { describe, it, expect } from 'vitest';
import {
  evaluateConfiguration,
  generateCandidateServerCounts,
  buildScenarioComparison,
  recommend,
  ConfigurationResult,
} from '@/lib/optimization';
import { QueueMetrics } from '@/lib/queueing';

describe('generateCandidateServerCounts', () => {
  it('centers on the current configuration (example from the product spec)', () => {
    expect(generateCandidateServerCounts(3)).toEqual([2, 3, 4, 5, 6]);
  });

  it('clips below 1 server and deduplicates', () => {
    expect(generateCandidateServerCounts(1)).toEqual([1, 2, 3, 4]);
  });
});

describe('evaluateConfiguration', () => {
  const costParams = { costPerServerPerHour: 20, waitingCostPerCustomerHour: 40 };

  it('computes the documented cost model for a stable configuration', () => {
    const result = evaluateConfiguration({ lambda: 30, mu: 60 }, 1, costParams);
    expect(result.metrics.stable).toBe(true);
    expect(result.staffingCostPerHour).toBeCloseTo(1 * 20, 10);
    // waiting_cost = arrival_rate * expected_wait_hours * waiting_cost_per_customer_hour
    const expectedWaitingCost = 30 * (result.metrics.wqHours as number) * 40;
    expect(result.waitingCostPerHour).toBeCloseTo(expectedWaitingCost, 10);
    expect(result.totalCostPerHour).toBeCloseTo(result.staffingCostPerHour + expectedWaitingCost, 10);
  });

  it('returns null costs for an unstable configuration rather than a misleading number', () => {
    const result = evaluateConfiguration({ lambda: 100, mu: 10 }, 2, costParams);
    expect(result.metrics.stable).toBe(false);
    expect(result.staffingCostPerHour).toBeCloseTo(2 * 20, 10);
    expect(result.waitingCostPerHour).toBeNull();
    expect(result.totalCostPerHour).toBeNull();
  });
});

describe('buildScenarioComparison', () => {
  const costParams = { costPerServerPerHour: 10, waitingCostPerCustomerHour: 5 };

  it('evaluates the default candidate range and delegates cost math to evaluateConfiguration', () => {
    const inputs = { lambda: 2, mu: 1, c: 3 };
    const { rows, searchExtended } = buildScenarioComparison(inputs, costParams);

    expect(rows.map((r) => r.c)).toEqual([2, 3, 4, 5, 6]);
    expect(searchExtended).toBe(false);

    // c=2 is exactly at capacity (lambda=2, mu*c=2) -> unstable
    expect(rows[0].metrics.stable).toBe(false);

    for (const c of [3, 4, 5, 6]) {
      const row = rows.find((r) => r.c === c) as ConfigurationResult;
      const expected = evaluateConfiguration(inputs, c, costParams);
      expect(row.metrics.stable).toBe(expected.metrics.stable);
      expect(row.totalCostPerHour).toBeCloseTo(expected.totalCostPerHour as number, 10);
    }
  });

  it('extends the search upward when no default candidate is stable', () => {
    const inputs = { lambda: 10, mu: 1, c: 1 };
    const { rows, searchExtended } = buildScenarioComparison(inputs, costParams);

    // Default candidates [1,2,3,4] are all unstable (capacity <= 4 < 10).
    expect(searchExtended).toBe(true);
    expect(rows).toHaveLength(5);
    const lastRow = rows[rows.length - 1];
    expect(lastRow.c).toBe(11); // smallest c with c*mu (=c) > 10
    expect(lastRow.metrics.stable).toBe(true);
  });

  it('gives up within the safety cap instead of hanging when nothing can stabilize nearby', () => {
    const inputs = { lambda: 10000, mu: 1, c: 1 };
    const { rows, searchExtended } = buildScenarioComparison(inputs, costParams);

    expect(searchExtended).toBe(true);
    expect(rows).toHaveLength(4); // unchanged — extension never found a stable row within the cap
    expect(rows.every((r) => !r.metrics.stable)).toBe(true);
  });
});

describe('recommend', () => {
  // Test doubles: hand-controlled ConfigurationResult rows so the
  // recommendation/selection logic can be verified independently of the
  // Erlang C math (which has its own dedicated tests in queueing.test.ts).
  const stableMetrics = (wqHours: number): QueueMetrics => ({
    stable: true,
    totalCapacity: 100,
    offeredLoad: 1,
    utilization: 0.5,
    p0: 0.5,
    probWait: 0.5,
    lq: 1,
    l: 2,
    wqHours,
    wHours: wqHours + 0.01,
  });

  const unstableMetrics = (): QueueMetrics => ({
    stable: false,
    totalCapacity: 10,
    offeredLoad: 1.2,
    utilization: 1.2,
    p0: null,
    probWait: null,
    lq: null,
    l: null,
    wqHours: null,
    wHours: null,
  });

  const stableRow = (c: number, wqHours: number, staffingCostPerHour: number, waitingCostPerHour: number): ConfigurationResult => ({
    c,
    metrics: stableMetrics(wqHours),
    staffingCostPerHour,
    waitingCostPerHour,
    totalCostPerHour: staffingCostPerHour + waitingCostPerHour,
  });

  const unstableRow = (c: number, staffingCostPerHour: number): ConfigurationResult => ({
    c,
    metrics: unstableMetrics(),
    staffingCostPerHour,
    waitingCostPerHour: null,
    totalCostPerHour: null,
  });

  it('recommends the minimum-cost stable configuration and computes deltas', () => {
    const rows = [
      stableRow(2, 1.0, 100, 200), // total 300 (current)
      stableRow(3, 0.5, 150, 100), // total 250 (cheapest)
      stableRow(4, 0.3, 200, 60), // total 260
    ];

    const rec = recommend(rows, 2);
    expect(rec).not.toBeNull();
    expect(rec!.recommendedRow.c).toBe(3);
    expect(rec!.isCurrentOptimal).toBe(false);
    expect(rec!.currentIsStable).toBe(true);
    expect(rec!.deltaStaffingCostPerHour).toBeCloseTo(50, 10);
    expect(rec!.deltaWaitingCostPerHour).toBeCloseTo(-100, 10);
    expect(rec!.deltaTotalCostPerHour).toBeCloseTo(-50, 10);
    expect(rec!.deltaWaitHours).toBeCloseTo(-0.5, 10);
    expect(rec!.percentChangeWait).toBeCloseTo(-0.5, 10);
    expect(rec!.insightText[0]).toMatch(/QueuePilot recommends 3 servers/);
  });

  it('breaks cost ties by preferring fewer servers, regardless of row order', () => {
    const rows = [
      stableRow(4, 0.8, 120, 80), // total 200
      stableRow(3, 1.0, 100, 100), // total 200 (tie, fewer servers should win)
    ];

    const rec = recommend(rows, 3);
    expect(rec!.recommendedRow.c).toBe(3);
    expect(rec!.isCurrentOptimal).toBe(true);
  });

  it('reports when the current configuration is already optimal', () => {
    const rows = [stableRow(3, 1.0, 150, 50)];
    const rec = recommend(rows, 3);

    expect(rec!.isCurrentOptimal).toBe(true);
    expect(rec!.deltaStaffingCostPerHour).toBeCloseTo(0, 10);
    expect(rec!.deltaTotalCostPerHour).toBeCloseTo(0, 10);
    expect(rec!.insightText[0]).toMatch(/already the lowest-cost stable configuration/);
  });

  it('flags diminishing returns when one extra server barely improves wait time', () => {
    const rows = [
      stableRow(2, 2.0, 100, 400), // total 500 (current)
      stableRow(3, 1.0, 150, 100), // total 250 (recommended)
      stableRow(4, 0.9, 200, 90), // total 290 — only 10% wait reduction over recommended, for +$50/hr
    ];

    const rec = recommend(rows, 2);
    expect(rec!.recommendedRow.c).toBe(3);
    expect(rec!.diminishingReturnsNote).not.toBeNull();
    expect(rec!.diminishingReturnsNote).toMatch(/diminishing return/);
    expect(rec!.diminishingReturnsNote).toMatch(/4 total/);
  });

  it('does not flag diminishing returns when the next server meaningfully helps', () => {
    const rows = [
      stableRow(3, 1.0, 150, 100), // total 250 (recommended)
      stableRow(4, 0.3, 200, 60), // total 260 — 70% wait reduction, well above the threshold
    ];

    const rec = recommend(rows, 3);
    expect(rec!.diminishingReturnsNote).toBeNull();
  });

  it('handles an unstable current configuration with no baseline deltas', () => {
    const rows = [unstableRow(3, 150), stableRow(5, 0.4, 250, 80)];
    const rec = recommend(rows, 3);

    expect(rec!.currentIsStable).toBe(false);
    expect(rec!.recommendedRow.c).toBe(5);
    expect(rec!.deltaWaitingCostPerHour).toBeNull();
    expect(rec!.deltaTotalCostPerHour).toBeNull();
    expect(rec!.deltaWaitHours).toBeNull();
    expect(rec!.percentChangeWait).toBeNull();
    expect(rec!.insightText[0]).toMatch(/unstable/);
    expect(rec!.insightText[0]).toMatch(/5 servers/);
  });

  it('returns null when no candidate configuration is stable', () => {
    const rows = [unstableRow(2, 100), unstableRow(3, 150)];
    expect(recommend(rows, 2)).toBeNull();
  });
});
