import { Page, expect, Locator } from '@playwright/test';

/**
 * Wait for a loading state to complete
 */
export async function waitForLoadingToComplete(page: Page) {
  // Wait for any loading skeletons or spinners to disappear
  await page.waitForFunction(() => {
    const loadingElements = document.querySelectorAll('[aria-label*="loading"], [aria-label*="Loading"], .animate-pulse, .animate-spin');
    return loadingElements.length === 0;
  }, { timeout: 10000 });
}

/**
 * Wait for network requests to settle
 */
export async function waitForNetworkIdle(page: Page, timeout = 2000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Navigate and wait for page to be ready
 */
export async function navigateAndWait(page: Page, url: string) {
  await page.goto(url);
  await waitForNetworkIdle(page);
  await waitForLoadingToComplete(page);
}

/**
 * Fill form field by label
 */
export async function fillFormField(page: Page, label: string | RegExp, value: string) {
  const field = page.getByLabel(label);
  await expect(field).toBeVisible();
  await field.fill(value);
}

/**
 * Click button and wait for response
 */
export async function clickAndWait(page: Page, selector: string | Locator, waitFor?: 'navigation' | 'response') {
  const element = typeof selector === 'string' ? page.locator(selector) : selector;
  
  if (waitFor === 'navigation') {
    await Promise.all([
      page.waitForNavigation(),
      element.click()
    ]);
  } else if (waitFor === 'response') {
    await Promise.all([
      page.waitForResponse(resp => resp.status() < 400),
      element.click()
    ]);
  } else {
    await element.click();
  }
}

/**
 * Wait for toast message to appear
 */
export async function waitForToast(page: Page, message?: string | RegExp) {
  const toast = page.locator('[data-testid="toast"], [role="alert"], .toast');
  await expect(toast).toBeVisible();
  
  if (message) {
    await expect(toast).toContainText(message);
  }
  
  return toast;
}

/**
 * Dismiss all toasts
 */
export async function dismissToasts(page: Page) {
  const dismissButtons = page.locator('[data-testid="toast-dismiss"], .toast button[aria-label*="dismiss"], .toast button[aria-label*="close"]');
  const count = await dismissButtons.count();
  
  for (let i = 0; i < count; i++) {
    try {
      await dismissButtons.nth(i).click();
    } catch {
      // Ignore if button is no longer visible
    }
  }
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(element: Locator): Promise<boolean> {
  return await element.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  });
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(element: Locator) {
  await element.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Check for accessibility violations (basic check)
 */
export async function checkBasicAccessibility(page: Page) {
  // Check for missing alt attributes on images
  const imagesWithoutAlt = page.locator('img:not([alt])');
  const count = await imagesWithoutAlt.count();
  if (count > 0) {
    console.warn(`Found ${count} images without alt attributes`);
  }
  
  // Check for buttons without accessible names
  const buttonsWithoutNames = page.locator('button:not([aria-label]):not([title])').filter({
    has: page.locator(':not(:has-text)') // buttons with no text content
  });
  const buttonCount = await buttonsWithoutNames.count();
  if (buttonCount > 0) {
    console.warn(`Found ${buttonCount} buttons without accessible names`);
  }
}

/**
 * Wait for specific API response
 */
export async function waitForApiResponse(page: Page, urlPattern: string | RegExp, method = 'GET') {
  return await page.waitForResponse(response => 
    response.url().match(urlPattern) && 
    response.request().method() === method &&
    response.status() < 400
  );
}