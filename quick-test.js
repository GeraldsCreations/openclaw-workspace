#!/usr/bin/env node

const puppeteer = require('puppeteer');

(async () => {
  console.log('🍆 Quick Chrome test...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') errors.push(text);
    if (type === 'warning') warnings.push(text);
    console.log(`[${type}] ${text}`);
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`[PAGE ERROR] ${error.message}`);
  });
  
  try {
    console.log('Loading http://localhost:4200...\n');
    
    await page.goto('http://localhost:4200', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    console.log('\n✅ Page loaded\n');
    
    // Wait for Angular app
    await page.waitForTimeout(5000);
    
    // Check if app-root has content
    const hasContent = await page.evaluate(() => {
      const appRoot = document.querySelector('app-root');
      return appRoot && appRoot.innerHTML.length > 100;
    });
    
    console.log(`App root has content: ${hasContent ? '✅' : '❌'}\n`);
    
    // Get page title
    const title = await page.title();
    console.log(`Page title: ${title}\n`);
    
    console.log('='.repeat(50));
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
      console.log('\n🔴 ERRORS:');
      errors.forEach(e => console.log(`  - ${e}`));
    }
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
  } finally {
    await browser.close();
  }
})();
