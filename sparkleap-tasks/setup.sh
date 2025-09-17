#!/bin/bash

echo "🚀 Setting up SparkLeap Backend Functions..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment template if .env doesn't exist
if [ ! -f .env ]; then
    echo "📋 Copying environment template..."
    cp env.example .env
    echo "⚠️  IMPORTANT: Please edit .env file and add your API keys!"
    echo "   - Get OpenAI API key from: https://platform.openai.com/api-keys"
    echo "   - Generate a secure ENCRYPTION_KEY (32+ characters)"
else
    echo "ℹ️  .env file already exists, skipping template copy"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo ""
echo "Need help? Check the README.md file for detailed instructions." 