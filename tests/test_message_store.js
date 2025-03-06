const MessageStore = require('../scripts/message_store');
const crypto = require('crypto');

describe('MessageStore', () => {
    let messageStore;
    const testMessage = {
        messageId: 'TEST-123',
        content: 'Test message',
        submittedBy: 'user1'
    };

    beforeEach(() => {
        process.env.STORE_KEY = crypto.randomBytes(32).toString('hex');
        messageStore = new MessageStore();
    });

    test('should encrypt and store message', async () => {
        const messageId = await messageStore.create(testMessage);
        const storedMessage = messageStore.messages.get(messageId);
        
        expect(messageId).toBe(testMessage.messageId);
        expect(storedMessage.data.encrypted).toBeDefined();
        expect(storedMessage.data.iv).toBeDefined();
        expect(storedMessage.data.salt).toBeDefined();
    });

    test('should track metrics when storing message', async () => {
        await messageStore.create(testMessage);
        const stats = Array.from(messageStore.minuteStats.values())[0];
        
        expect(stats.count).toBe(1);
        expect(stats.avgProcessingTime).toBeGreaterThan(0);
    });
});
