type TopListItem = {
  name: string;
  sub?: string;
  value: string;
};

export function TopList({ title, items }: { title: string; items: TopListItem[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 font-display text-sm font-semibold">{title}</h2>
      <ul className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li key={item.name} className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neon-purple/20 text-xs font-medium text-neon-purple">
              {i + 1}
            </span>
            <div className="flex-1">
              <p className="text-sm">{item.name}</p>
              {item.sub && <p className="text-xs text-muted-foreground">{item.sub}</p>}
            </div>
            <span className="text-sm font-medium text-neon-cyan">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
