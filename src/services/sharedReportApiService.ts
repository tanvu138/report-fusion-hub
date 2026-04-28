import { api, API_URL } from '@/lib/api';
import { Report } from '@/types/report';

export async function createShareLink(reportId: string, accessLevel: 'VIEW' | 'COMMENT', expiresAt?: Date) {
  return api.post<{ shareId: string; url: string; code: string }>(
    `/api/reports/${reportId}/share`,
    {
      accessLevel,
      expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
    }
  );
}

export async function listShareLinks(reportId: string) {
  return api.get<SharedLink[]>(`/api/reports/${reportId}/shared-links`);
}

export async function revokeShareLink(shareId: string) {
  await api.delete(`/api/reports/shared-reports/${shareId}`);
}

export async function regenerateShareCode(shareId: string) {
  return api.put<{ shareId: string; code: string }>(`/api/reports/shared-reports/${shareId}/regenerate-code`);
}

export async function fetchSharedSnapshot(shareId: string, code: string) {
  return api.get<Report>(`${API_URL}/public/shared-reports/${shareId}`, {
    headers: { 'X-Code': code },
    // no credentials required
    credentials: 'omit',
  });
}

export interface SharedLink {
  id: string;
  reportId: string;
  accessLevel: 'VIEW' | 'COMMENT';
  code: string; // Now included in response
  expiresAt: string | null;
  createdById: string;
  createdAt: string;
}
