# Installation & Setup Guide — TLS SECURITY LAB V3.0

## 1. Prerequisites
- Any modern web browser with Web Crypto API support (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari, or Brave).
- Optional for local HTTP serving & syntax checks: **Node.js** (v18+ recommended).
- Internet access is recommended for CDN libraries (`Chart.js`, `qrcode-generator`, `jsPDF`, Google Fonts), though core labs and offline QR fallback work without CDN access.

## 2. Dependency Installation
No `npm install`, Python `pip`, or database setup is required. All application files are self-contained static assets.

## 3. Environment Variables
No `.env` file or server secrets are required for the current static client-side architecture. A `.gitignore` file is included to ensure any future `.env` files are never committed.

## 4. Database & Backend Setup
Not applicable — this project runs 100% client-side using `localStorage` and the browser Web Crypto API.

## 5. Starting the Frontend Locally
### Option A: Node.js Static Server
```powershell
cd "d:\projects\cns working demo"
npx serve . -l 3000
```
Open **`http://localhost:3000/`** in your browser.

### Option B: VS Code Live Server
Open the project folder in VS Code, right-click `index.html`, and select **Open with Live Server**.

### Option C: Direct File Open
Double-click `index.html` to open it in your browser. *(Note: Serving over `http://localhost` is recommended so `localStorage` and CSP behave consistently across browsers.)*

## 6. Troubleshooting
- **Blank charts or PDF export falls back to Print**: Ensure internet connectivity so `cdn.jsdelivr.net` loads `Chart.js`, `qrcode-generator`, and `jsPDF`.
- **Progress resets between sessions**: Ensure your browser is not in Incognito/Private mode or clearing `localStorage` on exit.
- **Syntax check command**:
  ```powershell
  node -c script.js; node -c academy-data.js; node -c quiz-data.js; node -c challenges-data.js
  ```
