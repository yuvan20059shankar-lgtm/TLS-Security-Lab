/**
 * TLS SECURITY LAB V3.0 - Static Server, Secure AI Backend & RBAC Admin/Faculty Portal
 * Zero external dependencies (Node.js built-ins only).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const tls = require('tls');

const BASE_DIR = __dirname;
const DATA_DIR = path.join(BASE_DIR, 'data');
const TMP_CAP_DIR = path.join(DATA_DIR, 'tmp-captures');
const DB_PATH = path.join(DATA_DIR, 'portal-db.json');

// Load local .env if present (never expose values to clients)
(function loadLocalEnv() {
  const envPath = path.join(BASE_DIR, '.env');
  if (!fs.existsSync(envPath)) return;
  try {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const k = trimmed.slice(0, eq).trim();
      const v = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
      if (k && !(k in process.env)) process.env[k] = v;
    }
  } catch { /* ignore */ }
})();

const PORT = Number(process.env.PORT) || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const ALLOWED_MODES = new Set([
  'advisor', 'tls_scan', 'phishing_url', 'certificate',
  'code_review', 'smart_recommendations', 'report_explainer'
]);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8'
};

// ============================================================================
// CRYPTOGRAPHIC AUTH & SESSION HELPERS (PBKDF2-SHA256 + HMAC-SHA256 COOKIES)
// ============================================================================
function hashPasswordSync(pwd, saltHex = null) {
  const salt = saltHex || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(String(pwd), Buffer.from(salt, 'hex'), 100000, 32, 'sha256').toString('hex');
  return `pbkdf2$${salt}$${hash}`;
}

function verifyPasswordSync(pwd, stored) {
  if (!stored || !stored.startsWith('pbkdf2$')) return false;
  const parts = stored.split('$');
  if (parts.length !== 3) return false;
  const candidate = hashPasswordSync(pwd, parts[1]);
  const a = Buffer.from(candidate);
  const b = Buffer.from(stored);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function signSessionToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (parsed.exp && Date.now() > parsed.exp) return null;
    return parsed;
  } catch { return null; }
}

function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie || '';
  raw.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > 0) {
      out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    }
  });
  return out;
}

// ============================================================================
// PORTAL JSON DATABASE (PERSISTENT STORAGE FOR STUDENTS, CONTENT & AUDIT LOGS)
// ============================================================================
function initPortalDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_PATH)) {
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { /* rebuild */ }
  }
  const initial = {
    users: [
      { id: 'usr_admin', name: 'Platform Administrator', email: 'admin@tlslab.edu', role: 'admin', active: true, passwordHash: hashPasswordSync('Admin@1234'), createdAt: '2026-01-10' },
      { id: 'usr_faculty', name: 'Prof. Security Faculty', email: 'faculty@tlslab.edu', role: 'faculty', active: true, passwordHash: hashPasswordSync('Faculty@1234'), createdAt: '2026-01-15' },
      { id: 'usr_stu_1', name: 'Student Demo', email: 'student@tlslab.edu', role: 'student', active: true, passwordHash: hashPasswordSync('Student@1234'), createdAt: '2026-02-01', course: 'B.Tech CSE', completedLessons: 0, completedLabs: 0, quizAvg: 0, quizAttempts: 0, lastActive: new Date().toISOString() }
    ],
    lessons: [
      { id: 'fac_les_1', moduleId: 'mod_tls', title: 'TLS 1.3 Key Schedule & HKDF', difficulty: 'Intermediate', duration: '12 min', summary: 'How TLS 1.3 derives early, handshake, and application traffic secrets using HKDF-Extract and HKDF-Expand.', published: true, author: 'faculty@tlslab.edu', updatedAt: '2026-11-27' }
    ],
    quizzes: [
      { id: 'fac_q_1', cat: 'TLS Fundamentals', diff: 'Medium', q: 'Which KDF is mandated by TLS 1.3 (RFC 8446) for session key derivation?', opts: ['PBKDF1', 'HKDF (RFC 5869)', 'scrypt', 'Bcrypt'], ans: 1, exp: 'TLS 1.3 uses HKDF-Extract and HKDF-Expand with the negotiated transcript hash.', author: 'faculty@tlslab.edu' }
    ],
    labs: [
      { id: 'fac_lab_1', title: 'Inspect TLS 1.3 Transcript Hash', category: 'Protocol Flow', difficulty: 'Intermediate', requirement: 'Complete Handshake Simulator Step 5 and verify SHA-256 transcript integrity.', instructions: '1. Open Handshake Simulator. 2. Switch to Detailed 8-Message mode. 3. Reach Step 5.', active: true, completions: 0 }
    ],
    classrooms: [],
    tlsMonitor: { connections: [], events: [], alerts: [] },
    activities: [],
    auditLogs: []
  };
  fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  return initial;
}

let portalDb = initPortalDb();
if (!Array.isArray(portalDb.classrooms)) portalDb.classrooms = [];
if (!portalDb.tlsMonitor) portalDb.tlsMonitor = { connections: [], events: [], alerts: [] };
function savePortalDb() {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(portalDb, null, 2)); } catch { /* ignore */ }
}

function recordAudit(actor, action, target) {
  portalDb.auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: actor ? actor.email : 'system',
    role: actor ? actor.role : 'system',
    action,
    target
  });
  if (portalDb.auditLogs.length > 100) portalDb.auditLogs.pop();
  savePortalDb();
}

// Sliding-window per-IP rate limiter (20 AI requests per 60s)
const rateBuckets = new Map();
const RATE_LIMIT_MAX = 20;
const RATE_WINDOW_MS = 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [ip, list] of rateBuckets.entries()) {
    const active = list.filter((ts) => now - ts < RATE_WINDOW_MS);
    if (active.length) rateBuckets.set(ip, active);
    else rateBuckets.delete(ip);
  }
}, 5 * 60 * 1000).unref();

function checkRateLimit(ip) {
  const now = Date.now();
  const list = (rateBuckets.get(ip) || []).filter((ts) => now - ts < RATE_WINDOW_MS);
  if (list.length >= RATE_LIMIT_MAX) {
    rateBuckets.set(ip, list);
    return { allowed: false, retryAfterSec: Math.ceil((RATE_WINDOW_MS - (now - list[0])) / 1000) };
  }
  list.push(now);
  rateBuckets.set(ip, list);
  return { allowed: true, remaining: RATE_LIMIT_MAX - list.length };
}

function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    ...extraHeaders
  });
  res.end(body);
}

function readJsonBody(req, maxBytes = 65536) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('INVALID_JSON'));
      }
    });
    req.on('error', reject);
  });
}

function getAuthenticatedUser(req) {
  const cookies = parseCookies(req);
  const sess = verifySessionToken(cookies.tls_portal_session);
  if (!sess) return null;
  const user = portalDb.users.find((u) => u.id === sess.uid && u.active);
  return user || null;
}

function requireRoles(req, res, allowedRoles) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    sendJson(res, 401, { error: 'Authentication required. Please sign in.' });
    return null;
  }
  if (!allowedRoles.includes(user.role)) {
    sendJson(res, 403, { error: `Forbidden: Role "${user.role}" lacks permission for this action.` });
    return null;
  }
  return user;
}

// ============================================================================
// AI EVIDENCE ANALYZER & PROVIDER
// ============================================================================
function runVerifiedEvidenceAnalyzer(mode, prompt, evidence) {
  const findings = [];
  if (mode === 'phishing_url') {
    const rawUrl = String(prompt || '').trim();
    try {
      const parsed = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
      const host = parsed.hostname.toLowerCase();
      if (!/^https:/i.test(rawUrl)) findings.push('Scheme is not explicitly HTTPS (plaintext HTTP risk).');
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) findings.push('IP-literal hostname detected instead of a registered domain.');
      if (host.includes('xn--')) findings.push('Punycode / IDN homograph prefix (xn--) detected.');
      if (rawUrl.includes('@')) findings.push('URL contains "@" userinfo symbol, which can obscure the real destination host.');
      if (host.split('.').length >= 4) findings.push(`Deep subdomain nesting (${host.split('.').length} labels) detected.`);
      if (/\.(tk|ml|ga|cf|gq|zip|mov|top|xyz)$/i.test(host)) findings.push('High-abuse or uncommon TLD detected.');
      if (/(login|verify|secure|account|update|bank|wallet|signin)/i.test(parsed.pathname + parsed.search + host)) {
        findings.push('Credential-lure keywords detected in hostname/path.');
      }
      if (!findings.length) findings.push('No obvious syntactic phishing indicators matched local rules.');
    } catch {
      findings.push('Input could not be parsed as a valid URL.');
    }
    findings.push('Guarantee Policy: Automated analysis can never guarantee that a URL is safe.');
  } else if (mode === 'code_review') {
    const code = String(prompt || '');
    if (/ECB/i.test(code)) findings.push('CRITICAL: AES-ECB mode detected (leaks plaintext patterns; lacks authentication).');
    if (/\bMD5\b|\bSHA-?1\b/i.test(code)) findings.push('HIGH: Deprecated weak hash (MD5 or SHA-1) detected; use SHA-256 or SHA-384.');
    if (/Math\.random\s*\(/i.test(code)) findings.push('HIGH: Non-cryptographic Math.random() detected; use crypto.getRandomValues().');
    if (/rejectUnauthorized\s*:\s*false/i.test(code)) findings.push('CRITICAL: TLS certificate verification disabled (rejectUnauthorized: false).');
    if (/SSLv3|TLSv1(\.0|\.1)?\b/i.test(code)) findings.push('HIGH: Legacy SSL/TLS protocol reference detected; enforce TLS 1.2+ / TLS 1.3.');
    if (/(key|secret|iv)\s*[:=]\s*['"][^'"]{4,}['"]/i.test(code)) findings.push('MEDIUM: Potential hardcoded cryptographic key, secret, or static IV literal detected.');
    if (!findings.length) findings.push('No static insecure regex patterns matched; review key lifecycle and IV uniqueness manually.');
  } else if (mode === 'tls_scan' && evidence && typeof evidence === 'object') {
    if (evidence.securityScore !== undefined) findings.push(`Measured TLS Security Score: ${evidence.securityScore}/100.`);
    if (evidence.handshakeCompleted !== undefined) findings.push(`TLS 1.3 Handshake Completed: ${Boolean(evidence.handshakeCompleted)}.`);
    if (Array.isArray(evidence.connections) && evidence.connections.length) {
      findings.push(`Active/Recent Connections Observed: ${evidence.connections.length}.`);
    } else {
      findings.push('No live test connections recorded yet in current session.');
    }
  } else if (mode === 'certificate' && evidence && typeof evidence === 'object') {
    const counts = evidence.certCounts || {};
    findings.push(`Session Certificate Tests — Valid: ${counts.valid || 0}, Expired: ${counts.expired || 0}, Self-Signed: ${counts.selfSigned || 0}, Warnings: ${counts.warnings || 0}.`);
  } else if (mode === 'smart_recommendations' && evidence && typeof evidence === 'object') {
    findings.push(`Lessons Completed: ${evidence.completedLessons || 0}/${evidence.totalLessons || 35}.`);
    findings.push(`Quiz Average: ${evidence.quizAvg || 0}% across ${evidence.quizAttempts || 0} attempt(s).`);
    findings.push(`Practical Labs Completed: ${evidence.uniqueLabs || 0}/5.`);
  } else if (mode === 'report_explainer' && evidence && typeof evidence === 'object') {
    findings.push(`Report Snapshot — Overall: ${evidence.overallPct || 0}%, Quizzes: ${evidence.quizAvg || 0}%, Labs: ${evidence.uniqueLabs || 0}/5, Challenges: ${evidence.solvedChallenges || 0}.`);
  }
  return findings;
}

