import api from './apiClient.js';

export async function updateNotification(enabled) {
  const { data } = await api.patch('/me/notification', { enabled });
  if (typeof data?.emailNotification !== 'boolean') {
    throw new Error('INVALID_NOTIFICATION_RESPONSE');
  }
  return data;
}
