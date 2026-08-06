import { describe, it, expect } from 'vitest';
import {
  validateQueueInputs,
  calculateQueueMetrics,
  calculateMM1Metrics,
  getCapacityStatus,
  CAPACITY_STATUS_THRESHOLDS,
  QueueMetrics,
} from '@/lib/queueing';

describe('validateQueueInputs', () => {
  it('accepts valid inputs', () => {
    const result = validateQueueInputs({ lambda: 10, mu: 20, c: 2 });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects lambda <= 0', () => {
    expect(validateQueueInputs({ lambda: 0, mu: 10, c: 1 }).errors).toContain('LAMBDA_NOT_POSITIVE');
    expect(validateQueueInputs({ lambda: -5, mu: 10, c: 1 }).errors).toContain('LAMBDA_NOT_POSITIVE');
  });

  it('rejects mu <= 0', () => {
    expect(validateQueueInputs({ lambda: 10, mu: 0, c: 1 }).errors).toContain('MU_NOT_POSITIVE');
    expect(validateQueueInputs({ lambda: 10, mu: -1, c: 1 }).errors).toContain('MU_NOT_POSITIVE');
  });

  it('rejects c < 1 and non-integer c', () => {
    expect(validateQueueInputs({ lambda: 10, mu: 10, c: 0 }).errors).toContain('C_NOT_POSITIVE_INTEGER');
    expect(validateQueueInputs({ lambda: 10, mu: 10, c: -2 }).errors).toContain('C_NOT_POSITIVE_INTEGER');
    expect(validateQueueInputs({ lambda: 10, mu: 10, c: 2.5 }).errors).toContain('C_NOT_POSITIVE_INTEGER');
  });

  it('rejects non-finite values', () => {
    expect(validateQueueInputs({ lambda: NaN, mu: 10, c: 1 }).valid).toBe(false);
    expect(validateQueueInputs({ lambda: 10, mu: Infinity, c: 1 }).valid).toBe(false);
  });

  it('accumulates multiple errors at once', () => {
    const result = validateQueueInputs({ lambda: 0, mu: 0, c: 0 });
    expect(result.errors).toHaveLength(3);
  });
});

describe('calculateQueueMetrics — M/M/1 known example', () => {
  // lambda=30/hr, mu=60/hr — matches the worked example in docs/theory_notes.md
  // and the existing Python mm1_metrics() implementation.
  const metrics = calculateQueueMetrics({ lambda: 30, mu: 60, c: 1 });

  it('matches the documented worked example', () => {
    expect(metrics.stable).toBe(true);
    expect(metrics.utilization).toBeCloseTo(0.5, 10);
    expect(metrics.l).toBeCloseTo(1, 10);
    expect(metrics.lq).toBeCloseTo(0.5, 10);
    expect(metrics.wHours).toBeCloseTo(1 / 30, 10); // 2 minutes
    expect(metrics.wqHours).toBeCloseTo(1 / 60, 10); // 1 minute
  });

  it('has M/M/1-specific closed forms for p0 and probWait', () => {
    expect(metrics.p0).toBeCloseTo(0.5, 10); // p0 = 1 - rho
    expect(metrics.probWait).toBeCloseTo(0.5, 10); // probWait = rho for M/M/1
  });
});