function buildFallbackExplanation(mode, level, prompt, verifiedFindings, language = 'en', bilingual = false) {
  const tone = level === 'advanced' ? 'Technical / RFC-level guidance' : 'Beginner-friendly explanation';
  const langNames = { en: 'English', hi: 'Hindi (हिन्दी)', kn: 'Kannada (ಕನ್ನಡ)', ta: 'Tamil (தமிழ்)', te: 'Telugu (తెలుగు)', ml: 'Malayalam (മലയാളം)' };
  const langLabel = langNames[language] || 'English';
  const lines = [
    `[${tone} | Language: ${langLabel}${bilingual ? ' + Bilingual' : ''} — Offline Rule Engine]`,
    '',
    'Summary based on verified session evidence:',
    ...verifiedFindings.map((f) => `- ${f}`),
    ''
  ];
  if (mode === 'advisor') {
    lines.push('Guidance: Use TLS 1.3 (RFC 8446) with ECDHE P-256/X25519 for Forward Secrecy, AES-256-GCM or ChaCha20-Poly1305 for AEAD encryption, and strict X.509 SAN + CA chain validation.');
  } else if (mode === 'phishing_url') {
    lines.push('Always verify the exact domain in the browser address bar, check TLS certificate subject/SAN, and never rely solely on automated URL heuristics.');
  } else if (mode === 'code_review') {
    lines.push('Recommended safer pattern: Use Web Crypto AES-GCM with a fresh 96-bit CSPRNG IV per message, SHA-256/384 for hashing, and PBKDF2/Argon2 for passwords.');
  } else if (mode === 'smart_recommendations') {
    lines.push('Next Step: Focus on uncompleted Learning Academy modules, run any pending Practical Crypto Labs (AES, RSA, ECDHE, SHA-256), and attempt Intermediate/Hard quizzes.');
  }
  if (prompt && mode === 'advisor') lines.push(`Topic queried: "${String(prompt).slice(0, 120)}"`);
  return lines.join('\n');
}

async function callBackendAiProvider(mode, level, prompt, verifiedFindings, history, language = 'en', bilingual = false) {
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const openaiKey = process.env.OPENAI_API_KEY || '';
  if (!geminiKey && !openaiKey) return null;

  const langMap = { en: 'English', hi: 'Hindi', kn: 'Kannada', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam' };
  const targetLang = langMap[language] || 'English';
  const sysPrompt = [
    'You are the AI Cybersecurity Advisor for TLS SECURITY LAB V3.0 (B.Tech CSE educational platform).',
    `Target audience level: ${level === 'advanced' ? 'Advanced (include RFC/protocol details)' : 'Beginner (clear, approachable explanations)'}.`,
    `Response Language: ${bilingual && language !== 'en' ? `Bilingual (English + ${targetLang} side-by-side)` : targetLang}.`,
    'Preserve technical identifiers (TLS 1.3, AES-GCM, RSA, ECDHE, SHA-256, X.509) in English.',
    `Active module mode: ${mode}.`,
    'Rules: Base analysis strictly on the provided verified findings. Never fabricate scan results. Never guarantee a URL is safe. Never output executable exploit payloads or ask for passwords/private keys.'
  ].join(' ');

  const safeHistory = Array.isArray(history)
    ? history.slice(-6).map((m) => `${m.role === 'user' ? 'Student' : 'Advisor'}: ${String(m.text || '').slice(0, 400)}`).join('\n')
    : '';

  const userContent = [
    `Verified Findings:\n${verifiedFindings.map((f) => `- ${f}`).join('\n') || '- None provided'}`,
    safeHistory ? `Recent Conversation:\n${safeHistory}` : '',
    `Student Request:\n${prompt}`
  ].filter(Boolean).join('\n\n');

  if (geminiKey) {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiKey)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sysPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userContent }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 700 }
      })
    });
    if (!resp.ok) throw new Error(`GEMINI_HTTP_${resp.status}`);
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('GEMINI_EMPTY_RESPONSE');
    return { provider: 'gemini', model, text };
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 700,
      messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: userContent }]
    })
  });
  if (!resp.ok) throw new Error(`OPENAI_HTTP_${resp.status}`);
  const data = await resp.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('OPENAI_EMPTY_RESPONSE');
  return { provider: 'openai', model, text };
}

// ============================================================================
// REAL-TIME TLS MONITORING HELPERS (Node.js tls.connect + SSE)
// ============================================================================
const sseClients = new Set();

function broadcastTlsSse(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try { client.write(payload); } catch { sseClients.delete(client); }
  }
}

function isAllowedProbeHost(host) {
  if (!host || host.length > 253) return false;
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|::1|fe80:)/i.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(host);
}

function buildTlsMonitorSnapshot() {
  const tm = portalDb.tlsMonitor || { connections: [], events: [], alerts: [] };
  const conns = tm.connections || [];
  const durations = conns.filter((c) => typeof c.handshakeMs === 'number').map((c) => c.handshakeMs);
  const okCount = conns.filter((c) => c.status === 'Connected').length;
  const failCount = conns.length - okCount;
  const tls13 = conns.filter((c) => c.protocol === 'TLSv1.3').length;
  const tls12 = conns.filter((c) => c.protocol === 'TLSv1.2').length;
  const unsupported = conns.filter((c) => c.protocol && c.protocol !== 'TLSv1.3' && c.protocol !== 'TLSv1.2').length;

  return {
    connections: conns.slice(0, 30),
    events: (tm.events || []).slice(0, 60),
    alerts: (tm.alerts || []).slice(0, 30),
    metrics: {
      total: conns.length,
      successRate: conns.length ? Math.round((okCount / conns.length) * 100) : 0,
      failRate: conns.length ? Math.round((failCount / conns.length) * 100) : 0,
      avgMs: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
      minMs: durations.length ? Math.min(...durations) : 0,
      maxMs: durations.length ? Math.max(...durations) : 0,
      tls13, tls12, unsupported
    }
  };
}

function pushMonitorEvent(ev) {
  portalDb.tlsMonitor.events.unshift(ev);
  if (portalDb.tlsMonitor.events.length > 100) portalDb.tlsMonitor.events.pop();
  broadcastTlsSse('tls_event', ev);
}

function pushMonitorAlert(al) {
  portalDb.tlsMonitor.alerts.unshift(al);
  if (portalDb.tlsMonitor.alerts.length > 50) portalDb.tlsMonitor.alerts.pop();
  broadcastTlsSse('tls_alert', al);
}

