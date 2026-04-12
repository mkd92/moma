import React, { useState, useEffect } from 'react';

const ScrollIndicator = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // We listen to the .scrollable-area specifically because PageShell uses it
    const handleScroll = () => {
      const scrollArea = document.querySelector('.scrollable-area');
      if (!scrollArea) return;

      const totalHeight = scrollArea.scrollHeight - scrollArea.clientHeight;
      if (totalHeight > 0) {
        const progress = (scrollArea.scrollTop / totalHeight) * 100;
        setScrollProgress(progress);
        setIsVisible(scrollArea.scrollTop > 50);
      } else {
        setIsVisible(false);
      }
    };

    // Need a small timeout to ensure the DOM is ready after view transitions
    const timer = setInterval(handleScroll, 100);
    
    // Also listen to actual scroll events for smoothness
    const scrollArea = document.querySelector('.scrollable-area');
    if (scrollArea) {
      scrollArea.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      clearInterval(timer);
      if (scrollArea) {
        scrollArea.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[60] pointer-events-none">
      {/* Progress Ring / Visual Indicator */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        {/* Track circle */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="var(--primary-light)"
            strokeWidth="2.5"
            className="opacity-20"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeDasharray="125.6"
            strokeDashoffset={125.6 - (125.6 * scrollProgress) / 100}
            strokeLinecap="round"
            className="transition-all duration-200"
          />
        </svg>
        
        {/* Center Icon */}
        <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center">
          <span className="material-symbols-outlined text-[16px] text-primary animate-bounce">
            arrow_downward
          </span>
        </div>
      </div>
    </div>
  );
};

export default ScrollIndicator;
