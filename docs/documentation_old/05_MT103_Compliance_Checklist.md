# 05_MT103_Compliance_Checklist.md

## **MT103 Compliance Checklist**
Ensure all MT103 transactions comply with **international financial regulations** before submission.

### **1. General Compliance Requirements**
- [ ] Verify that the **MT103 structure follows SWIFT ISO 15022**.
- [ ] Ensure compliance with **FATF AML/CTF guidelines**.
- [ ] Perform **KYC & Enhanced Due Diligence (EDD)** on both sender and beneficiary.
- [ ] Check for **sanctioned individuals/entities (OFAC, EU, UN lists)**.
- [ ] Conduct **Wolfsberg Group AML checks for correspondent banking**.

### **2. Transaction Details Validation**
- [ ] Ensure **Transaction Reference Number (Field 20) is unique**.
- [ ] Confirm **Bank Operation Code (Field 23B) is set to "CRED"**.
- [ ] Validate **Sender & Beneficiary SWIFT codes (BIC format)**.
- [ ] Verify transaction amount and currency format (**Field 32A: YYYYMMDDCURAMOUNT**).

### **3. Documentation Requirements**
- [ ] **Proof of Funds (POF)** attached and validated.
- [ ] **Letter of Intent (LOI)** provided if required.
- [ ] **Regulatory clearance from Central Bank (if applicable)**.

### **4. Security & Encryption**
- [ ] SWIFT message transmitted via **TLS 1.3 or AES-256 encryption**.
- [ ] Digital signature verification (if required by the receiving bank).

### **5. Audit & Reporting**
- [ ] Maintain a **compliance audit log for at least 5 years**.
- [ ] File **Suspicious Activity Reports (SARs) for high-risk transactions**.
