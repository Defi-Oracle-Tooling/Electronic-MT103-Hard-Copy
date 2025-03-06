const request = require('supertest');
const app = require('../../src/app');

describe('Server E2E Tests', () => {
  test('GET / should return 200 OK', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
  });
});
