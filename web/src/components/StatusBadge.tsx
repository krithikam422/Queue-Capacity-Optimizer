import { CapacityStatus } from '@/lib/queueing';

const STATUS_CONFIG: Record<CapacityStatus, { label: string; colorClass: string; dotClass: string }> = {
  healthy: { label: 'Healthy capacity', colorClass: 'text-healthy', dotClass: 'bg-healthy' },
  high_utilization: { label: 'High utilization', colorClass: 'text-high-utilization', dotClass: 'bg-high-utilization' },
  near_capacity: { label: 'Near capacity', colorClass: 'text-near-capacity', dotClass: 'bg-near-capacity' },
  unstable: { label: 'Unstable', colorClass: 'text-unstable', dotClass: 'bg-unstable' },
};

export function StatusBadge({ status }: { status: CapacityStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${config.colorClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
}
