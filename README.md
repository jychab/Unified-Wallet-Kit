# Unified Wallet Kit With Telegram Integration 

Forked from [Unified Wallet Kit](https://github.com/TeamRaccoons/Unified-Wallet-Kit)

Telegram mini apps currently lack support for Solana wallets. Existing solutions, such as using deep links to wallets like Phantom and Backpack, require users to first install these wallets and switch between apps to sign transactions.

This repository enhances the Unified Wallet Kit by integrating Solana wallet functionality directly into the Unified Wallet Adapter.

Key Features:

- Embedded Custodial Solana Wallet: Seamlessly integrated within the SDK.
- Transaction Simulation: Allows users to verify transactions before signing (Work In Progress).
- Wallet UI: Enables users to view and transfer assets within their in-app wallet.

Things to note:

Developers are responsible for managing their own database to securely store users' seed phrases and must implement API endpoints that the SDK will call when users request to sign a transaction. 
A sample implementation can be found [here](https://github.com/jychab/Unified-Wallet-Kit-Backend).

Demo:

https://github.com/user-attachments/assets/85268c88-bb45-4d6c-8de4-b9ac58b00ca7
