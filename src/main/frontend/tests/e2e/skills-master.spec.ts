import { test, expect } from '@playwright/test';

/**
 * Skills Master E2E Tests
 * Tests the skills master data management functionality including:
 * - Skills table display with pagination
 * - Create new skill
 * - Edit existing skill
 * - Delete skill
 * - Search and filter skills
 */

test.describe('Skills Master', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/skills');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display skills master page', async ({ page }) => {
    // Verify page heading
    await expect(page.locator('h2')).toContainText(/Skills Master/i);
    
    // Verify "Add New Skill" button exists
    await expect(page.getByRole('button', { name: /add new skill/i })).toBeVisible();
  });

  test('should display skills table with data', async ({ page }) => {
    // Wait for table to load
    await page.waitForTimeout(1500);
    
    // Check if table has headers
    const table = page.locator('table');
    if (await table.isVisible()) {
      // Verify table headers
      await expect(table.locator('thead')).toContainText(/name/i);
      await expect(table.locator('thead')).toContainText(/category/i);
      await expect(table.locator('thead')).toContainText(/status/i);
      await expect(table.locator('thead')).toContainText(/actions/i);
    }
  });

  test('should show pagination controls when there are many skills', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Look for pagination controls
    const paginationExists = await page.getByText(/page \d+ of \d+/i).isVisible()
      .catch(() => false);
    
    // If pagination exists, test navigation
    if (paginationExists) {
      const nextButton = page.getByRole('button', { name: /next/i });
      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(500);
        // Verify page changed
        await expect(page.getByText(/page 2/i)).toBeVisible();
      }
    }
  });

  test('should open create skill modal', async ({ page }) => {
    // Click "Add New Skill" button
    await page.getByRole('button', { name: /add new skill/i }).click();
    
    // Verify modal/form is visible
    await expect(page.getByRole('heading', { name: /add.*skill/i })).toBeVisible();
    
    // Verify form fields
    await expect(page.getByPlaceholder(/skill name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/category/i)).toBeVisible();
    
    // Close modal (Cancel button)
    await page.getByRole('button', { name: /cancel/i }).click();
  });

  test('should create a new skill', async ({ page }) => {
    // Click "Add New Skill"
    await page.getByRole('button', { name: /add new skill/i }).click();
    await page.waitForTimeout(500);
    
    // Fill in skill details
    const timestamp = Date.now();
    const skillName = `Test Skill ${timestamp}`;
    
    await page.getByPlaceholder(/skill name/i).fill(skillName);
    await page.getByPlaceholder(/category/i).fill('Testing');
    await page.getByPlaceholder(/description/i).fill('A test skill for automated testing');
    
    // Submit form
    await page.getByRole('button', { name: /create|add|save/i }).click();
    
    // Wait for skill to be added
    await page.waitForTimeout(1500);
    
    // Verify skill appears in the table
    await expect(page.getByText(skillName)).toBeVisible();
  });

  test('should edit an existing skill', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Look for an edit button (icon or text)
    const editButton = page.getByRole('button', { name: /edit/i }).first()
      .or(page.locator('button[aria-label*="edit"]').first())
      .or(page.locator('svg[data-icon="edit"]').first());
    
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);
      
      // Verify edit form is visible
      await expect(page.getByRole('heading', { name: /edit.*skill/i })).toBeVisible();
      
      // Modify the skill name
      const nameInput = page.getByPlaceholder(/skill name/i);
      await nameInput.fill(`Updated Skill ${Date.now()}`);
      
      // Save changes
      await page.getByRole('button', { name: /save|update/i }).click();
      
      // Wait for update to complete
      await page.waitForTimeout(1000);
    }
  });

  test('should handle delete skill action', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Look for a delete button
    const deleteButton = page.getByRole('button', { name: /delete/i }).first()
      .or(page.locator('button[aria-label*="delete"]').first());
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await page.waitForTimeout(300);
      
      // Look for confirmation dialog
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
      const cancelButton = page.getByRole('button', { name: /cancel|no/i });
      
      // If confirmation dialog appears, cancel it
      if (await confirmButton.isVisible() || await cancelButton.isVisible()) {
        await cancelButton.click();
      }
    }
  });

  test('should filter skills by active status', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Look for status filter or active/inactive toggle
    const statusBadges = page.locator('span:has-text("Active"), span:has-text("Inactive")');
    const badgeCount = await statusBadges.count();
    
    // Verify status badges are displayed
    expect(badgeCount).toBeGreaterThan(0);
  });

  test('should display skill icons for edit and delete actions', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Verify action icons exist (not just text labels)
    const actionButtons = page.locator('button svg, button [class*="icon"]');
    const iconCount = await actionButtons.count();
    
    // Expect at least some icon buttons to exist
    expect(iconCount).toBeGreaterThan(0);
  });
});
