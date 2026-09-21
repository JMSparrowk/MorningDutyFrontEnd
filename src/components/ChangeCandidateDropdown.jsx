import { isChangeCandidate } from '../utils/calendarDay.js';
import { useEffect, useId, useRef, useState } from 'react';

const weekdays = { SUN: '日', MON: '月', TUE: '火', WED: '水', THU: '木', FRI: '金', SAT: '土' };
const label = (item) => `${item.date.slice(5, 7)}月${item.date.slice(8)}日 (${weekdays[item.dayOfWeek]}) - ${item.assignedUserName}`;

export default function ChangeCandidateDropdown({ candidates, value, onChange, disabled = false }) {
  const items = candidates.filter(isChangeCandidate);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const trigger = useRef(null);
  const options = useRef([]);
  const id = useId();
  const selected = items.find((item) => item.date === value);

  useEffect(() => {
    if (!open) return;
    function closeOutside(event) {
      if (!root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const option = options.current[active];
    const list = option?.parentElement;
    if (!list) return;
    // Scroll only the list, never the panel or the document.
    const top = option.offsetTop - list.offsetTop;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (top + option.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = top + option.offsetHeight - list.clientHeight;
    }
  }, [open, active]);

  function select(index) {
    if (items[index]) onChange(items[index].date);
    setOpen(false);
    trigger.current?.focus();
  }

  function handleKey(event) {
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return; }
    if (event.key === 'Tab') { setOpen(false); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      if (!open) setActive(Math.max(0, items.findIndex((item) => item.date === value)));
      else setActive((index) => event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
        : Math.max(0, Math.min(items.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1))));
    }
    if (open && ['Enter', ' '].includes(event.key)) { event.preventDefault(); select(active); }
  }

  return (
    <div className="candidate-dropdown" ref={root} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <label id={`${id}-label`} htmlFor={`${id}-trigger`}>変更先の日付</label>
      <button id={`${id}-trigger`} ref={trigger} type="button" role="combobox"
        aria-labelledby={`${id}-label`} aria-controls={`${id}-list`} aria-expanded={open}
        aria-haspopup="listbox" aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        className={`candidate-trigger${open ? ' candidate-trigger--open' : ''}`} disabled={disabled || !items.length}
        onKeyDown={handleKey} onClick={() => { setActive(Math.max(0, items.findIndex((item) => item.date === value))); setOpen(!open); }}>
        <span className={selected ? '' : 'candidate-placeholder'}>{selected ? label(selected) : '日付を選択してください'}</span>
        <span aria-hidden="true">{open ? '⌃' : '⌄'}</span>
      </button>
      {open && <ul id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} className="candidate-list">
        {items.map((item, index) => <li key={item.date} id={`${id}-option-${index}`}
          ref={(element) => { options.current[index] = element; }} role="option" aria-selected={value === item.date}
          className={`candidate-option${index === active ? ' candidate-option--active' : ''}`}
          onPointerDown={(event) => event.preventDefault()} onClick={() => select(index)}>
          {label(item)}
        </li>)}
      </ul>}
    </div>
  );
}
