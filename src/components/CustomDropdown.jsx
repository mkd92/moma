import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

const CustomDropdown = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label = "",
  showSearch = true,
  searchPlaceholder = "Search..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState({});
  const triggerRef = useRef(null);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const filteredOptions = useMemo(() => {
    return options.filter(opt =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const selectedOption = useMemo(() => {
    return options.find(opt => opt.value === value);
  }, [options, value]);

  const handleToggle = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const menuW = Math.max(rect.width, 240);
      const left = rect.left + menuW > vw - 16 ? Math.max(16, vw - menuW - 16) : rect.left;
      const spaceBelow = window.innerHeight - rect.bottom - 16;
      const maxH = 320;
      const top = spaceBelow < maxH && rect.top > maxH
        ? rect.top - maxH - 8
        : rect.bottom + 8;
      
      setMenuStyle({
        position: 'fixed',
        top,
        left,
        width: menuW,
        zIndex: 9999,
      });
      setSearchTerm('');
      setFocusedIndex(-1);
      setTimeout(() => searchInputRef.current?.focus(), 10);
    }
    setIsOpen(prev => !prev);
  };

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const optionRefs = useRef([]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) { handleToggle(); return; }
      setFocusedIndex(prev => {
        const next = prev < filteredOptions.length - 1 ? prev + 1 : prev;
        optionRefs.current[next]?.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => {
        const next = prev > 0 ? prev - 1 : prev;
        optionRefs.current[next]?.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[focusedIndex]);
      } else if (!isOpen) {
        handleToggle();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const menu = isOpen ? (
    <div 
      className="bg-surface-low rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" 
      style={menuStyle} 
      ref={containerRef}
    >
      {showSearch && (
        <div className="p-2 border-b border-outline-variant">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input
              ref={searchInputRef}
              type="text"
              className="w-full bg-surface-lowest border border-outline-variant rounded-lg py-2 pl-9 pr-3 text-xs text-on-surface focus:ring-1 focus:ring-primary/30 placeholder:text-on-surface-variant/40 outline-none"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setFocusedIndex(-1); }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>
      )}
      <div className="max-h-[240px] overflow-y-auto py-1 custom-scrollbar" role="listbox">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((opt, idx) => (
            <div
              key={opt.value}
              ref={el => optionRefs.current[idx] = el}
              className={`px-4 py-3 text-xs flex items-center gap-3 cursor-pointer transition-colors ${opt.indent ? 'pl-10' : ''} ${opt.value === value ? 'bg-primary-fixed text-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'} ${idx === focusedIndex ? 'bg-surface-container text-on-surface' : ''}`}
              onClick={() => handleSelect(opt)}
              role="option"
              aria-selected={opt.value === value}
            >
              {opt.icon && (
                <span className={`material-symbols-outlined text-sm ${opt.value === value ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {opt.icon}
                </span>
              )}
              <span className="font-bold tracking-wide uppercase text-[10px]">{opt.label}</span>
              {opt.value === value && (
                <span className="material-symbols-outlined text-xs ml-auto">check</span>
              )}
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">No matching units</div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="flex flex-col gap-2" onKeyDown={handleKeyDown}>
      {label && <p className="text-sm font-semibold text-on-surface-variant ml-1">{label}</p>}
      <button
        ref={triggerRef}
        type="button"
        className={`w-full bg-surface-low flex items-center justify-between px-5 py-4 rounded-2xl transition-all ${isOpen ? 'ring-2 ring-primary/20 bg-surface-lowest' : 'hover:bg-surface-container'}`}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {selectedOption?.icon && (
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              {selectedOption.icon}
            </span>
          )}
          <span className={`text-[11px] font-black uppercase tracking-widest ${selectedOption ? 'text-on-surface' : 'text-on-surface-variant/40'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>
      {createPortal(menu, document.body)}
    </div>
  );
};

export default CustomDropdown;
