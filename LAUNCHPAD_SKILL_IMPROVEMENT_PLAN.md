# LaunchPad Trader Skill - Improvement Plan

## 🎯 Mission
Transform LaunchPad trader into a rock-solid, production-grade OpenClaw skill with multiple wallet options and best-in-class UX.

---

## 📋 Current State Assessment

### ✅ Strengths
- Clean modular architecture (wallet.js, launchpad.js, rewards.js)
- Working backend integration
- Environment-based configuration
- Good separation of concerns
- Rewards system implemented

### ⚠️ Gaps Identified

#### 1. Wallet Management
- **Current:** Only supports keypair file (create or load)
- **Missing:** Privy, import from seed/private key, connection to external wallets
- **Security:** Plain JSON keypair storage (no encryption)

#### 2. Skill Structure (OpenClaw Best Practices)
- **SKILL.md:** 181 lines (good, under 500 line target)
- **Description:** Good but could be more comprehensive for triggering
- **Progressive Disclosure:** Not using references/ folder effectively
- **Bundled Resources:** Could organize better

#### 3. User Experience
- No guided setup flow
- Limited error messages
- No wallet backup/recovery guidance
- Missing setup wizard

#### 4. Testing & Quality
- Test files exist but not comprehensive
- No CI/CD setup
- Missing integration tests
- No security audit

---

## 🚀 Phase 1: Multi-Wallet Support (HIGH PRIORITY)

### Goal
Support 4 wallet options with seamless UX.

### Wallet Options

#### Option 1: 🔐 Privy Integration (RECOMMENDED)
**Why Privy:**
- Embedded wallet (no extension needed)
- Email/social login
- MPC key management (more secure than storing keypairs)
- Cross-device sync
- Recovery options
- Production-ready for Web3 apps

**Implementation:**
```javascript
// wallet-privy.js
const { PrivyClient } = require('@privy-io/server-auth');

async function initPrivyWallet(userId) {
  const privy = new PrivyClient(
    process.env.PRIVY_APP_ID,
    process.env.PRIVY_APP_SECRET
  );
  
  // Create embedded wallet for user
  const wallet = await privy.createWallet(userId);
  
  return {
    address: wallet.address,
    provider: 'privy',
    userId,
  };
}

async function signWithPrivy(userId, transaction) {
  const privy = new PrivyClient(
    process.env.PRIVY_APP_ID,
    process.env.PRIVY_APP_SECRET
  );
  
  return await privy.signTransaction(userId, transaction);
}
```

**Config:**
```bash
# .env
PRIVY_APP_ID=your-app-id
PRIVY_APP_SECRET=your-secret
WALLET_PROVIDER=privy
```

#### Option 2: ➕ Create New Wallet (EXISTING - ENHANCE)
**Current Implementation:** ✅ Works
**Enhancements:**
- Add encryption for keypair storage
- Mnemonic generation + display
- Backup reminder flow
- Recovery phrase verification

