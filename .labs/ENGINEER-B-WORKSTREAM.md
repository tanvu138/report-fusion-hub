# Engineer B Workstream - Logic/Components Development

> **Focus Area**: Data Management, State Logic, API Integration, and Functional Components  
> **Primary Responsibility**: Backend integration, business logic, and data flow  
> **Partner**: Engineer A (UI/Layout)  
> **Timeline**: 2 weeks  
> **Last Updated**: 2025-06-24

---

## 🎯 Your Responsibilities

You are responsible for **all data and logic aspects** of the ReportEdit page redesign:
- **Data management and state logic** for the new tab-based interface
- **API integration improvements** for enhanced functionality
- **Auto-save system enhancements** with better UX feedback
- **Business logic components** that process and manage report data
- **React hooks and utilities** for data fetching and state management
- **Integration with existing backend** APIs and database models

**Engineer A handles**: UI components, visual design, layout, styling, and responsive behavior.

---

## 📋 Task Breakdown

### **Phase 1: Core Data Architecture (Days 1-3)**

#### **Task B1: Enhanced Data Hooks**
**File**: `src/hooks/useReportManagement.ts` (NEW)

**Current Problem**: 
```typescript
// Current ReportEdit.tsx has 15+ useState hooks (lines 29-48)
const [report, setReport] = useState<ReportWithSections | null>(null);
const [reportLoading, setReportLoading] = useState(true);
const [user, setUser] = useState<User | null>(null);
const [editedTitle, setEditedTitle] = useState('');
// ... 11 more useState declarations
```

**Your Implementation**:
```typescript
// Create centralized data management hook
interface ReportManagementState {
  // Core data
  report: ReportWithSections | null;
  user: User | null;
  
  // UI state
  activeTab: 'overview' | 'sections' | 'settings';
  loading: {
    report: boolean;
    user: boolean;
    saving: boolean;
    operations: Set<string>;
  };
  
  // Edit state
  editState: {
    reportDetails: {
      title: string;
      description: string;
      cycle: 'WEEKLY' | 'MONTHLY' | 'ADHOC' | '';
      hasChanges: boolean;
    };
    sections: Map<string, SectionEditState>;
  };
  
  // Auto-save state
  autoSave: {
    isSaving: boolean;
    hasUnsavedChanges: boolean;
    lastSaved: Date | null;
    errors: string[];
  };
}

export const useReportManagement = (reportId: string) => {
  const [state, setState] = useReducer(reportManagementReducer, initialState);
  
  // Data fetching
  const { data: reportData, isLoading: reportLoading, refetch: refetchReport } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => getReportById(reportId),
    enabled: !!reportId,
  });
  
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: getCurrentUser,
  });
  
  // Auto-save functionality
  const { triggerAutoSave, autoSaveState } = useAutoSave({
    onSave: handleAutoSave,
    delay: 45000, // Report details
    enabled: userData?.role === 'secretary' && !!reportData,
  });
  
  // Actions
  const actions = {
    // Tab navigation
    setActiveTab: (tab: TabType) => {
      setState({ type: 'SET_ACTIVE_TAB', payload: tab });
    },
    
    // Report details editing
    updateReportDetails: (changes: Partial<ReportDetails>) => {
      setState({ type: 'UPDATE_REPORT_DETAILS', payload: changes });
      triggerAutoSave();
    },
    
    saveReportDetails: async () => {
      setState({ type: 'SET_SAVING', payload: true });
      try {
        const updatedReport = await updateReport(reportId, state.editState.reportDetails);
        setState({ type: 'SAVE_SUCCESS', payload: updatedReport });
      } catch (error) {
        setState({ type: 'SAVE_ERROR', payload: error.message });
      }
    },
    
    // Section management
    toggleSection: async (sectionId: string) => {
      setState({ type: 'SET_SECTION_UPDATING', payload: sectionId });
      try {
        const updatedSection = await toggleSectionActive(reportId, sectionId);
        setState({ type: 'SECTION_TOGGLE_SUCCESS', payload: { sectionId, section: updatedSection } });
      } catch (error) {
        setState({ type: 'SECTION_TOGGLE_ERROR', payload: { sectionId, error: error.message } });
      }
    },
    
    // Bulk operations
    bulkOperations: async (operation: string, sectionIds: string[]) => {
      setState({ type: 'SET_BULK_OPERATION', payload: { operation, sectionIds } });
      try {
        await performBulkOperation(reportId, operation, sectionIds);
        await refetchReport();
        setState({ type: 'BULK_OPERATION_SUCCESS' });
      } catch (error) {
        setState({ type: 'BULK_OPERATION_ERROR', payload: error.message });
      }
    },
  };
  
  return {
    state,
    actions,
    loading: reportLoading || userLoading,
    error: state.error,
  };
};
```

