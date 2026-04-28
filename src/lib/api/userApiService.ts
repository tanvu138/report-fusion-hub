import { api } from './index'; // Imports the api object from src/lib/api/index.ts
import type { Department } from '../../departmentApiService';

// Corresponds to UserRole enum in Prisma schema
export enum UserRole {
  SECRETARY = 'secretary',
  DEPARTMENT = 'department',
  // Add other roles if they exist
}

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string | null;
  role: UserRole;
  departmentId?: string | null;
  department?: Pick<Department, 'id' | 'name'> | null; // For displaying department name
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  username: string;
  name: string;
  email?: string;
  password?: string; // Optional: backend generates if not provided
  role: UserRole;
  departmentId?: string | null;
}

export interface CreateUserResponse {
  user: User;
  initialPassword?: string; // Sent if backend generated the password
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  role?: UserRole;
  departmentId?: string;
}

export interface PaginatedUsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

const BASE_URL = '/api/users'; // As defined in server/routes/users.js

export interface UpdateUserDto {
  name?: string;
  email?: string; // Optional, but if provided, should be validated
  role?: UserRole;
  departmentId?: string | null; // Nullable if role is not 'department'
  password?: string; // Optional: send to update password when admin inputs
}

export const userService = {
  async createUser(userData: CreateUserDto): Promise<CreateUserResponse> {
    return api.post<CreateUserResponse>(`${BASE_URL}`, userData);
  },

  async getUsers(params: GetUsersParams = {}): Promise<PaginatedUsersResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.search) queryParams.append('search', params.search);
    if (params.role) queryParams.append('role', params.role);
    if (params.departmentId) queryParams.append('departmentId', params.departmentId);

    const queryString = queryParams.toString();
    const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;

    return api.get<PaginatedUsersResponse>(url, {}); // Pass empty object for options if not needed
  },

  async updateUser(userId: string, userData: UpdateUserDto): Promise<User> {
    return api.put<User>(`${BASE_URL}/${userId}`, userData);
  },

  async getUserById(userId: string): Promise<User> {
    return api.get<User>(`${BASE_URL}/${userId}`);
  },

  async deleteUser(userId: string): Promise<void> {
    return api.delete<void>(`${BASE_URL}/${userId}`);
  },
  // Placeholder for future methods
  // async deleteUser(userId: string): Promise<void> { ... }
};
