# 🪙 Morry Token — ERC-20 Smart Contract

Implementation of an ERC-20 token using Solidity, Hardhat, and OpenZeppelin.
This project demonstrates best practices in smart contract development, including secure token design, testing, and deployment.

---

## 🚀 Overview

**MorryToken** is a fungible token built on the Ethereum following the ERC-20 standard.

The contract includes:

* Standard ERC-20 functionality
* Owner-controlled minting
* Token burning capability for users
* Automated tests using Hardhat

---
🧪 Experimental Tokenomics (Totally Serious Plan™)

This token has absolutely no intrinsic value, no utility, and no real-world purpose — and that’s exactly the point.

The plan is simple:

Launch the token 🚀
Artificially inflate the price using:
questionable news
overly optimistic narratives
aggressive (and slightly misleading) marketing
Wait until the hype reaches peak irrationality
Sell as much of the supply as possible at the top 📈
Burn whatever cannot be sold 🔥
---

## 🏗️ Architecture

* **ERC-20 Standard** via OpenZeppelin
* **Access Control** using Ownable
* **Development Framework**: Hardhat
* **Language**: Solidity
* **Testing**: Mocha + Chai + Ethers.js

---

## 🔐 Security Considerations

* Uses audited contracts from OpenZeppelin
* Minting restricted via `onlyOwner`
* No custom low-level logic (reduces attack surface)
* Solidity version locked to prevent unexpected behavior

---

## 📜 Smart Contract Features

### ✔️ ERC-20 Compliance

Implements standard token interface:

* `transfer`
* `approve`
* `transferFrom`
* `balanceOf`

### ➕ Minting

```solidity
function mint(address to, uint256 amount) public onlyOwner
```

* Only contract owner can mint new tokens

### 🔥 Burning

```solidity
function burn(uint256 amount) public
```

* Users can burn their own tokens
* Reduces total supply

---

## 🧪 Testing

Tests are implemented using Hardhat with TypeScript.

### Covered cases:

* Initial supply assignment
* Owner minting functionality

Run tests:

```bash
npx hardhat test
```

---

## ⚙️ Installation

```bash
git clone https://github.com/f3r4lonso/morry-token-smart-contract.git
cd morry-token-smart-contract

npm install
npx hardhat compile
```

---

## 🚀 Deployment

### Local network

```bash
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost
```

---

### Sepolia testnet

1. Create `.env` file:

```env
SEPOLIA_RPC_URL=YOUR_RPC_URL
SEPOLIA_PRIVATE_KEY=YOUR_PRIVATE_KEY
```

2. Deploy:

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

---

## 🌐 Deployment Info

> Update after deployment

* **Network**: Sepolia
* **Contract Address**: `0x...`
* **Etherscan**: https://sepolia.etherscan.io/address/0x...

---

## 💳 Using the Token

After deployment:

1. Copy contract address
2. Open MetaMask
3. Import custom token
4. Interact (transfer, burn, etc.)

---

## ⚠️ Limitations

* Token has no intrinsic value
* No liquidity pool or market price
* Not integrated with any DEX

---

## 🔮 Future Improvements

* Add ERC20Permit (gasless approvals)
* Implement upgradeable contracts (proxy pattern)
* Integrate with frontend (React + ethers.js)
* Deploy liquidity pool (e.g. Uniswap)

---

## 📚 Tech Stack

* Solidity ^0.8.28
* Hardhat
* TypeScript
* Ethers.js
* OpenZeppelin

---

## 👤 Author

Fernando Alonso
Software Engineer — Backend & Web3

---

## 📄 License

MIT License
