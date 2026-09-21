import { useState } from 'react';
import ChangeCandidateDropdown from './ChangeCandidateDropdown.jsx';

const weekdays = { SUN: '日', MON: '月', TUE: '火', WED: '水', THU: '木', FRI: '金', SAT: '土' };

export default function DetailPanel({ day, candidates, onSwap, swapPending = false, swapError = '' }) {
  const [targetDate, setTargetDate] = useState('');
  const state = !day ? 'EMPTY' : day.holiday ? 'HOLIDAY' : day.mine ? 'MY_DUTY' : 'OTHER_DUTY';
  return (
    <aside className="card detail-panel" aria-labelledby="detail-heading">
      <h2 id="detail-heading">
        <svg className="calendar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="5" width="18" height="17" rx="2" />
          <path d="M7 2v6M17 2v6M3 11h18M7 15h2M12 15h2M7 18h2" />
        </svg>
        当番変更
      </h2>
      <div className={`duty-summary duty-summary--${state}`}>
        <p>現在の担当日</p>
        <div className="duty-summary-value">
          {day ? <>
            <span>{day.date.replaceAll('-', '/')} ({weekdays[day.dayOfWeek]}{day.holiday && day.holidayName ? '・祝' : ''})</span>
            <span className="duty-badge">{state === 'HOLIDAY' ? '休日' : day.assignedUserName}</span>
          </> : '—'}
        </div>
        {state === 'HOLIDAY' && day.holidayName && <p className="holiday-description">{day.holidayName}</p>}
      </div>
      {state === 'MY_DUTY' && <div className="change-form">
        <ChangeCandidateDropdown candidates={candidates} value={targetDate} onChange={setTargetDate} disabled={swapPending} />
        <div className="detail-actions">
          {swapError && <p className="swap-error" role="alert">{swapError}</p>}
          <p className="change-note"><span aria-hidden="true">ⓘ</span><span>変更を申請すると、双方の担当者にメールで通知されます。<br />事前に相手と確認のうえ、どちらか一方が変更してください。</span></p>
          <button className="submit-change" type="button" aria-busy={swapPending}
            disabled={swapPending || !candidates.some((candidate) => candidate.date === targetDate && candidate.assignedUserId != null)}
            onClick={() => onSwap(targetDate)}>{swapPending ? '変更中...' : '変更を申請'}</button>
        </div>
      </div>}
    </aside>
  );
}
