type SpinnerProps = {
  label?: string;
};

export function Spinner({ label = "Generating test..." }: SpinnerProps) {
  return (
    <div
      className="inline-flex items-center gap-3 text-sm text-[var(--muted-foreground)]"
      role="status"
      aria-live="polite"
    >
      <span className="inline-block size-4 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--accent)]" />
      <span>{label}</span>
    </div>
  );
}
