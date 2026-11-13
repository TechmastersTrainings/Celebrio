import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

export interface SearchableOption {
  id: number;
  name: string;
  hint?: string;
}

interface SearchableSelectProps {
  label: string;
  placeholder?: string;
  options: SearchableOption[];
  value: number | null | undefined;
  onChange: (option: SearchableOption | null) => void;
  disabled?: boolean;
  loading?: boolean;
  allowClear?: boolean;
  emptyText?: string;
  /** When set, the user may also keep a typed value that is not in the list. */
  freeText?: string;
  onFreeText?: (text: string) => void;
}

/**
 * Lightweight accessible combobox: type to filter (case-insensitive, prefix first),
 * arrow keys to move, Enter to pick, Escape to close.
 */
export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  placeholder = 'Type to search…',
  options,
  value,
  onChange,
  disabled,
  loading,
  allowClear = false,
  emptyText = 'No matches',
  freeText = '',
  onFreeText,
}) => {
  const uid = useId();
  const listId = `${uid}-list`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [active, setActive] = useState(0);

  const selected = options.find((o) => o.id === value) || null;

  useEffect(() => {
    if (!open) setText(selected ? selected.name : freeText);
  }, [selected?.id, selected?.name, open, freeText]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      // composedPath() is captured at dispatch time, so clicks on elements that a re-render
      // removes (e.g. a scope chip that disappears once clicked) still count as "inside".
      if (wrapRef.current && !e.composedPath().includes(wrapRef.current)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!open || !q || (selected && q === selected.name.toLowerCase())) return options;
    const starts = options.filter((o) => o.name.toLowerCase().startsWith(q));
    const contains = options.filter((o) => !o.name.toLowerCase().startsWith(q) && o.name.toLowerCase().includes(q));
    return [...starts, ...contains];
  }, [options, text, open, selected]);

  useEffect(() => setActive(0), [text]);

  const typed = text.trim();
  const canUseTyped =
    Boolean(onFreeText) && open && typed !== '' && !options.some((o) => o.name.toLowerCase() === typed.toLowerCase());
  const useTyped = () => {
    onFreeText?.(typed);
    setOpen(false);
  };

  const pick = (o: SearchableOption | null) => {
    onChange(o);
    setText(o ? o.name : '');
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, filtered.length - (canUseTyped ? 0 : 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && filtered[active]) {
        e.preventDefault();
        pick(filtered[active]);
      } else if (canUseTyped) {
        e.preventDefault();
        useTyped();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="vs-field" ref={wrapRef}>
      <label className="vs-label" htmlFor={`${uid}-input`}>{label}</label>
      <div className={`vs-select ${disabled ? 'is-disabled' : ''}`}>
        <input
          id={`${uid}-input`}
          className="form-control vs-input"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[active] ? `${uid}-opt-${filtered[active].id}` : undefined}
          autoComplete="off"
          placeholder={loading ? 'Loading…' : placeholder}
          value={text}
          disabled={disabled}
          onFocus={(e) => {
            setOpen(true);
            e.currentTarget.select();
          }}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
        {allowClear && selected && !disabled ? (
          <button type="button" className="vs-select-icon" aria-label={`Clear ${label}`} onClick={() => pick(null)}>
            <X size={14} />
          </button>
        ) : (
          <ChevronDown size={14} className="vs-select-icon is-static" aria-hidden />
        )}
      </div>
      {open && !disabled && (
        <ul className="vs-menu vs-menu-compact" role="listbox" id={listId}>
          {filtered.length === 0 && !canUseTyped && <li className="vs-menu-empty">{loading ? 'Loading…' : emptyText}</li>}
          {filtered.map((o, i) => (
            <li
              key={o.id}
              id={`${uid}-opt-${o.id}`}
              role="option"
              aria-selected={o.id === value}
              className={`vs-option-compact ${i === active ? 'is-active' : ''} ${o.id === value ? 'is-selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(o);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <span>{o.name}</span>
              {o.hint && <span className="vs-option-hint">{o.hint}</span>}
            </li>
          ))}
          {canUseTyped && (
            <li
              role="option"
              aria-selected={false}
              className={`vs-option-compact ${active === filtered.length ? 'is-active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                useTyped();
              }}
              onMouseEnter={() => setActive(filtered.length)}
            >
              <span>Use “{typed}”</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
