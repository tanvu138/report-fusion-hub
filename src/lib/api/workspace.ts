/**
 * Workspace API Service
 *
 * Personal workspace note CRUD operations.
 */
import { api } from '../api';

export interface WorkspaceSection {
  id: string;
  reportId: string;
  sectionName: string;
  contentMarkdown: string | null;
  displayOrder: number;
  isActive: boolean;
  updatedAt: string;
}

export interface WorkspaceReport {
  id: string;
  title: string;
  description?: string;
  type: 'PERSONAL';
  state: 'DRAFT';
  createdAt: string;
  updatedAt: string;
  sections: WorkspaceSection[];
}

export const listWorkspaceReports = (): Promise<WorkspaceReport[]> =>
  api.get('/api/workspace/reports');

export const getWorkspaceReport = (id: string): Promise<WorkspaceReport> =>
  api.get(`/api/workspace/reports/${id}`);

export const createWorkspaceReport = (payload: {
  title: string;
  description?: string;
}): Promise<WorkspaceReport> =>
  api.post('/api/workspace/reports', payload);

export const updateWorkspaceReport = (id: string, payload: {
  title?: string;
  description?: string;
}): Promise<WorkspaceReport> =>
  api.put(`/api/workspace/reports/${id}`, payload);

export const updateWorkspaceContent = (id: string, payload: {
  contentMarkdown: string;
}): Promise<{ success: boolean }> =>
  api.put(`/api/workspace/reports/${id}/content`, payload);

export const deleteWorkspaceReport = (id: string): Promise<void> =>
  api.delete(`/api/workspace/reports/${id}`);
