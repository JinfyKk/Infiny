const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const electron = require('electron');
const path = require('path');

test('dropdown portal diagnostics', async () => {
  // Start Vite
  console.log('Starting Vite dev server...');
  const vite = spawn('npx', ['vite'], {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: true,
  });

  vite.stdout.on('data', (data) => console.log('[VITE]', data.toString().trim()));
  vite.stderr.on('data', (data) => console.error('[VITE ERR]', data.toString().trim()));

  await new Promise(r => setTimeout(r, 5000));

  // Launch Electron with remote debugging
  console.log('Launching Electron...');
  const electronPath = electron;
  const electronProc = spawn(electronPath, [
    '--remote-debugging-port=9222',
    'dist/main/main/main.js'
  ], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'development' },
    stdio: 'pipe',
  });

  electronProc.stdout.on('data', (data) => console.log('[ELECTRON]', data.toString().trim()));
  electronProc.stderr.on('data', (data) => console.error('[ELECTRON ERR]', data.toString().trim()));

  // Wait for Electron to start
  await new Promise(r => setTimeout(r, 10000));

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
  await new Promise(r => setTimeout(r, 3000));

  console.log('\n=== DIAGNOSTIC: Portal Computed Styles ===');

  // Click Theme selector
  const themeTrigger = page.locator('button[aria-label^="Tema"]').first();
  await themeTrigger.click();
  await new Promise(r => setTimeout(r, 500));

  // Get portal element via evaluate (it's in document.body)
  const portalInfo = await page.evaluate(() => {
    // Find the portal div (fixed, z-50, role=menu)
    const portals = document.querySelectorAll('[role="menu"]');
    const results = [];
    portals.forEach((portal, i) => {
      const style = window.getComputedStyle(portal);
      const rect = portal.getBoundingClientRect();
      const trigger = document.querySelector('button[aria-label^="Tema"]');
      const triggerRect = trigger?.getBoundingClientRect();

      // Check element at portal center
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const elementAtPoint = document.elementFromPoint(centerX, centerY);

      results.push({
        index: i,
        visible: style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0',
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        pointerEvents: style.pointerEvents,
        zIndex: style.zIndex,
        position: style.position,
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        triggerRect: triggerRect ? { top: triggerRect.top, left: triggerRect.left, bottom: triggerRect.bottom, right: triggerRect.right } : null,
        elementAtCenter: elementAtPoint ? {
          tag: elementAtPoint.tagName,
          class: elementAtPoint.className,
          id: elementAtPoint.id,
        } : null,
        parentChain: getParentChain(portal).slice(0, 5).map(el => ({
          tag: el.tagName,
          class: el.className,
          style: {
            position: window.getComputedStyle(el).position,
            zIndex: window.getComputedStyle(el).zIndex,
            overflow: window.getComputedStyle(el).overflow,
            transform: window.getComputedStyle(el).transform,
            opacity: window.getComputedStyle(el).opacity,
          }
        })),
      });
    });
    return results;
  });

  console.log('\n=== PORTAL DIAGNOSTICS ===');
  console.log(JSON.stringify(portalInfo, null, 2));

  function getParentChain(el) {
    const chain = [];
    let current = el.parentElement;
    while (current) {
      chain.push(current);
      current = current.parentElement;
    }
    return chain;
  }

  // Also check what's at the trigger position
  const triggerInfo = await page.evaluate(() => {
    const trigger = document.querySelector('button[aria-label^="Tema"]');
    if (!trigger) return null;
    const rect = trigger.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const elementAtPoint = document.elementFromPoint(centerX, centerY);
    return {
      triggerRect: { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right },
      elementAtCenter: elementAtPoint ? {
        tag: elementAtPoint.tagName,
        class: elementAtPoint.className,
        id: elementAtPoint.id,
      } : null,
    };
  });

  console.log('\n=== TRIGGER POSITION ===');
  console.log(JSON.stringify(triggerInfo, null, 2));

  // Close dropdown
  await themeTrigger.click();
  await new Promise(r => setTimeout(r, 300));

  // Cleanup
  await browser.close();
  electronProc.kill();
  vite.kill();

  console.log('\nTest completed');
});