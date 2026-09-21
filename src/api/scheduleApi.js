import api from './apiClient.js';

export async function swapSchedule({ myDate, targetDate }) {
  const response = await api.post('/schedule/swap', { myDate, targetDate });
  if (response.status !== 200 || response.data?.success !== true) {
    throw new Error('INVALID_SWAP_RESPONSE');
  }
  return response.data;
}
