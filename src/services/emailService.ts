// Usage: Call sendEmail(api, formData) from inside a React component or hook
import { useToken } from '../stores/useTokenStore';
import axios from 'axios';

// Standalone sendEmail for React Native app, matching web Bearer token pattern
export const sendEmail = async (formData: FormData) => {
  const { apiClient } = await import('../hooks/useApi');
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

  console.log("Token used for /sendEmail:", token);
  const response = await axios.post(
    'https://api.dmail.earth/sendEmail',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
    },
  );

  console.log(
    '[EMAIL SERVICE] /sendEmail API response:',
    response?.data || response,
  );
  return response?.data || response;
};