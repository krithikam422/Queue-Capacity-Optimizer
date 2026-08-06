# QueuePilot

**Model demand. Test capacity. Make better staffing decisions.**

QueuePilot is an interactive capacity-planning tool built on queueing theory. Give it an
arrival rate, a service rate, and a staffing level, and it tells you whether the system is
adequately staffed, how alternative staffing levels compare, and which configuration
minimizes modeled cost — with the underlying math and assumptions fully visible.

**Live demo:** _add your Vercel URL here after deploying_
**Screenshot:** _add a screenshot of the deployed app here_

## Problem statement

"Should we add another agent to the support queue?" is a question every ops team asks, and
it's usually answered with a spreadsheet, a gut feeling, or nothing at all. The tradeoff is
real: understaffing produces long waits and unhappy customers; overstaffing wastes payroll
on idle capacity. Queueing theory has modeled this tradeoff rigorously for decades, but the
math (Erlang C, in particular) is opaque enough that most teams never use it directly.

QueuePilot closes that gap: it takes the same four or five numbers a manager already knows
(how many requests come in, how fast one person handles one, how many people are on the
schedule, what people and waiting cost) and turns them into a wait-time estimate, a staffing
comparison, and a specific recommendation — deterministically, with the formulas shown.

## What it does

1. **Model your current queue.** Enter arrival rate, service rate per server, and server
   count. QueuePilot reports utilization, expected wait time, queue length, time in system,
   and a plain-language capacity status (healthy / high utilization / near capacity /
   unstable).
2. **Compare staffing levels.** It automatically evaluates a range of server counts around
   your current configuration and shows utilization, wait time, and modeled cost for each.
3. **Get a recommendation.** A deterministic, rules-based optimizer picks the lowest-cost
   *stable* configuration and explains the tradeoff in a sentence — no LLM involved.
4. **See the shape of the tradeoff.** Three charts show expected wait, utilization, and
   total modeled cost as a function of server count, with your current and recommended
   configurations marked.

## Key features

- **M/M/1 and M/M/c (Erlang C) queueing engine** — pure, unit-tested TypeScript functions,
  numerically stable for large server counts.
- **Explicit stability handling** — when demand meets or exceeds capacity, QueuePilot marks
  the configuration unstable instead of showing a misleadingly finite wait time.
- **Transparent, editable cost model** — staffing cost vs. modeled waiting cost, with the
  formula shown in the UI.
- **Deterministic recommendation engine** — minimum-cost stable configuration, with
  diminishing-returns detection (calls out when one more server barely helps).
- **Four illustrative preset scenarios** (IT help desk, customer support center, clinic
  intake, warehouse station) to explore the model without hand-entering numbers.
- **An assumptions panel** that states plainly what the model does and doesn't account for.

## Technical architecture

```text
Queue-Capacity-Optimizer/
├── src/queueing_metrics.py     # Original Python M/M/1 reference implementation
├── docs/theory_notes.md        # M/M/1 formulas + a hand-verified worked example
└── web/                        # Next.js application (the deployed product)
    ├── src/lib/
    │   ├── queueing.ts         # M/M/1 & M/M/c (Erlang C) — pure math, no UI concerns
    │   ├── optimization.ts     # Cost model, scenario scan, recommendation engine
    │   ├── scenarios.ts        # Illustrative preset scenarios
    │   ├── formatting.ts       # Duration/currency/percent display helpers
    │   └── types.ts            # Shared input types
    ├── src/components/         # React components — presentation only, no queueing math
    │   ├── charts/             # Recharts wait/utilization/cost visualizations
    │   └── ui/                 # Small shared primitives (Card, Tooltip, NumberField)
    └── tests/                  # Vitest unit tests for lib/queueing.ts and lib/optimization.ts
```

**Why this split.** The queueing math started life in Python (`src/queueing_metrics.py`,
still here as the original reference implementation and worked example) but the deployed
product needed to run entirely client-side on Vercel, so the model was ported to TypeScript
rather than stood up behind a Python backend — that also means one language, one deploy
target, and no server to operate. Everything under `lib/` is pure, side-effect-free
functions; React components only format and display their output. That split is what makes
the engine unit-testable in isolation and keeps "is the math right" separate from "does the
UI look right."

## The queueing model

QueuePilot models a queue as **M/M/c**: Poisson arrivals, exponential service times, `c`
identical parallel servers, first-come-first-served. **M/M/1** is the exact special case
`c = 1`, so one engine (`calculateQueueMetrics`) covers both — verified in tests to reduce
algebraically to the standard M/M/1 formulas at `c = 1`.

Given arrival rate $\lambda$, service rate per server $\mu$, and server count $c$:

- Offered load: $a = \lambda / \mu$ (in Erlangs)
- Utilization: $\rho = \lambda / (c\mu) = a / c$
- **Stability condition:** the system is stable only if $\lambda < c\mu$

When stable, the Erlang C formulas give:

$$
P_0 = \left[ \sum_{k=0}^{c-1} \frac{a^k}{k!} \;+\; \frac{a^c}{c!}\cdot\frac{1}{1-\rho} \right]^{-1}
$$

$$
P_{\text{wait}} = \frac{a^c}{c!}\cdot\frac{1}{1-\rho}\cdot P_0 \qquad \text{(Erlang C formula)}
$$

