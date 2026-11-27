# Contributing Guide — TLS SECURITY LAB V3.0

## 1. Development Setup
1. Clone or open the repository directory.
2. Serve the static files locally (e.g., `npx serve . -l 3000`) and open `http://localhost:3000/`.
3. No build step or `npm install` is required.

## 2. Branching Guidelines
- `main`: Stable production-ready static build.
- `feature/<short-name>`: New educational modules, labs, or challenges.
- `fix/<short-name>`: Bug fixes, accessibility, or security patches.

## 3. Code Standards
- Maintain the Burgundy Black (`#160810`) + Neon Pink (`#FF6685`) theme variables in `style.css`.
- Always use `window.crypto.subtle` and `window.crypto.getRandomValues` for cryptographic operations.
- Sanitize any user-supplied strings interpolated into `innerHTML` with `escapeHtml()`.
- Keep curriculum data in modular files (`academy-data.js`, `quiz-data.js`, `challenges-data.js`).

## 4. Pull Request & Bug Reporting
- Run `node -c` on all `.js` files before opening a PR.
- Include steps to reproduce, browser version, and console output when reporting bugs.