#### **Task B2: Data Processing Utilities**
**File**: `src/utils/reportDataProcessing.ts` (NEW)

**Implementation**:
```typescript
// Process raw report data for UI consumption
export interface ProcessedReportData {
  report: ReportWithSections;
  departmentProgress: DepartmentProgress[];
  sectionGroups: DepartmentSectionGroup[];
  completionStats: CompletionStats;
  overdueAlerts: OverdueAlert[];
}

export interface DepartmentProgress {
  departmentId: string;
  departmentName: string;
  completedSections: number;
  totalSections: number;
  overdueCount: number;
  lastActivity: Date;
  progressPercentage: number;
  status: 'complete' | 'in-progress' | 'not-started' | 'overdue';
}

export interface CompletionStats {
  totalSections: number;
  completedSections: number;
  inProgressSections: number;
  overdueCount: number;
  completionPercentage: number;
  estimatedCompletion: Date | null;
}

export const processReportData = (
  report: ReportWithSections,
  user: User
): ProcessedReportData => {
  const sections = report.sections || [];
  
  // Calculate department progress
  const departmentProgress = calculateDepartmentProgress(sections);
  
  // Group sections by department
  const sectionGroups = groupSectionsByDepartment(sections, user);
  
  // Calculate completion statistics
  const completionStats = calculateCompletionStats(sections);
  
  // Identify overdue alerts
  const overdueAlerts = identifyOverdueItems(sections, report.dueDate);
  
  return {
    report,
    departmentProgress,
    sectionGroups,
    completionStats,
    overdueAlerts,
  };
};

const calculateDepartmentProgress = (sections: ReportSection[]): DepartmentProgress[] => {
  const departmentMap = new Map<string, {
    sections: ReportSection[];
    department: Department;
  }>();
  
  // Group sections by department
  sections.forEach(section => {
    if (section.department) {
      const key = section.department.id;
      if (!departmentMap.has(key)) {
        departmentMap.set(key, {
          sections: [],
          department: section.department,
        });
      }
      departmentMap.get(key)!.sections.push(section);
    }
  });
  
  // Calculate progress for each department
  return Array.from(departmentMap.values()).map(({ sections, department }) => {
    const completedSections = sections.filter(s => s.state === 'SUBMITTED').length;
    const totalSections = sections.length;
    const overdueCount = sections.filter(s => isOverdue(s)).length;
    const lastActivity = getLastActivity(sections);
    
    let status: DepartmentProgress['status'] = 'not-started';
    if (completedSections === totalSections) status = 'complete';
    else if (overdueCount > 0) status = 'overdue';
    else if (completedSections > 0) status = 'in-progress';
    
    return {
      departmentId: department.id,
      departmentName: department.name,
      completedSections,
      totalSections,
      overdueCount,
      lastActivity,
      progressPercentage: totalSections > 0 ? (completedSections / totalSections) * 100 : 0,
      status,
    };
  });
};

const calculateCompletionStats = (sections: ReportSection[]): CompletionStats => {
  const totalSections = sections.length;
  const completedSections = sections.filter(s => s.state === 'SUBMITTED').length;
  const inProgressSections = sections.filter(s => s.state === 'DRAFT' && hasContent(s)).length;
  const overdueCount = sections.filter(s => isOverdue(s)).length;
  
  return {
    totalSections,
    completedSections,
    inProgressSections,
    overdueCount,
    completionPercentage: totalSections > 0 ? (completedSections / totalSections) * 100 : 0,
    estimatedCompletion: estimateCompletionDate(sections),
  };
};
```

#### **Task B3: State Management Reducer**
**File**: `src/reducers/reportManagementReducer.ts` (NEW)

