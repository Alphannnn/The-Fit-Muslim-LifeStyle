"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const ease = [0.22, 0.61, 0.36, 1] as const;

/**
 * Product imagery. When a walkthrough video exists it loops by default and
 * swaps to the still on hover — with a button for touch, which has no hover.
 */
export default function ProductMedia({
  image,
  alt,
  video,
  poster,
}: {
  image: string;
  alt: string;
  video?: string | null;
  poster?: string | null;
}) {
  const [showStill, setShowStill] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (showStill) v.pause();
    else void v.play().catch(() => {});
  }, [showStill]);

  if (!video) {
    return (
      <div className="relative isolate overflow-hidden rounded-xl border border-linen bg-sand shadow-[0_30px_60px_-34px_rgba(21,24,21,0.45)]">
        <div className="relative aspect-4/3 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={alt} className="h-full w-full object-contain p-6" />
          <span className="pointer-events-none absolute inset-3 rounded-lg border border-gold/25" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative isolate overflow-hidden rounded-xl border border-linen bg-sand shadow-[0_30px_60px_-34px_rgba(21,24,21,0.45)]"
      onMouseEnter={() => setShowStill(true)}
      onMouseLeave={() => setShowStill(false)}
    >
      <div className="relative aspect-17/10 w-full">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={video}
          poster={poster ?? undefined}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-label={`Walkthrough of ${alt}`}
        />

        <AnimatePresence>
          {showStill && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease }}
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(70% 70% at 50% 45%, #fdfbf7 0%, #f4eee2 55%, #ebe2d0 100%)",
              }}
            >
              <motion.img
                src={image}
                alt={alt}
                initial={{ scale: 0.92, y: 14 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.94, y: 10 }}
                transition={{ duration: 0.7, ease }}
                className="absolute inset-0 h-full w-full object-contain p-5 drop-shadow-[0_26px_40px_rgba(21,24,21,0.34)] sm:p-7"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <span className="pointer-events-none absolute inset-3 rounded-lg border border-gold/25" />
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-linen bg-ivory/80 px-5 py-3.5 backdrop-blur-sm">
        <AnimatePresence mode="wait">
          <motion.span
            key={showStill ? "still" : "video"}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.35, ease }}
            className="text-[0.62rem] font-semibold uppercase tracking-[0.26em] text-ink-muted"
          >
            {/* The label names what is on screen; the button offers the other
                view. Spelling out "hover to see the cover" as well just said
                the same thing twice. */}
            {showStill ? "The cover" : "Inside the planner"}
          </motion.span>
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setShowStill((s) => !s)}
          className="cursor-pointer rounded-full border border-gold/50 px-4 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-gold-deep transition-colors hover:bg-gold/10"
        >
          {showStill ? "Play walkthrough" : "View cover"}
        </button>
      </div>
    </div>
  );
}
