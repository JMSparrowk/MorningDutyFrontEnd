export default function CalendarCell({ day, selected, onSelect, disabled = false }) {
  // TODO: unassigned weekday detail is unspecified; show its name but disable selection.
  const selectable = day.holiday || day.mine || (day.hasSchedule && day.assignedUserId != null);
  const classes = ['calendar-cell', day.holiday && 'calendar-cell--holiday',
    day.mine && !day.holiday && 'calendar-cell--mine', selected && 'calendar-cell--selected',
    day.dayOfWeek === 'SAT' && 'calendar-cell--saturday'].filter(Boolean).join(' ');
  return (
    <button type="button" className={classes} disabled={disabled || !selectable}
      aria-pressed={selected} aria-label={`${day.date} ${day.holidayName || (day.holiday ? '休日' : day.assignedUserName || '')}`}
      onClick={() => onSelect(day.date)}>
      <span className="cell-date"><span>{Number(day.date.slice(-2))}</span>
        {day.holidayName && <span className="cell-holiday-name">{day.holidayName}</span>}
      </span>
      {day.assignedUserName && <span className={`duty-badge${day.mine && !day.holiday ? ' duty-badge--mine' : ''}`}>{day.assignedUserName}</span>}
    </button>
  );
}
