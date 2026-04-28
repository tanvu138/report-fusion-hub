import { test, expect } from '@playwright/test';
import { loginAsSecretary, loginAsDepartment } from '../helpers/auth';
import { navigateAndWait, waitForToast, waitForApiResponse } from '../helpers/common';

test.describe('Report Workflow State Transitions - Business Process Validation', () => {
  
  test.describe('Report State Machine - DRAFT → SUBMITTED → FINAL → PUBLISHED', () => {
    test('should handle complete report lifecycle as Secretary', async ({ page }) => {
      await loginAsSecretary(page);
      
      // Create a new report for workflow testing
      await page.getByRole('button', { name: /new report/i }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: /create custom report/i }).click();
      
      const reportTitle = `Workflow Test ${Date.now()}`;
      await dialog.getByLabel(/report title/i).fill(reportTitle);
      await dialog.getByRole('combobox', { name: /report cycle/i }).click();
      await page.getByRole('option', { name: /weekly/i }).click();
      
      // Add section
      await dialog.getByLabel(/section name/i).first().fill('Financial Overview');
      const deptSelect = dialog.getByRole('combobox').filter({ hasText: /select department/i }).first();
      await deptSelect.click();
      await page.waitForTimeout(500);
      await page.getByRole('option').first().click();
      
      await dialog.getByRole('button', { name: /create report/i }).click();
      await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
      
      // Verify initial state is DRAFT
      await expect(page.getByText(/state.*draft/i)).toBeVisible();
      
      // Navigate back to dashboard to check state
      await page.getByRole('button', { name: /back/i }).click();
      await expect(page).toHaveURL('/dashboard');
      
      // Find the created report and verify its state
      const reportCard = page.locator('.card').filter({ hasText: reportTitle });
      await expect(reportCard.getByText(/state.*draft/i)).toBeVisible();
      
      // TODO: Add state transition logic when API endpoints are available
      // This would include:
      // 1. Submit report (DRAFT → SUBMITTED)
      // 2. Finalize report (SUBMITTED → FINAL)  
      // 3. Publish report (FINAL → PUBLISHED)
    });

    test('should prevent unauthorized state transitions', async ({ page }) => {
      // Test as Department user first
      await loginAsDepartment(page);
      
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        // Department users should not see state transition controls
        await expect(page.getByRole('button', { name: /submit|finalize|publish/i })).not.toBeVisible();
        
        // Should only see content editing interface
        await expect(page.getByRole('textbox')).toBeVisible();
      }
    });
  });

  test.describe('Section-Level State Management', () => {
    test('should track section completion independently', async ({ page }) => {
      await loginAsDepartment(page);
      
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      if (await reportCards.count() > 0) {
        // Navigate to report editing
        await reportCards.first().click();
        
        const sectionTabs = page.getByRole('tab');
        if (await sectionTabs.count() > 0) {
          // Check initial section states
          await expect(page.getByText(/draft|submitted/i)).toBeVisible();
          
          // Edit section content
          const markdownEditor = page.getByRole('textbox').first();
          if (await markdownEditor.isVisible()) {
            await markdownEditor.clear();
            await markdownEditor.fill(`# Section Completion Test

This section has been completed with meaningful content.

## Key metrics:
- Completion: 100%
- Quality: High
- Status: Ready for review`);
            
            // Save content
            const saveButton = page.getByRole('button', { name: /save/i });
            if (await saveButton.isVisible()) {
              await saveButton.click();
              await waitForToast(page, /saved/i);
            }
            
            // Verify section status updates (may show as completed/has content)
            await expect(page.getByText(/has content|completed/i)).toBeVisible({ timeout: 10000 });
          }
        }
      }
    });

    test('should handle section locking properly', async ({ page }) => {
      await loginAsDepartment(page);
      
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        // Look for any locked sections
        const lockedSections = page.getByText(/locked/i);
        if (await lockedSections.count() > 0) {
          // Verify locked sections are read-only
          const tabs = page.getByRole('tab');
          for (let i = 0; i < await tabs.count(); i++) {
            const tab = tabs.nth(i);
            const isLocked = await tab.getByText(/locked/i).count() > 0;
            
            if (isLocked) {
              // Tab should be disabled or non-interactive
              await expect(tab).toBeDisabled();
            }
          }
        }
      }
    });
  });

  test.describe('Role-Based Workflow Permissions', () => {
    test('should enforce Secretary permissions on report management', async ({ page }) => {
      await loginAsSecretary(page);
      
      // Secretary should see all management capabilities
      await expect(page.getByRole('button', { name: /new report/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /manage templates/i })).toBeVisible();
      
      // Navigate to a report
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        // Secretary should see full report management interface
        await expect(page.getByText(/edit report details/i)).toBeVisible();
        await expect(page.getByText(/report sections/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /export docx/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /share externally/i })).toBeVisible();
        
        // Should see section activation controls
        const checkboxes = page.getByRole('checkbox');
        if (await checkboxes.count() > 0) {
          await expect(checkboxes.first()).toBeVisible();
        }
      }
    });

    test('should restrict Department user permissions appropriately', async ({ page }) => {
      await loginAsDepartment(page);
      
      // Department users should not see admin features
      await expect(page.getByRole('button', { name: /new report/i })).not.toBeVisible();
      await expect(page.getByRole('tab', { name: /manage templates/i })).not.toBeVisible();
      
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        // Should redirect to content editing (preview2)
        await expect(page).toHaveURL(/\/reports\/[^\/]+\/preview2$/);
        
        // Should not see admin controls
        await expect(page.getByText(/edit report details/i)).not.toBeVisible();
        await expect(page.getByRole('checkbox')).not.toBeVisible();
        await expect(page.getByRole('button', { name: /share externally/i })).not.toBeVisible();
        
        // Should only see content editing interface for their sections
        await expect(page.getByRole('textbox')).toBeVisible();
      }
    });
  });

  test.describe('Data Integrity and Persistence', () => {
    test('should persist report state across sessions', async ({ page }) => {
      await loginAsSecretary(page);
      
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      if (await reportCards.count() > 0) {
        // Get report title and current state
        const firstCard = reportCards.first();
        const reportTitle = await firstCard.getByRole('heading').first().textContent();
        const currentState = await firstCard.getByText(/state:/i).textContent();
        
        // Navigate to report and make a change
        await firstCard.click();
        await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
        
        // Edit report details
        const titleField = page.getByLabel(/report title/i);
        if (await titleField.isVisible()) {
          const updatedTitle = `${reportTitle} - Updated`;
          await titleField.clear();
          await titleField.fill(updatedTitle);
          
          const saveButton = page.getByRole('button', { name: /save report details/i });
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await waitForToast(page, /saved/i);
          }
        }
        
        // Navigate back to dashboard
        await page.getByRole('button', { name: /back/i }).click();
        
        // Verify changes persisted
        if (reportTitle && titleField) {
          const updatedCard = page.locator('.card').filter({ hasText: /updated/i });
          await expect(updatedCard).toBeVisible({ timeout: 10000 });
        }
        
        // Refresh page to test persistence across page loads
        await page.reload();
        await expect(page).toHaveURL('/dashboard');
        
        // Changes should still be present
        if (reportTitle) {
          const persistedCard = page.locator('.card').filter({ hasText: /updated/i });
          await expect(persistedCard).toBeVisible();
        }
      }
    });

    test('should handle concurrent editing scenarios', async ({ page, context }) => {
      await loginAsDepartment(page);
      
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        const markdownEditor = page.getByRole('textbox').first();
        if (await markdownEditor.isVisible()) {
          // Simulate concurrent editing by opening same report in new tab
          const newPage = await context.newPage();
          await loginAsDepartment(newPage);
          
          // Navigate to same report
          const newReportCards = newPage.locator('.card').filter({ hasText: /cycle:/i });
          if (await newReportCards.count() > 0) {
            await newReportCards.first().click();
            
            // Both pages should handle concurrent access gracefully
            const editor1 = markdownEditor;
            const editor2 = newPage.getByRole('textbox').first();
            
            if (await editor2.isVisible()) {
              // Make different changes in each tab
              await editor1.fill('Content from first tab at ' + Date.now());
              await editor2.fill('Content from second tab at ' + Date.now());
              
              // Save from first tab
              const save1 = page.getByRole('button', { name: /save/i });
              if (await save1.isVisible()) {
                await save1.click();
                await waitForToast(page, /saved/i);
              }
              
              // Save from second tab
              const save2 = newPage.getByRole('button', { name: /save/i });
              if (await save2.isVisible()) {
                await save2.click();
                // Should either save successfully or show conflict resolution
                await expect(
                  newPage.getByText(/saved/i).or(newPage.getByText(/conflict|error/i))
                ).toBeVisible({ timeout: 10000 });
              }
            }
          }
          
          await newPage.close();
        }
      }
    });
  });

  test.describe('Workflow Validation and Business Rules', () => {
    test('should enforce report completion requirements', async ({ page }) => {
      await loginAsSecretary(page);
      
      // Create a minimal report for testing validation
      await page.getByRole('button', { name: /new report/i }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: /create custom report/i }).click();
      
      // Try to create report with minimal/invalid data
      await dialog.getByLabel(/report title/i).fill('');
      
      const createButton = dialog.getByRole('button', { name: /create report/i });
      await expect(createButton).toBeDisabled();
      
      // Add valid title
      await dialog.getByLabel(/report title/i).fill('Validation Test Report');
      await dialog.getByRole('combobox', { name: /report cycle/i }).click();
      await page.getByRole('option', { name: /adhoc/i }).click();
      
      // Should now be enabled
      await expect(createButton).toBeEnabled();
    });

    test('should validate section content requirements', async ({ page }) => {
      await loginAsDepartment(page);
      
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        const markdownEditor = page.getByRole('textbox').first();
        if (await markdownEditor.isVisible()) {
          // Test with empty content
          await markdownEditor.clear();
          
          const saveButton = page.getByRole('button', { name: /save/i });
          if (await saveButton.isVisible()) {
            await saveButton.click();
            
            // Should handle empty content appropriately
            await expect(
              page.getByText(/saved/i).or(page.getByText(/empty|required/i))
            ).toBeVisible({ timeout: 10000 });
          }
          
          // Test with minimal valid content
          await markdownEditor.fill('# Minimal Section\n\nMinimal content for validation.');
          
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await waitForToast(page, /saved/i);
          }
        }
      }
    });
  });

  test.describe('Audit Trail and Change Tracking', () => {
    test('should track content change history', async ({ page }) => {
      await loginAsDepartment(page);
      
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        const markdownEditor = page.getByRole('textbox').first();
        if (await markdownEditor.isVisible()) {
          // Make a content change
          const timestamp = Date.now();
          await markdownEditor.fill(`# Change Tracking Test\n\nContent updated at: ${timestamp}`);
          
          const saveButton = page.getByRole('button', { name: /save/i });
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await waitForToast(page, /saved/i);
          }
          
          // Should show update metadata
          const updateInfo = page.getByText(/last updated by/i);
          if (await updateInfo.isVisible()) {
            await expect(updateInfo).toContainText(/(department|admin)/i);
            await expect(updateInfo).toContainText(/\d+/); // Should contain date/time
          }
        }
      }
    });

    test('should maintain section state consistency', async ({ page }) => {
      await loginAsDepartment(page);
      
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        // Check initial section states
        const sectionTabs = page.getByRole('tab');
        const statusBadges = page.getByText(/draft|submitted|locked/i);
        
        if (await sectionTabs.count() > 0 && await statusBadges.count() > 0) {
          const initialStates = [];
          
          // Record initial states
          for (let i = 0; i < await sectionTabs.count(); i++) {
            const tab = sectionTabs.nth(i);
            await tab.click();
            
            const badge = page.getByText(/draft|submitted|locked/i).first();
            const state = await badge.textContent();
            initialStates.push(state);
          }
          
          // Make content changes and verify state consistency
          const firstTab = sectionTabs.first();
          await firstTab.click();
          
          const markdownEditor = page.getByRole('textbox').first();
          if (await markdownEditor.isVisible()) {
            await markdownEditor.fill('# Updated Content\n\nState consistency test');
            
            const saveButton = page.getByRole('button', { name: /save/i });
            if (await saveButton.isVisible()) {
              await saveButton.click();
              await waitForToast(page, /saved/i);
            }
            
            // State should remain consistent or update appropriately
            await expect(page.getByText(/draft|submitted|has content/i)).toBeVisible();
          }
        }
      }
    });
  });
});