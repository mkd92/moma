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

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[focusedIndex]);
      } else if (!isOpen) {
        handleToggle();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
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
      className="bg-[#1a1a1a] rounded-2xl border border-outline-variant/20 shadow-[0_24px_48px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in zoom-in-95 duration-200" 
      style={menuStyle} 
      ref={containerRef}
    >
      {showSearch && (
        <div className="p-2 border-b border-outline-variant/10">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">search</span>
            <input
              ref={searchInputRef}
              type="text"
              className="w-full bg-[#0e0e0e] border-none rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:ring-1 focus:ring-[#3fff8b]/30 placeholder:text-zinc-700"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setFocusedIndex(-1); }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
      <div className="max-h-[240px] overflow-y-auto py-1 custom-scrollbar" role="listbox">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((opt, idx) => (
            <div
              key={opt.value}
              className={`px-4 py-3 text-xs flex items-center gap-3 cursor-pointer transition-colors ${opt.indent ? 'pl-10' : ''} ${opt.value === value ? 'bg-[#3fff8b]/10 text-[#3fff8b]' : 'text-zinc-400 hover:bg-[#262626] hover:text-white'} ${idx === focusedIndex ? 'bg-[#262626]' : ''}`}
              onClick={() => handleSelect(opt)}
              role="option"
              aria-selected={opt.value === value}
            >
              {opt.icon && (
                <span className={`material-symbols-outlined text-sm ${opt.value === value ? 'text-[#3fff8b]' : 'text-zinc-500'}`}>
                  {opt.icon}
                </span>
              )}
              <span className="font-bold tracking-wide">{opt.label}</span>
              {opt.value === value && (
                <span className="material-symbols-outlined text-xs ml-auto">check</span>
              )}
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest">No results found</div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="flex flex-col gap-2" onKeyDown={handleKeyDown}>
      {label && <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">{label}</p>}
      <button
        ref={triggerRef}
        type="button"
        className={`w-full bg-[#1a1a1a] flex items-center justify-between px-4 py-4 rounded-xl transition-all border border-transparent ${isOpen ? 'ring-2 ring-[#3fff8b]/30 bg-[#262626]' : 'hover:bg-[#262626]'}`}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {selectedOption?.icon && (
            <span className="material-symbols-outlined text-[#3fff8b] text-xl">
              {selectedOption.icon}
            </span>
          )}
          <span className={`text-sm font-bold tracking-wide ${selectedOption ? 'text-white' : 'text-zinc-600'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <span className={`material-symbols-outlined text-zinc-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>
      {createPortal(menu, document.body)}
    </div>
  );
};

export default CustomDropdown;