**Enhanced Implementation:**
```javascript
// wallet-create.js (enhanced)
const bip39 = require('bip39');
const { Keypair } = require('@solana/web3.js');
const { derivePath } = require('ed25519-hd-key');
const crypto = require('crypto');

async function createWalletWithRecovery() {
  // 1. Generate mnemonic (12 or 24 words)
  const mnemonic = bip39.generateMnemonic(256); // 24 words
  
  // 2. Derive keypair from mnemonic
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const path = "m/44'/501'/0'/0'"; // Solana derivation path
  const derivedSeed = derivePath(path, seed.toString('hex')).key;
  const keypair = Keypair.fromSeed(derivedSeed);
  
  // 3. Encrypt and save
  const encrypted = encryptKeypair(keypair, getUserPassword());
  saveEncryptedKeypair(encrypted);
  
  // 4. Display recovery phrase (one-time only!)
  console.log('🔐 RECOVERY PHRASE (WRITE THIS DOWN!):');
  console.log(mnemonic);
  console.log('\n⚠️ THIS IS YOUR ONLY CHANCE TO SEE THIS!');
  
  // 5. Verify user wrote it down
  await verifyRecoveryPhrase(mnemonic);
  
  return {
    address: keypair.publicKey.toBase58(),
    provider: 'local-encrypted',
  };
}

function encryptKeypair(keypair, password) {
  const algorithm = 'aes-256-gcm';
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  const secretKey = Buffer.from(keypair.secretKey);
  const encrypted = Buffer.concat([
    cipher.update(secretKey),
    cipher.final(),
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted.toString('hex'),
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

async function verifyRecoveryPhrase(mnemonic) {
  const words = mnemonic.split(' ');
  const randomIndices = [
    Math.floor(Math.random() * words.length),
    Math.floor(Math.random() * words.length),
  ];
  
  console.log('\n✅ Verify you wrote it down correctly:');
  console.log(`What is word #${randomIndices[0] + 1}?`);
  // ... get user input and verify
}
```

#### Option 3: 📥 Import Wallet
**Supported Formats:**
- Private key (base58 string)
- Secret key (byte array JSON)
- Mnemonic/seed phrase (12 or 24 words)
- Keypair file (existing JSON format)

**Implementation:**
```javascript
// wallet-import.js
async function importWallet(input, type) {
  let keypair;
  
  switch (type) {
    case 'mnemonic':
      keypair = await fromMnemonic(input);
      break;
      
    case 'privateKey':
      keypair = Keypair.fromSecretKey(
        bs58.decode(input)
      );
      break;
      
    case 'secretKeyArray':
      keypair = Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(input))
      );
      break;
      
    case 'keypairFile':
      const data = fs.readFileSync(input, 'utf8');
      keypair = Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(data))
      );
      break;
      
    default:
      throw new Error('Unsupported import format');
  }
  
  // Encrypt and save
  const encrypted = encryptKeypair(keypair, getUserPassword());
  saveEncryptedKeypair(encrypted);
  
  return {
    address: keypair.publicKey.toBase58(),
    provider: 'local-encrypted',
  };
}

async function fromMnemonic(mnemonic) {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }
  
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const path = "m/44'/501'/0'/0'";
  const derivedSeed = derivePath(path, seed.toString('hex')).key;
  
  return Keypair.fromSeed(derivedSeed);
}
```

#### Option 4: 🔗 Connect External Wallet (OPTIONAL)
**Use Cases:**
- Connect to Phantom/Solflare browser extension
- Hardware wallet support (Ledger)

**Implementation:**
```javascript
// wallet-external.js
async function connectPhantom() {
  // This would require a browser context
  // For CLI/OpenClaw, we'd need a different approach
  // Could use wallet-adapter with headless browser
  
  console.log('⚠️ External wallet connection requires browser context');
  console.log('Consider using Privy for embedded wallet instead');
}
```

---

## 🏗️ Phase 2: Unified Wallet Manager

### wallet-manager.js (NEW)
Central wallet management abstraction layer.

```javascript
// wallet-manager.js
const privyWallet = require('./wallet-privy');
const localWallet = require('./wallet-local');
const importWallet = require('./wallet-import');

class WalletManager {
  constructor() {
    this.provider = process.env.WALLET_PROVIDER || 'local';
    this.wallet = null;
  }
  
  async initialize() {
    switch (this.provider) {
      case 'privy':
        this.wallet = await privyWallet.load();
        break;
        
      case 'local':
      case 'local-encrypted':
        this.wallet = await localWallet.load();
        break;
        
      default:
        throw new Error(`Unknown wallet provider: ${this.provider}`);
    }
    
    return this.wallet;
  }
  
  async getAddress() {
    if (!this.wallet) await this.initialize();
    return this.wallet.address;
  }
  
  async signTransaction(transaction) {
    if (!this.wallet) await this.initialize();
    
    switch (this.provider) {
      case 'privy':
        return await privyWallet.sign(this.wallet.userId, transaction);
        
      case 'local':
      case 'local-encrypted':
        return await localWallet.sign(this.wallet.keypair, transaction);
        
      default:
        throw new Error('Cannot sign with this provider');
    }
  }
  
  async getBalance() {
    const address = await this.getAddress();
    // ... fetch balance from Solana
  }
}

