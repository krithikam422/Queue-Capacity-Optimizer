import { ConfigurationResult } from '@/lib/optimization';
import { formatDuration } from '@/lib/formatting';
import { Card, CardHeading } from '../ui/Card';
import { MetricLineChart } from './MetricLineChart';

export function WaitTimeChart({
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
    value: r.metrics.stable ? (r.metrics.wqHours as number) * 60 : null, // minutes
  }));

  return (
    <Card>
      <CardHeading title="Expected wait vs. servers" subtitle="Time a customer spends in queue before being served." />
      <MetricLineChart
        data={data}
        currentC={currentC}
        recommendedC={recommendedC}
        yLabel="Minutes"
        valueFormatter={(v) => formatDuration(v / 60)}
      />
    </Card>
  );
}
