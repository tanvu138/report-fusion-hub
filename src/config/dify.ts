// Dify AI Chatbot Configuration
// This file contains all Dify-related configuration that can be easily modified

export interface DifyConfig {
  /** Dify chatbot token */
  token: string;
  /** Dify base URL endpoint */
  baseUrl: string;
  /** Development mode flag */
  isDev: boolean;
  /** Default chatbot settings */
  defaults: {
    /** Enable drag functionality for chatbot button */
    draggable: boolean;
    /** Drag axis restriction */
    dragAxis: 'x' | 'y' | 'both';
    /** Default window width */
    windowWidth: string;
    /** Default window height */
    windowHeight: string;
    /** Button background color */
    buttonColor: string;
  };
}

// Main Dify configuration - requires environment variables
export const difyConfig: DifyConfig | null = (() => {
  const token = import.meta.env.VITE_DIFY_TOKEN;
  const baseUrl = import.meta.env.VITE_DIFY_BASE_URL;
  
  // If required environment variables are missing, return null
  if (!token || !baseUrl) {
    console.info('Dify chatbot disabled: Missing required environment variables', {
      hasToken: !!token,
      hasBaseUrl: !!baseUrl,
      required: ['VITE_DIFY_TOKEN', 'VITE_DIFY_BASE_URL']
    });
    return null;
  }
  
  return {
    token,
    baseUrl,
    isDev: import.meta.env.DEV,
    defaults: {
      draggable: false,
      dragAxis: 'both',
      windowWidth: '50vw',
      windowHeight: '70vh',
      buttonColor: '#1C64F2',
    },
  };
})();

// Helper function to get Dify configuration
export const getDifyConfig = (): DifyConfig | null => {
  return difyConfig;
};

// Helper function to check if Dify is properly configured
export const isDifyConfigured = (): boolean => {
  return difyConfig !== null;
};

// Environment-specific configurations
export const difyEnvironments = {
  development: {
    baseUrl: 'http://ai.tienphuoc.com',
    isDev: true,
  },
  staging: {
    baseUrl: 'https://staging-ai.tienphuoc.com',
    isDev: false,
  },
  production: {
    baseUrl: 'https://ai.tienphuoc.com',
    isDev: false,
  },
} as const;

// Get environment-specific config
export const getDifyEnvironmentConfig = (env: keyof typeof difyEnvironments) => {
  return {
    ...difyConfig,
    ...difyEnvironments[env],
  };
};