describe('calculateQueueMetrics — M/M/c hand-verified examples', () => {
  it('c=2, lambda=1, mu=1 (a=1 Erlang, rho=0.5)', () => {
    const m = calculateQueueMetrics({ lambda: 1, mu: 1, c: 2 });
    expect(m.stable).toBe(true);
    expect(m.utilization).toBeCloseTo(0.5, 10);
    expect(m.p0).toBeCloseTo(1 / 3, 10);
    expect(m.probWait).toBeCloseTo(1 / 3, 10);
    expect(m.lq).toBeCloseTo(1 / 3, 10);
    expect(m.wqHours).toBeCloseTo(1 / 3, 10);
    expect(m.wHours).toBeCloseTo(4 / 3, 10);
    expect(m.l).toBeCloseTo(4 / 3, 10);
  });

  it('c=3, lambda=2, mu=1 (a=2 Erlangs, rho=2/3)', () => {
    const m = calculateQueueMetrics({ lambda: 2, mu: 1, c: 3 });
    expect(m.stable).toBe(true);
    expect(m.utilization).toBeCloseTo(2 / 3, 10);
    expect(m.p0).toBeCloseTo(1 / 9, 10);
    expect(m.probWait).toBeCloseTo(4 / 9, 10);
    expect(m.lq).toBeCloseTo(8 / 9, 10);
    expect(m.wqHours).toBeCloseTo(4 / 9, 10);
    expect(m.wHours).toBeCloseTo(13 / 9, 10);
    expect(m.l).toBeCloseTo(26 / 9, 10);
  });

  it('c=4, lambda=2, mu=1 (a=2 Erlangs, rho=0.5)', () => {
    const m = calculateQueueMetrics({ lambda: 2, mu: 1, c: 4 });
    expect(m.stable).toBe(true);
    expect(m.p0).toBeCloseTo(3 / 23, 10);
    expect(m.probWait).toBeCloseTo(4 / 23, 10);
    expect(m.lq).toBeCloseTo(4 / 23, 10);
    expect(m.wqHours).toBeCloseTo(2 / 23, 10);
    expect(m.wHours).toBeCloseTo(25 / 23, 10);
    expect(m.l).toBeCloseTo(50 / 23, 10);
  });
});

describe('calculateQueueMetrics — c=1 reduces exactly to M/M/1', () => {
  const cases: Array<[number, number]> = [
    [5, 10],
    [30, 60],
    [1, 4],
    [12.5, 20],
  ];

  it.each(cases)('lambda=%d, mu=%d', (lambda, mu) => {
    const viaMMc = calculateQueueMetrics({ lambda, mu, c: 1 });
    const viaMM1Alias = calculateMM1Metrics(lambda, mu);

    // Independent, direct textbook M/M/1 formulas (not reusing the engine)
    // as the ground truth for this comparison.
    const rho = lambda / mu;
    const expectedL = rho / (1 - rho);
    const expectedLq = (rho * rho) / (1 - rho);
    const expectedW = 1 / (mu - lambda);
    const expectedWq = lambda / (mu * (mu - lambda));

    for (const m of [viaMMc, viaMM1Alias]) {
      expect(m.stable).toBe(true);
      expect(m.utilization).toBeCloseTo(rho, 10);
      expect(m.p0).toBeCloseTo(1 - rho, 10);
      expect(m.probWait).toBeCloseTo(rho, 10);
      expect(m.l).toBeCloseTo(expectedL, 10);
      expect(m.lq).toBeCloseTo(expectedLq, 10);
      expect(m.wHours).toBeCloseTo(expectedW, 10);
      expect(m.wqHours).toBeCloseTo(expectedWq, 10);
    }
  });
});

