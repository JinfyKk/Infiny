const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const path = require('path');

test('dropdown diagnostics', async () => {
  // Get the Electron executable path
  const electronPath = require('electron');

  // Start the Vite dev server first
  console.log('Starting Vite dev server...');
  const vite = spawn('npx', ['vite'], {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: true,
  });

  vite.stdout.on('data', (data) => console.log('[VITE]', data.toString()));
  vite.stderr.on('data', (data) => console.error('[VITE ERR]', data.toString()));

  // Wait for Vite to be ready
  await new Promise(r => setTimeout(r, 5000));

  // Launch Electron with remote debugging
  console.log('Launching Electron...');
  const electron = spawn(electronPath, [
    '--remote-debugging-port=9222',
    'dist/main/main/main.js'
  ], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'development' },
    stdio: 'pipe',
  });

  electron.stdout.on('data', (data) => console.log('[ELECTRON]', data.toString()));
  electron.stderr.on('data', (data) => console.error('[ELECTRON ERR]', data.toString()));

  // Wait for Electron to start and CDP to be available
  await new Promise(r => setTimeout(r, 8000));

  // Connect via CDP
  const { chromium } = require('@playwright/test');
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  // Capture console logs
  page.on('console', msg => console.log('[RENDERER]', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('[RENDERER ERROR]', err.message));

  // Wait for app to load
  await page.waitForLoadState('networkidle');
  await new Promise(r => setTimeout(r, 2000));

  console.log('=== Testing Theme Selector ===');

  // Find and click Theme selector trigger
  const themeTrigger = page.locator('button[aria-label^="Tema"]').first();
  await themeTrigger.click();
  await new Promise(r => setTimeout(r, 500));

  // Check if portal opened
  const themePortal = page.locator('[role="menu"]').first();
  const isThemeOpen = await themePortal.isVisible();
  console.log('Theme dropdown visible:', isThemeOpen);

  if (isThemeOpen) {
    await themeTrigger.click(); // Close
  }

  console.log('=== Testing Model Selector ===');
  const modelTrigger = page.locator('button[aria-label^="Modelo"]').first();
  await modelTrigger.click();
  await new Promise(r => setTimeout(r, 500));

  const modelPortal = page.locator('[role="menu"]').first();
  const isModelOpen = await modelPortal.isVisible();
  console.log('Model dropdown visible:', isModelOpen);

  if (isModelOpen) {
    await modelTrigger.click();
  }

  console.log('=== Testing Effort Selector ===');
  const effortTrigger = page.locator('button[aria-label^="Nível de esforço"]').first();
  await effortTrigger.click();
  await new Promise(r => setTimeout(r, 500));

  const effortPortal = page.locator('[role="menu"]').first();
  const isEffortOpen = await effortPortal.isVisible();
  console.log('Effort dropdown visible:', isEffortOpen);

  if (isEffortOpen) {
    await effortTrigger.click();
  }

  console.log('=== Testing Provider Selector ===');
  const providerTrigger = page.locator('button[aria-label^="Provedor"]').first();
  await providerTrigger.click();
  await new Promise(r => setTimeout(r, 500));

  const providerPortal = page.locator('[role="menu"]').first();
  const isProviderOpen = await providerPortal.isVisible();
  console.log('Provider dropdown visible:', isProviderOpen);

  // Cleanup
  await browser.close();
  electron.kill();
  vite.kill();

  console.log('Test completed');
});

// Run the test
const { execSync } = require('child_process');
execSync('npx playwright test test-dropdowns.js --reporter=line', { stdio: 'inherit' });