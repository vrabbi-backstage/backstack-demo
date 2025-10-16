#!/bin/bash
set -e

echo "🚀 Setting up Backstack Demo environment..."

# Enable yarn in corepack (Node.js 20 comes with corepack)
echo "📦 Enabling yarn via corepack..."
corepack enable

# Navigate to backstage directory and install dependencies
echo "📦 Installing Backstage dependencies..."
cd backstage
yarn install

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Set up your environment variables (GITHUB_TOKEN, GITHUB_CLIENT_ID, etc.)"
echo "   2. Create a Kind cluster: kind create cluster --name backstack-demo"
echo "   3. Follow the instructions in README.md to deploy the stack"
echo "   4. Start Backstage: cd backstage && yarn start"
echo ""
