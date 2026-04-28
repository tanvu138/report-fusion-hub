import { test, expect } from '@playwright/test';
import { navigateAndWait, checkBasicAccessibility } from '../helpers/common';

test.describe('Home Page', () => {
  test('should display homepage correctly', async ({ page }) => {
    await navigateAndWait(page, '/');
    
    // Check main heading
    await expect(page.getByRole('heading', { name: /TPG Reports/i })).toBeVisible();
    
    // Check key features section
    await expect(page.getByText(/collaborative/i)).toBeVisible();
    await expect(page.getByText(/role-based access/i)).toBeVisible();
    
    // Check navigation is present
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('should navigate to login from get started button', async ({ page }) => {
    await navigateAndWait(page, '/');
    
    // Find and click the get started link
    const getStartedLink = page.getByRole('link', { name: /get started/i });
    await expect(getStartedLink).toBeVisible();
    await getStartedLink.click();
    
    // Should navigate to login page
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });

  test('should navigate to login from header', async ({ page }) => {
    await navigateAndWait(page, '/');
    
    // Click login button in header
    const loginButton = page.getByRole('link', { name: /login/i });
    await expect(loginButton).toBeVisible();
    await loginButton.click();
    
    await expect(page).toHaveURL('/login');
  });

  test('should have proper accessibility structure', async ({ page }) => {
    await navigateAndWait(page, '/');
    
    // Check for proper ARIA landmarks
    await expect(page.getByRole('banner')).toBeVisible(); // header
    await expect(page.getByRole('main')).toBeVisible(); // main content
    await expect(page.getByRole('contentinfo')).toBeVisible(); // footer
    
    // Check basic accessibility
    await checkBasicAccessibility(page);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateAndWait(page, '/');
    
    // Check that main content is visible
    await expect(page.getByRole('heading', { name: /TPG Reports/i })).toBeVisible();
    
    // Check that navigation is accessible (might be in a mobile menu)
    const loginLink = page.getByRole('link', { name: /login/i });
    await expect(loginLink).toBeVisible();
  });
});