module.exports = new WalletManager();
```

---

## 📁 Phase 3: Skill Structure Improvements

### New Directory Structure

```
launchpad-trader/
├── SKILL.md (enhanced - <500 lines)
├── package.json
├── config.js
├── .env.example (enhanced)
│
├── lib/ (NEW - core modules)
│   ├── wallet-manager.js (unified wallet interface)
│   ├── wallet-privy.js (Privy integration)
│   ├── wallet-local.js (enhanced local wallet with encryption)
│   ├── wallet-import.js (import from various formats)
│   ├── launchpad-client.js (LaunchPad API client)
│   └── rewards-client.js (Rewards API client)
│
├── scripts/ (executable entry points)
│   ├── setup-wizard.js (NEW - guided setup)
│   ├── wallet.js (refactored to use wallet-manager)
│   ├── launchpad.js (refactored)
│   └── rewards.js (refactored)
│
├── references/ (NEW - detailed docs)
│   ├── WALLET_SECURITY.md (security best practices)
│   ├── PRIVY_SETUP.md (Privy integration guide)
│   ├── RECOVERY.md (wallet recovery procedures)
│   ├── TRADING_GUIDE.md (detailed trading instructions)
│   └── API_REFERENCE.md (complete API docs)
│
├── tests/ (NEW - comprehensive testing)
│   ├── wallet.test.js
│   ├── launchpad.test.js
│   └── integration.test.js
│
└── assets/ (templates, if needed)
    └── .env.template
```

---

## 🎨 Phase 4: Setup Wizard (NEW)

### Interactive Setup Experience

```javascript
// scripts/setup-wizard.js
const inquirer = require('inquirer');
const chalk = require('chalk');

async function runSetupWizard() {
  console.log(chalk.bold.cyan('\n🚀 LaunchPad Trader Setup Wizard\n'));
  
  // Step 1: Choose wallet provider
  const { walletProvider } = await inquirer.prompt([{
    type: 'list',
    name: 'walletProvider',
    message: 'Choose your wallet setup:',
    choices: [
      {
        name: '🔐 Privy (Recommended) - Secure embedded wallet with email login',
        value: 'privy',
      },
      {
        name: '➕ Create New Wallet - Generate new Solana keypair',
        value: 'create',
      },
      {
        name: '📥 Import Existing Wallet - From seed phrase or private key',
        value: 'import',
      },
    ],
  }]);
  
  // Step 2: Execute chosen setup
  switch (walletProvider) {
    case 'privy':
      await setupPrivy();
      break;
      
    case 'create':
      await setupCreateWallet();
      break;
      
    case 'import':
      await setupImportWallet();
      break;
  }
  
  // Step 3: RPC configuration
  await setupRPC();
  
  // Step 4: Backend configuration
  await setupBackend();
  
  // Step 5: Test connection
  await testSetup();
  
  console.log(chalk.bold.green('\n✅ Setup complete! You\'re ready to trade.\n'));
}

async function setupPrivy() {
  console.log(chalk.bold('\n🔐 Privy Setup\n'));
  
  const { appId, appSecret } = await inquirer.prompt([
    {
      type: 'input',
      name: 'appId',
      message: 'Enter your Privy App ID:',
      validate: (input) => input.length > 0 || 'App ID is required',
    },
    {
      type: 'password',
      name: 'appSecret',
      message: 'Enter your Privy App Secret:',
      validate: (input) => input.length > 0 || 'App Secret is required',
    },
  ]);
  
  // Save to .env
  updateEnv({
    WALLET_PROVIDER: 'privy',
    PRIVY_APP_ID: appId,
    PRIVY_APP_SECRET: appSecret,
  });
  
  console.log(chalk.green('✅ Privy configured!'));
}

async function setupCreateWallet() {
  console.log(chalk.bold('\n➕ Create New Wallet\n'));
  console.log(chalk.yellow('⚠️  You will see a recovery phrase. Write it down securely!'));
  
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: 'Ready to create wallet?',
    default: true,
  }]);
  
  if (!confirm) {
    console.log('Cancelled.');
    return;
  }
  
  // Create wallet with recovery phrase
  const wallet = await createWalletWithRecovery();
  
  console.log(chalk.green(`\n✅ Wallet created: ${wallet.address}\n`));
}

