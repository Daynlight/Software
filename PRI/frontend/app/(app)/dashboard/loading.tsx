export default function Loading() {
  return (
    <div role="status" className="flex items-center gap-3 py-10">
      <span
        aria-hidden="true"
        className="size-6 animate-spin rounded-full border-4 border-border border-t-primary motion-reduce:animate-none"
      />
      <span>Ładowanie…</span>
    </div>
  );
}