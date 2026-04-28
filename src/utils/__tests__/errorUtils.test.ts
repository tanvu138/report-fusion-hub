import { describe, it, expect } from 'vitest';
import { formatError, isRetryableError, getSimpleErrorMessage } from '../errorUtils';

describe('errorUtils', () => {
  describe('formatError', () => {
    it('formats JavaScript Error objects', () => {
      const error = new Error('Something went wrong');
      const result = formatError(error);

      expect(result.title).toBe('Error');
      expect(result.message).toBe('Something went wrong');
      expect(result.technical).toBe('Something went wrong');
      expect(result.retryable).toBe(true);
    });

    it('formats network errors', () => {
      const error = new Error('fetch failed');
      const result = formatError(error);

      expect(result.title).toBe('Connection Error');
      expect(result.message).toBe('Unable to connect to the server. Please check your internet connection and try again.');
      expect(result.retryable).toBe(true);
    });

    it('formats timeout errors', () => {
      const error = new Error('Request timeout');
      const result = formatError(error);

      expect(result.title).toBe('Request Timeout');
      expect(result.message).toBe('The request took too long to complete. Please try again.');
      expect(result.retryable).toBe(true);
    });

    it('formats unauthorized errors', () => {
      const error = new Error('unauthorized access');
      const result = formatError(error);

      expect(result.title).toBe('Access Denied');
      expect(result.message).toBe('You do not have permission to perform this action. Please contact your administrator.');
      expect(result.retryable).toBe(false);
    });

    it('formats validation errors', () => {
      const error = new Error('validation failed: email is required');
      const result = formatError(error);

      expect(result.title).toBe('Invalid Input');
      expect(result.message).toBe('validation failed: email is required');
      expect(result.retryable).toBe(false);
    });

    it('formats string errors', () => {
      const error = 'Something went wrong';
      const result = formatError(error);

      expect(result.title).toBe('Error');
      expect(result.message).toBe('Something went wrong');
      expect(result.technical).toBe('Something went wrong');
      expect(result.retryable).toBe(true);
    });

    it('formats string network errors', () => {
      const error = 'network connection failed';
      const result = formatError(error);

      expect(result.title).toBe('Connection Error');
      expect(result.message).toBe('Unable to connect to the server. Please check your internet connection.');
      expect(result.retryable).toBe(true);
    });

    it('formats not found errors', () => {
      const error = 'Resource not found';
      const result = formatError(error);

      expect(result.title).toBe('Not Found');
      expect(result.message).toBe('The requested resource could not be found.');
      expect(result.retryable).toBe(false);
    });

    it('formats object errors with response data', () => {
      const error = {
        response: {
          data: {
            message: 'Invalid request parameters'
          }
        }
      };
      const result = formatError(error);

      expect(result.title).toBe('Error');
      expect(result.message).toBe('Invalid request parameters');
      expect(result.retryable).toBe(true);
    });

    it('formats HTTP status errors', () => {
      const error = {
        status: 404,
        statusText: 'Not Found'
      };
      const result = formatError(error);

      expect(result.title).toBe('Not Found');
      expect(result.message).toBe('The requested resource could not be found.');
      expect(result.code).toBe('404');
      expect(result.retryable).toBe(false);
    });

    it('handles 500 errors', () => {
      const error = {
        status: 500,
        statusText: 'Internal Server Error'
      };
      const result = formatError(error);

      expect(result.title).toBe('Server Error');
      expect(result.message).toBe('An internal server error occurred. Please try again later.');
      expect(result.code).toBe('500');
      expect(result.retryable).toBe(true);
    });

    it('handles 429 errors', () => {
      const error = {
        status: 429,
        statusText: 'Too Many Requests'
      };
      const result = formatError(error);

      expect(result.title).toBe('Too Many Requests');
      expect(result.message).toBe('Too many requests have been made. Please wait a moment and try again.');
      expect(result.code).toBe('429');
      expect(result.retryable).toBe(true);
    });

    it('adds context to error title', () => {
      const error = new Error('Something went wrong');
      const result = formatError(error, 'Login');

      expect(result.title).toBe('Login Error');
    });

    it('handles unknown error types', () => {
      const error = 42;
      const result = formatError(error);

      expect(result.title).toBe('Unknown Error');
      expect(result.message).toBe('An unexpected error occurred. Please try again.');
      expect(result.technical).toBe('42');
      expect(result.retryable).toBe(true);
    });
  });

  describe('isRetryableError', () => {
    it('returns true for retryable errors', () => {
      const networkError = new Error('fetch failed');
      expect(isRetryableError(networkError)).toBe(true);

      const timeoutError = new Error('timeout');
      expect(isRetryableError(timeoutError)).toBe(true);

      const serverError = { status: 500 };
      expect(isRetryableError(serverError)).toBe(true);
    });

    it('returns false for non-retryable errors', () => {
      const authError = new Error('unauthorized');
      expect(isRetryableError(authError)).toBe(false);

      const validationError = new Error('validation failed');
      expect(isRetryableError(validationError)).toBe(false);

      const notFoundError = { status: 404 };
      expect(isRetryableError(notFoundError)).toBe(false);
    });
  });

  describe('getSimpleErrorMessage', () => {
    it('returns simple error message', () => {
      const error = new Error('Something went wrong');
      const message = getSimpleErrorMessage(error);

      expect(message).toBe('Something went wrong');
    });

    it('returns formatted message for complex errors', () => {
      const error = new Error('fetch failed');
      const message = getSimpleErrorMessage(error);

      expect(message).toBe('Unable to connect to the server. Please check your internet connection and try again.');
    });
  });
});