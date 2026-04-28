import { test, expect } from '@playwright/test';
import { loginAsDepartment, TEST_USERS } from '../helpers/auth';
import { navigateAndWait, waitForToast, waitForLoadingToComplete, waitForApiResponse } from '../helpers/common';

test.describe('Department User Workflows - Content Creation and Editing', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDepartment(page);
  });

  test.describe('Report Discovery and Navigation', () => {
    test('should display department user dashboard with onboarding guidance', async ({ page }) => {
      // Should be on dashboard after login
      await expect(page).toHaveURL('/dashboard');
      await expect(page.getByRole('heading', { name: /reports dashboard/i })).toBeVisible();
      
      // Should show department user welcome card
      await expect(page.getByText(/welcome to report fusion hub/i)).toBeVisible();
      
      // Should show 4-step onboarding guide
      await expect(page.getByText(/find your reports/i)).toBeVisible();
      await expect(page.getByText(/edit content/i)).toBeVisible();
      await expect(page.getByText(/auto-save enabled/i)).toBeVisible();
      await expect(page.getByText(/track progress/i)).toBeVisible();
      
      // Should NOT show admin navigation items
      await expect(page.getByRole('link', { name: /manage departments/i })).not.toBeVisible();
      await expect(page.getByRole('link', { name: /manage users/i })).not.toBeVisible();
      await expect(page.getByRole('link', { name: /report templates/i })).not.toBeVisible();
      
      // Should NOT show create report button
      await expect(page.getByRole('button', { name: /new report/i })).not.toBeVisible();
    });

    test('should show assigned reports with section progress tracking', async ({ page }) => {
      // Check for report cards
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        const firstCard = reportCards.first();
        
        // Should show department-specific information
        await expect(firstCard.getByText(/your sections:/i)).toBeVisible();
        await expect(firstCard.getByText(/completed/i)).toBeVisible();
        
        // Should show assigned sections preview
        const sectionsPreview = firstCard.locator('.bg-blue-50');
        if (await sectionsPreview.isVisible()) {
          await expect(sectionsPreview.getByText(/your assigned sections/i)).toBeVisible();
        }
        
        // Should show edit button instead of admin actions
        await expect(firstCard.getByRole('button', { name: /edit|review/i })).toBeVisible();
        await expect(firstCard.getByRole('button', { name: /delete/i })).not.toBeVisible();
      } else {
        // Should show appropriate empty state for department users
        await expect(page.getByText(/no reports assigned/i).or(page.getByText(/no reports available/i))).toBeVisible();
      }
    });

    test('should navigate to report editing interface', async ({ page }) => {
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        // Click on first report card title
        const firstCard = reportCards.first();
        const reportTitle = firstCard.getByRole('heading').first();
        await reportTitle.click();
        
        // Should redirect to preview2 (Markdown editor) for department users
        await expect(page).toHaveURL(/\/reports\/[^\/]+\/preview2$/);
        
        // Should see Markdown editing interface
        await expect(page.getByText(/markdown/i).or(page.getByRole('textbox'))).toBeVisible();
      }
    });
  });

  test.describe('Section Content Editing - Core Business Function', () => {
    test('should edit section content with Markdown editor', async ({ page }) => {
      // Navigate to first available report
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        // Should be on Markdown editor page
        await expect(page).toHaveURL(/\/reports\/[^\/]+\/preview2$/);
        
        // Should see section tabs for assigned sections
        const sectionTabs = page.getByRole('tab');
        if (await sectionTabs.count() > 0) {
          await expect(sectionTabs.first()).toBeVisible();
          
          // Click on first editable section
          await sectionTabs.first().click();
          
          // Should see Markdown editor
          const markdownEditor = page.getByRole('textbox').filter({ hasText: /#|Enter|content/i });
          await expect(markdownEditor.first()).toBeVisible();
          
          // Add content to section
          const testContent = `# Updated Section Content

## Overview
This is test content added via E2E testing at ${new Date().toISOString()}.

### Key Points
- Point 1: Successfully added content
- Point 2: Markdown formatting works
- Point 3: Auto-save functionality active

### Metrics
1. **Completion Rate**: 95%
2. **Quality Score**: Excellent
3. **Timeline**: On track

**Bold text** and *italic text* formatting verified.`;

          await markdownEditor.first().clear();
          await markdownEditor.first().fill(testContent);
          
          // Verify content was entered
          await expect(markdownEditor.first()).toHaveValue(testContent);
          
          // Manual save should work
          const saveButton = page.getByRole('button', { name: /save changes/i });
          if (await saveButton.isVisible() && await saveButton.isEnabled()) {
            await saveButton.click();
            await waitForToast(page, /saved/i);
          }
          
          // Verify auto-save status indicators
          await expect(page.getByText(/auto-save pending/i).or(page.getByText(/auto-saving/i)).or(page.getByText(/saved/i))).toBeVisible({ timeout: 35000 });
        }
      }
    });

    test('should handle auto-save functionality correctly', async ({ page }) => {
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        await expect(page).toHaveURL(/\/reports\/[^\/]+\/preview2$/);
        
        const markdownEditor = page.getByRole('textbox').first();
        if (await markdownEditor.isVisible()) {
          // Clear existing content
          await markdownEditor.clear();
          
          // Add content gradually to trigger auto-save
          await markdownEditor.fill('# Auto-save Test Section\n\n');
          
          // Should show auto-save pending status
          await expect(page.getByText(/auto-save pending/i)).toBeVisible({ timeout: 5000 });
          
          // Continue adding content
          await markdownEditor.fill('# Auto-save Test Section\n\n## Content added at: ' + new Date().toISOString());
          
          // Should eventually show auto-saving indicator
          await expect(page.getByText(/auto-saving/i)).toBeVisible({ timeout: 32000 });
          
          // Should eventually show saved status
          await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 35000 });
          
          // Verify timestamp is recent
          const savedStatus = page.getByText(/saved \d+:\d+/i);
          if (await savedStatus.isVisible()) {
            const statusText = await savedStatus.textContent();
            expect(statusText).toMatch(/saved \d+:\d+/i);
          }
        }
      }
    });

    test('should switch between multiple assigned sections', async ({ page }) => {
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        await expect(page).toHaveURL(/\/reports\/[^\/]+\/preview2$/);
        
        const sectionTabs = page.getByRole('tab');
        const tabCount = await sectionTabs.count();
        
        if (tabCount > 1) {
          // Test switching between sections
          for (let i = 0; i < Math.min(tabCount, 3); i++) {
            const tab = sectionTabs.nth(i);
            await tab.click();
            
            // Verify tab is selected
            await expect(tab).toHaveAttribute('data-state', 'active');
            
            // Verify corresponding content area is visible
            const textareas = page.getByRole('textbox');
            await expect(textareas.first()).toBeVisible();
            
            // Verify section-specific indicators
            await expect(page.getByText(/draft|submitted/i)).toBeVisible();
          }
        } else if (tabCount === 1) {
          // Single section case
          await expect(sectionTabs.first()).toBeVisible();
          await sectionTabs.first().click();
          await expect(page.getByRole('textbox')).toBeVisible();
        }
      }
    });

    test('should handle locked sections appropriately', async ({ page }) => {
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        await expect(page).toHaveURL(/\/reports\/[^\/]+\/preview2$/);
        
        // Look for locked section indicators
        const lockedBadges = page.getByText(/locked/i);
        if (await lockedBadges.count() > 0) {
          // Find a locked section tab
          const tabs = page.getByRole('tab');
          for (let i = 0; i < await tabs.count(); i++) {
            const tab = tabs.nth(i);
            if (await tab.locator('[disabled]').count() > 0 || 
                await tab.getByText(/locked/i).count() > 0) {
              
              // Should not be able to interact with locked section
              await expect(tab).toBeDisabled();
              break;
            }
          }
        }
      }
    });
  });

  test.describe('Content Preview and Review', () => {
    test('should preview report content correctly', async ({ page }) => {
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        // Click preview button on report card
        const previewButton = reportCards.first().getByRole('button', { name: /preview/i });
        await expect(previewButton).toBeVisible();
        await previewButton.click();
        
        // Should navigate to preview page
        await expect(page).toHaveURL(/\/reports\/[^\/]+\/preview$/);
        
        // Should show formatted report content
        await expect(page.getByRole('article').or(page.locator('.prose'))).toBeVisible();
        
        // Should show back navigation
        await expect(page.getByRole('button', { name: /back/i })).toBeVisible();
      }
    });

    test('should track section completion status', async ({ page }) => {
      // Check dashboard for completion indicators
      const reportCards = page.locator('.card').filter({ hasText: /your sections:/i });
      
      if (await reportCards.count() > 0) {
        const firstCard = reportCards.first();
        
        // Should show completion ratio
        await expect(firstCard.getByText(/\d+\/\d+ completed/i)).toBeVisible();
        
        // Should show section status icons
        const statusIcons = firstCard.locator('svg').filter({ 
          hasText: /check|clock|circle/i 
        });
        
        if (await statusIcons.count() > 0) {
          await expect(statusIcons.first()).toBeVisible();
        }
        
        // Click edit button to verify section states
        const editButton = firstCard.getByRole('button', { name: /edit|review/i });
        await editButton.click();
        
        await expect(page).toHaveURL(/\/reports\/[^\/]+/);
        
        // Verify status badges on sections
        await expect(page.getByText(/draft|submitted/i)).toBeVisible();
      }
    });
  });

  test.describe('Navigation and User Experience', () => {
    test('should handle proper redirects for department users', async ({ page }) => {
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        // Get report ID from first card
        const firstCard = reportCards.first();
        const titleElement = firstCard.getByRole('heading').first();
        await titleElement.click();
        
        // Should redirect to preview2 (Markdown editor) automatically
        await expect(page).toHaveURL(/\/reports\/[^\/]+\/preview2$/);
        
        // Try to access regular edit page manually
        const currentUrl = page.url();
        const reportId = currentUrl.match(/\/reports\/([^\/]+)\//)?.[1];
        
        if (reportId) {
          await page.goto(`/reports/${reportId}`);
          
          // Should redirect back to preview2
          await expect(page).toHaveURL(`/reports/${reportId}/preview2`);
        }
      }
    });

    test('should provide accessible navigation breadcrumbs', async ({ page }) => {
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        // Should show back button or breadcrumbs
        const backButton = page.getByRole('button', { name: /back/i });
        await expect(backButton).toBeVisible();
        
        // Back button should work
        await backButton.click();
        await expect(page).toHaveURL('/dashboard');
      }
    });

    test('should handle empty state gracefully', async ({ page }) => {
      // If no reports are assigned, should show appropriate message
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() === 0) {
        await expect(
          page.getByText(/no reports assigned/i)
            .or(page.getByText(/no reports available/i))
            .or(page.getByText(/check back later/i))
        ).toBeVisible();
        
        // Should still show onboarding guidance
        await expect(page.getByText(/welcome to report fusion hub/i)).toBeVisible();
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully during content editing', async ({ page }) => {
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        await expect(page).toHaveURL(/\/reports\/[^\/]+\/preview2$/);
        
        const markdownEditor = page.getByRole('textbox').first();
        if (await markdownEditor.isVisible()) {
          // Simulate network failure during save
          await page.route('**/api/reports/**/sections/**', route => {
            route.abort('failed');
          });
          
          // Try to save content
          await markdownEditor.fill('Test content that should fail to save');
          
          const saveButton = page.getByRole('button', { name: /save/i });
          if (await saveButton.isVisible()) {
            await saveButton.click();
            
            // Should show error message
            await expect(page.getByText(/failed|error/i)).toBeVisible({ timeout: 10000 });
          }
          
          // Clear route override
          await page.unroute('**/api/reports/**/sections/**');
        }
      }
    });

    test('should validate content before saving', async ({ page }) => {
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        await expect(page).toHaveURL(/\/reports\/[^\/]+\/preview2$/);
        
        const markdownEditor = page.getByRole('textbox').first();
        if (await markdownEditor.isVisible()) {
          // Try extremely long content
          const longContent = 'A'.repeat(50000);
          await markdownEditor.fill(longContent);
          
          const saveButton = page.getByRole('button', { name: /save/i });
          if (await saveButton.isVisible()) {
            await saveButton.click();
            
            // Should either save successfully or show appropriate validation
            await expect(
              page.getByText(/saved/i).or(page.getByText(/too large|limit/i))
            ).toBeVisible({ timeout: 10000 });
          }
        }
      }
    });
  });
});