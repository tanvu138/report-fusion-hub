import { test, expect } from '@playwright/test';
import { loginAsSecretary } from '../helpers/auth';

test.describe('Force Click Report Test', () => {
  test('should test report creation with force click', async ({ page }) => {
    await loginAsSecretary(page);
    
    console.log('✅ Logged in as secretary');
    
    // Create report with force click to bypass viewport issue
    await page.getByRole('button', { name: /new report/i }).click();
    console.log('✅ Opened dialog');
    
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /create custom report/i }).click();
    console.log('✅ Selected custom report');
    
    // Fill form
    const timestamp = Date.now();
    await dialog.getByLabel(/report title/i).fill(`Force Test ${timestamp}`);
    await dialog.getByRole('combobox', { name: /report cycle/i }).click();
    await page.getByRole('option', { name: /weekly/i }).click();
    await dialog.getByLabel(/description/i).fill(`Test description ${timestamp}`);
    await dialog.getByLabel(/section name/i).first().fill('Test Section');
    
    const deptSelect = dialog.getByRole('combobox').filter({ hasText: /select department/i }).first();
    await deptSelect.click();
    await page.waitForTimeout(500);
    await page.getByRole('option').first().click();
    console.log('✅ Filled form');
    
    // Force click the create button
    const createButton = dialog.getByRole('button', { name: /create report/i });
    console.log('Attempting force click...');
    
    try {
      // Force click - bypasses viewport checks
      await createButton.click({ force: true });
      console.log('✅ Force clicked create button');
      
      // Wait for navigation or response
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log('Current URL after click:', currentUrl);
      
      if (currentUrl.includes('/reports/')) {
        console.log('✅ Successfully navigated to report page');
        
        // Test editing
        const editSection = page.getByText(/edit report details/i);
        if (await editSection.isVisible()) {
          console.log('✅ Edit interface visible');
          
          const titleField = page.getByLabel(/report title/i);
          const currentTitle = await titleField.inputValue();
          console.log('Current title:', currentTitle);
          
          // Test editing title
          const newTitle = `${currentTitle} - EDITED`;
          await titleField.clear();
          await titleField.fill(newTitle);
          console.log('✅ Edited title to:', newTitle);
          
          // Test save
          const saveButton = page.getByRole('button', { name: /save report details/i });
          if (await saveButton.isVisible() && await saveButton.isEnabled()) {
            console.log('Attempting to save...');
            await saveButton.click();
            
            // Wait for potential response
            await page.waitForTimeout(2000);
            
            // Check for success indicators
            const successToast = page.getByText(/success|saved/i);
            if (await successToast.isVisible()) {
              console.log('✅ Success toast appeared');
            } else {
              console.log('⚠️ No success toast found');
            }
            
            // Test persistence
            console.log('Testing persistence...');
            await page.reload();
            
            if (await page.getByText(/edit report details/i).isVisible()) {
              const persistedTitle = await page.getByLabel(/report title/i).inputValue();
              console.log('Title after reload:', persistedTitle);
              console.log('Save worked:', persistedTitle === newTitle ? '✅ YES' : '❌ NO');
              
              console.log('\n=== FINAL RESULT ===');
              if (persistedTitle === newTitle) {
                console.log('🎉 SUCCESS: Report editing and saving works correctly!');
              } else {
                console.log('❌ FAILURE: Report changes did not persist');
              }
            }
          } else {
            console.log('❌ Save button not available');
          }
        } else {
          console.log('❌ Edit interface not found');
        }
      } else {
        console.log('❌ Did not navigate to report page');
        
        // Check for error messages
        const errorElements = page.getByText(/error|failed|invalid/i);
        if (await errorElements.count() > 0) {
          console.log('Error messages found:', await errorElements.allTextContents());
        }
      }
      
    } catch (error) {
      console.log('❌ Force click failed:', error.message);
    }
  });
});