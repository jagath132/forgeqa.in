export function SectionHeader({
  title,
  description,
  badgeLabel,
  badgeClass = "badge-primary",
}: {
  title: string;
  description: string;
  badgeLabel?: string;
  badgeClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      {badgeLabel ? (
        <span className={`badge ${badgeClass} inline-flex w-fit`}>{badgeLabel}</span>
      ) : null}
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[var(--text-primary)]">
        {title}
      </h1>
      <p className="text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
        {description}
      </p>
    </div>
  );
}