**Implementation**:
```typescript
type ReportManagementAction = 
  | { type: 'SET_ACTIVE_TAB'; payload: TabType }
  | { type: 'SET_REPORT_DATA'; payload: ReportWithSections }
  | { type: 'SET_USER_DATA'; payload: User }
  | { type: 'UPDATE_REPORT_DETAILS'; payload: Partial<ReportDetails> }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SAVE_SUCCESS'; payload: ReportWithSections }
  | { type: 'SAVE_ERROR'; payload: string }
  | { type: 'SET_SECTION_UPDATING'; payload: string }
  | { type: 'SECTION_TOGGLE_SUCCESS'; payload: { sectionId: string; section: ReportSection } }
  | { type: 'SECTION_TOGGLE_ERROR'; payload: { sectionId: string; error: string } }
  | { type: 'SET_BULK_OPERATION'; payload: { operation: string; sectionIds: string[] } }
  | { type: 'BULK_OPERATION_SUCCESS' }
  | { type: 'BULK_OPERATION_ERROR'; payload: string }
  | { type: 'SET_AUTO_SAVE_STATE'; payload: Partial<AutoSaveState> };

export const reportManagementReducer = (
  state: ReportManagementState,
  action: ReportManagementAction
): ReportManagementState => {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload,
      };
      
    case 'SET_REPORT_DATA':
      return {
        ...state,
        report: action.payload,
        editState: {
          ...state.editState,
          reportDetails: {
            title: action.payload.title || '',
            description: action.payload.description || '',
            cycle: action.payload.cycle || '',
            hasChanges: false,
          },
        },
      };
      
    case 'UPDATE_REPORT_DETAILS':
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
          errors: [],
        },
      };
      
    case 'SECTION_TOGGLE_SUCCESS':
      if (!state.report) return state;
      
      return {
        ...state,
        report: {
          ...state.report,
          sections: state.report.sections.map(section =>
            section.id === action.payload.sectionId
              ? { ...section, ...action.payload.section }
              : section
          ),
        },
        loading: {
          ...state.loading,
          operations: new Set([...state.loading.operations].filter(id => id !== action.payload.sectionId)),
        },
      };
      
    default:
      return state;
  }
};
```

### **Phase 2: Enhanced Auto-Save System (Days 4-6)**

#### **Task B4: Improved Auto-Save Hook**
**File**: `src/hooks/useEnhancedAutoSave.ts` (NEW)

**Current Problem**:
```typescript
// Current auto-save in ReportEdit.tsx (lines 51-83) has issues:
- Mixed concerns between report details and section content
- No conflict resolution
- Poor error handling
- Limited user feedback
```

**Your Implementation**:
```typescript
interface EnhancedAutoSaveConfig {
  onSave: () => Promise<void>;
  delay: number;
  enabled: boolean;
  conflictResolution?: 'overwrite' | 'merge' | 'prompt';
  maxRetries?: number;
  isDataChanged: () => boolean;
  onConflict?: (conflict: ConflictData) => void;
  onError?: (error: AutoSaveError) => void;
}

interface AutoSaveState {
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  lastAttempt: Date | null;
  retryCount: number;
  errors: AutoSaveError[];
  conflicts: ConflictData[];
  status: 'idle' | 'pending' | 'saving' | 'success' | 'error';
}

export const useEnhancedAutoSave = (config: EnhancedAutoSaveConfig) => {
  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    hasUnsavedChanges: false,
    lastSaved: null,
    lastAttempt: null,
    retryCount: 0,
    errors: [],
    conflicts: [],
    status: 'idle',
  });
  
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  
  const triggerAutoSave = useCallback(() => {
    if (!config.enabled || !config.isDataChanged()) {
      return;
    }
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setState(prev => ({
      ...prev,
      hasUnsavedChanges: true,
      status: 'pending',
    }));
    
    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, config.delay);
  }, [config.enabled, config.delay, config.isDataChanged]);
  
  const performSave = useCallback(async () => {
    if (state.isSaving) return;
    
    setState(prev => ({
      ...prev,
      isSaving: true,
      status: 'saving',
      lastAttempt: new Date(),
    }));
    
    try {
      await config.onSave();
      
      setState(prev => ({
        ...prev,
        isSaving: false,
        hasUnsavedChanges: false,
        lastSaved: new Date(),
        retryCount: 0,
        errors: [],
        status: 'success',
      }));
    } catch (error) {
      handleSaveError(error);
    }
  }, [config.onSave, state.isSaving]);
  
  const handleSaveError = useCallback((error: any) => {
    const autoSaveError: AutoSaveError = {
      message: error.message || 'Auto-save failed',
      timestamp: new Date(),
      type: error.type || 'unknown',
      retryable: error.retryable !== false,
    };
    
    setState(prev => ({
      ...prev,
      isSaving: false,
      status: 'error',
      errors: [...prev.errors, autoSaveError],
      retryCount: prev.retryCount + 1,
    }));
    
    // Retry logic
    if (autoSaveError.retryable && state.retryCount < (config.maxRetries || 3)) {
      const retryDelay = Math.min(1000 * Math.pow(2, state.retryCount), 30000); // Exponential backoff
      
      retryTimeoutRef.current = setTimeout(() => {
        performSave();
      }, retryDelay);
    } else {
      config.onError?.(autoSaveError);
    }
  }, [config.onError, config.maxRetries, state.retryCount]);
  
  const manualSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await performSave();
  }, [performSave]);
  
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: [],
      status: prev.hasUnsavedChanges ? 'pending' : 'idle',
    }));
  }, []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    ...state,
    triggerAutoSave,
    manualSave,
    clearErrors,
  };
};
```