async function setupImportWallet() {
  console.log(chalk.bold('\n📥 Import Wallet\n'));
  
  const { importType } = await inquirer.prompt([{
    type: 'list',
    name: 'importType',
    message: 'What are you importing?',
    choices: [
      { name: '🔑 Recovery Phrase (12 or 24 words)', value: 'mnemonic' },
      { name: '🔐 Private Key (base58)', value: 'privateKey' },
      { name: '📄 Keypair File (.json)', value: 'keypairFile' },
    ],
  }]);
  
  let wallet;
  
  switch (importType) {
    case 'mnemonic':
      const { mnemonic } = await inquirer.prompt([{
        type: 'input',
        name: 'mnemonic',
        message: 'Enter your recovery phrase:',
        validate: (input) => {
          const words = input.trim().split(/\s+/);
          return (words.length === 12 || words.length === 24) 
            || 'Must be 12 or 24 words';
        },
      }]);
      
      wallet = await importWallet(mnemonic, 'mnemonic');
      break;
      
    case 'privateKey':
      const { privateKey } = await inquirer.prompt([{
        type: 'password',
        name: 'privateKey',
        message: 'Enter your private key:',
      }]);
      
      wallet = await importWallet(privateKey, 'privateKey');
      break;
      
    case 'keypairFile':
      const { filePath } = await inquirer.prompt([{
        type: 'input',
        name: 'filePath',
        message: 'Enter path to keypair file:',
      }]);
      
      wallet = await importWallet(filePath, 'keypairFile');
      break;
  }
  
  console.log(chalk.green(`\n✅ Wallet imported: ${wallet.address}\n`));
}

async function setupRPC() {
  console.log(chalk.bold('\n🔗 RPC Configuration\n'));
  
  const { network } = await inquirer.prompt([{
    type: 'list',
    name: 'network',
    message: 'Choose Solana network:',
    choices: [
      { name: 'Devnet (Testing)', value: 'devnet' },
      { name: 'Mainnet Beta (Production)', value: 'mainnet-beta' },
    ],
  }]);
  
  const { rpcChoice } = await inquirer.prompt([{
    type: 'list',
    name: 'rpcChoice',
    message: 'Choose RPC provider:',
    choices: [
      { name: 'Public RPC (Free, rate limited)', value: 'public' },
      { name: 'Helius (Recommended)', value: 'helius' },
      { name: 'QuickNode', value: 'quicknode' },
      { name: 'Custom URL', value: 'custom' },
    ],
  }]);
  
  let rpcUrl;
  
  if (rpcChoice === 'public') {
    rpcUrl = network === 'devnet' 
      ? 'https://api.devnet.solana.com'
      : 'https://api.mainnet-beta.solana.com';
  } else if (rpcChoice === 'custom') {
    const { customUrl } = await inquirer.prompt([{
      type: 'input',
      name: 'customUrl',
      message: 'Enter your RPC URL:',
    }]);
    rpcUrl = customUrl;
  } else {
    const { apiKey } = await inquirer.prompt([{
      type: 'input',
      name: 'apiKey',
      message: `Enter your ${rpcChoice} API key:`,
    }]);
    
    if (rpcChoice === 'helius') {
      rpcUrl = `https://${network}.helius-rpc.com/?api-key=${apiKey}`;
    } else if (rpcChoice === 'quicknode') {
      rpcUrl = apiKey; // Full URL
    }
  }
  
  updateEnv({
    SOLANA_NETWORK: network,
    SOLANA_RPC_URL: rpcUrl,
  });
  
  console.log(chalk.green('✅ RPC configured!'));
}

async function setupBackend() {
  console.log(chalk.bold('\n🚀 LaunchPad Backend\n'));
  
  const { backendUrl } = await inquirer.prompt([{
    type: 'input',
    name: 'backendUrl',
    message: 'LaunchPad API URL:',
    default: 'http://localhost:3000/v1',
  }]);
  
  updateEnv({
    LAUNCHPAD_API_URL: backendUrl,
  });
  
  console.log(chalk.green('✅ Backend configured!'));
}

async function testSetup() {
  console.log(chalk.bold('\n🧪 Testing Setup...\n'));
  
  // Test wallet connection
  const walletManager = require('../lib/wallet-manager');
  const address = await walletManager.getAddress();
  console.log(chalk.green(`✅ Wallet connected: ${address}`));
  
  // Test RPC connection
  const balance = await walletManager.getBalance();
  console.log(chalk.green(`✅ RPC connected: ${balance} SOL`));
  
  // Test backend connection
  // ... test LaunchPad API
  
  console.log(chalk.green('\n✅ All tests passed!'));
}

function updateEnv(vars) {
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.existsSync(envPath) 
    ? fs.readFileSync(envPath, 'utf8') 
    : '';
  
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const line = `${key}=${value}`;
    
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, line);
    } else {
      envContent += `\n${line}`;
    }
  }
  
  fs.writeFileSync(envPath, envContent.trim() + '\n');
}

