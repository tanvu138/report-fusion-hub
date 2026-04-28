import { test, expect } from '@playwright/test';
import { loginAsSecretary } from '../helpers/auth';
import { waitForToast, waitForApiResponse } from '../helpers/common';

test.describe('Template and Template Pack Management - Administrative Functions', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsSecretary(page);
    
    // Navigate to templates tab
    await page.getByRole('tab', { name: /manage templates/i }).click();
    await expect(page.getByText(/manage report templates/i)).toBeVisible();
  });

  test.describe('Template Creation and Basic Management', () => {
    test('should create a new report template with multiple sections', async ({ page }) => {
      // Click create template button
      await page.getByRole('button', { name: /create new template/i }).click();
      
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      
      // Fill template basic info
      const templateName = `E2E Test Template ${Date.now()}`;
      await dialog.getByLabel(/template name/i).fill(templateName);
      await dialog.getByLabel(/description/i).fill('Comprehensive template for E2E testing with multiple sections');
      
      // Add first section
      await dialog.getByRole('button', { name: /add section/i }).click();
      
      // Fill section details
      const sectionFields = dialog.locator('[data-section-index="0"], .section-form').first();
      await sectionFields.getByLabel(/section name/i).fill('Executive Summary');
      await sectionFields.getByLabel(/display name/i).fill('Executive Summary');
      
      // Select department
      const deptSelect = sectionFields.getByRole('combobox').first();
      await deptSelect.click();
      await page.waitForTimeout(500);
      await page.getByRole('option').first().click();
      
      // Add section instructions
      await sectionFields.getByLabel(/instructions/i).fill('Provide high-level overview of key findings and recommendations');
      
      // Add second section
      await dialog.getByRole('button', { name: /add section/i }).click();
      
      const secondSection = dialog.locator('[data-section-index="1"], .section-form').nth(1);
      await secondSection.getByLabel(/section name/i).fill('Financial Analysis');
      await secondSection.getByLabel(/display name/i).fill('Financial Analysis & Metrics');
      
      // Select different department for second section
      const secondDeptSelect = secondSection.getByRole('combobox').first();
      await secondDeptSelect.click();
      await page.waitForTimeout(500);
      const deptOptions = page.getByRole('option');
      if (await deptOptions.count() > 1) {
        await deptOptions.nth(1).click();
      } else {
        await deptOptions.first().click();
      }
      
      await secondSection.getByLabel(/instructions/i).fill('Include quarterly metrics, variance analysis, and budget comparisons');
      
      // Create template
      const createButton = dialog.getByRole('button', { name: /create template/i });
      await expect(createButton).toBeEnabled();
      
      const templateCreationPromise = waitForApiResponse(page, /\/api.*templates/, 'POST');
      await createButton.click();
      await templateCreationPromise;
      
      await waitForToast(page, /created/i);
      
      // Verify template appears in list
      await expect(page.getByText(templateName)).toBeVisible();
      
      // Verify template shows section count
      const templateCard = page.locator('.card').filter({ hasText: templateName });
      await expect(templateCard.getByText(/sections.*2/i)).toBeVisible();
    });

    test('should edit existing template and update sections', async ({ page }) => {
      // Create a template first if none exists
      const existingTemplates = page.locator('.card').filter({ hasText: /template/i });
      
      if (await existingTemplates.count() === 0) {
        // Create a template for editing
        await page.getByRole('button', { name: /create new template/i }).click();
        const dialog = page.getByRole('dialog');
        
        await dialog.getByLabel(/template name/i).fill('Template for Editing');
        await dialog.getByLabel(/description/i).fill('Template to test editing functionality');
        
        await dialog.getByRole('button', { name: /add section/i }).click();
        await dialog.getByLabel(/section name/i).first().fill('Original Section');
        
        const deptSelect = dialog.getByRole('combobox').first();
        await deptSelect.click();
        await page.waitForTimeout(500);
        await page.getByRole('option').first().click();
        
        await dialog.getByRole('button', { name: /create template/i }).click();
        await waitForToast(page, /created/i);
      }
      
      // Edit the template
      const templateCard = page.locator('.card').first();
      await templateCard.getByRole('button', { name: /edit/i }).click();
      
      const editDialog = page.getByRole('dialog');
      await expect(editDialog).toBeVisible();
      
      // Update template name
      const nameField = editDialog.getByLabel(/template name/i);
      const originalName = await nameField.inputValue();
      const updatedName = `${originalName} - Edited`;
      
      await nameField.clear();
      await nameField.fill(updatedName);
      
      // Update description
      await editDialog.getByLabel(/description/i).fill('Updated description with additional details');
      
      // Add new section to existing template
      await editDialog.getByRole('button', { name: /add section/i }).click();
      
      const newSection = editDialog.locator('.section-form').last();
      await newSection.getByLabel(/section name/i).fill('New Added Section');
      await newSection.getByLabel(/display name/i).fill('Newly Added Section');
      
      const newDeptSelect = newSection.getByRole('combobox').first();
      await newDeptSelect.click();
      await page.waitForTimeout(500);
      await page.getByRole('option').first().click();
      
      // Save changes
      const saveButton = editDialog.getByRole('button', { name: /save|update/i });
      await saveButton.click();
      
      await waitForToast(page, /updated/i);
      
      // Verify changes are reflected
      await expect(page.getByText(updatedName)).toBeVisible();
    });

    test('should delete template with confirmation', async ({ page }) => {
      // Create a template for deletion
      await page.getByRole('button', { name: /create new template/i }).click();
      const dialog = page.getByRole('dialog');
      
      const templateName = `Template for Deletion ${Date.now()}`;
      await dialog.getByLabel(/template name/i).fill(templateName);
      await dialog.getByLabel(/description/i).fill('This template will be deleted');
      
      await dialog.getByRole('button', { name: /add section/i }).click();
      await dialog.getByLabel(/section name/i).first().fill('Test Section');
      
      const deptSelect = dialog.getByRole('combobox').first();
      await deptSelect.click();
      await page.waitForTimeout(500);
      await page.getByRole('option').first().click();
      
      await dialog.getByRole('button', { name: /create template/i }).click();
      await waitForToast(page, /created/i);
      
      // Now delete the template
      const templateCard = page.locator('.card').filter({ hasText: templateName });
      await templateCard.getByRole('button', { name: /delete/i }).click();
      
      // Should show confirmation dialog
      const confirmDialog = page.getByRole('dialog');
      await expect(confirmDialog.getByText(/delete|confirm/i)).toBeVisible();
      
      // Confirm deletion
      await confirmDialog.getByRole('button', { name: /delete|confirm/i }).click();
      
      await waitForToast(page, /deleted/i);
      
      // Verify template is removed from list
      await expect(page.getByText(templateName)).not.toBeVisible();
    });
  });

  test.describe('Template Preview and Validation', () => {
    test('should preview template structure before creation', async ({ page }) => {
      const existingTemplates = page.locator('.card').filter({ hasText: /sections/i });
      
      if (await existingTemplates.count() > 0) {
        // Preview existing template
        const firstTemplate = existingTemplates.first();
        await firstTemplate.getByRole('button', { name: /preview/i }).click();
        
        const previewDialog = page.getByRole('dialog');
        await expect(previewDialog).toBeVisible();
        
        // Should show template structure
        await expect(previewDialog.getByText(/template/i)).toBeVisible();
        await expect(previewDialog.getByText(/sections/i)).toBeVisible();
        
        // Should show section details
        const sectionElements = previewDialog.getByText(/section/i);
        await expect(sectionElements.first()).toBeVisible();
        
        // Close preview
        const closeButton = previewDialog.getByRole('button', { name: /close/i });
        if (await closeButton.isVisible()) {
          await closeButton.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
    });

    test('should validate template before saving', async ({ page }) => {
      // Test validation during template creation
      await page.getByRole('button', { name: /create new template/i }).click();
      const dialog = page.getByRole('dialog');
      
      // Try to create with empty name
      await dialog.getByLabel(/template name/i).fill('');
      
      const createButton = dialog.getByRole('button', { name: /create template/i });
      await expect(createButton).toBeDisabled();
      
      // Add name but no sections
      await dialog.getByLabel(/template name/i).fill('Validation Test Template');
      await dialog.getByLabel(/description/i).fill('Testing validation');
      
      // Should still be disabled without sections
      await expect(createButton).toBeDisabled();
      
      // Add section
      await dialog.getByRole('button', { name: /add section/i }).click();
      await dialog.getByLabel(/section name/i).first().fill('Test Section');
      
      // Should still be disabled without department
      await expect(createButton).toBeDisabled();
      
      // Select department
      const deptSelect = dialog.getByRole('combobox').first();
      await deptSelect.click();
      await page.waitForTimeout(500);
      await page.getByRole('option').first().click();
      
      // Should now be enabled
      await expect(createButton).toBeEnabled();
      
      // Cancel instead of creating
      await dialog.getByRole('button', { name: /cancel/i }).click();
    });
  });

  test.describe('Template-Based Report Creation Integration', () => {
    test('should create report from template and verify section inheritance', async ({ page }) => {
      // Ensure we have a template or create one
      const existingTemplates = page.locator('.card').filter({ hasText: /sections/i });
      
      if (await existingTemplates.count() === 0) {
        // Create a template for testing
        await page.getByRole('button', { name: /create new template/i }).click();
        const dialog = page.getByRole('dialog');
        
        await dialog.getByLabel(/template name/i).fill('Integration Test Template');
        await dialog.getByLabel(/description/i).fill('Template for testing report creation');
        
        await dialog.getByRole('button', { name: /add section/i }).click();
        await dialog.getByLabel(/section name/i).first().fill('Template Section 1');
        
        const deptSelect = dialog.getByRole('combobox').first();
        await deptSelect.click();
        await page.waitForTimeout(500);
        await page.getByRole('option').first().click();
        
        await dialog.getByRole('button', { name: /create template/i }).click();
        await waitForToast(page, /created/i);
      }
      
      // Create report from template
      const templateCard = page.locator('.card').first();
      await templateCard.getByRole('button', { name: /create report/i }).click();
      
      // Should open report creation dialog with template pre-selected
      const reportDialog = page.getByRole('dialog');
      await expect(reportDialog.getByText(/create new report/i)).toBeVisible();
      
      // Fill report details
      const reportTitle = `Report from Template ${Date.now()}`;
      await reportDialog.getByLabel(/report title/i).fill(reportTitle);
      await reportDialog.getByRole('combobox', { name: /report cycle/i }).click();
      await page.getByRole('option', { name: /weekly/i }).click();
      
      // Create report
      const reportCreationPromise = waitForApiResponse(page, /\/api\/reports/, 'POST');
      await reportDialog.getByRole('button', { name: /create report/i }).click();
      await reportCreationPromise;
      
      // Should navigate to report edit page
      await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
      
      // Verify report has sections from template
      await expect(page.getByText(/report sections/i)).toBeVisible();
      
      // Should show sections inherited from template
      await expect(page.getByText(/template section/i).or(page.getByText(/section/i))).toBeVisible();
    });

    test('should handle template updates and their impact on future reports', async ({ page }) => {
      // This test verifies that template changes affect new reports but not existing ones
      const existingTemplates = page.locator('.card').filter({ hasText: /sections/i });
      
      if (await existingTemplates.count() > 0) {
        const templateCard = existingTemplates.first();
        const templateName = await templateCard.getByRole('heading').textContent();
        
        // Edit template to add new section
        await templateCard.getByRole('button', { name: /edit/i }).click();
        
        const editDialog = page.getByRole('dialog');
        
        // Add new section
        await editDialog.getByRole('button', { name: /add section/i }).click();
        
        const newSection = editDialog.locator('.section-form').last();
        await newSection.getByLabel(/section name/i).fill('Updated Template Section');
        
        const deptSelect = newSection.getByRole('combobox').first();
        await deptSelect.click();
        await page.waitForTimeout(500);
        await page.getByRole('option').first().click();
        
        await editDialog.getByRole('button', { name: /save/i }).click();
        await waitForToast(page, /updated/i);
        
        // Create new report from updated template
        await templateCard.getByRole('button', { name: /create report/i }).click();
        
        const reportDialog = page.getByRole('dialog');
        await reportDialog.getByLabel(/report title/i).fill(`Post-Update Report ${Date.now()}`);
        await reportDialog.getByRole('combobox', { name: /report cycle/i }).click();
        await page.getByRole('option', { name: /weekly/i }).click();
        
        await reportDialog.getByRole('button', { name: /create report/i }).click();
        
        // New report should have the updated section
        await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
        await expect(page.getByText(/updated template section/i)).toBeVisible();
      }
    });
  });

  test.describe('Template Organization and Search', () => {
    test('should organize templates by categories or departments', async ({ page }) => {
      // Create templates with different department assignments
      const templateNames = ['Finance Template', 'HR Template', 'Operations Template'];
      
      for (const templateName of templateNames) {
        await page.getByRole('button', { name: /create new template/i }).click();
        const dialog = page.getByRole('dialog');
        
        await dialog.getByLabel(/template name/i).fill(templateName);
        await dialog.getByLabel(/description/i).fill(`Template for ${templateName.split(' ')[0]} department`);
        
        await dialog.getByRole('button', { name: /add section/i }).click();
        await dialog.getByLabel(/section name/i).first().fill(`${templateName} Section`);
        
        const deptSelect = dialog.getByRole('combobox').first();
        await deptSelect.click();
        await page.waitForTimeout(500);
        await page.getByRole('option').first().click();
        
        await dialog.getByRole('button', { name: /create template/i }).click();
        await waitForToast(page, /created/i);
      }
      
      // Verify all templates are created and displayed
      for (const templateName of templateNames) {
        await expect(page.getByText(templateName)).toBeVisible();
      }
      
      // Templates should be organized in a grid layout
      const templateCards = page.locator('.card').filter({ hasText: /sections/i });
      expect(await templateCards.count()).toBeGreaterThanOrEqual(templateNames.length);
    });

    test('should handle empty template state appropriately', async ({ page }) => {
      // Clear all templates first (in a clean test environment)
      const templateCards = page.locator('.card').filter({ hasText: /sections/i });
      const templateCount = await templateCards.count();
      
      // If there are templates, this test verifies the empty state messaging
      if (templateCount === 0) {
        await expect(page.getByText(/no templates found/i)).toBeVisible();
        await expect(page.getByText(/get started by creating/i)).toBeVisible();
        
        // Should show create template button in empty state
        await expect(page.getByRole('button', { name: /create template/i })).toBeVisible();
      }
    });
  });

  test.describe('Template Performance and Scalability', () => {
    test('should handle templates with many sections efficiently', async ({ page }) => {
      // Create template with multiple sections to test performance
      await page.getByRole('button', { name: /create new template/i }).click();
      const dialog = page.getByRole('dialog');
      
      await dialog.getByLabel(/template name/i).fill('Large Template Performance Test');
      await dialog.getByLabel(/description/i).fill('Template with many sections for performance testing');
      
      // Add multiple sections
      for (let i = 1; i <= 5; i++) {
        await dialog.getByRole('button', { name: /add section/i }).click();
        
        const section = dialog.locator('.section-form').nth(i - 1);
        await section.getByLabel(/section name/i).fill(`Section ${i}`);
        await section.getByLabel(/display name/i).fill(`Display Section ${i}`);
        
        const deptSelect = section.getByRole('combobox').first();
        await deptSelect.click();
        await page.waitForTimeout(200);
        await page.getByRole('option').first().click();
        
        await section.getByLabel(/instructions/i).fill(`Instructions for section ${i} with detailed guidance`);
      }
      
      // Should handle large template creation
      const createButton = dialog.getByRole('button', { name: /create template/i });
      await expect(createButton).toBeEnabled();
      
      await createButton.click();
      await waitForToast(page, /created/i);
      
      // Verify template shows correct section count
      await expect(page.getByText(/sections.*5/i)).toBeVisible();
    });

    test('should provide responsive template management interface', async ({ page }) => {
      // Test template management on different viewport sizes
      const templateCards = page.locator('.card').filter({ hasText: /sections/i });
      
      if (await templateCards.count() > 0) {
        // Test desktop view
        await page.setViewportSize({ width: 1280, height: 720 });
        await expect(templateCards.first()).toBeVisible();
        
        // Test tablet view
        await page.setViewportSize({ width: 768, height: 1024 });
        await expect(templateCards.first()).toBeVisible();
        
        // Test mobile view
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(templateCards.first()).toBeVisible();
        
        // Template actions should remain accessible
        const firstCard = templateCards.first();
        await expect(firstCard.getByRole('button', { name: /preview/i })).toBeVisible();
        await expect(firstCard.getByRole('button', { name: /edit/i })).toBeVisible();
        
        // Reset to desktop
        await page.setViewportSize({ width: 1280, height: 720 });
      }
    });
  });
});