function runLiveTlsProbe({ host, port, versionPref }) {
  return new Promise((resolve) => {
    const startNs = process.hrtime.bigint();
    const ts = new Date().toISOString();
    const opts = { host, port, servername: host, rejectUnauthorized: false, timeout: 6000 };
    if (versionPref === 'TLSv1.3') { opts.minVersion = 'TLSv1.3'; opts.maxVersion = 'TLSv1.3'; }
    else if (versionPref === 'TLSv1.2') { opts.minVersion = 'TLSv1.2'; opts.maxVersion = 'TLSv1.2'; }

    pushMonitorEvent({ id: `ev_${Date.now()}_ch`, stage: 'ClientHello', host, detail: `Initiated TLS probe (${versionPref}) to ${host}:${port}`, status: 'info', ts });

    let settled = false;
    const sock = tls.connect(opts, () => {
      if (settled) return;
      settled = true;
      const handshakeMs = Math.max(1, Number((process.hrtime.bigint() - startNs) / 1000000n));
      const protocol = sock.getProtocol() || 'Unknown';
      const cipherObj = sock.getCipher() || {};
      const cipher = cipherObj.standardName || cipherObj.name || 'Unknown';
      const cert = sock.getPeerCertificate(false) || {};
      const authorized = Boolean(sock.authorized);
      const authError = sock.authorizationError || '';
      const subjectCn = (cert.subject && (cert.subject.CN || cert.subject.O)) || host;
      const issuerCn = (cert.issuer && (cert.issuer.CN || cert.issuer.O)) || 'Unknown CA';
      const validTo = cert.valid_to || '';
      const validFrom = cert.valid_from || '';
      const isExpired = validTo ? new Date(validTo).getTime() < Date.now() : false;
      const isWeakCipher = /(RC4|DES|3DES|MD5|NULL|EXPORT)/i.test(cipher);
      const isLegacyTls = protocol !== 'TLSv1.3' && protocol !== 'TLSv1.2';

      pushMonitorEvent({ id: `ev_${Date.now()}_sh`, stage: 'ServerHello', host, detail: `Negotiated ${protocol} / ${cipher}`, status: 'ok', ts: new Date().toISOString() });
      pushMonitorEvent({ id: `ev_${Date.now()}_ct`, stage: 'Certificate', host, detail: `Subject: ${subjectCn} | Issuer: ${issuerCn} | Auth: ${authorized ? 'Valid' : authError || 'Failed'}`, status: authorized ? 'ok' : 'warn', ts: new Date().toISOString() });
      pushMonitorEvent({ id: `ev_${Date.now()}_kx`, stage: 'KeyExchange & Finished', host, detail: `Handshake completed in ${handshakeMs} ms`, status: authorized ? 'ok' : 'warn', ts: new Date().toISOString() });

      const connRec = {
        id: `conn_${Date.now()}`,
        host, port, protocol, cipher, handshakeMs,
        status: authorized && !isExpired ? 'Connected' : 'Warning / Untrusted',
        establishedAt: new Date().toISOString(),
        cert: {
          subject: subjectCn,
          issuer: issuerCn,
          validFrom, validTo,
          bits: cert.bits || 0,
          fingerprint256: cert.fingerprint256 || '',
          authorized, authError, isExpired
        },
        isWeakCipher,
        source: 'live_backend_tls'
      };
      portalDb.tlsMonitor.connections.unshift(connRec);
      if (portalDb.tlsMonitor.connections.length > 50) portalDb.tlsMonitor.connections.pop();

      if (!authorized || isExpired) {
        pushMonitorAlert({
          id: `al_${Date.now()}_cert`,
          severity: 'HIGH',
          host,
          ts: new Date().toISOString(),
          title: isExpired ? 'Expired X.509 Certificate Detected' : `Certificate Verification Failed (${authError || 'UNTRUSTED'})`,
          explanation: `Target ${host} failed chain/hostname/validity verification.`,
          remediation: 'Renew certificate with a trusted CA and verify Subject Alternative Name (SAN) matches the hostname.'
        });
      }
      if (isWeakCipher || isLegacyTls) {
        pushMonitorAlert({
          id: `al_${Date.now()}_cfg`,
          severity: 'MEDIUM',
          host,
          ts: new Date().toISOString(),
          title: isLegacyTls ? `Legacy/Unsupported Protocol (${protocol})` : `Weak Cipher Negotiated (${cipher})`,
          explanation: 'Weak or legacy cryptographic parameters degrade confidentiality and Forward Secrecy.',
          remediation: 'Enforce TLS 1.3 (or TLS 1.2 with ECDHE + AES-GCM / ChaCha20-Poly1305).'
        });
      }

      savePortalDb();
      broadcastTlsSse('tls_connection', connRec);
      sock.end();
      resolve(connRec);
    });

    sock.on('timeout', () => {
      if (settled) return;
      settled = true;
      sock.destroy();
      const rec = { id: `conn_${Date.now()}`, host, port, protocol: 'Failed', cipher: 'None', handshakeMs: 6000, status: 'Failed (Timeout)', establishedAt: new Date().toISOString(), cert: { authorized: false }, source: 'live_backend_tls' };
      portalDb.tlsMonitor.connections.unshift(rec);
      pushMonitorEvent({ id: `ev_${Date.now()}_err`, stage: 'Alert / Failure', host, detail: 'TLS handshake timed out', status: 'err', ts: new Date().toISOString() });
      pushMonitorAlert({ id: `al_${Date.now()}_to`, severity: 'HIGH', host, ts: new Date().toISOString(), title: 'TLS Handshake Timeout', explanation: `Connection to ${host}:${port} timed out.`, remediation: 'Verify firewall, DNS, and port 443 reachability.' });
      savePortalDb();
      broadcastTlsSse('tls_connection', rec);
      resolve(rec);
    });

    sock.on('error', (err) => {
      if (settled) return;
      settled = true;
      const handshakeMs = Math.max(1, Number((process.hrtime.bigint() - startNs) / 1000000n));
      const rec = { id: `conn_${Date.now()}`, host, port, protocol: 'Failed', cipher: 'None', handshakeMs, status: `Failed (${err.code || 'ERR'})`, establishedAt: new Date().toISOString(), cert: { authorized: false, authError: err.message }, source: 'live_backend_tls' };
      portalDb.tlsMonitor.connections.unshift(rec);
      pushMonitorEvent({ id: `ev_${Date.now()}_err`, stage: 'Alert / Failure', host, detail: err.message, status: 'err', ts: new Date().toISOString() });
      pushMonitorAlert({ id: `al_${Date.now()}_err`, severity: 'HIGH', host, ts: new Date().toISOString(), title: `TLS Handshake Failed (${err.code || 'ERROR'})`, explanation: err.message, remediation: 'Check TLS version compatibility, SNI hostname, and network connectivity.' });
      savePortalDb();
      broadcastTlsSse('tls_connection', rec);
      resolve(rec);
    });
  });
}

// ============================================================================
// BINARY PCAP / PCAPNG PARSER & ISOLATED TEMP CAPTURE HANDLER
// ============================================================================
function sweepStaleTempCaptures() {
  if (!fs.existsSync(TMP_CAP_DIR)) return;
  try {
    const now = Date.now();
    for (const f of fs.readdirSync(TMP_CAP_DIR)) {
      const fp = path.join(TMP_CAP_DIR, f);
      const st = fs.statSync(fp);
      if (now - st.mtimeMs > 5 * 60 * 1000) fs.unlinkSync(fp);
    }
  } catch { /* ignore */ }
}

function formatIpv4(buf, off) {
  return `${buf[off]}.${buf[off + 1]}.${buf[off + 2]}.${buf[off + 3]}`;
}

function formatIpv6(buf, off) {
  const parts = [];
  for (let i = 0; i < 16; i += 2) parts.push(buf.readUInt16BE(off + i).toString(16));
  return parts.join(':');
}

function parseTlsRecordSummary(payload) {
  if (!payload || payload.length < 5) return null;
  const contentType = payload[0];
  const verMajor = payload[1];
  const verMinor = payload[2];
  if (verMajor !== 0x03 || verMinor > 0x04) return null;
  const verLabel = verMinor === 0x04 ? 'TLS 1.3' : verMinor === 0x03 ? 'TLS 1.2' : verMinor === 0x01 ? 'TLS 1.0' : `TLS (3.${verMinor})`;
  const recTypes = { 20: 'ChangeCipherSpec', 21: 'Alert', 22: 'Handshake', 23: 'ApplicationData' };
  const recordType = recTypes[contentType];
  if (!recordType) return null;
  let handshakeType = '';
  let encryptedPayload = contentType === 23;
  if (contentType === 22 && payload.length >= 6) {
    const hsMap = { 1: 'ClientHello', 2: 'ServerHello', 11: 'Certificate', 12: 'ServerKeyExchange', 16: 'ClientKeyExchange', 20: 'Finished' };
    handshakeType = hsMap[payload[5]] || `Handshake(${payload[5]})`;
  }
  return { recordType, version: verLabel, handshakeType, encryptedPayload };
}

