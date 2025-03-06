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

    // Add stress test scenario
    const stressTest = autocannon({
        url: 'http://localhost:3000/api/v1/mt103/validate',
        connections: 100,
        duration: 30,
        amount: 10000,
        requests: [
            {
                method: 'POST',
                path: '/api/v1/mt103/validate',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'Bearer test-token'
                },
                body: JSON.stringify({
                    messageId: 'STRESS123',
                    senderBIC: 'BOFAUS3NXXX',
                    amount: '1000,00',
                    currency: 'USD'
                })
            },
            {
                method: 'GET',
                path: '/api/v1/mt103/health'
            }
        ]
    });

    const stressResults = await promisify(autocannon.track)(stressTest, console.log);
    
    // Additional assertions
    expect(stressResults.latency.mean).toBeLessThan(100);
    expect(stressResults.requests.average).toBeGreaterThan(1000);
    expect(stressResults.throughput.average).toBeGreaterThan(1000000);
}

// Add parallel test execution
describe('Load Testing', () => {
    test('should handle high concurrent load', runLoadTest);
    
    test('should handle parallel message processing', async () => {
        const parallel = 5;
        const tests = Array(parallel).fill().map(runLoadTest);
        await Promise.all(tests);
    });
});
