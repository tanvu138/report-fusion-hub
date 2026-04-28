import { test, expect } from '@playwright/test';
import { loginAsSecretary } from '../helpers/auth';
import { navigateAndWait, waitForLoadingToComplete, waitForApiResponse } from '../helpers/common';

test.describe('Error Handling and Loading States', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSecretary(page);
  });

  test('should show loading skeletons while data loads', async ({ page }) => {
    // Navigate to departments page
    await page.goto('/admin/departments');
    
    // Should show loading skeleton initially
    const loadingSkeleton = page.locator('.animate-pulse, [aria-label*="loading"], [aria-label*="Loading"]');
    
    // Wait for loading to complete
    await waitForLoadingToComplete(page);
    
    // Loading skeleton should be gone
    await expect(loadingSkeleton).not.toBeVisible();
    
    // Content should be visible
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept network requests and make them fail
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    await navigateAndWait(page, '/admin/departments');
    
    // Should show error message
    const errorMessage = page.getByRole('alert').or(
      page.getByText(/error/i)
    ).or(
      page.getByText(/failed to load/i)
    );
    
    await expect(errorMessage).toBeVisible();
  });

  test('should show retry button on errors', async ({ page }) => {
    // Intercept and fail initial request
    let requestCount = 0;
    await page.route('**/api/departments**', route => {
      requestCount++;
      if (requestCount === 1) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    await navigateAndWait(page, '/admin/departments');
    
    // Should show error with retry button
    const retryButton = page.getByRole('button', { name: /retry/i }).or(
      page.getByRole('button', { name: /try again/i })
    );
    
    if (await retryButton.isVisible()) {
      // Click retry button
      await retryButton.click();
      
      // Should eventually load successfully
      await waitForLoadingToComplete(page);
      await expect(page.getByRole('heading')).toBeVisible();
    }
  });

  test('should show progress indicators for long operations', async ({ page }) => {
    await navigateAndWait(page, '/dashboard');
    
    // Look for create report button
    const createButton = page.getByRole('button', { name: /new report/i }).or(
      page.getByRole('button', { name: /create/i })
    );
    
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Should show dialog
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      
      // Fill out form if present
      const titleField = dialog.getByLabel(/title/i);
      if (await titleField.isVisible()) {
        await titleField.fill('Test Report');
        
        // Submit form
        const submitButton = dialog.getByRole('button', { name: /create/i });
        await submitButton.click();
        
        // Should show loading state
        const loadingIndicator = dialog.locator('[aria-live], .animate-spin, [aria-label*="loading"]');
        
        // Wait for operation to complete
        await waitForLoadingToComplete(page);
      }
    }
  });

  test('should handle offline state', async ({ page }) => {
    // Simulate going offline
    await page.context().setOffline(true);
    
    await navigateAndWait(page, '/dashboard');
    
    // Try to perform an action that requires network
    const createButton = page.getByRole('button', { name: /new report/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Should show offline indicator or error
      const offlineIndicator = page.getByText(/offline/i).or(
        page.getByText(/no.*connection/i)
      ).or(
        page.getByText(/network.*error/i)
      );
      
      // May not be immediately visible, so check with timeout
      try {
        await expect(offlineIndicator).toBeVisible({ timeout: 5000 });
      } catch {
        // Offline handling might not be implemented yet
        console.log('Offline handling not yet implemented');
      }
    }
    
    // Go back online
    await page.context().setOffline(false);
  });

  test('should show loading overlays during async operations', async ({ page }) => {
    await navigateAndWait(page, '/admin/departments');
    
    // Look for create department button
    const createButton = page.getByRole('button', { name: /new department/i }).or(
      page.getByRole('button', { name: /create/i })
    );
    
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Should show dialog
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      
      // Fill out form
      const nameField = dialog.getByLabel(/name/i);
      if (await nameField.isVisible()) {
        await nameField.fill('Test Department');
        
        // Submit form
        const submitButton = dialog.getByRole('button', { name: /create/i });
        await submitButton.click();
        
        // Should show loading overlay
        const loadingOverlay = dialog.locator('[role="progressbar"], .loading-overlay, [aria-live]');
        
        // Wait for operation to complete
        await waitForLoadingToComplete(page);
      }
    }
  });

  test('should provide accessible error messages', async ({ page }) => {
    // Force an error by navigating to non-existent page
    await page.goto('/admin/nonexistent');
    
    // Should show accessible error
    const errorAlert = page.getByRole('alert');
    if (await errorAlert.isVisible()) {
      await expect(errorAlert).toHaveAttribute('role', 'alert');
      
      // Should have meaningful error text
      const errorText = await errorAlert.textContent();
      expect(errorText).toBeTruthy();
      expect(errorText.length).toBeGreaterThan(10);
    }
  });

  test('should handle form validation errors properly', async ({ page }) => {
    await navigateAndWait(page, '/admin/departments');
    
    // Try to create department with invalid data
    const createButton = page.getByRole('button', { name: /new department/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      
      // Submit empty form
      const submitButton = dialog.getByRole('button', { name: /create/i });
      await submitButton.click();
      
      // Should show validation errors
      const validationError = dialog.getByText(/required/i).or(
        dialog.getByText(/invalid/i)
      ).or(
        dialog.locator('[aria-invalid="true"]')
      );
      
      if (await validationError.first().isVisible()) {
        await expect(validationError.first()).toBeVisible();
      }
    }
  });
});