function decodeEthernetFrame(frameBuf, idx, tsSec) {
  const rec = {
    no: idx,
    timestamp: new Date(tsSec * 1000).toISOString(),
    tsSec,
    length: frameBuf.length,
    linkProto: 'Ethernet',
    networkProto: 'Other',
    transportProto: 'None',
    appProto: '',
    srcIp: '—',
    dstIp: '—',
    srcPort: null,
    dstPort: null,
    tcpFlags: '',
    tls: null
  };
  if (frameBuf.length < 14) return rec;
  const etherType = frameBuf.readUInt16BE(12);
  let off = 14;
  let ipProto = 0;

  if (etherType === 0x0800 && frameBuf.length >= off + 20) {
    rec.networkProto = 'IPv4';
    const ihl = (frameBuf[off] & 0x0f) * 4;
    ipProto = frameBuf[off + 9];
    rec.srcIp = formatIpv4(frameBuf, off + 12);
    rec.dstIp = formatIpv4(frameBuf, off + 16);
    off += ihl;
  } else if (etherType === 0x86dd && frameBuf.length >= off + 40) {
    rec.networkProto = 'IPv6';
    ipProto = frameBuf[off + 6];
    rec.srcIp = formatIpv6(frameBuf, off + 8);
    rec.dstIp = formatIpv6(frameBuf, off + 24);
    off += 40;
  } else if (etherType === 0x0806) {
    rec.networkProto = 'ARP';
    return rec;
  } else {
    return rec;
  }

  if (ipProto === 1) {
    rec.transportProto = 'ICMP';
    rec.appProto = 'ICMP';
  } else if (ipProto === 6 && frameBuf.length >= off + 20) {
    rec.transportProto = 'TCP';
    rec.srcPort = frameBuf.readUInt16BE(off);
    rec.dstPort = frameBuf.readUInt16BE(off + 2);
    const tcpHdrLen = ((frameBuf[off + 12] >> 4) & 0x0f) * 4;
    const f = frameBuf[off + 13];
    const flags = [];
    if (f & 0x02) flags.push('SYN');
    if (f & 0x10) flags.push('ACK');
    if (f & 0x01) flags.push('FIN');
    if (f & 0x04) flags.push('RST');
    if (f & 0x08) flags.push('PSH');
    rec.tcpFlags = flags.join(',');
    const payload = frameBuf.subarray(off + tcpHdrLen);
    const tlsInfo = parseTlsRecordSummary(payload);
    if (tlsInfo) {
      rec.appProto = 'TLS';
      rec.tls = tlsInfo;
    } else if (rec.srcPort === 443 || rec.dstPort === 443) {
      rec.appProto = 'TLS';
    } else if (rec.srcPort === 80 || rec.dstPort === 80 || /^(GET|POST|HEAD|HTTP\/)/i.test(payload.subarray(0, 8).toString('ascii'))) {
      rec.appProto = 'HTTP';
    } else {
      rec.appProto = 'TCP';
    }
  } else if (ipProto === 17 && frameBuf.length >= off + 8) {
    rec.transportProto = 'UDP';
    rec.srcPort = frameBuf.readUInt16BE(off);
    rec.dstPort = frameBuf.readUInt16BE(off + 2);
    rec.appProto = (rec.srcPort === 53 || rec.dstPort === 53) ? 'DNS' : 'UDP';
  }
  return rec;
}

function parseCaptureBuffer(buf) {
  if (!buf || buf.length < 24) throw new Error('File too small to be a valid PCAP or PCAPNG capture.');
  const magicBE = buf.readUInt32BE(0);
  const magicLE = buf.readUInt32LE(0);
  const packets = [];
  let format = '';

  if (magicLE === 0xa1b2c3d4 || magicLE === 0xa1b23c4d || magicBE === 0xa1b2c3d4 || magicBE === 0xa1b23c4d) {
    format = 'PCAP';
    const le = magicLE === 0xa1b2c3d4 || magicLE === 0xa1b23c4d;
    const nano = magicLE === 0xa1b23c4d || magicBE === 0xa1b23c4d;
    let off = 24;
    let idx = 1;
    while (off + 16 <= buf.length && packets.length < 2000) {
      const tsSec = le ? buf.readUInt32LE(off) : buf.readUInt32BE(off);
      const tsSub = le ? buf.readUInt32LE(off + 4) : buf.readUInt32BE(off + 4);
      const inclLen = le ? buf.readUInt32LE(off + 8) : buf.readUInt32BE(off + 8);
      off += 16;
      if (inclLen === 0 || off + inclLen > buf.length) break;
      const frame = buf.subarray(off, off + inclLen);
      const tsFull = tsSec + tsSub / (nano ? 1e9 : 1e6);
      packets.push(decodeEthernetFrame(frame, idx++, tsFull));
      off += inclLen;
    }
  } else if (magicLE === 0x0a0d0d0a) {
    format = 'PCAPNG';
    let off = 0;
    let idx = 1;
    while (off + 12 <= buf.length && packets.length < 2000) {
      const blockType = buf.readUInt32LE(off);
      const blockLen = buf.readUInt32LE(off + 4);
      if (blockLen < 12 || off + blockLen > buf.length) break;
      if (blockType === 0x00000006 && blockLen >= 32) {
        const tsHigh = buf.readUInt32LE(off + 12);
        const tsLow = buf.readUInt32LE(off + 16);
        const capLen = buf.readUInt32LE(off + 20);
        if (28 + capLen <= blockLen) {
          const frame = buf.subarray(off + 28, off + 28 + capLen);
          const tsFull = ((tsHigh * 4294967296) + tsLow) / 1e6;
          packets.push(decodeEthernetFrame(frame, idx++, tsFull));
        }
      }
      off += blockLen;
    }
  } else {
    throw new Error('Unsupported file signature. Upload a valid .pcap or .pcapng capture.');
  }

  if (!packets.length) throw new Error('No decodable packets found in capture.');

  const protoCounts = {};
  const ipCounts = {};
  const pairCounts = {};
  const portCounts = {};
  const tlsRecords = [];
  packets.forEach((p) => {
    const k = p.appProto || p.transportProto || p.networkProto;
    protoCounts[k] = (protoCounts[k] || 0) + 1;
    if (p.srcIp !== '—') ipCounts[p.srcIp] = (ipCounts[p.srcIp] || 0) + 1;
    if (p.dstIp !== '—') ipCounts[p.dstIp] = (ipCounts[p.dstIp] || 0) + 1;
    if (p.srcIp !== '—' && p.dstIp !== '—') {
      const pair = `${p.srcIp} -> ${p.dstIp}`;
      pairCounts[pair] = (pairCounts[pair] || 0) + 1;
    }
    if (p.dstPort) portCounts[p.dstPort] = (portCounts[p.dstPort] || 0) + 1;
    if (p.tls) tlsRecords.push({ no: p.no, src: p.srcIp, dst: p.dstIp, ...p.tls });
  });

  const minTs = Math.min(...packets.map((p) => p.tsSec));
  const maxTs = Math.max(...packets.map((p) => p.tsSec));
  return {
    format,
    packetCount: packets.length,
    durationSec: Number((maxTs - minTs).toFixed(3)),
    captureStart: new Date(minTs * 1000).toISOString(),
    protoCounts,
    ipCounts,
    pairCounts,
    portCounts,
    tlsRecords,
    packets
  };
}

function buildSamplePcapBuffer() {
  const frames = [];
  const makeEthIpv4Tcp = (srcIp, dstIp, sp, dp, flags, payload) => {
    const ipLen = 20 + 20 + payload.length;
    const b = Buffer.alloc(14 + ipLen);
    b.writeUInt16BE(0x0800, 12); // EtherType IPv4
    b[14] = 0x45;
    b.writeUInt16BE(ipLen, 16);
    b[23] = 6; // TCP
    srcIp.forEach((v, i) => { b[26 + i] = v; });
    dstIp.forEach((v, i) => { b[30 + i] = v; });
    b.writeUInt16BE(sp, 34);
    b.writeUInt16BE(dp, 36);
    b[46] = 0x50; // 20-byte TCP hdr
    b[47] = flags;
    payload.copy(b, 54);
    return b;
  };
  const makeEthIpv4Udp = (srcIp, dstIp, sp, dp, payload) => {
    const ipLen = 20 + 8 + payload.length;
    const b = Buffer.alloc(14 + ipLen);
    b.writeUInt16BE(0x0800, 12);
    b[14] = 0x45;
    b.writeUInt16BE(ipLen, 16);
    b[23] = 17; // UDP
    srcIp.forEach((v, i) => { b[26 + i] = v; });
    dstIp.forEach((v, i) => { b[30 + i] = v; });
    b.writeUInt16BE(sp, 34);
    b.writeUInt16BE(dp, 36);
    b.writeUInt16BE(8 + payload.length, 38);
    payload.copy(b, 42);
    return b;
  };

  const cli = [192, 168, 1, 10];
  const srv = [93, 184, 216, 34];
  const dns = [8, 8, 8, 8];
  frames.push(makeEthIpv4Udp(cli, dns, 51234, 53, Buffer.from('DNS_QUERY_EXAMPLE_COM')));
  frames.push(makeEthIpv4Tcp(cli, srv, 52001, 443, 0x02, Buffer.alloc(0))); // SYN
  frames.push(makeEthIpv4Tcp(srv, cli, 443, 52001, 0x12, Buffer.alloc(0))); // SYN,ACK
  frames.push(makeEthIpv4Tcp(cli, srv, 52001, 443, 0x18, Buffer.from([0x16, 0x03, 0x03, 0x00, 0x05, 0x01, 0x00, 0x00, 0x01, 0x00]))); // ClientHello
  frames.push(makeEthIpv4Tcp(srv, cli, 443, 52001, 0x18, Buffer.from([0x16, 0x03, 0x03, 0x00, 0x05, 0x02, 0x00, 0x00, 0x01, 0x00]))); // ServerHello
  frames.push(makeEthIpv4Tcp(srv, cli, 443, 52001, 0x18, Buffer.from([0x16, 0x03, 0x03, 0x00, 0x05, 0x0b, 0x00, 0x00, 0x01, 0x00]))); // Certificate
  frames.push(makeEthIpv4Tcp(cli, srv, 52001, 443, 0x18, Buffer.from([0x17, 0x03, 0x03, 0x00, 0x10, 0xde, 0xad, 0xbe, 0xef]))); // AppData (Encrypted)
  frames.push(makeEthIpv4Tcp(cli, [10, 0, 0, 5], 53000, 80, 0x18, Buffer.from('GET / HTTP/1.1\r\nHost: insecure.local\r\n\r\n')));

  const hdr = Buffer.alloc(24);
  hdr.writeUInt32LE(0xa1b2c3d4, 0);
  hdr.writeUInt16LE(2, 4);
  hdr.writeUInt16LE(4, 6);
  hdr.writeUInt32LE(65535, 16);
  hdr.writeUInt32LE(1, 20); // Ethernet

  const baseSec = Math.floor(Date.now() / 1000) - 5;
  const parts = [hdr];
  frames.forEach((fr, i) => {
    const recHdr = Buffer.alloc(16);
    recHdr.writeUInt32LE(baseSec + i, 0);
    recHdr.writeUInt32LE(i * 150000, 4);
    recHdr.writeUInt32LE(fr.length, 8);
    recHdr.writeUInt32LE(fr.length, 12);
    parts.push(recHdr, fr);
  });
  return Buffer.concat(parts);
}

