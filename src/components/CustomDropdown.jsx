import { useState, useEffect, useRef, useMemo } from 'react';
import './CustomDropdown.css';

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
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
      setFocusedIndex(-1);
      setTimeout(() => searchInputRef.current?.focus(), 10);
    }
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
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="custom-dropdown-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {label && <p className="label-sm">{label}</p>}
      <div className="custom-dropdown" ref={containerRef} onKeyDown={handleKeyDown}>
        <button
          type="button"
          className={`dropdown-trigger ${isOpen ? 'open' : ''}`}
          onClick={handleToggle}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {selectedOption?.icon && <span className="dropdown-option-icon">{selectedOption.icon}</span>}
            <span style={{ opacity: selectedOption ? 1 : 0.6 }}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.5 }}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {isOpen && (
          <div className="dropdown-menu">
            {showSearch && (
              <div className="dropdown-search-wrap">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="dropdown-search-input"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setFocusedIndex(-1); }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <div className="dropdown-options" role="listbox">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => (
                  <div
                    key={opt.value}
                    className={`dropdown-option ${opt.value === value ? 'selected' : ''} ${idx === focusedIndex ? 'focused' : ''}`}
                    onClick={() => handleSelect(opt)}
                    role="option"
                    aria-selected={opt.value === value}
                  >
                    {opt.icon && <span className="dropdown-option-icon">{opt.icon}</span>}
                    <span>{opt.label}</span>
                  </div>
                ))
              ) : (
                <div className="dropdown-no-results">No options found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomDropdown;
