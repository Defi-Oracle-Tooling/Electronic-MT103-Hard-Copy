const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class KeyManager {
    constructor() {
        this.keyDirectory = path.join(__dirname, '../keys');
        this.keyFile = path.join(this.keyDirectory, 'mt103.key');
        this.rotationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        
        if (!fs.existsSync(this.keyDirectory)) {
            fs.mkdirSync(this.keyDirectory, { recursive: true });
        }
    }

    generateKey() {
        const salt = crypto.randomBytes(16);
        const key = crypto.randomBytes(32);
        const combined = Buffer.concat([key, salt]);
        this._storeKey(combined.toString('base64'));
        return combined.toString('base64');
    }

    _storeKey(key) {
        fs.writeFileSync(this.keyFile, key);
    }

    getCurrentKey() {
        if (!fs.existsSync(this.keyFile)) {
            return this.generateKey();
        }
        return fs.readFileSync(this.keyFile, 'utf8');
    }

    rotateKey() {
        const oldKey = this.getCurrentKey();
        const newKey = this.generateKey();
        return { oldKey, newKey };
    }
}

module.exports = new KeyManager();
