import { Page, expect } from '@playwright/test';

export interface TestUser {
  username: string;
  password: string;
  role: 'secretary' | 'department';
  name: string;
}

export const TEST_USERS: Record<string, TestUser> = {
  secretary: {
    username: 'admin',
    password: 'admin123',
    role: 'secretary',
    name: 'Admin User'
  },
  department: {
    username: 'department',
    password: 'dept123',
    role: 'department',
    name: 'Department User'
  }
};

/**
 * Login helper that handles the login flow
 */
export async function login(page: Page, user: TestUser) {
  // Navigate to login page
  await page.goto('/login');
  
  // Wait for the login form to be visible
  await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  
  // Fill in login credentials  
  await page.getByLabel(/username/i).fill(user.username);
  await page.getByLabel(/password/i).fill(user.password);
  
  // Submit the form
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for successful login (redirect to dashboard)
  await expect(page).toHaveURL('/dashboard');
  
  // Verify user is logged in by checking for dashboard content
  // Dashboard indicates successful login and redirect
  await expect(page.getByRole('heading', { name: /reports dashboard/i })).toBeVisible();
}

/**
 * Login as secretary user
 */
export async function loginAsSecretary(page: Page) {
  await login(page, TEST_USERS.secretary);
}

/**
 * Login as department user
 */
export async function loginAsDepartment(page: Page) {
  await login(page, TEST_USERS.department);
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  await page.getByRole('button', { name: /logout/i }).click();
  
  // Should redirect to home page after logout
  await expect(page).toHaveURL('/');
  
  // Verify logout by checking for login button
  await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
}

/**
 * Check if user is currently logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible({ timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}