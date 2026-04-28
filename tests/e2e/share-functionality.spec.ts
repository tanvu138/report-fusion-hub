import { test, expect } from '@playwright/test';
import { loginAsSecretary } from '../helpers/auth';

test.describe('Enhanced Share Externally Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSecretary(page);
  });

  test('should create and manage share links with proper UI/UX', async ({
    page,
  }) => {
    // Navigate to dashboard and find a report
    await expect(page).toHaveURL('/dashboard');

    // Look for existing reports or create one if needed
    const reportCards = page.locator('.card').filter({ hasText: /report/i });

    if ((await reportCards.count()) === 0) {
      // Create a test report first
      await page.getByRole('button', { name: /new report/i }).click();
      const dialog = page.getByRole('dialog');
      await dialog
        .getByRole('button', { name: /create custom report/i })
        .click();

      await dialog
        .getByLabel(/report title/i)
        .fill(`Test Share Report ${Date.now()}`);
      await dialog.getByRole('combobox', { name: /report cycle/i }).click();
      await page.getByRole('option', { name: /weekly/i }).click();

      // Add section
      await dialog
        .getByLabel(/section name/i)
        .first()
        .fill('Test Section');
      const deptSelect = dialog
        .getByRole('combobox')
        .filter({ hasText: /select department/i })
        .first();
      await deptSelect.click();
      await page.waitForTimeout(500);
      await page.getByRole('option').first().click();

      await dialog.getByRole('button', { name: /create report/i }).click();
      await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
    } else {
      // Use existing report
      await reportCards.first().click();
      await expect(page).toHaveURL(/\/reports\/[^\/]+$/);
    }

    // Open share dialog
    const shareButton = page.getByRole('button', { name: /share externally/i });
    await expect(shareButton).toBeVisible();
    await shareButton.click();

    // Verify share dialog opens
    const shareDialog = page.getByRole('dialog');
    await expect(shareDialog).toBeVisible();
    await expect(shareDialog.getByText(/external share links/i)).toBeVisible();

    // Should show "No active share links" initially
    await expect(shareDialog.getByText(/no active share links/i)).toBeVisible();

    // Create a new share link
    await shareDialog.getByRole('button', { name: /create link/i }).click();

    // Should show success message and code
    await expect(page.getByText(/link created/i)).toBeVisible({
      timeout: 10000,
    });

    // Check if new link code display appears
    const linkCodeSection = shareDialog
      .locator('div')
      .filter({ hasText: /link created successfully/i });
    if (await linkCodeSection.isVisible()) {
      // Verify code display UI
      await expect(
        linkCodeSection.getByText(/save this access code/i),
      ).toBeVisible();
      await expect(linkCodeSection.locator('code')).toBeVisible();

      // Test copy code functionality
      const copyCodeButton = linkCodeSection
        .getByRole('button')
        .filter({ hasText: /copy/i });
      if (await copyCodeButton.isVisible()) {
        await copyCodeButton.click();
        await expect(page.getByText(/copied.*code/i)).toBeVisible();
      }
    }

    // Should now show the created link in the list
    await expect(shareDialog.getByText(/view/i)).toBeVisible();
    await expect(shareDialog.getByText(/active/i)).toBeVisible();

    // Test copy link functionality
    const copyLinkButton = shareDialog
      .getByRole('button')
      .filter({ hasText: 'Copy' })
      .first();
    if (await copyLinkButton.isVisible()) {
      await copyLinkButton.click();
      await expect(page.getByText(/copied.*link/i)).toBeVisible();
    }

    // Test revoke functionality
    const revokeButton = shareDialog.getByRole('button', { name: /revoke/i });
    if (await revokeButton.isVisible()) {
      await revokeButton.click();

      // Should show confirmation dialog
      const confirmDialog = page
        .getByRole('dialog')
        .filter({ hasText: /revoke share link/i });
      await expect(confirmDialog).toBeVisible();
      await expect(
        confirmDialog.getByText(/action cannot be undone/i),
      ).toBeVisible();

      // Cancel first to test
      await confirmDialog.getByRole('button', { name: /cancel/i }).click();
      await expect(confirmDialog).not.toBeVisible();

      // Now actually revoke
      await revokeButton.click();
      await confirmDialog.getByRole('button', { name: /revoke link/i }).click();

      // Should show success message
      await expect(page.getByText(/revoked successfully/i)).toBeVisible({
        timeout: 5000,
      });

      // Should go back to "no active share links"
      await expect(
        shareDialog.getByText(/no active share links/i),
      ).toBeVisible();
    }
  });

  test('should handle share link expiry settings', async ({ page }) => {
    // Navigate to a report
    const reportCards = page.locator('.card').filter({ hasText: /report/i });
    if ((await reportCards.count()) > 0) {
      await reportCards.first().click();
      await expect(page).toHaveURL(/\/reports\/[^\/]+$/);

      // Open share dialog
      await page.getByRole('button', { name: /share externally/i }).click();
      const shareDialog = page.getByRole('dialog');

      // Set expiry date
      const expiryInput = shareDialog.getByLabel(/expires at/i);
      if (await expiryInput.isVisible()) {
        // Set expiry to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const expiryValue = tomorrow.toISOString().slice(0, 16); // Format for datetime-local

        await expiryInput.fill(expiryValue);

        // Create link with expiry
        await shareDialog.getByRole('button', { name: /create link/i }).click();

        // Should show the link with expiry status
        await expect(shareDialog.getByText(/expires/i)).toBeVisible({
          timeout: 10000,
        });
      }
    }
  });

  test('should validate public access to shared reports', async ({
    page,
    context,
  }) => {
    // First create a share link as secretary
    const reportCards = page.locator('.card').filter({ hasText: /report/i });
    if ((await reportCards.count()) > 0) {
      await reportCards.first().click();
      await expect(page).toHaveURL(/\/reports\/[^\/]+$/);

      // Open share dialog and create link
      await page.getByRole('button', { name: /share externally/i }).click();
      const shareDialog = page.getByRole('dialog');
      await shareDialog.getByRole('button', { name: /create link/i }).click();

      // Wait for link creation
      await expect(page.getByText(/link created/i)).toBeVisible({
        timeout: 10000,
      });

      // Get the share link URL (should be visible in the dialog)
      const linkElement = shareDialog
        .locator('p')
        .filter({ hasText: /\/share\// });
      if (await linkElement.isVisible()) {
        const linkText = await linkElement.textContent();
        const shareUrl = linkText?.match(
          /https?:\/\/[^\s]+\/share\/[a-zA-Z0-9-]+/,
        )?.[0];

        if (shareUrl) {
          // Open new incognito context to test public access
          const incognitoContext = await context.browser()?.newContext();
          if (incognitoContext) {
            const publicPage = await incognitoContext.newPage();

            // Navigate to share URL
            await publicPage.goto(shareUrl);

            // Should show access code prompt (not require login)
            await expect(
              publicPage.getByText(/access protected report/i),
            ).toBeVisible();
            await expect(
              publicPage.getByText(/enter.*6-digit.*code/i),
            ).toBeVisible();

            // Should have proper UI elements
            await expect(
              publicPage.getByPlaceholder(/enter 6-digit code/i),
            ).toBeVisible();
            await expect(
              publicPage.getByRole('button', { name: /access report/i }),
            ).toBeVisible();

            await incognitoContext.close();
          }
        }
      }
    }
  });
});
