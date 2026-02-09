#!/usr/bin/env node
// Convert base58 signature to base64

const bs58 = require('bs58').default || require('bs58');

const base58Sig = process.argv[2];
if (!base58Sig) {
  console.error('Usage: node convert-signature.js <base58_signature>');
  process.exit(1);
}

try {
  const bytes = bs58.decode(base58Sig);
  const base64Sig = Buffer.from(bytes).toString('base64');
  console.log(base64Sig);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
