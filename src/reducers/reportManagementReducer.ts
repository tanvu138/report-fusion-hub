/**
 * Report Management Reducer - State Management for ReportEdit UX Redesign
 * 
 * This reducer manages all state transitions for the new tab-based ReportEdit interface,
 * providing a clean and organized way to handle complex state updates.
 * 
 * Features:
 * - Centralized state management for all report edit functionality
 * - Type-safe state transitions
 * - Optimistic updates for better UX
 * - Comprehensive error handling
 * - Auto-save state synchronization
 * 
 * Created: 2025-06-24
 * Engineer: B (Logic/Components)
 */

import type {
  ReportManagementState,
  TabType,
  ReportDetailsEditState,
  AutoSaveState
} from '@/types/reportManagement';
import type { ReportWithSections } from '@/lib/api/reports';
import type { User } from '@/lib/api/auth';

// ============================================================================
// ACTION TYPES
// ============================================================================

export type ReportManagementAction = 
  // Tab navigation
  | { type: 'SET_ACTIVE_TAB'; payload: TabType }

  // Data loading
  | { type: 'SET_REPORT_DATA'; payload: ReportWithSections }
  | { type: 'SET_USER_DATA'; payload: User }
  | { type: 'SET_LOADING'; payload: { key: keyof ReportManagementState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: string | null }
  
  // Report details editing
  | { type: 'UPDATE_REPORT_DETAILS'; payload: Partial<ReportDetailsEditState> }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SAVE_SUCCESS'; payload: ReportWithSections }
  | { type: 'SAVE_ERROR'; payload: string }
  
  // Auto-save state
  | { type: 'SET_AUTO_SAVE_STATE'; payload: Partial<AutoSaveState> }
  
  // Reset state
  | { type: 'RESET_STATE' };

// ============================================================================
// INITIAL STATE
// ============================================================================

export const initialReportManagementState: ReportManagementState = {
  // Core data
  report: null,
  user: null,
  
  // UI state
  activeTab: 'content',
  loading: {
    report: true,
    user: true,
    saving: false,
    operations: new Set<string>(),
  },
  
  // Edit state
  editState: {
    reportDetails: {
      title: '',
      description: '',
      cycle: '',
      state: undefined,
      hasChanges: false,
    },
    sections: new Map(),
  },
  
  // Auto-save state
  autoSave: {
    isSaving: false,
    hasUnsavedChanges: false,
    lastSaved: null,
    lastAttempt: null,
    retryCount: 0,
    errors: [],
    conflicts: [],
    status: 'idle',
  },
  
  // Error state
  error: null,
};

// ============================================================================
// REDUCER FUNCTION
// ============================================================================

export const reportManagementReducer = (
  state: ReportManagementState,
  action: ReportManagementAction
): ReportManagementState => {
  switch (action.type) {
    // ========================================================================
    // TAB NAVIGATION
    // ========================================================================
    
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload,
      };

    // ========================================================================
    // DATA LOADING
    // ========================================================================
    
    case 'SET_REPORT_DATA':
      return {
        ...state,
        report: action.payload,
        loading: {
          ...state.loading,
          report: false,
        },
        editState: {
          ...state.editState,
          reportDetails: {
            title: action.payload.title || '',
            description: action.payload.description || '',
            cycle: action.payload.cycle || '',
            state: action.payload.state,
            hasChanges: false,
          },
        },
        error: null, // Clear error on successful load
      };
    
    case 'SET_USER_DATA':
      return {
        ...state,
        user: action.payload,
        loading: {
          ...state.loading,
          user: false,
        },
        error: null, // Clear error on successful load
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    // ========================================================================
    // REPORT DETAILS EDITING
    // ========================================================================
    
    case 'UPDATE_REPORT_DETAILS': {
      const currentDetails = state.editState.reportDetails;
      const updatedDetails = { ...currentDetails, ...action.payload };
      
      // Check if there are changes compared to original report
      const hasChanges = state.report ? (
        updatedDetails.title !== (state.report.title || '') ||
        updatedDetails.description !== (state.report.description || '') ||
        updatedDetails.cycle !== (state.report.cycle || '')
      ) : false;
      
      return {
        ...state,
        editState: {
          ...state.editState,
          reportDetails: {
            ...updatedDetails,
            hasChanges,
          },
        },
        autoSave: {
          ...state.autoSave,
          hasUnsavedChanges: hasChanges,
        },
      };
    }
    
    case 'SET_SAVING':
      return {
        ...state,
        loading: {
          ...state.loading,
          saving: action.payload,
        },
        autoSave: {
          ...state.autoSave,
          isSaving: action.payload,
          lastAttempt: action.payload ? new Date() : state.autoSave.lastAttempt,
        },
      };
    
    case 'SAVE_SUCCESS':
      return {
        ...state,
        report: action.payload,
        loading: {
          ...state.loading,
          saving: false,
        },
        editState: {
          ...state.editState,
          reportDetails: {
            title: action.payload.title || '',
            description: action.payload.description || '',
            cycle: action.payload.cycle || '',
            hasChanges: false,
          },
        },
        autoSave: {
          ...state.autoSave,
          isSaving: false,
          hasUnsavedChanges: false,
          lastSaved: new Date(),
          retryCount: 0,
          errors: [],
          status: 'success',
        },
        error: null, // Clear error on successful save
      };
    
    case 'SAVE_ERROR':
      return {
        ...state,
        loading: {
          ...state.loading,
          saving: false,
        },
        autoSave: {
          ...state.autoSave,
          isSaving: false,
          retryCount: state.autoSave.retryCount + 1,
          errors: [
            ...state.autoSave.errors,
            {
              message: action.payload,
              timestamp: new Date(),
              type: 'unknown',
              retryable: true,
            },
          ],
          status: 'error',
        },
        error: action.payload,
      };

    // ========================================================================
    // AUTO-SAVE STATE
    // ========================================================================
    
    case 'SET_AUTO_SAVE_STATE':
      return {
        ...state,
        autoSave: {
          ...state.autoSave,
          ...action.payload,
        },
      };

    // ========================================================================
    // RESET STATE
    // ========================================================================
    
    case 'RESET_STATE':
      return initialReportManagementState;

    // ========================================================================
    // DEFAULT
    // ========================================================================
    
    default:
      return state;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Helper function to check if there are unsaved changes in the report details
 */
export const hasUnsavedReportChanges = (
  state: ReportManagementState
): boolean => {
  if (!state.report) return false;
  
  const details = state.editState.reportDetails;
  return (
    details.title !== (state.report.title || '') ||
    details.description !== (state.report.description || '') ||
    details.cycle !== (state.report.cycle || '')
  );
};

/**
 * Helper function to get the current loading state summary
 */
export const getLoadingState = (state: ReportManagementState) => ({
  isLoading: state.loading.report || state.loading.user,
  isSaving: state.loading.saving || state.autoSave.isSaving,
  hasOperations: state.loading.operations.size > 0,
  operationCount: state.loading.operations.size,
});

/**
 * Helper function to get auto-save status for UI display
 */
export const getAutoSaveStatus = (state: ReportManagementState) => ({
  canSave: state.editState.reportDetails.hasChanges && !state.loading.saving,
  needsAttention: state.autoSave.errors.length > 0,
  statusText: getAutoSaveStatusText(state.autoSave),
});

function getAutoSaveStatusText(autoSave: AutoSaveState): string {
  if (autoSave.isSaving) return 'Saving...';
  if (autoSave.errors.length > 0) return 'Save failed';
  if (autoSave.hasUnsavedChanges) return 'Unsaved changes';
  if (autoSave.lastSaved) return `Saved ${formatRelativeTime(autoSave.lastSaved)}`;
  return 'All changes saved';
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  return date.toLocaleDateString();
}