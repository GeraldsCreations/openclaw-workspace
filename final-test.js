#!/usr/bin/env node

const puppeteer = require('puppeteer');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log('🍆 Chrome Console Test - LaunchPad UI\n');
  console.log('='.repeat(60));
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  const logs = [];
  
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      errors.push(text);
      console.log(`❌ ERROR: ${text}`);
    } else if (type === 'warning') {
      warnings.push(text);
      console.log(`⚠️  WARNING: ${text}`);
    } else {
      logs.push(text);
      console.log(`ℹ️  [${type}] ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`❌ PAGE ERROR: ${error.message}`);
  });
  
  page.on('requestfailed', request => {
    console.log(`❌ FAILED REQUEST: ${request.url()}`);
  });
  
  try {
    console.log('\n📍 Navigating to http://localhost:4200...\n');
    
    await page.goto('http://localhost:4200', { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });
    
    console.log('\n✅ Page loaded successfully!\n');
    
    // Wait for app to render
    await sleep(5000);
    
    // Check app state
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        appRootExists: !!document.querySelector('app-root'),
        appRootContent: document.querySelector('app-root')?.innerHTML?.length || 0,
        bodyClasses: document.body.className,
        hasDashboard: !!document.querySelector('app-dashboard'),
        hasTokens: document.querySelectorAll('[class*="token"]').length > 0
      };
    });
    
    console.log('\n📊 PAGE INFO:');
    console.log(`  Title: ${pageInfo.title}`);
    console.log(`  App Root: ${pageInfo.appRootExists ? '✅ Exists' : '❌ Missing'}`);
    console.log(`  Content Length: ${pageInfo.appRootContent} chars`);
    console.log(`  Body Classes: ${pageInfo.bodyClasses}`);
    console.log(`  Has Dashboard: ${pageInfo.hasDashboard ? '✅' : '❌'}`);
    console.log(`  Token Elements: ${pageInfo.hasTokens ? '✅ Found' : '❌ None'}`);
    
    // Take screenshot
    try {
      await page.screenshot({ 
        path: '/root/.openclaw/workspace/chrome-test-screenshot.png', 
        fullPage: true 
      });
      console.log('\n📸 Screenshot saved: chrome-test-screenshot.png');
    } catch (e) {
      console.log(`\n⚠️  Screenshot failed: ${e.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 CONSOLE LOG SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Messages: ${errors.length + warnings.length + logs.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    console.log(`ℹ️  Info/Debug: ${logs.length}`);
    
    if (errors.length > 0) {
      console.log('\n🔴 ERRORS FOUND:');
      errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    } else {
      console.log('\n✅ NO ERRORS - UI is clean!');
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.slice(0, 10).forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
      if (warnings.length > 10) {
        console.log(`  ... and ${warnings.length - 10} more warnings`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(errors.length === 0 ? '✅ TEST PASSED' : '❌ TEST FAILED');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
  } finally {
    await browser.close();
  }
})();
