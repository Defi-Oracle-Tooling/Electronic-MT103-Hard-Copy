from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers import aead
import base64
import os

class MT103KeyManager:
    def __init__(self):
        self.key_directory = os.path.join(os.path.dirname(__file__), '../keys')
        os.makedirs(self.key_directory, exist_ok=True)
        self.key_file = os.path.join(self.key_directory, 'mt103.key')
        self.rotation_interval = 30  # days

    def generate_key(self):
        """Generate a new encryption key"""
        salt = os.urandom(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(Fernet.generate_key() + salt)
        self._store_key(key)
        return key

    def _store_key(self, key):
        """Store the encryption key securely"""
        with open(self.key_file, 'wb') as f:
            f.write(key)

    def get_current_key(self):
        """Retrieve the current encryption key"""
        if not os.path.exists(self.key_file):
            return self.generate_key()
        
        with open(self.key_file, 'rb') as f:
            return f.read()

    def rotate_key(self):
        """Rotate the encryption key"""
        old_key = self.get_current_key()
        new_key = self.generate_key()
        return {'old_key': old_key, 'new_key': new_key}

