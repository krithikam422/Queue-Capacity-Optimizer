'use client';

import { Tooltip } from './Tooltip';

export function NumberField({
  id,
  label,
  tooltip,
  value,
  onChange,
  unit,
  min = 0,
  step = 1,
  error,
}: {
  id: string;
  label: string;
  tooltip: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  min?: number;
  step?: number;
  error?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <Tooltip text={tooltip} />
      </div>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 ${
            error ? 'border-unstable' : 'border-border focus:border-accent'
          } ${unit ? 'pr-14' : ''}`}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted">
            {unit}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-unstable">{error}</p>}
    </div>
  );
}
