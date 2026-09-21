import api from './apiClient.js';

export async function getCalendar({ year, month, signal }) {
  const { data } = await api.get('/calendar', { params: { year, month }, signal });
  // Catch a wrong base URL returning HTML, or an incompatible API response.
  if (data?.year !== year || data?.month !== month || !data.currentUser
    || typeof data.currentUser.name !== 'string'
    || typeof data.currentUser.emailNotification !== 'boolean'
    || typeof data.navigation?.previousMonthAvailable !== 'boolean'
    || typeof data.navigation?.nextMonthAvailable !== 'boolean'
    || !Array.isArray(data.days) || !Array.isArray(data.changeCandidates)) {
    throw new Error('INVALID_CALENDAR_RESPONSE');
  }
  return data;
}
