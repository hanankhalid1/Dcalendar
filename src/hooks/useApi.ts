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

// Helper function to generate OpenAPI token (JWT-style) matching web implementation
export const generateOpenApiToken = (secretKey: string): string => {
	// Create payload
	const payload = {
		iat: Math.floor(Date.now() / 1000), // Issued at
		exp: Math.floor(Date.now() / 1000) + 60 * 60, // Expires in 1 hour
		iss: 'dcalendar', // Issuer identifier
	};

	// Convert payload to base64 using CryptoJS (React Native compatible)
	const payloadString = JSON.stringify(payload);
	const payloadBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(payloadString));

	// Generate signature using HMAC-SHA256
	const signature = CryptoJS.HmacSHA256(payloadBase64, secretKey).toString();

	// Return token in format: payload.signature
	return `${payloadBase64}.${signature}`;
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
		tokenType: 'bearer' | 'api' = 'bearer', // Add token type parameter
	): Promise<AxiosResponse<T>> => {
		const bearerToken = useToken.getState().token;
		console.log("API Request data:", data);
		console.log("Current bearer token:", bearerToken);
		console.log("Token type:", tokenType);

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

			// Add appropriate token based on token type
			if (tokenType === 'api') {
				// Import Config at runtime to avoid circular dependencies
				const Config = require('../config').default;
				const apiToken = generateOpenApiToken(Config.CRYPTO_SECRET);
				headers['x-api-token'] = apiToken;
				console.log('🔑 Using API token authentication');
			} else if (bearerToken && url !== 'login') {
				// Add Bearer token for authenticated requests
				headers.Authorization = `Bearer ${bearerToken}`;
				console.log('🔑 Using Bearer token authentication');
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
