/**
 * Shared TypeScript interfaces for ReportEdit UX Redesign
 * 
 * These interfaces are shared between Engineer A (UI) and Engineer B (Logic)
 * to ensure type safety and consistency across the new tab-based interface.
 * 
 * Created: 2025-06-24
 * Engineer: B (Logic/Components)
 */

import type { ReportWithSections, ReportSection } from '@/lib/api/reports';
import type { User } from '@/lib/api/auth';

// ============================================================================
// CORE STATE INTERFACES
// ============================================================================

export type TabType = 'content' | 'settings';

export interface ReportManagementState {
  // Core data
  report: ReportWithSections | null;
  user: User | null;

  // UI state
  activeTab: TabType;
  loading: {
    report: boolean;
    user: boolean;
    saving: boolean;
    operations: Set<string>;
  };
  
  // Edit state
  editState: {
    reportDetails: ReportDetailsEditState;
    sections: Map<string, SectionEditState>;
  };
  
  // Auto-save state
  autoSave: AutoSaveState;
  
  // Error state
  error: string | null;
}

export interface ReportDetailsEditState {
  title: string;
  description: string;
  cycle: 'WEEKLY' | 'MONTHLY' | 'ADHOC' | '';
  state?: 'DRAFT' | 'PUBLISHED';
  hasChanges: boolean;
}

export interface SectionEditState {
  content: string;
  hasChanges: boolean;
  isEditing: boolean;
  lastSaved: Date | null;
}

export interface AutoSaveState {
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  lastAttempt: Date | null;
  retryCount: number;
  errors: AutoSaveError[];
  conflicts: ConflictData[];
  status: 'idle' | 'pending' | 'saving' | 'success' | 'error';
}

export interface AutoSaveError {
  message: string;
  timestamp: Date;
  type: 'network' | 'validation' | 'conflict' | 'unknown';
  retryable: boolean;
}

export interface ConflictData {
  field: string;
  localValue: any;
  serverValue: any;
  timestamp: Date;
  resolved: boolean;
  resolution?: 'local' | 'server' | 'merged';
}

// ============================================================================
// DATA PROCESSING INTERFACES
// ============================================================================

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
  lastActivity: Date | null;
  progressPercentage: number;
  status: 'complete' | 'in-progress' | 'not-started' | 'overdue';
}

export interface DepartmentSectionGroup {
  department: {
    id: string;
    name: string;
  };
  sections: EnhancedReportSection[];
  progress: DepartmentProgress;
}

export interface EnhancedReportSection extends ReportSection {
  progress: SectionProgress;
  isOverdue: boolean;
  canEdit: boolean;
  canToggle: boolean;
}

export interface SectionProgress {
  status: 'complete' | 'in-progress' | 'not-started' | 'unknown';
  completion: number; // 0-100
  lastUpdated: string | null;
  wordCount: number;
}

export interface CompletionStats {
  totalSections: number;
  completedSections: number;
  inProgressSections: number;
  overdueCount: number;
  completionPercentage: number;
  estimatedCompletion: Date | null;
}

export interface OverdueAlert {
  sectionId: string;
  sectionName: string;
  departmentName: string;
  dueDate: Date;
  daysPastDue: number;
  severity: 'low' | 'medium' | 'high';
}

// ============================================================================
// ACTION INTERFACES
// ============================================================================

export interface ReportManagementActions {
  // Tab navigation
  setActiveTab: (tab: TabType) => void;

  // Report details editing
  updateReportDetails: (changes: Partial<ReportDetailsEditState>) => void;
  saveReportDetails: () => Promise<void>;

  // Auto-save control
  triggerManualSave: () => Promise<void>;
  clearAutoSaveErrors: () => void;
}

// ============================================================================
// EVENT HANDLER INTERFACES
// ============================================================================

export interface SharedEventHandlers {
  onTabChange: (tab: TabType) => void;
  onExport: () => Promise<void>;
  onShare: () => void;
  onReportDetailsChange: (changes: Partial<ReportDetailsEditState>) => void;
  onSaveReportDetails: () => Promise<void>;
}

// ============================================================================
// COMPONENT PROP INTERFACES
// ============================================================================




// ============================================================================
// API INTERFACES
// ============================================================================

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

export interface OverdueSection {
  sectionId: string;
  sectionName: string;
  departmentId: string;
  departmentName: string;
  dueDate: Date;
  daysPastDue: number;
}

// ============================================================================
// UTILITY INTERFACES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ConflictResolutionStrategy {
  type: 'overwrite' | 'merge' | 'prompt';
  autoResolve?: boolean;
  mergeFunction?: (local: any, server: any) => any;
}

export interface ReminderOptions {
  message?: string;
  urgency?: 'low' | 'medium' | 'high';
  deadline?: Date;
}