#### **Task B5: Conflict Resolution System**
**File**: `src/utils/conflictResolution.ts` (NEW)

**Implementation**:
```typescript
export interface ConflictData {
  field: string;
  localValue: any;
  serverValue: any;
  timestamp: Date;
  resolved: boolean;
  resolution?: 'local' | 'server' | 'merged';
}

export interface ConflictResolutionStrategy {
  type: 'overwrite' | 'merge' | 'prompt';
  autoResolve?: boolean;
  mergeFunction?: (local: any, server: any) => any;
}

export const detectConflicts = (
  localData: any,
  serverData: any,
  lastSynced: Date
): ConflictData[] => {
  const conflicts: ConflictData[] = [];
  
  // Compare timestamps and values
  if (serverData.updatedAt > lastSynced) {
    Object.keys(localData).forEach(key => {
      if (localData[key] !== serverData[key]) {
        conflicts.push({
          field: key,
          localValue: localData[key],
          serverValue: serverData[key],
          timestamp: new Date(),
          resolved: false,
        });
      }
    });
  }
  
  return conflicts;
};

export const resolveConflicts = (
  conflicts: ConflictData[],
  strategy: ConflictResolutionStrategy
): ConflictData[] => {
  return conflicts.map(conflict => {
    switch (strategy.type) {
      case 'overwrite':
        return {
          ...conflict,
          resolved: true,
          resolution: 'local',
        };
        
      case 'merge':
        if (strategy.mergeFunction) {
          const mergedValue = strategy.mergeFunction(conflict.localValue, conflict.serverValue);
          return {
            ...conflict,
            resolved: true,
            resolution: 'merged',
            localValue: mergedValue,
          };
        }
        return conflict;
        
      case 'prompt':
        // Will be handled by UI component
        return conflict;
        
      default:
        return conflict;
    }
  });
};
```

### **Phase 3: API Integration Enhancement (Days 7-9)**

#### **Task B6: Enhanced API Functions**
**File**: `src/lib/api/reportManagement.ts` (NEW)

**Implementation**:
```typescript
// Enhanced API functions for new functionality
export interface BulkSectionOperation {
  operation: 'activate' | 'deactivate' | 'reorder' | 'delete';
  sectionIds: string[];
  data?: any;
}

export interface DepartmentReminderRequest {
  departmentId: string;
  message?: string;
  urgency: 'low' | 'medium' | 'high';
  deadline?: Date;
}

export interface ReportStatusSummary {
  reportId: string;
  totalSections: number;
  completedSections: number;
  departmentProgress: DepartmentProgress[];
  overdueSections: OverdueSection[];
  estimatedCompletion: Date | null;
  lastActivity: Date;
}

// New API endpoints
export const getReportStatusSummary = async (reportId: string): Promise<ReportStatusSummary> => {
  const response = await api.get(`/reports/${reportId}/status-summary`);
  return response.data;
};

export const performBulkSectionOperation = async (
  reportId: string,
  operation: BulkSectionOperation
): Promise<void> => {
  await api.post(`/reports/${reportId}/sections/bulk`, operation);
};

export const sendDepartmentReminder = async (
  reportId: string,
  reminder: DepartmentReminderRequest
): Promise<void> => {
  await api.post(`/reports/${reportId}/remind`, reminder);
};

export const reorderSections = async (
  reportId: string,
  sectionOrder: string[]
): Promise<ReportSection[]> => {
  const response = await api.put(`/reports/${reportId}/sections/order`, {
    sectionIds: sectionOrder,
  });
  return response.data;
};

// Enhanced report updating with conflict detection
export const updateReportWithConflictDetection = async (
  reportId: string,
  updates: Partial<UpdateReportData>,
  lastModified?: Date
): Promise<{ report: Report; conflicts?: ConflictData[] }> => {
  try {
    const response = await api.put(`/reports/${reportId}`, {
      ...updates,
      lastModified: lastModified?.toISOString(),
    });
    return { report: response.data };
  } catch (error) {
    if (error.response?.status === 409) {
      // Conflict detected
      const conflictData = error.response.data;
      return {
        report: conflictData.currentData,
        conflicts: conflictData.conflicts,
      };
    }
    throw error;
  }
};
```

#### **Task B7: Real-time Updates Integration**
**File**: `src/hooks/useRealtimeUpdates.ts` (NEW)

