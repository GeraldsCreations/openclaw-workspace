#!/usr/bin/env node

/**
 * Quick UI test script
 * Opens Chrome, navigates to localhost:4200, captures console logs
 */

const puppeteer = require('puppeteer');

(async () => {
  console.log('🍆 Starting Chrome UI test...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    logs.push({ type, text, timestamp: new Date().toISOString() });
    
    const emoji = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} [${type.toUpperCase()}] ${text}`);
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.log(`❌ [PAGE ERROR] ${error.message}`);
    logs.push({ type: 'pageerror', text: error.message, timestamp: new Date().toISOString() });
  });
  
  try {
    console.log('📍 Loading http://localhost:4200...\n');
    await page.goto('http://localhost:4200', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait a bit for initial render
    await page.waitForTimeout(3000);
    
    console.log('\n✅ Homepage loaded successfully\n');
    
    // Take screenshot
    await page.screenshot({ path: '/root/.openclaw/workspace/screenshot-home.png', fullPage: true });
    console.log('📸 Screenshot saved: screenshot-home.png\n');
    
    // Test token detail page
    console.log('📍 Testing token detail page...\n');
    const tokenLinks = await page.$$('a[href*="/token/"]');
    
    if (tokenLinks.length > 0) {
      await tokenLinks[0].click();
      await page.waitForTimeout(3000);
      console.log('✅ Token detail page loaded\n');
      
      await page.screenshot({ path: '/root/.openclaw/workspace/screenshot-token.png', fullPage: true });
      console.log('📸 Screenshot saved: screenshot-token.png\n');
    } else {
      console.log('⚠️ No token links found on homepage\n');
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    const errors = logs.filter(l => l.type === 'error' || l.type === 'pageerror');
    const warnings = logs.filter(l => l.type === 'warning');
    
    console.log(`Total Console Messages: ${logs.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    console.log(`ℹ️  Info/Log: ${logs.length - errors.length - warnings.length}`);
    
    if (errors.length > 0) {
      console.log('\n🔴 ERRORS FOUND:');
      errors.forEach(e => {
        console.log(`  - ${e.text}`);
      });
    } else {
      console.log('\n✅ No errors found!');
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.slice(0, 5).forEach(w => {
        console.log(`  - ${w.text}`);
      });
      if (warnings.length > 5) {
        console.log(`  ... and ${warnings.length - 5} more`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Test complete!');
  }
})();
