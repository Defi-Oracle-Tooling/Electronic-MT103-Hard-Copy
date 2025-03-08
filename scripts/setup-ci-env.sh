#!/bin/bash
# Setup script for CI environment

set -e  # Exit immediately if a command exits with non-zero status

echo "Setting up CI environment for MT103 project..."

# Install global development dependencies
npm install -g pnpm@latest
pnpm setup

# Install project dependencies
pnpm install

# Setup test databases and mock services
echo "Setting up test databases..."

# Set up test MongoDB database
if command -v mongod &> /dev/null; then
    echo "Setting up MongoDB test instance..."
    mkdir -p ./test-data/mongo
    mongod --dbpath ./test-data/mongo --fork --logpath ./test-data/mongo/mongodb.log --port 27018
    sleep 2
    mongo --port 27018 --eval "db.createUser({user: 'testuser', pwd: 'testpassword', roles: [{role: 'readWrite', db: 'mt103_test'}]})"
fi

# Set up test Redis instance
if command -v redis-server &> /dev/null; then
    echo "Setting up Redis test instance..."
    mkdir -p ./test-data/redis
    redis-server --port 6380 --daemonize yes --dir ./test-data/redis
fi

# Generate test certificates for SSL/TLS testing
echo "Generating test certificates..."
mkdir -p ./test-data/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./test-data/certs/test-key.pem \
  -out ./test-data/certs/test-cert.pem \
  -subj "/C=US/ST=Test/L=Test/O=Test/OU=Test/CN=localhost"

# Configure environment variables for testing
echo "Setting up test environment variables..."
cat > .env.test << EOF
NODE_ENV=test
PORT=3001
DB_HOST=localhost
DB_PORT=27018
DB_NAME=mt103_test
REDIS_HOST=localhost
REDIS_PORT=6380
JWT_SECRET=test-jwt-secret-key-for-ci-environment
ENCRYPTION_KEY=12345678901234567890123456789012
EOF

echo "Setting up mock SWIFT network..."
pnpm run setup-mock-swift

echo "✅ CI environment setup complete"
