#!/bin/bash

# Development script for hono-swagger-ui
set -e

echo "🚀 Starting development environment..."

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Install example dependencies
if [ ! -d "example/node_modules" ]; then
    echo "📦 Installing example dependencies..."
    cd example
    npm install
    cd ..
fi

# Start development mode
echo "🔄 Starting development mode..."
echo "📝 Watching for changes in src/..."
echo "🧪 Tests will run automatically on changes"
echo "🌐 Example server will be available at http://localhost:3000"
echo "📚 Swagger UI will be available at http://localhost:3000/swagger-ui"
echo ""
echo "Press Ctrl+C to stop"

# Run TypeScript in watch mode
npm run dev 