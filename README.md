# Sample Hardhat 3 Beta Project (`mocha` and `ethers`)

This project showcases a Hardhat 3 Beta project using `mocha` for tests and the `ethers` library for Ethereum interactions.

To learn more about the Hardhat 3 Beta, please visit the [Getting Started guide](https://hardhat.org/docs/getting-started#getting-started-with-hardhat-3). To share your feedback, join our [Hardhat 3 Beta](https://hardhat.org/hardhat3-beta-telegram-group) Telegram group or [open an issue](https://github.com/NomicFoundation/hardhat/issues/new) in our GitHub issue tracker.

## Project Overview

This example project includes:

- A simple Hardhat configuration file.
- Foundry-compatible Solidity unit tests.
- TypeScript integration tests using `mocha` and ethers.js
- Examples demonstrating how to connect to different types of networks, including locally simulating OP mainnet.

## Usage

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```

You can also selectively run the Solidity or `mocha` tests:

```shell
npx hardhat test solidity
npx hardhat test mocha
```

### Make a deployment to Sepolia

This project includes an example Ignition module to deploy the contract. You can deploy this module to a locally simulated chain or to Sepolia.

To run the deployment to a local chain:

```shell
npx hardhat ignition deploy ignition/modules/Counter.ts
```

To run the deployment to Sepolia, you need an account with funds to send the transaction. The provided Hardhat configuration includes a Configuration Variable called `SEPOLIA_PRIVATE_KEY`, which you can use to set the private key of the account you want to use.

You can set the `SEPOLIA_PRIVATE_KEY` variable using the `hardhat-keystore` plugin or by setting it as an environment variable.

To set the `SEPOLIA_PRIVATE_KEY` config variable using `hardhat-keystore`:

```shell
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

After setting the variable, you can run the deployment with the Sepolia network:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```

🧱 Guía completa: Smart Contracts con Hardhat (Instalación limpia desde 0 en Windows)

Esta guía te lleva desde cero absoluto hasta un proyecto funcional con:

Hardhat (estable)
TypeScript
OpenZeppelin
Tests funcionando
Sin conflictos de dependencias ni errores comunes
🎯 Objetivo

Tener un proyecto listo para:

Desarrollar smart contracts
Ejecutar tests
Escalar a proyectos reales
Subir a GitHub como portfolio
🧰 1. Prerrequisitos
✅ Instalar Node.js

Descargar e instalar Node.js (LTS).

Verificar:

node -v
npm -v
📁 2. Crear proyecto
mkdir morry-token-smart-contract
cd morry-token-smart-contract

Abrir en VS Code:

code .
⚙️ 3. Inicializar proyecto Node
npm init -y
🧹 4. Instalación LIMPIA (evita conflictos)

⚠️ IMPORTANTE: no mezclar versiones ni instalar plugins manualmente.

✅ Instalar Hardhat (versión estable)
npm install --save-dev hardhat@2.22.0
✅ Instalar toolbox compatible
npm install --save-dev @nomicfoundation/hardhat-toolbox@^3.0.0

👉 Esto incluye:

ethers
mocha
chai
testing tools
✅ Instalar OpenZeppelin
npm install @openzeppelin/contracts
⚙️ 5. Inicializar Hardhat
npx hardhat

Seleccionar:

👉 TypeScript project (Mocha + Ethers)

Aceptar todo:

.gitignore → YES
Install dependencies → YES
🧹 6. Limpiar archivos demo

Eliminar:

contracts/Lock.sol
test/Lock.ts
scripts/deploy.ts
ignition/ (opcional)
📄 7. Configuración correcta
📄 hardhat.config.ts
import "@nomicfoundation/hardhat-toolbox";

module.exports = {
  solidity: "0.8.28",
};
⚙️ 8. Configuración TypeScript (CRÍTICO)
📄 tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "types": ["node", "mocha"],
    "outDir": "dist",
    "skipLibCheck": true,
    "ignoreDeprecations": "6.0"
  },
  "include": ["./contracts", "./scripts", "./test", "./typechain-types"],
  "files": ["./hardhat.config.ts"]
}
🧱 9. Crear contrato ERC-20
📄 contracts/MorryToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MorryToken is ERC20, Ownable {

    constructor(uint256 initialSupply)
        ERC20("Morry Token", "MORRY")
        Ownable(msg.sender)
    {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount * 10 ** decimals());
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount * 10 ** decimals());
    }
}
🧪 10. Crear tests
📄 test/MorryToken.ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MorryToken", function () {
  it("Should assign initial supply to owner", async function () {
    const [owner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MorryToken");
    const token = await Token.deploy(1000);

    const balance = await token.balanceOf(owner.address);

    expect(balance).to.equal(ethers.parseUnits("1000", 18));
  });

  it("Owner should be able to mint", async function () {
    const [owner, addr1] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MorryToken");
    const token = await Token.deploy(1000);

    await token.mint(addr1.address, 100);

    const balance = await token.balanceOf(addr1.address);

    expect(balance).to.equal(ethers.parseUnits("100", 18));
  });
});
🧪 11. Compilar
npx hardhat compile
🧪 12. Ejecutar tests
npx hardhat test
✅ Resultado esperado
MorryToken
  ✔ Should assign initial supply to owner
  ✔ Owner should be able to mint

2 passing
