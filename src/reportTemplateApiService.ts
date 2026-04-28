// API service for Report Templates
import { api } from '@/lib/api';
import { Department } from './departmentApiService';

// Types and Interfaces
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ReportTemplateSection {
  id?: string; // Optional for creation
  templateId?: string; // Optional for creation
  sectionName: string;
  instructions?: string;
  departmentId: string;
  department?: Department; // Included in responses
  displayOrder: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  createdBy?: User;
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  sections: ReportTemplateSection[];
  department?: Department; // Add department to the main template object
}

export interface CreateReportTemplatePayload {
  name: string;
  description?: string;
  sections: Omit<ReportTemplateSection, 'id' | 'templateId' | 'department'>[];
}

export interface UpdateReportTemplatePayload {
  name?: string;
  description?: string;
  sections?: Omit<ReportTemplateSection, 'id' | 'templateId' | 'department'>[];
}

// Template Preview format
export interface TemplatePreview {
  templateName: string;
  description?: string;
  sections: {
    sectionName: string;
    department: string;
    instructions?: string;
    order: number;
  }[];
}

/**
 * Fetch all active report templates
 */
export const fetchReportTemplates = async (): Promise<ReportTemplate[]> => {
  return api.get<ReportTemplate[]>('/api/report-templates');
};

/**
 * Fetch a single report template by ID
 */
export const fetchReportTemplateById = async (id: string): Promise<ReportTemplate> => {
  return api.get<ReportTemplate>(`/api/report-templates/${id}`);
};

/**
 * Preview a report template's structure
 */
export const previewReportTemplate = async (id: string): Promise<TemplatePreview> => {
  return api.get<TemplatePreview>(`/api/report-templates/${id}/preview`);
};

/**
 * Create a new report template
 */
export const createReportTemplate = async (
  data: CreateReportTemplatePayload
): Promise<ReportTemplate> => {
  return api.post<ReportTemplate>('/api/report-templates', data);
};

/**
 * Update an existing report template
 */
export const updateReportTemplate = async (
  id: string,
  data: UpdateReportTemplatePayload
): Promise<ReportTemplate> => {
  return api.put<ReportTemplate>(`/api/report-templates/${id}`, data);
};

/**
 * Delete (deactivate) a report template
 */
export const deleteReportTemplate = async (id: string): Promise<void> => {
  return api.delete<void>(`/api/report-templates/${id}`);
};

/**
 * Duplicate a report template
 */
export const duplicateReportTemplate = async (id: string): Promise<ReportTemplate> => {
  return api.post<ReportTemplate>(`/api/report-templates/${id}/duplicate`, {});
};
