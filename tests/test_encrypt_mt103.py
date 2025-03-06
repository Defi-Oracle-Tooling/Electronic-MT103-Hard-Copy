import pytest
from scripts.encrypt_mt103 import MT103Encryptor
import json

def test_encryption_decryption():
    encryptor = MT103Encryptor()
    test_data = {
        "messageType": "MT103",
        "sender": "TESTBANK",
        "amount": "1000.00"
    }
    
    encrypted = encryptor.encrypt_message(test_data)
    decrypted = encryptor.decrypt_message(encrypted)
    
    assert decrypted == test_data

def test_invalid_decryption():
    encryptor = MT103Encryptor()
    result = encryptor.decrypt_message(b"invalid_data")
    assert "error" in result
