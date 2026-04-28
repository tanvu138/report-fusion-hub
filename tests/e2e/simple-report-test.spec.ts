import { test, expect } from '@playwright/test';
import { loginAsSecretary } from '../helpers/auth';

test.describe('Simple Report Editing Test', () => {
  test('should test basic report editing functionality', async ({ page }) => {
    await loginAsSecretary(page);
    
    console.log('✅ Logged in as secretary');
    
    // Check if we're on dashboard
    await expect(page).toHaveURL('/dashboard');
    console.log('✅ On dashboard');
    
    // Look for existing reports
    const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
    const reportCount = await reportCards.count();
    console.log(`Found ${reportCount} existing reports`);
    
    if (reportCount > 0) {
      console.log('Testing with existing report...');
      
      // Click on first report
      await reportCards.first().click();
      console.log('✅ Clicked on first report');
      
      // Should navigate to report edit page
      await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
      console.log('✅ Navigated to report edit page');
      
      // Check if edit interface exists
      const editSection = page.getByText(/edit report details/i);
      const hasEditInterface = await editSection.isVisible();
      console.log('Has edit interface:', hasEditInterface ? '✅ YES' : '❌ NO');
      
      if (hasEditInterface) {
        // Test title field
        const titleField = page.getByLabel(/report title/i);
        const titleExists = await titleField.isVisible();
        console.log('Title field exists:', titleExists ? '✅ YES' : '❌ NO');
        
        if (titleExists) {
          const originalTitle = await titleField.inputValue();
          console.log('Original title:', originalTitle);
          
          // Try to edit title
          const testTitle = `${originalTitle} - TEST EDIT`;
          await titleField.clear();
          await titleField.fill(testTitle);
          console.log('✅ Filled new title:', testTitle);
          
          // Check if save button exists
          const saveButton = page.getByRole('button', { name: /save report details/i });
          const saveExists = await saveButton.isVisible();
          console.log('Save button exists:', saveExists ? '✅ YES' : '❌ NO');
          
          if (saveExists) {
            const saveEnabled = await saveButton.isEnabled();
            console.log('Save button enabled:', saveEnabled ? '✅ YES' : '❌ NO');
            
            if (saveEnabled) {
              console.log('Attempting to save...');
              await saveButton.click();
              
              // Wait a moment for any response
              await page.waitForTimeout(2000);
              
              // Check for success indicators
              const successToast = page.getByText(/success|saved/i);
              const hasSuccess = await successToast.isVisible();
              console.log('Success message appeared:', hasSuccess ? '✅ YES' : '❌ NO');
              
              // Test persistence by reloading
              console.log('Testing persistence...');
              await page.reload();
              
              // Wait for page to load
              await expect(page.getByText(/edit report details/i)).toBeVisible();
              
              const reloadedTitle = await page.getByLabel(/report title/i).inputValue();
              console.log('Title after reload:', reloadedTitle);
              console.log('Title persisted:', reloadedTitle === testTitle ? '✅ YES' : '❌ NO');
            }
          }
        }
        
        // Test description field
        const descField = page.getByLabel(/description/i);
        const descExists = await descField.isVisible();
        console.log('Description field exists:', descExists ? '✅ YES' : '❌ NO');
        
        if (descExists) {
          const originalDesc = await descField.inputValue();
          console.log('Original description:', originalDesc);
        }
      }
    } else {
      console.log('❌ No existing reports found - need to test report creation');
      
      // Try simple report creation
      const newReportButton = page.getByRole('button', { name: /new report/i });
      const buttonExists = await newReportButton.isVisible();
      console.log('New Report button exists:', buttonExists ? '✅ YES' : '❌ NO');
      
      if (buttonExists) {
        await newReportButton.click();
        console.log('✅ Clicked New Report button');
        
        // Check if dialog opens
        const dialog = page.getByRole('dialog');
        const dialogVisible = await dialog.isVisible();
        console.log('Dialog opened:', dialogVisible ? '✅ YES' : '❌ NO');
        
        if (dialogVisible) {
          console.log('Dialog is open, checking content...');
          
          // Check dialog size and positioning
          const dialogBox = await dialog.boundingBox();
          console.log('Dialog dimensions:', dialogBox);
          
          // Look for creation options
          const customButton = dialog.getByRole('button', { name: /create custom report/i });
          const customExists = await customButton.isVisible();
          console.log('Custom report option exists:', customExists ? '✅ YES' : '❌ NO');
          
          if (customExists) {
            await customButton.click();
            console.log('✅ Selected custom report');
            
            // Check form fields
            const titleField = dialog.getByLabel(/report title/i);
            const titleExists = await titleField.isVisible();
            console.log('Title field in dialog exists:', titleExists ? '✅ YES' : '❌ NO');
            
            // Check create button position
            const createButton = dialog.getByRole('button', { name: /create report/i });
            const createExists = await createButton.isVisible();
            console.log('Create button exists:', createExists ? '✅ YES' : '❌ NO');
            
            if (createExists) {
              const createBox = await createButton.boundingBox();
              console.log('Create button position:', createBox);
              
              const viewportSize = page.viewportSize();
              console.log('Viewport size:', viewportSize);
              
              if (createBox && viewportSize) {
                const inViewport = createBox.y + createBox.height <= viewportSize.height;
                console.log('Create button in viewport:', inViewport ? '✅ YES' : '❌ NO');
              }
            }
          }
        }
      }
    }
    
    console.log('\n=== TEST SUMMARY ===');
    console.log('This test checked the basic functionality of report editing interface');
    console.log('Key findings will be logged above');
  });
});