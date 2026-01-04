import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import clsx from 'clsx';

interface Option {
  label: string;
  value: string;
  subLabel?: string;
}

interface SearchSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export const SearchSelect: React.FC<SearchSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  disabled = false,
  className,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Foca no input de busca ao abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm(''); // Limpa a busca ao fechar
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const lowerTerm = searchTerm.toLowerCase();
    return options.filter(opt => 
      opt.label.toLowerCase().includes(lowerTerm) || 
      (opt.subLabel && opt.subLabel.toLowerCase().includes(lowerTerm))
    );
  }, [options, searchTerm]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={clsx("relative", className)} ref={containerRef}>
      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={clsx(
          "w-full bg-white dark:bg-slate-700 border rounded-lg p-2.5 flex items-center justify-between cursor-pointer transition-colors shadow-sm min-h-[42px]",
          disabled 
            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700" 
            : "border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 hover:border-primary-400 focus:ring-2 focus:ring-primary-500"
        )}
      >
        <span className={clsx("block truncate text-sm", !selectedOption && "text-slate-500 dark:text-slate-400")}>
          {selectedOption ? selectedOption.label : placeholder}
          {selectedOption?.subLabel && <span className="text-xs text-slate-400 ml-2">({selectedOption.subLabel})</span>}
        </span>
        <ChevronDown size={16} className="text-slate-400 shrink-0" />
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl max-h-60 flex flex-col animate-fade-in">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 rounded-t-lg">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-8 pr-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:border-primary-500 text-slate-800 dark:text-white"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-sm text-slate-500 dark:text-slate-400">
                Nenhuma opção encontrada
              </div>
            ) : (
              filteredOptions.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={clsx(
                    "px-3 py-2 text-sm rounded cursor-pointer transition-colors flex flex-col",
                    value === opt.value
                      ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                >
                  <span>{opt.label}</span>
                  {opt.subLabel && <span className="text-xs text-slate-400">{opt.subLabel}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Hidden input for HTML5 form validation if needed */}
      {required && (
        <input 
          type="text" 
          className="absolute opacity-0 pointer-events-none h-0 w-0 bottom-0"
          value={value}
          required
          onChange={() => {}} 
          tabIndex={-1}
        />
      )}
    </div>
  );
};