**Implementation**:
```typescript
// Real-time updates for collaborative editing
export const useRealtimeUpdates = (reportId: string) => {
  const [updates, setUpdates] = useState<ReportUpdate[]>([]);
  const wsRef = useRef<WebSocket>();
  
  useEffect(() => {
    if (!reportId) return;
    
    // Establish WebSocket connection
    const ws = new WebSocket(`${process.env.VITE_WS_URL}/reports/${reportId}`);
    wsRef.current = ws;
    
    ws.onmessage = (event) => {
      const update: ReportUpdate = JSON.parse(event.data);
      setUpdates(prev => [...prev, update]);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [reportId]);
  
  const sendUpdate = useCallback((update: ReportUpdate) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(update));
    }
  }, []);
  
  return {
    updates,
    sendUpdate,
    clearUpdates: () => setUpdates([]),
  };
};
```

### **Phase 4: Business Logic Components (Days 10-12)**

#### **Task B8: Department Management Logic**
**File**: `src/components/logic/DepartmentManager.tsx` (NEW)

**Implementation**:
```typescript
// Business logic component for department operations
interface DepartmentManagerProps {
  reportId: string;
  departments: Department[];
  onDepartmentUpdate: (departmentId: string, data: any) => void;
  children: (props: DepartmentManagerRenderProps) => React.ReactNode;
}

interface DepartmentManagerRenderProps {
  sendReminder: (departmentId: string, options?: ReminderOptions) => Promise<void>;
  getDepartmentStatus: (departmentId: string) => DepartmentStatus;
  bulkAssignSections: (departmentId: string, sectionIds: string[]) => Promise<void>;
  exportDepartmentData: (departmentId: string) => Promise<Blob>;
}

export const DepartmentManager: React.FC<DepartmentManagerProps> = ({
  reportId,
  departments,
  onDepartmentUpdate,
  children,
}) => {
  const sendReminder = useCallback(async (
    departmentId: string,
    options: ReminderOptions = {}
  ) => {
    try {
      await sendDepartmentReminder(reportId, {
        departmentId,
        message: options.message,
        urgency: options.urgency || 'medium',
        deadline: options.deadline,
      });
      
      // Track reminder sent
      onDepartmentUpdate(departmentId, {
        lastReminderSent: new Date(),
        reminderCount: (getDepartmentReminderCount(departmentId) || 0) + 1,
      });
    } catch (error) {
      console.error('Failed to send reminder:', error);
      throw error;
    }
  }, [reportId, onDepartmentUpdate]);
  
  const getDepartmentStatus = useCallback((departmentId: string): DepartmentStatus => {
    const department = departments.find(d => d.id === departmentId);
    if (!department) return 'unknown';
    
    // Calculate status based on section completion
    const sections = department.sections || [];
    const completedCount = sections.filter(s => s.state === 'SUBMITTED').length;
    const totalCount = sections.length;
    
    if (totalCount === 0) return 'no-sections';
    if (completedCount === totalCount) return 'complete';
    if (completedCount === 0) return 'not-started';
    return 'in-progress';
  }, [departments]);
  
  const bulkAssignSections = useCallback(async (
    departmentId: string,
    sectionIds: string[]
  ) => {
    await performBulkSectionOperation(reportId, {
      operation: 'assign',
      sectionIds,
      data: { departmentId },
    });
    
    onDepartmentUpdate(departmentId, {
      assignedSections: sectionIds,
      lastAssignment: new Date(),
    });
  }, [reportId, onDepartmentUpdate]);
  
  const exportDepartmentData = useCallback(async (departmentId: string): Promise<Blob> => {
    const response = await api.get(`/reports/${reportId}/departments/${departmentId}/export`, {
      responseType: 'blob',
    });
    return response.data;
  }, [reportId]);
  
  return (
    <>
      {children({
        sendReminder,
        getDepartmentStatus,
        bulkAssignSections,
        exportDepartmentData,
      })}
    </>
  );
};
```

#### **Task B9: Section Operations Manager**
**File**: `src/components/logic/SectionOperationsManager.tsx` (NEW)

