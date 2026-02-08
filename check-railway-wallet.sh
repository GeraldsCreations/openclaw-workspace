#!/bin/bash

# Check which wallet the Railway backend is using

API_URL="https://launchpad-backend-production-e95b.up.railway.app"

echo "🔍 Checking Railway Platform Wallet"
echo "API: $API_URL"
echo ""

# Call health endpoint to see wallet info
response=$(curl -s "$API_URL/v1/dbc/health" 2>&1)

echo "$response" | jq '.' 2>/dev/null || echo "$response"

echo ""
echo "💡 Look for 'wallet' or 'publicKey' field above"
echo ""
