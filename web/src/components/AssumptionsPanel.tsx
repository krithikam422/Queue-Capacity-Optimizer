import { Card } from './ui/Card';

const ASSUMPTIONS = [
  'Arrivals follow a Poisson process — random and independent of one another.',
  'Service times are exponentially distributed — memoryless, with high variability.',
  'Arrivals and service durations are independent of each other.',
  'All servers are identical and work in parallel.',
  'Customers are served first-come, first-served.',
  'The system is in steady state — these are long-run averages, not a snapshot of a transient spike.',
  'The queue can grow without a hard capacity limit, and the population of potential customers is effectively unlimited.',
];

export function AssumptionsPanel() {
  return (
    <Card>
      <details>
        <summary className="cursor-pointer text-sm font-medium text-foreground">
          Model assumptions &amp; limitations
        </summary>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
          <p>
            QueuePilot models your system as an M/M/1 or M/M/c queue. Those models rely on a
            specific set of assumptions:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {ASSUMPTIONS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            Real systems often violate one or more of these assumptions — arrivals may be bursty
            or scheduled, service times may follow a different distribution, servers may not be
            identical, and priority or abandonment behavior may exist. QueuePilot is a
            decision-support tool for reasoning about tradeoffs, not a guarantee about how any
            specific real-world system will behave.
          </p>
        </div>
      </details>
    </Card>
  );
}
