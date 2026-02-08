# 🔑 How to Export Private Key from Phantom

The key you provided isn't in the standard Solana format. Here are the correct ways to export from Phantom:

## Option 1: Export as Byte Array (Recommended)

1. Open Phantom wallet
2. Click Settings (⚙️)
3. Click on your wallet name
4. Click "Export Private Key"
5. Enter your password
6. You'll see a long string like: `[123,45,67,...]`

**Use this format in .env:**
```bash
PLATFORM_WALLET_KEYPAIR=[123,45,67,89,...]  # Paste the full array
```

## Option 2: Use Solana CLI to Convert

If you have the seed phrase (12 or 24 words):

```bash
# Install Solana CLI if needed
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Generate keypair from seed
solana-keygen recover 'prompt://?key=0/0' -o platform-wallet.json

# This creates a file with your keypair in [numbers] format
cat platform-wallet.json
```

Then add to .env:
```bash
PLATFORM_WALLET_KEYPAIR=$(cat platform-wallet.json)
```

## Option 3: Get Public Key Only (For Testing)

If you just want to verify the format:

1. Open Phantom
2. Copy your wallet address (public key)
3. Share that with me

I can help you figure out the right export method once I see the public key.

## Current Issue

The key you provided (`6LoJJz...6en7`) appears to be:
- Length: 88 characters
- Decoded: 65 bytes (should be 64 for Solana)
- Format: Not standard Solana base58 private key

**Most likely:** This is a different encoding format or contains extra metadata.

## Quick Test

What's your wallet's public address? (The one that starts with a random string of characters, shown in Phantom's main screen)

I can verify if the key is correct once I know the expected public key.
