#!/usr/bin/env node

/**
 * List Tokens Script
 * Browse and search tokens on LaunchPad platform
 */

import LaunchPadAPIClient from '../lib/api-client.js';
import {
  formatUsd,
  formatTimestamp,
  shortenAddress,
  searchTokens,
  filterTokens,
  sortTokens,
  printToken,
  printError,
} from '../lib/utils.js';

async function main() {
  const args = parseArgs();
  
  try {
    const apiClient = new LaunchPadAPIClient();
    
    console.log('🔍 Fetching tokens from LaunchPad...\n');
    
    let result;
    
    if (args.token) {
      // Get specific token details
      result = await apiClient.getToken(args.token);
      printToken(result.token);
      
      // Also show analytics if available
      if (args.analytics) {
        console.log('📊 Fetching analytics...\n');
        const analytics = await apiClient.getTokenAnalytics(args.token);
        printAnalytics(analytics.analytics);
      }
      
      return;
    }
    
    // Get all tokens
    result = await apiClient.getTokens({
      limit: args.limit,
      offset: args.offset,
    });
    
    let tokens = result.tokens;
    
    // Apply search
    if (args.search) {
      tokens = searchTokens(tokens, args.search);
      console.log(`🔍 Search results for "${args.search}": ${tokens.length} token(s)\n`);
    }
    
    // Apply filters
    const filters = {};
    if (args.minMcap) filters.minMarketCap = args.minMcap;
    if (args.maxMcap) filters.maxMarketCap = args.maxMcap;
    if (args.minVolume) filters.minVolume = args.minVolume;
    
    if (Object.keys(filters).length > 0) {
      tokens = filterTokens(tokens, filters);
      console.log(`📊 After filters: ${tokens.length} token(s)\n`);
    }
    
    // Apply sorting
    tokens = sortTokens(tokens, args.sortBy, args.order);
    
    if (tokens.length === 0) {
      console.log('No tokens found matching criteria.');
      return;
    }
    
    // Display results
    if (args.detailed) {
      // Detailed view
      for (const token of tokens) {
        printToken(token);
      }
    } else {
      // Table view
      printTokenTable(tokens);
    }
    
    console.log(`\nShowing ${tokens.length} of ${result.total} total tokens`);
    
    if (args.offset + args.limit < result.total) {
      const nextOffset = args.offset + args.limit;
      console.log(`\n💡 To see more, use: --offset ${nextOffset}`);
    }
    
  } catch (error) {
    printError(error);
    process.exit(1);
  }
}

function printTokenTable(tokens) {
  console.log('='.repeat(100));
  console.log(
    padRight('Symbol', 10) +
    padRight('Name', 20) +
    padRight('Price', 12) +
    padRight('Market Cap', 15) +
    padRight('24h Volume', 15) +
    padRight('Mint', 28)
  );
  console.log('='.repeat(100));
  
  for (const token of tokens) {
    console.log(
      padRight(token.symbol, 10) +
      padRight(truncate(token.name, 18), 20) +
      padRight(formatUsd(token.price), 12) +
      padRight(formatCompact(token.marketCap), 15) +
      padRight(formatCompact(token.volume24h), 15) +
      padRight(shortenAddress(token.mintAddress, 6), 28)
    );
  }
  
  console.log('='.repeat(100));
}

function printAnalytics(analytics) {
  console.log('='.repeat(60));
  console.log('Token Analytics');
  console.log('='.repeat(60));
  console.log(`Current Price:     ${formatUsd(analytics.price)}`);
  console.log(`24h Change:        ${analytics.priceChange24h >= 0 ? '+' : ''}${analytics.priceChange24h.toFixed(2)}%`);
  console.log(`24h Volume:        ${formatUsd(analytics.volume24h)}`);
  console.log(`Market Cap:        ${formatUsd(analytics.marketCap)}`);
  console.log(`Holders:           ${analytics.holders.toLocaleString()}`);
  console.log(`24h Trades:        ${analytics.trades24h.toLocaleString()}`);
  console.log('='.repeat(60) + '\n');
  
  if (analytics.priceHistory && analytics.priceHistory.length > 0) {
    console.log('📈 Recent Price History:');
    const recent = analytics.priceHistory.slice(-5);
    for (const point of recent) {
      console.log(`   ${formatTimestamp(point.timestamp)}: ${formatUsd(point.price)}`);
    }
    console.log('');
  }
}

function padRight(str, length) {
  return (str + ' '.repeat(length)).substring(0, length);
}

function truncate(str, length) {
  return str.length > length ? str.substring(0, length - 2) + '..' : str;
}

function formatCompact(num) {
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return formatUsd(num);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    token: null,
    search: null,
    sortBy: 'marketCap',
    order: 'desc',
    limit: 20,
    offset: 0,
    minMcap: null,
    maxMcap: null,
    minVolume: null,
    detailed: false,
    analytics: false,
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];
    
    switch (arg) {
      case '--token':
      case '-t':
        parsed.token = next;
        i++;
        break;
      case '--search':
      case '-s':
        parsed.search = next;
        i++;
        break;
      case '--sort':
        parsed.sortBy = next;
        i++;
        break;
      case '--order':
        parsed.order = next;
        i++;
        break;
      case '--limit':
      case '-l':
        parsed.limit = parseInt(next);
        i++;
        break;
      case '--offset':
        parsed.offset = parseInt(next);
        i++;
        break;
      case '--min-mcap':
        parsed.minMcap = parseFloat(next);
        i++;
        break;
      case '--max-mcap':
        parsed.maxMcap = parseFloat(next);
        i++;
        break;
      case '--min-volume':
        parsed.minVolume = parseFloat(next);
        i++;
        break;
      case '--detailed':
      case '-d':
        parsed.detailed = true;
        break;
      case '--analytics':
      case '-a':
        parsed.analytics = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }
  
  return parsed;
}

function printHelp() {
  console.log(`
LaunchPad Token Browser

USAGE:
  node list-tokens.js [options]

OPTIONS:
  -t, --token <mint>               Get specific token details
  -s, --search <query>             Search by name or symbol
  --sort <field>                   Sort by field (marketCap, volume24h, price)
  --order <asc|desc>               Sort order (default: desc)
  -l, --limit <number>             Max results (default: 20)
  --offset <number>                Pagination offset (default: 0)
  --min-mcap <amount>              Minimum market cap filter
  --max-mcap <amount>              Maximum market cap filter
  --min-volume <amount>            Minimum 24h volume filter
  -d, --detailed                   Show detailed view
  -a, --analytics                  Show analytics (with --token)

EXAMPLES:
  # List top 20 tokens
  node list-tokens.js
  
  # Search for tokens
  node list-tokens.js --search "dog"
  
  # Filter by market cap
  node list-tokens.js --min-mcap 50000 --max-mcap 500000
  
  # Sort by volume
  node list-tokens.js --sort volume24h --limit 10
  
  # Get specific token with analytics
  node list-tokens.js \\
    --token 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU \\
    --analytics
  
  # Detailed view
  node list-tokens.js --detailed --limit 5

SORT FIELDS:
  - marketCap      Market capitalization (default)
  - volume24h      24-hour trading volume
  - price          Current price
  - holders        Number of holders

NOTES:
  - No authentication required
  - Prices update in real-time
  - Use filters to find opportunities
  `);
}

main();
