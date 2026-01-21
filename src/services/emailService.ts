// Usage: Call sendEmail(api, formData) from inside a React component or hook
import { useToken } from '../stores/useTokenStore';
import axios from 'axios';

// Standalone sendEmail for React Native app, matching web Bearer token pattern
export const sendEmail = async (formData: FormData) => {
  // Get the token from Zustand store
  const tokenObj = useToken.getState().token;
  const token = tokenObj?.data?.token || tokenObj?.token || tokenObj;
  if (!token) {
    throw new Error('No auth token found in useToken store');
  }

  // Log FormData contents
  if (formData && typeof formData.getParts === 'function') {
    // React Native FormData (has getParts)
    const parts = formData.getParts();
    console.log('[EMAIL SERVICE] FormData parts:', parts);
  } else if (formData && typeof formData.forEach === 'function') {
    // Web FormData (has forEach)
    const entries: any[] = [];
    formData.forEach((value: any, key: string) => {
      entries.push({ key, value });
    });
    console.log('[EMAIL SERVICE] FormData entries:', entries);
  } else {
    console.log('[EMAIL SERVICE] FormData (raw):', formData);
  }

  const { apiClient } = await import('../hooks/useApi');
  const response = await apiClient.post('/sendEmail', formData, {
    headers: {
      // Do NOT set Content-Type here; let Axios/React Native handle it for FormData
      Authorization: `Bearer ${token}`,
    },
  });
  console.log(
    '[EMAIL SERVICE] /sendEmail API response:',
    response?.data || response,
  );
  return response?.data || response;
};
