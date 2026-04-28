/**
 * API Services Index
 * 
 * This file exports all API services for convenient import throughout the application.
 * Import this file to get access to all API functionality in one place.
 * 
 * Example usage:
 * 
 * import { authApi, reportsApi } from '@/lib/api';
 * 
 * const login = async () => {
 *   const user = await authApi.login({ email, password });
 * };
 */

import * as authApi from './auth';
import * as reportsApi from './reports';
import { api, ApiError, API_URL } from '../api';

// Re-export all API services
export {
  authApi,
  reportsApi,
  api,
  ApiError,
  API_URL
};
