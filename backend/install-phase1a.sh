#!/bin/bash

# Phase 1A Package Installation Script
# Run this from the backend directory

echo "📦 Installing Phase 1A dependencies..."

npm install express-rate-limit helmet express-validator winston

echo "✅ Dependencies installed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Verify .env file has all required variables"
echo "2. Test locally: npm run dev"
echo "3. Check logs directory: ls -la logs/"
echo "4. Test endpoints with rate limiting"
echo ""
echo "📖 See PHASE_1A_IMPLEMENTATION.md for complete documentation"
