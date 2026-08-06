import { ConfigurationResult } from '@/lib/optimization';
import { formatCurrencyPerHour } from '@/lib/formatting';
import { Card, CardHeading } from '../ui/Card';
import { MetricLineChart } from './MetricLineChart';

export function CostChart({
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
    value: r.totalCostPerHour,
  }));

  return (
    <Card>
      <CardHeading title="Modeled total cost vs. servers" subtitle="Staffing cost plus modeled waiting cost, per hour." />
      <MetricLineChart
        data={data}
        currentC={currentC}
        recommendedC={recommendedC}
        yLabel="$/hr"
        valueFormatter={(v) => formatCurrencyPerHour(v)}
      />
    </Card>
  );
}
