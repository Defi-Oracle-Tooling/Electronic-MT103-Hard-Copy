const autocannon = require('autocannon');
const { promisify } = require('util');

async function runLoadTest() {
    const instance = autocannon({
        url: 'http://localhost:3000/api/v1/mt103/validate',
        connections: 10,
        pipelining: 1,
        duration: 10,
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
            messageId: 'TEST123',
            senderBIC: 'BOFAUS3NXXX',
            amount: '1000,00',
            currency: 'USD'
        })
    });

    const results = await promisify(autocannon.track)(instance, console.log);
    
    expect(results.latency.p99).toBeLessThan(200); // 99th percentile under 200ms
    expect(results.errors).toBe(0);
    expect(results.timeouts).toBe(0);
}

describe('Load Testing', () => {
    test('should handle high concurrent load', runLoadTest);
});
