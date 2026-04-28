import { useEffect, useRef } from 'react';
import { getDifyConfig, isDifyConfigured } from '@/config/dify';

interface DifyChatbotProps {
  /** Override default token from config */
  token?: string;
  /** Override default baseUrl from config */
  baseUrl?: string;
  /** System variables for Dify (including user_id for isolation) */
  systemVariables?: Record<string, string>;
  /** User variables for Dify */
  userVariables?: Record<string, string>;
  /** Input variables for Dify */
  inputs?: Record<string, string>;
  /** Override development mode from config */
  isDev?: boolean;
  /** Override draggable setting from config */
  draggable?: boolean;
  /** Override drag axis from config */
  dragAxis?: 'x' | 'y' | 'both';
  /** Container properties for styling */
  containerProps?: Record<string, any>;
}

declare global {
  interface Window {
    difyChatbotConfig?: {
      token: string;
      baseUrl: string;
      isDev?: boolean;
      systemVariables?: Record<string, string>;
      userVariables?: Record<string, string>;
      inputs?: Record<string, string>;
      draggable?: boolean;
      dragAxis?: 'x' | 'y' | 'both';
      containerProps?: Record<string, any>;
    };
  }
}

export function DifyChatbot({
  token: tokenOverride,
  baseUrl: baseUrlOverride,
  systemVariables = {},
  userVariables = {},
  inputs = {},
  isDev: isDevOverride,
  draggable: draggableOverride,
  dragAxis: dragAxisOverride,
  containerProps = {},
}: DifyChatbotProps) {
  // Hooks must be called before any conditional returns
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const configSet = useRef(false);
  
  // Get config (may be null)
  const config = getDifyConfig();

  useEffect(() => {
    // Handle case where Dify is not configured
    if (!config) {
      return; // Skip effect if config is missing
    }
    
    const token = tokenOverride || config.token;
    const baseUrl = baseUrlOverride || config.baseUrl;
    const isDev = isDevOverride !== undefined ? isDevOverride : config.isDev;
    const draggable = draggableOverride !== undefined ? draggableOverride : config.defaults.draggable;
    const dragAxis = dragAxisOverride || config.defaults.dragAxis;

    // SECURITY: Always cleanup and recreate to ensure user isolation
    // This prevents users from seeing each other's conversations
    const cleanup = () => {
      // Remove existing elements
      const existingButton = document.getElementById('dify-chatbot-bubble-button');
      const existingWindow = document.getElementById('dify-chatbot-bubble-window');
      const existingScript = document.getElementById(`dify-chatbot-script-${token}`);
      
      if (existingButton) existingButton.remove();
      if (existingWindow) existingWindow.remove();
      if (existingScript) existingScript.remove();
      
      // Clear configuration
      delete window.difyChatbotConfig;
      configSet.current = false;
      scriptRef.current = null;
      
      console.log('🧹 Cleaned up existing chatbot for user isolation');
    };

    // Always cleanup first to ensure user isolation
    cleanup();

    // Set up the configuration immediately, before script loads
    if (!configSet.current) {
      console.log('Setting up Dify chatbot config (official method):', {
        token,
        baseUrl,
        isDev,
        systemVariables,
        userVariables,
        inputs,
        draggable,
        dragAxis,
        containerProps
      });

      // Set configuration exactly as per official documentation
      // SECURITY: Include user_id in systemVariables for proper user isolation
      const secureSystemVariables = {
        ...systemVariables,
        // user_id is REQUIRED for user session isolation in Dify
        user_id: userVariables?.user_id || systemVariables?.user_id || 'anonymous',
      };

      window.difyChatbotConfig = {
        token,
        baseUrl,
        isDev,
        systemVariables: secureSystemVariables,
        userVariables: userVariables || {},
        inputs: inputs || {},
        draggable: draggable || false,
        dragAxis: dragAxis || 'both',
        containerProps: containerProps || {},
        dynamicScript: true, // Force immediate initialization instead of waiting for body.onload
      };

      console.log('🔒 Security: user_id set for session isolation:', secureSystemVariables.user_id);

      configSet.current = true;
      console.log('Config set, window.difyChatbotConfig:', window.difyChatbotConfig);
    }

    // Create and load the script only after configuration is set
    if (!scriptRef.current) {
      console.log('Loading Dify chatbot script...');
      
      const script = document.createElement('script');
      script.src = `${baseUrl}/embed.min.js`;
      script.id = `dify-chatbot-script-${token}`;
      
      // Add debug logging before script execution
      script.onload = () => {
        console.log('Dify chatbot script loaded successfully');
        console.log('Config immediately after script load:', window.difyChatbotConfig);
        
        // Check if elements are created after a delay
        setTimeout(() => {
          const button = document.getElementById('dify-chatbot-bubble-button');
          const chatWindow = document.getElementById('dify-chatbot-bubble-window');
          console.log('Chatbot elements check after script load:', { button, chatWindow });
          console.log('Config after 2 seconds:', window.difyChatbotConfig);
          
          if (!button) {
            console.error('Chatbot button not created. Configuration may be invalid.');
            console.log('Available config keys:', Object.keys(window.difyChatbotConfig || {}));
            
            // Check if config is still valid
            if (window.difyChatbotConfig && window.difyChatbotConfig.token) {
              console.log('Config exists but button not created - possible script issue');
            } else {
              console.log('Config missing or invalid - recreating...');
              window.difyChatbotConfig = {
                token,
                baseUrl,
                isDev,
                systemVariables,
                userVariables,
                inputs,
                draggable,
                dragAxis,
                containerProps,
              };
            }
          }
        }, 2000);
      };

      script.onerror = (error) => {
        console.error('Failed to load Dify chatbot script:', error);
      };

      // Add script to document head
      document.head.appendChild(script);
      scriptRef.current = script;

      // Add CSS fixes for positioning and styling
      const style = document.createElement('style');
      style.id = `dify-chatbot-styles-${token}`;
      style.textContent = `
        #dify-chatbot-bubble-window {
          position: fixed !important;
          bottom: 5rem !important;
          right: 1rem !important;
          top: unset !important;
          left: unset !important;
          width: 50vw !important;
          max-width: 600px !important;
          min-width: 400px !important;
          height: 70vh !important;
          max-height: 600px !important;
          z-index: 2147483640 !important;
          transform: none !important;
          margin: 0 !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2) !important;
        }
        
        #dify-chatbot-bubble-button {
          position: fixed !important;
          bottom: 1rem !important;
          right: 1rem !important;
          top: unset !important;
          left: unset !important;
          z-index: 2147483647 !important;
          transform: none !important;
          margin: 0 !important;
        }
      `;
      document.head.appendChild(style);

      // Add click-outside-to-close functionality
      let isListenerAdded = false;
      const addClickOutsideListener = () => {
        if (isListenerAdded) return;
        
        const handleClickOutside = (event: Event) => {
          const chatWindow = document.getElementById('dify-chatbot-bubble-window');
          const chatButton = document.getElementById('dify-chatbot-bubble-button');
          
          if (chatWindow && chatWindow.style.display !== 'none') {
            const target = event.target as Element;
            const isClickInside = chatWindow.contains(target) || chatButton?.contains(target);
            
            if (!isClickInside) {
              chatWindow.style.display = 'none';
            }
          }
        };
        
        document.addEventListener('click', handleClickOutside);
        isListenerAdded = true;
      };
      
      // Add listener after a delay to ensure elements are created
      setTimeout(addClickOutsideListener, 2000);
    }

    // Cleanup function
    return () => {
      if (scriptRef.current) {
        // Remove script
        if (scriptRef.current.parentNode) {
          scriptRef.current.parentNode.removeChild(scriptRef.current);
        }
        scriptRef.current = null;
      }
      
      // Remove chatbot elements
      const button = document.getElementById('dify-chatbot-bubble-button');
      const chatWindow = document.getElementById('dify-chatbot-bubble-window');
      const styles = document.getElementById(`dify-chatbot-styles-${token}`);
      
      if (button && button.parentNode) {
        button.parentNode.removeChild(button);
      }
      if (chatWindow && chatWindow.parentNode) {
        chatWindow.parentNode.removeChild(chatWindow);
      }
      if (styles && styles.parentNode) {
        styles.parentNode.removeChild(styles);
      }
      
      // Clear configuration for security
      delete window.difyChatbotConfig;
      configSet.current = false;
      
      console.log('🧹 Chatbot cleanup completed for user isolation');
    };
  }, [config, tokenOverride, baseUrlOverride, isDevOverride, systemVariables, userVariables, inputs, draggableOverride, dragAxisOverride, containerProps]);

  // Early return if Dify is not configured (missing env vars)
  if (!config) {
    return null; // Gracefully disable chatbot
  }

  // Component doesn't render anything visible - the chatbot is injected by the script
  return null;
}