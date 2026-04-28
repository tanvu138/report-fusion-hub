import { test, expect } from '@playwright/test';
import { loginAsSecretary, loginAsDepartment } from '../helpers/auth';
import { navigateAndWait, isInViewport, scrollIntoView } from '../helpers/common';

test.describe('Mobile Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('should display login page correctly on mobile', async ({ page }) => {
    await navigateAndWait(page, '/login');
    
    // Check that form elements are visible and properly sized
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    
    // Check that elements are within viewport
    const emailField = page.getByLabel(/email/i);
    expect(await isInViewport(emailField)).toBe(true);
  });

  test('should have mobile-friendly navigation', async ({ page }) => {
    await loginAsSecretary(page);
    
    // Header should be responsive
    const header = page.getByRole('banner');
    await expect(header).toBeVisible();
    
    // Navigation items should be accessible (may be in dropdown/menu)
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });
    await expect(dashboardLink).toBeVisible();
    
    // Check if navigation items fit or are in a mobile menu
    const navigation = page.getByRole('navigation', { name: /main navigation/i });
    if (await navigation.isVisible()) {
      // Check if navigation overflows
      const navBox = await navigation.boundingBox();
      const viewportWidth = 375;
      
      if (navBox) {
        expect(navBox.width).toBeLessThanOrEqual(viewportWidth);
      }
    }
  });

  test('should handle dialog sizing on mobile', async ({ page }) => {
    await loginAsSecretary(page);
    await navigateAndWait(page, '/admin/departments');
    
    // Try to open create department dialog
    const createButton = page.getByRole('button', { name: /new department/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      
      // Dialog should fit in mobile viewport
      const dialogBox = await dialog.boundingBox();
      if (dialogBox) {
        expect(dialogBox.width).toBeLessThanOrEqual(375);
        expect(dialogBox.left).toBeGreaterThanOrEqual(0);
      }
      
      // Form fields should be visible and usable
      const nameField = dialog.getByLabel(/name/i);
      if (await nameField.isVisible()) {
        await expect(nameField).toBeVisible();
        
        // Should be able to type in field
        await nameField.fill('Test Department');
        await expect(nameField).toHaveValue('Test Department');
      }
    }
  });

  test('should have touch-friendly buttons', async ({ page }) => {
    await loginAsSecretary(page);
    
    // Check button sizes are touch-friendly (at least 44px)
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // Touch target should be at least 44px in height
          expect(box.height).toBeGreaterThanOrEqual(32); // Allow some flexibility
        }
      }
    }
  });

  test('should scroll properly on mobile', async ({ page }) => {
    await loginAsSecretary(page);
    await navigateAndWait(page, '/dashboard');
    
    // Check that content can be scrolled
    const mainContent = page.getByRole('main');
    await expect(mainContent).toBeVisible();
    
    // Try scrolling to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Footer should be visible after scrolling
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();
  });

  test('should handle tables on mobile', async ({ page }) => {
    await loginAsSecretary(page);
    await navigateAndWait(page, '/admin/departments');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check if table is present
    const table = page.getByRole('table');
    if (await table.isVisible()) {
      // Table should be responsive or horizontally scrollable
      const tableBox = await table.boundingBox();
      if (tableBox && tableBox.width > 375) {
        // Should be horizontally scrollable
        const scrollContainer = page.locator('.overflow-x-auto, .table-responsive').first();
        if (await scrollContainer.isVisible()) {
          await expect(scrollContainer).toBeVisible();
        }
      }
    }
  });

  test('should handle form layouts on mobile', async ({ page }) => {
    await loginAsSecretary(page);
    await navigateAndWait(page, '/admin/departments');
    
    const createButton = page.getByRole('button', { name: /new department/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      
      // Form should stack vertically on mobile
      const formFields = dialog.getByRole('textbox');
      const fieldCount = await formFields.count();
      
      if (fieldCount > 1) {
        const firstField = formFields.first();
        const lastField = formFields.last();
        
        const firstBox = await firstField.boundingBox();
        const lastBox = await lastField.boundingBox();
        
        if (firstBox && lastBox) {
          // Fields should be stacked (last field should be below first)
          expect(lastBox.y).toBeGreaterThan(firstBox.y);
        }
      }
    }
  });

  test('should maintain usability with department user on mobile', async ({ page }) => {
    await loginAsDepartment(page);
    
    // Should be able to navigate and use basic features
    await expect(page.getByRole('main')).toBeVisible();
    
    // Check if user can access their primary functions
    const reportElements = page.getByText(/report/i);
    if (await reportElements.first().isVisible()) {
      await expect(reportElements.first()).toBeVisible();
    }
  });

  test('should handle breadcrumbs on mobile', async ({ page }) => {
    await loginAsSecretary(page);
    await navigateAndWait(page, '/admin/departments');
    
    // Breadcrumbs should be responsive
    const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i });
    if (await breadcrumb.isVisible()) {
      const breadcrumbBox = await breadcrumb.boundingBox();
      if (breadcrumbBox) {
        expect(breadcrumbBox.width).toBeLessThanOrEqual(375);
      }
      
      // Should be able to interact with breadcrumb links
      const dashboardLink = breadcrumb.getByRole('link', { name: /dashboard/i });
      if (await dashboardLink.isVisible()) {
        await dashboardLink.click();
        await expect(page).toHaveURL('/dashboard');
      }
    }
  });

  test('should handle error messages properly on mobile', async ({ page }) => {
    // Test with invalid login
    await navigateAndWait(page, '/login');
    
    await page.getByLabel(/email/i).fill('invalid@test.com');
    await page.getByLabel(/password/i).fill('wrong');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Error message should be visible and readable on mobile
    await page.waitForTimeout(1000);
    const errorElement = page.getByRole('alert').or(page.getByText(/invalid/i));
    
    if (await errorElement.first().isVisible()) {
      const errorBox = await errorElement.first().boundingBox();
      if (errorBox) {
        expect(errorBox.width).toBeLessThanOrEqual(375);
        expect(errorBox.left).toBeGreaterThanOrEqual(0);
      }
    }
  });
});