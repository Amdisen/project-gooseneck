"use client";

import { useEffect, useRef, useState } from "react";
import { secondsToClock, type ActualPour } from "@/lib/validation/recipe";

export type TimerStep = {
  label: string;
  targetTotal: number;
  endAtSec: number;
};

export function BrewTimer({
  steps,
  onDone,
}: {
  steps: TimerStep[];
  onDone: (actuals: ActualPour[]) => void;
}) {
  const [accumMs, setAccumMs] = useState(0);
  const [startTs, setStartTs] = useState<number | null>(null);
  const [, force] = useState(0);
  const [marks, setMarks] = useState<ActualPour[]>([]);
  const [muted, setMuted] = useState(false);

  const running = startTs !== null;
  const announcedRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const wakeRef = useRef<WakeLockSentinel | null>(null);
  const mutedRef = useRef(false);
  mutedRef.current = muted;

  const lastEnd = steps.length ? steps[steps.length - 1].endAtSec : 0;
  const elapsedMs = running ? accumMs + (Date.now() - startTs) : accumMs;
  const elapsed = Math.floor(elapsedMs / 1000);
  const currentIndex = steps.findIndex((s) => s.endAtSec > elapsed);
  const current = currentIndex === -1 ? null : steps[currentIndex];
  const countdown = current ? current.endAtSec - elapsed : 0;

  function cue() {
    if (mutedRef.current) return;
    try {
      navigator.vibrate?.(200);
    } catch {}
    try {
      let ctx = audioRef.current;
      if (!ctx) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      o.start();
      o.stop(ctx.currentTime + 0.26);
    } catch {}
  }

  // Tick + step-boundary cue while running.
  useEffect(() => {
    if (!running || startTs === null) return;
    const iv = setInterval(() => {
      force((x) => x + 1);
      const el = (accumMs + (Date.now() - startTs)) / 1000;
      const passed = steps.filter((s) => s.endAtSec <= el).length;
      if (passed > announcedRef.current) {
        announcedRef.current = passed;
        cue();
      }
    }, 200);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, startTs, accumMs, steps]);

  async function requestWake() {
    try {
      wakeRef.current = (await navigator.wakeLock?.request("screen")) ?? null;
    } catch {}
  }
  function releaseWake() {
    try {
      wakeRef.current?.release();
    } catch {}
    wakeRef.current = null;
  }
  useEffect(() => () => releaseWake(), []);

  function start() {
    if (running) return;
    if (!audioRef.current) {
      try {
        const Ctor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        audioRef.current = new Ctor();
      } catch {}
    }
    audioRef.current?.resume?.();
    setStartTs(Date.now());
    requestWake();
  }
  function pause() {
    if (!running || startTs === null) return;
    setAccumMs(accumMs + (Date.now() - startTs));
    setStartTs(null);
    releaseWake();
  }
  function reset() {
    setStartTs(null);
    setAccumMs(0);
    setMarks([]);
    announcedRef.current = 0;
    releaseWake();
  }
  function markPour() {
    if (marks.length >= steps.length) return;
    const s = steps[marks.length];
    setMarks([
      ...marks,
      { label: s.label, plannedSec: s.endAtSec, actualSec: elapsed },
    ]);
  }
  function done() {
    pause();
    onDone(marks);
  }

  const started = running || accumMs > 0;
  const btn =
    "rounded px-4 py-3 text-base font-medium min-h-[56px] flex-1";

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-gray-200 bg-gray-50 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">
          {current ? current.label : "All pours complete"}
        </span>
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? "🔕" : "🔔"}
        </button>
      </div>

      <div className="text-center">
        <div className="font-mono text-6xl tabular-nums">
          {secondsToClock(elapsed)}
        </div>
        {current && (
          <p className="mt-2 text-lg">
            Pour to <span className="font-semibold">{current.targetTotal}g</span>
          </p>
        )}
        {current && (
          <p className="text-sm text-gray-500">
            {countdown >= 0
              ? `next in ${secondsToClock(countdown)}`
              : `overdue ${secondsToClock(-countdown)}`}
          </p>
        )}
      </div>

      {/* progress */}
      <div className="h-1.5 w-full overflow-hidden rounded bg-gray-200">
        <div
          className="h-full bg-gray-900 transition-all"
          style={{
            width: `${lastEnd ? Math.min(100, (elapsed / lastEnd) * 100) : 0}%`,
          }}
        />
      </div>

      {/* step list */}
      <ol className="flex flex-col divide-y divide-gray-200 rounded border border-gray-200 bg-white text-sm">
        {steps.map((s, i) => {
          const mark = marks[i];
          const isCurrent = i === currentIndex;
          return (
            <li
              key={i}
              className={`flex items-center justify-between p-2.5 ${
                isCurrent ? "bg-amber-50" : ""
              }`}
            >
              <span>
                {mark ? "✓ " : ""}
                {s.label} · {s.targetTotal}g
              </span>
              <span className="text-gray-500">
                {secondsToClock(s.endAtSec)}
                {mark && (
                  <span className="ml-2 text-gray-400">
                    (actual {secondsToClock(mark.actualSec)})
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="flex gap-2">
        {!started ? (
          <button
            type="button"
            onClick={start}
            className={`${btn} bg-gray-900 text-white`}
          >
            Start
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={running ? pause : start}
              className={`${btn} border border-gray-300`}
            >
              {running ? "Pause" : "Resume"}
            </button>
            <button
              type="button"
              onClick={markPour}
              disabled={marks.length >= steps.length}
              className={`${btn} bg-gray-900 text-white disabled:opacity-40`}
            >
              Mark pour
            </button>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="flex-1 rounded border border-gray-300 px-4 py-2 text-sm"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={done}
          className="flex-1 rounded border border-gray-900 px-4 py-2 text-sm font-medium"
        >
          Done →
        </button>
      </div>
    </div>
  );
}
