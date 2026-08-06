import { ConfigurationResult } from '@/lib/optimization';
import { formatCurrencyPerHour, formatDuration, formatNumber, formatPercent } from '@/lib/formatting';
import { Card, CardHeading } from './ui/Card';

export function ScenarioTable({
  rows,
  currentC,
  recommendedC,
}: {
  rows: ConfigurationResult[];
  currentC: number;
  recommendedC: number;
}) {
  return (
    <Card>
      <CardHeading
        title="Scenario comparison"
        subtitle="Alternative staffing levels evaluated around your current configuration."
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="py-2 pr-4 font-medium">Servers</th>
              <th className="py-2 pr-4 font-medium">Utilization</th>
              <th className="py-2 pr-4 font-medium">Expected wait</th>
              <th className="py-2 pr-4 font-medium">Queue length</th>
              <th className="py-2 pr-4 font-medium">Staffing cost</th>
              <th className="py-2 pr-4 font-medium">Waiting cost</th>
              <th className="py-2 pr-4 font-medium">Total cost</th>
              <th className="py-2 pr-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isCurrent = row.c === currentC;
              const isRecommended = row.c === recommendedC;
              return (
                <tr
                  key={row.c}
                  className={`border-b border-border last:border-0 ${
                    isRecommended ? 'bg-accent/5' : ''
                  }`}
                >
                  <td className="py-2.5 pr-4 font-medium text-foreground">
                    {row.c}
                    {isCurrent && <span className="ml-2 rounded-full border border-border px-1.5 py-0.5 text-[11px] font-normal text-muted">current</span>}
                    {isRecommended && (
                      <span className="ml-2 rounded-full border border-accent px-1.5 py-0.5 text-[11px] font-normal text-accent">
                        recommended
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums text-foreground">{formatPercent(row.metrics.utilization)}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-foreground">{formatDuration(row.metrics.wqHours)}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-foreground">{row.metrics.stable ? formatNumber(row.metrics.lq, 2) : '—'}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-foreground">{formatCurrencyPerHour(row.staffingCostPerHour)}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-foreground">{formatCurrencyPerHour(row.waitingCostPerHour)}</td>
                  <td className="py-2.5 pr-4 tabular-nums font-medium text-foreground">{formatCurrencyPerHour(row.totalCostPerHour)}</td>
                  <td className="py-2.5 pr-4 text-foreground">{row.metrics.stable ? 'Stable' : 'Unstable'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
