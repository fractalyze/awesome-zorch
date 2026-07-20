"use client";

// Hero: the whole playground, framed — editor, Run, execution plate, console,
// loaded with the core library's snippet via the #code deep link. The hero
// band is full-width, so the frame is wide enough (>820px on desktop) for the
// playground's real two-column layout; below that it stacks itself. While the
// frame loads, a skeleton mimicking that layout pulses in its place and fades
// out on load. The playground's reworked palette shares the site's ground
// tokens, so skeleton and frame sit on the same bg.

import { useState } from "react";
import { playgroundUrl } from "@/lib/site";

export function HeroPlayground({ id, snippet }: { id: string; snippet: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    // Mobile height tracks the viewport (70svh keeps the whole instrument on
    // screen); desktop is a fixed 680px — a viewport clamp there kept
    // undershooting the design height on ordinary 1080p windows.
    <div className="relative h-[min(640px,70svh)] w-full overflow-hidden rounded-2xl border border-edge bg-bg lg:h-[680px]">
      {!loaded && <PlaygroundSkeleton />}
      <iframe
        src={playgroundUrl({ id, quickstart: snippet })}
        title={`${id} playground`}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full transition-opacity duration-300 motion-reduce:transition-none ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

// Skeleton of the playground's own layout: header strip, editor lines on the
// left, readout column on the right (hidden when the frame would stack), Run
// bar at the bottom.
function PlaygroundSkeleton() {
  const lines = ["w-2/5", "w-3/5", "w-1/2", "w-2/3", "w-1/3", "w-3/4", "w-1/4", "w-3/5", "w-1/2", "w-2/5", "w-2/3", "w-1/3"];
  return (
    <div
      role="status"
      aria-label="Loading playground"
      className="absolute inset-0 flex animate-pulse flex-col motion-reduce:animate-none"
    >
      <div className="flex items-center justify-between border-b border-edge px-5 py-4">
        <div className="h-3.5 w-28 rounded bg-edge" />
        <div className="h-3.5 w-36 rounded bg-edge" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 space-y-3.5 overflow-hidden border-r border-edge p-5">
          {lines.map((w, i) => (
            <div key={i} className={`h-3 rounded bg-edge ${w}`} />
          ))}
        </div>
        <div className="hidden w-[42%] flex-col gap-3.5 p-5 sm:flex">
          <div className="h-3 w-1/3 rounded bg-edge" />
          <div className="h-10 w-1/2 rounded bg-edge" />
          <div className="mt-3 h-3 w-full rounded bg-edge" />
          <div className="h-3 w-full rounded bg-edge" />
          <div className="h-3 w-2/3 rounded bg-edge" />
        </div>
      </div>
      <div className="border-t border-edge px-5 py-3">
        <div className="h-8 w-24 rounded-full bg-edge" />
      </div>
    </div>
  );
}