describe('calculateQueueMetrics — utilization regimes', () => {
  it('handles very low utilization without numerical issues', () => {
    const m = calculateQueueMetrics({ lambda: 1, mu: 100, c: 1 });
    expect(m.stable).toBe(true);
    expect(m.utilization).toBeCloseTo(0.01, 10);
    expect(m.wHours).toBeCloseTo(1 / 99, 8);
    expect(Number.isFinite(m.lq as number)).toBe(true);
  });

  it('handles near-capacity utilization (rho=0.95) and stays finite', () => {
    const m = calculateQueueMetrics({ lambda: 95, mu: 100, c: 1 });
    expect(m.stable).toBe(true);
    expect(m.utilization).toBeCloseTo(0.95, 10);
    expect(m.lq).toBeCloseTo((0.95 * 0.95) / 0.05, 6);
    expect(Number.isFinite(m.lq as number)).toBe(true);
    expect(Number.isFinite(m.wqHours as number)).toBe(true);
  });

  it('handles near-capacity multi-server configurations without NaN/Infinity', () => {
    const m = calculateQueueMetrics({ lambda: 99, mu: 10, c: 10 });
    expect(m.stable).toBe(true);
    expect(Number.isFinite(m.lq as number)).toBe(true);
    expect(Number.isFinite(m.wqHours as number)).toBe(true);
    expect(m.lq as number).toBeGreaterThan(0);
  });

  it('remains numerically stable for larger c (avoids factorial overflow)', () => {
    const m = calculateQueueMetrics({ lambda: 400, mu: 10, c: 50 });
    expect(m.stable).toBe(true);
    expect(Number.isFinite(m.p0 as number)).toBe(true);
    expect(Number.isFinite(m.lq as number)).toBe(true);
    expect(m.p0 as number).toBeGreaterThan(0);
  });
});

describe('calculateQueueMetrics — unstable configurations', () => {
  it('marks lambda > c*mu as unstable with null wait metrics', () => {
    const m = calculateQueueMetrics({ lambda: 100, mu: 50, c: 1 });
    expect(m.stable).toBe(false);
    expect(m.utilization).toBeCloseTo(2, 10);
    expect(m.p0).toBeNull();
    expect(m.probWait).toBeNull();
    expect(m.lq).toBeNull();
    expect(m.l).toBeNull();
    expect(m.wqHours).toBeNull();
    expect(m.wHours).toBeNull();
  });

  it('treats lambda === c*mu (rho=1 exactly) as unstable, not a finite edge case', () => {
    const m = calculateQueueMetrics({ lambda: 100, mu: 50, c: 2 });
    expect(m.stable).toBe(false);
    expect(m.utilization).toBeCloseTo(1, 10);
    expect(m.wqHours).toBeNull();
  });

  it('marks a multi-server overloaded configuration as unstable', () => {
    const m = calculateQueueMetrics({ lambda: 500, mu: 10, c: 10 });
    expect(m.stable).toBe(false);
    expect(m.wqHours).toBeNull();
  });
});

describe('getCapacityStatus', () => {
  const buildMetrics = (utilization: number, stable = true): QueueMetrics => ({
    stable,
    totalCapacity: 100,
    offeredLoad: utilization * 100,
    utilization,
    p0: stable ? 0.5 : null,
    probWait: stable ? 0.5 : null,
    lq: stable ? 1 : null,
    l: stable ? 2 : null,
    wqHours: stable ? 0.1 : null,
    wHours: stable ? 0.2 : null,
  });

  it('classifies unstable configurations regardless of utilization value', () => {
    expect(getCapacityStatus(buildMetrics(1.5, false))).toBe('unstable');
  });

  it('classifies healthy capacity below the high-utilization threshold', () => {
    expect(getCapacityStatus(buildMetrics(0.5))).toBe('healthy');
    expect(getCapacityStatus(buildMetrics(CAPACITY_STATUS_THRESHOLDS.highUtilization - 0.01))).toBe('healthy');
  });

  it('classifies high utilization at and above the threshold, below near-capacity', () => {
    expect(getCapacityStatus(buildMetrics(CAPACITY_STATUS_THRESHOLDS.highUtilization))).toBe('high_utilization');
    expect(getCapacityStatus(buildMetrics(CAPACITY_STATUS_THRESHOLDS.nearCapacity - 0.01))).toBe('high_utilization');
  });

  it('classifies near capacity at and above the near-capacity threshold', () => {
    expect(getCapacityStatus(buildMetrics(CAPACITY_STATUS_THRESHOLDS.nearCapacity))).toBe('near_capacity');
    expect(getCapacityStatus(buildMetrics(0.99))).toBe('near_capacity');
  });
});
