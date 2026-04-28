import { test, expect } from '@playwright/test';
import { loginAsSecretary, loginAsDepartment } from '../helpers/auth';
import { navigateAndWait, checkBasicAccessibility } from '../helpers/common';

test.describe('Navigation', () => {
  test.describe('As Secretary User', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsSecretary(page);
    });

    test('should show all navigation items for secretary', async ({ page }) => {
      // Check main navigation items
      await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /manage departments/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /report templates/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /manage users/i })).toBeVisible();
    });

    test('should navigate to departments page', async ({ page }) => {
      await page.getByRole('link', { name: /manage departments/i }).click();
      await expect(page).toHaveURL('/admin/departments');
      
      // Check breadcrumbs
      await expect(page.getByText(/manage departments/i)).toBeVisible();
    });

    test('should navigate to users page', async ({ page }) => {
      await page.getByRole('link', { name: /manage users/i }).click();
      await expect(page).toHaveURL('/admin/users');
    });

    test('should navigate to report templates page', async ({ page }) => {
      await page.getByRole('link', { name: /report templates/i }).click();
      await expect(page).toHaveURL('/admin/report-templates');
    });

    test('should show active state for current page', async ({ page }) => {
      // Dashboard should be active by default
      const dashboardLink = page.getByRole('link', { name: /dashboard/i });
      await expect(dashboardLink).toHaveAttribute('aria-current', 'page');
      
      // Navigate to departments and check active state
      await page.getByRole('link', { name: /manage departments/i }).click();
      const departmentsLink = page.getByRole('link', { name: /manage departments/i });
      await expect(departmentsLink).toHaveAttribute('aria-current', 'page');
    });
  });

  test.describe('As Department User', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsDepartment(page);
    });

    test('should not show admin navigation items', async ({ page }) => {
      // Should only see dashboard
      await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
      
      // Should NOT see admin items
      await expect(page.getByRole('link', { name: /manage departments/i })).not.toBeVisible();
      await expect(page.getByRole('link', { name: /manage users/i })).not.toBeVisible();
    });

    test('should be redirected when accessing admin pages', async ({ page }) => {
      // Try to access admin page directly
      await navigateAndWait(page, '/admin/departments');
      
      // Should be redirected or show access denied
      await expect(page).not.toHaveURL('/admin/departments');
    });
  });

  test.describe('Breadcrumbs', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsSecretary(page);
    });

    test('should show breadcrumbs on department admin page', async ({ page }) => {
      await navigateAndWait(page, '/admin/departments');
      
      // Should show breadcrumb navigation
      const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i });
      await expect(breadcrumb).toBeVisible();
      
      // Should contain dashboard and current page
      await expect(breadcrumb.getByText(/dashboard/i)).toBeVisible();
      await expect(breadcrumb.getByText(/manage departments/i)).toBeVisible();
    });

    test('should allow navigation via breadcrumbs', async ({ page }) => {
      await navigateAndWait(page, '/admin/departments');
      
      // Click dashboard in breadcrumbs
      const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i });
      await breadcrumb.getByRole('link', { name: /dashboard/i }).click();
      
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Back Button', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsSecretary(page);
    });

    test('should navigate back when back button is clicked', async ({ page }) => {
      // Navigate to a sub-page
      await navigateAndWait(page, '/admin/departments');
      
      // Look for back button
      const backButton = page.getByRole('button', { name: /back/i });
      if (await backButton.isVisible()) {
        await backButton.click();
        await expect(page).toHaveURL('/dashboard');
      }
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsSecretary(page);
    });

    test('should have proper ARIA landmarks', async ({ page }) => {
      // Check for main landmarks
      await expect(page.getByRole('banner')).toBeVisible(); // header
      await expect(page.getByRole('navigation', { name: /main navigation/i })).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('contentinfo')).toBeVisible(); // footer
    });

    test('should have accessible navigation', async ({ page }) => {
      const navigation = page.getByRole('navigation', { name: /main navigation/i });
      await expect(navigation).toBeVisible();
      
      // All navigation items should be focusable
      const navLinks = navigation.getByRole('link');
      const count = await navLinks.count();
      
      for (let i = 0; i < count; i++) {
        const link = navLinks.nth(i);
        await expect(link).toBeVisible();
        
        // Check that link has accessible name
        const accessibleName = await link.getAttribute('aria-label') || 
                               await link.textContent();
        expect(accessibleName).toBeTruthy();
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Focus first navigation item
      await page.keyboard.press('Tab');
      
      // Should be able to navigate with arrow keys or tab
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test Enter key activation
      await page.keyboard.press('Enter');
      
      // Should navigate (check URL changed or content changed)
      await expect(page).not.toHaveURL('/login');
    });

    test('should not have accessibility violations', async ({ page }) => {
      await checkBasicAccessibility(page);
      
      // Navigate to different pages and check accessibility
      const pages = ['/admin/departments', '/admin/users', '/admin/report-templates'];
      
      for (const pageUrl of pages) {
        await navigateAndWait(page, pageUrl);
        await checkBasicAccessibility(page);
      }
    });
  });
});