**Implementation**:
```typescript
// Business logic for section operations
interface SectionOperationsManagerProps {
  reportId: string;
  sections: ReportSection[];
  user: User;
  onSectionsUpdate: (sections: ReportSection[]) => void;
  children: (props: SectionOperationsRenderProps) => React.ReactNode;
}

interface SectionOperationsRenderProps {
  toggleSection: (sectionId: string) => Promise<void>;
  reorderSections: (newOrder: string[]) => Promise<void>;
  bulkToggle: (sectionIds: string[], active: boolean) => Promise<void>;
  duplicateSection: (sectionId: string) => Promise<ReportSection>;
  getSectionProgress: (sectionId: string) => SectionProgress;
  validateSectionOrder: (order: string[]) => ValidationResult;
}

export const SectionOperationsManager: React.FC<SectionOperationsManagerProps> = ({
  reportId,
  sections,
  user,
  onSectionsUpdate,
  children,
}) => {
  const [operationInProgress, setOperationInProgress] = useState<Set<string>>(new Set());
  
  const toggleSection = useCallback(async (sectionId: string) => {
    if (operationInProgress.has(sectionId)) return;
    
    setOperationInProgress(prev => new Set(prev).add(sectionId));
    
    try {
      const section = sections.find(s => s.id === sectionId);
      if (!section) throw new Error('Section not found');
      
      const updatedSection = await toggleSectionActive(reportId, sectionId, !section.isActive);
      
      const updatedSections = sections.map(s =>
        s.id === sectionId ? { ...s, ...updatedSection } : s
      );
      
      onSectionsUpdate(updatedSections);
    } finally {
      setOperationInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(sectionId);
        return newSet;
      });
    }
  }, [reportId, sections, onSectionsUpdate, operationInProgress]);
  
  const reorderSections = useCallback(async (newOrder: string[]) => {
    const validation = validateSectionOrder(newOrder);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }
    
    const reorderedSections = await reorderSections(reportId, newOrder);
    onSectionsUpdate(reorderedSections);
  }, [reportId, onSectionsUpdate]);
  
  const bulkToggle = useCallback(async (sectionIds: string[], active: boolean) => {
    await performBulkSectionOperation(reportId, {
      operation: active ? 'activate' : 'deactivate',
      sectionIds,
    });
    
    const updatedSections = sections.map(section =>
      sectionIds.includes(section.id)
        ? { ...section, isActive: active }
        : section
    );
    
    onSectionsUpdate(updatedSections);
  }, [reportId, sections, onSectionsUpdate]);
  
  const duplicateSection = useCallback(async (sectionId: string): Promise<ReportSection> => {
    const response = await api.post(`/reports/${reportId}/sections/${sectionId}/duplicate`);
    const newSection = response.data;
    
    onSectionsUpdate([...sections, newSection]);
    return newSection;
  }, [reportId, sections, onSectionsUpdate]);
  
  const getSectionProgress = useCallback((sectionId: string): SectionProgress => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return { status: 'unknown', completion: 0 };
    
    const hasContent = section.contentMarkdown && section.contentMarkdown.trim().length > 0;
    const isSubmitted = section.state === 'SUBMITTED';
    
    return {
      status: isSubmitted ? 'complete' : hasContent ? 'in-progress' : 'not-started',
      completion: isSubmitted ? 100 : hasContent ? 50 : 0,
      lastUpdated: section.updatedAt,
      wordCount: section.contentMarkdown?.split(/\s+/).length || 0,
    };
  }, [sections]);
  
  const validateSectionOrder = useCallback((order: string[]): ValidationResult => {
    const errors: string[] = [];
    
    // Check for missing sections
    const sectionIds = sections.map(s => s.id);
    const missingSections = sectionIds.filter(id => !order.includes(id));
    if (missingSections.length > 0) {
      errors.push(`Missing sections: ${missingSections.join(', ')}`);
    }
    
    // Check for extra sections
    const extraSections = order.filter(id => !sectionIds.includes(id));
    if (extraSections.length > 0) {
      errors.push(`Unknown sections: ${extraSections.join(', ')}`);
    }
    
    // Check for duplicates
    const duplicates = order.filter((id, index) => order.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate sections: ${duplicates.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [sections]);
  
  return (
    <>
      {children({
        toggleSection,
        reorderSections,
        bulkToggle,
        duplicateSection,
        getSectionProgress,
        validateSectionOrder,
      })}
    </>
  );
};
```

### **Phase 5: Integration & Testing (Days 13-14)**

#### **Task B10: Main Page Integration**
**File**: Update `src/pages/ReportEdit.tsx`

**Your Responsibility**: Replace the existing monolithic ReportEdit component with the new architecture:

