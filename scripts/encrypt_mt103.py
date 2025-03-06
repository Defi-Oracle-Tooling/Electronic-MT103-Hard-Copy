from cryptography.fernet import Fernet
import base64
import json

class MT103Encryptor:
    def __init__(self):
        self.key = Fernet.generate_key()
        self.cipher_suite = Fernet(self.key)

    def encrypt_message(self, mt103_data):
        """
        Encrypts MT103 message data using Fernet (symmetric encryption)
        """
        if isinstance(mt103_data, dict):
            mt103_data = json.dumps(mt103_data)
        
        encrypted_data = self.cipher_suite.encrypt(mt103_data.encode())
        return base64.urlsafe_b64encode(encrypted_data)

    def decrypt_message(self, encrypted_data):
        """
        Decrypts MT103 message data
        """
        try:
            decrypted_data = self.cipher_suite.decrypt(base64.urlsafe_b64decode(encrypted_data))
            return json.loads(decrypted_data)
        except Exception as e:
            return {"error": f"Decryption failed: {str(e)}"}

if __name__ == "__main__":
    # Example usage
    encryptor = MT103Encryptor()
    test_data = {
        "messageType": "MT103",
        "sender": "BANKXXXX",
        "receiver": "BANKYYYY",
        "amount": "1000.00",
        "currency": "USD"
    }
    
    encrypted = encryptor.encrypt_message(test_data)
    print(f"Encrypted: {encrypted}")
    
    decrypted = encryptor.decrypt_message(encrypted)
    print(f"Decrypted: {decrypted}")
