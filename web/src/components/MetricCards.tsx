import { QueueMetrics, getCapacityStatus } from '@/lib/queueing';
import { formatDuration, formatNumber, formatPercent } from '@/lib/formatting';
import { StatusBadge } from './StatusBadge';
import { Card } from './ui/Card';

function Metric({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {caption && <p className="mt-1 text-xs text-muted">{caption}</p>}
    </Card>
  );
}

export function MetricCards({ metrics }: { metrics: QueueMetrics }) {
  const status = getCapacityStatus(metrics);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card>
        <p className="text-sm text-muted">Status</p>
        <div className="mt-2">
          <StatusBadge status={status} />
        </div>
        <p className="mt-1 text-xs text-muted">
          {metrics.stable
            ? `${formatPercent(metrics.utilization)} utilization`
            : 'Demand meets or exceeds capacity'}
        </p>
      </Card>
      <Metric
        label="Utilization"
        value={formatPercent(metrics.utilization)}
        caption={metrics.stable ? undefined : 'At or above 100% capacity'}
      />
      <Metric label="Expected wait" value={formatDuration(metrics.wqHours)} caption="Time in queue before service" />
      <Metric label="Queue length" value={metrics.stable ? formatNumber(metrics.lq, 2) : '—'} caption="Customers waiting, on average" />
      <Metric label="Time in system" value={formatDuration(metrics.wHours)} caption="Wait + service time" />
    </div>
  );
}
