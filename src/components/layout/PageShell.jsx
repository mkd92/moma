import React, { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { SUB_VIEWS } from '../../constants';

const PageShell = ({ children, view, onRefresh, isLoading }) => {
  const navigate = useNavigate();
  const { containerRef, pullY, refreshing } = usePullToRefresh(onRefresh || (() => Promise.resolve()));

  // Swipe-back: right-edge swipe on sub-views
  const canGoBack = SUB_VIEWS.has(view);
  const swipe = useRef({ startX: 0, startY: 0 });
  const handleSwipeTouchStart = useCallback((e) => {
    swipe.current.startX = e.touches[0].clientX;
    swipe.current.startY = e.touches[0].clientY;
  }, []);
  const handleSwipeTouchEnd = useCallback((e) => {
    if (!canGoBack) return;
    const dx = e.changedTouches[0].clientX - swipe.current.startX;
    const dy = Math.abs(e.changedTouches[0].clientY - swipe.current.startY);
    if (dx > 80 && dy < 80 && swipe.current.startX < 60) navigate(-1);
  }, [canGoBack, navigate]);

  return (
    <div
      className="flex-1 w-full h-full flex flex-col relative"
      onTouchStart={handleSwipeTouchStart}
      onTouchEnd={handleSwipeTouchEnd}
      ref={containerRef}
    >
      {(pullY > 0 || refreshing) && (
        <div className="ptr-indicator" style={{ height: refreshing ? 48 : pullY }}>
          <div
            className={`ptr-spinner${refreshing ? '' : ' ptr-spinner-static'}`}
            style={!refreshing ? { transform: `rotate(${(pullY / 72) * 360}deg)` } : {}}
          />
        </div>
      )}
      
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-primary/5 z-[70] overflow-hidden">
          <div className="h-full bg-primary animate-progress-fast w-1/3"></div>
        </div>
      )}
      
      <main className="flex-1 w-full relative">
        {children}
      </main>
    </div>
  );
};

export default PageShell;
