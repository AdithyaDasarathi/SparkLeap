# PowerShell setup script for SparkLeap Backend Functions

Write-Host "🚀 Setting up SparkLeap Backend Functions..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm is installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Copy environment template if .env doesn't exist
if (!(Test-Path .env)) {
    Write-Host "📋 Copying environment template..." -ForegroundColor Yellow
    Copy-Item env.example .env
    Write-Host "⚠️  IMPORTANT: Please edit .env file and add your API keys!" -ForegroundColor Yellow
    Write-Host "   - Get OpenAI API key from: https://platform.openai.com/api-keys" -ForegroundColor Cyan
    Write-Host "   - Generate a secure ENCRYPTION_KEY (32+ characters)" -ForegroundColor Cyan
} else {
    Write-Host "ℹ️  .env file already exists, skipping template copy" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your API keys" -ForegroundColor White
Write-Host "2. Run: npm run dev" -ForegroundColor White
Write-Host "3. Open: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Need help? Check the README.md file for detailed instructions." -ForegroundColor Yellow 