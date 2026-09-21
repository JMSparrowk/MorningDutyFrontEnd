// DB holiday marks public holidays; weekends are also days off in the UI.
export function isHoliday(day) {
  return Boolean(day && (day.holiday || day.dayOfWeek === 'SAT' || day.dayOfWeek === 'SUN'));
}

export function isSelectableDay(day) {
  return Boolean(day && (isHoliday(day) || day.mine || (day.hasSchedule && day.assignedUserId != null)));
}

export function isChangeCandidate(day) {
  return day.assignedUserId != null && !isHoliday(day);
}
