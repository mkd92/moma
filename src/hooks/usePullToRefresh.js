import { useState, useEffect, useRef } from 'react';

// Pull-to-refresh hook (uses native listeners to allow preventDefault on touchmove)
export const usePullToRefresh = (onRefresh) => {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef(null);
  const state = useRef({ startY: null, pullY: 0, active: false });
  const THRESHOLD = 72;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onTouchStart = (e) => {
      if (el.scrollTop === 0) {
        state.current.startY = e.touches[0].clientY;
        state.current.active = true;
      }
    };
    const onTouchMove = (e) => {
      if (!state.current.active) return;
      const dy = e.touches[0].clientY - state.current.startY;
      if (dy > 0 && el.scrollTop === 0) {
        e.preventDefault();
        const clamped = Math.min(dy * 0.5, THRESHOLD + 20);
        state.current.pullY = clamped;
        setPullY(clamped);
      } else if (dy <= 0) {
        state.current.active = false;
        state.current.pullY = 0;
        setPullY(0);
      }
    };
    const onTouchEnd = async () => {
      if (!state.current.active) return;
      state.current.active = false;
      const pulled = state.current.pullY;
      state.current.pullY = 0;
      setPullY(0);
      if (pulled >= THRESHOLD) {
        setRefreshing(true);
        try { await onRefresh(); } finally { setRefreshing(false); }
      }
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh]);

  return { containerRef, pullY, refreshing };
};