module.exports = { runSetupWizard };

if (require.main === module) {
  runSetupWizard().catch(console.error);
}
```

---

## 📝 Phase 5: Enhanced SKILL.md

### Updated Structure (Following Best Practices)

```markdown
---
name: launchpad-trader
description: Comprehensive Solana wallet management and token trading on LaunchPad platform. Supports multiple wallet options (Privy embedded wallet, create new, import existing), SOL/token operations, LaunchPad trading (create/buy/sell tokens), and bot rewards (50% fee share). Use when: (1) Managing Solana wallets, (2) Trading tokens on LaunchPad, (3) Creating new tokens, (4) Checking/claiming bot rewards, (5) SOL or SPL token transfers. Triggers: "create wallet", "import wallet", "sol balance", "buy token", "sell token", "create token", "check rewards", "claim rewards".
---

# LaunchPad Trader

Manage Solana wallets and trade tokens on the LaunchPad platform with multiple wallet options and comprehensive trading features.

## Quick Start

**First time setup:**
```
Run the setup wizard to configure wallet and network
```

**Check balance:**
```
What's my SOL balance?
```

**Trade tokens:**
```
Buy 100 SOL worth of PUMP token
```

## Wallet Options

### 🔐 Privy (Recommended)
Secure embedded wallet with email login. Best for production use.
- **Setup:** See [PRIVY_SETUP.md](references/PRIVY_SETUP.md)
- **Trigger:** "set up Privy wallet"

### ➕ Create New Wallet
Generate fresh Solana keypair with recovery phrase.
- **Trigger:** "create new wallet"
- **Security:** Encrypted storage, recovery phrase backup

### 📥 Import Wallet
Import from seed phrase, private key, or keypair file.
- **Trigger:** "import wallet"
- **Formats:** 12/24-word phrase, base58 key, JSON keypair

## Commands

### Wallet Management
- Check balance: "What's my SOL balance?"
- Get address: "Show my wallet address"
- Token balances: "Show all my tokens"

### Trading
- Buy: "Buy 50 SOL of token ABC..."
- Sell: "Sell all my GERELD tokens"
- Quote: "Get buy quote for 100 SOL"
- Create: "Create token MyToken (MTK)"

### Rewards
- Check: "Check my bot rewards"
- Claim: "Claim pending rewards"
- Leaderboard: "Show top earning bots"

## Configuration

**Environment variables:**
```bash
WALLET_PROVIDER=privy|local
SOLANA_NETWORK=devnet|mainnet-beta
SOLANA_RPC_URL=https://your-rpc.com
LAUNCHPAD_API_URL=https://api.launchpad.com/v1
PRIVY_APP_ID=your-app-id (if using Privy)
PRIVY_APP_SECRET=your-secret (if using Privy)
```

**Setup wizard:**
```bash
node scripts/setup-wizard.js
```

## Scripts

- `setup-wizard.js` - Interactive setup
- `wallet.js` - Wallet operations
- `launchpad.js` - Trading operations
- `rewards.js` - Rewards management

## Detailed Guides

- **Wallet Security:** See [WALLET_SECURITY.md](references/WALLET_SECURITY.md)
- **Privy Setup:** See [PRIVY_SETUP.md](references/PRIVY_SETUP.md)
- **Recovery Procedures:** See [RECOVERY.md](references/RECOVERY.md)
- **Trading Guide:** See [TRADING_GUIDE.md](references/TRADING_GUIDE.md)
- **API Reference:** See [API_REFERENCE.md](references/API_REFERENCE.md)

## Security

- **Encryption:** All local keypairs encrypted with AES-256-GCM
- **Recovery:** 24-word mnemonic for backup
- **Privy:** MPC key management, no single point of failure
- **Never share:** Private keys or recovery phrases

## Requirements

- Node.js 18+
- Solana CLI (optional, for testing)
- Privy account (for Privy provider)
```

---

## 🧪 Phase 6: Comprehensive Testing

### Test Suite

```javascript
// tests/wallet.test.js
const { WalletManager } = require('../lib/wallet-manager');

describe('WalletManager', () => {
  describe('Local Wallet', () => {
    it('should create new wallet with encryption', async () => {
      // ...
    });
    
    it('should import from mnemonic', async () => {
      // ...
    });
    
    it('should decrypt and load wallet', async () => {
      // ...
    });
  });
  
  describe('Privy Wallet', () => {
    it('should initialize Privy client', async () => {
      // ...
    });
    
    it('should create embedded wallet', async () => {
      // ...
    });
    
    it('should sign transaction', async () => {
      // ...
    });
  });
});