$$
L_q = P_{\text{wait}} \cdot \frac{\rho}{1-\rho}
\qquad W_q = \frac{L_q}{\lambda}
\qquad W = W_q + \frac{1}{\mu}
\qquad L = \lambda W
$$

The $a^k/k!$ terms are accumulated with the recurrence `term_k = term_{k-1} * a / k` instead
of raw factorials, which keeps the calculation numerically stable for larger server counts.

**When $\lambda \geq c\mu$:** the queue is unstable — demand meets or exceeds total
capacity, so wait time and queue length grow without bound in steady state. QueuePilot
reports utilization (still meaningful) but never a finite-looking wait time or queue length
for an unstable configuration; those fields are explicitly null end-to-end, from the engine
to the UI.

## Optimization & cost model

The cost model is intentionally simple and stated in full:

```text
staffing_cost_per_hour      = servers × cost_per_server_per_hour
waiting_cost_per_hour       = arrival_rate × expected_wait_hours × waiting_cost_per_customer_hour
total_modeled_cost_per_hour = staffing_cost_per_hour + waiting_cost_per_hour
```

This is a **decision-support assumption**, not a universal economic model — it exists to
make one tradeoff (staffing spend vs. customer wait) comparable in a single unit, not to
produce an accounting-grade cost figure for any specific business.

The recommendation engine evaluates a range of server counts around the current
configuration (e.g. current = 3 → compares 2 through 6, extending the search further if
none of those are stable), filters to stable configurations, and picks the one with the
lowest total modeled cost — ties broken toward fewer servers. It also checks one step past
the recommendation: if an additional server would reduce wait time by less than 15% while
still costing more, it calls that out explicitly as a diminishing return. All of this is
plain arithmetic and comparisons — **no LLM is involved in generating the recommendation or
its explanation.**

## Model assumptions & limitations

M/M/c (and its M/M/1 special case) assumes:

- Poisson arrivals — random and independent of one another
- Exponentially distributed service times
- Independent arrivals and service durations
- Identical, parallel servers
- First-come, first-served queue discipline
- Steady-state conditions (long-run averages, not a transient snapshot)
- Unbounded queue capacity and calling population

Real systems often violate one or more of these — arrivals may be scheduled or bursty,
service times may follow a different distribution, priority or abandonment behavior may
exist. QueuePilot is a decision-support tool for reasoning about tradeoffs, not a prediction
guarantee for any specific system. The in-app "Model assumptions & limitations" panel states
this to end users directly.

## Testing strategy

The queueing and optimization engines are covered by Vitest unit tests
(`web/tests/queueing.test.ts`, `web/tests/optimization.test.ts`) — pure-function tests, no
UI, no mocking required. Coverage includes:

- A known M/M/1 example, cross-checked against the original Python `mm1_metrics()` output
  and the worked example in `docs/theory_notes.md`.
- Multiple M/M/c cases computed by hand from the Erlang C formulas (not copied from the
  implementation).
- The algebraic identity that M/M/c at `c = 1` reduces exactly to the M/M/1 formulas, tested
  against independently-written textbook formulas.
- Low-utilization, near-capacity, and large-server-count cases, checked for numerical
  stability (no NaN/Infinity).
- Unstable configurations (`λ ≥ cμ`), including the exact-boundary case, checked for null
  wait metrics rather than misleading finite ones.
- Invalid inputs (`λ ≤ 0`, `μ ≤ 0`, `c < 1`, non-integer `c`).
- The cost model, candidate server-count generation, the min-cost recommendation (including
  tie-breaking), diminishing-returns detection, and unstable-current-configuration handling
  — using hand-constructed test doubles so this logic is verified independently of the
  Erlang C math itself.

Run the suite:

```bash
cd web
npm test
```

## Local setup

```bash
cd web
npm install
npm run dev
```

Then open `http://localhost:3000`.

```bash
npm run build   # production build
npm run lint    # ESLint
npm test        # Vitest suite
```

The original Python reference implementation has no external dependencies beyond the
standard library:

```bash
python3 -c "from src.queueing_metrics import mm1_metrics; print(mm1_metrics(30, 60))"
```

## Tech stack

- **Next.js** (App Router) + **TypeScript** — the deployed application
- **Tailwind CSS v4** — styling, CSS-variable-based theming (light/dark aware)
- **Recharts** — the three comparison charts
- **Vitest** — unit testing for the queueing and optimization engines
- **Vercel** — deployment target (zero backend infrastructure required)
- Python 3 (standard library only) — original M/M/1 reference implementation, retained for
  historical/verification purposes

Deliberately not used: a database, authentication, a custom backend, or any LLM/AI API. The
product has no state to persist across sessions and no recommendation logic that benefits
from a language model — introducing any of the three would add operational surface area
without adding capability.

## Potential future improvements

- Multi-stage workflows (e.g. the original two-stage AI-processing → human-review pipeline
  sketched in early project notes) modeled as a tandem queueing network.
- Discrete-event simulation as a cross-check against the analytical steady-state model,
  particularly useful for time-varying (non-steady-state) arrival patterns.
- SLA-based inputs ("95% of customers served within N minutes") as an alternative framing to
  raw wait-time minimization.
- Shareable/permalink scenarios (URL-encoded inputs) now that the app is otherwise stateless.
- Sensitivity analysis — how much does the recommendation change if the arrival rate
  estimate is off by ±20%?