```typescript
// Transform current ReportEdit.tsx from 600+ lines to clean integration
import { useReportManagement } from '@/hooks/useReportManagement';
import { DepartmentManager } from '@/components/logic/DepartmentManager';
import { SectionOperationsManager } from '@/components/logic/SectionOperationsManager';
import { processReportData } from '@/utils/reportDataProcessing';

// Components from Engineer A
import { ReportManagementHeader } from '@/components/reports/ReportManagementHeader';
import { ReportManagementTabs } from '@/components/reports/ReportManagementTabs';
import { OverviewTab } from '@/components/reports/OverviewTab';
import { SectionsTab } from '@/components/reports/SectionsTab';
import { SettingsTab } from '@/components/reports/SettingsTab';

const ReportEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Use your enhanced data management
  const { state, actions, loading, error } = useReportManagement(id!);
  
  // Process data for UI consumption
  const processedData = useMemo(() => {
    if (!state.report || !state.user) return null;
    return processReportData(state.report, state.user);
  }, [state.report, state.user]);
  
  // Handle role-based redirects (preserve existing logic)
  useEffect(() => {
    if (!loading && state.user?.role === 'department' && id) {
      if (!location.pathname.endsWith('/edit-markdown')) {
        navigate(`/reports/${id}/preview2`, { replace: true });
      }
    }
  }, [loading, state.user, id, navigate, location.pathname]);
  
  if (loading) return <ReportEditSkeleton />;
  if (error) return <ErrorDisplay error={error} />;
  if (!state.report || !state.user) return <NotFoundDisplay />;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header from Engineer A */}
      <ReportManagementHeader
        report={state.report}
        user={state.user}
        onPreviewClick={(mode) => handlePreviewNavigation(mode)}
        onExportClick={handleExport}
        onShareClick={handleShare}
        onBackClick={() => navigate('/dashboard')}
        isAutoSaving={state.autoSave.isSaving}
        lastSaved={state.autoSave.lastSaved}
      />
      
      {/* Tab Navigation from Engineer A */}
      <ReportManagementTabs
        activeTab={state.activeTab}
        onTabChange={actions.setActiveTab}
        sectionCount={processedData?.completionStats.totalSections || 0}
        completedSections={processedData?.completionStats.completedSections || 0}
        hasUnsavedChanges={state.autoSave.hasUnsavedChanges}
      />
      
      {/* Tab Content */}
      <div className="container mx-auto px-4 py-6">
        {state.activeTab === 'overview' && (
          <OverviewTab
            report={state.report}
            departmentProgress={processedData?.departmentProgress || []}
            completionStats={processedData?.completionStats}
            onDepartmentClick={handleDepartmentClick}
            onQuickAction={handleQuickAction}
          />
        )}
        
        {state.activeTab === 'sections' && (
          <SectionOperationsManager
            reportId={id!}
            sections={state.report.sections}
            user={state.user}
            onSectionsUpdate={handleSectionsUpdate}
          >
            {(sectionOps) => (
              <SectionsTab
                sections={processedData?.sectionGroups || []}
                onToggleSection={sectionOps.toggleSection}
                onBulkOperation={actions.bulkOperations}
                onSectionAction={handleSectionAction}
              />
            )}
          </SectionOperationsManager>
        )}
        
        {state.activeTab === 'settings' && (
          <SettingsTab
            report={state.report}
            editState={state.editState.reportDetails}
            onReportDetailsChange={actions.updateReportDetails}
            onSave={actions.saveReportDetails}
            autoSaveState={state.autoSave}
          />
        )}
      </div>
    </div>
  );
};
```

---

## 🔄 Integration with Engineer A

### **Shared Data Interfaces**
```typescript
// These interfaces you'll provide to Engineer A's components
export interface SharedReportData {
  report: ReportWithSections;
  user: User;
  sections: EnhancedReportSection[];
  departmentProgress: DepartmentProgress[];
  loading: boolean;
  error: string | null;
}

export interface SharedEventHandlers {
  onTabChange: (tab: TabType) => void;
  onSectionToggle: (sectionId: string) => Promise<void>;
  onPreviewMode: (mode: PreviewMode) => void;
  onExport: () => Promise<void>;
  onShare: () => void;
  onBulkOperation: (operation: string, sectionIds: string[]) => Promise<void>;
  onReportDetailsChange: (changes: Partial<ReportDetails>) => void;
  onSaveReportDetails: () => Promise<void>;
}
```

### **State Synchronization**
```typescript
// Ensure Engineer A's components receive updated state
export const useSharedState = (reportManagementState: ReportManagementState) => {
  // Convert your internal state to format Engineer A expects
  return {
    activeTab: reportManagementState.activeTab,
    isLoading: reportManagementState.loading.report || reportManagementState.loading.user,
    autoSaveIndicators: {
      isSaving: reportManagementState.autoSave.isSaving,
      hasUnsavedChanges: reportManagementState.autoSave.hasUnsavedChanges,
      lastSaved: reportManagementState.autoSave.lastSaved,
    },
    sectionOperationStates: reportManagementState.loading.operations,
  };
};
```

---

## 🧪 Testing Requirements

