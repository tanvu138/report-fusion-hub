import { api } from '../api';

// Basic type definitions (consider moving to a shared types file later)
export interface Department {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name?: string | null; 
  email?: string | null;
  role?: string | null; 
}

export interface ReportTemplateSection {
  id: string;
  templateId: string;
  sectionName: string;
  instructions?: string | null;
  departmentId: string;
  department?: Department; // Optional: if populated by API
  displayOrder: number;
  // template: ReportTemplate; // Avoid circular dependency if including full template here
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string | null;
  createdById: string;
  createdBy?: User; // Optional: if populated by API
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  sections: ReportTemplateSection[];
}

export interface CreateReportTemplatePayload {
  name: string;
  description?: string;
  sections: Array<Omit<ReportTemplateSection, 'id' | 'templateId'>>;
}

export interface UpdateReportTemplatePayload {
  name?: string;
  description?: string;
  isActive?: boolean;
  sections?: Array<Partial<ReportTemplateSection> & { id?: string }>; // For adding/updating/removing sections
}

// Fetch all report templates
export const getTemplates = async (): Promise<ReportTemplate[]> => {
  return api.get<ReportTemplate[]>('/api/templates');
};

// Fetch a single report template by ID
export const getTemplateById = async (id: string): Promise<ReportTemplate> => {
  return api.get<ReportTemplate>(`/api/templates/${id}`);
};

// Create a new report template
export const createTemplate = async (payload: CreateReportTemplatePayload): Promise<ReportTemplate> => {
  return api.post<ReportTemplate>('/api/templates', payload);
};

// Update an existing report template
export const updateTemplate = async (id: string, payload: UpdateReportTemplatePayload): Promise<ReportTemplate> => {
  return api.put<ReportTemplate>(`/api/templates/${id}`, payload);
};

// Delete a report template
export const deleteTemplate = async (id: string): Promise<void> => {
  await api.delete(`/api/templates/${id}`);
};
