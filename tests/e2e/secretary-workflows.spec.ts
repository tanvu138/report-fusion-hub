import { test, expect } from '@playwright/test';
import { loginAsSecretary, TEST_USERS } from '../helpers/auth';
import { navigateAndWait, waitForToast, waitForLoadingToComplete, fillFormField, waitForApiResponse } from '../helpers/common';

test.describe('Secretary User Workflows - Business Critical Functions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSecretary(page);
  });

  test.describe('Report Creation - Core Business Function', () => {
    test('should create a custom report with sections successfully', async ({ page }) => {
      // Navigate to dashboard
      await expect(page).toHaveURL('/dashboard');
      
      // Open report creation dialog
      const newReportButton = page.getByRole('button', { name: /new report/i });
      await expect(newReportButton).toBeVisible();
      await newReportButton.click();
      
      // Should show dialog
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(/create new report/i)).toBeVisible();
      
      // Choose custom report option
      await dialog.getByRole('button', { name: /create custom report/i }).click();
      
      // Fill report details
      const reportTitle = `Test Report ${Date.now()}`;
      await dialog.getByLabel(/report title/i).fill(reportTitle);
      await dialog.getByRole('combobox', { name: /report cycle/i }).click();
      await page.getByRole('option', { name: /weekly/i }).click();
      await dialog.getByLabel(/description/i).fill('Test report description for E2E testing');
      
      // Add a custom section - need to ensure department dropdown loads
      await expect(dialog.getByText(/report sections/i)).toBeVisible();
      
      // Fill first section
      const sectionNameField = dialog.getByLabel(/section name/i).first();
      await sectionNameField.fill('Financial Summary');
      
      // Wait for departments to load and select one
      const departmentSelect = dialog.getByRole('combobox').filter({ hasText: /select department/i }).first();
      await departmentSelect.click();
      
      // Wait for department options to appear
      await page.waitForTimeout(1000); // Give time for departments to load
      const departmentOptions = page.getByRole('option');
      await expect(departmentOptions.first()).toBeVisible();
      await departmentOptions.first().click();
      
      // Add instructions
      await dialog.getByLabel(/instructions/i).first().fill('Provide quarterly financial metrics and variance analysis');
      
      // Submit form and wait for API response
      const createButton = dialog.getByRole('button', { name: /create report/i });
      await expect(createButton).toBeEnabled();
      
      // Wait for report creation API call
      const reportCreationPromise = waitForApiResponse(page, /\/api\/reports/, 'POST');
      await createButton.click();
      await reportCreationPromise;
      
      // Should redirect to report edit page
      await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
      
      // Verify report was created with correct title
      await expect(page.getByRole('heading', { name: reportTitle })).toBeVisible();
      
      // Verify section appears in the interface
      await expect(page.getByText(/financial summary/i)).toBeVisible();
      
      // Verify success toast
      await waitForToast(page, /created/i);
    });

    test('should create report from template successfully', async ({ page }) => {
      // Navigate to templates tab first to check if templates exist
      await page.getByRole('tab', { name: /manage templates/i }).click();
      
      // If no templates exist, create one first
      const createTemplateButton = page.getByRole('button', { name: /create new template/i });
      if (await createTemplateButton.isVisible()) {
        await createTemplateButton.click();
        
        const templateDialog = page.getByRole('dialog');
        await templateDialog.getByLabel(/template name/i).fill('Test Template');
        await templateDialog.getByLabel(/description/i).fill('Template for testing');
        
        // Add a section to the template
        await templateDialog.getByRole('button', { name: /add section/i }).click();
        await templateDialog.getByLabel(/section name/i).first().fill('Executive Summary');
        
        // Select department for section
        const deptSelect = templateDialog.getByRole('combobox').first();
        await deptSelect.click();
        await page.getByRole('option').first().click();
        
        await templateDialog.getByRole('button', { name: /create template/i }).click();
        await waitForToast(page, /created/i);
      }
      
      // Now create report from template
      await page.getByRole('tab', { name: /view reports/i }).click();
      await page.getByRole('button', { name: /new report/i }).click();
      
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: /create from template/i }).click();
      
      // Select template
      await dialog.getByRole('combobox', { name: /select template/i }).click();
      await page.getByRole('option').first().click();
      
      // Fill report details
      const reportTitle = `Template Report ${Date.now()}`;
      await dialog.getByLabel(/report title/i).fill(reportTitle);
      await dialog.getByRole('combobox', { name: /report cycle/i }).click();
      await page.getByRole('option', { name: /monthly/i }).click();
      
      // Create report
      const reportCreationPromise = waitForApiResponse(page, /\/api\/reports/, 'POST');
      await dialog.getByRole('button', { name: /create report/i }).click();
      await reportCreationPromise;
      
      // Verify navigation to report
      await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
      await expect(page.getByRole('heading', { name: reportTitle })).toBeVisible();
    });
  });

  test.describe('Report Management - State Transitions', () => {
    test('should manage report sections and toggle activation', async ({ page }) => {
      // Create a test report first if needed, or use existing
      await page.getByRole('button', { name: /new report/i }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: /create custom report/i }).click();
      
      const reportTitle = `Section Test ${Date.now()}`;
      await dialog.getByLabel(/report title/i).fill(reportTitle);
      await dialog.getByRole('combobox', { name: /report cycle/i }).click();
      await page.getByRole('option', { name: /adhoc/i }).click();
      
      // Add section
      await dialog.getByLabel(/section name/i).first().fill('Test Section');
      const deptSelect = dialog.getByRole('combobox').filter({ hasText: /select department/i }).first();
      await deptSelect.click();
      await page.waitForTimeout(500);
      await page.getByRole('option').first().click();
      
      await dialog.getByRole('button', { name: /create report/i }).click();
      await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
      
      // Should be on report edit page - verify section management interface
      await expect(page.getByText(/report sections/i)).toBeVisible();
      
      // Find section toggle checkbox
      const sectionToggle = page.getByRole('checkbox').first();
      await expect(sectionToggle).toBeVisible();
      
      // Toggle section activation
      const initialState = await sectionToggle.isChecked();
      await sectionToggle.click();
      
      // Verify state changed
      await expect(sectionToggle).toBeChecked({ checked: !initialState });
      
      // Verify status badge updates
      await expect(page.locator('.badge, [data-badge]').first()).toBeVisible();
    });

    test('should edit report details with auto-save functionality', async ({ page }) => {
      // Use existing report or create one
      const reportCards = page.locator('.card').filter({ hasText: /report/i });
      if (await reportCards.count() === 0) {
        // Create a quick report for testing
        await page.getByRole('button', { name: /new report/i }).click();
        const dialog = page.getByRole('dialog');
        await dialog.getByRole('button', { name: /create custom report/i }).click();
        await dialog.getByLabel(/report title/i).fill('Auto-save Test Report');
        await dialog.getByRole('combobox', { name: /report cycle/i }).click();
        await page.getByRole('option', { name: /weekly/i }).click();
        await dialog.getByRole('button', { name: /create report/i }).click();
        await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
      } else {
        // Click on existing report
        await reportCards.first().click();
        await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
      }
      
      // Should see report details editing interface
      await expect(page.getByText(/edit report details/i)).toBeVisible();
      
      // Edit title
      const titleField = page.getByLabel(/report title/i);
      await titleField.clear();
      const newTitle = `Updated Title ${Date.now()}`;
      await titleField.fill(newTitle);
      
      // Edit description
      const descField = page.getByLabel(/report description/i);
      await descField.fill('Updated description for auto-save testing');
      
      // Verify auto-save indicators appear
      await expect(page.getByText(/auto-save pending/i).or(page.getByText(/auto-saving/i))).toBeVisible({ timeout: 10000 });
      
      // Wait for auto-save to complete
      await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 50000 });
      
      // Manual save button should also work
      const saveButton = page.getByRole('button', { name: /save report details/i });
      if (await saveButton.isVisible() && await saveButton.isEnabled()) {
        await saveButton.click();
        await waitForToast(page, /saved/i);
      }
    });
  });

  test.describe('Template Management', () => {
    test('should create, edit, and delete report templates', async ({ page }) => {
      // Navigate to templates tab
      await page.getByRole('tab', { name: /manage templates/i }).click();
      
      // Create new template
      await page.getByRole('button', { name: /create new template/i }).click();
      
      const dialog = page.getByRole('dialog');
      const templateName = `E2E Template ${Date.now()}`;
      
      await dialog.getByLabel(/template name/i).fill(templateName);
      await dialog.getByLabel(/description/i).fill('End-to-end test template');
      
      // Add sections to template
      await dialog.getByRole('button', { name: /add section/i }).click();
      
      const sectionNameField = dialog.getByLabel(/section name/i).first();
      await sectionNameField.fill('Introduction');
      
      // Select department
      const deptSelect = dialog.getByRole('combobox').first();
      await deptSelect.click();
      await page.waitForTimeout(500);
      await page.getByRole('option').first().click();
      
      // Create template
      const templateCreationPromise = waitForApiResponse(page, /\/api.*templates/, 'POST');
      await dialog.getByRole('button', { name: /create template/i }).click();
      await templateCreationPromise;
      
      await waitForToast(page, /created/i);
      
      // Verify template appears in list
      await expect(page.getByText(templateName)).toBeVisible();
      
      // Edit template
      const templateCard = page.locator('.card').filter({ hasText: templateName });
      await templateCard.getByRole('button', { name: /edit/i }).click();
      
      const editDialog = page.getByRole('dialog');
      await editDialog.getByLabel(/template name/i).fill(`${templateName} - Edited`);
      await editDialog.getByRole('button', { name: /save/i }).click();
      
      await waitForToast(page, /updated/i);
      
      // Verify edited name appears
      await expect(page.getByText(`${templateName} - Edited`)).toBeVisible();
      
      // Delete template
      await templateCard.getByRole('button', { name: /delete/i }).click();
      
      const deleteDialog = page.getByRole('dialog');
      await deleteDialog.getByRole('button', { name: /delete/i }).click();
      
      await waitForToast(page, /deleted/i);
      
      // Verify template is removed
      await expect(page.getByText(templateName)).not.toBeVisible();
    });
  });

  test.describe('Report Export and Sharing', () => {
    test('should export report to DOCX format', async ({ page }) => {
      // Navigate to a report or create one
      const reportCards = page.locator('.card').filter({ hasText: /report/i });
      if (await reportCards.count() === 0) {
        // Create report for testing
        await page.getByRole('button', { name: /new report/i }).click();
        const dialog = page.getByRole('dialog');
        await dialog.getByRole('button', { name: /create custom report/i }).click();
        await dialog.getByLabel(/report title/i).fill('Export Test Report');
        await dialog.getByRole('combobox', { name: /report cycle/i }).click();
        await page.getByRole('option', { name: /weekly/i }).click();
        await dialog.getByRole('button', { name: /create report/i }).click();
        await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
      } else {
        await reportCards.first().click();
        await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
      }
      
      // Click export button
      const exportButton = page.getByRole('button', { name: /export docx/i });
      await expect(exportButton).toBeVisible();
      
      // Set up download handler
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      
      // Verify download starts
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.docx$/);
    });

    test('should create and manage external sharing links', async ({ page }) => {
      // Navigate to a report
      const reportCards = page.locator('.card').filter({ hasText: /report/i });
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
        
        // Click share button
        const shareButton = page.getByRole('button', { name: /share externally/i });
        if (await shareButton.isVisible()) {
          await shareButton.click();
          
          // Should open share dialog
          const shareDialog = page.getByRole('dialog');
          await expect(shareDialog).toBeVisible();
          
          // Should show sharing options
          await expect(shareDialog.getByText(/share/i)).toBeVisible();
        }
      }
    });
  });

  test.describe('Dashboard Overview', () => {
    test('should display report statistics and status overview', async ({ page }) => {
      // Should be on dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.getByRole('heading', { name: /reports dashboard/i })).toBeVisible();
      
      // Should show tabs for secretary
      await expect(page.getByRole('tab', { name: /view reports/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /manage templates/i })).toBeVisible();
      
      // Should show create report button
      await expect(page.getByRole('button', { name: /new report/i })).toBeVisible();
      
      // Verify report cards show relevant information
      const reportCards = page.locator('.card').filter({ hasText: /cycle/i });
      if (await reportCards.count() > 0) {
        const firstCard = reportCards.first();
        
        // Should show report metadata
        await expect(firstCard.getByText(/cycle:/i)).toBeVisible();
        await expect(firstCard.getByText(/state:/i)).toBeVisible();
        
        // Should show action buttons
        await expect(firstCard.getByRole('button', { name: /preview/i })).toBeVisible();
        await expect(firstCard.getByRole('button', { name: /export/i })).toBeVisible();
        await expect(firstCard.getByRole('button', { name: /delete/i })).toBeVisible();
      }
    });
  });
});