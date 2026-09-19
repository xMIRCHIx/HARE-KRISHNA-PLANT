import { useEffect, useState, useRef } from 'react';

/**
 * Animated counter hook that smoothly counts numbers up or down over duration ms
 * with cubic-bezier ease-out curve per hare-krishna-bricks-design.md §4.
 */
export function useAnimatedCount(
  targetValue: number,
  duration: number = 700,
  decimals: number = 0
): { displayValue: number; formatted: string; isAnimating: boolean } {
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(true);
  const startValRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Check for prefers-reduced-motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCurrentValue(targetValue);
      setIsAnimating(false);
      return;
    }

    startValRef.current = currentValue;
    startTimeRef.current = null;
    setIsAnimating(true);

    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const nextVal =
        startValRef.current + (targetValue - startValRef.current) * easedProgress;
      setCurrentValue(nextVal);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        setCurrentValue(targetValue);
        setIsAnimating(false);
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetValue, duration]);

  const formatted =
    decimals > 0
      ? currentValue.toLocaleString('en-IN', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        })
      : Math.round(currentValue).toLocaleString('en-IN');

  return { displayValue: currentValue, formatted, isAnimating };
}