### **Data Logic Testing**
```typescript
describe('useReportManagement', () => {
  it('handles report data loading correctly', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useReportManagement('test-report-id')
    );
    
    await waitForNextUpdate();
    
    expect(result.current.state.report).toBeDefined();
    expect(result.current.loading).toBe(false);
  });

  it('manages edit state properly', () => {
    const { result } = renderHook(() => useReportManagement('test-id'));
    
    act(() => {
      result.current.actions.updateReportDetails({ title: 'New Title' });
    });
    
    expect(result.current.state.editState.reportDetails.title).toBe('New Title');
    expect(result.current.state.editState.reportDetails.hasChanges).toBe(true);
  });
});
```

### **Auto-Save Testing**
```typescript
describe('Enhanced Auto-Save', () => {
  it('triggers auto-save after delay', async () => {
    const mockSave = jest.fn();
    const { result } = renderHook(() => useEnhancedAutoSave({
      onSave: mockSave,
      delay: 100,
      enabled: true,
      isDataChanged: () => true,
    }));
    
    act(() => {
      result.current.triggerAutoSave();
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });
    
    expect(mockSave).toHaveBeenCalled();
  });

  it('handles conflicts properly', async () => {
    // Test conflict detection and resolution
  });
});
```

### **API Integration Testing**
```typescript
describe('Report Management API', () => {
  it('handles bulk operations correctly', async () => {
    const mockOperation = {
      operation: 'activate',
      sectionIds: ['1', '2', '3'],
    };
    
    await performBulkSectionOperation('report-id', mockOperation);
    
    expect(mockApi.post).toHaveBeenCalledWith(
      '/reports/report-id/sections/bulk',
      mockOperation
    );
  });
});
```

---

## 📚 Resources & References

### **Existing Code to Modify**
- `src/pages/ReportEdit.tsx` - Main component (your primary responsibility)
- `src/hooks/useAutoSave.ts` - Enhance existing auto-save
- `src/lib/api/reports.ts` - Add new API functions
- `src/types/` - Add new TypeScript interfaces

### **React Patterns to Use**
- **Custom hooks** for data management and business logic
- **Render props pattern** for business logic components
- **Compound components** for complex section management
- **React Query** for API state management and caching

### **Performance Considerations**
- **Memoization**: Use useMemo/useCallback for expensive operations
- **Debouncing**: Implement for auto-save and search functionality
- **Virtual scrolling**: For large section lists
- **Optimistic updates**: Immediate UI feedback before API confirmation

---

## ✅ Definition of Done

### **Functional Requirements**
- [ ] **Tab-based state management** works correctly with proper state preservation
- [ ] **Auto-save system enhanced** with conflict resolution and better error handling
- [ ] **Bulk operations implemented** for section management
- [ ] **Real-time updates** work for collaborative editing scenarios
- [ ] **Data processing utilities** provide correct calculations for progress tracking
- [ ] **API integration** handles all new functionality requirements

### **Integration Requirements**
- [ ] **Components receive correct props** from your data management layer
- [ ] **State updates trigger UI changes** properly in Engineer A's components
- [ ] **Event handlers work correctly** between your logic and UI components
- [ ] **Error handling** is comprehensive with proper user feedback
- [ ] **Performance is optimized** with minimal unnecessary re-renders

### **Code Quality**
- [ ] **TypeScript interfaces** are properly defined and exported for Engineer A
- [ ] **Custom hooks** follow React best practices
- [ ] **Business logic** is separated from UI concerns
- [ ] **Error boundaries** handle edge cases gracefully
- [ ] **Tests cover** critical data flow and business logic

---

## 🚀 Getting Started

### **Setup Steps**
1. **Review current ReportEdit.tsx** to understand existing data flow
2. **Examine existing API functions** in `src/lib/api/reports.ts`
3. **Study auto-save implementation** in `src/hooks/useAutoSave.ts`
4. **Set up testing environment** for data logic testing
5. **Coordinate with Engineer A** on shared interface definitions

### **Development Workflow**
1. **Create data management hooks** with proper TypeScript interfaces
2. **Implement enhanced auto-save** with better conflict handling
3. **Build business logic components** using render props pattern
4. **Integrate with existing API** and add new endpoints
5. **Test data flow** and business logic thoroughly
6. **Coordinate with Engineer A** for final integration

### **Daily Standup Points**
- Progress on data architecture and state management
- API integration challenges and solutions
- Coordination points with Engineer A
- Performance optimization discoveries
- Testing results and bug fixes

---

**Ready to start? Begin with Task B1 (useReportManagement hook) and coordinate with Engineer A on shared interfaces!**

**Last Updated**: 2025-06-24  
**Next Review**: Daily during development  
**Contact**: Coordinate with Engineer A for UI integration points