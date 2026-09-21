import { isHoliday, isSelectableDay } from '../utils/calendarDay.js';

export default function CalendarCell({ day, selected, onSelect, disabled = false }) {
  // TODO: unassigned weekday detail is unspecified; show its name but disable selection.
  const holiday = isHoliday(day);
  const selectable = isSelectableDay(day);
  const classes = ['calendar-cell', holiday && 'calendar-cell--holiday',
    day.mine && !holiday && 'calendar-cell--mine', selected && 'calendar-cell--selected',
    day.dayOfWeek === 'SAT' && 'calendar-cell--saturday'].filter(Boolean).join(' ');
  return (
    <button type="button" className={classes} disabled={disabled || !selectable}
      aria-pressed={selected} aria-label={`${day.date} ${day.holidayName || (holiday ? '休日' : day.assignedUserName || '')}`}
      onClick={() => onSelect(day.date)}>
      <span className="cell-date"><span>{Number(day.date.slice(-2))}</span>
        {day.holidayName && <span className="cell-holiday-name">{day.holidayName}</span>}
      </span>
      {day.assignedUserName && <span className={`duty-badge${day.mine && !holiday ? ' duty-badge--mine' : ''}`}>{day.assignedUserName}</span>}
    </button>
  );
}
