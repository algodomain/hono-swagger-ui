#!/bin/bash

# Build script for hono-swagger-ui
set -e

echo "🏗️  Building hono-swagger-ui..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/
rm -rf coverage/

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run linting
echo "🔍 Running linting..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm test

# Build TypeScript
echo "⚙️  Compiling TypeScript..."
npm run build

# Check if build was successful
if [ -d "dist" ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Output directory: dist/"
    echo "📦 Package ready for distribution"
else
    echo "❌ Build failed!"
    exit 1
fi 