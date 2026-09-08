"use client";

/** Print-to-PDF, which every browser and OS already does better than we could. */
export default function PrintButton({ label = "Save as PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="cursor-pointer rounded-sm bg-green-800 px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ivory transition-colors hover:bg-green-900"
    >
      {label}
    </button>
  );
}
