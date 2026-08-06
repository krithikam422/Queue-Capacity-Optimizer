import { ConfigurationResult } from '@/lib/optimization';
import { formatPercent } from '@/lib/formatting';
import { Card, CardHeading } from '../ui/Card';
import { MetricLineChart } from './MetricLineChart';

export function UtilizationChart({
  rows,
  currentC,
  recommendedC,
}: {
  rows: ConfigurationResult[];
  currentC: number;
  recommendedC: number;
}) {
  const data = rows.map((r) => ({
    c: r.c,
    value: r.metrics.utilization * 100,
  }));

  return (
    <Card>
      <CardHeading title="Utilization vs. servers" subtitle="Share of total capacity consumed by demand." />
      <MetricLineChart
        data={data}
        currentC={currentC}
        recommendedC={recommendedC}
        yLabel="Utilization"
        valueFormatter={(v) => formatPercent(v / 100)}
      />
    </Card>
  );
}
