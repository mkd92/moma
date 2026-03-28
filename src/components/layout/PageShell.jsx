import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import BottomNav from './BottomNav';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { SUB_VIEWS } from '../../constants';

const PageShell = ({ children, view, onDashboard, onLedger, onAnalytics, onBudgets, onNewTx, onSettings, onLogout, session, onRefresh, theme, onToggleTheme }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
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
      className="app-shell"
      onTouchStart={handleSwipeTouchStart}
      onTouchEnd={handleSwipeTouchEnd}
    >
      <Sidebar 
        view={view} 
        onDashboard={onDashboard} 
        onLedger={onLedger} 
        onAnalytics={onAnalytics} 
        onBudgets={onBudgets} 
        onNewTx={onNewTx} 
        onSettings={onSettings} 
        onLogout={onLogout}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <div className={`page-content transition-all duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-64'}`} ref={containerRef}>
        {(pullY > 0 || refreshing) && (
          <div className="ptr-indicator" style={{ height: refreshing ? 48 : pullY }}>
            <div
              className={`ptr-spinner${refreshing ? '' : ' ptr-spinner-static'}`}
              style={!refreshing ? { transform: `rotate(${(pullY / 72) * 360}deg)` } : {}}
            />
          </div>
        )}
        <TopHeader session={session} theme={theme} onToggleTheme={onToggleTheme} collapsed={collapsed} />
        <main className="flex-1 w-full relative">
          {children}
        </main>
      </div>
      <BottomNav view={view} onDashboard={onDashboard} onLedger={onLedger} onAnalytics={onAnalytics} onSettings={onSettings} onNewTx={onNewTx} />
    </div>
  );
};

export default PageShell;
