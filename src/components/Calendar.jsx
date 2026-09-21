import CalendarCell from './CalendarCell.jsx';

const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

const weekdayCodes = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function Calendar({ calendar, selectedDate, onSelectDay, onChangeMonth, loading = false, error = '', onRetry, interactionDisabled = false }) {
  const { year, month, days, navigation } = calendar;
  const leading = Math.max(0, weekdayCodes.indexOf(days[0]?.dayOfWeek));
  const trailing = (7 - (leading + days.length) % 7) % 7;
  return (
    <section className="card calendar-card" aria-label="当番カレンダー" aria-busy={loading}>
      <div className="calendar-toolbar">
        <button className="month-button" type="button" disabled={interactionDisabled || !navigation.previousMonthAvailable} onClick={() => onChangeMonth(-1)}><span aria-hidden="true">‹</span>前の月</button>
        <h2>{year}年{month}月</h2>
        <button className="month-button" type="button" disabled={interactionDisabled || !navigation.nextMonthAvailable} onClick={() => onChangeMonth(1)}>次の月<span aria-hidden="true">›</span></button>
      </div>
      <div className="calendar-frame">
        <div className="calendar-weekdays">
          {weekdays.map((day) => <span key={day}>{day}</span>)}
        </div>
        {(loading || error || !days.length) && <div className="calendar-status" role={error ? 'alert' : 'status'}>
          <p>{loading ? '読み込み中…' : error || 'カレンダーのデータがありません。'}</p>
          {error && <button type="button" className="month-button" onClick={onRetry}>再読み込み</button>}
        </div>}
        <div className="calendar-grid">
          {/* TODO: API has no adjacent-month dates; use blank layout cells until specified. */}
          {Array.from({ length: leading }, (_, index) => <div key={`before-${index}`} className="calendar-padding" aria-hidden="true" />)}
          {days.map((day) => <CalendarCell key={day.date} day={day} disabled={interactionDisabled} selected={selectedDate === day.date} onSelect={onSelectDay} />)}
          {Array.from({ length: trailing }, (_, index) => <div key={`after-${index}`} className="calendar-padding" aria-hidden="true" />)}
        </div>
      </div>
      <div className="calendar-footer">
        <ul className="calendar-legend" aria-label="凡例">
          <li><span className="legend-swatch legend-swatch--mine" />自分の担当日 (変更可能)</li>
          <li><span className="legend-swatch legend-swatch--other" />他メンバーの担当日 (変更不可)</li>
          <li><span className="legend-swatch legend-swatch--holiday" />休日</li>
        </ul>
        <p className="calendar-note"><span aria-hidden="true">ⓘ</span>自分の担当日のみ変更可能です。</p>
      </div>
    </section>
  );
}
