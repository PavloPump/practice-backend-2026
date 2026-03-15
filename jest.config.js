module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/database/migrate.js',
    '!src/database/seed.js'
  ],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true
};
