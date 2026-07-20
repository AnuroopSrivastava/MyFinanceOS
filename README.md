# MyFinanceOS 🚀

> **Premium Local-First Personal & Business Finance Suite for India**

Welcome to **MyFinanceOS**, a fully secure, offline-first financial dashboard built for tracking, managing, and optimizing personal and business wealth. Engineered specifically for the Indian financial ecosystem, MyFinanceOS prioritizes absolute data privacy and security by never sending your sensitive financial data to the cloud.

---

## 🔒 Security First: Your Data, Your Machine
We believe your financial data is yours alone. MyFinanceOS uses a **local-first** architecture:
*   **Zero Cloud Exposure:** Your data never leaves your machine. There are no cloud servers storing your ledgers.
*   **AES-256-GCM Encryption:** All sensitive tables and databases are encrypted on disk with military-grade encryption using your custom Security PIN.
*   **Centralized Local Storage:** Shared effortlessly between the Web and Desktop versions seamlessly right from your local file system (`~/.financeos`).

## ✨ Key Features
*   **💼 Business & Personal Modes:** Seamlessly switch between managing your personal wealth and your business cash flows.
*   **📈 Investment Planner:** Track your portfolio distribution, sub-category allocations, and get deep insights into your asset growth.
*   **💸 Ledger & Cash Flow:** Double-entry ledger systems for accurate income and expense tracking.
*   **📊 Sankey Charts:** Beautiful, interactive Sankey diagrams visualizing your cash flow from income sources down to exact expenditure categories.
*   **🏛️ Tax View:** India-specific tax tracking and estimations. 
*   **🤖 AI Chat Assistant:** Interact with an AI-powered financial assistant to query your data and get intelligent insights.

## 🛠️ Tech Stack
MyFinanceOS is structured as a modern Monorepo with isolated packages and robust applications:
*   **Frontend Web App:** React, Vite, TypeScript
*   **Desktop App:** Electron, Node.js
*   **Styling:** Modern, sleek glassmorphic UI elements
*   **Database / Auth:** Custom local-first offline encrypted database

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and `npm` installed.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AnuroopSrivastava/MyFinanceOS.git
   cd MyFinanceOS
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```

3. **Start the Development Servers:**
   To run both the Vite Web Server and the Electron Desktop app simultaneously:
   ```bash
   npm run dev
   ```

### Building for Production
To package the Desktop `.exe` for Windows:
```bash
npm run package
```
The compiled installer will be available in `apps/desktop/release`.

---
*Built with ❤️ for secure financial tracking.*
