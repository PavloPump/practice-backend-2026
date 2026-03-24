#!/bin/sh
set -e

echo "Running database migrations..."
npm run migrate

echo "Seeding database..."
npm run seed || echo "Seeding skipped (data may already exist)"

echo "Starting server..."
npm start
