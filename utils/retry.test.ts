/**
 * retry.test.ts - Tests for Retry Utility
 * 
 * Run with: npx tsx utils/retry.test.ts
 */

import { retryWithBackoff, RetryExhaustedError, retry } from './retry';

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    testsFailed++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('🧪 Running Retry Utility Tests\n');

  // Test 1: Success on first attempt
  console.log('Test 1: Success on first attempt');
  try {
    let attempts = 0;
    const result = await retryWithBackoff(async () => {
      attempts++;
      return 'success';
    }, { operation: 'test-immediate-success' });
    
    assert(result === 'success', 'Should return correct value');
    assert(attempts === 1, 'Should only attempt once on success');
  } catch (error) {
    assert(false, `Should not throw: ${error}`);
  }

  // Test 2: Success after 2 failures
  console.log('\nTest 2: Success after 2 failures');
  try {
    let attempts = 0;
    const result = await retryWithBackoff(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error(`Attempt ${attempts} failed`);
      }
      return 'eventual-success';
    }, { operation: 'test-retry-success', baseDelay: 100 });
    
    assert(result === 'eventual-success', 'Should return correct value after retries');
    assert(attempts === 3, 'Should attempt 3 times (1 initial + 2 retries)');
  } catch (error) {
    assert(false, `Should not throw: ${error}`);
  }

  // Test 3: Exhaust all retries
  console.log('\nTest 3: Exhaust all retries');
  try {
    let attempts = 0;
    await retryWithBackoff(async () => {
      attempts++;
      throw new Error(`Attempt ${attempts} failed`);
    }, { 
      operation: 'test-exhaust-retries',
      maxRetries: 2,
      baseDelay: 50
    });
    
    assert(false, 'Should have thrown RetryExhaustedError');
  } catch (error) {
    assert(error instanceof RetryExhaustedError, 'Should throw RetryExhaustedError');
    assert(error.attempts === 3, 'Should record correct number of attempts');
    assert(error.operation === 'test-exhaust-retries', 'Should include operation name');
  }

  // Test 4: Custom shouldRetry filter
  console.log('\nTest 4: Custom shouldRetry filter (skip retry on auth error)');
  let attempts4 = 0;
  try {
    await retryWithBackoff(async () => {
      attempts4++;
      throw new Error('Unauthorized');
    }, {
      operation: 'test-no-retry',
      shouldRetry: (error) => !error.message.includes('Unauthorized'),
      baseDelay: 50
    });
    
    assert(false, 'Should have thrown immediately');
  } catch (error) {
    assert(!(error instanceof RetryExhaustedError), 'Should not be RetryExhaustedError');
    assert(attempts4 === 1, 'Should only attempt once for non-retryable errors');
  }

  // Test 5: Exponential backoff timing
  console.log('\nTest 5: Exponential backoff timing verification');
  try {
    let attempts = 0;
    const delays: number[] = [];
    const startTime = Date.now();
    
    await retryWithBackoff(async () => {
      attempts++;
      if (attempts > 1) {
        delays.push(Date.now() - startTime);
      }
      if (attempts < 4) {
        throw new Error(`Attempt ${attempts} failed`);
      }
      return 'success';
    }, { 
      operation: 'test-backoff-timing',
      maxRetries: 3,
      baseDelay: 100
    });
    
    // Verify timing (with tolerance for execution time)
    // Attempt 1: immediate (0ms)
    // Attempt 2: after 100ms delay
    // Attempt 3: after 200ms delay
    // Attempt 4: after 400ms delay
    
    assert(delays.length === 3, 'Should have 3 delays recorded');
    assert(delays[0] >= 90 && delays[0] <= 150, `First retry delay ~100ms (actual: ${delays[0]}ms)`);
    assert(delays[1] >= 280 && delays[1] <= 350, `Second retry delay ~300ms cumulative (actual: ${delays[1]}ms)`);
    assert(delays[2] >= 680 && delays[2] <= 800, `Third retry delay ~700ms cumulative (actual: ${delays[2]}ms)`);
  } catch (error) {
    assert(false, `Timing test failed: ${error}`);
  }

  // Test 6: onRetry callback
  console.log('\nTest 6: onRetry callback invocation');
  try {
    let callbackInvocations = 0;
    const callbackData: Array<{error: Error, attempt: number, delay: number}> = [];
    
    await retryWithBackoff(async () => {
      if (callbackInvocations < 2) {
        throw new Error('Not yet');
      }
      return 'success';
    }, {
      operation: 'test-callback',
      maxRetries: 3,
      baseDelay: 50,
      onRetry: (error, attempt, delay) => {
        callbackInvocations++;
        callbackData.push({ error, attempt, delay });
      }
    });
    
    assert(callbackInvocations === 2, 'Callback should be invoked for each retry');
    assert(callbackData[0].attempt === 0, 'First callback should have attempt 0');
    assert(callbackData[1].attempt === 1, 'Second callback should have attempt 1');
    assert(callbackData[0].delay === 50, 'First delay should be 50ms');
    assert(callbackData[1].delay === 100, 'Second delay should be 100ms');
  } catch (error) {
    assert(false, `Callback test failed: ${error}`);
  }

  // Test 7: Convenience retry() function
  console.log('\nTest 7: Convenience retry() function');
  try {
    let attempts = 0;
    const result = await retry(2, async () => {
      attempts++;
      if (attempts < 2) {
        throw new Error('Not yet');
      }
      return 'convenience-success';
    }, 'test-convenience');
    
    assert(result === 'convenience-success', 'Convenience function should work');
    assert(attempts === 2, 'Should retry correctly');
  } catch (error) {
    assert(false, `Convenience function test failed: ${error}`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log('='.repeat(50));
  
  if (testsFailed === 0) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
