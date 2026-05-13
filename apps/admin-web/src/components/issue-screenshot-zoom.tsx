"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  computePinPositions,
  type IssueScreenshotPin,
} from "@/lib/ledgeria-issue-pins";

type ScreenshotWithPinsProps = {
  src: string;
  alt: string;
  imgClassName: string;
  pins?: IssueScreenshotPin[] | undefined;
};

function ScreenshotWithPins({
  src,
  alt,
  imgClassName,
  pins,
}: ScreenshotWithPinsProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [dots, setDots] = useState<
    Array<{ leftPx: number; topPx: number; pin: IssueScreenshotPin }>
  >([]);

  const recompute = useCallback(() => {
    const img = imgRef.current;
    if (!img || !pins?.length) {
      setDots([]);
      return;
    }
    setDots(computePinPositions(img, pins));
  }, [pins]);

  useLayoutEffect(() => {
    recompute();
  }, [recompute, src, pins]);

  useLayoutEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const ro = new ResizeObserver(recompute);
    ro.observe(img);
    return () => ro.disconnect();
  }, [recompute]);

  return (
    <div className="relative z-10 inline-block max-w-full">
      {/* eslint-disable-next-line @next/next/no-img-element -- data URLs */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`block ${imgClassName}`}
        onLoad={recompute}
        draggable={false}
      />
      {dots.length > 0 ? (
        <ul
          className="pointer-events-none absolute inset-0 m-0 list-none p-0"
          aria-label="Screenshot pins"
        >
          {dots.map(({ leftPx, topPx, pin }, i) => (
            <li
              key={i}
              className="pointer-events-auto absolute z-20"
              style={
                {
                  left: leftPx,
                  top: topPx,
                  transform: "translate(-50%, -50%)",
                } as CSSProperties
              }
            >
              <span
                className="flex h-4 w-4 cursor-default items-center justify-center rounded-full border-2 border-white bg-amber-500 text-[0] shadow-lg ring-2 ring-amber-700/50 sm:h-5 sm:w-5"
                title={pin.message}
              >
                <span className="sr-only">
                  Pin {i + 1}: {pin.message}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PinNotesList({
  pins,
  tone = "default",
}: {
  pins: IssueScreenshotPin[];
  tone?: "default" | "inverse";
}) {
  if (pins.length === 0) return null;
  const li = tone === "inverse" ? "text-white/90" : "text-zinc-700 dark:text-zinc-300";
  const mono = tone === "inverse" ? "text-white/60" : "text-zinc-500";
  const wrap =
    tone === "inverse"
      ? "m-0 list-decimal space-y-1 pl-4 text-xs"
      : "mt-2 list-decimal space-y-1.5 border-t border-zinc-200 pt-2 pl-4 text-xs dark:border-zinc-700";
  return (
    <ol className={wrap}>
      {pins.map((pin, i) => (
        <li key={i} className={li}>
          <span className={`font-mono ${mono}`}>
            {(pin.x * 100).toFixed(0)}%, {(pin.y * 100).toFixed(0)}%
          </span>
          {" — "}
          {pin.message}
        </li>
      ))}
    </ol>
  );
}

type Props = {
  src: string;
  alt?: string;
  className?: string;
  pins?: IssueScreenshotPin[] | undefined;
};

/**
 * Thumbnail screenshot; click opens a native dialog with wheel zoom, scroll pan, and pins.
 */
export function IssueScreenshotZoom({
  src,
  alt = "Issue screenshot",
  className = "max-h-40 w-full rounded-lg border border-zinc-200 object-contain dark:border-zinc-700",
  pins,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [scale, setScale] = useState(1);

  const open = useCallback(() => {
    setScale(1);
    dialogRef.current?.showModal();
  }, []);

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onClose = () => setScale(1);
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => {
      const next = s * factor;
      return Math.min(6, Math.max(0.2, next));
    });
  }, []);

  const hasPins = Boolean(pins && pins.length > 0);

  return (
    <>
      <div>
        <button
          type="button"
          onClick={open}
          className="group relative isolate block w-full cursor-zoom-in rounded-lg text-left outline-none ring-zinc-400 focus-visible:ring-2"
          aria-label={
            hasPins
              ? "Open screenshot with pins enlarged"
              : "Open screenshot enlarged"
          }
        >
          <ScreenshotWithPins
            src={src}
            alt=""
            imgClassName={className}
            pins={pins}
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 z-0 rounded-b-lg bg-gradient-to-t from-black/55 to-transparent px-2 py-2 text-center text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100 sm:text-xs">
            {hasPins
              ? "Click to enlarge · pins on image · wheel to zoom"
              : "Click to enlarge · wheel to zoom"}
          </span>
        </button>
        {hasPins && pins ? <PinNotesList pins={pins} tone="default" /> : null}
      </div>

      <dialog
        ref={dialogRef}
        className="m-0 h-full max-h-[100dvh] w-full max-w-[100vw] border-0 bg-transparent p-0 text-zinc-100 [&::backdrop]:bg-black/75 [&::backdrop]:backdrop-blur-[1px]"
      >
        <div className="flex h-full max-h-[100dvh] flex-col bg-zinc-950/96 shadow-2xl ring-1 ring-white/10">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
            <span className="text-sm font-medium text-white/95">{alt}</span>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-white/50 sm:inline">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale(1)}
                className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-md bg-white/15 px-3 py-1 text-xs font-semibold text-white hover:bg-white/25"
              >
                Close
              </button>
            </div>
          </header>

          <div
            className="min-h-0 flex-1 cursor-grab overflow-auto overscroll-contain p-3 sm:p-6"
            onWheel={onWheel}
          >
            <div className="flex min-h-full min-w-full items-center justify-center p-4">
              <div
                className="origin-center will-change-transform"
                style={{
                  transform: `scale(${scale})`,
                  transition: "transform 80ms ease-out",
                }}
              >
                <ScreenshotWithPins
                  src={src}
                  alt={alt}
                  imgClassName="max-h-[85vh] max-w-[95vw] object-contain shadow-xl ring-1 ring-white/10"
                  pins={pins}
                />
              </div>
            </div>
          </div>

          {hasPins && pins ? (
            <div className="max-h-28 shrink-0 overflow-y-auto border-t border-white/10 px-4 py-2 text-left text-xs text-white/85">
              <p className="mb-1 font-semibold text-white/95">Pin notes</p>
              <PinNotesList pins={pins} tone="inverse" />
            </div>
          ) : null}

          <footer className="shrink-0 border-t border-white/10 px-3 py-2 text-center text-[11px] leading-snug text-white/65 sm:text-xs">
            Wheel / trackpad to zoom · drag to pan when zoomed · Close or Esc
          </footer>
        </div>
      </dialog>
    </>
  );
}
