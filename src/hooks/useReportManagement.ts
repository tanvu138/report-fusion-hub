/**
 * useReportManagement Hook - Core Data Management for ReportEdit UX Redesign
 * 
 * This hook centralizes all data management for the new tab-based ReportEdit interface,
 * replacing the 15+ useState hooks with a clean, organized state management system.
 * 
 * Features:
 * - Centralized state management with useReducer
 * - Enhanced auto-save with conflict detection
 * - Tab-based UI state management
 * - Bulk section operations
 * - Real-time data synchronization
 * 
 * Created: 2025-06-24
 * Engineer: B (Logic/Components)
 */

import { useReducer, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getReportById,
  updateReport,
  type ReportWithSections,
  type UpdateReportData
} from '@/lib/api/reports';
import { getCurrentUser } from '@/lib/api/auth';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useToast } from '@/hooks/use-toast';
import { reportManagementReducer, initialReportManagementState } from '@/reducers/reportManagementReducer';
import type {
  ReportManagementState,
  ReportManagementActions,
  TabType,
  ReportDetailsEditState
} from '@/types/reportManagement';

export interface UseReportManagementReturn {
  state: ReportManagementState;
  actions: ReportManagementActions;
  loading: boolean;
  error: string | null;
}

export const useReportManagement = (reportId: string): UseReportManagementReturn => {
  const { toast } = useToast();
  const [state, dispatch] = useReducer(reportManagementReducer, initialReportManagementState);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { 
    data: reportData, 
    isLoading: reportLoading, 
    refetch: refetchReport,
    error: reportError 
  } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => getReportById(reportId),
    enabled: !!reportId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const { 
    data: userData, 
    isLoading: userLoading,
    error: userError 
  } = useQuery({
    queryKey: ['user'],
    queryFn: getCurrentUser,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });

  // Update state when data is loaded
  useEffect(() => {
    if (reportData) {
      dispatch({ type: 'SET_REPORT_DATA', payload: reportData });
    }
  }, [reportData]);

  useEffect(() => {
    if (userData) {
      dispatch({ type: 'SET_USER_DATA', payload: userData });
    }
  }, [userData]);

  // Handle errors
  useEffect(() => {
    if (reportError) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Failed to load report: ${reportError.message}` 
      });
    }
  }, [reportError]);

  useEffect(() => {
    if (userError) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Failed to load user data: ${userError.message}` 
      });
    }
  }, [userError]);

  // ============================================================================
  // AUTO-SAVE FUNCTIONALITY
  // ============================================================================

  const handleAutoSave = useCallback(async () => {
    if (!state.report || !state.user) return;
    
    if (state.user.role === 'secretary' && state.editState.reportDetails.hasChanges) {
      dispatch({ type: 'SET_SAVING', payload: true });
      
      try {
        const updateData: UpdateReportData = {
          title: state.editState.reportDetails.title,
          description: state.editState.reportDetails.description,
          cycle: state.editState.reportDetails.cycle || undefined,
        };

        const updatedReport = await updateReport(reportId, updateData);
        dispatch({ type: 'SAVE_SUCCESS', payload: updatedReport });
        
        toast({
          title: 'Auto-saved',
          description: 'Report details have been automatically saved.',
        });
      } catch (error: any) {
        dispatch({ type: 'SAVE_ERROR', payload: error.message });
        toast({
          title: 'Auto-save failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  }, [state.report, state.user, state.editState.reportDetails, reportId, toast]);

  const { triggerAutoSave, ...autoSaveState } = useAutoSave({
    onSave: handleAutoSave,
    delay: 45000, // 45 seconds for report details
    enabled: state.user?.role === 'secretary' && !!state.report,
    isDataChanged: () => state.editState.reportDetails.hasChanges,
  });

  // Update auto-save state in reducer
  useEffect(() => {
    dispatch({ 
      type: 'SET_AUTO_SAVE_STATE', 
      payload: {
        isSaving: autoSaveState.isSaving,
        hasUnsavedChanges: autoSaveState.hasUnsavedChanges,
        lastSaved: autoSaveState.lastSaved,
        status: autoSaveState.isSaving ? 'saving' : 
                autoSaveState.hasUnsavedChanges ? 'pending' : 'idle',
      }
    });
  }, [autoSaveState.isSaving, autoSaveState.hasUnsavedChanges, autoSaveState.lastSaved]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const actions: ReportManagementActions = useMemo(() => ({
    // Tab navigation
    setActiveTab: (tab: TabType) => {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
    },

    // Report details editing
    updateReportDetails: (changes: Partial<ReportDetailsEditState>) => {
      dispatch({ type: 'UPDATE_REPORT_DETAILS', payload: changes });
      
      // Trigger auto-save for secretary users
      if (state.user?.role === 'secretary') {
        triggerAutoSave();
      }
    },

    saveReportDetails: async () => {
      if (!state.report || !state.user) {
        toast({
          title: 'Error',
          description: 'Report data is not available.',
          variant: 'destructive',
        });
        return;
      }

      // Validation
      if (!state.editState.reportDetails.title.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Report Title cannot be empty.',
          variant: 'destructive',
        });
        return;
      }

      dispatch({ type: 'SET_SAVING', payload: true });

      try {
        const updateData: UpdateReportData = {
          title: state.editState.reportDetails.title,
          description: state.editState.reportDetails.description,
          cycle: state.editState.reportDetails.cycle || undefined,
        };

        const updatedReport = await updateReport(reportId, updateData);
        dispatch({ type: 'SAVE_SUCCESS', payload: updatedReport });
        
        toast({
          title: 'Success',
          description: 'Report details saved successfully.',
        });
      } catch (error: any) {
        dispatch({ type: 'SAVE_ERROR', payload: error.message });
        toast({
          title: 'Save Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    },

    // Auto-save control
    triggerManualSave: async () => {
      await handleAutoSave();
    },

    clearAutoSaveErrors: () => {
      dispatch({ 
        type: 'SET_AUTO_SAVE_STATE', 
        payload: { 
          errors: [],
          status: state.autoSave.hasUnsavedChanges ? 'pending' : 'idle'
        } 
      });
    },

    // Data refetching
    refetchReport: async () => {
      await refetchReport();
    },
  }), [
    state.report,
    state.user,
    state.editState.reportDetails,
    state.autoSave.hasUnsavedChanges,
    reportId,
    toast,
    triggerAutoSave,
    handleAutoSave,
    refetchReport
  ]);

  // ============================================================================
  // TRIGGER AUTO-SAVE ON CHANGES
  // ============================================================================

  useEffect(() => {
    if (state.user?.role === 'secretary' && state.editState.reportDetails.hasChanges) {
      triggerAutoSave();
    }
  }, [
    state.editState.reportDetails.title,
    state.editState.reportDetails.description,
    state.editState.reportDetails.cycle,
    state.user?.role,
    triggerAutoSave
  ]);

  // ============================================================================
  // RETURN INTERFACE
  // ============================================================================

  const loading = reportLoading || userLoading;
  const error = state.error || 
    (reportError ? `Report loading error: ${reportError.message}` : null) ||
    (userError ? `User loading error: ${userError.message}` : null);

  return {
    state,
    actions,
    loading,
    error,
  };
};