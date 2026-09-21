import { logout } from '../auth/cognito.js';
export default function Header({ currentUser, notificationPending, notificationError, onNotificationChange }) {
  return (
    <header className="app-header">
      <div>
        <h1>朝礼当番カレンダー</h1>
        <p className="app-subtitle">当番確認・変更</p>
      </div>
      <div className="header-actions">
        <span className="signed-in-user">ログイン中: {currentUser?.name ?? '—'}</span>
        <button className="logout-button" type="button" onClick={logout}>ログアウト</button>
        <div className="notification-control">
          <span>メール通知</span>
          <button className="notification-toggle" type="button" role="switch" aria-checked={currentUser?.emailNotification ?? false} aria-label="メール通知"
            aria-busy={notificationPending} aria-describedby={notificationError ? 'notification-error' : undefined}
            disabled={!currentUser || notificationPending}
            onClick={() => onNotificationChange(!currentUser.emailNotification)} />
          <span>{currentUser ? (currentUser.emailNotification ? 'ON' : 'OFF') : '—'}</span>
          {notificationError && <p id="notification-error" className="notification-error" role="alert">{notificationError}</p>}
        </div>
      </div>
    </header>
  );
}
