import { test, expect } from '@playwright/test';
import { login, logout, TEST_USERS, loginAsSecretary, loginAsDepartment } from '../helpers/auth';
import { navigateAndWait, waitForToast, fillFormField } from '../helpers/common';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start from login page for most tests
    await navigateAndWait(page, '/login');
  });

  test('should display login form correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    
    // Check demo accounts section if present
    const demoSection = page.getByText(/demo accounts/i);
    if (await demoSection.isVisible()) {
      await expect(demoSection).toBeVisible();
    }
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should stay on login page and show validation
    await expect(page).toHaveURL('/login');
    
    // Check for HTML5 validation or custom error messages
    const usernameField = page.getByLabel(/username/i);
    const passwordField = page.getByLabel(/password/i);
    
    await expect(usernameField).toHaveAttribute('required');
    await expect(passwordField).toHaveAttribute('required');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await fillFormField(page, /username/i, 'invalid@example.com');
    await fillFormField(page, /password/i, 'wrongpassword');
    
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show error message
    await waitForToast(page, /invalid.*username.*password/i);
  });

  test('should login successfully with secretary credentials', async ({ page }) => {
    await login(page, TEST_USERS.secretary);
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should show dashboard heading specifically
    await expect(page.getByRole('heading', { name: /reports dashboard/i })).toBeVisible();
  });

  test('should login successfully with department credentials', async ({ page }) => {
    await login(page, TEST_USERS.department);
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should NOT show admin navigation
    await expect(page.getByRole('link', { name: /manage departments/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /manage users/i })).not.toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await loginAsSecretary(page);
    await logout(page);
    
    // Should be redirected to home page
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
  });

  test('should redirect to login when accessing protected route while logged out', async ({ page }) => {
    await navigateAndWait(page, '/dashboard');
    
    // Should be redirected to login or show login form
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });

  test('should persist login across page refreshes', async ({ page }) => {
    await loginAsSecretary(page);
    
    // Refresh the page
    await page.reload();
    
    // Should still be logged in
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  });

  test('should handle session expiry gracefully', async ({ page }) => {
    await loginAsSecretary(page);
    
    // Simulate session expiry by clearing localStorage
    await page.evaluate(() => {
      localStorage.removeItem('token');
      sessionStorage.clear();
    });
    
    // Try to navigate to a protected route
    await navigateAndWait(page, '/admin/departments');
    
    // Should be redirected to login
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });

  test('should show user info in header when logged in', async ({ page }) => {
    await loginAsSecretary(page);
    
    // Should show logout button (always visible indicator of logged in state)
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
    
    // User info might be hidden on mobile, but check on desktop viewports
    await page.setViewportSize({ width: 1280, height: 720 });
    const userInfo = page.getByText(TEST_USERS.secretary.name).or(
      page.getByText(TEST_USERS.secretary.username)
    );
    await expect(userInfo).toBeVisible();
  });
});