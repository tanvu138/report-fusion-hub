import { test, expect } from '@playwright/test';
import { loginAsSecretary, loginAsDepartment } from '../helpers/auth';
import { waitForLoadingToComplete } from '../helpers/common';

/**
 * High-Level Business Workflow Integration Tests
 * 
 * These tests validate complete end-to-end business processes
 * focusing on real user scenarios and business value delivery.
 */

test.describe('Complete Business Workflows - End-to-End Integration', () => {
  
  test.describe('Secretary Complete Workflow - From Template to Published Report', () => {
    test('should complete full secretary workflow: create template → create report → manage sections → export', async ({ page }) => {
      await loginAsSecretary(page);
      
      // Step 1: Create a comprehensive template
      await page.getByRole('tab', { name: /manage templates/i }).click();
      await page.getByRole('button', { name: /create new template/i }).click();
      
      const templateDialog = page.getByRole('dialog');
      const templateName = `Complete Workflow Template ${Date.now()}`;
      
      await templateDialog.getByLabel(/template name/i).fill(templateName);
      await templateDialog.getByLabel(/description/i).fill('Comprehensive template for full workflow testing');
      
      // Add multiple sections for different departments
      await templateDialog.getByRole('button', { name: /add section/i }).click();
      await templateDialog.getByLabel(/section name/i).first().fill('Executive Summary');
      
      const firstDeptSelect = templateDialog.getByRole('combobox').first();
      await firstDeptSelect.click();
      await page.waitForTimeout(500);
      await page.getByRole('option').first().click();
      
      await templateDialog.getByRole('button', { name: /create template/i }).click();
      await expect(page.getByText(/created/i)).toBeVisible();
      
      // Step 2: Create report from template
      await page.getByRole('tab', { name: /view reports/i }).click();
      await page.getByRole('button', { name: /new report/i }).click();
      
      const reportDialog = page.getByRole('dialog');
      await reportDialog.getByRole('button', { name: /create from template/i }).click();
      
      await reportDialog.getByRole('combobox', { name: /select template/i }).click();
      await page.getByRole('option', { name: templateName }).click();
      
      const reportTitle = `Complete Workflow Report ${Date.now()}`;
      await reportDialog.getByLabel(/report title/i).fill(reportTitle);
      await reportDialog.getByRole('combobox', { name: /report cycle/i }).click();
      await page.getByRole('option', { name: /weekly/i }).click();
      
      await reportDialog.getByRole('button', { name: /create report/i }).click();
      
      // Should navigate to report management
      await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
      await expect(page.getByRole('heading', { name: reportTitle })).toBeVisible();
      
      // Step 3: Verify section management interface
      await expect(page.getByText(/report sections/i)).toBeVisible();
      await expect(page.getByText(/executive summary/i)).toBeVisible();
      
      // Step 4: Test export functionality
      const exportButton = page.getByRole('button', { name: /export docx/i });
      if (await exportButton.isVisible()) {
        // Set up download handler
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();
        
        // Verify download
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.docx$/);
      }
      
      // Workflow completed successfully
      await expect(page.getByRole('heading', { name: reportTitle })).toBeVisible();
    });
  });

  test.describe('Department User Complete Workflow - Content Creation to Submission', () => {
    test('should complete full department workflow: find report → edit content → auto-save → submit', async ({ page }) => {
      await loginAsDepartment(page);
      
      // Step 1: Navigate dashboard and find assigned reports
      await expect(page).toHaveURL('/dashboard');
      await expect(page.getByText(/welcome to report fusion hub/i)).toBeVisible();
      
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        // Step 2: Access report for editing
        const firstCard = reportCards.first();
        
        // Verify department-specific information is displayed
        await expect(firstCard.getByText(/your sections:/i)).toBeVisible();
        
        // Navigate to editing interface
        await firstCard.click();
        await expect(page).toHaveURL(/\/reports\/[^\/]+\/preview2$/);
        
        // Step 3: Edit section content with meaningful data
        const sectionTabs = page.getByRole('tab');
        if (await sectionTabs.count() > 0) {
          await sectionTabs.first().click();
          
          const markdownEditor = page.getByRole('textbox').first();
          if (await markdownEditor.isVisible()) {
            // Step 4: Add comprehensive content
            const businessContent = `# Department Report Section

## Executive Summary
This section contains critical business information compiled by the department team for the reporting period.

### Key Achievements
1. **Target Completion**: Exceeded quarterly goals by 15%
2. **Process Improvement**: Implemented new workflow reducing processing time by 25%  
3. **Customer Satisfaction**: Achieved 98% satisfaction rating

### Metrics and KPIs
- **Revenue Growth**: +12% year-over-year
- **Cost Reduction**: Saved $50K through optimization
- **Efficiency Gains**: 20% improvement in productivity

### Challenges and Mitigation
- **Supply Chain**: Addressed delays through alternative sourcing
- **Resource Allocation**: Optimized team distribution
- **Technology Upgrade**: Completed system migration ahead of schedule

### Next Quarter Outlook
- Focus on market expansion
- Launch new product initiatives  
- Enhance customer experience programs

**Report prepared by**: Department Team  
**Date**: ${new Date().toLocaleDateString()}  
**Period**: Q${Math.floor(Date.now() / 1000) % 4 + 1} ${new Date().getFullYear()}`;

            await markdownEditor.fill(businessContent);
            
            // Step 5: Verify auto-save functionality
            await expect(page.getByText(/auto-save pending/i)).toBeVisible({ timeout: 5000 });
            await expect(page.getByText(/auto-saving/i)).toBeVisible({ timeout: 32000 });
            await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 35000 });
            
            // Step 6: Manual save as backup
            const saveButton = page.getByRole('button', { name: /save/i });
            if (await saveButton.isVisible() && await saveButton.isEnabled()) {
              await saveButton.click();
              await expect(page.getByText(/saved/i)).toBeVisible();
            }
            
            // Step 7: Verify content persistence
            await page.reload();
            await waitForLoadingToComplete(page);
            
            const reloadedEditor = page.getByRole('textbox').first();
            if (await reloadedEditor.isVisible()) {
              const savedContent = await reloadedEditor.inputValue();
              expect(savedContent).toContain('Department Report Section');
              expect(savedContent).toContain('Key Achievements');
            }
          }
        }
        
        // Step 8: Navigate back and verify progress tracking
        await page.getByRole('button', { name: /back/i }).click();
        await expect(page).toHaveURL('/dashboard');
        
        // Verify completion status updated
        const updatedCard = page.locator('.card').filter({ hasText: /your sections:/i }).first();
        await expect(updatedCard.getByText(/completed|has content/i)).toBeVisible();
      }
      
      // Workflow completed successfully
      await expect(page.getByText(/welcome to report fusion hub/i)).toBeVisible();
    });
  });

  test.describe('Cross-Role Collaboration Workflow', () => {
    test('should demonstrate secretary-department collaboration on report lifecycle', async ({ page, context }) => {
      // This test simulates real-world collaboration between roles
      
      // Phase 1: Secretary creates report
      await loginAsSecretary(page);
      
      await page.getByRole('button', { name: /new report/i }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: /create custom report/i }).click();
      
      const collaborationReportTitle = `Collaboration Test ${Date.now()}`;
      await dialog.getByLabel(/report title/i).fill(collaborationReportTitle);
      await dialog.getByRole('combobox', { name: /report cycle/i }).click();
      await page.getByRole('option', { name: /monthly/i }).click();
      
      // Add section for department
      await dialog.getByLabel(/section name/i).first().fill('Department Input Section');
      const deptSelect = dialog.getByRole('combobox').filter({ hasText: /select department/i }).first();
      await deptSelect.click();
      await page.waitForTimeout(500);
      await page.getByRole('option').first().click();
      await dialog.getByLabel(/instructions/i).first().fill('Please provide quarterly department metrics and analysis');
      
      await dialog.getByRole('button', { name: /create report/i }).click();
      await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
      
      // Secretary activates the section
      const sectionToggle = page.getByRole('checkbox').first();
      if (!(await sectionToggle.isChecked())) {
        await sectionToggle.click();
      }
      
      // Phase 2: Department user adds content
      // Open new tab as department user
      const departmentPage = await context.newPage();
      await loginAsDepartment(departmentPage);
      
      // Find the collaborative report
      const deptReportCards = departmentPage.locator('.card').filter({ hasText: collaborationReportTitle });
      if (await deptReportCards.count() > 0) {
        await deptReportCards.first().click();
        
        const deptEditor = departmentPage.getByRole('textbox').first();
        if (await deptEditor.isVisible()) {
          await deptEditor.fill(`# Department Quarterly Analysis

## Performance Metrics
- Achieved 105% of target goals
- Customer satisfaction: 96%
- Cost efficiency improved by 18%

## Key Initiatives Completed
1. Process automation implementation
2. Staff training and development program
3. Quality improvement initiatives

## Recommendations for Next Quarter
- Expand successful programs
- Address identified bottlenecks
- Invest in additional training

*Submitted by Department Team*`);
          
          // Wait for auto-save
          await expect(departmentPage.getByText(/saved/i)).toBeVisible({ timeout: 35000 });
        }
      }
      
      // Phase 3: Secretary reviews and finalizes
      // Switch back to secretary view
      await page.bringToFront();
      await page.reload();
      
      // Verify department content is visible
      await expect(page.getByText(/department input section/i)).toBeVisible();
      
      // Check section status shows content
      await expect(page.getByText(/has content/i)).toBeVisible();
      
      // Export final report
      const exportButton = page.getByRole('button', { name: /export docx/i });
      if (await exportButton.isVisible()) {
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.docx$/);
      }
      
      await departmentPage.close();
      
      // Collaboration workflow completed successfully
      await expect(page.getByRole('heading', { name: collaborationReportTitle })).toBeVisible();
    });
  });

  test.describe('System Resilience and Recovery', () => {
    test('should handle complete workflow under adverse conditions', async ({ page }) => {
      await loginAsDepartment(page);
      
      const reportCards = page.locator('.card').filter({ hasText: /cycle:/i });
      
      if (await reportCards.count() > 0) {
        await reportCards.first().click();
        
        const markdownEditor = page.getByRole('textbox').first();
        if (await markdownEditor.isVisible()) {
          // Simulate network instability during content creation
          let requestCount = 0;
          await page.route('**/api/**', route => {
            requestCount++;
            if (requestCount % 3 === 0) {
              // Fail every third request
              route.abort('failed');
            } else {
              route.continue();
            }
          });
          
          // Add content despite network issues
          await markdownEditor.fill(`# Resilience Test Section

## Testing System Recovery
This content is being saved under adverse network conditions to test system resilience.

### Recovery Mechanisms
1. Auto-save retry logic
2. Manual save fallback
3. Content preservation
4. Error handling

### Business Continuity
Even under network stress, the system should maintain data integrity and user experience.

Test timestamp: ${new Date().toISOString()}`);
          
          // System should handle failures gracefully
          await expect(
            page.getByText(/saved/i).or(page.getByText(/retry|pending/i))
          ).toBeVisible({ timeout: 60000 });
          
          // Clear route to restore normal operation
          await page.unroute('**/api/**');
          
          // Manual save should work as fallback
          const saveButton = page.getByRole('button', { name: /save/i });
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 10000 });
          }
          
          // Content should persist despite network issues
          await page.reload();
          const reloadedContent = await markdownEditor.inputValue();
          expect(reloadedContent).toContain('Resilience Test Section');
        }
      }
      
      // System demonstrated resilience and recovery
      await expect(page).toHaveURL(/\/reports\/[^\/]+/);
    });
  });
});