// tests/launchpad.test.js
describe('LaunchPad Client', () => {
  it('should create token', async () => {
    // ...
  });
  
  it('should buy token', async () => {
    // ...
  });
  
  it('should sell token', async () => {
    // ...
  });
});

// tests/integration.test.js
describe('End-to-End', () => {
  it('should complete full trade flow', async () => {
    // Create wallet → Fund → Buy token → Sell token
  });
});
```

---

## 📦 Phase 7: Dependencies

### New Dependencies Needed

```json
{
  "dependencies": {
    "@privy-io/server-auth": "^1.x.x",
    "bip39": "^3.1.0",
    "ed25519-hd-key": "^1.3.0",
    "bs58": "^5.0.0",
    "inquirer": "^9.2.0",
    "chalk": "^5.3.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "@types/node": "^20.x.x"
  }
}
```

---

## 🚦 Implementation Roadmap

### Week 1: Core Infrastructure
- [ ] Day 1-2: wallet-manager.js + wallet-local.js (encryption)
- [ ] Day 3-4: wallet-privy.js integration
- [ ] Day 5: wallet-import.js (all formats)

### Week 2: UX & Testing
- [ ] Day 1-2: setup-wizard.js (interactive setup)
- [ ] Day 3: Enhanced SKILL.md + references/
- [ ] Day 4: Test suite (wallet tests)
- [ ] Day 5: Integration tests

### Week 3: Polish & Documentation
- [ ] Day 1-2: Security audit + encryption review
- [ ] Day 3: Complete all reference docs
- [ ] Day 4: Video tutorials / GIFs for setup
- [ ] Day 5: Package skill + final testing

---

## 🎯 Success Criteria

### Functional Requirements
- ✅ 4 wallet setup options work flawlessly
- ✅ Encrypted keypair storage for local wallets
- ✅ Privy integration fully functional
- ✅ Setup wizard completes in <5 minutes
- ✅ All existing features still work

### Quality Requirements
- ✅ 80%+ test coverage
- ✅ SKILL.md under 500 lines
- ✅ Comprehensive error handling
- ✅ Security audit passed
- ✅ Documentation complete

### User Experience
- ✅ First-time setup is intuitive
- ✅ Recovery process is clear
- ✅ Error messages are helpful
- ✅ No confusing prompts

---

## 🔒 Security Checklist

- [ ] AES-256-GCM encryption for local keypairs
- [ ] Secure password derivation (scrypt)
- [ ] Recovery phrase verification
- [ ] No plaintext secrets in logs
- [ ] Environment variables for sensitive data
- [ ] File permissions (0600 for keypairs)
- [ ] Privy MPC integration (no single point of failure)
- [ ] Input validation on all imports
- [ ] Rate limiting on API calls
- [ ] Audit dependencies for vulnerabilities

---

## 📚 Reference Docs to Create

1. **WALLET_SECURITY.md** - Security best practices, encryption details
2. **PRIVY_SETUP.md** - Complete Privy integration guide
3. **RECOVERY.md** - Wallet recovery procedures, troubleshooting
4. **TRADING_GUIDE.md** - Detailed trading instructions, slippage, etc.
5. **API_REFERENCE.md** - Complete API documentation

---

## 🎓 OpenClaw Best Practices Applied

✅ **Concise SKILL.md** - Target <500 lines
✅ **Progressive Disclosure** - references/ folder for detailed docs
✅ **Clear Description** - Comprehensive trigger keywords
✅ **Imperative Form** - All instructions use infinitive
✅ **Bundled Resources** - Scripts tested and organized
✅ **No Extraneous Files** - Only essential skill files

---

## 🚀 Next Steps

1. **Review this plan** with Chadizzle
2. **Prioritize phases** (can start with Phase 1-2 immediately)
3. **Set up Privy account** (get App ID and Secret)
4. **Begin implementation** (start with wallet-manager + encryption)

**Estimated Time:** 2-3 weeks for complete implementation
**Effort:** High-quality, production-ready skill

---

*This plan transforms LaunchPad trader into a best-in-class OpenClaw skill with enterprise-grade wallet management and rock-solid UX.* 🍆
