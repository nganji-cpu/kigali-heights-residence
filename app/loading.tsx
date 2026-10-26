export default function Loading() {
  return (
    <div className="flex min-h-[50svh] flex-col items-center justify-center gap-4 bg-ivory py-24">
      <span
        aria-hidden="true"
        className="size-8 rounded-full border-2 border-stone border-t-bronze spinner"
      />
      <p role="status" className="text-[0.72rem] tracking-[0.01em] text-charcoal/70">
        Loading
      </p>
    </div>
  );
}
