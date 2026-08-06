import { Recommendation } from '@/lib/optimization';
import { Card, CardHeading } from './ui/Card';

export function RecommendationPanel({ recommendation }: { recommendation: Recommendation | null }) {
  if (!recommendation) {
    return (
      <Card>
        <CardHeading title="Recommendation" />
        <p className="text-sm text-muted">
          No stable configuration was found within a reasonable number of servers for these
          inputs. Try lowering the arrival rate or raising the service rate per server.
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-accent/30">
      <CardHeading title="Recommendation" />
      <p className="text-lg font-medium text-foreground">
        {recommendation.isCurrentOptimal
          ? `Keep ${recommendation.recommendedRow.c} servers`
          : `Move to ${recommendation.recommendedRow.c} servers`}
      </p>
      <div className="mt-3 space-y-2">
        {recommendation.insightText.map((paragraph, i) => (
          <p key={i} className="text-sm leading-relaxed text-muted">
            {paragraph}
          </p>
        ))}
      </div>
    </Card>
  );
}
