import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import CryptoJS from 'crypto-js';
import { useEffect, useRef } from 'react';
import { useToken } from '../stores/useTokenStore';
import { useAuthStore } from '../stores/useAuthStore';


export const apiClient = axios.create({
	//baseURL: 'https://dev-api.bmail.earth', // 🔁 Replace with your backend base URL
	baseURL: 'https://api.dmail.earth/', // 🔁 Replace with your backend base URL
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: 15000,
});

// Helper function to generate HMAC token for x-api-token header
export const generateOpenApiToken = (data: string, secret: string): string => {
	return CryptoJS.HmacSHA256(data, secret).toString();
};

// Add request interceptor for token



// apiClient.interceptors.request.use(
//   async config => {
//     try {
//       // const token = await AsyncStorage.getItem('token');
// const token = useToken.getState().token;
//       console.log('TOken',token);

//       console.log(token);

//       const parseToken = JSON.parse(token);

//       // 🔁 Use your actual key
//       if (token) {
//         config.headers.Authorization = `Bearer ${parseToken?.data?.token}`;
//       }
//     } catch (err) {
//       console.warn('Error getting token from storage', err);
//     }
//     return config;
//   },
//   error => {
//     return Promise.reject(error);
//   },
// );

export function useApiClient() {
	const controllerRef = useRef<AbortController | null>(null);

	useEffect(() => {
		return () => {
			if (controllerRef.current) {
				controllerRef.current.abort();
			}
		};
	}, []);

	const api = async <T = any>(
		method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
		url: string,
		data?: any,
		config?: AxiosRequestConfig,
	): Promise<AxiosResponse<T>> => {
		const token = useToken.getState().token;
		console.log("API Request data:", data);
		console.log("Current token:", token);

		// Resolve the final request URL for precise logging (helps debug 404s)
		let resolvedUrl = '';
		try {
			// Support both '/path' and 'path' while respecting baseURL
			const base = apiClient.defaults?.baseURL || '';
			resolvedUrl = new URL(url, base).toString();
		} catch (e) {
			resolvedUrl = `${apiClient.defaults?.baseURL || ''}${url}`;
		}
		console.log('🔗 API resolved URL:', resolvedUrl);

		controllerRef.current = new AbortController();

		try {
			// Prepare headers based on the new API specification
			const headers: any = {
				'Content-Type': 'application/json',
			};

			// Add Bearer token if available (for authenticated requests)
			if (token && url !== 'login') {
				headers.Authorization = `Bearer ${token}`;
			}

			// For login requests, we don't need Bearer token
			// The API will return the token in response

			const response = await apiClient.request<T>({
				method,
				url,
				data,
				signal: controllerRef.current.signal,
				headers,
				...config,
			});

			console.log(`API ${method} ${resolvedUrl} response:`, response.data);
			return response;
		} catch (error: any) {
			if (axios.isCancel(error)) {
				console.warn('Request canceled:', error.message);
			} else if (error.response) {
				console.error('API Error Response:', {
					status: error.response.status,
					data: error.response.data,
					url: resolvedUrl || error.config?.url,
				});
			} else {
				console.error('API Error:', error.message);
			}
			throw error;
		}
	};

	return { api };
}
