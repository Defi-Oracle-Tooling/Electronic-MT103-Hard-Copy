module.exports = {
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  collectCoverageFrom: [
    'scripts/**/*.js',
    '!scripts/**/*.test.js',
    'scripts/monitoring/**/*.js'
  ],
  setupFilesAfterEnv: ['./jest.setup.js'],
  testMatch: [
    '**/tests/**/*.js',
    '**/tests/monitoring/**/*.js',
    '**/tests/api/**/*.js'
  ]
};
