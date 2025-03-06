// Configure Jest environment and global settings
jest.setTimeout(30000); // 30 second timeout

// Clear all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
