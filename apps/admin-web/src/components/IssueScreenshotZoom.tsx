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
  /** When set, that pin is visually emphasized (sync with note list hover). */
  highlightedPinIndex?: number | null;
  onPinHover?: (index: number) => void;
  onPinLeave?: () => void;
};

function ScreenshotWithPins({
  src,
  alt,
  imgClassName,
  pins,
  highlightedPinIndex = null,
  onPinHover,
  onPinLeave,
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

  const pinBadgeBase =
    "flex min-h-[1.125rem] min-w-[1.125rem] cursor-default items-center justify-center rounded-full border-2 border-white bg-amber-500 text-[10px] font-bold tabular-nums leading-none text-white shadow-lg ring-2 ring-amber-700/50 outline-none focus-visible:ring-4 focus-visible:ring-amber-200 sm:min-h-[1.25rem] sm:min-w-[1.25rem] sm:text-[11px]";

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
          {dots.map(({ leftPx, topPx, pin }, i) => {
            const n = i + 1;
            const isHi = highlightedPinIndex === i;
            return (
              <li
                key={i}
                className={`pointer-events-auto absolute z-20 transition-transform duration-150 ${isHi ? "z-30 scale-125" : ""}`}
                style={
                  {
                    left: leftPx,
                    top: topPx,
                    transform: "translate(-50%, -50%)",
                  } as CSSProperties
                }
              >
                <span
                  className={`${pinBadgeBase} ${isHi ? "ring-4 ring-amber-300/90" : ""}`}
                  title={`Pin ${n}: ${pin.message}`}
                  aria-label={`Pin ${n}: ${pin.message}`}
                  onMouseEnter={() => onPinHover?.(i)}
                  onMouseLeave={() => onPinLeave?.()}
                  onFocus={() => onPinHover?.(i)}
                  onBlur={() => onPinLeave?.()}
                  tabIndex={0}
                >
                  {n}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function PinNotesList({
  pins,
  tone = "default",
  variant = "full",
  omitOuterSpacing = false,
  highlightedPinIndex = null,
  onPinHover,
  onPinLeave,
}: {
  pins: IssueScreenshotPin[];
  tone?: "default" | "inverse";
  /** `card`: compact lines on issue cards. `full`: dialog / no clamp. */
  variant?: "card" | "full";
  /** When nested inside a collapsible block, skip top border and extra margin. */
  omitOuterSpacing?: boolean;
  highlightedPinIndex?: number | null;
  onPinHover?: (index: number) => void;
  onPinLeave?: () => void;
}) {
  if (pins.length === 0) return null;
  const row = tone === "inverse" ? "text-white/90" : "text-zinc-700 dark:text-zinc-300";
  const mono = tone === "inverse" ? "text-white/60" : "text-zinc-500";
  const badge =
    tone === "inverse"
      ? "border border-white/25 bg-amber-500 text-white shadow-md ring-1 ring-amber-300/40"
      : "border border-amber-700/25 bg-amber-500 text-white shadow ring-1 ring-amber-600/30";
  const wrapDefault = omitOuterSpacing
    ? "m-0 list-none space-y-1.5 p-0 text-xs"
    : "mt-2 list-none space-y-1.5 border-t border-zinc-200 pt-2 p-0 text-xs dark:border-zinc-700";
  const wrap =
    tone === "inverse"
      ? "m-0 list-none space-y-1.5 p-0 text-xs"
      : wrapDefault;
  const msgClamp =
    variant === "card"
      ? "line-clamp-3 break-words text-left"
      : "whitespace-pre-wrap break-words text-left";
  return (
    <ol className={wrap}>
      {pins.map((pin, i) => {
        const n = i + 1;
        const isHi = highlightedPinIndex === i;
        return (
          <li key={i}>
            <button
              type="button"
              className={`flex w-full cursor-default gap-2 rounded-md py-0.5 text-left transition-colors ${row} ${isHi ? (tone === "inverse" ? "bg-white/10" : "bg-amber-50 dark:bg-amber-950/40") : tone === "inverse" ? "hover:bg-white/5" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"}`}
              title={pin.message}
              onMouseEnter={() => onPinHover?.(i)}
              onMouseLeave={() => onPinLeave?.()}
              onFocus={() => onPinHover?.(i)}
              onBlur={() => onPinLeave?.()}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums leading-none ${badge} ${isHi ? "ring-2 ring-amber-200" : ""}`}
                aria-hidden
              >
                {n}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`font-mono text-[11px] ${mono}`}>
                  {(pin.x * 100).toFixed(0)}%, {(pin.y * 100).toFixed(0)}%
                </span>
                <span
                  className={
                    tone === "inverse" ? "text-white/35" : "text-zinc-400 dark:text-zinc-500"
                  }
                >
                  {" "}
                  —{" "}
                </span>
                <span className={msgClamp}>{pin.message}</span>
              </span>
            </button>
          </li>
        );
      })}
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
  const [highlightedPinIndex, setHighlightedPinIndex] = useState<number | null>(
    null
  );

  const open = useCallback(() => {
    setScale(1);
    setHighlightedPinIndex(null);
    dialogRef.current?.showModal();
  }, []);

  const close = useCallback(() => {
    setHighlightedPinIndex(null);
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
  const pinCount = pins?.length ?? 0;
  const [cardPinsExpanded, setCardPinsExpanded] = useState(() => pinCount <= 2);

  useEffect(() => {
    setCardPinsExpanded(pinCount <= 2);
  }, [pinCount]);

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
            highlightedPinIndex={highlightedPinIndex}
            onPinHover={setHighlightedPinIndex}
            onPinLeave={() => setHighlightedPinIndex(null)}
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 z-0 rounded-b-lg bg-gradient-to-t from-black/55 to-transparent px-2 py-2 text-center text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100 sm:text-xs">
            {hasPins
              ? "Tam ekran: tüm pin notları ve yakınlaştırma (tekerlek)"
              : "Büyütmek için tıklayın · tekerlek ile yakınlaştırma"}
          </span>
        </button>
        {hasPins && pins ? (
          pins.length >= 2 ? (
            <details
              className="group mt-2 rounded-lg border border-zinc-200 bg-zinc-50/70 open:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/55 dark:open:bg-zinc-900/75"
              open={cardPinsExpanded}
              onToggle={(e) => {
                setCardPinsExpanded((e.target as HTMLDetailsElement).open);
              }}
            >
              <summary className="flex cursor-pointer list-none flex-col gap-1 px-2 py-2 text-xs font-medium text-zinc-700 marker:content-none [&::-webkit-details-marker]:hidden dark:text-zinc-200">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <span className="shrink-0">Pins ({pins.length})</span>
                  <span className="min-w-0 text-right text-[11px] font-normal leading-snug text-zinc-500 dark:text-zinc-400">
                    <span className="group-open:hidden">Listeyi aç</span>
                    <span className="hidden group-open:inline">Daralt</span>
                  </span>
                </div>
                <p className="break-words text-[11px] font-normal leading-snug text-zinc-500 dark:text-zinc-400">
                  Görsele tıklayınca tam ekran + tüm notlar ve yakınlaştırma
                </p>
              </summary>
              <div className="max-h-44 overflow-y-auto border-t border-zinc-200 px-2 py-2 dark:border-zinc-700">
                <PinNotesList
                  pins={pins}
                  tone="default"
                  variant="card"
                  omitOuterSpacing
                  highlightedPinIndex={highlightedPinIndex}
                  onPinHover={setHighlightedPinIndex}
                  onPinLeave={() => setHighlightedPinIndex(null)}
                />
              </div>
            </details>
          ) : (
            <div className="max-h-40 overflow-y-auto">
              <PinNotesList
                pins={pins}
                tone="default"
                variant="card"
                highlightedPinIndex={highlightedPinIndex}
                onPinHover={setHighlightedPinIndex}
                onPinLeave={() => setHighlightedPinIndex(null)}
              />
            </div>
          )
        ) : null}
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
                  highlightedPinIndex={highlightedPinIndex}
                  onPinHover={setHighlightedPinIndex}
                  onPinLeave={() => setHighlightedPinIndex(null)}
                />
              </div>
            </div>
          </div>

          {hasPins && pins ? (
            <div className="max-h-[min(42vh,22rem)] shrink-0 overflow-y-auto border-t border-white/10 px-4 py-2 text-left text-xs text-white/85">
              <p className="mb-1 font-semibold text-white/95">
                Pin notes{" "}
                <span className="font-normal text-white/55">
                  (same numbers as on the image · full text, scroll if needed)
                </span>
              </p>
              <PinNotesList
                pins={pins}
                tone="inverse"
                variant="full"
                highlightedPinIndex={highlightedPinIndex}
                onPinHover={setHighlightedPinIndex}
                onPinLeave={() => setHighlightedPinIndex(null)}
              />
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
