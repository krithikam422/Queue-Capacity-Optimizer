export function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">QueuePilot</h1>
        <p className="mt-1 text-base text-muted">
          Model demand. Test capacity. Make better staffing decisions.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          QueuePilot uses queueing models to estimate how demand, service capacity, and staffing
          affect wait times and operating costs.
        </p>
      </div>
    </header>
  );
}
