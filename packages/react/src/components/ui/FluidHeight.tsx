import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

const DEFAULT_DURATION_MS = 240;
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface FluidHeightProps {
  watchKey: React.Key;
  children: React.ReactNode;
  className?: string;
  durationMs?: number;
}

export const FluidHeight: React.FC<FluidHeightProps> = ({
  watchKey,
  children,
  className,
  durationMs = DEFAULT_DURATION_MS,
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const previousKeyRef = useRef(watchKey);
  const lastHeightRef = useRef<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [isClipped, setIsClipped] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    if (previousKeyRef.current === watchKey) {
      lastHeightRef.current = inner.getBoundingClientRect().height;
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startHeight = lastHeightRef.current ?? outer.getBoundingClientRect().height;
    const endHeight = inner.getBoundingClientRect().height;
    previousKeyRef.current = watchKey;
    lastHeightRef.current = endHeight;

    if (reduceMotion || Math.abs(startHeight - endHeight) < 1) {
      setHeight(null);
      setIsClipped(false);
      return;
    }

    setIsClipped(true);
    setHeight(startHeight);

    const frame = window.requestAnimationFrame(() => {
      outer.getBoundingClientRect();
      setHeight(endHeight);
    });
    const timeout = window.setTimeout(() => {
      setHeight(null);
      setIsClipped(false);
    }, durationMs);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [durationMs, watchKey]);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => {
      lastHeightRef.current = entry.contentRect.height;
    });
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className={cn('w-full transition-[height] ease-out', className)}
      style={{
        height: height === null ? undefined : `${height}px`,
        overflow: isClipped ? 'hidden' : undefined,
        transitionDuration: `${durationMs}ms`,
      }}
    >
      <div ref={innerRef} className="w-full">
        {children}
      </div>
    </div>
  );
};
