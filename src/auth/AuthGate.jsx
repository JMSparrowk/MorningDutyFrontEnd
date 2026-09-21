import { useEffect, useState } from 'react';
import { AUTH_EVENT, initializeAuth, retryLogin } from './cognito.js';

export default function AuthGate({ children }) {
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    let active = true;
    const onChange = (event) => setStatus(event.detail);
    window.addEventListener(AUTH_EVENT, onChange);
    initializeAuth().then((ready) => { if (active && ready) setStatus('ready'); })
      .catch(() => { if (active) setStatus('error'); });
    return () => { active = false; window.removeEventListener(AUTH_EVENT, onChange); };
  }, []);
  if (status === 'ready') return children;
  return <main className="calendar-layout"><div role={status === 'error' ? 'alert' : 'status'}>
    <p>{status === 'error' ? '認証できませんでした。設定を確認して、もう一度ログインしてください。' : '認証中...'}</p>
    {status === 'error' && <button type="button" className="logout-button" onClick={retryLogin}>再ログイン</button>}
  </div></main>;
}
