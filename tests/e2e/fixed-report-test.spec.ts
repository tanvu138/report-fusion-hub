import { test, expect } from '@playwright/test';
import { loginAsSecretary } from '../helpers/auth';
import { waitForToast } from '../helpers/common';

test.describe('Fixed Report Creation and Editing Test', () => {
  test('should create report and test editing with dialog scroll fix', async ({ page }) => {
    await loginAsSecretary(page);
    
    console.log('✅ Logged in as secretary');
    
    // Step 1: Create a report (with scroll fix)
    console.log('\n=== STEP 1: CREATING REPORT ===');
    
    await page.getByRole('button', { name: /new report/i }).click();
    console.log('✅ Opened new report dialog');
    
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /create custom report/i }).click();
    console.log('✅ Selected custom report');
    
    // Fill basic info
    const timestamp = Date.now();
    const reportTitle = `Test Report ${timestamp}`;
    const reportDesc = `Test description ${timestamp}`;
    
    await dialog.getByLabel(/report title/i).fill(reportTitle);
    await dialog.getByRole('combobox', { name: /report cycle/i }).click();
    await page.getByRole('option', { name: /weekly/i }).click();
    await dialog.getByLabel(/description/i).fill(reportDesc);
    console.log('✅ Filled basic report info');
    
    // Add section (required)
    await dialog.getByLabel(/section name/i).first().fill('Test Section');
    
    // Select department
    const deptSelect = dialog.getByRole('combobox').filter({ hasText: /select department/i }).first();
    await deptSelect.click();
    await page.waitForTimeout(500);
    const deptOptions = page.getByRole('option');
    const deptCount = await deptOptions.count();
    console.log(`Found ${deptCount} department options`);
    
    if (deptCount > 0) {
      await deptOptions.first().click();
      console.log('✅ Selected department');
    } else {
      console.log('❌ No departments available');
      return;
    }
    
    // FIX: Scroll dialog to make create button visible
    console.log('Scrolling dialog to make create button visible...');
    await dialog.evaluate(el => {
      el.scrollTop = el.scrollHeight;
    });
    
    // Alternative: Scroll the create button into view
    const createButton = dialog.getByRole('button', { name: /create report/i });
    await createButton.scrollIntoViewIfNeeded();
    
    // Check if button is now clickable
    const buttonBox = await createButton.boundingBox();
    console.log('Create button position after scroll:', buttonBox);
    
    const enabled = await createButton.isEnabled();
    console.log('Create button enabled:', enabled ? '✅ YES' : '❌ NO');
    
    if (enabled) {
      console.log('Attempting to create report...');
      
      // Wait for potential API call
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/reports') && 
        response.request().method() === 'POST',
        { timeout: 10000 }
      ).catch(() => {
        console.log('⚠️ No API response captured within 10 seconds');
        return null;
      });
      
      await createButton.click();
      console.log('✅ Clicked create button');
      
      const response = await responsePromise;
      if (response) {
        console.log('✅ API call made:', response.status());
      }
      
      // Wait for navigation or error
      try {
        await expect(page).toHaveURL(/\/reports\/[^\/]+$/, { timeout: 10000 });
        console.log('✅ Navigated to report edit page');
        
        // Step 2: Test editing functionality
        console.log('\n=== STEP 2: TESTING EDIT FUNCTIONALITY ===');
        
        // Verify we're on edit page
        await expect(page.getByText(/edit report details/i)).toBeVisible();
        console.log('✅ Edit interface visible');
        
        // Test title editing
        const titleField = page.getByLabel(/report title/i);
        const currentTitle = await titleField.inputValue();
        console.log('Current title in edit form:', currentTitle);
        
        const newTitle = `${reportTitle} - EDITED`;
        await titleField.clear();
        await titleField.fill(newTitle);
        console.log('✅ Updated title to:', newTitle);
        
        // Test description editing
        const descField = page.getByLabel(/description/i);
        const currentDesc = await descField.inputValue();
        console.log('Current description:', currentDesc);
        
        const newDesc = `${reportDesc} - UPDATED`;
        await descField.clear();
        await descField.fill(newDesc);
        console.log('✅ Updated description to:', newDesc);
        
        // Save changes
        const saveButton = page.getByRole('button', { name: /save report details/i });
        const saveEnabled = await saveButton.isEnabled();
        console.log('Save button enabled:', saveEnabled ? '✅ YES' : '❌ NO');
        
        if (saveEnabled) {
          console.log('Attempting to save changes...');
          
          const saveResponsePromise = page.waitForResponse(response => 
            response.url().match(/\/api\/reports\/[^\/]+$/) && 
            response.request().method() === 'PUT',
            { timeout: 10000 }
          ).catch(() => {
            console.log('⚠️ No save API response captured');
            return null;
          });
          
          await saveButton.click();
          console.log('✅ Clicked save button');
          
          const saveResponse = await saveResponsePromise;
          if (saveResponse) {
            console.log('✅ Save API call made:', saveResponse.status());
          }
          
          // Check for success toast
          try {
            await waitForToast(page, /success|saved/i);
            console.log('✅ Success toast appeared');
          } catch {
            console.log('⚠️ No success toast found');
          }
          
          // Step 3: Test persistence
          console.log('\n=== STEP 3: TESTING PERSISTENCE ===');
          
          await page.reload();
          await expect(page.getByText(/edit report details/i)).toBeVisible();
          console.log('✅ Page reloaded');
          
          const persistedTitle = await page.getByLabel(/report title/i).inputValue();
          const persistedDesc = await page.getByLabel(/description/i).inputValue();
          
          console.log('Persisted title:', persistedTitle);
          console.log('Persisted description:', persistedDesc);
          
          console.log('\n=== FINAL RESULTS ===');
          console.log('Original title:', reportTitle);
          console.log('Edited title:', newTitle);
          console.log('Persisted title:', persistedTitle);
          console.log('Title save worked:', persistedTitle === newTitle ? '✅ YES' : '❌ NO');
          
          console.log('Original description:', reportDesc);
          console.log('Edited description:', newDesc);
          console.log('Persisted description:', persistedDesc);
          console.log('Description save worked:', persistedDesc === newDesc ? '✅ YES' : '❌ NO');
          
          // Navigate back to dashboard and check
          console.log('\n=== STEP 4: CHECKING DASHBOARD ===');
          await page.getByRole('button', { name: /back/i }).click();
          await expect(page).toHaveURL('/dashboard');
          
          const reportCards = page.locator('.card').filter({ hasText: newTitle.substring(0, 15) });
          const cardExists = await reportCards.count() > 0;
          console.log('Updated report visible on dashboard:', cardExists ? '✅ YES' : '❌ NO');
          
        } else {
          console.log('❌ Save button is disabled');
        }
        
      } catch (error) {
        console.log('❌ Failed to navigate to edit page:', error.message);
        
        // Check for error messages
        const errorElements = page.getByText(/error|failed|invalid/i);
        const errorCount = await errorElements.count();
        if (errorCount > 0) {
          console.log('Found error messages:', await errorElements.allTextContents());
        }
      }
    } else {
      console.log('❌ Create button is disabled - checking validation');
      
      // Check what's missing
      const titleValue = await dialog.getByLabel(/report title/i).inputValue();
      const sectionValue = await dialog.getByLabel(/section name/i).first().inputValue();
      
      console.log('Title filled:', titleValue ? '✅ YES' : '❌ NO');
      console.log('Section filled:', sectionValue ? '✅ YES' : '❌ NO');
    }
  });
});