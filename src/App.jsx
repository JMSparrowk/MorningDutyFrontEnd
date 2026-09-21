import { Route, Routes } from 'react-router-dom';
import AuthGate from './auth/AuthGate.jsx';
import CalendarPage from './pages/CalendarPage.jsx';

export default function App() {
  return <Routes><Route path="/" element={<AuthGate><CalendarPage /></AuthGate>} /></Routes>;
}
