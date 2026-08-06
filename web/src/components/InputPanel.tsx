import { QueueValidationError } from '@/lib/queueing';
import { AppInputs } from '@/lib/types';
import { NumberField } from './ui/NumberField';

const ERROR_MESSAGES: Record<QueueValidationError, string> = {
  LAMBDA_NOT_POSITIVE: 'Arrival rate must be greater than 0.',
  MU_NOT_POSITIVE: 'Service rate must be greater than 0.',
  C_NOT_POSITIVE_INTEGER: 'Servers must be a whole number of 1 or more.',
};

export function InputPanel({
  inputs,
  onChange,
  errors,
}: {
  inputs: AppInputs;
  onChange: <K extends keyof AppInputs>(key: K, value: AppInputs[K]) => void;
  errors: QueueValidationError[];
}) {
  const errorFor = (code: QueueValidationError) => (errors.includes(code) ? ERROR_MESSAGES[code] : undefined);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <NumberField
        id="lambda"
        label="Arrival rate"
        unit="/hr"
        tooltip="How many customers or requests arrive per hour, on average. Assumed to follow a Poisson process."
        value={inputs.lambda}
        onChange={(v) => onChange('lambda', v)}
        min={0.01}
        step={1}
        error={errorFor('LAMBDA_NOT_POSITIVE')}
      />
      <NumberField
        id="mu"
        label="Service rate per server"
        unit="/hr"
        tooltip="How many customers one server can complete per hour, on average, if kept continuously busy. Assumed to follow an exponential service-time distribution."
        value={inputs.mu}
        onChange={(v) => onChange('mu', v)}
        min={0.01}
        step={1}
        error={errorFor('MU_NOT_POSITIVE')}
      />
      <NumberField
        id="c"
        label="Number of servers"
        tooltip="How many identical, parallel servers (agents, staff, machines) are currently working this queue."
        value={inputs.c}
        onChange={(v) => onChange('c', Math.round(v))}
        min={1}
        step={1}
        error={errorFor('C_NOT_POSITIVE_INTEGER')}
      />
      <NumberField
        id="costPerServerPerHour"
        label="Cost per server"
        unit="$/hr"
        tooltip="Fully-loaded hourly cost of staffing one server — wages, benefits, overhead, etc."
        value={inputs.costPerServerPerHour}
        onChange={(v) => onChange('costPerServerPerHour', v)}
        min={0}
        step={1}
      />
      <NumberField
        id="waitingCostPerCustomerHour"
        label="Cost of customer waiting"
        unit="$/hr"
        tooltip="Modeled cost of one customer waiting for one hour — lost goodwill, productivity, SLA penalties, etc. Used only to compare staffing tradeoffs, not as an accounting figure."
        value={inputs.waitingCostPerCustomerHour}
        onChange={(v) => onChange('waitingCostPerCustomerHour', v)}
        min={0}
        step={1}
      />
    </div>
  );
}
