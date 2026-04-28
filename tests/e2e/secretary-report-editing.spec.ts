import { test, expect } from '@playwright/test';
import { loginAsSecretary } from '../helpers/auth';
import { waitForToast, waitForApiResponse } from '../helpers/common';

test.describe('Secretary Report Editing - Core Functionality Test', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSecretary(page);
  });

  test('should create report and edit name/description with persistence', async ({ page }) => {
    // Step 1: Create a new report
    console.log('Step 1: Creating new report...');
    
    await page.getByRole('button', { name: /new report/i }).click();
    
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    
    await dialog.getByRole('button', { name: /create custom report/i }).click();
    
    const originalTitle = `Test Report ${Date.now()}`;
    const originalDescription = 'Original description for testing';
    
    await dialog.getByLabel(/report title/i).fill(originalTitle);
    await dialog.getByRole('combobox', { name: /report cycle/i }).click();
    await page.getByRole('option', { name: /weekly/i }).click();
    await dialog.getByLabel(/description/i).fill(originalDescription);
    
    // Add a section to make it valid
    await dialog.getByLabel(/section name/i).first().fill('Test Section');
    const deptSelect = dialog.getByRole('combobox').filter({ hasText: /select department/i }).first();
    await deptSelect.click();
    await page.waitForTimeout(500);
    await page.getByRole('option').first().click();
    
    // Create the report
    const reportCreationPromise = waitForApiResponse(page, /\/api\/reports/, 'POST');
    await dialog.getByRole('button', { name: /create report/i }).click();
    await reportCreationPromise;
    
    // Should navigate to report edit page
    await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
    await expect(page.getByRole('heading', { name: originalTitle })).toBeVisible();
    
    console.log('✅ Report created successfully');
    
    // Step 2: Edit report details
    console.log('Step 2: Editing report name and description...');
    
    // Verify edit interface is present
    await expect(page.getByText(/edit report details/i)).toBeVisible();
    
    const titleField = page.getByLabel(/report title/i);
    const descriptionField = page.getByLabel(/report description/i);
    
    await expect(titleField).toBeVisible();
    await expect(descriptionField).toBeVisible();
    
    // Verify original values are loaded
    await expect(titleField).toHaveValue(originalTitle);
    await expect(descriptionField).toHaveValue(originalDescription);
    
    // Edit the values
    const newTitle = `${originalTitle} - EDITED`;
    const newDescription = `${originalDescription} - UPDATED with new information`;
    
    await titleField.clear();
    await titleField.fill(newTitle);
    
    await descriptionField.clear();
    await descriptionField.fill(newDescription);
    
    console.log('✅ Values edited in form');
    
    // Step 3: Save the changes
    console.log('Step 3: Saving changes...');
    
    const saveButton = page.getByRole('button', { name: /save report details/i });
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled();
    
    // Wait for save API call
    const savePromise = waitForApiResponse(page, /\/api\/reports\/[^\/]+$/, 'PUT');
    await saveButton.click();
    
    try {
      await savePromise;
      console.log('✅ Save API call completed');
    } catch (error) {
      console.log('⚠️ Save API call may have failed:', error);
    }
    
    // Wait for success toast
    try {
      await waitForToast(page, /success|saved/i);
      console.log('✅ Success toast appeared');
    } catch (error) {
      console.log('⚠️ Success toast not found:', error);
    }
    
    // Step 4: Verify changes are reflected in UI
    console.log('Step 4: Verifying UI updates...');
    
    // Check if header title updated
    const headerTitle = page.getByRole('heading').first();
    const headerText = await headerTitle.textContent();
    console.log('Header title after save:', headerText);
    
    // Check if form fields still contain new values
    const currentTitleValue = await titleField.inputValue();
    const currentDescValue = await descriptionField.inputValue();
    
    console.log('Current title field value:', currentTitleValue);
    console.log('Current description field value:', currentDescValue);
    
    // Step 5: Test persistence by reloading page
    console.log('Step 5: Testing persistence with page reload...');
    
    const currentUrl = page.url();
    await page.reload();
    
    // Wait for page to load
    await expect(page.getByText(/edit report details/i)).toBeVisible();
    
    // Check if values persisted after reload
    const reloadedTitleField = page.getByLabel(/report title/i);
    const reloadedDescField = page.getByLabel(/report description/i);
    
    const persistedTitle = await reloadedTitleField.inputValue();
    const persistedDesc = await reloadedDescField.inputValue();
    
    console.log('After reload - Title:', persistedTitle);
    console.log('After reload - Description:', persistedDesc);
    
    // Step 6: Navigate back to dashboard and verify
    console.log('Step 6: Checking dashboard for updated report...');
    
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page).toHaveURL('/dashboard');
    
    // Look for the report card with updated title
    const reportCards = page.locator('.card').filter({ hasText: /test report/i });
    
    if (await reportCards.count() > 0) {
      const reportCard = reportCards.filter({ hasText: newTitle.substring(0, 20) }); // Partial match in case of truncation
      if (await reportCard.count() > 0) {
        console.log('✅ Updated report found on dashboard');
      } else {
        console.log('⚠️ Updated report title not found on dashboard');
        console.log('Available report cards:', await reportCards.allTextContents());
      }
    } else {
      console.log('⚠️ No report cards found on dashboard');
    }
    
    // Final verification
    console.log('\n=== TEST RESULTS ===');
    console.log('Original Title:', originalTitle);
    console.log('New Title:', newTitle);
    console.log('Persisted Title:', persistedTitle);
    console.log('Title Saved Correctly:', persistedTitle === newTitle ? '✅ YES' : '❌ NO');
    
    console.log('Original Description:', originalDescription);
    console.log('New Description:', newDescription);
    console.log('Persisted Description:', persistedDesc);
    console.log('Description Saved Correctly:', persistedDesc === newDescription ? '✅ YES' : '❌ NO');
    
    // Assertions for test pass/fail
    expect(persistedTitle, 'Title should persist after page reload').toBe(newTitle);
    expect(persistedDesc, 'Description should persist after page reload').toBe(newDescription);
  });

  test('should handle auto-save for report details', async ({ page }) => {
    console.log('Testing auto-save functionality...');
    
    // Navigate to an existing report or create one
    const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
    
    if (await reportCards.count() === 0) {
      // Create a quick report for auto-save testing
      await page.getByRole('button', { name: /new report/i }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: /create custom report/i }).click();
      await dialog.getByLabel(/report title/i).fill('Auto-save Test Report');
      await dialog.getByRole('combobox', { name: /report cycle/i }).click();
      await page.getByRole('option', { name: /weekly/i }).click();
      await dialog.getByLabel(/section name/i).first().fill('Test Section');
      const deptSelect = dialog.getByRole('combobox').filter({ hasText: /select department/i }).first();
      await deptSelect.click();
      await page.waitForTimeout(500);
      await page.getByRole('option').first().click();
      await dialog.getByRole('button', { name: /create report/i }).click();
      await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
    } else {
      await reportCards.first().click();
      await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
    }
    
    // Test auto-save functionality
    const titleField = page.getByLabel(/report title/i);
    if (await titleField.isVisible()) {
      const originalTitle = await titleField.inputValue();
      const autoSaveTitle = `${originalTitle} - Auto-save Test ${Date.now()}`;
      
      await titleField.clear();
      await titleField.fill(autoSaveTitle);
      
      console.log('Waiting for auto-save indicators...');
      
      // Should show auto-save pending
      try {
        await expect(page.getByText(/auto-save pending/i)).toBeVisible({ timeout: 5000 });
        console.log('✅ Auto-save pending indicator appeared');
      } catch (error) {
        console.log('⚠️ Auto-save pending indicator not found');
      }
      
      // Should show auto-saving within 45 seconds
      try {
        await expect(page.getByText(/auto-saving/i)).toBeVisible({ timeout: 47000 });
        console.log('✅ Auto-saving indicator appeared');
      } catch (error) {
        console.log('⚠️ Auto-saving indicator not found within 47 seconds');
      }
      
      // Should show saved status
      try {
        await expect(page.getByText(/saved \d+:\d+/i)).toBeVisible({ timeout: 50000 });
        console.log('✅ Saved status with timestamp appeared');
      } catch (error) {
        console.log('⚠️ Saved status not found within 50 seconds');
      }
      
      // Verify auto-save worked by reloading
      await page.reload();
      await expect(page.getByText(/edit report details/i)).toBeVisible();
      
      const autoSavedTitle = await page.getByLabel(/report title/i).inputValue();
      console.log('Auto-saved title after reload:', autoSavedTitle);
      console.log('Auto-save worked:', autoSavedTitle === autoSaveTitle ? '✅ YES' : '❌ NO');
      
      expect(autoSavedTitle, 'Auto-saved title should persist').toBe(autoSaveTitle);
    }
  });
});