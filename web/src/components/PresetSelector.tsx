import { SCENARIO_PRESETS } from '@/lib/scenarios';

export function PresetSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">Example scenarios</span>
        <span className="text-xs text-muted">Illustrative assumptions, not benchmarks</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {SCENARIO_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            title={preset.description}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              selectedId === preset.id
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-border text-foreground hover:border-accent hover:text-accent'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}
