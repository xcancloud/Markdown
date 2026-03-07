import { useEffect, useRef, useCallback } from 'react';

/**
 * 滚动同步 Hook：同步编辑器和预览面板的滚动位置
 */
export function useScrollSync(
  sourceRef: React.RefObject<HTMLElement | null>,
  targetRef: React.RefObject<HTMLElement | null>,
  enabled = true,
) {
  const isScrollingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleScroll = useCallback(
    (source: HTMLElement, target: HTMLElement) => {
      if (isScrollingRef.current) return;

      isScrollingRef.current = true;

      const sourceScrollRatio =
        source.scrollTop / (source.scrollHeight - source.clientHeight || 1);
      target.scrollTop =
        sourceScrollRatio * (target.scrollHeight - target.clientHeight);

      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 50);
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;

    const source = sourceRef.current;
    const target = targetRef.current;
    if (!source || !target) return;

    const onSourceScroll = () => handleScroll(source, target);

    source.addEventListener('scroll', onSourceScroll, { passive: true });

    return () => {
      source.removeEventListener('scroll', onSourceScroll);
      clearTimeout(timeoutRef.current);
    };
  }, [enabled, sourceRef, targetRef, handleScroll]);
}
