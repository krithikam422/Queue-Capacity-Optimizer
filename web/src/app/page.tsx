'use client';

import { useMemo, useState } from 'react';
import { calculateQueueMetrics, validateQueueInputs } from '@/lib/queueing';
import { buildScenarioComparison, recommend } from '@/lib/optimization';
import { DEFAULT_SCENARIO, SCENARIO_PRESETS } from '@/lib/scenarios';
import { AppInputs } from '@/lib/types';
import { Header } from '@/components/Header';
import { PresetSelector } from '@/components/PresetSelector';
import { InputPanel } from '@/components/InputPanel';
import { MetricCards } from '@/components/MetricCards';
import { ScenarioTable } from '@/components/ScenarioTable';
import { RecommendationPanel } from '@/components/RecommendationPanel';
import { WaitTimeChart } from '@/components/charts/WaitTimeChart';
import { UtilizationChart } from '@/components/charts/UtilizationChart';
import { CostChart } from '@/components/charts/CostChart';
import { AssumptionsPanel } from '@/components/AssumptionsPanel';
import { Card } from '@/components/ui/Card';

function inputsFromPreset(presetId: string): AppInputs {
  const preset = SCENARIO_PRESETS.find((p) => p.id === presetId) ?? DEFAULT_SCENARIO;
  return {
    lambda: preset.lambda,
    mu: preset.mu,
    c: preset.c,
    costPerServerPerHour: preset.costPerServerPerHour,
    waitingCostPerCustomerHour: preset.waitingCostPerCustomerHour,
  };
}

export default function Home() {
  const [inputs, setInputs] = useState<AppInputs>(inputsFromPreset(DEFAULT_SCENARIO.id));
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(DEFAULT_SCENARIO.id);

  const validation = useMemo(() => validateQueueInputs(inputs), [inputs]);

  const { metrics, comparison, recommendation } = useMemo(() => {
    if (!validation.valid) {
      return { metrics: null, comparison: null, recommendation: null };
    }
    const metrics = calculateQueueMetrics(inputs);
    const comparison = buildScenarioComparison(inputs, inputs);
    const recommendation = recommend(comparison.rows, inputs.c);
    return { metrics, comparison, recommendation };
  }, [inputs, validation.valid]);

  function handleInputChange<K extends keyof AppInputs>(key: K, value: AppInputs[K]) {
    setSelectedPresetId(null);
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handlePresetSelect(id: string) {
    setSelectedPresetId(id);
    setInputs(inputsFromPreset(id));
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
        <section className="space-y-4">
          <PresetSelector selectedId={selectedPresetId} onSelect={handlePresetSelect} />
          <Card>
            <InputPanel inputs={inputs} onChange={handleInputChange} errors={validation.errors} />
          </Card>
        </section>

        {metrics && comparison && (
          <>
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted">Current configuration</h2>
              <MetricCards metrics={metrics} />
            </section>

            <section>
              <RecommendationPanel recommendation={recommendation} />
            </section>

            <section>
              <ScenarioTable
                rows={comparison.rows}
                currentC={inputs.c}
                recommendedC={recommendation?.recommendedRow.c ?? inputs.c}
              />
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <WaitTimeChart
                rows={comparison.rows}
                currentC={inputs.c}
                recommendedC={recommendation?.recommendedRow.c ?? inputs.c}
              />
              <UtilizationChart
                rows={comparison.rows}
                currentC={inputs.c}
                recommendedC={recommendation?.recommendedRow.c ?? inputs.c}
              />
              <CostChart
                rows={comparison.rows}
                currentC={inputs.c}
                recommendedC={recommendation?.recommendedRow.c ?? inputs.c}
              />
            </section>
          </>
        )}

        <section>
          <AssumptionsPanel />
        </section>
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        QueuePilot is a decision-support tool built on standard queueing theory — not a
        prediction guarantee for any specific system.
      </footer>
    </div>
  );
}
