#!/bin/bash

# Setup script for PgBouncer with Terpa Web
# Supports both macOS (Homebrew) and Ubuntu/Debian

set -e

echo "🚀 Setting up PgBouncer for Terpa Web..."

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "📱 Detected macOS - using Homebrew"
    
    # Install PgBouncer via Homebrew
    if ! command -v pgbouncer &> /dev/null; then
        echo "⬇️  Installing PgBouncer via Homebrew..."
        brew install pgbouncer
    else
        echo "✅ PgBouncer already installed"
    fi
    
    CONFIG_DIR="/usr/local/etc"
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux (Ubuntu/Debian)
    echo "🐧 Detected Linux - using apt"
    
    # Update package list
    sudo apt update
    
    # Install PgBouncer
    if ! command -v pgbouncer &> /dev/null; then
        echo "⬇️  Installing PgBouncer via apt..."
        sudo apt install -y pgbouncer
    else
        echo "✅ PgBouncer already installed"
    fi
    
    CONFIG_DIR="/etc/pgbouncer"
    
else
    echo "❌ Unsupported OS: $OSTYPE"
    exit 1
fi

# Generate password hash for postgres user
echo "🔐 Generating password hash..."
POSTGRES_PASSWORD="postgres"
PASSWORD_HASH=$(echo -n "${POSTGRES_PASSWORD}postgres" | md5sum | cut -d' ' -f1)

# Create userlist.txt with proper hash
echo "\"postgres\" \"md5${PASSWORD_HASH}\"" > userlist.txt

echo "📝 Created userlist.txt with hashed password"

# Copy configuration files (you might need sudo for Linux)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "📋 To complete setup on Linux, run:"
    echo "sudo cp pgbouncer.ini ${CONFIG_DIR}/"
    echo "sudo cp userlist.txt ${CONFIG_DIR}/"
    echo "sudo systemctl enable pgbouncer"
    echo "sudo systemctl start pgbouncer"
else
    echo "📋 To complete setup on macOS, run:"
    echo "cp pgbouncer.ini ${CONFIG_DIR}/"
    echo "cp userlist.txt ${CONFIG_DIR}/"
    echo "brew services start pgbouncer"
fi

echo ""
echo "✅ PgBouncer setup complete!"
echo "🔗 PgBouncer will listen on localhost:6432"
echo "🔧 Update your DATABASE_URL to: postgresql://postgres:postgres@localhost:6432/terpa-web-local"
echo ""
echo "📊 Admin interface available at: postgresql://postgres:postgres@localhost:6432/pgbouncer"
echo "   Use: SHOW POOLS; SHOW STATS; SHOW CLIENTS; for monitoring"