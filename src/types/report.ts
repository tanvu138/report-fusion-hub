// /Users/luan/repos/report-fusion-hub/src/types/report.ts

/**
 * Represents the state of a report section.
 */
export enum SectionState {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
}

/**
 * Represents the state of a full report.
 */
export enum ReportState {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  FINAL = 'FINAL',
}

/**
 * Represents a single section within a report.
 * Based on existing mock data and potential backend fields.
 */
export interface ReportSection {
  id: string;
  templateId?: string; // From original mock
  reportTemplateSection?: { // For more detailed template info
    id: string;
    name: string;
    departmentId?: string;
  };
  key?: string; // From SectionTemplate model
  displayName?: string; // Primary display name
  sectionName?: string; // Alternative from mock
  isActive: boolean;
  contentMarkdown: string | null;
  departmentId?: string; // Can be directly on section or via reportTemplateSection
  state?: SectionState | string; // Allow string for flexibility if enum not strictly enforced everywhere
  updatedById?: string;
  submittedAt?: string | Date;
  dueAt?: string | Date;
  displayOrder?: number;
  locked?: boolean;
  report: { // Stub for the parent report, crucial for checking its state
    id: string;
    state: ReportState | string;
  };
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  // Consider adding 'updatedBy' user stub if needed for display
}

/**
 * Represents a full report.
 * Based on existing mock data and potential backend fields.
 */
// Simplified User interface, often used for 'createdBy' or 'updatedBy' fields
export interface ReportUser {
  id: string;
  name: string;
  email?: string;
  role: 'secretary' | 'department'; // Or a more general string if roles can vary
}

export interface Report {
  id: string;
  title: string;
  description?: string;
  cycle: 'WEEKLY' | 'MONTHLY' | 'ADHOC' | string; // Allow string for flexibility
  state: ReportState | string; // Allow string for flexibility
  createdAt: string | Date;
  dueAt?: string | Date;
  finalizedAt?: string | Date;
  sections: ReportSection[];
  // Potential additional fields from backend if needed for preview
  // e.g., createdBy, updatedBy
}
