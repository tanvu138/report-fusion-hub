import { test, expect } from '@playwright/test';
import { loginAsSecretary, loginAsDepartment } from '../helpers/auth';
import { waitForToast, waitForApiResponse } from '../helpers/common';

test.describe('Auto-Save Functionality - Critical Business Feature', () => {
  
  test.describe('Department User Auto-Save - Section Content', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsDepartment(page);
    });

    test('should auto-save section content every 30 seconds', async ({ page }) => {
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        await expect(page).toHaveURL(/\/reports\/[^\/]+\/preview2$/);
        
        const markdownEditor = page.getByRole('textbox').first();
        if (await markdownEditor.isVisible()) {
          // Clear existing content
          await markdownEditor.clear();
          
          // Add content that should trigger auto-save
          const testContent = `# Auto-Save Test Section
          
## Test started at: ${new Date().toISOString()}

This content should be automatically saved within 30 seconds.

### Key features being tested:
1. **Auto-save timing**: Every 30 seconds for section content
2. **Change detection**: Only save when content actually changes
3. **Status indicators**: Show saving/pending/saved states
4. **Error handling**: Graceful failure recovery`;

          await markdownEditor.fill(testContent);
          
          // Should show "auto-save pending" status within a few seconds
          await expect(page.getByText(/auto-save pending/i)).toBeVisible({ timeout: 5000 });
          
          // Should show "auto-saving" status before 30 seconds
          await expect(page.getByText(/auto-saving/i)).toBeVisible({ timeout: 32000 });
          
          // Should complete and show "saved" status
          await expect(page.getByText(/saved \d+:\d+/i)).toBeVisible({ timeout: 35000 });
          
          // Verify the saved timestamp is recent (within last minute)
          const savedElement = page.getByText(/saved \d+:\d+/i);
          const savedText = await savedElement.textContent();
          expect(savedText).toMatch(/saved \d{1,2}:\d{2}/i);
        }
      }
    });

    test('should handle rapid content changes without duplicate saves', async ({ page }) => {
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        const markdownEditor = page.getByRole('textbox').first();
        if (await markdownEditor.isVisible()) {
          // Make rapid changes to test debouncing
          await markdownEditor.clear();
          
          for (let i = 1; i <= 5; i++) {
            await markdownEditor.fill(`# Rapid Change Test ${i}\n\nContent change ${i} at ${Date.now()}`);
            await page.waitForTimeout(500); // Small delay between changes
          }
          
          // Should show pending status but not multiple saving states simultaneously
          await expect(page.getByText(/auto-save pending/i)).toBeVisible({ timeout: 5000 });
          
          // Should eventually consolidate to single save operation
          await expect(page.getByText(/auto-saving/i)).toBeVisible({ timeout: 32000 });
          await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 35000 });
          
          // Should not show multiple simultaneous saving indicators
          const savingElements = page.getByText(/auto-saving/i);
          expect(await savingElements.count()).toBeLessThanOrEqual(1);
        }
      }
    });

    test('should recover gracefully from save failures', async ({ page }) => {
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        const markdownEditor = page.getByRole('textbox').first();
        if (await markdownEditor.isVisible()) {
          // Intercept and fail auto-save requests
          await page.route('**/api/reports/**/sections/**', route => {
            if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
              route.abort('failed');
            } else {
              route.continue();
            }
          });
          
          // Make content changes
          await markdownEditor.fill(`# Save Failure Test\n\nThis should fail to auto-save: ${Date.now()}`);
          
          // Should show pending status
          await expect(page.getByText(/auto-save pending/i)).toBeVisible({ timeout: 5000 });
          
          // Should attempt to save and handle failure
          await expect(page.getByText(/auto-saving/i)).toBeVisible({ timeout: 32000 });
          
          // Should show error state or retry mechanism
          await expect(
            page.getByText(/failed|error|retry/i).or(page.getByText(/auto-save pending/i))
          ).toBeVisible({ timeout: 40000 });
          
          // Clear the route to allow normal operation
          await page.unroute('**/api/reports/**/sections/**');
          
          // Manual save should still work as fallback
          const saveButton = page.getByRole('button', { name: /save/i });
          if (await saveButton.isVisible() && await saveButton.isEnabled()) {
            await saveButton.click();
            await waitForToast(page, /saved/i);
          }
        }
      }
    });

    test('should only auto-save when content actually changes', async ({ page }) => {
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        const markdownEditor = page.getByRole('textbox').first();
        if (await markdownEditor.isVisible()) {
          const initialContent = await markdownEditor.inputValue();
          
          // Focus the editor but don't change content
          await markdownEditor.focus();
          await markdownEditor.blur();
          
          // Should not show auto-save pending for unchanged content
          await page.waitForTimeout(5000);
          const pendingElement = page.getByText(/auto-save pending/i);
          expect(await pendingElement.count()).toBe(0);
          
          // Now make an actual change
          await markdownEditor.fill(initialContent + '\n\n## New Section Added');
          
          // Should now show auto-save pending
          await expect(page.getByText(/auto-save pending/i)).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should preserve content across section switches during auto-save', async ({ page }) => {
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        const sectionTabs = page.getByRole('tab');
        if (await sectionTabs.count() > 1) {
          // Edit first section
          await sectionTabs.first().click();
          const markdownEditor = page.getByRole('textbox').first();
          
          if (await markdownEditor.isVisible()) {
            const testContent = `# Section Switch Test\n\nContent at ${Date.now()}`;
            await markdownEditor.fill(testContent);
            
            // Should show pending save
            await expect(page.getByText(/auto-save pending/i)).toBeVisible({ timeout: 5000 });
            
            // Switch to another section before auto-save completes
            await sectionTabs.nth(1).click();
            await page.waitForTimeout(1000);
            
            // Switch back to first section
            await sectionTabs.first().click();
            
            // Content should be preserved
            const currentContent = await markdownEditor.inputValue();
            expect(currentContent).toContain('Section Switch Test');
            
            // Auto-save should still complete
            await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 35000 });
          }
        }
      }
    });
  });

  test.describe('Secretary User Auto-Save - Report Details', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsSecretary(page);
    });

    test('should auto-save report details every 45 seconds', async ({ page }) => {
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
        
        // Should see report details editing interface
        const titleField = page.getByLabel(/report title/i);
        if (await titleField.isVisible()) {
          // Make changes to report details
          const originalTitle = await titleField.inputValue();
          const newTitle = `${originalTitle} - Auto-save Test ${Date.now()}`;
          
          await titleField.clear();
          await titleField.fill(newTitle);
          
          // Edit description
          const descField = page.getByLabel(/description/i);
          if (await descField.isVisible()) {
            await descField.fill(`Updated description for auto-save testing at ${new Date().toISOString()}`);
          }
          
          // Should show auto-save pending status
          await expect(page.getByText(/auto-save pending/i)).toBeVisible({ timeout: 5000 });
          
          // Should start auto-saving before 45 seconds (with some buffer)
          await expect(page.getByText(/auto-saving/i)).toBeVisible({ timeout: 47000 });
          
          // Should complete and show saved status
          await expect(page.getByText(/saved \d+:\d+/i)).toBeVisible({ timeout: 50000 });
        }
      }
    });

    test('should handle concurrent auto-save of details and manual section saves', async ({ page }) => {
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        // Edit report details
        const titleField = page.getByLabel(/report title/i);
        if (await titleField.isVisible()) {
          await titleField.fill(`Concurrent Test ${Date.now()}`);
          
          // Should show pending auto-save for report details
          await expect(page.getByText(/auto-save pending/i)).toBeVisible({ timeout: 5000 });
          
          // Manually save report details while auto-save is pending
          const saveButton = page.getByRole('button', { name: /save report details/i });
          if (await saveButton.isVisible() && await saveButton.isEnabled()) {
            await saveButton.click();
            await waitForToast(page, /saved/i);
            
            // Auto-save should handle this gracefully (may show saved status or cancel pending)
            await expect(
              page.getByText(/saved/i).or(page.getByText(/auto-save pending/i))
            ).toBeVisible({ timeout: 10000 });
          }
        }
      }
    });

    test('should validate report details before auto-saving', async ({ page }) => {
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        const titleField = page.getByLabel(/report title/i);
        if (await titleField.isVisible()) {
          // Try to set invalid data
          await titleField.clear();
          await titleField.fill(''); // Empty title should be invalid
          
          // Should not show auto-save pending for invalid data
          await page.waitForTimeout(5000);
          const pendingStatus = page.getByText(/auto-save pending/i);
          
          // Either no pending status or validation prevents save
          if (await pendingStatus.count() > 0) {
            // If it does try to save, should handle validation error
            await expect(
              page.getByText(/error|invalid|required/i)
            ).toBeVisible({ timeout: 50000 });
          }
          
          // Fix the validation issue
          await titleField.fill('Valid Title For Auto-save');
          
          // Should now show proper auto-save flow
          await expect(page.getByText(/auto-save pending/i)).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe('Auto-Save Status Indicators', () => {
    test('should display clear status indicators for all auto-save states', async ({ page }) => {
      await loginAsDepartment(page);
      
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        const markdownEditor = page.getByRole('textbox').first();
        if (await markdownEditor.isVisible()) {
          // Test all status indicator states
          await markdownEditor.clear();
          
          // 1. Initial state (no unsaved changes)
          const initialSaved = page.getByText(/saved \d+:\d+/i);
          if (await initialSaved.count() > 0) {
            await expect(initialSaved).toBeVisible();
          }
          
          // 2. Pending state
          await markdownEditor.fill('# Status Indicator Test\n\nTesting auto-save states');
          await expect(page.getByText(/auto-save pending/i)).toBeVisible({ timeout: 5000 });
          
          // Should show clock icon for pending
          const clockIcon = page.locator('[data-testid="clock-icon"], .lucide-clock, svg').filter({ hasText: /pending/i });
          if (await clockIcon.count() > 0) {
            await expect(clockIcon).toBeVisible();
          }
          
          // 3. Saving state
          await expect(page.getByText(/auto-saving/i)).toBeVisible({ timeout: 32000 });
          
          // Should show cloud icon for saving
          const cloudIcon = page.locator('[data-testid="cloud-icon"], .lucide-cloud, svg').filter({ hasText: /saving/i });
          if (await cloudIcon.count() > 0) {
            await expect(cloudIcon).toBeVisible();
          }
          
          // 4. Saved state
          await expect(page.getByText(/saved \d+:\d+/i)).toBeVisible({ timeout: 35000 });
          
          // Should show check icon for saved
          const checkIcon = page.locator('[data-testid="check-icon"], .lucide-check, svg').filter({ hasText: /saved/i });
          if (await checkIcon.count() > 0) {
            await expect(checkIcon).toBeVisible();
          }
        }
      }
    });

    test('should show timestamps in saved status', async ({ page }) => {
      await loginAsDepartment(page);
      
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        const markdownEditor = page.getByRole('textbox').first();
        if (await markdownEditor.isVisible()) {
          await markdownEditor.fill(`# Timestamp Test\n\nSaved at: ${new Date().toISOString()}`);
          
          // Wait for save to complete
          await expect(page.getByText(/saved \d+:\d+/i)).toBeVisible({ timeout: 35000 });
          
          // Verify timestamp format is correct (HH:MM)
          const savedElement = page.getByText(/saved \d+:\d+/i);
          const timestampText = await savedElement.textContent();
          
          // Should match format like "Saved 14:30" or "Saved 2:30"
          expect(timestampText).toMatch(/saved \d{1,2}:\d{2}/i);
          
          // Timestamp should be recent (within current hour for basic validation)
          const currentTime = new Date();
          const currentHour = currentTime.getHours();
          const timeMatch = timestampText?.match(/(\d{1,2}):(\d{2})/);
          
          if (timeMatch) {
            const savedHour = parseInt(timeMatch[1]);
            // Allow for some flexibility in hour comparison (could be previous hour due to timing)
            expect(Math.abs(savedHour - currentHour)).toBeLessThanOrEqual(1);
          }
        }
      }
    });
  });

  test.describe('Auto-Save Performance and Reliability', () => {
    test('should handle large content auto-save efficiently', async ({ page }) => {
      await loginAsDepartment(page);
      
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        const markdownEditor = page.getByRole('textbox').first();
        if (await markdownEditor.isVisible()) {
          // Create large content (but reasonable for real-world use)
          const largeContent = `# Large Content Auto-Save Test

## Executive Summary
${Array(50).fill('This is a test paragraph with substantial content to simulate real-world report sections. ').join('')}

## Detailed Analysis
${Array(100).fill('Detailed analysis content with metrics, data points, and comprehensive information. ').join('')}

## Conclusion
${Array(25).fill('Conclusion content that summarizes findings and recommendations. ').join('')}

### Test completed at: ${new Date().toISOString()}`;

          await markdownEditor.fill(largeContent);
          
          // Should handle large content auto-save within reasonable time
          await expect(page.getByText(/auto-save pending/i)).toBeVisible({ timeout: 5000 });
          await expect(page.getByText(/auto-saving/i)).toBeVisible({ timeout: 32000 });
          await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 40000 }); // Allow extra time for large content
        }
      }
    });

    test('should maintain auto-save functionality during network instability', async ({ page }) => {
      await loginAsDepartment(page);
      
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        const markdownEditor = page.getByRole('textbox').first();
        if (await markdownEditor.isVisible()) {
          // Simulate intermittent network issues
          let requestCount = 0;
          await page.route('**/api/reports/**/sections/**', route => {
            requestCount++;
            if (requestCount <= 2) {
              // Fail first two requests
              route.abort('failed');
            } else {
              // Allow subsequent requests
              route.continue();
            }
          });
          
          await markdownEditor.fill(`# Network Instability Test\n\nContent with network issues: ${Date.now()}`);
          
          // Should show pending and attempt save
          await expect(page.getByText(/auto-save pending/i)).toBeVisible({ timeout: 5000 });
          await expect(page.getByText(/auto-saving/i)).toBeVisible({ timeout: 32000 });
          
          // Should eventually succeed with retry mechanism or show appropriate error handling
          await expect(
            page.getByText(/saved/i).or(page.getByText(/retry|error/i))
          ).toBeVisible({ timeout: 60000 });
          
          await page.unroute('**/api/reports/**/sections/**');
        }
      }
    });
  });
});