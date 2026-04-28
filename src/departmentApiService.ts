// NOTE: This file should be renamed to departmentApiService.ts

import { api } from '@/lib/api';

export interface Department {
  id: string;
  name: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  // Add other fields from your Prisma schema if needed
}

export interface User {
  id: string;
  username: string; // Added username
  name: string; // Assuming name is part of User, as in auth.ts
  email?: string; // Email is now optional
  role: 'secretary' | 'department'; // Assuming role is part of User
  departmentId?: string;
  // Add other fields from your Prisma schema if needed
}

export interface CreateDepartmentPayload {
  name: string;
  // User details for optional associated user
  username?: string; // Username for the new department user
  initialPassword?: string;
  email?: string; // Optional email for the new department user
}

export interface CreateDepartmentResponse {
  department: Department;
  newUser?: User;
  initialPassword?: string; // This is the generated password if one was created
}

export interface UpdateDepartmentPayload {
  name?: string;
  // Potentially other updatable fields
}

/**
 * Fetches all departments.
 */
export const fetchDepartments = async (): Promise<Department[]> => {
  return api.get<Department[]>('/api/departments');
};

/**
 * Creates a new department.
 */
export const createDepartmentApi = async (departmentData: CreateDepartmentPayload): Promise<CreateDepartmentResponse> => {
  return api.post<CreateDepartmentResponse>('/api/departments', departmentData);
};

/**
 * Fetches a single department by its ID.
 */
export const fetchDepartmentByIdApi = async (departmentId: string): Promise<Department> => {
  return api.get<Department>(`/api/departments/${departmentId}`);
};

/**
 * Updates an existing department.
 */
export const updateDepartmentApi = async (departmentId: string, departmentData: UpdateDepartmentPayload): Promise<Department> => {
  return api.put<Department>(`/api/departments/${departmentId}`, departmentData);
};

/**
 * Deletes a department by its ID.
 */
export const deleteDepartmentApi = async (departmentId: string): Promise<void> => {
  return api.delete<void>(`/api/departments/${departmentId}`);
};
