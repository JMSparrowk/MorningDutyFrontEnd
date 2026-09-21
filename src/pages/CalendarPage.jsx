import { useEffect, useRef, useState } from 'react';
import { getCalendar } from '../api/calendarApi.js';
import { updateNotification } from '../api/notificationApi.js';
import { swapSchedule } from '../api/scheduleApi.js';
import Header from '../components/Header.jsx';
import Calendar from '../components/Calendar.jsx';
import DetailPanel from '../components/DetailPanel.jsx';

function tokyoToday() {
  // Match the backend's Asia/Tokyo calendar month; do not generate day records.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year').value;
  const month = parts.find((part) => part.type === 'month').value;
  const day = parts.find((part) => part.type === 'day').value;
  return {
    date: `${year}-${month}-${day}`,
    year: Number(year),
    month: Number(month),
  };
}

function errorMessage(error) {
  if (error.message === 'API_BASE_URL_MISSING') return 'カレンダーの接続先が設定されていません。';
  if (error.message === 'INVALID_CALENDAR_RESPONSE') return 'カレンダーの応答を読み取れませんでした。';
  if (error.response?.status === 401) return 'カレンダーの表示には認証が必要です。';
  if (error.response?.status === 403) return 'カレンダーを表示する権限がありません。';
  return 'カレンダーを取得できませんでした。再度お試しください。';
}

export default function CalendarPage() {
  const [period, setPeriod] = useState(() => { const { year, month } = tokyoToday(); return { year, month }; });
  const [result, setResult] = useState({ data: null, loading: true, error: '' });
  const [selectedDate, setSelectedDate] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const [notificationPending, setNotificationPending] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const notificationRequest = useRef(null);
  const mounted = useRef(false);
  const swapRequest = useRef(false);
  const [swapPending, setSwapPending] = useState(false);
  const [swapError, setSwapError] = useState('');

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function changeNotification(enabled) {
    if (!result.data?.currentUser || notificationRequest.current || swapRequest.current) return;
    setNotificationPending(true);
    setNotificationError('');
    const request = updateNotification(enabled);
    notificationRequest.current = request;
    try {
      const response = await request;
      if (!mounted.current) return;
      setResult((previous) => previous.data ? {
        ...previous,
        data: { ...previous.data, currentUser: {
          ...previous.data.currentUser, emailNotification: response.emailNotification,
        } },
      } : previous);
    } catch {
      if (mounted.current) setNotificationError('メール通知の更新に失敗しました。');
    } finally {
      notificationRequest.current = null;
      if (mounted.current) setNotificationPending(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    setResult({ data: null, loading: true, error: '' });
    setSelectedDate(null);
    setSwapError('');
    // A month change during PATCH must read the setting after the write settles.
    const pendingNotification = notificationRequest.current;
    Promise.resolve(pendingNotification).catch(() => {}).then(() => {
      if (controller.signal.aborted) return null;
      return getCalendar({ ...period, signal: controller.signal });
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult({ data, loading: false, error: '' });
          const today = tokyoToday();
          const day = data.days.find((item) => item.date === today.date);
          const selectable = day && (day.mine || day.holiday || day.hasSchedule);
          setSelectedDate(data.year === today.year && data.month === today.month && selectable ? today.date : null);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setResult({ data: null, loading: false, error: errorMessage(error) });
      });
    return () => controller.abort();
  }, [period, attempt]);

  const calendar = result.data || {
    ...period, days: [], changeCandidates: [],
    navigation: { previousMonthAvailable: false, nextMonthAvailable: false },
  };
  const selectedDay = calendar.days.find((day) => day.date === selectedDate);

  async function changeSchedule(targetDate) {
    if (swapRequest.current || result.loading || !selectedDay?.mine || selectedDay.holiday
      || !calendar.changeCandidates.some((candidate) => candidate.date === targetDate && candidate.assignedUserId != null)) return;
    swapRequest.current = true;
    setSwapPending(true);
    setSwapError('');
    try {
      await swapSchedule({ myDate: selectedDay.date, targetDate });
      if (!mounted.current) return;
      // Never swap local day records. Clear the old view and use the normal GET path.
      // Navigation is locked during POST, so period is still the displayed year/month.
      setResult({ data: null, loading: true, error: '' });
      setSelectedDate(null);
      setAttempt((value) => value + 1);
    } catch (error) {
      if (mounted.current) setSwapError(error.response?.status === 409
        ? '予定が変更されています。再読み込みして確認してください。'
        : '当番を変更できませんでした。もう一度お試しください。');
    } finally {
      swapRequest.current = false;
      if (mounted.current) setSwapPending(false);
    }
  }

  function changeMonth(direction) {
    const allowed = direction === -1
      ? calendar.navigation.previousMonthAvailable : calendar.navigation.nextMonthAvailable;
    if (result.loading || swapRequest.current || !allowed) return;
    const monthIndex = calendar.year * 12 + calendar.month - 1 + direction;
    setResult({ data: null, loading: true, error: '' });
    setPeriod({ year: Math.floor(monthIndex / 12), month: monthIndex % 12 + 1 });
  }

  return (
    <>
      <Header currentUser={result.data?.currentUser} notificationPending={notificationPending || swapPending}
        notificationError={notificationError} onNotificationChange={changeNotification} />
      <main className="calendar-layout">
        <Calendar calendar={calendar} selectedDate={selectedDate} onSelectDay={(date) => { if (!swapRequest.current) { setSelectedDate(date); setSwapError(''); } }}
          onChangeMonth={changeMonth} interactionDisabled={swapPending} loading={result.loading} error={result.error}
          onRetry={() => setAttempt((value) => value + 1)} />
        <DetailPanel key={`${period.year}-${period.month}-${selectedDate}-${attempt}`}
          day={selectedDay} candidates={calendar.changeCandidates}
          onSwap={changeSchedule} swapPending={swapPending} swapError={swapError} />
      </main>
    </>
  );
}
