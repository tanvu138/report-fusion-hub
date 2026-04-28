/**
 * Reports API Service
 * 
 * This module provides functions for report-related API calls:
 * - List reports
 * - Get report details
 * - Create new reports
 * - Update report details
 */

import { api } from '../api';

// Types
export interface Report {
  id: string;
  title: string;
  description?: string; // Added optional description
  cycle: 'WEEKLY' | 'MONTHLY' | 'ADHOC';
  state: 'DRAFT' | 'PUBLISHED';
  dueAt?: string; // Report due date
  createdAt: string;
  updatedAt: string;
  _count?: {
    sections: number;
  };
  sections?: ReportSection[]; // Added optional sections to include when available
  _progress?: {
    total: number;
    submitted: number;
    active: number;
  };
}

export interface ReportFilters {
  page?: number;
  limit?: number;
  state?: 'DRAFT' | 'PUBLISHED' | 'FINAL';
  cycle?: 'WEEKLY' | 'MONTHLY' | 'ADHOC';
}

export interface ReportWithSections extends Report {
  sections: ReportSection[];
}

export interface ReportSection {
  id: string;
  reportId: string;
  templateId?: string;
  isActive: boolean;
  contentMarkdown: string | null;
  state: 'DRAFT' | 'SUBMITTED';
  locked: boolean;
  sectionName: string;
  instructions?: string | null;
  departmentId: string;
  displayOrder: number;
  dueAt?: string | null;
  submittedAt?: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
  template?: {
    id: string;
    key: string;
    displayName: string;
    departmentId: string;
    department: {
      id: string;
      name: string;
    };
  };
  department?: {
    id: string;
    name: string;
  };
  updatedBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export interface CreateReportData {
  title: string;
  cycle: 'WEEKLY' | 'MONTHLY' | 'ADHOC';
}

export interface UpdateReportData {
  title?: string;
  description?: string; // Added description
  cycle?: 'WEEKLY' | 'MONTHLY' | 'ADHOC';
  state?: 'DRAFT' | 'PUBLISHED';
  sections?: Array<{
    id: string;
    isActive: boolean;
    displayOrder: number;
  }>;
}

export interface PaginatedResponse<T> {
  reports: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Get a list of reports with optional filtering
 */
export const getReports = async (filters: ReportFilters = {}): Promise<PaginatedResponse<Report>> => {
  // Build query string from filters
  const queryParams = new URLSearchParams();
  if (filters.page) queryParams.append('page', filters.page.toString());
  if (filters.limit) queryParams.append('limit', filters.limit.toString());
  if (filters.state) queryParams.append('state', filters.state);
  if (filters.cycle) queryParams.append('cycle', filters.cycle);
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return api.get<PaginatedResponse<Report>>(`/api/reports${queryString}`);
};

/**
 * Get a report by ID with its sections
 */
export const getReportById = async (id: string): Promise<ReportWithSections> => {
  return api.get<ReportWithSections>(`/api/reports/${id}`);
};

/**
 * @deprecated Use createReportFromTemplate or createCustomReport instead.
 */
// Create a new report (old method)
export const createReport = async (payload: CreateReportData): Promise<Report> => {
  return api.post<Report>('/api/reports', payload);
};

// Create a report from a template
export interface CreateReportFromTemplatePayload {
  title: string;
  cycle: 'WEEKLY' | 'MONTHLY' | 'ADHOC';
  description?: string;
  dueAt?: string; // Or Date, ensure consistency with backend and UI
}

export const createReportFromTemplate = async (templateId: string, payload: CreateReportFromTemplatePayload): Promise<Report> => {
  return api.post<Report>(`/api/reports/from-template/${templateId}`, payload);
};

export interface CustomReportSectionPayload {
  sectionName: string;
  departmentId: string;
  instructions?: string;
  displayOrder: number;
}

export interface CreateCustomReportPayload {
  title: string;
  cycle: 'WEEKLY' | 'MONTHLY' | 'ADHOC';
  description?: string;
  sections?: CustomReportSectionPayload[]; // Optional: sections can be added later
}

// Create a custom report (without a template)
export const createCustomReport = async (payload: CreateCustomReportPayload): Promise<Report> => {
  return api.post<Report>('/api/reports/custom', payload);
};

/**
 * Update an existing report
 */
export const updateReport = async (id: string, data: UpdateReportData): Promise<Report> => {
  return api.put<Report>(`/api/reports/${id}`, data);
};

/**
 * Get all sections for a report
 */
export const getReportSections = async (reportId: string): Promise<ReportSection[]> => {
  return api.get<ReportSection[]>(`/api/reports/${reportId}/sections`);
};

/**
 * Update section content
 */
export const updateSectionContent = async (
  reportId: string, 
  sectionId: string, 
  contentMarkdown: string
): Promise<ReportSection> => {
  return api.put<ReportSection>(
    `/api/reports/${reportId}/sections/${sectionId}`, 
    { contentMarkdown }
  );
};

/**
 * Toggle section activation status
 */
export const toggleSectionActive = async (
  reportId: string,
  sectionId: string,
  isActive: boolean
): Promise<ReportSection> => {
  return api.patch<ReportSection>(
    `/api/reports/${reportId}/sections/${sectionId}/active`,
    { isActive }
  );
};

/**
 * Delete a report
 */
export const deleteReport = async (id: string): Promise<void> => {
  await api.delete(`/api/reports/${id}`);
};

/**
 * Export report as PDF
 */
export const exportReportPdf = async (reportId: string, filename?: string): Promise<void> => {
  const endpoint = `/api/reports/${reportId}/export/pdf`;
  const finalEndpoint = filename ? `${endpoint}?filename=${encodeURIComponent(filename)}` : endpoint;
  await api.download(finalEndpoint, filename);
};