export type DepartmentStatus = 
  | 'complete' 
  | 'in-progress' 
  | 'not-started' 
  | 'overdue' 
  | 'no-sections' 
  | 'unknown';

// ============================================================================
// RENDER PROPS INTERFACES
// ============================================================================

export interface DepartmentManagerRenderProps {
  sendReminder: (departmentId: string, options?: ReminderOptions) => Promise<void>;
  getDepartmentStatus: (departmentId: string) => DepartmentStatus;
  bulkAssignSections: (departmentId: string, sectionIds: string[]) => Promise<void>;
  exportDepartmentData: (departmentId: string) => Promise<Blob>;
}

export interface SectionOperationsRenderProps {
  toggleSection: (sectionId: string) => Promise<void>;
  reorderSections: (newOrder: string[]) => Promise<void>;
  bulkToggle: (sectionIds: string[], active: boolean) => Promise<void>;
  duplicateSection: (sectionId: string) => Promise<ReportSection>;
  getSectionProgress: (sectionId: string) => SectionProgress;
  validateSectionOrder: (order: string[]) => ValidationResult;
}

// ============================================================================
// SHARED STATE INTERFACES
// ============================================================================

export interface SharedReportData {
  report: ReportWithSections;
  user: User;
  sections: EnhancedReportSection[];
  departmentProgress: DepartmentProgress[];
  loading: boolean;
  error: string | null;
}

export interface SharedStateSync {
  activeTab: TabType;
  isLoading: boolean;
  autoSaveIndicators: {
    isSaving: boolean;
    hasUnsavedChanges: boolean;
    lastSaved: Date | null;
  };
  sectionOperationStates: Set<string>;
}

// ============================================================================
// ACTIVITY TRACKING INTERFACES
// ============================================================================

export interface ActivityItem {
  id: string;
  type: 'section_update' | 'section_submit' | 'report_update' | 'reminder_sent' | 'status_change';
  sectionId?: string;
  sectionName?: string;
  departmentId?: string;
  departmentName?: string;
  userId: string;
  userName: string;
  timestamp: Date;
  description: string;
  metadata?: {
    oldValue?: any;
    newValue?: any;
    wordCount?: number;
    [key: string]: any;
  };
}

export interface ActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
  maxItems?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export interface ActivityFilter {
  type?: ActivityItem['type'];
  departmentId?: string;
  userId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// ============================================================================
// ANALYTICS INTERFACES
// ============================================================================

export interface AnalyticsData {
  completionTrends: CompletionTrend[];
  departmentPerformance: DepartmentPerformanceMetrics[];
  timeMetrics: TimeMetrics;
  bottlenecks: BottleneckInsight[];
  progressPrediction: ProgressPrediction | null;
}

export interface CompletionTrend {
  date: string;
  totalSections: number;
  completedSections: number;
  completionPercentage: number;
  departmentData: DepartmentTrendData[];
}

export interface DepartmentTrendData {
  departmentId: string;
  departmentName: string;
  completed: number;
  total: number;
  percentage: number;
}

export interface DepartmentPerformanceMetrics {
  departmentId: string;
  departmentName: string;
  avgCompletionTime: number; // in days
  onTimeCompletionRate: number; // percentage
  currentVelocity: number; // sections per day
  efficiencyScore: number; // 0-100
  trendDirection: 'improving' | 'stable' | 'declining';
  lastActivity: Date | null;
}

export interface TimeMetrics {
  averageCompletionTime: number; // in days
  medianCompletionTime: number;
  fastestCompletion: number;
  slowestCompletion: number;
  onTimeRate: number; // percentage
  overdueRate: number; // percentage
}

export interface BottleneckInsight {
  type: 'department' | 'section' | 'workflow';
  identifier: string;
  name: string;
  description: string;
  impactLevel: 'low' | 'medium' | 'high';
  affectedSections: number;
  suggestedActions: string[];
  timeSinceDetection: number; // in days
}

export interface ProgressPrediction {
  estimatedCompletionDate: Date;
  confidence: number; // 0-1
  basedOnTrend: boolean;
  remainingWork: number; // number of sections
  dailyVelocity: number; // sections per day
  riskFactors: string[];
  recommendations: string[];
}

export interface AnalyticsExportData {
  reportId: string;
  reportTitle: string;
  exportDate: Date;
  analytics: AnalyticsData;
  summary: AnalyticsSummary;
}

export interface AnalyticsSummary {
  totalSections: number;
  completedSections: number;
  completionPercentage: number;
  overdueCount: number;
  averageCompletionTime: number;
  topPerformingDepartment: string;
  needsAttentionDepartment: string;
  keyInsights: string[];
}

export interface AnalyticsConfig {
  enableTrends: boolean;
  enablePerformanceMetrics: boolean;
  enableBottleneckDetection: boolean;
  enableProgressPrediction: boolean;
  trendPeriodDays: number;
  refreshIntervalMinutes: number;
}