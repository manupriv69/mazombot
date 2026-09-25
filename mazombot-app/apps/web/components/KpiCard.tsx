type KpiCardProps = {
  label: string;
  value: string;
  delta?: string;
};

export function KpiCard({ label, value, delta }: KpiCardProps) {
  const isPositive = delta?.startsWith("+");

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground">
        {label.toUpperCase()}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</p>
      {delta && (
        <p className={`mt-1 text-xs ${isPositive ? "text-success" : "text-destructive"}`}>
          {delta}
        </p>
      )}
    </div>
  );
}
