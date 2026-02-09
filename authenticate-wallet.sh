#!/bin/bash
# Authenticate wallet with LaunchPad backend and get API key

set -euo pipefail

API_BASE="https://launchpad-backend-production-e95b.up.railway.app/v1"
WALLET_PATH="$HOME/.config/solana/launchpad-bot.json"
WALLET_ADDRESS=$(solana-keygen pubkey "$WALLET_PATH")

echo "🔐 Authenticating wallet: $WALLET_ADDRESS"
echo ""

# Step 1: Get nonce
echo "📝 Step 1/4: Requesting nonce..."
NONCE_RESPONSE=$(curl -s -X POST "$API_BASE/auth/nonce" \
  -H "Content-Type: application/json" \
  -d "{\"walletAddress\":\"$WALLET_ADDRESS\"}")

NONCE=$(echo "$NONCE_RESPONSE" | jq -r '.nonce')
MESSAGE=$(echo "$NONCE_RESPONSE" | jq -r '.message')

if [ "$NONCE" == "null" ]; then
  echo "❌ Failed to get nonce"
  echo "$NONCE_RESPONSE" | jq '.'
  exit 1
fi

echo "✅ Nonce received: $NONCE"
echo ""

# Step 2: Sign message
echo "✏️  Step 2/4: Signing message..."

# Sign with Node.js (compatible with backend nacl verification)
SIGNATURE=$(node /root/.openclaw/workspace/sign-message.js "$WALLET_PATH" "$MESSAGE")

if [ -z "$SIGNATURE" ]; then
  echo "❌ Failed to sign message"
  exit 1
fi

echo "✅ Message signed"
echo ""

# Step 3: Login
echo "🔑 Step 3/4: Logging in..."
LOGIN_PAYLOAD=$(jq -n \
  --arg wallet "$WALLET_ADDRESS" \
  --arg sig "$SIGNATURE" \
  --arg msg "$MESSAGE" \
  '{walletAddress: $wallet, signature: $sig, message: $msg, role: "agent"}')

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_PAYLOAD")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')

if [ "$ACCESS_TOKEN" == "null" ]; then
  echo "❌ Failed to login"
  echo "$LOGIN_RESPONSE" | jq '.'
  exit 1
fi

echo "✅ Login successful"
echo ""

# Step 4: Create API key
echo "🔐 Step 4/4: Creating API key..."
API_KEY_RESPONSE=$(curl -s -X POST "$API_BASE/auth/create-api-key" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"name\":\"LaunchPad Trader Skill\"}")

API_KEY=$(echo "$API_KEY_RESPONSE" | jq -r '.apiKey')

if [ "$API_KEY" == "null" ]; then
  echo "❌ Failed to create API key"
  echo "$API_KEY_RESPONSE" | jq '.'
  exit 1
fi

echo "✅ API key created"
echo ""
echo "========================================"
echo "🎉 Authentication Complete!"
echo "========================================"
echo ""
echo "API Key: $API_KEY"
echo ""
echo "Save this to your environment:"
echo "export LAUNCHPAD_API_KEY=\"$API_KEY\""
echo ""
echo "Or add to ~/.bashrc:"
echo "echo 'export LAUNCHPAD_API_KEY=\"$API_KEY\"' >> ~/.bashrc"
echo ""
