export default function LandingSection({
  id,
  number,
  title,
  intro,
  tone = "light",
  first = false,
  children,
  after,
}: {
  id: string;
  number: string;
  title: string;
  intro?: string;
  tone?: "light" | "alt";
  first?: boolean;
  children?: React.ReactNode;
  after?: React.ReactNode;
}) {
  const alt = tone === "alt";
  const spacing = alt
    ? "bg-alt pb-[88px] pt-20"
    : first
      ? "pb-24 pt-0"
      : "pb-24 pt-[88px]";

  return (
    <section id={id} aria-labelledby={`${id}-title`} className={spacing}>
      <div className="mx-auto flex max-w-[1280px] flex-col gap-12 px-4 md:px-11 lg:px-[120px]">
        <div aria-hidden="true" className="border-t border-foreground" />

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-[60px]">
          <div className="flex flex-col gap-[14px] lg:w-[360px] lg:shrink-0">
            <span
              className={`font-logo text-xl leading-[26px] ${alt ? "text-foreground" : "text-primary"}`}
            >
              {number}
            </span>
            <h2
              id={`${id}-title`}
              className="font-serif text-[32px] leading-[1.1] lg:text-[40px]"
            >
              {title}
            </h2>
            {intro && (
              <p className={`text-base leading-[1.6] ${alt ? "text-foreground" : "text-muted"}`}>
                {intro}
              </p>
            )}
          </div>

          {children && <div className="min-w-0 lg:flex-1">{children}</div>}
        </div>

        {after}
      </div>
    </section>
  );
}