const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const electron = require('electron');

test('capture portal computed styles', async () => {
  // Kill any existing fcc-server processes first
  try {
    const { execSync } = require('child_process');
    execSync('taskkill /F /IM fcc-server.exe 2>nul');
  } catch {}

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
  const electronProc = spawn(electron, [
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
  await new Promise(r => setTimeout(r, 5000));

  console.log('\n=== CLICK THEME SELECTOR ===');

  // Click Theme selector
  const themeTrigger = page.locator('button[aria-label^="Tema"]').first();
  await themeTrigger.click();
  await new Promise(r => setTimeout(r, 1000));

  // Get portal element computed styles
  const portalStyles = await page.evaluate(() => {
    const portals = document.querySelectorAll('[role="menu"]');
    const results = [];
    portals.forEach((portal, i) => {
      const style = window.getComputedStyle(portal);
      const rect = portal.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const elementAtPoint = document.elementFromPoint(centerX, centerY);

      results.push({
        index: i,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        pointerEvents: style.pointerEvents,
        zIndex: style.zIndex,
        position: style.position,
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        elementAtCenter: elementAtPoint ? {
          tag: elementAtPoint.tagName,
          class: elementAtPoint.className,
          id: elementAtPoint.id,
        } : null,
        // Check inline styles
        inlineStyle: portal.style.cssText,
      });
    });
    return results;
  });

  console.log('\n=== PORTAL COMPUTED STYLES ===');
  console.log(JSON.stringify(portalStyles, null, 2));

  // Also check the trigger position
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

  // Check document.body children near the portal
  const bodyChildren = await page.evaluate(() => {
    const body = document.body;
    const children = Array.from(body.children);
    return children.map((el, i) => ({
      index: i,
      tag: el.tagName,
      class: el.className,
      id: el.id,
      style: {
        position: window.getComputedStyle(el).position,
        zIndex: window.getComputedStyle(el).zIndex,
        opacity: window.getComputedStyle(el).opacity,
      }
    }));
  });

  console.log('\n=== BODY CHILDREN ===');
  console.log(JSON.stringify(bodyChildren, null, 2));

  // Cleanup
  await browser.close();
  electronProc.kill();
  vite.kill();
  console.log('\nTest completed');
});