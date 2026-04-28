import { api } from '../api'; // Correctly imports the api object (with .get, .post, etc.)
import { Department } from '../../departmentApiService'; // Corrected path
import { User } from './userApiService'; // Corrected type name, path is to src/lib/api/userApiService.ts

// ---------------------------------------
// Interfaces
// ---------------------------------------

// Generic API Response structure
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
  details?: any; // For more detailed error messages from backend
}

export enum ReportCycle {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ADHOC = 'ADHOC',
}

export enum ReportState {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  FINAL = 'FINAL',
}

export enum SectionState {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
}

export interface ReportSection {
  id: string;
  reportId: string;
  // templateId: string; // If using ReportTemplateSection, this might be nested
  sectionName: string; // From ReportTemplateSection or custom
  sectionKey?: string; // From ReportTemplateSection or custom
  contentMarkdown: string | null;
  isActive: boolean;
  state: SectionState;
  dueAt: string | null; // ISO Date string
  submittedAt: string | null; // ISO Date string
  locked: boolean;
  displayOrder: number;
  departmentId: string;
  department?: Department; // Optional: populated by include
  updatedById: string | null;
  updatedBy?: Pick<User, 'id' | 'name'>; // Optional: populated by include
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  // If using ReportTemplateSection as a direct relation for template info:
  reportTemplateSection?: {
    id: string;
    sectionName: string;
    sectionKey?: string;
  };
}

export interface Report {
  id: string;
  title: string;
  description: string | null;
  cycle: ReportCycle;
  state: ReportState;
  dueAt: string | null; // ISO Date string
  finalizedAt: string | null; // ISO Date string
  isDeleted: boolean;
  sections: ReportSection[];
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  // createdById: string; // If needed
  // createdBy?: UserProfile; // If needed
}

export interface UpdateFullReportPayload {
  sectionsData: Array<{ id: string; contentMarkdown: string }>;
}

// ---------------------------------------
// API Calls
// ---------------------------------------

/**
 * Updates the content of multiple sections in a report.
 * Requires 'secretary' role.
 * @param reportId The ID of the report to update.
 * @param payload The data containing section IDs and their new markdown content.
 * @returns The updated report.
 */
export const updateFullReportContent = async (
  reportId: string,
  payload: UpdateFullReportPayload
): Promise<ApiResponse<Report>> => {
  if (!reportId) {
    // This basic client-side check can remain, but the primary validation is on the server.
    return { success: false, error: 'Report ID is required.', data: null };
  }
  try {
    // Use api.put which internally uses apiRequest and handles JSON stringification
    const responseData = await api.put<Report>(`/api/reports/${reportId}/full-content`, payload);
    return { success: true, data: responseData };
  } catch (error: any) {
    // The api.put (via apiRequest) should throw an ApiError which includes status and details
    // Or it could be a generic error if something else went wrong before/after the fetch call.
    console.error('updateFullReportContent failed:', error);
    return {
      success: false,
      data: null,
      error: error.message || 'An unknown error occurred while updating the report.',
      details: error.details, // Capture details from ApiError if present
    };
  }
};

/**
 * Fetches a single report by its ID, including its sections.
 * @param reportId The ID of the report to fetch.
 * @returns The report data.
 */
export const getReportById = async (reportId: string): Promise<ApiResponse<Report>> => {
  if (!reportId) {
    return { success: false, error: 'Report ID is required.', data: null };
  }
  try {
    const responseData = await api.get<Report>(`/api/reports/${reportId}`);
    return { success: true, data: responseData };
  } catch (error: any) {
    console.error(`getReportById for ${reportId} failed:`, error);
    return {
      success: false,
      data: null,
      error: error.message || 'An unknown error occurred while fetching the report.',
      details: error.details,
    };
  }
};

// TODO: Add other report API functions here as needed (getReports, etc.)

// Report API Service initialized