// ============================================================================
// HTTP SERVER & ROUTE DISPATCHER
// ============================================================================
const server = http.createServer(async (req, res) => {
  const reqUrl = (req.url || '/').split('?')[0];

  // 1. Health Endpoint
  if (reqUrl === '/api/health' && req.method === 'GET') {
    const aiConfigured = Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
    return sendJson(res, 200, {
      status: 'ok',
      service: 'TLS Security Lab V3.0 Backend',
      aiConfigured,
      provider: process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'none',
      rateLimitPerMin: RATE_LIMIT_MAX
    });
  }

  // 2. Authentication Routes
  if (reqUrl === '/api/auth/login' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const user = portalDb.users.find((u) => u.email.toLowerCase() === email);
      if (!user || !verifyPasswordSync(password, user.passwordHash)) {
        return sendJson(res, 401, { error: 'Invalid email or password.' });
      }
      if (!user.active) {
        return sendJson(res, 403, { error: 'Account is deactivated. Contact an Administrator.' });
      }
      const token = signSessionToken({ uid: user.id, role: user.role, exp: Date.now() + 8 * 3600 * 1000 });
      recordAudit(user, 'LOGIN', user.email);
      return sendJson(res, 200, {
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      }, {
        'Set-Cookie': `tls_portal_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`
      });
    } catch {
      return sendJson(res, 400, { error: 'Invalid login payload.' });
    }
  }

  if (reqUrl === '/api/auth/logout' && req.method === 'POST') {
    const user = getAuthenticatedUser(req);
    if (user) recordAudit(user, 'LOGOUT', user.email);
    return sendJson(res, 200, { ok: true }, {
      'Set-Cookie': 'tls_portal_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
    });
  }

  if (reqUrl === '/api/auth/me' && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    if (!user) return sendJson(res, 200, { authenticated: false, user: null });
    return sendJson(res, 200, {
      authenticated: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  }

  // 3. Public / Student Content & Progress Sync
  if (reqUrl === '/api/content/public' && req.method === 'GET') {
    return sendJson(res, 200, {
      lessons: portalDb.lessons.filter((l) => l.published),
      quizzes: portalDb.quizzes,
      labs: portalDb.labs.filter((l) => l.active)
    });
  }

  if (reqUrl === '/api/student/sync' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const studentId = String(body.studentId || 'usr_stu_1');
      let stu = portalDb.users.find((u) => u.id === studentId && u.role === 'student');
      if (!stu) {
        stu = {
          id: studentId,
          name: String(body.name || 'Student User').slice(0, 80),
          email: String(body.email || `${studentId.toLowerCase()}@tlslab.edu`).slice(0, 120),
          role: 'student',
          active: true,
          passwordHash: hashPasswordSync(crypto.randomBytes(12).toString('hex')),
          createdAt: new Date().toISOString().slice(0, 10),
          course: String(body.course || 'B.Tech CSE').slice(0, 60)
        };
        portalDb.users.push(stu);
      }
      if (body.name) stu.name = String(body.name).slice(0, 80);
      if (body.course) stu.course = String(body.course).slice(0, 60);
      stu.completedLessons = Number(body.completedLessons) || 0;
      stu.completedLabs = Number(body.completedLabs) || 0;
      stu.quizAvg = Number(body.quizAvg) || 0;
      stu.quizAttempts = Number(body.quizAttempts) || 0;
      stu.lastActive = new Date().toISOString();
      if (body.activity) {
        portalDb.activities.unshift({
          student: stu.name,
          title: String(body.activity).slice(0, 140),
          time: new Date().toISOString()
        });
        if (portalDb.activities.length > 50) portalDb.activities.pop();
      }
      savePortalDb();
      return sendJson(res, 200, { ok: true });
    } catch {
      return sendJson(res, 400, { error: 'Invalid sync payload.' });
    }
  }

  // 4B. Cybersecurity Classroom & Collaboration APIs (RBAC Enforced)
  if (reqUrl === '/api/classrooms' && req.method === 'GET') {
    const actor = requireRoles(req, res, ['admin', 'faculty', 'student']);
    if (!actor) return;
    let visible = portalDb.classrooms;
    if (actor.role === 'faculty') {
      visible = portalDb.classrooms.filter((c) => c.facultyEmail === actor.email || c.members.some((m) => m.id === actor.id));
    } else if (actor.role === 'student') {
      visible = portalDb.classrooms.filter((c) => !c.archived && c.members.some((m) => m.id === actor.id));
    }
    return sendJson(res, 200, { classrooms: visible });
  }

  if (reqUrl === '/api/classrooms' && req.method === 'POST') {
    const actor = requireRoles(req, res, ['admin', 'faculty']);
    if (!actor) return;
    try {
      const body = await readJsonBody(req);
      const name = String(body.name || '').trim();
      const subject = String(body.subject || 'Network Security & Cryptography').trim();
      const description = String(body.description || '').trim();
      if (!name || name.length < 3) return sendJson(res, 400, { error: 'Classroom name (>= 3 chars) is required.' });
      const joinCode = `CLS-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const cls = {
        id: `cls_${Date.now()}`,
        name: name.slice(0, 100),
        subject: subject.slice(0, 80),
        description: description.slice(0, 400),
        joinCode,
        facultyEmail: actor.email,
        archived: false,
        members: [{ id: actor.id, name: actor.name, email: actor.email, role: actor.role }],
        assignments: [],
        announcements: [],
        discussions: [],
        projects: [],
        attendanceSessions: [],
        createdAt: new Date().toISOString().slice(0, 10)
      };
      portalDb.classrooms.unshift(cls);
      savePortalDb();
      recordAudit(actor, 'CREATE_CLASSROOM', `${cls.name} (${joinCode})`);
      return sendJson(res, 201, { classroom: cls });
    } catch {
      return sendJson(res, 400, { error: 'Invalid classroom payload.' });
    }
  }

  if (reqUrl === '/api/classrooms/join' && req.method === 'POST') {
    const actor = requireRoles(req, res, ['admin', 'faculty', 'student']);
    if (!actor) return;
    try {
      const body = await readJsonBody(req);
      const code = String(body.joinCode || '').trim().toUpperCase();
      const cls = portalDb.classrooms.find((c) => c.joinCode === code);
      if (!cls) return sendJson(res, 404, { error: 'Invalid classroom join code.' });
      if (cls.archived) return sendJson(res, 400, { error: 'This classroom is archived and no longer accepting enrollments.' });
      if (!cls.members.some((m) => m.id === actor.id)) {
        cls.members.push({ id: actor.id, name: actor.name, email: actor.email, role: actor.role });
        savePortalDb();
        recordAudit(actor, 'JOIN_CLASSROOM', cls.name);
      }
      return sendJson(res, 200, { classroom: cls });
    } catch {
      return sendJson(res, 400, { error: 'Invalid join request.' });
    }
  }

  if (reqUrl.startsWith('/api/classrooms/') && req.method !== 'OPTIONS') {
    const parts = reqUrl.split('/').filter(Boolean); // ['api', 'classrooms', clsId, ...]
    const clsId = parts[2];
    const cls = portalDb.classrooms.find((c) => c.id === clsId);
    const actor = requireRoles(req, res, ['admin', 'faculty', 'student']);
    if (!actor) return;
    if (!cls) return sendJson(res, 404, { error: 'Classroom not found.' });

    const isFacultyOrAdmin = actor.role === 'admin' || (actor.role === 'faculty' && cls.facultyEmail === actor.email);
    const isEnrolled = isFacultyOrAdmin || cls.members.some((m) => m.id === actor.id);

    // PATCH /api/classrooms/:id (archive/unarchive/settings)
    if (parts.length === 3 && req.method === 'PATCH') {
      if (!isFacultyOrAdmin) return sendJson(res, 403, { error: 'Only classroom faculty or admin can modify settings.' });
      const body = await readJsonBody(req);
      if (typeof body.archived === 'boolean') cls.archived = body.archived;
      if (body.name) cls.name = String(body.name).slice(0, 100);
      savePortalDb();
      recordAudit(actor, cls.archived ? 'ARCHIVE_CLASSROOM' : 'UNARCHIVE_CLASSROOM', cls.name);
      return sendJson(res, 200, { classroom: cls });
    }

    // POST /api/classrooms/:id/leave
    if (parts[3] === 'leave' && req.method === 'POST') {
      if (actor.role !== 'student') return sendJson(res, 400, { error: 'Only students leave via this action.' });
      cls.members = cls.members.filter((m) => m.id !== actor.id);
      savePortalDb();
      recordAudit(actor, 'LEAVE_CLASSROOM', cls.name);
      return sendJson(res, 200, { ok: true });
    }

    if (!isEnrolled) return sendJson(res, 403, { error: 'You are not enrolled in this classroom.' });

    // Assignments
    if (parts[3] === 'assignments' && parts.length === 4 && req.method === 'POST') {
      if (!isFacultyOrAdmin) return sendJson(res, 403, { error: 'Only faculty/admin can create assignments.' });
      const body = await readJsonBody(req);
      const title = String(body.title || '').trim();
      const instructions = String(body.instructions || '').trim();
      if (!title || !instructions) return sendJson(res, 400, { error: 'Title and instructions are required.' });
      const asg = {
        id: `asg_${Date.now()}`,
        title: title.slice(0, 120),
        instructions: instructions.slice(0, 1000),
        deadline: String(body.deadline || '2026-12-15').slice(0, 20),
        difficulty: ['Beginner', 'Intermediate', 'Advanced'].includes(body.difficulty) ? body.difficulty : 'Intermediate',
        resource: String(body.resource || '').slice(0, 200),
        submissions: []
      };
      cls.assignments.unshift(asg);
      savePortalDb();
      recordAudit(actor, 'CREATE_ASSIGNMENT', `${cls.name}: ${asg.title}`);
      return sendJson(res, 201, { assignment: asg });
    }

    if (parts[3] === 'assignments' && parts[5] === 'submit' && req.method === 'POST') {
      const asg = cls.assignments.find((a) => a.id === parts[4]);
      if (!asg) return sendJson(res, 404, { error: 'Assignment not found.' });
      const body = await readJsonBody(req);
      const answer = String(body.answer || '').trim();
      const fileName = String(body.fileName || '').trim();
      const fileSize = Number(body.fileSize || 0);
      if (!answer) return sendJson(res, 400, { error: 'Submission answer cannot be empty.' });
      if (fileName) {
        if (!/\.(pdf|txt|md|pcap|json)$/i.test(fileName)) {
          return sendJson(res, 400, { error: 'Unsupported file type. Permitted: .pdf, .txt, .md, .pcap, .json' });
        }
        if (fileSize > 2 * 1024 * 1024) {
          return sendJson(res, 400, { error: 'Uploaded file exceeds 2 MB limit.' });
        }
      }
      const sub = {
        id: `sub_${Date.now()}`,
        studentId: actor.id,
        studentName: actor.name,
        studentEmail: actor.email,
        answer: answer.slice(0, 2000),
        fileName: fileName.slice(0, 120),
        status: 'Submitted',
        feedback: '',
        submittedAt: new Date().toISOString()
      };
      asg.submissions.unshift(sub);
      savePortalDb();
      recordAudit(actor, 'SUBMIT_ASSIGNMENT', `${asg.title}`);
      return sendJson(res, 201, { submission: sub });
    }

    if (parts[3] === 'assignments' && parts[5] === 'submissions' && req.method === 'PATCH') {
      if (!isFacultyOrAdmin) return sendJson(res, 403, { error: 'Only faculty/admin can review submissions.' });
      const asg = cls.assignments.find((a) => a.id === parts[4]);
      const sub = asg && asg.submissions.find((s) => s.id === parts[6]);
      if (!sub) return sendJson(res, 404, { error: 'Submission not found.' });
      const body = await readJsonBody(req);
      sub.status = String(body.status || 'Reviewed').slice(0, 30);
      sub.feedback = String(body.feedback || '').slice(0, 500);
      savePortalDb();
      recordAudit(actor, 'REVIEW_SUBMISSION', `${asg.title} (${sub.studentEmail})`);
      return sendJson(res, 200, { submission: sub });
    }

    // Announcements
    if (parts[3] === 'announcements' && req.method === 'POST') {
      if (!isFacultyOrAdmin) return sendJson(res, 403, { error: 'Only faculty/admin can publish announcements.' });
      const body = await readJsonBody(req);
      const title = String(body.title || '').trim();
      const message = String(body.message || '').trim();
      if (!title || !message) return sendJson(res, 400, { error: 'Title and message are required.' });
      const ann = {
        id: `ann_${Date.now()}`,
        title: title.slice(0, 120),
        message: message.slice(0, 1000),
        type: String(body.type || 'Update').slice(0, 30),
        author: actor.name,
        createdAt: new Date().toISOString()
      };
      cls.announcements.unshift(ann);
      savePortalDb();
      recordAudit(actor, 'PUBLISH_ANNOUNCEMENT', `${cls.name}: ${ann.title}`);
      return sendJson(res, 201, { announcement: ann });
    }

    // Discussions & Moderation
    if (parts[3] === 'discussions' && parts.length === 4 && req.method === 'POST') {
      const body = await readJsonBody(req);
      const title = String(body.title || '').trim();
      const bodyTxt = String(body.body || '').trim();
      if (!title || !bodyTxt) return sendJson(res, 400, { error: 'Topic title and question/body are required.' });
      const topic = {
        id: `disc_${Date.now()}`,
        title: title.slice(0, 140),
        body: bodyTxt.slice(0, 1500),
        authorName: actor.name,
        authorRole: actor.role,
        replies: [],
        createdAt: new Date().toISOString()
      };
      cls.discussions.unshift(topic);
      savePortalDb();
      return sendJson(res, 201, { topic });
    }

    if (parts[3] === 'discussions' && parts[5] === 'reply' && req.method === 'POST') {
      const topic = cls.discussions.find((d) => d.id === parts[4]);
      if (!topic) return sendJson(res, 404, { error: 'Discussion topic not found.' });
      const body = await readJsonBody(req);
      const text = String(body.text || '').trim();
      if (!text) return sendJson(res, 400, { error: 'Reply text cannot be empty.' });
      topic.replies.push({
        id: `rep_${Date.now()}`,
        authorName: actor.name,
        authorRole: actor.role,
        text: text.slice(0, 1000),
        createdAt: new Date().toISOString()
      });
      savePortalDb();
      return sendJson(res, 201, { topic });
    }

    if (parts[3] === 'discussions' && parts.length === 5 && req.method === 'DELETE') {
      if (!isFacultyOrAdmin) return sendJson(res, 403, { error: 'Only faculty/admin can moderate discussions.' });
      const idx = cls.discussions.findIndex((d) => d.id === parts[4]);
      if (idx === -1) return sendJson(res, 404, { error: 'Discussion topic not found.' });
      const [removed] = cls.discussions.splice(idx, 1);
      savePortalDb();
      recordAudit(actor, 'MODERATE_DISCUSSION', removed.title);
      return sendJson(res, 200, { ok: true });
    }

    // Group Projects
    if (parts[3] === 'projects' && parts.length === 4 && req.method === 'POST') {
      if (!isFacultyOrAdmin) return sendJson(res, 403, { error: 'Only faculty/admin can create group projects.' });
      const body = await readJsonBody(req);
      const title = String(body.title || '').trim();
      const objectives = String(body.objectives || '').trim();
      if (!title || !objectives) return sendJson(res, 400, { error: 'Project title and objectives are required.' });
      const proj = {
        id: `prj_${Date.now()}`,
        title: title.slice(0, 120),
        teamName: String(body.teamName || 'Team Alpha').slice(0, 60),
        members: String(body.members || 'All Enrolled Students').slice(0, 200),
        objectives: objectives.slice(0, 800),
        deadline: String(body.deadline || '2026-12-20').slice(0, 20),
        updates: []
      };
      cls.projects.unshift(proj);
      savePortalDb();
      recordAudit(actor, 'CREATE_GROUP_PROJECT', proj.title);
      return sendJson(res, 201, { project: proj });
    }

    if (parts[3] === 'projects' && parts[5] === 'update' && req.method === 'POST') {
      const proj = cls.projects.find((p) => p.id === parts[4]);
      if (!proj) return sendJson(res, 404, { error: 'Project not found.' });
      const body = await readJsonBody(req);
      const note = String(body.note || '').trim();
      if (!note) return sendJson(res, 400, { error: 'Project update note cannot be empty.' });
      proj.updates.unshift({ author: actor.name, note: note.slice(0, 600), time: new Date().toISOString() });
      savePortalDb();
      return sendJson(res, 201, { project: proj });
    }

    // Verified Attendance Sessions
    if (parts[3] === 'attendance' && parts[4] === 'sessions' && req.method === 'POST') {
      if (!isFacultyOrAdmin) return sendJson(res, 403, { error: 'Only faculty/admin can open attendance sessions.' });
      const body = await readJsonBody(req);
      const topic = String(body.topic || 'Cybersecurity Lab Session').trim();
      const code = `ATT-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const sess = {
        id: `att_${Date.now()}`,
        topic: topic.slice(0, 100),
        code,
        open: true,
        presentIds: [],
        createdAt: new Date().toISOString()
      };
      cls.attendanceSessions.unshift(sess);
      savePortalDb();
      recordAudit(actor, 'OPEN_ATTENDANCE_SESSION', `${cls.name}: ${sess.topic}`);
      return sendJson(res, 201, { session: sess });
    }

    if (parts[3] === 'attendance' && parts[5] === 'checkin' && req.method === 'POST') {
      const sess = cls.attendanceSessions.find((s) => s.id === parts[4]);
      if (!sess || !sess.open) return sendJson(res, 400, { error: 'Attendance session not found or closed.' });
      const body = await readJsonBody(req);
      const code = String(body.code || '').trim().toUpperCase();
      if (code !== sess.code) return sendJson(res, 403, { error: 'Invalid attendance verification code.' });
      if (!sess.presentIds.includes(actor.id)) {
        sess.presentIds.push(actor.id);
        savePortalDb();
        recordAudit(actor, 'ATTENDANCE_CHECKIN', `${cls.name}: ${sess.topic}`);
      }
      return sendJson(res, 200, { ok: true, session: sess });
    }

    // Classroom Analytics (real DB data)
    if (parts[3] === 'analytics' && req.method === 'GET') {
      const studentMembers = cls.members.filter((m) => m.role === 'student');
      const totalSub = cls.assignments.reduce((a, asg) => a + asg.submissions.length, 0);
      const sessCount = cls.attendanceSessions.length;
      const myAtt = sessCount ? Math.round((cls.attendanceSessions.filter((s) => s.presentIds.includes(actor.id)).length / sessCount) * 100) : 0;
      const matchedUsers = portalDb.users.filter((u) => studentMembers.some((m) => m.id === u.id));
      const quizAvg = matchedUsers.length ? Math.round(matchedUsers.reduce((a, u) => a + (u.quizAvg || 0), 0) / matchedUsers.length) : 0;
      const labsDone = matchedUsers.reduce((a, u) => a + (u.completedLabs || 0), 0);
      return sendJson(res, 200, {
        enrolledStudents: studentMembers.length,
        totalAssignments: cls.assignments.length,
        totalSubmissions: totalSub,
        discussionTopics: cls.discussions.length,
        groupProjects: cls.projects.length,
        attendanceSessions: sessCount,
        myAttendancePct: myAtt,
        quizAvg,
        labsDone
      });
    }
  }

  // 4D. PCAP / PCAPNG Binary Traffic Analysis APIs
  if (reqUrl === '/api/pcap/sample' && req.method === 'GET') {
    const sampleBuf = buildSamplePcapBuffer();
    const analysis = parseCaptureBuffer(sampleBuf);
    return sendJson(res, 200, { fileName: 'sample_tls13_capture.pcap', sizeBytes: sampleBuf.length, analysis });
  }

  if (reqUrl === '/api/pcap/analyze' && req.method === 'POST') {
    sweepStaleTempCaptures();
    try {
      const body = await readJsonBody(req, 8 * 1024 * 1024); // allow base64 of <= 5MB file
      const fileName = String(body.fileName || 'capture.pcap').trim();
      const base64Data = String(body.base64Data || '');
      if (!/\.(pcap|pcapng|cap)$/i.test(fileName)) {
        return sendJson(res, 400, { error: 'Invalid file type. Permitted extensions: .pcap, .pcapng, .cap' });
      }
      if (!base64Data) return sendJson(res, 400, { error: 'Empty file upload.' });
      const rawBuf = Buffer.from(base64Data, 'base64');
      if (rawBuf.length > 5 * 1024 * 1024) {
        return sendJson(res, 413, { error: 'Capture exceeds 5 MB maximum limit.' });
      }
      if (!fs.existsSync(TMP_CAP_DIR)) fs.mkdirSync(TMP_CAP_DIR, { recursive: true });
      const tmpPath = path.join(TMP_CAP_DIR, `cap_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.bin`);
      try {
        fs.writeFileSync(tmpPath, rawBuf);
        const analysis = parseCaptureBuffer(rawBuf);
        return sendJson(res, 200, { fileName, sizeBytes: rawBuf.length, analysis });
      } finally {
        try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch { /* ignore */ }
      }
    } catch (err) {
      const status = err.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
      return sendJson(res, status, { error: err.message || 'PCAP parsing failed.' });
    }
  }

  // 4C. Real-Time TLS Monitoring System (Node.js tls.connect + SSE)
  if (reqUrl === '/api/tls-monitor/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Content-Type-Options': 'nosniff'
    });
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', ts: new Date().toISOString() })}\n\n`);
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  if (reqUrl === '/api/tls-monitor/state' && req.method === 'GET') {
    return sendJson(res, 200, buildTlsMonitorSnapshot());
  }

  if (reqUrl === '/api/tls-monitor/history' && req.method === 'DELETE') {
    portalDb.tlsMonitor = { connections: [], events: [], alerts: [] };
    savePortalDb();
    broadcastTlsSse('tls_reset', { ts: new Date().toISOString() });
    return sendJson(res, 200, { ok: true });
  }

  if (reqUrl === '/api/tls-monitor/probe' && req.method === 'POST') {
    const clientIp = req.socket.remoteAddress || 'unknown';
    const rl = checkRateLimit(clientIp);
    if (!rl.allowed) {
      return sendJson(res, 429, { error: 'Probe rate limit exceeded.', retryAfterSec: rl.retryAfterSec });
    }
    try {
      const body = await readJsonBody(req);
      const host = String(body.host || '').trim().toLowerCase();
      const port = Number(body.port || 443);
      const versionPref = String(body.version || 'auto');

      if (!isAllowedProbeHost(host) || port !== 443) {
        return sendJson(res, 400, {
          error: 'Invalid or restricted target. Enter a valid public hostname (e.g. example.com, expired.badssl.com) on port 443.'
        });
      }

      const result = await runLiveTlsProbe({ host, port, versionPref });
      return sendJson(res, 200, { result, snapshot: buildTlsMonitorSnapshot() });
    } catch (err) {
      return sendJson(res, 502, { error: err.message || 'TLS probe failed.' });
    }
  }

  if (reqUrl === '/api/analytics/faculty' && req.method === 'GET') {
    const actor = requireRoles(req, res, ['admin', 'faculty']);
    if (!actor) return;
    const students = portalDb.users.filter((u) => u.role === 'student').map(({ passwordHash, ...s }) => s);
    const classrooms = actor.role === 'admin'
      ? portalDb.classrooms
      : portalDb.classrooms.filter((c) => c.facultyEmail === actor.email);
    const totalAssignments = classrooms.reduce((a, c) => a + (c.assignments || []).length, 0);
    const totalSubmissions = classrooms.reduce((a, c) => a + (c.assignments || []).reduce((sa, asg) => sa + (asg.submissions || []).length, 0), 0);
    const needSupport = students.filter((s) => (s.quizAvg || 0) < 60 || (s.completedLessons || 0) < 3).map((s) => ({
      name: s.name, email: s.email, quizAvg: s.quizAvg || 0, completedLessons: s.completedLessons || 0
    }));
    return sendJson(res, 200, {
      classroomCount: classrooms.length,
      studentCount: students.length,
      totalAssignments,
      totalSubmissions,
      avgQuizScore: students.length ? Math.round(students.reduce((a, s) => a + (s.quizAvg || 0), 0) / students.length) : 0,
      needSupport
    });
  }

  // 4. Protected Admin & Faculty APIs (RBAC Enforced on Backend)
  if (reqUrl === '/api/admin/overview' && req.method === 'GET') {
    const actor = requireRoles(req, res, ['admin', 'faculty']);
    if (!actor) return;
    const students = portalDb.users.filter((u) => u.role === 'student');
    const activeStudents = students.filter((s) => s.active).length;
    const completedLessonsSum = students.reduce((a, s) => a + (s.completedLessons || 0), 0);
    const completedLabsSum = students.reduce((a, s) => a + (s.completedLabs || 0), 0);
    const quizAvgAll = students.length ? Math.round(students.reduce((a, s) => a + (s.quizAvg || 0), 0) / students.length) : 0;
    return sendJson(res, 200, {
      totalStudents: students.length,
      activeStudents,
      totalLessons: 35 + portalDb.lessons.length,
      completedLessonsSum,
      totalQuizzes: portalDb.quizzes.length,
      quizAvgAll,
      totalLabs: 5 + portalDb.labs.length,
      completedLabsSum,
      recentActivities: portalDb.activities.slice(0, 12),
      auditLogs: portalDb.auditLogs.slice(0, 20)
    });
  }

  if (reqUrl === '/api/admin/students' && req.method === 'GET') {
    const actor = requireRoles(req, res, ['admin', 'faculty']);
    if (!actor) return;
    const students = portalDb.users
      .filter((u) => u.role === 'student')
      .map(({ passwordHash, ...safe }) => safe);
    return sendJson(res, 200, { students });
  }

  if (reqUrl.startsWith('/api/admin/students/') && reqUrl.endsWith('/status') && req.method === 'PATCH') {
    const actor = requireRoles(req, res, ['admin']); // Admin-only
    if (!actor) return;
    const id = reqUrl.split('/')[4];
    const stu = portalDb.users.find((u) => u.id === id && u.role === 'student');
    if (!stu) return sendJson(res, 404, { error: 'Student not found.' });
    try {
      const body = await readJsonBody(req);
      stu.active = Boolean(body.active);
      savePortalDb();
      recordAudit(actor, stu.active ? 'ACTIVATE_STUDENT' : 'DEACTIVATE_STUDENT', stu.email);
      return sendJson(res, 200, { ok: true, active: stu.active });
    } catch {
      return sendJson(res, 400, { error: 'Invalid status payload.' });
    }
  }

  if (reqUrl === '/api/admin/lessons' && req.method === 'GET') {
    const actor = requireRoles(req, res, ['admin', 'faculty']);
    if (!actor) return;
    return sendJson(res, 200, { lessons: portalDb.lessons });
  }

  if (reqUrl === '/api/admin/lessons' && req.method === 'POST') {
    const actor = requireRoles(req, res, ['admin', 'faculty']);
    if (!actor) return;
    try {
      const body = await readJsonBody(req);
      const title = String(body.title || '').trim();
      const summary = String(body.summary || '').trim();
      if (!title || !summary) return sendJson(res, 400, { error: 'Lesson title and summary are required.' });
      const lesson = {
        id: `fac_les_${Date.now()}`,
        moduleId: String(body.moduleId || 'mod_tls'),
        title: title.slice(0, 120),
        difficulty: ['Beginner', 'Intermediate', 'Advanced'].includes(body.difficulty) ? body.difficulty : 'Beginner',
        duration: String(body.duration || '10 min').slice(0, 20),
        summary: summary.slice(0, 2000),
        published: body.published !== false,
        author: actor.email,
        updatedAt: new Date().toISOString().slice(0, 10)
      };
      portalDb.lessons.unshift(lesson);
      savePortalDb();
      recordAudit(actor, 'CREATE_LESSON', lesson.title);
      return sendJson(res, 201, { lesson });
    } catch {
      return sendJson(res, 400, { error: 'Invalid lesson payload.' });
    }
  }

  if (reqUrl.startsWith('/api/admin/lessons/') && req.method === 'PATCH') {
    const actor = requireRoles(req, res, ['admin', 'faculty']);
    if (!actor) return;
    const id = reqUrl.split('/')[4];
    const les = portalDb.lessons.find((l) => l.id === id);
    if (!les) return sendJson(res, 404, { error: 'Lesson not found.' });
    try {
      const body = await readJsonBody(req);
      if (typeof body.published === 'boolean') les.published = body.published;
      if (body.title) les.title = String(body.title).slice(0, 120);
      les.updatedAt = new Date().toISOString().slice(0, 10);
      savePortalDb();
      recordAudit(actor, les.published ? 'PUBLISH_LESSON' : 'UNPUBLISH_LESSON', les.title);
      return sendJson(res, 200, { lesson: les });
    } catch {
      return sendJson(res, 400, { error: 'Invalid lesson update.' });
    }
  }

  if (reqUrl.startsWith('/api/admin/lessons/') && req.method === 'DELETE') {
    const actor = requireRoles(req, res, ['admin', 'faculty']);
    if (!actor) return;
    const id = reqUrl.split('/')[4];
    const idx = portalDb.lessons.findIndex((l) => l.id === id);
    if (idx === -1) return sendJson(res, 404, { error: 'Lesson not found.' });
    const [removed] = portalDb.lessons.splice(idx, 1);
    savePortalDb();
    recordAudit(actor, 'DELETE_LESSON', removed.title);
    return sendJson(res, 200, { ok: true });
  }

  if (reqUrl === '/api/admin/quizzes' && req.method === 'GET') {
    const actor = requireRoles(req, res, ['admin', 'faculty']);
    if (!actor) return;
    return sendJson(res, 200, { quizzes: portalDb.quizzes });
  }

  if (reqUrl === '/api/admin/quizzes' && req.method === 'POST') {
    const actor = requireRoles(req, res, ['admin', 'faculty']);
    if (!actor) return;
    try {
      const body = await readJsonBody(req);
      const q = String(body.q || '').trim();
      const opts = Array.isArray(body.opts) ? body.opts.map((o) => String(o).trim()).filter(Boolean) : [];
      const ans = Number(body.ans);
      if (!q || opts.length !== 4 || isNaN(ans) || ans < 0 || ans > 3) {
        return sendJson(res, 400, { error: 'Question text, 4 options, and valid answer index (0-3) are required.' });
      }
      const quiz = {
        id: `fac_q_${Date.now()}`,
        cat: String(body.cat || 'TLS Fundamentals').slice(0, 60),
        diff: ['Easy', 'Medium', 'Hard'].includes(body.diff) ? body.diff : 'Medium',
        q: q.slice(0, 400),
        opts,
        ans,
        exp: String(body.exp || 'Added by faculty.').slice(0, 400),
        author: actor.email
      };
      portalDb.quizzes.unshift(quiz);
      savePortalDb();
      recordAudit(actor, 'CREATE_QUIZ_QUESTION', quiz.q.slice(0, 60));
      return sendJson(res, 201, { quiz });
    } catch {
      return sendJson(res, 400, { error: 'Invalid quiz payload.' });
    }
  }

  if (reqUrl.startsWith('/api/admin/quizzes/') && req.method === 'DELETE') {
    const actor = requireRoles(req, res, ['admin', 'faculty']);
    if (!actor) return;
    const id = reqUrl.split('/')[4];
    const idx = portalDb.quizzes.findIndex((q) => q.id === id);
    if (idx === -1) return sendJson(res, 404, { error: 'Question not found.' });
    const [removed] = portalDb.quizzes.splice(idx, 1);
    savePortalDb();
    recordAudit(actor, 'DELETE_QUIZ_QUESTION', removed.q.slice(0, 60));
    return sendJson(res, 200, { ok: true });
  }

  if (reqUrl === '/api/admin/labs' && req.method === 'GET') {
    const actor = requireRoles(req, res, ['admin', 'faculty']);
    if (!actor) return;
    return sendJson(res, 200, { labs: portalDb.labs });
  }

  if (reqUrl === '/api/admin/labs' && req.method === 'POST') {
    const actor = requireRoles(req, res, ['admin', 'faculty']);
    if (!actor) return;
    try {
      const body = await readJsonBody(req);
      const title = String(body.title || '').trim();
      const instructions = String(body.instructions || '').trim();
      if (!title || !instructions) return sendJson(res, 400, { error: 'Lab title and instructions are required.' });
      const lab = {
        id: `fac_lab_${Date.now()}`,
        title: title.slice(0, 120),
        category: String(body.category || 'Cryptography').slice(0, 60),
        difficulty: ['Beginner', 'Intermediate', 'Advanced'].includes(body.difficulty) ? body.difficulty : 'Intermediate',
        requirement: String(body.requirement || 'Complete lab verification').slice(0, 200),
        instructions: instructions.slice(0, 1000),
        active: true,
        completions: 0
      };
      portalDb.labs.unshift(lab);
      savePortalDb();
      recordAudit(actor, 'CREATE_PRACTICAL_LAB', lab.title);
      return sendJson(res, 201, { lab });
    } catch {
      return sendJson(res, 400, { error: 'Invalid lab payload.' });
    }
  }

  if (reqUrl.startsWith('/api/admin/labs/') && req.method === 'DELETE') {
    const actor = requireRoles(req, res, ['admin', 'faculty']);
    if (!actor) return;
    const id = reqUrl.split('/')[4];
    const idx = portalDb.labs.findIndex((l) => l.id === id);
    if (idx === -1) return sendJson(res, 404, { error: 'Lab not found.' });
    const [removed] = portalDb.labs.splice(idx, 1);
    savePortalDb();
    recordAudit(actor, 'DELETE_PRACTICAL_LAB', removed.title);
    return sendJson(res, 200, { ok: true });
  }

  // 5. AI Cybersecurity Intelligence Endpoint
  if (reqUrl === '/api/ai/analyze' && req.method === 'POST') {
    const clientIp = req.socket.remoteAddress || 'unknown';
    const rl = checkRateLimit(clientIp);
    if (!rl.allowed) {
      return sendJson(res, 429, { error: 'Rate limit exceeded.', retryAfterSec: rl.retryAfterSec }, { 'Retry-After': String(rl.retryAfterSec) });
    }
    try {
      const body = await readJsonBody(req);
      const mode = String(body.mode || 'advisor');
      const level = body.level === 'advanced' ? 'advanced' : 'beginner';
      const language = ['en', 'hi', 'kn', 'ta', 'te', 'ml'].includes(body.language) ? body.language : 'en';
      const bilingual = Boolean(body.bilingual);
      const prompt = String(body.prompt || '').trim();
      const evidence = body.evidence && typeof body.evidence === 'object' ? body.evidence : {};
      const history = Array.isArray(body.history) ? body.history : [];

      if (!ALLOWED_MODES.has(mode)) return sendJson(res, 400, { error: 'Invalid AI analysis mode.' });
      if (!prompt && ['advisor', 'phishing_url', 'code_review'].includes(mode)) {
        return sendJson(res, 400, { error: 'Input prompt cannot be empty for this mode.' });
      }
      if (prompt.length > 4000) return sendJson(res, 400, { error: 'Input exceeds 4000 characters.' });

      const verifiedFindings = runVerifiedEvidenceAnalyzer(mode, prompt, evidence);
      try {
        const aiResult = await callBackendAiProvider(mode, level, prompt, verifiedFindings, history, language, bilingual);
        if (aiResult) {
          return sendJson(res, 200, {
            source: 'ai_api', apiConfigured: true, provider: aiResult.provider, model: aiResult.model,
            verifiedFindings, aiExplanation: aiResult.text,
            disclaimer: 'AI-generated explanation is educational and distinct from verified deterministic findings above.'
          }, { 'X-RateLimit-Remaining': String(rl.remaining) });
        }
      } catch { /* fallback */ }

      return sendJson(res, 200, {
        source: 'offline_rule_engine', apiConfigured: false, verifiedFindings,
        aiExplanation: buildFallbackExplanation(mode, level, prompt, verifiedFindings, language, bilingual),
        disclaimer: 'No backend AI API key configured (or provider unreachable). Showing deterministic rule-based guidance.'
      }, { 'X-RateLimit-Remaining': String(rl.remaining) });
    } catch (err) {
      const status = err.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
      return sendJson(res, status, { error: status === 413 ? 'Request payload too large.' : 'Invalid JSON request body.' });
    }
  }

  if (reqUrl.startsWith('/api/')) {
    return sendJson(res, 404, { error: 'API endpoint not found.' });
  }

  // 6. Static File Serving (block sensitive files & data dir)
  let safePath = path.normalize(decodeURIComponent(reqUrl));
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';
  const filePath = path.join(BASE_DIR, safePath);
  const rel = path.relative(BASE_DIR, filePath);

  if (rel.startsWith('..') || path.isAbsolute(rel) || rel.startsWith('data') || /(^\.env|server\.js$|^\.git)/i.test(path.basename(filePath))) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain' });
      return res.end(err.code === 'ENOENT' ? 'File Not Found' : 'Server Error');
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    res.end(content);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`TLS Security Lab V3.0 Server running at http://127.0.0.1:${PORT}/`);
});
