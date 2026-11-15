export default function Card({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:p-8"
    >
      <h2 id={id} className="text-xl font-semibold leading-[26px]">
        {title}
      </h2>
      {children}
    </section>
  );
}