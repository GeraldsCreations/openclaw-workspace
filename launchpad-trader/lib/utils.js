/**
 * Utility Functions
 * Helper functions for formatting, validation, and common operations
 */

import { PublicKey } from '@solana/web3.js';

// ==================== VALIDATION ====================

/**
 * Validate Solana address
 * @param {string} address - Address to validate
 * @returns {boolean}
 */
export function isValidSolanaAddress(address) {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate token creation parameters
 * @param {object} params - Token parameters
 * @throws {Error} - If validation fails
 */
export function validateTokenParams(params) {
  const required = ['name', 'symbol', 'description', 'imageUrl'];
  
  for (const field of required) {
    if (!params[field] || params[field].trim() === '') {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Symbol validation
  if (params.symbol.length > 10) {
    throw new Error('Symbol must be 10 characters or less');
  }

  if (!/^[A-Z0-9]+$/.test(params.symbol)) {
    throw new Error('Symbol must contain only uppercase letters and numbers');
  }

  // Image URL validation
  if (!isValidUrl(params.imageUrl)) {
    throw new Error('Invalid image URL');
  }

  // Market cap validation
  if (params.initialMarketCap && params.initialMarketCap <= 0) {
    throw new Error('Initial market cap must be positive');
  }

  if (params.migrationMarketCap && params.migrationMarketCap <= 0) {
    throw new Error('Migration market cap must be positive');
  }

  if (params.initialMarketCap && params.migrationMarketCap &&
      params.migrationMarketCap <= params.initialMarketCap) {
    throw new Error('Migration market cap must be greater than initial market cap');
  }
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate trade parameters
 * @param {number} amount - Trade amount
 * @param {number} slippage - Slippage tolerance
 * @throws {Error} - If validation fails
 */
export function validateTradeParams(amount, slippage) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  if (slippage < 0 || slippage > 100) {
    throw new Error('Slippage must be between 0 and 100');
  }
}

// ==================== FORMATTING ====================

/**
 * Format SOL amount
 * @param {number} lamports - Amount in lamports
 * @returns {string}
 */
export function formatSol(lamports) {
  const sol = lamports / 1e9;
  return `${sol.toFixed(4)} SOL`;
}

/**
 * Format token amount
 * @param {number} amount - Token amount
 * @param {number} decimals - Token decimals
 * @returns {string}
 */
export function formatTokenAmount(amount, decimals = 9) {
  const adjusted = amount / Math.pow(10, decimals);
  return adjusted.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

/**
 * Format USD amount
 * @param {number} amount - USD amount
 * @returns {string}
 */
export function formatUsd(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @returns {string}
 */
export function formatPercentage(value) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format timestamp
 * @param {string|number} timestamp - ISO string or unix timestamp
 * @returns {string}
 */
export function formatTimestamp(timestamp) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Shorten address for display
 * @param {string} address - Full address
 * @param {number} chars - Characters to show on each end
 * @returns {string}
 */
export function shortenAddress(address, chars = 4) {
  if (!address || address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// ==================== CALCULATIONS ====================

/**
 * Calculate price impact
 * @param {number} inputAmount - Input amount
 * @param {number} outputAmount - Output amount
 * @param {number} currentPrice - Current market price
 * @returns {number} - Price impact percentage
 */
export function calculatePriceImpact(inputAmount, outputAmount, currentPrice) {
  const executionPrice = inputAmount / outputAmount;
  const impact = ((executionPrice - currentPrice) / currentPrice) * 100;
  return Math.abs(impact);
}

/**
 * Calculate minimum output with slippage
 * @param {number} expectedOutput - Expected output amount
 * @param {number} slippage - Slippage tolerance (percentage)
 * @returns {number}
 */
export function calculateMinOutput(expectedOutput, slippage) {
  return expectedOutput * (1 - slippage / 100);
}

/**
 * Calculate profit/loss
 * @param {number} buyPrice - Entry price
 * @param {number} sellPrice - Exit price
 * @param {number} amount - Amount traded
 * @returns {object} - { profit, percentage }
 */
export function calculateProfitLoss(buyPrice, sellPrice, amount) {
  const profit = (sellPrice - buyPrice) * amount;
  const percentage = ((sellPrice - buyPrice) / buyPrice) * 100;
  
  return {
    profit,
    percentage,
    isProfit: profit >= 0,
  };
}

// ==================== SLEEP & RETRY ====================

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Max retry attempts
 * @param {number} baseDelay - Base delay in ms
 * @returns {Promise}
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`⚠️  Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

// ==================== TOKEN SEARCH & FILTER ====================

/**
 * Search tokens by name or symbol
 * @param {array} tokens - Array of token objects
 * @param {string} query - Search query
 * @returns {array}
 */
export function searchTokens(tokens, query) {
  const lowerQuery = query.toLowerCase();
  
  return tokens.filter(token => 
    token.name.toLowerCase().includes(lowerQuery) ||
    token.symbol.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter tokens by criteria
 * @param {array} tokens - Array of token objects
 * @param {object} filters - Filter criteria
 * @returns {array}
 */
export function filterTokens(tokens, filters = {}) {
  let filtered = [...tokens];

  if (filters.minMarketCap) {
    filtered = filtered.filter(t => t.marketCap >= filters.minMarketCap);
  }

  if (filters.maxMarketCap) {
    filtered = filtered.filter(t => t.marketCap <= filters.maxMarketCap);
  }

  if (filters.minVolume) {
    filtered = filtered.filter(t => t.volume24h >= filters.minVolume);
  }

  if (filters.minHolders) {
    filtered = filtered.filter(t => t.holders >= filters.minHolders);
  }

  return filtered;
}

/**
 * Sort tokens
 * @param {array} tokens - Array of token objects
 * @param {string} sortBy - Field to sort by
 * @param {string} order - 'asc' or 'desc'
 * @returns {array}
 */
export function sortTokens(tokens, sortBy = 'marketCap', order = 'desc') {
  const sorted = [...tokens].sort((a, b) => {
    const aVal = a[sortBy] || 0;
    const bVal = b[sortBy] || 0;
    
    return order === 'desc' ? bVal - aVal : aVal - bVal;
  });

  return sorted;
}

// ==================== LOGGING ====================

/**
 * Pretty print token info
 * @param {object} token - Token object
 */
export function printToken(token) {
  console.log('\n' + '='.repeat(60));
  console.log(`🪙  ${token.name} (${token.symbol})`);
  console.log('='.repeat(60));
  console.log(`Mint:        ${token.mintAddress}`);
  console.log(`Price:       ${formatUsd(token.price)}`);
  console.log(`Market Cap:  ${formatUsd(token.marketCap)}`);
  console.log(`Volume 24h:  ${formatUsd(token.volume24h)}`);
  console.log(`Holders:     ${token.holders || 'N/A'}`);
  console.log(`Creator:     ${shortenAddress(token.creatorWallet)}`);
  console.log(`Created:     ${formatTimestamp(token.createdAt)}`);
  if (token.description) {
    console.log(`\nDescription: ${token.description}`);
  }
  console.log('='.repeat(60) + '\n');
}

/**
 * Pretty print transaction result
 * @param {object} tx - Transaction object
 * @param {string} type - Transaction type ('buy' or 'sell')
 */
export function printTransaction(tx, type) {
  console.log('\n' + '='.repeat(60));
  console.log(`✅  ${type.toUpperCase()} Transaction Successful`);
  console.log('='.repeat(60));
  console.log(`Signature:   ${tx.signature}`);
  
  if (type === 'buy') {
    console.log(`Tokens:      ${formatTokenAmount(tx.tokensReceived)}`);
  } else {
    console.log(`SOL:         ${formatSol(tx.solReceived * 1e9)}`);
  }
  
  console.log(`Price:       ${formatUsd(tx.pricePerToken)}`);
  console.log(`Fee:         ${formatUsd(tx.fee)}`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Print error message
 * @param {Error} error - Error object
 */
export function printError(error) {
  console.error('\n❌ Error:', error.message);
  if (error.statusCode) {
    console.error(`Status Code: ${error.statusCode}`);
  }
  if (error.retryAfter) {
    console.error(`Retry After: ${error.retryAfter} seconds`);
  }
  console.error('');
}

export default {
  isValidSolanaAddress,
  validateTokenParams,
  validateTradeParams,
  isValidUrl,
  formatSol,
  formatTokenAmount,
  formatUsd,
  formatPercentage,
  formatTimestamp,
  shortenAddress,
  calculatePriceImpact,
  calculateMinOutput,
  calculateProfitLoss,
  sleep,
  retryWithBackoff,
  searchTokens,
  filterTokens,
  sortTokens,
  printToken,
  printTransaction,
  printError,
};
