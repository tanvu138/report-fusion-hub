import { api } from '../api';

// Simplified User interface for report section context
export interface ReportUser {
  id: string;
  name: string;
  email?: string;
  role: 'secretary' | 'department';
}

// Simplified Department interface for report section context
export interface ReportDepartment {
  id: string;
  name: string;
}

// Simplified Report interface for nested report details in ReportSection
export interface ReportStub {
  id: string;
  state: 'DRAFT' | 'PUBLISHED' | 'FINAL';
}

// Interface for a Report Section, matching backend response
export interface ReportSection {
  id: string;
  reportId: string;
  templateId?: string; // Assuming this might be part of the section
  departmentId: string;
  department: ReportDepartment;
  key?: string; // From SectionTemplate
  displayName?: string; // From SectionTemplate
  contentMarkdown: string | null;
  isActive: boolean;
  state: 'DRAFT' | 'SUBMITTED';
  locked: boolean;
  displayOrder: number;
  updatedById: string | null;
  updatedBy: ReportUser | null;
  submittedAt: string | null; // ISO date string
  dueAt: string | null; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  report: ReportStub; // Include the parent report stub
}

// Payload for updating a report section
export interface UpdateSectionPayload {
  contentMarkdown: string;
}

/**
 * Updates the content of a specific report section.
 * @param reportId The ID of the report.
 * @param sectionId The ID of the section to update.
 * @param payload The data to update the section with (e.g., new markdown content).
 * @returns A promise that resolves to the updated ReportSection.
 */
export const updateReportSection = async (
  reportId: string,
  sectionId: string,
  payload: UpdateSectionPayload
): Promise<ReportSection> => {
  try {
    const updatedSection = await api.put<ReportSection>(
      `/api/reports/${reportId}/sections/${sectionId}`,
      payload
    );
    return updatedSection;
  } catch (error) {
    // The api.put method already throws an ApiError, so we can re-throw or handle specifically
    console.error('Failed to update report section:', error);
    throw error; // Re-throw the error to be caught by the calling component
  }
};
