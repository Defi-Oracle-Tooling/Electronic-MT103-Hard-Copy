# 08_Example_MT103_Transactions.md

# Example MT103 Transactions

### 1. Standard Cross-Border Payment

```swift
{1:F01BOFAUS3NXXXX0000000000}
{2:O1030919150715CITIUS33XXXX0000000000}
{4:
:20:TRX789012345
:23B:CRED
:32A:230919USD25000,00
:50K:/123456789
ACME CORPORATION
789 BUSINESS AVE, NY 10004
:59:/444555666
GLOBAL TRADERS LTD
LONDON EC2V 7HH, UK
:71A:SHA
}
```

### 2. Payment with Intermediary Bank

```swift
{1:F01BOFAUS3NXXXX0000000000}
// ...existing code...
:53A:/DEUTDEFFXXX
DEUTSCHE BANK AG
// ...existing code...
```

### 3. Multi-Currency Transaction Examples
[More examples with different currencies and scenarios]
