/**
 * TLS Handshake Demonstration Simulator - Version 2.0 Professional
 * Advanced Cybersecurity Protocol Laboratory & Interactive Visualizer
 * Architecture: Vertical 250px Left Sidebar Navigation + State Machine
 */

(function () {
  'use strict';

  // ============================================================================
  // GLOBAL STATE
  // ============================================================================
  const TOTAL_STEPS = 5;
  let currentStep = 1;
  let activeMode = 'overview'; // 'overview' (5 steps) or 'detailed' (8 messages)
  let activeMsgIdx = 1; // 1 to 8 in detailed mode
  let autoPlayTimer = null;
  let soundEnabled = true;
  let presTimerInterval = null;
  let presSeconds = 0;
  let latencyChartInstance = null;

  // Web Crypto Key Cache for ECDH & AES-GCM
  let cachedClientKeyPair = null;
  let cachedServerKeyPair = null;
  let cachedAesKey = null;
  let cachedCipherBuffer = null;
  let cachedAesIv = null;

  // ============================================================================
  // DASHBOARD ANALYTICS STATE (Computed dynamically from session tests)
  // ============================================================================
  let tlsVersionDoughnutChart = null;
  let handshakeAnalyticsChart = null;
  let activeHandshakeStartMs = performance.now();

  const analyticsState = {
    handshakeCompleted: false,
    certStatus: 'pending', // 'pending' | 'valid' | 'invalid'
    ecdhVerified: false,
    ecdhDurationMs: 0,
    aesVerified: false,
    aesDurationMs: 0,
    threatShieldTested: false,
    selectedProtocol: '1.3',
    tls13Count: 1,
    tls12Count: 0,
    totalHandshakes: 0,
    successfulHandshakes: 0,
    failedHandshakes: 0,
    handshakeDurations: [],
    certCounts: { valid: 0, expired: 0, selfSigned: 0, warnings: 0 },
    connections: [
      {
        host: 'portal.secure-bank.edu',
        version: 'TLS 1.3',
        cipher: 'TLS_AES_256_GCM_SHA384',
        status: 'Step 1 (Negotiating)',
        statusType: 'warn',
        durationLabel: 'Pending (Simulated)'
      }
    ],
    alerts: [
      {
        severity: 'warn',
        title: 'Certificate trust chain not yet verified in current session.',
        time: getTimestamp ? getTimestamp() : 'INIT',
        targetTab: 'tabCertificate',
        linkLabel: 'Inspect Certificate →'
      },
      {
        severity: 'info',
        title: 'TLS 1.3 simulator ready. Complete Step 5 or run Diagnostic Scan.',
        time: 'INIT',
        targetTab: 'tabSimulator',
        linkLabel: 'Open Simulator →'
      }
    ],
    activities: [
      {
        title: 'TLS Security Lab Dashboard initialized',
        time: 'INIT',
        badge: 'READY',
        badgeType: 'info'
      }
    ]
  };

  // ============================================================================
  // WEB AUDIO API CYBER SOUND SYNTHESIZER
  // ============================================================================
  const audioCtx = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext))
    ? new (window.AudioContext || window.webkitAudioContext)()
    : null;

  function playCyberTone(type) {
    if (!soundEnabled || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const now = audioCtx.currentTime;

      if (type === 'packet') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'shield') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.2);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(140, now + 0.1);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      // Audio autoplay policy or device busy
    }
  }

  // ============================================================================
  // DOM ELEMENT REFERENCES
  // ============================================================================
  // Sidebar Navigation & Mobile Drawer
  const appSidebar = document.getElementById('appSidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const btnHamburger = document.getElementById('btnHamburger');
  const btnSidebarClose = document.getElementById('btnSidebarClose');
  const navItems = document.querySelectorAll('.nav-item');
  const contentSections = document.querySelectorAll('.content-section');
  const headerBreadcrumbCurrent = document.getElementById('headerBreadcrumbCurrent');
  const sidebarTimelinePct = document.getElementById('sidebarTimelinePct');
  const navItemPresentation = document.getElementById('navItemPresentation');

  // Top Header Controls
  const btnToggleSound = document.getElementById('btnToggleSound');
  const soundStatusText = document.getElementById('soundStatusText');
  const btnPresentationMode = document.getElementById('btnPresentationMode');

  // Dashboard Action Links
  const btnDashLaunchSim = document.getElementById('btnDashLaunchSim');
  const btnDashLaunchCert = document.getElementById('btnDashLaunchCert');
  const linkToCryptoLab = document.getElementById('linkToCryptoLab');
  const linkToCertInspector = document.getElementById('linkToCertInspector');
  const linkToComparison = document.getElementById('linkToComparison');

  // Mode Toggle (Overview vs Detailed TLS 1.3)
  const btnModeOverview = document.getElementById('btnModeOverview');
  const btnModeDetailed = document.getElementById('btnModeDetailed');
  const detailedStepperContainer = document.getElementById('detailedStepperContainer');
  const mainStepperNav = document.getElementById('mainStepperNav');
  const detailedMsgInspector = document.getElementById('detailedMsgInspector');

  // SOC Telemetry Elements
  const socProtocolVal = document.getElementById('socProtocolVal');
  const socHandshakeStatus = document.getElementById('socHandshakeStatus');
  const socHandshakeIndicator = document.getElementById('socHandshakeIndicator');
  const socHandshakeSub = document.getElementById('socHandshakeSub');
  const socCertStatus = document.getElementById('socCertStatus');
  const socCertIndicator = document.getElementById('socCertIndicator');
  const socKeyStatus = document.getElementById('socKeyStatus');
  const socKeyIndicator = document.getElementById('socKeyIndicator');
  const socEncStatus = document.getElementById('socEncStatus');
  const socEncIndicator = document.getElementById('socEncIndicator');
  const socMsgCounter = document.getElementById('socMsgCounter');
  const socCurrentStageText = document.getElementById('socCurrentStageText');

  // Stepper Elements
  const stepNodes = [
    document.getElementById('stepNode1'),
    document.getElementById('stepNode2'),
    document.getElementById('stepNode3'),
    document.getElementById('stepNode4'),
    document.getElementById('stepNode5'),
  ];
  const stepperProgressLine = document.getElementById('stepperProgressLine');
  const stepViews = [
    document.getElementById('viewStep1'),
    document.getElementById('viewStep2'),
    document.getElementById('viewStep3'),
    document.getElementById('viewStep4'),
    document.getElementById('viewStep5'),
  ];

  // Handshake Visual Arena
  const clientCard = document.getElementById('clientCard');
  const serverCard = document.getElementById('serverCard');
  const clientStatusBadge = document.getElementById('clientStatusBadge');
  const serverStatusBadge = document.getElementById('serverStatusBadge');
  const browserOmnibar = document.querySelector('.browser-omnibar');
  const omnibarScheme = document.getElementById('omnibarScheme');
  const omnibarStatus = document.getElementById('omnibarStatus');
  const clientSelectedTls = document.getElementById('clientTlsVersions');
  const clientCipherSuites = document.getElementById('clientCipherSuites');
  const clientRandomVal = document.getElementById('clientRandomVal');
  const clientKeyShare = document.getElementById('clientKeyShare');
  const clientSessionKey = document.getElementById('clientSessionKey');
  const serverSelectedTls = document.getElementById('serverSelectedTls');
  const serverSelectedCipher = document.getElementById('serverSelectedCipher');
  const serverRandomVal = document.getElementById('serverRandomVal');
  const serverKeyShare = document.getElementById('serverKeyShare');
  const serverSessionKey = document.getElementById('serverSessionKey');

  // Network Channel
  const channelStatus = document.getElementById('channelStatus');
  const arrowC2S = document.getElementById('arrowC2S');
  const arrowS2C = document.getElementById('arrowS2C');
  const packetLabelC2S = document.getElementById('packetLabelC2S');
  const packetLabelS2C = document.getElementById('packetLabelS2C');
  const tunnelMesh = document.getElementById('tunnelMesh');
  const transText = document.getElementById('transText');

  // Controls
  const btnStart = document.getElementById('btnStart');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnReset = document.getElementById('btnReset');
  const toggleAutoPlay = document.getElementById('toggleAutoPlay');

  // Vertical Timeline Elements
  const verticalTimelineItems = document.querySelectorAll('.vertical-timeline .timeline-item');
  const timelinePct = document.getElementById('timelinePct');
  const timelineFill = document.getElementById('timelineFill');
  const fullTimelinePct = document.getElementById('fullTimelinePct');
  const fullTimelineFill = document.getElementById('fullTimelineFill');
  const tfStepCards = document.querySelectorAll('.tf-step-card');

  // Terminal Packet Log Elements
  const packetLogBody = document.getElementById('packetLogBody');
  const btnClearLog = document.getElementById('btnClearLog');

  // Detailed 8-Message Ribbon Elements
  const msgPills = document.querySelectorAll('.msg-pill');
  const dmiMsgSeqBadge = document.getElementById('dmiMsgSeqBadge');
  const dmiName = document.getElementById('dmiName');
  const dmiSender = document.getElementById('dmiSender');
  const dmiReceiver = document.getElementById('dmiReceiver');
  const dmiPurpose = document.getElementById('dmiPurpose');
  const dmiFieldsList = document.getElementById('dmiFieldsList');
  const dmiExplanation = document.getElementById('dmiExplanation');

  // Certificate Inspector Elements
  const certScenarioSelect = document.getElementById('certScenarioSelect');
  const btnVerifyCert = document.getElementById('btnVerifyCert');
  const btnResetCert = document.getElementById('btnResetCert');
  const certViewerCard = document.getElementById('certViewerCard');
  const cvStatusBadge = document.getElementById('cvStatusBadge');
  const cvStatusText = document.getElementById('cvStatusText');
  const cvSubject = document.getElementById('cvSubject');
  const cvSAN = document.getElementById('cvSAN');
  const cvIssuer = document.getElementById('cvIssuer');
  const cvSerialNumber = document.getElementById('cvSerialNumber');
  const cvValidFrom = document.getElementById('cvValidFrom');
  const cvValidUntil = document.getElementById('cvValidUntil');
  const cvResultBox = document.getElementById('cvResultBox');
  const cvrTitle = document.getElementById('cvrTitle');
  const cvrDesc = document.getElementById('cvrDesc');
  const chainRoot = document.getElementById('chainRoot');
  const chainInter = document.getElementById('chainInter');
  const chainLeaf = document.getElementById('chainLeaf');

  // Crypto Lab Elements
  const btnGenEcdh = document.getElementById('btnGenEcdh');
  const ecdhClientPub = document.getElementById('ecdhClientPub');
  const ecdhServerPub = document.getElementById('ecdhServerPub');
  const ecdhSharedSecret = document.getElementById('ecdhSharedSecret');
  const ecdhAgreedChip = document.getElementById('ecdhAgreedChip');
  const ecdhMatchStatus = document.getElementById('ecdhMatchStatus');
  const aesInputPlaintext = document.getElementById('aesInputPlaintext');
  const btnAesEncrypt = document.getElementById('btnAesEncrypt');
  const btnAesDecrypt = document.getElementById('btnAesDecrypt');
  const aesIvVal = document.getElementById('aesIvVal');
  const aesCipherVal = document.getElementById('aesCipherVal');
  const aesDecryptedVal = document.getElementById('aesDecryptedVal');

  // TLS 1.2 vs 1.3 Comparison Elements
  const btnSelectTls12 = document.getElementById('btnSelectTls12');
  const btnSelectTls13 = document.getElementById('btnSelectTls13');
  const pbcBadge = document.getElementById('pbcBadge');
  const pbcTitle = document.getElementById('pbcTitle');
  const pbcDesc = document.getElementById('pbcDesc');
  const pbcRttStat = document.getElementById('pbcRttStat');
  const pbcCiphersStat = document.getElementById('pbcCiphersStat');
  const pbcFsStat = document.getElementById('pbcFsStat');

  // Security Analyzer Elements
  const attackTabBtns = document.querySelectorAll('.attack-tab-btn');
  const attackAnimArena = document.getElementById('attackAnimArena');
  const adcTypeBadge = document.getElementById('adcTypeBadge');
  const adcTitle = document.getElementById('adcTitle');
  const adcWhat = document.getElementById('adcWhat');
  const adcHow = document.getElementById('adcHow');
  const adcDefense = document.getElementById('adcDefense');
  const btnSimulateAttack = document.getElementById('btnSimulateAttack');
  const attackerInterceptor = document.getElementById('attackerInterceptor');
  const attLabel = document.getElementById('attLabel');
  const attStatus = document.getElementById('attStatus');
  const tlsDefenseShield = document.getElementById('tlsDefenseShield');

  // Presentation Mode Elements
  const presentationOverlay = document.getElementById('presentationOverlay');
  const btnExitPresentation = document.getElementById('btnExitPresentation');
  const presStepBadge = document.getElementById('presStepBadge');
  const presStageTitle = document.getElementById('presStageTitle');
  const presStageDesc = document.getElementById('presStageDesc');
  const presCallout = document.getElementById('presCallout');
  const presNotesBody = document.getElementById('presNotesBody');
  const presTimer = document.getElementById('presTimer');
  const presNavIndicator = document.getElementById('presNavIndicator');
  const btnPresPrev = document.getElementById('btnPresPrev');
  const btnPresNext = document.getElementById('btnPresNext');

  // Notes Modal Elements
  const btnOpenNotes = document.getElementById('btnOpenNotes');
  const btnCloseNotes = document.getElementById('btnCloseNotes');
  const notesModalOverlay = document.getElementById('notesModalOverlay');

  // Live typing demo in Step 5
  const demoPlaintext = document.getElementById('demoPlaintext');
  const dispPlaintext = document.getElementById('dispPlaintext');
  const dispCiphertext = document.getElementById('dispCiphertext');
  const dispDecrypted = document.getElementById('dispDecrypted');

  // ============================================================================
  // SIDEBAR NAVIGATION SYSTEM & SECTION SWITCHER
  // ============================================================================
  const SECTION_TITLES = {
    tabStudentDash: 'Student Dashboard',
    tabAcademy: 'Learning Academy',
    tabSimulator: 'TLS Handshake Simulator',
    tabCertificate: 'Certificate Inspector',
    tabCrypto: 'Cryptography Lab',
    tabComparison: 'TLS 1.2 vs TLS 1.3',
    tabSecurity: 'Security Analyzer',
    tabAiAdvisor: 'AI Cybersecurity Tutor'
  };

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const ALLOWED_CORE_TABS = new Set([
    'tabStudentDash',
    'tabAcademy',
    'tabSimulator',
    'tabCertificate',
    'tabCrypto',
    'tabComparison',
    'tabSecurity',
    'tabAiAdvisor'
  ]);

  let currentActiveTabId = 'tabStudentDash';

  function navigateToSection(targetId) {
    if (!targetId || !ALLOWED_CORE_TABS.has(targetId)) return;
    currentActiveTabId = targetId;

    // 1. Update active states on sidebar items
    navItems.forEach((item) => {
      const match = item.getAttribute('data-target') === targetId;
      item.classList.toggle('active', match);
    });

    // 2. Switch visible content section
    contentSections.forEach((sec) => {
      sec.classList.toggle('active', sec.id === targetId);
    });

    // 3. Update top breadcrumbs
    if (headerBreadcrumbCurrent && SECTION_TITLES[targetId]) {
      headerBreadcrumbCurrent.textContent = SECTION_TITLES[targetId];
    }

    // 4. Special handler: Chart.js render in comparison section
    if (targetId === 'tabComparison') {
      setTimeout(initChartJs, 120);
    } else if (targetId === 'tabDashboard') {
      setTimeout(renderDashboardAnalytics, 80);
    } else if (targetId === 'tabStudentDash') {
      renderStudentDashboard();
    } else if (targetId === 'tabProgress') {
      renderProgressSystem();
    } else if (targetId === 'tabChallenges') {
      renderChallenges();
    } else if (targetId === 'tabReports') {
      renderReportsSystem();
    } else if (targetId === 'tabProfile') {
      renderProfileSystem();
    } else if (targetId === 'tabAiAdvisor') {
      renderAiAdvisorSystem();
    } else if (targetId === 'tabAdminPortal') {
      renderAdminPortalSystem();
    } else if (targetId === 'tabClassroom') {
      renderClassroomSystem();
    } else if (targetId === 'tabTlsMonitor') {
      renderTlsMonitorSystem();
    } else if (targetId === 'tabPcapLab') {
      renderPcapLab();
    } else if (targetId === 'tabCareerCenter') {
      renderCareerCenter();
    } else if (targetId === 'tabGlossary') {
      renderGlossarySystem();
    } else if (targetId === 'tabAdvAnalytics') {
      renderAdvancedAnalytics();
    }

    document.querySelectorAll('[data-mbn-target]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-mbn-target') === targetId);
    });

    // 5. Close mobile/tablet drawer if open
    closeMobileSidebar();
    playCyberTone('packet');

    // Smooth scroll to top of section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openMobileSidebar() {
    if (appSidebar) appSidebar.classList.add('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
  }

  function closeMobileSidebar() {
    if (appSidebar) appSidebar.classList.remove('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
  }

  // ============================================================================
  // FEATURE 1: DETAILED TLS 1.3 PROTOCOL DATA (8 MESSAGES)
  // ============================================================================
  const TLS13_MESSAGES = [
    {
      index: 1,
      name: 'Client Hello',
      sender: 'Client (Browser)',
      receiver: 'Server',
      direction: 'C2S',
      purpose: 'Initiates handshake, proposes protocol versions, cipher suites, client random nonce, and speculative key share.',
      fields: [
        { name: 'Protocol Version', val: 'Legacy TLS 1.2 (0x0303) for compatibility' },
        { name: 'Client Random', val: '32-byte cryptographic nonce (timestamp + random)' },
        { name: 'Supported Ciphers', val: 'TLS_AES_256_GCM_SHA384, TLS_CHACHA20_POLY1305_SHA256' },
        { name: 'supported_versions extension', val: 'TLS 1.3 (0x0304) preferred' },
        { name: 'key_share extension', val: 'Curve25519 / P-256 public ephemeral share' },
        { name: 'server_name (SNI)', val: 'portal.secure-bank.edu' }
      ],
      explanation: 'In TLS 1.3, the client speculatively generates and sends an ephemeral ECDH key share in the Client Hello. This critical innovation reduces handshake latency from 2 round trips down to 1-RTT.'
    },
    {
      index: 2,
      name: 'Server Hello',
      sender: 'Server',
      receiver: 'Client (Browser)',
      direction: 'S2C',
      purpose: 'Confirms selected protocol version (TLS 1.3), chosen cipher suite, server random nonce, and server key share.',
      fields: [
        { name: 'Selected Version', val: 'TLS 1.3 (0x0304)' },
        { name: 'Selected Cipher Suite', val: 'TLS_AES_256_GCM_SHA384' },
        { name: 'Server Random', val: '32-byte server nonce' },
        { name: 'key_share extension', val: 'Server Curve25519 ephemeral public share' }
      ],
      explanation: 'At this exact moment, both client and server possess each other’s public key shares. Both sides independently derive the master shared secret. From this point forward, all subsequent handshake messages are encrypted!'
    },
    {
      index: 3,
      name: 'Encrypted Extensions',
      sender: 'Server',
      receiver: 'Client (Browser)',
      direction: 'S2C',
      purpose: 'Transmits server extension parameters that do not affect cryptographic key derivation under encryption.',
      fields: [
        { name: 'Encryption State', val: 'ENCRYPTED with Handshake Traffic Key' },
        { name: 'ALPN Extension', val: 'h2 (HTTP/2) negotiated' },
        { name: 'Early Data Indication', val: 'Rejected / Accepted' },
        { name: 'Max Fragment Length', val: '2^14 bytes' }
      ],
      explanation: 'Unlike TLS 1.2 where extensions were exposed in cleartext, TLS 1.3 encrypts all non-cryptographic configuration extensions to prevent passive surveillance and protocol fingerprinting.'
    },
    {
      index: 4,
      name: 'Certificate',
      sender: 'Server',
      receiver: 'Client (Browser)',
      direction: 'S2C',
      purpose: 'Provides the server’s X.509 digital certificate chain to establish authentic identity.',
      fields: [
        { name: 'Encryption State', val: 'ENCRYPTED with Handshake Traffic Key' },
        { name: 'Certificate Format', val: 'X.509 v3 Chain (Leaf -> Intermediate -> Root)' },
        { name: 'Server Identity', val: 'CN=portal.secure-bank.edu' },
        { name: 'Server Public Key', val: 'RSA 2048-bit or ECDSA P-256' }
      ],
      explanation: 'In TLS 1.3, the server certificate is transmitted inside the encrypted handshake tunnel, concealing the server identity and certificate contents from wire sniffers.'
    },
    {
      index: 5,
      name: 'Certificate Verify',
      sender: 'Server',
      receiver: 'Client (Browser)',
      direction: 'S2C',
      purpose: 'Server proves ownership of the private key corresponding to the public key inside the certificate.',
      fields: [
        { name: 'Signature Scheme', val: 'rsa_pss_rsae_sha256' },
        { name: 'Signed Data', val: 'SHA-256 Transcript Hash of all prior messages' },
        { name: 'Proof Type', val: 'Digital Signature (Non-repudiation)' }
      ],
      explanation: 'The server signs the entire handshake transcript using its private key. Because the browser validates this signature with the certificate’s public key, this definitively proves the server is genuine.'
    },
    {
      index: 6,
      name: 'Finished (Server)',
      sender: 'Server',
      receiver: 'Client (Browser)',
      direction: 'S2C',
      purpose: 'Provides a Message Authentication Code (MAC) over the entire handshake transcript to verify integrity.',
      fields: [
        { name: 'MAC Construction', val: 'HMAC-SHA384(server_finished_key, TranscriptHash)' },
        { name: 'Verification Length', val: '32-48 bytes HMAC digest' },
        { name: 'Security Property', val: 'Authentication & Tamper-resistance' }
      ],
      explanation: 'The Finished message guarantees that no attacker modified any parameters (such as downgrading cipher suites) during the unauthenticated phase of the handshake.'
    },
    {
      index: 7,
      name: 'Finished (Client)',
      sender: 'Client (Browser)',
      receiver: 'Server',
      direction: 'C2S',
      purpose: 'Client confirms receipt and verifies the server Finished MAC, sealing the handshake from the client side.',
      fields: [
        { name: 'MAC Construction', val: 'HMAC-SHA384(client_finished_key, TranscriptHash)' },
        { name: 'Status', val: 'Handshake Mutually Verified' },
        { name: 'Key Transition', val: 'Transition to Application Traffic Keys' }
      ],
      explanation: 'With both Finished messages verified, client and server switch from Handshake Traffic Keys to permanent Application Traffic Keys for normal web browsing.'
    },
    {
      index: 8,
      name: 'Application Data',
      sender: 'Bi-directional (Client <-> Server)',
      receiver: 'Bi-directional',
      direction: 'TUNNEL',
      purpose: 'Transmits encrypted HTTP requests and responses (HTTPS) using symmetric AEAD ciphers.',
      fields: [
        { name: 'Cipher Mode', val: 'AES-256-GCM / ChaCha20-Poly1305' },
        { name: 'Authenticated Tag', val: '128-bit integrity tag appended to every record' },
        { name: 'Forward Secrecy', val: 'Active (Session keys erased upon connection close)' },
        { name: 'HTTPS Status', val: 'Secure Padlock Active' }
      ],
      explanation: 'Every HTTP packet is encrypted for confidentiality and authenticated with an AEAD tag to prevent bit-flipping and tampering.'
    }
  ];

  // ============================================================================
  // FEATURE 2: LIVE PACKET INSPECTOR LOGGER
  // ============================================================================
  function getTimestamp() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  function logPacket(direction, msgType, detail, isSecure) {
    if (!packetLogBody) return;
    const entry = document.createElement('div');
    entry.className = 'log-entry';

    let tagClass = 'tag-sys';
    let tagText = 'SYS';

    if (direction === 'C2S') {
      tagClass = 'tag-c2s';
      tagText = 'CLIENT → SERVER';
    } else if (direction === 'S2C') {
      tagClass = 'tag-s2c';
      tagText = 'SERVER → CLIENT';
    } else if (isSecure || direction === 'TUNNEL') {
      tagClass = 'tag-secure';
      tagText = 'HTTPS TUNNEL';
    }

    entry.innerHTML = `
      <span class="log-time">[${getTimestamp()}]</span>
      <span class="log-tag ${tagClass}">${tagText}</span>
      <span class="log-content"><strong>${msgType}</strong> &mdash; ${detail}</span>
    `;

    packetLogBody.appendChild(entry);
    packetLogBody.scrollTop = packetLogBody.scrollHeight;
  }

  function clearPacketLog() {
    if (!packetLogBody) return;
    packetLogBody.innerHTML = `
      <div class="log-entry system-msg">
        <span class="log-time">[${getTimestamp()}]</span>
        <span class="log-tag tag-sys">SYS</span>
        <span class="log-content">Packet log cleared by operator. Monitor running.</span>
      </div>
    `;
    playCyberTone('packet');
  }

  // ============================================================================
  // FEATURE 10: TELEMETRY SOC DASHBOARD UPDATER
  // ============================================================================
  function updateSocDashboard(step) {
    if (!socHandshakeStatus) return;

    if (activeMode === 'overview') {
      socMsgCounter.textContent = `${step} / 5`;
      socProtocolVal.textContent = 'TLS 1.3';
    } else {
      socMsgCounter.textContent = `${activeMsgIdx} / 8`;
    }

    if (step === 1) {
      socHandshakeStatus.textContent = 'Negotiation Active';
      socHandshakeIndicator.className = 'tele-status-indicator amber';
      socHandshakeSub.textContent = 'Client Hello dispatched';
      socCertStatus.textContent = 'Pending Verification';
      socCertIndicator.className = 'tele-status-indicator muted';
      socKeyStatus.textContent = 'Key Shares Proposed';
      socKeyIndicator.className = 'tele-status-indicator blue';
      socEncStatus.textContent = 'Plaintext (Negotiating)';
      socEncIndicator.className = 'tele-status-indicator amber';
      socCurrentStageText.textContent = 'Client Hello';
    } else if (step === 2) {
      socHandshakeStatus.textContent = 'Parameters Agreed';
      socHandshakeIndicator.className = 'tele-status-indicator amber';
      socHandshakeSub.textContent = 'Cipher: AES_256_GCM';
      socCertStatus.textContent = 'Certificate Sent';
      socCertIndicator.className = 'tele-status-indicator blue';
      socKeyStatus.textContent = 'Server Share Received';
      socKeyIndicator.className = 'tele-status-indicator blue';
      socEncStatus.textContent = 'Deriving Handshake Keys';
      socEncIndicator.className = 'tele-status-indicator amber';
      socCurrentStageText.textContent = 'Server Hello';
    } else if (step === 3) {
      socHandshakeStatus.textContent = 'Authentication Phase';
      socHandshakeIndicator.className = 'tele-status-indicator amber';
      socHandshakeSub.textContent = 'X.509 Chain Verification';
      socCertStatus.textContent = 'Verified Authentic';
      socCertIndicator.className = 'tele-status-indicator green';
      socKeyStatus.textContent = 'ECDHE In Progress';
      socKeyIndicator.className = 'tele-status-indicator blue';
      socEncStatus.textContent = 'Encrypted Extensions';
      socEncIndicator.className = 'tele-status-indicator amber';
      socCurrentStageText.textContent = 'Certificate Auth';
    } else if (step === 4) {
      socHandshakeStatus.textContent = 'Secret Established';
      socHandshakeIndicator.className = 'tele-status-indicator blue';
      socHandshakeSub.textContent = 'ECDHE Derivation Done';
      socCertStatus.textContent = 'Verified Authentic';
      socCertIndicator.className = 'tele-status-indicator green';
      socKeyStatus.textContent = 'Session Keys Ready';
      socKeyIndicator.className = 'tele-status-indicator green';
      socEncStatus.textContent = 'Finished MAC Verified';
      socEncIndicator.className = 'tele-status-indicator green';
      socCurrentStageText.textContent = 'Key Establishment';
    } else if (step === 5) {
      socHandshakeStatus.textContent = 'Completed (Secure)';
      socHandshakeIndicator.className = 'tele-status-indicator green';
      socHandshakeSub.textContent = 'Zero Handshake Vulnerabilities';
      socCertStatus.textContent = 'Verified Authentic';
      socCertIndicator.className = 'tele-status-indicator green';
      socKeyStatus.textContent = 'Active (AES-256-GCM)';
      socKeyIndicator.className = 'tele-status-indicator green';
      socEncStatus.textContent = 'AES-GCM Tunnel Active';
      socEncIndicator.className = 'tele-status-indicator green';
      socCurrentStageText.textContent = 'Secure HTTPS Tunnel';
    }
  }

  // ============================================================================
  // FEATURE 8: TIMELINE UPDATER
  // ============================================================================
  function updateTimeline(step) {
    const pct = Math.round((step / TOTAL_STEPS) * 100);
    if (timelinePct) timelinePct.textContent = `${pct}%`;
    if (timelineFill) timelineFill.style.height = `${pct}%`;
    if (sidebarTimelinePct) sidebarTimelinePct.textContent = `${pct}%`;
    if (fullTimelinePct) fullTimelinePct.textContent = `${pct}% Completed`;
    if (fullTimelineFill) fullTimelineFill.style.width = `${pct}%`;

    verticalTimelineItems.forEach((item) => {
      const itemStep = parseInt(item.getAttribute('data-step-ref'), 10);
      item.classList.remove('active', 'completed');
      if (itemStep < step) {
        item.classList.add('completed');
      } else if (itemStep === step) {
        item.classList.add('active');
      }
    });

    tfStepCards.forEach((card) => {
      const cardStep = parseInt(card.getAttribute('data-step-ref'), 10);
      card.classList.remove('active', 'completed');
      if (cardStep < step) {
        card.classList.add('completed');
      } else if (cardStep === step) {
        card.classList.add('active');
      }
    });
  }

  // ============================================================================
  // 5-STAGE CONCEPTUAL OVERVIEW CONTROLLER (PRESERVED)
  // ============================================================================
  function renderOverviewStep(step) {
    currentStep = step;
    playCyberTone(step === 5 ? 'success' : 'packet');

    // Stepper nodes
    stepNodes.forEach((node, idx) => {
      const stepIdx = idx + 1;
      node.classList.remove('active', 'completed');
      if (stepIdx < currentStep) {
        node.classList.add('completed');
      } else if (stepIdx === currentStep) {
        node.classList.add('active');
      }
    });

    const progressPercent = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;
    if (stepperProgressLine) {
      const styleEl = document.getElementById('dynamicStepperLine') || document.createElement('style');
      styleEl.id = 'dynamicStepperLine';
      styleEl.innerHTML = `.stepper-line::after { width: ${progressPercent}% !important; }`;
      document.head.appendChild(styleEl);
    }

    // Step Views
    stepViews.forEach((view, idx) => {
      view.classList.toggle('active', idx + 1 === currentStep);
    });

    // Reset arena
    arrowC2S.classList.remove('animating');
    arrowS2C.classList.remove('animating');
    tunnelMesh.classList.remove('active');
    clientCard.classList.remove('active-node');
    serverCard.classList.remove('active-node');

    switch (currentStep) {
      case 1:
        clientCard.classList.add('active-node');
        clientStatusBadge.textContent = 'Sending Hello';
        clientStatusBadge.className = 'status-indicator active';
        serverStatusBadge.textContent = 'Awaiting';
        serverStatusBadge.className = 'status-indicator ready';

        browserOmnibar.classList.remove('secured');
        omnibarScheme.textContent = 'http://';
        omnibarStatus.textContent = 'Handshake Initializing';
        omnibarStatus.style.color = 'var(--amber-warning)';

        arrowC2S.classList.add('animating');
        packetLabelC2S.textContent = 'Client Hello';
        channelStatus.textContent = 'Client → Server';
        transText.textContent = 'Sending Client Hello: Proposed TLS 1.3/1.2, 3 Cipher Suites, Client Nonce.';

        clientSelectedTls.textContent = 'TLS 1.3, TLS 1.2';
        clientCipherSuites.textContent = '3 proposed';
        clientRandomVal.textContent = '0x7F8C4A91E2055B...';
        clientKeyShare.textContent = 'x25519: 0x4B9E1...';
        clientSessionKey.textContent = 'Not established';

        serverSelectedTls.textContent = 'Awaiting Hello...';
        serverSelectedCipher.textContent = 'None';
        serverRandomVal.textContent = 'Awaiting client...';
        serverKeyShare.textContent = 'Pending...';
        serverSessionKey.textContent = 'Not established';

        logPacket('C2S', 'CLIENT_HELLO', 'TLS 1.3, CipherSuites=[TLS_AES_256_GCM_SHA384], KeyShare=x25519', false);
        activeHandshakeStartMs = performance.now();
        if (analyticsState.connections[0]) {
          analyticsState.connections[0].status = 'Step 1 (Client Hello)';
          analyticsState.connections[0].statusType = 'warn';
        }
        break;

      case 2:
        serverCard.classList.add('active-node');
        clientStatusBadge.textContent = 'Listening';
        clientStatusBadge.className = 'status-indicator ready';
        serverStatusBadge.textContent = 'Sending Hello';
        serverStatusBadge.className = 'status-indicator active';

        browserOmnibar.classList.remove('secured');
        omnibarScheme.textContent = 'http://';
        omnibarStatus.textContent = 'Negotiating Ciphers';

        arrowS2C.classList.add('animating');
        packetLabelS2C.textContent = 'Server Hello';
        channelStatus.textContent = 'Server → Client';
        transText.textContent = 'Sending Server Hello: Selected TLS 1.3, TLS_AES_256_GCM_SHA384, Server Nonce.';

        serverSelectedTls.textContent = 'TLS 1.3 (Agreed)';
        serverSelectedCipher.textContent = 'TLS_AES_256_GCM_SHA384';
        serverRandomVal.textContent = '0xE4D30B27618AA9...';
        serverKeyShare.textContent = 'x25519: 0x82A1C...';
        serverSessionKey.textContent = 'Not established';

        logPacket('S2C', 'SERVER_HELLO', 'TLS 1.3 Selected, Cipher=TLS_AES_256_GCM_SHA384, ServerKeyShare=x25519', false);
        break;

      case 3:
        clientCard.classList.add('active-node');
        serverCard.classList.add('active-node');
        clientStatusBadge.textContent = 'Verifying Cert';
        clientStatusBadge.className = 'status-indicator active';
        serverStatusBadge.textContent = 'Cert Delivered';
        serverStatusBadge.className = 'status-indicator ready';

        browserOmnibar.classList.remove('secured');
        omnibarScheme.textContent = 'http://';
        omnibarStatus.textContent = 'Validating CA Sign';

        arrowS2C.classList.add('animating');
        packetLabelS2C.textContent = 'X.509 Certificate';
        channelStatus.textContent = 'Server → Client (Cert)';
        transText.textContent = 'Transmitting X.509 Certificate: DigiCert CA Signature Verified Authentic.';

        logPacket('S2C', 'CERTIFICATE', 'Subject=portal.secure-bank.edu, Issuer=DigiCert Global Root G2', false);
        logPacket('C2S', 'CERT_VERIFY_SUCCESS', 'CA cryptographic signature chain strictly validated', false);
        break;

      case 4:
        clientCard.classList.add('active-node');
        serverCard.classList.add('active-node');
        clientStatusBadge.textContent = 'Deriving Key';
        clientStatusBadge.className = 'status-indicator active';
        serverStatusBadge.textContent = 'Deriving Key';
        serverStatusBadge.className = 'status-indicator active';

        arrowC2S.classList.add('animating');
        arrowS2C.classList.add('animating');
        packetLabelC2S.textContent = 'Client KeyShare';
        packetLabelS2C.textContent = 'Server KeyShare';
        channelStatus.textContent = 'Bi-directional Key Share';
        transText.textContent = 'Exchanging ECDHE Key Shares: Computing shared secret without wire transmission.';

        const sessionKeyHex = '0x3F8A2D9B...71C04E6E';
        clientSessionKey.textContent = sessionKeyHex;
        serverSessionKey.textContent = sessionKeyHex;

        logPacket('C2S', 'FINISHED_CLIENT', 'Client Finished MAC verify_data computed via HKDF', false);
        logPacket('S2C', 'FINISHED_SERVER', 'Server Finished MAC verified. Session keys derived.', false);
        break;

      case 5:
        clientCard.classList.add('active-node');
        serverCard.classList.add('active-node');
        clientStatusBadge.textContent = 'Encrypted Tunnel';
        clientStatusBadge.className = 'status-indicator secure';
        serverStatusBadge.textContent = 'Encrypted Tunnel';
        serverStatusBadge.className = 'status-indicator secure';

        browserOmnibar.classList.add('secured');
        omnibarScheme.textContent = 'https://';
        omnibarStatus.textContent = 'Encrypted (TLS 1.3)';

        tunnelMesh.classList.add('active');
        channelStatus.textContent = 'AES-256-GCM Secure Channel';
        transText.textContent = 'Handshake Complete! Application data is encrypted and tamper-proof.';

        logPacket('TUNNEL', 'SECURE_APPLICATION_DATA', 'Hello! Your data is now protected. (AES-256-GCM AEAD tunnel)', true);
        updateLiveEncryptionDemo();

        const simDuration = Math.max(12, Math.round(performance.now() - activeHandshakeStartMs));
        analyticsState.handshakeCompleted = true;
        analyticsState.totalHandshakes++;
        analyticsState.successfulHandshakes++;
        analyticsState.handshakeDurations.push(simDuration);
        if (analyticsState.connections[0]) {
          analyticsState.connections[0].status = 'Encrypted (TLS 1.3)';
          analyticsState.connections[0].statusType = 'ok';
          analyticsState.connections[0].durationLabel = `${simDuration} ms (Simulated)`;
        }
        pushDashboardAlert('ok', 'TLS 1.3 Handshake completed & encrypted tunnel active.', 'tabSimulator', 'View Tunnel →');
        pushRecentActivity('TLS 1.3 Handshake Completed (Step 5)', 'SECURE', 'ok');
        if (typeof recordLabCompletion === 'function') recordLabCompletion('handshake', 'Completed TLS 1.3 Handshake');
        break;
    }

    btnPrev.disabled = currentStep === 1;
    btnNext.disabled = currentStep === TOTAL_STEPS;
    updateSocDashboard(currentStep);
    updateTimeline(currentStep);
    updatePresentationModalContent(currentStep);
    renderDashboardAnalytics();
  }

  // ============================================================================
  // DETAILED TLS 1.3 (8-MESSAGE) CONTROLLER
  // ============================================================================
  function renderDetailedMessage(msgIndex) {
    activeMsgIdx = msgIndex;
    const msg = TLS13_MESSAGES[msgIndex - 1];
    playCyberTone(msgIndex === 8 ? 'success' : 'packet');

    msgPills.forEach((pill) => {
      const idx = parseInt(pill.getAttribute('data-msg'), 10);
      pill.classList.toggle('active', idx === activeMsgIdx);
    });

    dmiMsgSeqBadge.textContent = `MESSAGE ${msg.index} OF 8 • TLS 1.3 SPEC (RFC 8446)`;
    dmiName.textContent = `${msg.index}. ${msg.name}`;
    dmiSender.textContent = `Sender: ${msg.sender}`;
    dmiReceiver.textContent = `Receiver: ${msg.receiver}`;
    dmiPurpose.textContent = msg.purpose;
    dmiExplanation.textContent = msg.explanation;

    dmiFieldsList.innerHTML = '';
    msg.fields.forEach((f) => {
      const row = document.createElement('div');
      row.className = 'dmi-field-row';
      row.innerHTML = `<span class="dfr-name">${f.name}:</span><span class="dfr-val">${f.val}</span>`;
      dmiFieldsList.appendChild(row);
    });

    arrowC2S.classList.remove('animating');
    arrowS2C.classList.remove('animating');
    tunnelMesh.classList.remove('active');
    clientCard.classList.remove('active-node');
    serverCard.classList.remove('active-node');

    if (msg.direction === 'C2S') {
      clientCard.classList.add('active-node');
      arrowC2S.classList.add('animating');
      packetLabelC2S.textContent = msg.name;
      channelStatus.textContent = 'Client → Server';
    } else if (msg.direction === 'S2C') {
      serverCard.classList.add('active-node');
      arrowS2C.classList.add('animating');
      packetLabelS2C.textContent = msg.name;
      channelStatus.textContent = 'Server → Client';
    } else if (msg.direction === 'TUNNEL') {
      clientCard.classList.add('active-node');
      serverCard.classList.add('active-node');
      tunnelMesh.classList.add('active');
      channelStatus.textContent = 'Bi-directional AES-GCM Tunnel';
    }

    transText.textContent = `[TLS 1.3] Msg ${msg.index}: ${msg.name} (${msg.sender} → ${msg.receiver})`;

    logPacket(
      msg.direction,
      msg.name.toUpperCase().replace(/\s+/g, '_'),
      msg.purpose,
      msg.direction === 'TUNNEL'
    );

    const mappedStep = Math.min(5, Math.max(1, Math.ceil((msg.index / 8) * 5)));
    updateSocDashboard(mappedStep);
    updateTimeline(mappedStep);

    btnPrev.disabled = activeMsgIdx === 1;
    btnNext.disabled = activeMsgIdx === 8;
  }

  // ============================================================================
  // STEPPING & PLAYBACK HANDLERS
  // ============================================================================
  function nextStep() {
    if (activeMode === 'overview') {
      if (currentStep < TOTAL_STEPS) {
        renderOverviewStep(currentStep + 1);
      } else if (toggleAutoPlay && toggleAutoPlay.checked) {
        renderOverviewStep(1);
      }
    } else {
      if (activeMsgIdx < 8) {
        renderDetailedMessage(activeMsgIdx + 1);
      } else if (toggleAutoPlay && toggleAutoPlay.checked) {
        renderDetailedMessage(1);
      }
    }
  }

  function prevStep() {
    if (activeMode === 'overview') {
      if (currentStep > 1) {
        renderOverviewStep(currentStep - 1);
      }
    } else {
      if (activeMsgIdx > 1) {
        renderDetailedMessage(activeMsgIdx - 1);
      }
    }
  }

  function resetHandshake() {
    if (toggleAutoPlay && toggleAutoPlay.checked) {
      toggleAutoPlay.checked = false;
      stopAutoPlay();
    }
    if (activeMode === 'overview') {
      renderOverviewStep(1);
    } else {
      renderDetailedMessage(1);
    }
    logPacket('SYS', 'RESET', 'Handshake simulation reset to step 1 by operator', false);
  }

  function startAutoPlay() {
    stopAutoPlay();
    autoPlayTimer = setInterval(() => {
      nextStep();
    }, 3200);
  }

  function stopAutoPlay() {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
  }

  // ============================================================================
  // FEATURE 3: DIGITAL CERTIFICATE INSPECTOR
  // ============================================================================
  const CERT_SCENARIOS = {
    valid: {
      status: 'VERIFIED AUTHENTIC',
      statusClass: 'verified',
      subject: 'portal.secure-bank.edu',
      san: 'DNS:portal.secure-bank.edu, DNS:*.secure-bank.edu',
      issuer: 'DigiCert Global Root G2 → Intermediate CA',
      serial: '0C:44:81:7A:B9:3F:82:11:40',
      validFrom: '2026-01-01 00:00:00 UTC',
      validUntil: '2027-01-01 23:59:59 UTC',
      title: 'Certificate Cryptographically Valid',
      desc: 'The signature chain was successfully verified against the browser’s trusted Root CA store. The subject domain strictly matches.',
      valid: true
    },
    expired: {
      status: 'CERTIFICATE EXPIRED',
      statusClass: 'invalid',
      subject: 'portal.secure-bank.edu',
      san: 'DNS:portal.secure-bank.edu',
      issuer: 'DigiCert Global Root G2',
      serial: '0E:12:44:99:A1:3F:00:22',
      validFrom: '2023-01-01 00:00:00 UTC',
      validUntil: '2024-01-01 23:59:59 UTC (EXPIRED)',
      title: 'Security Alert: Certificate Expired',
      desc: 'The certificate validity period ended on 2024-01-01. The browser rejects this connection to prevent replay and stale credential misuse.',
      valid: false
    },
    fake_ca: {
      status: 'UNTRUSTED ROOT CA',
      statusClass: 'invalid',
      subject: 'portal.secure-bank.edu',
      san: 'DNS:portal.secure-bank.edu',
      issuer: 'HackerCorp Untrusted Rogue CA',
      serial: '66:66:66:66:66:66:66:66',
      validFrom: '2026-01-01 00:00:00 UTC',
      validUntil: '2027-01-01 23:59:59 UTC',
      title: 'Critical Warning: Untrusted Certificate Authority',
      desc: 'The issuer "HackerCorp Untrusted Rogue CA" is not in the browser’s Root CA trust store. Potential Man-in-the-Middle (MITM) interception!',
      valid: false
    },
    mismatch: {
      status: 'HOSTNAME MISMATCH',
      statusClass: 'invalid',
      subject: 'attacker-portal.evil-phish.net',
      san: 'DNS:evil-phish.net, DNS:*.evil-phish.net',
      issuer: 'DigiCert Global Root G2',
      serial: '19:AA:BB:CC:DD:EE:FF:00',
      validFrom: '2026-01-01 00:00:00 UTC',
      validUntil: '2027-01-01 23:59:59 UTC',
      title: 'Security Alert: Domain Name Mismatch',
      desc: 'The certificate belongs to "evil-phish.net", but the client requested "portal.secure-bank.edu". Phishing attack detected.',
      valid: false
    }
  };

  function updateCertScenario() {
    const key = certScenarioSelect ? certScenarioSelect.value : 'valid';
    const sc = CERT_SCENARIOS[key];
    if (!sc) return;

    cvSubject.textContent = sc.subject;
    cvSAN.textContent = sc.san;
    cvIssuer.textContent = sc.issuer;
    cvSerialNumber.textContent = sc.serial;
    cvValidFrom.textContent = sc.validFrom;
    cvValidUntil.textContent = sc.validUntil;

    cvStatusBadge.className = 'cv-status-badge';
    cvStatusText.textContent = 'STATUS: READY TO VERIFY';
    certViewerCard.classList.remove('invalid-state');
    cvResultBox.className = 'cv-result-box';
    cvrTitle.textContent = 'Awaiting Cryptographic Signature Check';
    cvrDesc.textContent = 'Click "Verify Certificate" to validate the signature against the Root CA trust chain.';
    chainRoot.className = 'chain-node';
    chainInter.className = 'chain-node';
    chainLeaf.className = 'chain-node';
  }

  function verifyCertificateAction() {
    const key = certScenarioSelect ? certScenarioSelect.value : 'valid';
    const sc = CERT_SCENARIOS[key];
    if (!sc) return;

    if (sc.valid) {
      playCyberTone('success');
      cvStatusBadge.className = 'cv-status-badge verified';
      cvStatusText.textContent = sc.status;
      certViewerCard.classList.remove('invalid-state');
      cvResultBox.className = 'cv-result-box';
      cvrTitle.textContent = sc.title;
      cvrDesc.textContent = sc.desc;
      chainRoot.className = 'chain-node active';
      chainInter.className = 'chain-node active';
      chainLeaf.className = 'chain-node active';
      logPacket('SYS', 'CERT_INSPECTION', `Certificate verification PASSED: ${sc.subject} matches DigiCert Root`, false);

      analyticsState.certStatus = 'valid';
      analyticsState.certCounts.valid++;
      pushDashboardAlert('ok', `X.509 certificate verified authentic for ${sc.subject}`, 'tabCertificate', 'View Certificate →');
      pushRecentActivity(`Certificate Verified (${sc.subject})`, 'VALID', 'ok');
      renderDashboardAnalytics();
    } else {
      playCyberTone('error');
      cvStatusBadge.className = 'cv-status-badge invalid';
      cvStatusText.textContent = sc.status;
      certViewerCard.classList.add('invalid-state');
      cvResultBox.className = 'cv-result-box invalid';
      cvrTitle.textContent = sc.title;
      cvrDesc.textContent = sc.desc;
      chainRoot.className = key === 'fake_ca' ? 'chain-node broken' : 'chain-node';
      chainInter.className = 'chain-node broken';
      chainLeaf.className = 'chain-node broken';
      logPacket('SYS', 'CERT_REJECTED', `Certificate verification FAILED: ${sc.status}`, false);

      analyticsState.certStatus = 'invalid';
      if (key === 'expired') analyticsState.certCounts.expired++;
      else if (key === 'fake_ca') analyticsState.certCounts.selfSigned++;
      else analyticsState.certCounts.warnings++;
      analyticsState.failedHandshakes++;
      analyticsState.totalHandshakes++;
      pushDashboardAlert('crit', `Certificate verification failed: ${sc.status} (${sc.subject})`, 'tabCertificate', 'Review Failure →');
      pushRecentActivity(`Certificate Rejected: ${sc.status}`, 'FAILED', 'crit');
      renderDashboardAnalytics();
    }
  }

  // ============================================================================
  // FEATURE 4: NATIVE WEB CRYPTO API - ECDHE KEY AGREEMENT
  // ============================================================================
  function buf2hex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
  }

  async function runWebCryptoEcdhDemo() {
    if (!window.crypto || !window.crypto.subtle) {
      ecdhSharedSecret.textContent = 'Web Crypto API not supported in this environment.';
      return;
    }

    try {
      playCyberTone('packet');
      ecdhAgreedChip.textContent = 'Generating P-256 Keys...';
      const t0 = performance.now();

      cachedClientKeyPair = await window.crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveBits']
      );

      cachedServerKeyPair = await window.crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveBits']
      );

      const clientPubRaw = await window.crypto.subtle.exportKey('raw', cachedClientKeyPair.publicKey);
      const serverPubRaw = await window.crypto.subtle.exportKey('raw', cachedServerKeyPair.publicKey);

      ecdhClientPub.textContent = buf2hex(clientPubRaw).substring(0, 72) + '... (65 bytes uncompressed)';
      ecdhServerPub.textContent = buf2hex(serverPubRaw).substring(0, 72) + '... (65 bytes uncompressed)';

      const clientSharedBits = await window.crypto.subtle.deriveBits(
        { name: 'ECDH', public: cachedServerKeyPair.publicKey },
        cachedClientKeyPair.privateKey,
        256
      );

      const serverSharedBits = await window.crypto.subtle.deriveBits(
        { name: 'ECDH', public: cachedClientKeyPair.publicKey },
        cachedServerKeyPair.privateKey,
        256
      );

      const clientHex = buf2hex(clientSharedBits);
      const serverHex = buf2hex(serverSharedBits);

      if (clientHex === serverHex) {
        const ecdhMs = Math.max(1, Math.round((performance.now() - t0) * 10) / 10);
        playCyberTone('success');
        ecdhAgreedChip.textContent = 'ECDH Agreed (Curve P-256)';
        ecdhMatchStatus.innerHTML = '&check; Matched Exactly (256 bits)';
        ecdhSharedSecret.textContent = clientHex;
        logPacket('SYS', 'ECDH_KEY_DERIVATION', 'Independent ECDH derivation matched: ' + clientHex.substring(0, 24) + '...', false);

        analyticsState.ecdhVerified = true;
        analyticsState.ecdhDurationMs = ecdhMs;
        pushRecentActivity(`Web Crypto P-256 ECDH Agreement (${ecdhMs} ms)`, 'VERIFIED', 'ok');
        if (typeof recordLabCompletion === 'function') recordLabCompletion('ecdh', 'Executed ECDHE P-256 Key Agreement');
        renderDashboardAnalytics();
      } else {
        ecdhSharedSecret.textContent = 'Error: Derived secrets did not match.';
      }
    } catch (err) {
      ecdhSharedSecret.textContent = 'ECDH derivation error: ' + err.message;
    }
  }

  // ============================================================================
  // FEATURE 5: NATIVE WEB CRYPTO API - AES-128/256-GCM ENCRYPT & DECRYPT
  // ============================================================================
  const cryptoHistoryEntries = [];

  function logCryptoExperiment(algo, detail, badge = 'OK') {
    cryptoHistoryEntries.unshift({ title: `[${algo}] ${detail}`, time: getTimestamp(), badge });
    if (cryptoHistoryEntries.length > 15) cryptoHistoryEntries.pop();
    const feed = document.getElementById('cryptoHistoryFeed');
    if (feed) {
      if (cryptoHistoryEntries.length === 0) {
        feed.innerHTML = '<div class="activity-item"><span class="act-title">Run any experiment to record real cryptographic operations.</span></div>';
      } else {
        feed.innerHTML = cryptoHistoryEntries.map((item) => `
          <div class="activity-item">
            <div class="act-left">
              <span class="act-title">${item.title}</span>
              <span class="act-time">${item.time}</span>
            </div>
            <span class="conn-status-pill ${item.badge === 'ERR' ? 'err' : 'ok'}">${item.badge}</span>
          </div>
        `).join('');
      }
    }
  }

  async function generateAesKeyAction() {
    if (!window.crypto || !window.crypto.subtle) return;
    const bits = parseInt(document.getElementById('aesKeyBitsSelect')?.value || '256', 10);
    cachedAesKey = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: bits },
      true,
      ['encrypt', 'decrypt']
    );
    const rawKey = await window.crypto.subtle.exportKey('raw', cachedAesKey);
    const keyEl = document.getElementById('aesKeyVal');
    if (keyEl) keyEl.textContent = buf2hex(rawKey);
    playCyberTone('packet');
    logCryptoExperiment(`AES-${bits}-GCM`, `Generated ${bits}-bit CSPRNG key`, 'KEY');
  }

  async function runWebCryptoAesEncrypt() {
    if (!window.crypto || !window.crypto.subtle) return;
    try {
      const plaintext = aesInputPlaintext ? aesInputPlaintext.value : '';
      if (!plaintext.trim()) {
        aesCipherVal.textContent = 'Error: Please enter a non-empty plaintext message.';
        playCyberTone('error');
        return;
      }
      const bits = parseInt(document.getElementById('aesKeyBitsSelect')?.value || '256', 10);
      const enc = new TextEncoder();
      const data = enc.encode(plaintext);

      const t0 = performance.now();
      if (!cachedAesKey || cachedAesKey.algorithm.length !== bits) {
        await generateAesKeyAction();
      }

      cachedAesIv = window.crypto.getRandomValues(new Uint8Array(12));
      aesIvVal.textContent = buf2hex(cachedAesIv.buffer);

      cachedCipherBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: cachedAesIv },
        cachedAesKey,
        data
      );

      // Web Crypto AES-GCM appends the 16-byte (128-bit) auth tag at the end
      const fullBytes = new Uint8Array(cachedCipherBuffer);
      const cipherOnly = fullBytes.slice(0, Math.max(0, fullBytes.length - 16));
      const tagOnly = fullBytes.slice(Math.max(0, fullBytes.length - 16));

      const aesMs = Math.max(1, Math.round((performance.now() - t0) * 10) / 10);
      playCyberTone('packet');
      aesCipherVal.textContent = buf2hex(cipherOnly.buffer);
      const tagEl = document.getElementById('aesTagVal');
      if (tagEl) tagEl.textContent = buf2hex(tagOnly.buffer);
      aesDecryptedVal.textContent = 'Ready for decryption. Click "Decrypt".';
      btnAesDecrypt.disabled = false;

      analyticsState.aesVerified = true;
      analyticsState.aesDurationMs = aesMs;
      pushRecentActivity(`AES-${bits}-GCM Encryption (${aesMs} ms)`, 'ENCRYPTED', 'ok');
      if (typeof recordLabCompletion === 'function') recordLabCompletion('aes', `Executed AES-${bits}-GCM Encryption`);
      logCryptoExperiment(`AES-${bits}-GCM`, `Encrypted ${data.byteLength}B payload (${aesMs} ms)`, 'ENC');
      renderDashboardAnalytics();

      logPacket('SYS', 'AES_GCM_ENCRYPT', `Ciphertext length: ${cachedCipherBuffer.byteLength} bytes with 128-bit tag`, true);
    } catch (err) {
      aesCipherVal.textContent = 'Encryption error: ' + err.message;
      playCyberTone('error');
    }
  }

  async function runWebCryptoAesDecrypt() {
    if (!cachedAesKey || !cachedCipherBuffer || !cachedAesIv) return;
    try {
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: cachedAesIv },
        cachedAesKey,
        cachedCipherBuffer
      );

      const dec = new TextDecoder();
      const plain = dec.decode(decryptedBuffer);

      playCyberTone('success');
      aesDecryptedVal.textContent = `✓ Decrypted: "${plain}"`;
      logCryptoExperiment('AES-GCM', `Decrypted & verified 128-bit auth tag`, 'DEC');
      logPacket('SYS', 'AES_GCM_DECRYPT', `Decryption authenticated successfully: "${plain.substring(0, 30)}..."`, true);
    } catch (err) {
      aesDecryptedVal.textContent = 'Authentication Tag Verification Failed! Data was tampered with.';
      logCryptoExperiment('AES-GCM', 'Auth tag verification failed', 'ERR');
      playCyberTone('error');
    }
  }

  function updateLiveEncryptionDemo() {
    if (!demoPlaintext) return;
    const text = demoPlaintext.value;
    dispPlaintext.textContent = text || '(empty request)';
    let hex = '';
    for (let i = 0; i < text.length; i++) {
      const c = (text.charCodeAt(i) * 37 + 19) % 256;
      hex += c.toString(16).padStart(2, '0') + ' ';
    }
    dispCiphertext.textContent = hex.trim() || '00 00';
    dispDecrypted.textContent = text || '(empty request)';
  }

  // ============================================================================
  // FEATURE 6: TLS 1.2 VS TLS 1.3 COMPARISON & CHART.JS
  // ============================================================================
  function updateProtocolComparison(version) {
    analyticsState.selectedProtocol = version;
    if (version === '1.2') {
      btnSelectTls12.classList.add('active');
      btnSelectTls13.classList.remove('active');
      pbcBadge.textContent = 'TLS 1.2 (RFC 5246 - Legacy)';
      pbcTitle.textContent = 'Traditional 2-RTT Handshake with Optional Forward Secrecy';
      pbcDesc.textContent = 'TLS 1.2 requires two full round-trips before application data can be sent. It allowed static RSA key exchange (no forward secrecy) and insecure CBC cipher modes vulnerable to padding oracle attacks.';
      pbcRttStat.textContent = '2 RTT';
      pbcCiphersStat.textContent = '37+ Ciphers';
      pbcFsStat.textContent = 'Optional';

      analyticsState.tls12Count++;
      pushDashboardAlert('warn', 'Legacy TLS 1.2 selected in comparison (2-RTT, optional PFS).', 'tabComparison', 'Compare TLS 1.3 →');
      pushRecentActivity('Switched protocol analysis to TLS 1.2', 'LEGACY', 'warn');
    } else {
      btnSelectTls13.classList.add('active');
      btnSelectTls12.classList.remove('active');
      pbcBadge.textContent = 'TLS 1.3 (RFC 8446 - Modern)';
      pbcTitle.textContent = 'Ultra-Fast 1-RTT Handshake with Zero-Round-Trip Resumption';
      pbcDesc.textContent = 'TLS 1.3 eliminates the second round-trip by sending Diffie-Hellman key shares in the initial Client Hello. All legacy weak ciphers (RSA, RC4, 3DES, CBC) were completely removed.';
      pbcRttStat.textContent = '1 RTT';
      pbcCiphersStat.textContent = '5 Ciphers';
      pbcFsStat.textContent = '100% Mandatory';

      analyticsState.tls13Count++;
      pushRecentActivity('Verified TLS 1.3 modern profile', 'OPTIMAL', 'ok');
    }
    renderDashboardAnalytics();
    playCyberTone('packet');
  }

  function initChartJs() {
    const ctx = document.getElementById('tlsLatencyChart');
    if (!ctx || typeof Chart === 'undefined') return;

    if (latencyChartInstance) {
      latencyChartInstance.destroy();
    }

    latencyChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['TCP Handshake', 'TLS Handshake', '1st HTTP Request', 'Total Handshake Latency'],
        datasets: [
          {
            label: 'TLS 1.2 (Legacy 2-RTT)',
            data: [100, 200, 100, 400],
            backgroundColor: 'rgba(245, 158, 11, 0.7)',
            borderColor: '#f59e0b',
            borderWidth: 1
          },
          {
            label: 'TLS 1.3 (Modern 1-RTT)',
            data: [100, 100, 100, 300],
            backgroundColor: 'rgba(255, 102, 133, 0.78)',
            borderColor: '#FF6685',
            borderWidth: 1
          },
          {
            label: 'TLS 1.3 (0-RTT Resumption)',
            data: [100, 0, 100, 200],
            backgroundColor: 'rgba(16, 185, 129, 0.75)',
            borderColor: '#10b981',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Milliseconds (ms)', color: '#D1B8C2' },
            ticks: { color: '#D1B8C2' },
            grid: { color: 'rgba(120, 51, 79, 0.42)' }
          },
          x: {
            ticks: { color: '#D1B8C2' },
            grid: { color: 'rgba(120, 51, 79, 0.42)' }
          }
        },
        plugins: {
          legend: {
            labels: { color: '#FFFFFF', font: { family: 'Inter', size: 11 } }
          }
        }
      }
    });
  }

  // ============================================================================
  // FEATURE 7: CYBERSECURITY ATTACK PLAYGROUND (6 ISOLATED SIMULATIONS)
  // ============================================================================
  const ATTACK_DATA = {
    mitm: {
      type: 'SIMULATION 1 OF 6',
      title: 'Man-in-the-Middle (MITM) Attack',
      label: 'MITM Interceptor',
      what: 'An attacker secretly intercepts and relays communications between client and server without either party knowing.',
      how: 'In this isolated simulation, the attacker injects a rogue proxy between Client and Server, attempting to swap public keys and read sample plaintext.',
      defense: 'TLS mandates <strong>X.509 Certificate Verification</strong> and <strong>CertificateVerify</strong>. Without the authentic server private key, the rogue proxy fails signature checks and is blocked.',
      beforeText: 'HTTP Plaintext: "GET /sample-balance?id=101" -> Rogue Proxy reads & alters response!',
      afterText: 'TLS 1.3: Rogue Cert rejected by Root CA trust store -> Connection aborted safely.',
      objectives: ['Understand how a MITM proxy intercepts unauthenticated channels.', 'See how X.509 + CertificateVerify prevents impersonation.'],
      steps: [
        'Step 1/3: Client sends sample request "GET /sample-demo" toward Server.',
        'Step 2/3: Simulated MITM Proxy intercepts packet and presents an untrusted key.',
        'Step 3/3: Browser checks DigiCert Root CA -> Signature Invalid -> MITM Blocked!'
      ],
      check: { q: 'Which TLS step stops a MITM attacker from impersonating a server?', opts: ['TCP 3-way handshake', 'X.509 Certificate & CertificateVerify signature check', 'Base64 encoding'], ans: 1, exp: 'CertificateVerify proves the server holds the private key matching its CA-signed certificate.' }
    },
    replay: {
      type: 'SIMULATION 2 OF 6',
      title: 'Replay Attack Simulator',
      label: 'Replay Packet Injector',
      what: 'An attacker records a legitimate encrypted transmission and re-transmits it later to repeat an action.',
      how: 'The simulation captures a harmless sample token message ("TRANSFER_DEMO_TOKEN_42") and attempts to replay the identical packet a second time.',
      defense: 'TLS incorporates fresh <strong>32-byte Client/Server Random Nonces</strong> and incrementing <strong>64-bit Record Sequence Numbers</strong>. Replayed packets fail AEAD nonce verification and are dropped.',
      beforeText: 'No Nonce/Seq Check: Replayed "DEMO_ACTION_#42" accepted twice by server!',
      afterText: 'TLS 1.3: Expected Seq #43, received #42 -> AEAD GCM Tag Mismatch -> Dropped!',
      objectives: ['Observe how replay attacks work without decrypting payloads.', 'Understand how nonces and sequence numbers ensure freshness.'],
      steps: [
        'Step 1/3: Client transmits original message with Sequence #42 and fresh nonce.',
        'Step 2/3: Attacker records packet #42 and replays it at Sequence #43.',
        'Step 3/3: Server AEAD verifies Seq #43 nonce -> Replay Rejected!'
      ],
      check: { q: 'What prevents a captured TLS record from being replayed later in the same session?', opts: ['Incrementing 64-bit record sequence numbers XORed into the AEAD nonce', 'Static IP addresses', 'HTTP User-Agent'], ans: 0, exp: 'Each record uses a unique sequence number, so replaying an older record fails AEAD verification.' }
    },
    eavesdrop: {
      type: 'SIMULATION 3 OF 6',
      title: 'Eavesdropping / Packet Sniffing Simulator',
      label: 'Passive Packet Sniffer',
      what: 'A passive observer captures packets on a shared Wi-Fi network to read sensitive data.',
      how: 'The simulation compares transmitting a harmless sample message ("Hello_Student_Demo") over unencrypted HTTP vs encrypted TLS 1.3.',
      defense: 'TLS enforces <strong>AES-256-GCM Symmetric Encryption</strong> with <strong>ECDHE Forward Secrecy</strong>. Passive sniffers only observe pseudo-random ciphertext bytes.',
      beforeText: 'Unencrypted HTTP: Sniffer reads "SampleMsg: Hello_Student_Demo" in ASCII!',
      afterText: 'TLS 1.3 Encrypted: Sniffer sees "9f 3a c1 08 7e 44 b2 19..." (Unreadable)',
      objectives: ['Contrast plaintext HTTP visibility with encrypted TLS ciphertext.', 'Explain why Forward Secrecy protects recorded traffic.'],
      steps: [
        'Step 1/3: Client prepares harmless sample message "Hello_Student_Demo".',
        'Step 2/3: Passive sniffer taps the simulated wire to inspect bytes.',
        'Step 3/3: AES-256-GCM encrypts payload -> Sniffer sees only random noise!'
      ],
      check: { q: 'What does a passive eavesdropper see on a TLS 1.3 Application Data packet?', opts: ['Plaintext URLs and cookies', 'Encrypted ciphertext + 128-bit authentication tag', 'The server private key'], ans: 1, exp: 'Application Data is encrypted end-to-end with AES-GCM or ChaCha20-Poly1305.' }
    },
    tamper: {
      type: 'SIMULATION 4 OF 6',
      title: 'Data Tampering / Bit-Flipping Simulator',
      label: 'In-Transit Bit Modifier',
      what: 'An adversary alters message bytes in-flight (e.g., changing a numeric value in a sample payload).',
      how: 'The simulation flips a single byte in the transmitted sample payload ("Amount=100" -> "Amount=999") and runs integrity verification.',
      defense: 'TLS 1.3 exclusively uses <strong>AEAD ciphers (AES-GCM / ChaCha20-Poly1305)</strong>. Modifying even 1 bit invalidates the 128-bit authentication tag and aborts decryption.',
      beforeText: 'Unauthenticated Stream: Modified "Amount=999" silently accepted!',
      afterText: 'AES-256-GCM AEAD: 128-bit Auth Tag Mismatch -> Tampering Detected & Rejected!',
      objectives: ['Understand why encryption without authentication is unsafe.', 'See how AEAD authentication tags detect 1-bit modifications.'],
      steps: [
        'Step 1/3: Client encrypts sample payload "Amount=100" with 128-bit GCM tag.',
        'Step 2/3: Attacker flips 1 byte in transit on the simulated wire.',
        'Step 3/3: Server verifies GCM Auth Tag -> Tag Mismatch -> Packet Rejected!'
      ],
      check: { q: 'Which AES-GCM component detects if ciphertext was modified in transit?', opts: ['The 128-bit Authentication Tag', 'The TCP port', 'The DNS TTL'], ans: 0, exp: 'AES-GCM computes a 128-bit GHASH authentication tag over ciphertext and AAD.' }
    },
    spoof: {
      type: 'SIMULATION 5 OF 6',
      title: 'Certificate Spoofing Simulator',
      label: 'Rogue Fake CA Server',
      what: 'An attacker presents an expired, self-signed, or domain-mismatched certificate to impersonate a legitimate server.',
      how: 'The simulation tests a forged sample certificate ("Issuer: Untrusted Fake CA", "CN: *.evil-demo.test") against browser PKI validation.',
      defense: 'Browsers validate the full <strong>X.509 Trust Chain</strong> against pre-installed Root CAs, check validity dates, and verify <strong>SAN</strong> hostname matching.',
      beforeText: 'Ignoring Cert Warnings: Browser trusts fake self-signed cert!',
      afterText: 'PKI Validation: Untrusted Root CA / Expired / Host Mismatch -> Blocked!',
      objectives: ['Identify common certificate spoofing indicators (Self-Signed, Expired, Mismatch).', 'Explain how Root Trust Stores block forged certs.'],
      steps: [
        'Step 1/3: Rogue server presents a self-signed sample certificate.',
        'Step 2/3: Browser inspects Issuer, Validity Dates, and SAN hostname.',
        'Step 3/3: Chain fails Root CA trust check -> Connection Terminated!'
      ],
      check: { q: 'Why do browsers reject a self-signed certificate on public websites?', opts: ['It uses UTF-8', 'It is not signed by a CA in the browser’s trusted Root Store', 'It is too fast'], ans: 1, exp: 'Anyone can generate a self-signed cert; trust requires a signature chaining to a vetted Root CA.' }
    },
    downgrade: {
      type: 'SIMULATION 6 OF 6',
      title: 'TLS Downgrade Attack Simulator',
      label: 'Downgrade Interceptor',
      what: 'An attacker alters ClientHello/ServerHello negotiation to force a weaker legacy protocol (e.g., SSL 3.0 / TLS 1.0).',
      how: 'The simulation attempts to strip TLS 1.3 from supported_versions and force a legacy weak cipher suite.',
      defense: 'TLS 1.3 embeds a cryptographic <strong>Downgrade Sentinel</strong> in <code>ServerHello.Random</code> and signs the entire transcript via <strong>Finished MAC</strong>, detecting any forced downgrade.',
      beforeText: 'Legacy Fallback: Connection downgraded to SSL 3.0 (Vulnerable to POODLE)!',
      afterText: 'TLS 1.3 Sentinel + Finished HMAC: Forced downgrade detected -> Aborted!',
      objectives: ['Understand how protocol downgrade attacks work.', 'Learn how TLS 1.3 ServerHello.Random sentinel detects downgrades.'],
      steps: [
        'Step 1/3: Client proposes TLS 1.3 and TLS 1.2 in ClientHello.',
        'Step 2/3: Attacker attempts to force downgrade to deprecated TLS 1.0/SSL 3.0.',
        'Step 3/3: TLS 1.3 Downgrade Sentinel & Transcript Hash detect tampering -> Blocked!'
      ],
      check: { q: 'How does a TLS 1.3 client detect if an attacker forced a downgrade to TLS 1.2?', opts: ['By checking the magic sentinel bytes in ServerHello.Random', 'By checking the HTTP favicon', 'By disabling TCP'], ans: 0, exp: 'RFC 8446 defines a fixed 8-byte sentinel in the last bytes of ServerHello.Random when negotiating older versions.' }
    }
  };

  let activeAttackKey = 'mitm';
  let attackSimStep = 0; // 0=Ready, 1=Normal, 2=Attacking, 3=Defended
  let attackSimTimer = null;
  const attackHistoryEntries = [];
  const completedAttackModules = new Set();

  function logAttackHistory(title, badge, type = 'ok') {
    attackHistoryEntries.unshift({ title, time: getTimestamp(), badge, type });
    if (attackHistoryEntries.length > 12) attackHistoryEntries.pop();
    const feed = document.getElementById('attackHistoryFeed');
    if (feed) {
      feed.innerHTML = attackHistoryEntries.map((a) => `
        <div class="activity-item">
          <div class="act-left">
            <span class="act-title">${a.title}</span>
            <span class="act-time">${a.time}</span>
          </div>
          <span class="conn-status-pill ${a.type === 'err' ? 'err' : 'ok'}">${a.badge}</span>
        </div>
      `).join('');
    }
  }

  function applyAttackStepUI(step) {
    attackSimStep = step;
    const data = ATTACK_DATA[activeAttackKey];
    const stepInd = document.getElementById('attStepIndicator');
    const narration = document.getElementById('attStepNarration');

    attackerInterceptor.classList.remove('attacking');
    tlsDefenseShield.classList.remove('active');
    if (attackAnimArena) attackAnimArena.classList.remove('is-attacking', 'is-defended');

    if (step === 0) {
      attStatus.textContent = 'Waiting';
      if (stepInd) stepInd.textContent = 'Ready • Step 0 / 3';
      if (narration) narration.textContent = 'Click "Start Simulation" or "Next Step" to trace the simulated attack and TLS defense.';
    } else if (step === 1) {
      attStatus.textContent = 'Monitoring Wire';
      if (stepInd) stepInd.textContent = 'Running • Step 1 / 3';
      if (narration) narration.textContent = data.steps[0];
      playCyberTone('packet');
    } else if (step === 2) {
      attStatus.textContent = 'Attack Active!';
      attackerInterceptor.classList.add('attacking');
      if (attackAnimArena) attackAnimArena.classList.add('is-attacking');
      if (stepInd) stepInd.textContent = 'Attacking • Step 2 / 3';
      if (narration) narration.textContent = data.steps[1];
      playCyberTone('shield');
    } else if (step === 3) {
      attStatus.textContent = 'BLOCKED BY TLS';
      tlsDefenseShield.classList.add('active');
      if (attackAnimArena) attackAnimArena.classList.add('is-defended');
      if (stepInd) stepInd.textContent = 'Defended • Step 3 / 3';
      if (narration) narration.textContent = data.steps[2];
      playCyberTone('success');

      analyticsState.threatShieldTested = true;
      pushDashboardAlert('ok', `Threat defense verified: ${data.title} blocked by TLS.`, 'tabSecurity', 'Open Playground →');
      pushRecentActivity(`Defense Verified: ${data.title}`, 'BLOCKED', 'ok');
      logAttackHistory(`Simulated ${data.title} — Defended`, 'BLOCKED', 'ok');
      renderDashboardAnalytics();
      logPacket('SYS', 'SECURITY_SHIELD', `Attack neutralized: ${data.title} deflected by TLS cryptographic defenses`, true);
    }
  }

  function selectAttackTab(key) {
    const data = ATTACK_DATA[key];
    if (!data) return;
    activeAttackKey = key;
    stopAttackSimulation();

    attackTabBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-attack') === key);
    });

    adcTypeBadge.textContent = data.type;
    adcTitle.textContent = data.title;
    attLabel.textContent = data.label;
    adcWhat.innerHTML = data.what;
    adcHow.innerHTML = data.how;
    adcDefense.innerHTML = data.defense;

    const beforeEl = document.getElementById('attBeforeBox');
    const afterEl = document.getElementById('attAfterBox');
    const objEl = document.getElementById('attLearningObj');
    if (beforeEl) beforeEl.textContent = data.beforeText;
    if (afterEl) afterEl.textContent = data.afterText;
    if (objEl) objEl.innerHTML = (data.objectives || []).map((o) => `<li>${o}</li>`).join('');

    // Knowledge Check
    const kc = data.check;
    const kcQ = document.getElementById('attKcheckQ');
    const kcOpts = document.getElementById('attKcheckOpts');
    const kcFb = document.getElementById('attKcheckFb');
    if (kc && kcQ && kcOpts && kcFb) {
      kcQ.textContent = kc.q;
      kcFb.textContent = '';
      kcFb.className = 'chal-status-msg';
      kcOpts.innerHTML = kc.opts.map((opt, idx) =>
        `<button class="quiz-option-btn" data-att-kc="${idx}">${String.fromCharCode(65 + idx)}. ${opt}</button>`
      ).join('');
      kcOpts.querySelectorAll('.quiz-option-btn').forEach((b) => {
        b.addEventListener('click', () => {
          const picked = parseInt(b.getAttribute('data-att-kc'), 10);
          const ok = picked === kc.ans;
          kcOpts.querySelectorAll('.quiz-option-btn').forEach((x, xi) => {
            x.disabled = true;
            if (xi === kc.ans) x.classList.add('correct');
            else if (xi === picked) x.classList.add('wrong');
          });
          kcFb.textContent = `${ok ? '✓ Correct!' : '✕ Incorrect.'} ${kc.exp}`;
          kcFb.className = `chal-status-msg ${ok ? 'ok' : 'err'}`;
          playCyberTone(ok ? 'success' : 'error');
        });
      });
    }

    const markBtn = document.getElementById('btnMarkAttackComplete');
    if (markBtn) {
      const done = completedAttackModules.has(key);
      markBtn.textContent = done ? '✓ Simulation Completed' : 'Mark Simulation Completed';
      markBtn.className = done ? 'btn btn-sm btn-secondary' : 'btn btn-sm btn-primary';
    }

    applyAttackStepUI(0);
  }

  function stopAttackSimulation() {
    if (attackSimTimer) {
      clearTimeout(attackSimTimer);
      attackSimTimer = null;
    }
  }

  function simulateAttackSequence() {
    stopAttackSimulation();
    applyAttackStepUI(1);
    attackSimTimer = setTimeout(() => {
      applyAttackStepUI(2);
      attackSimTimer = setTimeout(() => {
        applyAttackStepUI(3);
      }, 950);
    }, 650);
  }

  // ============================================================================
  // FEATURE 9: PRESENTATION MODE (THEATER OVERLAY)
  // ============================================================================
  const PRES_SCRIPTS = [
    {
      step: 1,
      title: 'Step 1: Client Hello',
      desc: 'The client begins the handshake by proposing supported cryptographic protocols, cipher suites, and an ephemeral key share.',
      callout: 'Key Takeaway: Initiates cryptographic negotiation and sends speculative key share for 1-RTT performance.',
      script: 'Good morning everyone. We begin our presentation at Step 1: Client Hello. Notice how the browser offers modern TLS 1.3 along with supported cipher suites like AES-256-GCM and its client random nonce to prevent replay attacks.'
    },
    {
      step: 2,
      title: 'Step 2: Server Hello',
      desc: 'The server selects the strongest mutual cipher suite, agrees on TLS 1.3, and sends back its ephemeral key share.',
      callout: 'Key Takeaway: Eliminates legacy ciphers and establishes common cryptographic parameters.',
      script: 'Next, the server responds with Server Hello. It picks the strongest common cipher suite—here AES-256 with GCM authenticated encryption—and supplies its own random nonce. Both parties now have what they need to derive shared session keys.'
    },
    {
      step: 3,
      title: 'Step 3: Certificate Verification',
      desc: 'The server presents its X.509 digital certificate. The browser validates the CA signature chain to authenticate identity.',
      callout: 'Key Takeaway: Defeats Man-in-the-Middle attacks by strictly proving server authenticity.',
      script: 'In Step 3, the server presents its X.509 digital certificate. The browser verifies the cryptographic signature against pre-installed trusted Root Certificate Authorities like DigiCert. Notice the green verified badge—this stops impersonation and phishing.'
    },
    {
      step: 4,
      title: 'Step 4: Key Establishment (ECDHE)',
      desc: 'Client and server compute identical symmetric session keys using Elliptic Curve Diffie-Hellman without transmitting secrets.',
      callout: 'Key Takeaway: Forward Secrecy ensures past communications cannot be decrypted even if server private keys leak.',
      script: 'Now comes key establishment. Using Elliptic Curve Diffie-Hellman (ECDHE), the client and server exchange public mathematical coordinates. Both derive the exact same symmetric session key without ever sending the master secret over the wire!'
    },
    {
      step: 5,
      title: 'Step 5: Secure Communication (HTTPS)',
      desc: 'The handshake is complete! Both endpoints transition to symmetric AES-256-GCM encryption with active tamper-proofing.',
      callout: 'Key Takeaway: Full confidentiality and integrity. The green padlock is active.',
      script: 'Finally, the handshake completes! The browser omnibar displays the green padlock and HTTPS status. All HTTP data is now encrypted with AES-256-GCM. Any eavesdropper sees only random ciphertext, while server and client communicate securely.'
    }
  ];

  function updatePresentationModalContent(step) {
    const item = PRES_SCRIPTS[step - 1];
    if (!item || !presStageTitle) return;

    presStepBadge.textContent = `STAGE ${item.step} OF 5`;
    presStageTitle.textContent = item.title;
    presStageDesc.textContent = item.desc;
    presCallout.innerHTML = item.callout;
    presNotesBody.innerHTML = `<p><strong>Speaker says:</strong> "${item.script}"</p>`;
    presNavIndicator.textContent = `Stage ${item.step} / 5`;
  }

  function openPresentationMode() {
    presentationOverlay.classList.add('open');
    presSeconds = 0;
    if (presTimerInterval) clearInterval(presTimerInterval);
    presTimerInterval = setInterval(() => {
      presSeconds++;
      const m = String(Math.floor(presSeconds / 60)).padStart(2, '0');
      const s = String(presSeconds % 60).padStart(2, '0');
      if (presTimer) presTimer.textContent = `${m}:${s}`;
    }, 1000);

    updatePresentationModalContent(currentStep);
    playCyberTone('packet');
  }

  function closePresentationMode() {
    presentationOverlay.classList.remove('open');
    if (presTimerInterval) {
      clearInterval(presTimerInterval);
      presTimerInterval = null;
    }
  }

  // ============================================================================
  // DASHBOARD ANALYTICS ENGINE (SCORE, CHARTS, ALERTS, ACTIVITY, SCAN)
  // ============================================================================
  function pushDashboardAlert(severity, title, targetTab, linkLabel) {
    const time = getTimestamp();
    analyticsState.alerts.unshift({ severity, title, time, targetTab, linkLabel });
    if (analyticsState.alerts.length > 8) analyticsState.alerts.pop();
  }

  function pushRecentActivity(title, badge, badgeType) {
    const time = getTimestamp();
    analyticsState.activities.unshift({ title, time, badge, badgeType });
    if (analyticsState.activities.length > 10) analyticsState.activities.pop();
  }

  function computeSecurityScore() {
    let score = 0;
    const weaknesses = [];

    // 1. Protocol (30 pts)
    if (analyticsState.selectedProtocol === '1.3') {
      score += 30;
    } else {
      score += 15;
      weaknesses.push({ cls: 'warn', text: 'TLS 1.2 selected in comparison (2-RTT, legacy CBC risk).' });
    }

    // 2. Certificate Verification (25 pts)
    if (analyticsState.certStatus === 'valid') {
      score += 25;
    } else if (analyticsState.certStatus === 'invalid') {
      score += 0;
      weaknesses.push({ cls: 'crit', text: 'Last Certificate Inspector check failed (Invalid / Untrusted).' });
    } else {
      score += 10;
      weaknesses.push({ cls: 'warn', text: 'Certificate trust chain not yet verified in Certificate Inspector.' });
    }

    // 3. ECDH Key Agreement (20 pts)
    if (analyticsState.ecdhVerified) {
      score += 20;
    } else {
      weaknesses.push({ cls: 'info', text: 'Run ECDHE P-256 Key Agreement in Crypto Lab.' });
    }

    // 4. Encryption Tunnel / AES-GCM (15 pts)
    if (analyticsState.handshakeCompleted || analyticsState.aesVerified) {
      score += 15;
    } else {
      weaknesses.push({ cls: 'warn', text: 'Complete Handshake Step 5 or AES-GCM test to verify encryption.' });
    }

    // 5. Threat Shield Verification (10 pts)
    if (analyticsState.threatShieldTested) {
      score += 10;
    } else {
      weaknesses.push({ cls: 'info', text: 'Trigger an attack simulation in Security Analyzer.' });
    }

    if (weaknesses.length === 0) {
      weaknesses.push({ cls: 'ok', text: 'All cryptographic checks passed. Zero weaknesses detected in session.' });
    }

    return { score: Math.min(100, score), weaknesses };
  }

  function initOrUpdateDashboardCharts() {
    if (typeof Chart === 'undefined') return;

    // 1. TLS Version Doughnut Chart
    const vCtx = document.getElementById('tlsVersionDoughnutChart');
    if (vCtx) {
      const dataVals = [analyticsState.tls13Count, analyticsState.tls12Count];
      if (tlsVersionDoughnutChart) {
        tlsVersionDoughnutChart.data.datasets[0].data = dataVals;
        tlsVersionDoughnutChart.update();
      } else {
        tlsVersionDoughnutChart = new Chart(vCtx, {
          type: 'doughnut',
          data: {
            labels: ['TLS 1.3 (Simulated)', 'TLS 1.2 (Simulated)'],
            datasets: [{
              data: dataVals,
              backgroundColor: ['rgba(255, 102, 133, 0.85)', 'rgba(245, 158, 11, 0.78)'],
              borderColor: ['#FF6685', '#F59E0B'],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '66%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: '#D1B8C2', font: { family: 'Inter', size: 11 } }
              }
            }
          }
        });
      }
    }

    // 2. Handshake Analytics Bar Chart
    const hCtx = document.getElementById('handshakeAnalyticsChart');
    if (hCtx) {
      const hData = [
        analyticsState.totalHandshakes,
        analyticsState.successfulHandshakes,
        analyticsState.failedHandshakes
      ];
      if (handshakeAnalyticsChart) {
        handshakeAnalyticsChart.data.datasets[0].data = hData;
        handshakeAnalyticsChart.update();
      } else {
        handshakeAnalyticsChart = new Chart(hCtx, {
          type: 'bar',
          data: {
            labels: ['Total Runs', 'Successful', 'Failed / Cert Error'],
            datasets: [{
              label: 'Session Handshake Count (Simulated)',
              data: hData,
              backgroundColor: [
                'rgba(56, 189, 248, 0.75)',
                'rgba(16, 185, 129, 0.78)',
                'rgba(239, 68, 68, 0.78)'
              ],
              borderColor: ['#38BDF8', '#10B981', '#EF4444'],
              borderWidth: 1,
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1, color: '#D1B8C2' },
                grid: { color: 'rgba(120, 51, 79, 0.4)' }
              },
              x: {
                ticks: { color: '#D1B8C2' },
                grid: { display: false }
              }
            },
            plugins: {
              legend: {
                labels: { color: '#FFFFFF', font: { family: 'Inter', size: 11 } }
              }
            }
          }
        });
      }
    }
  }

  function renderDashboardAnalytics() {
    // 1. Security Score
    const { score, weaknesses } = computeSecurityScore();
    const scoreNumericVal = document.getElementById('scoreNumericVal');
    const scoreProgressCircle = document.getElementById('scoreProgressCircle');
    const scoreRatingBadge = document.getElementById('scoreRatingBadge');
    const scoreWeaknessList = document.getElementById('scoreWeaknessList');

    if (scoreNumericVal && scoreProgressCircle && scoreRatingBadge) {
      scoreNumericVal.textContent = score;
      const circumference = 314.16;
      const offset = circumference - (score / 100) * circumference;
      scoreProgressCircle.style.strokeDashoffset = offset.toFixed(2);

      if (score >= 90) {
        scoreRatingBadge.textContent = 'A+ • Optimal';
        scoreRatingBadge.className = 'ac-rating-badge rating-optimal';
        scoreProgressCircle.style.stroke = '#10B981';
      } else if (score >= 70) {
        scoreRatingBadge.textContent = 'B • Good';
        scoreRatingBadge.className = 'ac-rating-badge rating-good';
        scoreProgressCircle.style.stroke = '#38BDF8';
      } else if (score >= 45) {
        scoreRatingBadge.textContent = 'C • Hardening Needed';
        scoreRatingBadge.className = 'ac-rating-badge rating-warn';
        scoreProgressCircle.style.stroke = '#F59E0B';
      } else {
        scoreRatingBadge.textContent = 'F • Critical Risk';
        scoreRatingBadge.className = 'ac-rating-badge rating-crit';
        scoreProgressCircle.style.stroke = '#EF4444';
      }
    }

    if (scoreWeaknessList) {
      scoreWeaknessList.innerHTML = weaknesses
        .map((w) => `<li class="weakness-item ${w.cls}">${w.text}</li>`)
        .join('');
    }

    // 2. Connection Monitor
    const connMonitorList = document.getElementById('connMonitorList');
    if (connMonitorList) {
      if (analyticsState.connections.length === 0) {
        connMonitorList.innerHTML = '<div class="conn-row-card"><span class="conn-host">No active test connections yet.</span></div>';
      } else {
        connMonitorList.innerHTML = analyticsState.connections.map((c) => `
          <div class="conn-row-card">
            <div class="conn-row-top">
              <span class="conn-host">${c.host}</span>
              <span class="conn-status-pill ${c.statusType}">${c.status}</span>
            </div>
            <div class="conn-meta-row">
              <span>Proto: <strong>${c.version}</strong></span>
              <span class="mono">${c.cipher}</span>
              <span>Time: <strong>${c.durationLabel}</strong></span>
            </div>
          </div>
        `).join('');
      }
    }

    // 4. Handshake KPIs
    const kpiTotal = document.getElementById('kpiTotalHandshakes');
    const kpiSuccess = document.getElementById('kpiSuccessHandshakes');
    const kpiFailed = document.getElementById('kpiFailedHandshakes');
    const kpiAvg = document.getElementById('kpiAvgDuration');
    if (kpiTotal) kpiTotal.textContent = analyticsState.totalHandshakes;
    if (kpiSuccess) kpiSuccess.textContent = analyticsState.successfulHandshakes;
    if (kpiFailed) kpiFailed.textContent = analyticsState.failedHandshakes;
    if (kpiAvg) {
      if (analyticsState.handshakeDurations.length === 0) {
        kpiAvg.textContent = '0 ms';
      } else {
        const sum = analyticsState.handshakeDurations.reduce((a, b) => a + b, 0);
        kpiAvg.textContent = `${Math.round(sum / analyticsState.handshakeDurations.length)} ms`;
      }
    }

    // 5. Certificate Health
    const chValid = document.getElementById('chValidCount');
    const chExpired = document.getElementById('chExpiredCount');
    const chSelf = document.getElementById('chSelfSignedCount');
    const chWarn = document.getElementById('chWarningCount');
    const chFill = document.getElementById('certHealthFill');
    const chPct = document.getElementById('certHealthPctText');
    const chBadge = document.getElementById('certHealthBadge');
    const chNote = document.getElementById('certHealthNote');

    const c = analyticsState.certCounts;
    const totalCerts = c.valid + c.expired + c.selfSigned + c.warnings;
    if (chValid) chValid.textContent = c.valid;
    if (chExpired) chExpired.textContent = c.expired;
    if (chSelf) chSelf.textContent = c.selfSigned;
    if (chWarn) chWarn.textContent = c.warnings;

    if (totalCerts > 0 && chFill && chPct && chBadge) {
      const validRatio = Math.round((c.valid / totalCerts) * 100);
      chFill.style.width = `${validRatio}%`;
      chPct.textContent = `${validRatio}% Valid (${totalCerts} scanned)`;
      if (validRatio === 100) {
        chBadge.textContent = 'Healthy';
        chBadge.className = 'cert-health-pill status-ok';
        if (chNote) chNote.textContent = 'All inspected certificates passed X.509 CA validation.';
      } else if (validRatio >= 50) {
        chBadge.textContent = 'Warnings Detected';
        chBadge.className = 'cert-health-pill status-warn';
        if (chNote) chNote.textContent = 'Some inspected certificates failed validation scenarios.';
      } else {
        chBadge.textContent = 'Critical Issues';
        chBadge.className = 'cert-health-pill status-err';
        if (chNote) chNote.textContent = 'Majority of scanned certificates are expired, untrusted, or mismatched.';
      }
    }

    // 7. Security Alerts
    const dashAlertsFeed = document.getElementById('dashAlertsFeed');
    const dashAlertCount = document.getElementById('dashAlertCount');
    if (dashAlertCount) dashAlertCount.textContent = `${analyticsState.alerts.length} Active`;
    if (dashAlertsFeed) {
      dashAlertsFeed.innerHTML = analyticsState.alerts.map((a) => `
        <div class="alert-item ${a.severity}">
          <div class="alert-top">
            <span class="alert-sev">${a.severity === 'crit' ? 'CRITICAL' : a.severity === 'warn' ? 'WARNING' : a.severity === 'ok' ? 'VERIFIED' : 'INFO'}</span>
            <span class="alert-time">${a.time}</span>
          </div>
          <span class="alert-msg">${a.title}</span>
          <button class="alert-link" data-nav-target="${a.targetTab}">${a.linkLabel}</button>
        </div>
      `).join('');

      dashAlertsFeed.querySelectorAll('.alert-link').forEach((btn) => {
        btn.addEventListener('click', () => {
          navigateToSection(btn.getAttribute('data-nav-target'));
        });
      });
    }

    // 8. Recent Activity
    const dashActivityFeed = document.getElementById('dashActivityFeed');
    if (dashActivityFeed) {
      if (analyticsState.activities.length === 0) {
        dashActivityFeed.innerHTML = '<div class="activity-item"><span class="act-title">Activity log is empty.</span></div>';
      } else {
        dashActivityFeed.innerHTML = analyticsState.activities.map((act) => `
          <div class="activity-item">
            <div class="act-left">
              <span class="act-title">${act.title}</span>
              <span class="act-time">${act.time}</span>
            </div>
            <span class="conn-status-pill ${act.badgeType === 'crit' ? 'err' : act.badgeType === 'warn' ? 'warn' : 'ok'}">${act.badge}</span>
          </div>
        `).join('');
      }
    }

    // 3 & 4 Charts
    initOrUpdateDashboardCharts();
  }

  async function runFullDiagnosticScan() {
    const btn = document.getElementById('btnRunDashScan');
    if (btn) {
      btn.disabled = true;
      btn.querySelector('span').textContent = 'Scanning...';
    }

    await runWebCryptoEcdhDemo();
    await runWebCryptoAesEncrypt();
    verifyCertificateAction();
    renderOverviewStep(5);

    const realCryptoMs = Math.max(1, Math.round((analyticsState.ecdhDurationMs + analyticsState.aesDurationMs) * 10) / 10);
    analyticsState.connections.unshift({
      host: 'crypto-diag.local (Web Crypto)',
      version: 'TLS 1.3',
      cipher: 'ECDH-P256 + AES-256-GCM',
      status: 'Diagnostic Passed',
      statusType: 'ok',
      durationLabel: `${realCryptoMs} ms (Web Crypto)`
    });
    if (analyticsState.connections.length > 4) analyticsState.connections.pop();

    pushRecentActivity(`Full Diagnostic Scan Completed (${realCryptoMs} ms crypto)`, 'PASSED', 'ok');
    renderDashboardAnalytics();

    if (btn) {
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Run Diagnostic Scan';
    }
  }

  // ============================================================================
  // PRACTICAL LAB EXTENSIONS: RSA-OAEP, RSA SIGNATURES & SHA-256/384/512 HASHING
  // ============================================================================
  let cachedRsaOaepPair = null;
  let cachedRsaOaepCipher = null;
  let cachedRsaKeyPair = null;
  let cachedRsaSignature = null;
  let sha256Computed = false;
  let rsaVerifiedFlag = false;

  async function generateRsaOaepKeys() {
    if (!window.crypto || !window.crypto.subtle) return;
    const btn = document.getElementById('btnGenRsaOaep');
    if (btn) btn.textContent = 'Generating...';
    try {
      cachedRsaOaepPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256'
        },
        true,
        ['encrypt', 'decrypt']
      );
      const spki = await window.crypto.subtle.exportKey('spki', cachedRsaOaepPair.publicKey);
      document.getElementById('rsaOaepPubDisplay').textContent = buf2hex(spki).substring(0, 96) + '... (294 bytes SPKI)';
      document.getElementById('rsaOaepCipher').textContent = 'KeyPair ready. Click "Encrypt (Public Key)".';
      document.getElementById('rsaOaepDecrypted').textContent = 'Awaiting decryption...';
      document.getElementById('btnRsaOaepDecrypt').disabled = true;
      cachedRsaOaepCipher = null;
      playCyberTone('packet');
      logCryptoExperiment('RSA-OAEP', 'Generated 2048-bit RSA-OAEP key pair', 'KEY');
    } catch (e) {
      document.getElementById('rsaOaepPubDisplay').textContent = 'RSA-OAEP Error: ' + e.message;
    } finally {
      if (btn) btn.textContent = 'Generate Keys';
    }
  }

  async function encryptRsaOaep() {
    if (!cachedRsaOaepPair) await generateRsaOaepKeys();
    const msg = document.getElementById('rsaOaepInput')?.value || '';
    if (!msg.trim()) {
      document.getElementById('rsaOaepCipher').textContent = 'Error: Enter a non-empty message.';
      playCyberTone('error');
      return;
    }
    const bytes = new TextEncoder().encode(msg);
    if (bytes.byteLength > 190) {
      document.getElementById('rsaOaepCipher').textContent = `Error: Message (${bytes.byteLength}B) exceeds RSA-2048 OAEP max (~190B). Use AES-GCM for long payloads!`;
      playCyberTone('error');
      return;
    }
    try {
      cachedRsaOaepCipher = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        cachedRsaOaepPair.publicKey,
        bytes
      );
      document.getElementById('rsaOaepCipher').textContent = buf2hex(cachedRsaOaepCipher);
      document.getElementById('btnRsaOaepDecrypt').disabled = false;
      document.getElementById('rsaOaepDecrypted').textContent = 'Encrypted! Click "Decrypt (Private Key)".';
      playCyberTone('packet');
      logCryptoExperiment('RSA-OAEP', `Encrypted ${bytes.byteLength}B with Public Key`, 'ENC');
    } catch (e) {
      document.getElementById('rsaOaepCipher').textContent = 'Encrypt error: ' + e.message;
    }
  }

  async function decryptRsaOaep() {
    if (!cachedRsaOaepPair || !cachedRsaOaepCipher) return;
    try {
      const plainBuf = await window.crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        cachedRsaOaepPair.privateKey,
        cachedRsaOaepCipher
      );
      const plain = new TextDecoder().decode(plainBuf);
      document.getElementById('rsaOaepDecrypted').textContent = `✓ Decrypted: "${plain}"`;
      playCyberTone('success');
      logCryptoExperiment('RSA-OAEP', 'Decrypted ciphertext with Private Key', 'DEC');
    } catch (e) {
      document.getElementById('rsaOaepDecrypted').textContent = 'Decrypt error: ' + e.message;
      playCyberTone('error');
    }
  }

  async function generateRsaKeys() {
    if (!window.crypto || !window.crypto.subtle) return;
    const btn = document.getElementById('btnGenRsa');
    if (btn) btn.textContent = 'Generating 2048-bit...';
    try {
      cachedRsaKeyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256'
        },
        true,
        ['sign', 'verify']
      );
      cachedRsaSignature = null;
      document.getElementById('rsaSigOutput').textContent = 'RSA-2048 KeyPair ready. Click "Sign with Private Key".';
      document.getElementById('rsaVerifyOutput').textContent = 'Awaiting signature...';
      document.getElementById('btnRsaVerify').disabled = true;
      playCyberTone('packet');
    } catch (e) {
      document.getElementById('rsaSigOutput').textContent = 'RSA Error: ' + e.message;
    } finally {
      if (btn) btn.textContent = 'Generate RSA-2048 Keys';
    }
  }

  async function signRsaMessage() {
    if (!cachedRsaKeyPair) {
      await generateRsaKeys();
    }
    const msg = document.getElementById('rsaInputMsg').value || '';
    const data = new TextEncoder().encode(msg);
    cachedRsaSignature = await window.crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cachedRsaKeyPair.privateKey,
      data
    );
    document.getElementById('rsaSigOutput').textContent = buf2hex(cachedRsaSignature);
    document.getElementById('btnRsaVerify').disabled = false;
    document.getElementById('rsaVerifyOutput').textContent = 'Signature created. Click "Verify with Public Key" (or edit message to test tamper detection).';
    playCyberTone('packet');
  }

  async function verifyRsaMessage() {
    if (!cachedRsaKeyPair || !cachedRsaSignature) return;
    const msg = document.getElementById('rsaInputMsg').value || '';
    const data = new TextEncoder().encode(msg);
    const isValid = await window.crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cachedRsaKeyPair.publicKey,
      cachedRsaSignature,
      data
    );
    const out = document.getElementById('rsaVerifyOutput');
    if (isValid) {
      out.textContent = '✓ SIGNATURE VALID: Message integrity and sender authenticity confirmed.';
      out.style.color = '#10B981';
      rsaVerifiedFlag = true;
      recordLabCompletion('rsa', 'Signed & Verified RSA-2048 Digital Signature');
      playCyberTone('success');
    } else {
      out.textContent = '✕ SIGNATURE INVALID: Message was modified after signing (Tamper Detected)!';
      out.style.color = '#EF4444';
      playCyberTone('error');
    }
  }

  async function computeSha256Compare() {
    if (!window.crypto || !window.crypto.subtle) return;
    const algo = document.getElementById('shaAlgoSelect')?.value || 'SHA-256';
    const valA = document.getElementById('shaInputA').value || '';
    const valB = document.getElementById('shaInputB').value || '';
    const hashA = await window.crypto.subtle.digest(algo, new TextEncoder().encode(valA));
    const hashB = await window.crypto.subtle.digest(algo, new TextEncoder().encode(valB));
    const hexA = Array.from(new Uint8Array(hashA)).map((b) => b.toString(16).padStart(2, '0')).join('');
    const hexB = Array.from(new Uint8Array(hashB)).map((b) => b.toString(16).padStart(2, '0')).join('');

    document.getElementById('shaOutputA').textContent = hexA;
    document.getElementById('shaOutputB').textContent = hexB;
    const cmpEl = document.getElementById('shaCompareStatus');
    if (hexA === hexB) {
      cmpEl.textContent = `${algo} digests match identically (100% same input).`;
      cmpEl.style.color = '#10B981';
    } else {
      let diffChars = 0;
      for (let i = 0; i < hexA.length; i++) if (hexA[i] !== hexB[i]) diffChars++;
      cmpEl.textContent = `${algo} Avalanche Effect: ${diffChars} of ${hexA.length} hex characters differ!`;
      cmpEl.style.color = '#FF8EAA';
    }
    sha256Computed = true;
    recordLabCompletion('sha256', `Computed ${algo} Digest & Avalanche Effect`);
    logCryptoExperiment(algo, `Computed ${hexA.length * 4}-bit digest`, 'HASH');
  }

  // ============================================================================
  // STUDENT LEARNING PLATFORM (PROGRESS, ACADEMY, QUIZ, CHALLENGES)
  // ============================================================================
  const STUDENT_STORAGE_KEY = 'tls_lab_student_progress_v1';
  const defaultStudentState = () => ({
    completedLessons: [],
    completedLabs: [],
    labCompletionDates: {},
    completedChallenges: [],
    unlockedAchievements: [],
    achievementDates: {}, // { badgeId: 'YYYY-MM-DD' }
    experimentCount: 0,
    dailyActivityMap: {}, // { 'YYYY-MM-DD': count }
    timeBySection: { academy: 0, lab: 0, quiz: 0, playground: 0 },
    dailyGoal: 3,
    quizAnswered: {}, // { qId: { selectedIdx, correct } }
    activities: []
  });

  function getTodayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  let studentState = loadStudentProgress();

  function loadStudentProgress() {
    try {
      const raw = localStorage.getItem(STUDENT_STORAGE_KEY);
      if (!raw) return defaultStudentState();
      const parsed = JSON.parse(raw);
      const base = defaultStudentState();
      return Object.assign({}, base, parsed, {
        timeBySection: Object.assign({}, base.timeBySection, parsed.timeBySection || {}),
        dailyActivityMap: parsed.dailyActivityMap || {},
        achievementDates: parsed.achievementDates || {},
        labCompletionDates: parsed.labCompletionDates || {}
      });
    } catch (e) {
      return defaultStudentState();
    }
  }

  function saveStudentProgress() {
    try {
      localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(studentState));
    } catch (e) { }
  }

  function addStudentActivity(title, badge, badgeType) {
    const today = getTodayKey();
    studentState.dailyActivityMap[today] = (studentState.dailyActivityMap[today] || 0) + 1;
    studentState.activities.unshift({ title, time: getTimestamp(), badge, badgeType });
    if (studentState.activities.length > 15) studentState.activities.pop();
    saveStudentProgress();
    renderStudentDashboard();
    if (typeof renderProgressSystem === 'function') renderProgressSystem();
    if (typeof renderReportsSystem === 'function') renderReportsSystem();
    if (typeof syncStudentProgressToBackend === 'function') syncStudentProgressToBackend(title);
  }

  let isWarmupPhase = true;

  function recordLabCompletion(labId, label) {
    if (isWarmupPhase) return;
    studentState.experimentCount = (studentState.experimentCount || 0) + 1;
    if (!studentState.completedLabs.includes(labId)) {
      studentState.completedLabs.push(labId);
    }
    studentState.labCompletionDates[labId] = getTodayKey();
    addStudentActivity(label, 'LAB DONE', 'ok');
  }

  // 1. LEARNING ACADEMY DATA (Loaded from academy-data.js: 5 Modules, 35 Lessons)
  const ACADEMY_MODULES = window.ACADEMY_MODULES || [];
  function getAllAcademyLessons() {
    return ACADEMY_MODULES.flatMap((m) =>
      m.lessons.map((l) => Object.assign({}, l, { moduleId: m.id, moduleTitle: m.title, relatedTab: m.relatedTab }))
    );
  }

  let activeLessonId = (getAllAcademyLessons()[0] && getAllAcademyLessons()[0].id) || 'tls_intro';

  function getContinueLearningLessonId() {
    const all = getAllAcademyLessons();
    const firstIncomplete = all.find((l) => !studentState.completedLessons.includes(l.id));
    return (firstIncomplete || all[0])?.id || 'tls_intro';
  }

  function renderAcademy() {
    const listEl = document.getElementById('academyTopicsList');
    if (!listEl) return;
    const diffFilter = document.getElementById('acadDiffFilter')?.value || 'all';
    const searchQ = (document.getElementById('acadSearchInput')?.value || '').trim().toLowerCase();
    const bookmarks = Array.isArray(studentState.bookmarkedLessons) ? studentState.bookmarkedLessons : [];
    const allLessons = getAllAcademyLessons();
    const totalLessons = allLessons.length || 1;
    const completedTotal = allLessons.filter((l) => studentState.completedLessons.includes(l.id)).length;
    const overallPct = Math.round((completedTotal / totalLessons) * 100);

    const pctText = document.getElementById('acadOverallPctText');
    const pctFill = document.getElementById('acadOverallFill');
    if (pctText) pctText.textContent = `${overallPct}% (${completedTotal} / ${totalLessons} Lessons)`;
    if (pctFill) pctFill.style.width = `${overallPct}%`;

    const bmBtn = document.getElementById('btnAcadBookmark');
    if (bmBtn) bmBtn.textContent = bookmarks.includes(activeLessonId) ? '★ Bookmarked' : 'Bookmark Lesson';

    listEl.innerHTML = ACADEMY_MODULES.map((mod) => {
      const modDone = mod.lessons.filter((l) => studentState.completedLessons.includes(l.id)).length;
      const modPct = Math.round((modDone / mod.lessons.length) * 100);
      const filteredLessons = mod.lessons.filter((l) => {
        const dOk = diffFilter === 'all' || (diffFilter === 'bookmarked' ? bookmarks.includes(l.id) : l.diff === diffFilter);
        const sOk = !searchQ || l.title.toLowerCase().includes(searchQ) || (l.explanation || '').toLowerCase().includes(searchQ);
        return dOk && sOk;
      });
      if (filteredLessons.length === 0) return '';

      return `
        <div class="academy-mod-group">
          <div class="academy-mod-header">
            <span>${mod.title}</span>
            <span class="academy-mod-pct">${modDone}/${mod.lessons.length} (${modPct}%)</span>
          </div>
          <div class="academy-mod-lessons">
            ${filteredLessons.map((l) => {
        const done = studentState.completedLessons.includes(l.id);
        return `
                <button class="academy-topic-btn ${l.id === activeLessonId ? 'active' : ''}" data-lesson-id="${l.id}">
                  <div class="atb-top">
                    <span class="atb-unit">${l.diff} &bull; ${l.time}</span>
                    ${done ? '<span class="atb-done">✓ Done</span>' : ''}
                  </div>
                  <span class="atb-title">${l.title}</span>
                </button>
              `;
      }).join('')}
          </div>
        </div>
      `;
    }).join('') || '<div class="activity-item"><span class="act-title">No lessons match this difficulty filter.</span></div>';

    listEl.querySelectorAll('.academy-topic-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeLessonId = btn.getAttribute('data-lesson-id');
        renderAcademy();
      });
    });

    const lesson = allLessons.find((l) => l.id === activeLessonId) || allLessons[0];
    if (!lesson) return;

    document.getElementById('acadLessonUnit').textContent = lesson.moduleTitle.toUpperCase();
    document.getElementById('acadLessonDiff').textContent = lesson.diff;
    document.getElementById('acadLessonTime').textContent = lesson.time;
    document.getElementById('acadLessonTitle').textContent = lesson.title;
    document.getElementById('acadLessonDesc').textContent = lesson.desc;

    document.getElementById('acadLessonObjectives').innerHTML = (lesson.objectives || []).map((o) => `<li>${o}</li>`).join('');
    document.getElementById('acadLessonBody').innerHTML = `<p>${lesson.explanation}</p>`;
    document.getElementById('acadLessonConcepts').innerHTML = (lesson.concepts || []).map((c) => `<span class="acad-concept-pill">${c}</span>`).join('');
    document.getElementById('acadDiagramFlow').innerHTML = (lesson.diagram || []).map((node, i, arr) =>
      `<span class="acad-diag-node">${node}</span>${i < arr.length - 1 ? '<span class="acad-diag-arrow">&rarr;</span>' : ''}`
    ).join('');
    document.getElementById('acadLessonExample').textContent = lesson.example;
    document.getElementById('acadLessonTakeaways').innerHTML = (lesson.takeaways || []).map((t) => `<li>${t}</li>`).join('');

    // Knowledge Check
    const kc = lesson.check;
    const kcQ = document.getElementById('acadKcheckQ');
    const kcOpts = document.getElementById('acadKcheckOpts');
    const kcFb = document.getElementById('acadKcheckFeedback');
    if (kc && kcQ && kcOpts && kcFb) {
      kcQ.textContent = kc.q;
      kcFb.textContent = '';
      kcFb.className = 'chal-status-msg';
      kcOpts.innerHTML = kc.opts.map((opt, idx) =>
        `<button class="quiz-option-btn" data-kc-idx="${idx}">${String.fromCharCode(65 + idx)}. ${opt}</button>`
      ).join('');
      kcOpts.querySelectorAll('.quiz-option-btn').forEach((b) => {
        b.addEventListener('click', () => {
          const chosen = parseInt(b.getAttribute('data-kc-idx'), 10);
          const ok = chosen === kc.ans;
          kcOpts.querySelectorAll('.quiz-option-btn').forEach((x, xi) => {
            x.disabled = true;
            if (xi === kc.ans) x.classList.add('correct');
            else if (xi === chosen) x.classList.add('wrong');
          });
          kcFb.textContent = `${ok ? '✓ Correct!' : '✕ Incorrect.'} ${kc.exp}`;
          kcFb.className = `chal-status-msg ${ok ? 'ok' : 'err'}`;
          playCyberTone(ok ? 'success' : 'error');
        });
      });
    }

    const markBtn = document.getElementById('btnMarkLessonComplete');
    const isDone = studentState.completedLessons.includes(lesson.id);
    markBtn.textContent = isDone ? '✓ Completed' : 'Mark as Completed';
    markBtn.className = isDone ? 'btn btn-sm btn-secondary' : 'btn btn-sm btn-primary';

    const curIdx = allLessons.findIndex((l) => l.id === lesson.id);
    const prevBtn = document.getElementById('btnAcadPrev');
    const nextBtn = document.getElementById('btnAcadNext');
    if (prevBtn) prevBtn.disabled = curIdx <= 0;
    if (nextBtn) nextBtn.disabled = curIdx >= allLessons.length - 1;
  }

  // 2. QUIZ CENTER ENGINE (50-Question Bank, Timer, Mock Exams, Results, History)
  const QUIZ_HISTORY_KEY = 'tls_lab_quiz_history_v1';
  let quizHistory = [];
  try {
    quizHistory = JSON.parse(localStorage.getItem(QUIZ_HISTORY_KEY) || '[]');
  } catch (e) { quizHistory = []; }

  let quizSession = {
    active: false,
    submitted: false,
    modeLabel: 'Practice Quiz',
    diffLabel: 'All',
    questions: [],
    answers: {}, // { qId: chosenIdx }
    index: 0,
    totalSeconds: 600,
    remainingSeconds: 600,
    timerId: null
  };

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function formatMmSs(sec) {
    const m = String(Math.floor(Math.max(0, sec) / 60)).padStart(2, '0');
    const s = String(Math.max(0, sec) % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function stopQuizTimer() {
    if (quizSession.timerId) {
      clearInterval(quizSession.timerId);
      quizSession.timerId = null;
    }
  }

  function startQuizSession(topic, diff, countLimit, minutes, modeLabel) {
    const bank = window.QUIZ_BANK || [];
    let pool = bank.filter((q) => (topic === 'all' || q.cat === topic) && (diff === 'all' || q.diff === diff));
    if (pool.length === 0) pool = bank.slice();
    pool = shuffleArray(pool);
    if (countLimit && countLimit < pool.length) {
      pool = pool.slice(0, countLimit);
    }

    stopQuizTimer();
    const secs = Math.max(60, (parseInt(minutes, 10) || 10) * 60);
    quizSession = {
      active: true,
      submitted: false,
      modeLabel: modeLabel || (topic === 'all' ? 'All Categories' : pool[0]?.catLabel || topic),
      diffLabel: diff === 'all' ? 'Mixed' : diff,
      questions: pool,
      answers: {},
      index: 0,
      totalSeconds: secs,
      remainingSeconds: secs,
      timerId: null
    };

    document.getElementById('quizSetupPanel').style.display = 'none';
    document.getElementById('quizResultsPanel').style.display = 'none';
    document.getElementById('quizActivePanel').style.display = 'flex';
    document.getElementById('quizConfirmBox').style.display = 'none';

    quizSession.timerId = setInterval(() => {
      quizSession.remainingSeconds--;
      const timerEl = document.getElementById('quizTimerDisplay');
      if (timerEl) {
        timerEl.textContent = formatMmSs(quizSession.remainingSeconds);
        timerEl.classList.toggle('urgent', quizSession.remainingSeconds <= 60);
      }
      if (quizSession.remainingSeconds <= 0) {
        submitQuizSession(true);
      }
    }, 1000);

    const timerEl = document.getElementById('quizTimerDisplay');
    if (timerEl) {
      timerEl.textContent = formatMmSs(quizSession.remainingSeconds);
      timerEl.classList.remove('urgent');
    }
    renderActiveQuizQuestion();
    playCyberTone('packet');
  }

  function renderActiveQuizQuestion() {
    const qs = quizSession.questions;
    const q = qs[quizSession.index];
    if (!q) return;

    document.getElementById('quizMetaTag').textContent = `QUESTION ${quizSession.index + 1} OF ${qs.length} • ${q.catLabel.toUpperCase()}`;
    document.getElementById('quizDiffBadge').textContent = q.diff;
    document.getElementById('quizQuestionText').textContent = q.q;

    // Question Navigator Grid
    const navGrid = document.getElementById('quizNavGrid');
    if (navGrid) {
      navGrid.innerHTML = qs.map((item, idx) => {
        const chosen = quizSession.answers[item.id];
        let cls = 'qnav-pill';
        if (idx === quizSession.index) cls += ' current';
        if (quizSession.submitted) {
          if (chosen === item.ans) cls += ' correct';
          else if (chosen !== undefined) cls += ' wrong';
        } else if (chosen !== undefined) {
          cls += ' answered';
        }
        return `<button class="${cls}" data-qnav="${idx}">${idx + 1}</button>`;
      }).join('');
      navGrid.querySelectorAll('.qnav-pill').forEach((b) => {
        b.addEventListener('click', () => {
          quizSession.index = parseInt(b.getAttribute('data-qnav'), 10);
          renderActiveQuizQuestion();
        });
      });
    }

    const chosen = quizSession.answers[q.id];
    const locked = chosen !== undefined || quizSession.submitted;
    const optsEl = document.getElementById('quizOptionsList');
    optsEl.innerHTML = q.opts.map((opt, idx) => {
      let cls = 'quiz-option-btn';
      if (locked) {
        if (idx === q.ans) cls += ' correct';
        else if (idx === chosen) cls += ' wrong';
      }
      return `<button class="${cls}" data-opt-idx="${idx}" ${locked ? 'disabled' : ''}>${String.fromCharCode(65 + idx)}. ${opt}</button>`;
    }).join('');

    const fbBox = document.getElementById('quizFeedbackBox');
    if (locked && (chosen !== undefined || quizSession.submitted)) {
      const isRight = chosen === q.ans;
      fbBox.style.display = 'block';
      fbBox.className = `quiz-feedback-box ${isRight ? 'ok' : 'err'}`;
      document.getElementById('quizFeedbackTitle').textContent = chosen === undefined ? 'Unanswered' : (isRight ? '✓ Correct Answer!' : '✕ Incorrect Answer');
      document.getElementById('quizConceptTag').textContent = `Concept: ${q.concept}`;
      document.getElementById('quizFeedbackExplain').textContent = q.exp;
    } else {
      fbBox.style.display = 'none';
    }

    if (!locked) {
      optsEl.querySelectorAll('.quiz-option-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const picked = parseInt(btn.getAttribute('data-opt-idx'), 10);
          quizSession.answers[q.id] = picked;
          const isCorrect = picked === q.ans;
          studentState.quizAnswered[q.id] = { selectedIdx: picked, correct: isCorrect };
          saveStudentProgress();
          playCyberTone(isCorrect ? 'success' : 'error');
          renderActiveQuizQuestion();
        });
      });
    }

    document.getElementById('btnQuizPrev').disabled = quizSession.index === 0;
    document.getElementById('btnQuizNext').disabled = quizSession.index >= qs.length - 1;
    document.getElementById('btnQuizSubmitTrigger').style.display = quizSession.submitted ? 'none' : 'inline-flex';
  }

  function submitQuizSession(autoTimeout = false) {
    if (quizSession.submitted) return; // Prevent multiple submissions
    quizSession.submitted = true;
    stopQuizTimer();
    document.getElementById('quizConfirmBox').style.display = 'none';

    const qs = quizSession.questions;
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;
    qs.forEach((q) => {
      const chosen = quizSession.answers[q.id];
      if (chosen === undefined) unanswered++;
      else if (chosen === q.ans) correct++;
      else wrong++;
    });

    const total = qs.length || 1;
    const pct = Math.round((correct / total) * 100);
    const passed = pct >= 60;
    const timeTakenSecs = Math.max(1, quizSession.totalSeconds - quizSession.remainingSeconds);
    const timeTakenStr = formatMmSs(timeTakenSecs);

    document.getElementById('quizActivePanel').style.display = 'none';
    document.getElementById('quizResultsPanel').style.display = 'flex';
    document.getElementById('quizResultHeadline').textContent = autoTimeout ? 'Time Expired — Quiz Auto-Submitted' : 'Quiz Results Dashboard';
    const pfBadge = document.getElementById('quizPassFailBadge');
    pfBadge.textContent = passed ? 'PASSED (≥60%)' : 'NEEDS REVIEW (<60%)';
    pfBadge.className = `conn-status-pill ${passed ? 'ok' : 'err'}`;

    document.getElementById('resTotalQ').textContent = total;
    document.getElementById('resCorrectQ').textContent = correct;
    document.getElementById('resWrongQ').textContent = wrong;
    document.getElementById('resUnansweredQ').textContent = unanswered;
    document.getElementById('resFinalScore').textContent = `${correct} / ${total}`;
    document.getElementById('resPercentage').textContent = `${pct}%`;
    document.getElementById('resTimeTaken').textContent = timeTakenStr;
    document.getElementById('resStatusText').textContent = passed ? 'PASS' : 'FAIL';

    const entry = {
      category: quizSession.modeLabel,
      difficulty: quizSession.diffLabel,
      score: `${correct}/${total} (${pct}%)`,
      pct,
      passed,
      timeTaken: timeTakenStr,
      date: new Date().toLocaleDateString()
    };
    quizHistory.unshift(entry);
    if (quizHistory.length > 20) quizHistory.pop();
    try { localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(quizHistory)); } catch (e) { }

    addStudentActivity(`Quiz Submitted (${entry.category}): ${entry.score}`, passed ? 'PASS' : 'FAIL', passed ? 'ok' : 'crit');
    playCyberTone(passed ? 'success' : 'error');
    renderQuiz();
    renderStudentDashboard();
  }

  function renderQuiz() {
    const pill = document.getElementById('quizLiveScorePill');
    if (pill) pill.textContent = `Completed Attempts: ${quizHistory.length}`;

    // Render Quiz History Table
    const tbody = document.getElementById('quizHistoryTableBody');
    if (tbody) {
      if (quizHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No quiz attempts recorded yet.</td></tr>';
      } else {
        tbody.innerHTML = quizHistory.map((h) => `
          <tr>
            <td>${h.category}</td>
            <td>${h.difficulty}</td>
            <td><span class="table-badge ${h.passed ? 'badge-success' : 'badge-warning'}">${h.score}</span></td>
            <td class="mono">${h.timeTaken}</td>
            <td>${h.date}</td>
          </tr>
        `).join('');
      }
    }

    // Render Quiz Achievements
    const bank = window.QUIZ_BANK || [];
    const cryptoCorrect = bank.filter((q) => q.cat === 'crypto' && studentState.quizAnswered[q.id]?.correct).length;
    const tlsCorrect = bank.filter((q) => q.cat === 'tls' && studentState.quizAnswered[q.id]?.correct).length;
    const anyPerfect = quizHistory.some((h) => h.pct === 100);
    const anyPass = quizHistory.some((h) => h.passed);

    const quizAchs = [
      { title: 'First Quiz', desc: 'Submit your first quiz', unlocked: quizHistory.length >= 1 },
      { title: 'Perfect Score', desc: 'Score 100% on any quiz', unlocked: anyPerfect },
      { title: 'Cryptography Expert', desc: 'Answer 5+ Cryptography MCQs correctly', unlocked: cryptoCorrect >= 5 },
      { title: 'TLS Master', desc: 'Answer 5+ TLS Fundamentals MCQs correctly', unlocked: tlsCorrect >= 5 },
      { title: 'Quiz Champion', desc: 'Pass 3+ quizzes or mock exams', unlocked: quizHistory.filter((h) => h.passed).length >= 3 || (quizHistory.length >= 3 && anyPass) }
    ];
    const unlocked = quizAchs.filter((a) => a.unlocked).length;
    const countEl = document.getElementById('quizAchCount');
    if (countEl) countEl.textContent = `${unlocked} / 5 Unlocked`;

    const grid = document.getElementById('quizAchievementsGrid');
    if (grid) {
      grid.innerHTML = quizAchs.map((a) => `
        <div class="achievement-badge-card ${a.unlocked ? 'unlocked' : ''}">
          <span class="abc-title">${a.unlocked ? '★ ' : ''}${a.title}</span>
          <span class="abc-desc">${a.desc}</span>
          <span class="abc-status">${a.unlocked ? 'UNLOCKED' : 'LOCKED'}</span>
        </div>
      `).join('');
    }
  }

  // 3. PRACTICAL CYBERSECURITY CHALLENGE CENTER
  const CHAL_HISTORY_KEY = 'tls_lab_challenge_history_v1';
  let activeChallengeId = (window.CHALLENGES_BANK && window.CHALLENGES_BANK[0]) ? window.CHALLENGES_BANK[0].id : 'chal_tls_version';
  let chalHintTier = 0;
  let chalStartTimeMs = Date.now();

  function getChallengesList() {
    return Array.isArray(window.CHALLENGES_BANK) ? window.CHALLENGES_BANK : [];
  }

  function loadChalHistory() {
    try {
      const raw = localStorage.getItem(CHAL_HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }

  function saveChalHistory(hist) {
    try { localStorage.setItem(CHAL_HISTORY_KEY, JSON.stringify(hist.slice(0, 50))); } catch { }
  }

  function getChalTotalPoints() {
    const hist = loadChalHistory();
    const bestById = {};
    hist.forEach((h) => {
      if (h.status === 'Passed') {
        bestById[h.id] = Math.max(bestById[h.id] || 0, Number(h.score) || 0);
      }
    });
    return Object.values(bestById).reduce((acc, v) => acc + v, 0);
  }

  async function computeSha256Hex(str) {
    const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function validateChallengeSubmission(ch, rawInput) {
    const v = ch.validator || {};
    const norm = (rawInput || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (v.type === 'text') {
      const accepted = Array.isArray(v.accepted) ? v.accepted.map((a) => a.toLowerCase()) : [];
      if (!norm) return { ok: false, msg: 'Please enter an answer before submitting.' };
      if (accepted.includes(norm)) return { ok: true, msg: 'Exact match verified! Answer accepted.' };
      return { ok: false, msg: 'Incorrect answer. Check the instructions or reveal a progressive hint.' };
    }
    if (v.type === 'sha256_exact') {
      if (!norm) return { ok: false, msg: 'Please paste the 64-character SHA-256 hex digest.' };
      const expected = await computeSha256Hex(v.sourceText || '');
      if (norm === expected) return { ok: true, msg: `Web Crypto SHA-256 digest matched (${expected.slice(0, 16)}...).` };
      return { ok: false, msg: 'Digest mismatch. Ensure exact input string without extra trailing spaces.' };
    }
    if (v.type === 'live_handshake') {
      return analyticsState.handshakeCompleted
        ? { ok: true, msg: 'TLS 1.3 Handshake Step 5 verified in active session!' }
        : { ok: false, msg: 'Handshake Step 5 not yet completed. Open Handshake Simulator and step to Step 5.' };
    }
    if (v.type === 'live_aes') {
      return analyticsState.aesVerified
        ? { ok: true, msg: 'AES-GCM authenticated encryption verified in Practical Crypto Lab!' }
        : { ok: false, msg: 'AES-GCM encryption not yet executed. Open Practical Crypto Lab and encrypt a message.' };
    }
    if (v.type === 'live_rsa') {
      return rsaVerifiedFlag
        ? { ok: true, msg: 'RSA-2048 digital signature verification confirmed!' }
        : { ok: false, msg: 'RSA signature not yet verified. Open Practical Crypto Lab -> RSA Signatures.' };
    }
    if (v.type === 'live_ecdh') {
      return analyticsState.ecdhVerified
        ? { ok: true, msg: 'ECDHE P-256 shared secret derivation verified!' }
        : { ok: false, msg: 'ECDHE derivation not yet executed. Open Practical Crypto Lab -> ECDHE.' };
    }
    if (v.type === 'live_cert_invalid') {
      const invalids = analyticsState.certCounts.expired + analyticsState.certCounts.selfSigned + analyticsState.certCounts.warnings;
      return invalids > 0
        ? { ok: true, msg: 'Invalid/fraudulent certificate rejection verified in Certificate Inspector!' }
        : { ok: false, msg: 'No invalid certificate tested yet. Open Certificate Inspector and verify Scenario 2, 3, or 4.' };
    }
    if (v.type === 'live_shield') {
      return analyticsState.threatShieldTested
        ? { ok: true, msg: 'Attack Playground TLS Shield defense verified!' }
        : { ok: false, msg: 'TLS Shield not yet tested. Open Attack Playground and trigger a defended attack simulation.' };
    }
    return { ok: false, msg: 'Validator not configured.' };
  }

  function renderChallengeHistory() {
    const tbody = document.getElementById('chalHistoryBody');
    if (!tbody) return;
    const hist = loadChalHistory();
    if (!hist.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-secondary);">No challenge attempts recorded yet.</td></tr>';
      return;
    }
    tbody.innerHTML = hist.map((h) => `
      <tr>
        <td>${h.title}</td>
        <td>${h.catLabel}</td>
        <td><span class="badge ${h.diff === 'Beginner' ? 'badge-pass' : h.diff === 'Intermediate' ? 'badge-warn' : 'badge-fail'}">${h.diff}</span></td>
        <td><span class="badge ${h.status === 'Passed' ? 'badge-pass' : 'badge-fail'}">${h.status}</span></td>
        <td>${h.score} PTS</td>
        <td>${h.timeSec}s</td>
        <td>${h.hintsUsed}/4</td>
        <td>${h.date}</td>
      </tr>
    `).join('');
  }

  function renderActiveChallengeWorkbench(preserveResult = false) {
    const list = getChallengesList();
    const ch = list.find((x) => x.id === activeChallengeId) || list[0];
    if (!ch) return;
    activeChallengeId = ch.id;

    const done = studentState.completedChallenges.includes(ch.id);
    const titleEl = document.getElementById('chalActiveTitle');
    const metaEl = document.getElementById('chalActiveMeta');
    const statusEl = document.getElementById('chalActiveStatus');
    const descEl = document.getElementById('chalActiveDesc');
    const objEl = document.getElementById('chalObjectivesList');
    const instEl = document.getElementById('chalInstructionsList');
    const lblEl = document.getElementById('chalInputLabel');
    const inpEl = document.getElementById('chalInputField');
    const outEl = document.getElementById('chalOutputBox');
    const hintBtn = document.getElementById('btnChalHint');
    const hintsList = document.getElementById('chalHintsList');
    const resPanel = document.getElementById('chalResultPanel');

    if (titleEl) titleEl.textContent = ch.title;
    if (metaEl) metaEl.textContent = `${ch.catLabel} • ${ch.diff} • ${ch.time} • ${ch.basePoints} PTS`;
    if (statusEl) {
      statusEl.textContent = done ? 'Completed ✓' : 'Pending';
      statusEl.className = `badge ${done ? 'badge-pass' : 'badge-info'}`;
    }
    if (descEl) descEl.textContent = ch.desc;
    if (objEl) objEl.innerHTML = (ch.objectives || []).map((o) => `<li>${o}</li>`).join('');
    if (instEl) instEl.innerHTML = (ch.instructions || []).map((s) => `<li>${s}</li>`).join('');
    if (lblEl) lblEl.textContent = ch.inputLabel || 'Your Answer / Lab Output';
    if (inpEl) {
      inpEl.placeholder = ch.inputPlaceholder || 'Enter your answer...';
      inpEl.value = '';
    }
    if (outEl) {
      outEl.style.color = 'var(--text-secondary)';
      outEl.textContent = done
        ? 'Already solved in your profile! You can re-test or submit again anytime.'
        : 'Ready. Follow the instructions above and click Submit Answer to validate.';
    }
    if (hintBtn) hintBtn.textContent = `Hint (${chalHintTier}/4)`;
    if (hintsList) {
      if (chalHintTier > 0 && Array.isArray(ch.hints)) {
        hintsList.style.display = 'flex';
        hintsList.innerHTML = ch.hints.slice(0, chalHintTier).map((h, idx) => `
          <div style="padding:10px 12px; border-radius:8px; background:rgba(255,102,133,0.08); border:1px solid rgba(255,102,133,0.35); font-size:0.84rem; color:var(--text-primary);">
            <strong style="color:var(--accent-primary);">Tier ${idx + 1}:</strong> ${h}
          </div>
        `).join('');
      } else {
        hintsList.style.display = 'none';
        hintsList.innerHTML = '';
      }
    }
    if (resPanel && !preserveResult) resPanel.style.display = 'none';
  }

  function renderChallenges(preserveResult = false) {
    const grid = document.getElementById('challengesGrid');
    if (!grid) return;
    const list = getChallengesList();
    const catFilter = document.getElementById('chalCategoryFilter')?.value || 'all';
    const diffFilter = document.getElementById('chalDifficultyFilter')?.value || 'all';

    const filtered = list.filter((ch) => {
      const catOk = catFilter === 'all' || ch.cat === catFilter;
      const diffOk = diffFilter === 'all' || ch.diff === diffFilter;
      return catOk && diffOk;
    });

    const solvedCount = list.filter((c) => studentState.completedChallenges.includes(c.id)).length;
    const compPill = document.getElementById('chalCompletionPill');
    const ptsPill = document.getElementById('chalTotalPointsPill');
    if (compPill) compPill.textContent = `${solvedCount} / ${list.length} Solved`;
    if (ptsPill) ptsPill.textContent = `${getChalTotalPoints()} PTS`;

    if (!filtered.length) {
      grid.innerHTML = '<div style="padding:16px; color:var(--text-secondary); font-size:0.9rem;">No challenges match the selected filters.</div>';
    } else {
      grid.innerHTML = filtered.map((ch) => {
        const done = studentState.completedChallenges.includes(ch.id);
        const active = ch.id === activeChallengeId;
        return `
          <button type="button" class="academy-lesson-btn ${active ? 'active' : ''} ${done ? 'done' : ''}" data-chal-select="${ch.id}" style="text-align:left; width:100%;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px;">
              <span style="font-size:0.72rem; text-transform:uppercase; color:var(--accent-secondary); font-weight:700;">${ch.catLabel} &bull; ${ch.diff}</span>
              <span class="badge ${done ? 'badge-pass' : 'badge-info'}" style="font-size:0.7rem;">${done ? 'Solved ✓' : `${ch.basePoints} PTS`}</span>
            </div>
            <div style="font-weight:600; font-size:0.9rem; color:var(--text-primary);">${ch.title}</div>
          </button>
        `;
      }).join('');

      grid.querySelectorAll('[data-chal-select]').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeChallengeId = btn.getAttribute('data-chal-select');
          chalHintTier = 0;
          chalStartTimeMs = Date.now();
          renderChallenges();
        });
      });
    }

    renderActiveChallengeWorkbench(preserveResult);
    renderChallengeHistory();
  }

  // 4. STUDENT DASHBOARD RENDERER (REAL PROGRESS ONLY)
  const STU_LAB_CARDS = [
    { id: 'handshake', title: 'TLS Handshake Simulator', desc: 'Step through ClientHello, ServerHello, Certificate, and Key Establishment.', target: 'tabSimulator' },
    { id: 'aes', title: 'AES Encryption & Decryption', desc: 'Encrypt and decrypt payloads using real Web Crypto AES-256-GCM.', target: 'tabCrypto' },
    { id: 'ecdh', title: 'ECDH Key Exchange', desc: 'Derive identical P-256 shared secrets without exposing private keys.', target: 'tabCrypto' },
    { id: 'rsa', title: 'RSA Digital Signatures', desc: 'Sign transcripts with RSA-2048 private keys and verify tampering.', target: 'tabCrypto' },
    { id: 'sha256', title: 'SHA-256 Hash Generator', desc: 'Compute 256-bit digests and observe the cryptographic avalanche effect.', target: 'tabCrypto' }
  ];

  const LESSON_META = {
    tls_fundamentals: { diff: 'Beginner', time: '10 min', short: 'Learn TLS 1.3 1-RTT handshake phases and record protection.' },
    network_security: { diff: 'Beginner', time: '12 min', short: 'Understand the CIA triad and common untrusted-network threats.' },
    cryptography: { diff: 'Intermediate', time: '15 min', short: 'Explore symmetric AES-GCM, asymmetric ECDHE, and SHA-256.' },
    digital_certificates: { diff: 'Intermediate', time: '12 min', short: 'Examine X.509 certificates, CAs, and PKI trust chains.' },
    https_comm: { diff: 'Beginner', time: '10 min', short: 'See how HTTPS encapsulates HTTP traffic with Forward Secrecy.' }
  };

  function renderStudentDashboard() {
    const lessonsDone = studentState.completedLessons.length;
    const labsDone = studentState.completedLabs.length;
    const chalDone = studentState.completedChallenges.length;
    const quizVals = Object.values(studentState.quizAnswered);
    const quizCorrect = quizVals.filter((a) => a.correct).length;
    const quizTotal = quizVals.length;
    const quizPct = quizTotal > 0 ? Math.round((quizCorrect / quizTotal) * 100) : 0;

    const allLessons = getAllAcademyLessons();
    const totalLessonsCount = allLessons.length || 35;
    const totalItems = totalLessonsCount + 5 + 5 + 10;
    const completedItems = lessonsDone + labsDone + chalDone + quizCorrect;
    const overallPct = Math.round((completedItems / totalItems) * 100);

    const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    if (typeof loadStudentProfile === 'function') {
      const prof = loadStudentProfile();
      setTxt('stuWelcomeTitle', prof.name ? `Welcome back, ${prof.name}` : 'Welcome to TLS Security Lab');
      setTxt('stuDashProfileBadge', `${prof.course || 'B.Tech CSE'} • ${prof.learningLevel || 'Beginner'}`);
    }
    setTxt('stuOverallPct', `${overallPct}%`);
    setTxt('sidebarStudentPct', `${overallPct}%`);
    const bar = document.getElementById('stuOverallBar');
    if (bar) bar.style.width = `${overallPct}%`;
    setTxt('stuLessonsCount', `${lessonsDone} / ${totalLessonsCount}`);
    setTxt('stuLabsCount', `${labsDone} / 5`);

    const qAvg = quizHistory.length > 0
      ? Math.round(quizHistory.reduce((s, h) => s + (h.pct || 0), 0) / quizHistory.length)
      : quizPct;
    const qCount = quizHistory.length || quizTotal;
    setTxt('stuQuizAvgVal', `${qAvg}%`);
    setTxt('stuQuizAvgSub', qCount > 0 ? `${qCount} attempt(s)` : 'No attempts yet');

    const expTotal = Math.max(studentState.experimentCount || 0, labsDone);
    setTxt('stuExpTotalSub', `${expTotal} total lab run(s)`);

    const tSec = studentState.timeBySection || { academy: 0, lab: 0, quiz: 0, playground: 0 };
    const totalSecs = (tSec.academy || 0) + (tSec.lab || 0) + (tSec.quiz || 0) + (tSec.playground || 0);
    setTxt('stuLearningHours', `${(totalSecs / 3600).toFixed(2)}h`);
    setTxt('stuLearningMinsSub', `${Math.floor(totalSecs / 60)}m active study`);

    const streaks = typeof computeStreaks === 'function' ? computeStreaks() : { current: 0, longest: 0 };
    setTxt('stuStreakDays', `${streaks.current} Day${streaks.current === 1 ? '' : 's'}`);
    setTxt('stuStreakSub', `Longest: ${streaks.longest} Day${streaks.longest === 1 ? '' : 's'}`);

    setTxt('stuCurrentDatePill', new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }));
    setTxt('stuLearningStatusPill', overallPct >= 80 ? 'Advanced Track' : overallPct >= 30 ? 'In Progress' : 'Getting Started');
    const cmdBanner = document.getElementById('stuCommandStatusBanner');
    if (cmdBanner) {
      cmdBanner.textContent = `Live Records Synced • ${lessonsDone}/${totalLessonsCount} Lessons • ${labsDone}/5 Labs`;
      cmdBanner.className = 'badge badge-pass';
    }
    if (!isWarmupPhase && typeof renderStudentDashboardCharts === 'function') {
      renderStudentDashboardCharts();
    }

    // Render Learning Academy Module cards
    const acadGrid = document.getElementById('stuAcademyCardsGrid');
    if (acadGrid) {
      acadGrid.innerHTML = ACADEMY_MODULES.map((mod) => {
        const modDone = mod.lessons.filter((l) => studentState.completedLessons.includes(l.id)).length;
        const firstLessonId = mod.lessons[0]?.id || 'tls_intro';
        return `
          <div class="stu-module-card">
            <div class="smc-top">
              <span class="smc-meta">${mod.lessons.length} Lessons</span>
              <span class="smc-time">${modDone}/${mod.lessons.length} Done</span>
            </div>
            <h4 class="smc-title">${mod.title.replace(/^Module \d+:\s*/, '')}</h4>
            <p class="smc-desc">${mod.shortDesc}</p>
            <button class="btn btn-sm ${modDone === mod.lessons.length ? 'btn-secondary' : 'btn-primary'}" data-stu-lesson="${firstLessonId}">
              ${modDone > 0 ? 'Continue Module' : 'Start Learning'}
            </button>
          </div>
        `;
      }).join('');
      acadGrid.querySelectorAll('[data-stu-lesson]').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeLessonId = btn.getAttribute('data-stu-lesson');
          renderAcademy();
          navigateToSection('tabAcademy');
        });
      });
    }

    // Render Practical Lab cards
    const labGrid = document.getElementById('stuPracticalLabGrid');
    if (labGrid) {
      labGrid.innerHTML = STU_LAB_CARDS.map((lab) => {
        const done = studentState.completedLabs.includes(lab.id);
        return `
          <div class="stu-module-card">
            <div class="smc-top">
              <span class="smc-meta">${done ? 'Completed ✓' : 'Interactive Lab'}</span>
            </div>
            <h4 class="smc-title">${lab.title}</h4>
            <p class="smc-desc">${lab.desc}</p>
            <button class="btn btn-sm ${done ? 'btn-secondary' : 'btn-primary'}" data-stu-lab="${lab.target}">
              ${done ? 'Open Again' : 'Open Lab'}
            </button>
          </div>
        `;
      }).join('');
      labGrid.querySelectorAll('[data-stu-lab]').forEach((btn) => {
        btn.addEventListener('click', () => navigateToSection(btn.getAttribute('data-stu-lab')));
      });
    }

    // Daily Cybersecurity Challenge status
    const dailyDone = studentState.completedChallenges.includes('chal_cert_fraud') || studentState.completedChallenges.includes('chal_cert');
    const dailyBadge = document.getElementById('stuDailyChalBadge');
    if (dailyBadge) {
      dailyBadge.textContent = dailyDone ? 'Completed ✓' : 'Pending';
      dailyBadge.className = `conn-status-pill ${dailyDone ? 'ok' : 'warn'}`;
    }

    // Achievements (5 requested badges)
    const achievements = [
      { id: 'ach_first', title: 'First Lesson Completed', desc: 'Complete 1 Academy lesson', unlocked: lessonsDone >= 1 },
      { id: 'ach_crypto', title: 'Cryptography Explorer', desc: 'Complete 2+ Practical Crypto Labs', unlocked: labsDone >= 2 },
      { id: 'ach_tls', title: 'TLS Expert', desc: 'Complete TLS Handshake & 3+ Lessons', unlocked: studentState.completedLabs.includes('handshake') && lessonsDone >= 3 },
      { id: 'ach_quiz', title: 'Quiz Master', desc: 'Answer 5+ Quiz questions correctly', unlocked: quizCorrect >= 5 },
      { id: 'ach_analyst', title: 'Security Analyst', desc: 'Verify an attack shield or catch a fake cert', unlocked: analyticsState.threatShieldTested || chalDone >= 1 }
    ];

    let newlyUnlocked = false;
    achievements.forEach((a) => {
      if (a.unlocked && !studentState.unlockedAchievements.includes(a.id)) {
        studentState.unlockedAchievements.push(a.id);
        studentState.activities.unshift({ title: `Achievement Unlocked: ${a.title}`, time: getTimestamp(), badge: 'BADGE', badgeType: 'ok' });
        if (studentState.activities.length > 12) studentState.activities.pop();
        newlyUnlocked = true;
      }
    });
    if (newlyUnlocked) saveStudentProgress();

    const unlockedCount = achievements.filter((a) => a.unlocked).length;
    setTxt('stuBadgesEarned', `${unlockedCount} / ${achievements.length} Unlocked`);

    const achGrid = document.getElementById('stuAchievementsGrid');
    if (achGrid) {
      achGrid.innerHTML = achievements.map((a) => `
        <div class="achievement-badge-card ${a.unlocked ? 'unlocked' : ''}">
          <span class="abc-title">${a.unlocked ? '★ ' : ''}${a.title}</span>
          <span class="abc-desc">${a.desc}</span>
          <span class="abc-status">${a.unlocked ? 'UNLOCKED' : 'LOCKED'}</span>
        </div>
      `).join('');
    }

    const actFeed = document.getElementById('stuActivityFeed');
    if (actFeed) {
      if (studentState.activities.length === 0) {
        actFeed.innerHTML = '<div class="activity-item"><span class="act-title">No learning activities recorded yet. Start a lesson, lab, or quiz!</span></div>';
      } else {
        actFeed.innerHTML = studentState.activities.map((act) => `
          <div class="activity-item">
            <div class="act-left">
              <span class="act-title">${act.title}</span>
              <span class="act-time">${act.time}</span>
            </div>
            <span class="conn-status-pill ${act.badgeType === 'crit' ? 'err' : 'ok'}">${act.badge}</span>
          </div>
        `).join('');
      }
    }
  }

  // ============================================================================
  // INITIALIZATION & EVENT LISTENERS
  // ============================================================================
  function initEvents() {
    // 1. Sidebar Item Navigation
    navItems.forEach((item) => {
      item.addEventListener('click', () => {
        const targetId = item.getAttribute('data-target');
        if (targetId) {
          navigateToSection(targetId);
        }
      });
    });

    // 2. Sidebar Presentation Button
    if (navItemPresentation) {
      navItemPresentation.addEventListener('click', () => {
        closeMobileSidebar();
        openPresentationMode();
      });
    }

    // 3. Mobile Hamburger & Backdrop Controls
    if (btnHamburger) {
      btnHamburger.addEventListener('click', openMobileSidebar);
    }
    if (btnSidebarClose) {
      btnSidebarClose.addEventListener('click', closeMobileSidebar);
    }
    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', closeMobileSidebar);
    }

    // Dashboard Quick Launch & Analytics Buttons
    const btnRunDashScan = document.getElementById('btnRunDashScan');
    const btnCertHealthGo = document.getElementById('btnCertHealthGo');
    const btnClearActivity = document.getElementById('btnClearActivity');
    if (btnRunDashScan) {
      btnRunDashScan.addEventListener('click', runFullDiagnosticScan);
    }
    if (btnCertHealthGo) {
      btnCertHealthGo.addEventListener('click', () => navigateToSection('tabCertificate'));
    }
    if (btnClearActivity) {
      btnClearActivity.addEventListener('click', () => {
        analyticsState.activities = [];
        renderDashboardAnalytics();
      });
    }
    if (btnDashLaunchSim) {
      btnDashLaunchSim.addEventListener('click', () => navigateToSection('tabSimulator'));
    }
    if (btnDashLaunchCert) {
      btnDashLaunchCert.addEventListener('click', () => navigateToSection('tabCertificate'));
    }
    if (linkToCryptoLab) {
      linkToCryptoLab.addEventListener('click', () => navigateToSection('tabCrypto'));
    }
    if (linkToCertInspector) {
      linkToCertInspector.addEventListener('click', () => navigateToSection('tabCertificate'));
    }
    if (linkToComparison) {
      linkToComparison.addEventListener('click', () => navigateToSection('tabComparison'));
    }

    // 5. Sound toggle
    if (btnToggleSound) {
      btnToggleSound.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundStatusText.textContent = soundEnabled ? 'Audio: On' : 'Audio: Mute';
        btnToggleSound.style.borderColor = soundEnabled ? 'var(--cyan-primary)' : 'var(--text-muted)';
        if (soundEnabled) playCyberTone('packet');
      });
    }

    // 6. Presentation Mode Toggle
    if (btnPresentationMode) {
      btnPresentationMode.addEventListener('click', openPresentationMode);
    }
    if (btnExitPresentation) {
      btnExitPresentation.addEventListener('click', closePresentationMode);
    }
    if (btnPresNext) {
      btnPresNext.addEventListener('click', () => {
        if (currentStep < TOTAL_STEPS) {
          renderOverviewStep(currentStep + 1);
        }
      });
    }
    if (btnPresPrev) {
      btnPresPrev.addEventListener('click', () => {
        if (currentStep > 1) {
          renderOverviewStep(currentStep - 1);
        }
      });
    }

    // 7. Mode Toggle (Overview vs Detailed TLS 1.3)
    if (btnModeOverview && btnModeDetailed) {
      btnModeOverview.addEventListener('click', () => {
        activeMode = 'overview';
        btnModeOverview.classList.add('active');
        btnModeDetailed.classList.remove('active');
        detailedStepperContainer.style.display = 'none';
        detailedMsgInspector.style.display = 'none';
        stepViews.forEach((v) => (v.style.display = ''));
        renderOverviewStep(currentStep);
      });

      btnModeDetailed.addEventListener('click', () => {
        activeMode = 'detailed';
        btnModeDetailed.classList.add('active');
        btnModeOverview.classList.remove('active');
        detailedStepperContainer.style.display = 'flex';
        detailedMsgInspector.style.display = 'flex';
        stepViews.forEach((v) => (v.style.display = 'none'));
        renderDetailedMessage(activeMsgIdx);
      });
    }

    // 8. Detailed Message Ribbon
    msgPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const idx = parseInt(pill.getAttribute('data-msg'), 10);
        renderDetailedMessage(idx);
      });
    });

    // 9. Stepper Nodes & Timeline Clicks
    stepNodes.forEach((node) => {
      node.addEventListener('click', () => {
        const targetStep = parseInt(node.getAttribute('data-step'), 10);
        if (!isNaN(targetStep)) renderOverviewStep(targetStep);
      });
    });

    verticalTimelineItems.forEach((item) => {
      item.addEventListener('click', () => {
        const targetStep = parseInt(item.getAttribute('data-step-ref'), 10);
        if (!isNaN(targetStep)) renderOverviewStep(targetStep);
      });
    });

    tfStepCards.forEach((card) => {
      card.addEventListener('click', () => {
        const targetStep = parseInt(card.getAttribute('data-step-ref'), 10);
        if (!isNaN(targetStep)) {
          navigateToSection('tabSimulator');
          renderOverviewStep(targetStep);
        }
      });
    });

    // 10. Handshake Action Buttons
    btnStart.addEventListener('click', () => {
      if (activeMode === 'overview') {
        renderOverviewStep(1);
      } else {
        renderDetailedMessage(1);
      }
    });
    btnNext.addEventListener('click', nextStep);
    btnPrev.addEventListener('click', prevStep);
    btnReset.addEventListener('click', resetHandshake);

    // Auto Play
    if (toggleAutoPlay) {
      toggleAutoPlay.addEventListener('change', (e) => {
        if (e.target.checked) startAutoPlay();
        else stopAutoPlay();
      });
    }

    // Terminal Clear
    if (btnClearLog) {
      btnClearLog.addEventListener('click', clearPacketLog);
    }

    // Certificate Scenario & Actions
    if (certScenarioSelect) certScenarioSelect.addEventListener('change', updateCertScenario);
    if (btnVerifyCert) btnVerifyCert.addEventListener('click', verifyCertificateAction);
    if (btnResetCert) btnResetCert.addEventListener('click', updateCertScenario);

    // Crypto Lab Operations
    if (btnGenEcdh) btnGenEcdh.addEventListener('click', runWebCryptoEcdhDemo);
    const btnGenAesKey = document.getElementById('btnGenAesKey');
    if (btnGenAesKey) btnGenAesKey.addEventListener('click', generateAesKeyAction);
    if (btnAesEncrypt) btnAesEncrypt.addEventListener('click', runWebCryptoAesEncrypt);
    if (btnAesDecrypt) btnAesDecrypt.addEventListener('click', runWebCryptoAesDecrypt);

    // RSA-OAEP & Hash & Clear & Copy Handlers
    const btnGenRsaOaep = document.getElementById('btnGenRsaOaep');
    const btnRsaOaepEncrypt = document.getElementById('btnRsaOaepEncrypt');
    const btnRsaOaepDecrypt = document.getElementById('btnRsaOaepDecrypt');
    if (btnGenRsaOaep) btnGenRsaOaep.addEventListener('click', generateRsaOaepKeys);
    if (btnRsaOaepEncrypt) btnRsaOaepEncrypt.addEventListener('click', encryptRsaOaep);
    if (btnRsaOaepDecrypt) btnRsaOaepDecrypt.addEventListener('click', decryptRsaOaep);

    const shaAlgoSelect = document.getElementById('shaAlgoSelect');
    if (shaAlgoSelect) shaAlgoSelect.addEventListener('change', computeSha256Compare);

    const btnEcdhClear = document.getElementById('btnEcdhClear');
    const btnAesClear = document.getElementById('btnAesClear');
    const btnRsaOaepClear = document.getElementById('btnRsaOaepClear');
    const btnRsaClear = document.getElementById('btnRsaClear');
    const btnShaClear = document.getElementById('btnShaClear');
    const btnClearCryptoHistory = document.getElementById('btnClearCryptoHistory');

    if (btnEcdhClear) btnEcdhClear.addEventListener('click', () => {
      ecdhClientPub.textContent = 'Cleared.';
      ecdhServerPub.textContent = 'Cleared.';
      ecdhSharedSecret.textContent = 'Cleared.';
      ecdhAgreedChip.textContent = 'ECDH Status: Ready';
    });
    if (btnAesClear) btnAesClear.addEventListener('click', () => {
      cachedAesKey = null; cachedCipherBuffer = null; cachedAesIv = null;
      document.getElementById('aesKeyVal').textContent = 'Cleared.';
      aesIvVal.textContent = 'Pending encryption...';
      aesCipherVal.textContent = 'Cleared.';
      document.getElementById('aesTagVal').textContent = 'Pending encryption...';
      aesDecryptedVal.textContent = 'Awaiting decryption...';
      btnAesDecrypt.disabled = true;
    });
    if (btnRsaOaepClear) btnRsaOaepClear.addEventListener('click', () => {
      cachedRsaOaepPair = null; cachedRsaOaepCipher = null;
      document.getElementById('rsaOaepPubDisplay').textContent = 'Cleared.';
      document.getElementById('rsaOaepCipher').textContent = 'Awaiting encryption...';
      document.getElementById('rsaOaepDecrypted').textContent = 'Awaiting decryption...';
      document.getElementById('btnRsaOaepDecrypt').disabled = true;
    });
    if (btnRsaClear) btnRsaClear.addEventListener('click', () => {
      cachedRsaKeyPair = null; cachedRsaSignature = null;
      document.getElementById('rsaSigOutput').textContent = 'Cleared.';
      document.getElementById('rsaVerifyOutput').textContent = 'Awaiting signature verification...';
      document.getElementById('btnRsaVerify').disabled = true;
    });
    if (btnShaClear) btnShaClear.addEventListener('click', () => {
      document.getElementById('shaInputA').value = '';
      document.getElementById('shaInputB').value = '';
      document.getElementById('shaOutputA').textContent = 'Cleared.';
      document.getElementById('shaOutputB').textContent = 'Cleared.';
    });
    if (btnClearCryptoHistory) btnClearCryptoHistory.addEventListener('click', () => {
      cryptoHistoryEntries.length = 0;
      document.getElementById('cryptoHistoryFeed').innerHTML = '<div class="activity-item"><span class="act-title">History cleared.</span></div>';
    });

    document.querySelectorAll('.btn-mini-copy').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const targetId = btn.getAttribute('data-copy-target');
        const el = document.getElementById(targetId);
        if (el && navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(el.textContent);
            const orig = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = orig; }, 1200);
          } catch (e) { }
        }
      });
    });

    // Comparison Toggles
    if (btnSelectTls12) btnSelectTls12.addEventListener('click', () => updateProtocolComparison('1.2'));
    if (btnSelectTls13) btnSelectTls13.addEventListener('click', () => updateProtocolComparison('1.3'));

    // Security Threat Selector & Playground Controls
    attackTabBtns.forEach((btn) => {
      btn.addEventListener('click', () => selectAttackTab(btn.getAttribute('data-attack')));
    });
    if (btnSimulateAttack) btnSimulateAttack.addEventListener('click', simulateAttackSequence);
    const btnAttackNextStep = document.getElementById('btnAttackNextStep');
    const btnAttackStop = document.getElementById('btnAttackStop');
    const btnAttackReset = document.getElementById('btnAttackReset');
    const btnMarkAttackComplete = document.getElementById('btnMarkAttackComplete');
    const btnClearAttackHistory = document.getElementById('btnClearAttackHistory');

    if (btnAttackNextStep) btnAttackNextStep.addEventListener('click', () => {
      stopAttackSimulation();
      applyAttackStepUI(attackSimStep >= 3 ? 1 : attackSimStep + 1);
    });
    if (btnAttackStop) btnAttackStop.addEventListener('click', () => {
      stopAttackSimulation();
      attStatus.textContent = 'Stopped';
      attackerInterceptor.classList.remove('attacking');
    });
    if (btnAttackReset) btnAttackReset.addEventListener('click', () => {
      stopAttackSimulation();
      applyAttackStepUI(0);
    });
    if (btnMarkAttackComplete) btnMarkAttackComplete.addEventListener('click', () => {
      completedAttackModules.add(activeAttackKey);
      addStudentActivity(`Attack Playground Completed: ${ATTACK_DATA[activeAttackKey]?.title}`, 'DONE', 'ok');
      playCyberTone('success');
      selectAttackTab(activeAttackKey);
    });
    if (btnClearAttackHistory) btnClearAttackHistory.addEventListener('click', () => {
      attackHistoryEntries.length = 0;
      document.getElementById('attackHistoryFeed').innerHTML = '<div class="activity-item"><span class="act-title">Simulation history cleared.</span></div>';
    });

    // Cheatsheet Notes Modal
    if (btnOpenNotes && notesModalOverlay) {
      btnOpenNotes.addEventListener('click', () => notesModalOverlay.classList.add('open'));
    }
    if (btnCloseNotes && notesModalOverlay) {
      btnCloseNotes.addEventListener('click', () => notesModalOverlay.classList.remove('open'));
    }
    if (notesModalOverlay) {
      notesModalOverlay.addEventListener('click', (e) => {
        if (e.target === notesModalOverlay) notesModalOverlay.classList.remove('open');
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevStep();
      } else if (e.key === 'Escape') {
        if (presentationOverlay && presentationOverlay.classList.contains('open')) {
          closePresentationMode();
        }
        if (notesModalOverlay && notesModalOverlay.classList.contains('open')) {
          notesModalOverlay.classList.remove('open');
        }
        closeMobileSidebar();
      }
    });

    // Live typing in Step 5
    if (demoPlaintext) {
      demoPlaintext.addEventListener('input', updateLiveEncryptionDemo);
    }

    // Practical Lab Extensions (RSA & SHA-256)
    const btnGenRsa = document.getElementById('btnGenRsa');
    const btnRsaSign = document.getElementById('btnRsaSign');
    const btnRsaVerify = document.getElementById('btnRsaVerify');
    const btnComputeSha256 = document.getElementById('btnComputeSha256');
    const shaInputA = document.getElementById('shaInputA');
    const shaInputB = document.getElementById('shaInputB');
    if (btnGenRsa) btnGenRsa.addEventListener('click', generateRsaKeys);
    if (btnRsaSign) btnRsaSign.addEventListener('click', signRsaMessage);
    if (btnRsaVerify) btnRsaVerify.addEventListener('click', verifyRsaMessage);
    if (btnComputeSha256) btnComputeSha256.addEventListener('click', computeSha256Compare);
    if (shaInputA) shaInputA.addEventListener('input', computeSha256Compare);
    if (shaInputB) shaInputB.addEventListener('input', computeSha256Compare);

    // Student Learning Platform Events
    const btnStudentGoAcademy = document.getElementById('btnStudentGoAcademy');
    const btnResetStudentProgress = document.getElementById('btnResetStudentProgress');
    const btnMarkLessonComplete = document.getElementById('btnMarkLessonComplete');
    const btnAcadTryLab = document.getElementById('btnAcadTryLab');
    const quizTopicFilter = document.getElementById('quizTopicFilter');
    const quizDiffFilter = document.getElementById('quizDiffFilter');
    const btnQuizPrev = document.getElementById('btnQuizPrev');
    const btnQuizNext = document.getElementById('btnQuizNext');

    if (btnStudentGoAcademy) {
      btnStudentGoAcademy.addEventListener('click', () => {
        activeLessonId = getContinueLearningLessonId();
        renderAcademy();
        navigateToSection('tabAcademy');
      });
    }
    const acadDiffFilter = document.getElementById('acadDiffFilter');
    const btnAcadContinue = document.getElementById('btnAcadContinue');
    const btnAcadPrev = document.getElementById('btnAcadPrev');
    const btnAcadNext = document.getElementById('btnAcadNext');
    if (acadDiffFilter) acadDiffFilter.addEventListener('change', renderAcademy);
    if (btnAcadContinue) {
      btnAcadContinue.addEventListener('click', () => {
        activeLessonId = getContinueLearningLessonId();
        renderAcademy();
      });
    }
    if (btnAcadPrev) {
      btnAcadPrev.addEventListener('click', () => {
        const all = getAllAcademyLessons();
        const i = all.findIndex((l) => l.id === activeLessonId);
        if (i > 0) { activeLessonId = all[i - 1].id; renderAcademy(); }
      });
    }
    if (btnAcadNext) {
      btnAcadNext.addEventListener('click', () => {
        const all = getAllAcademyLessons();
        const i = all.findIndex((l) => l.id === activeLessonId);
        if (i >= 0 && i < all.length - 1) { activeLessonId = all[i + 1].id; renderAcademy(); }
      });
    }
    document.querySelectorAll('.stu-stat-clickable').forEach((card) => {
      card.addEventListener('click', () => navigateToSection(card.getAttribute('data-stu-nav')));
    });
    const btnStuDashStartQuiz = document.getElementById('btnStuDashStartQuiz');
    if (btnStuDashStartQuiz) {
      btnStuDashStartQuiz.addEventListener('click', () => {
        const t = document.getElementById('stuDashQuizTopic')?.value || 'all';
        const d = document.getElementById('stuDashQuizDiff')?.value || 'all';
        if (quizTopicFilter) quizTopicFilter.value = t;
        if (quizDiffFilter) quizDiffFilter.value = d;
        startQuizSession(t, d, null, 10, t === 'all' ? 'Quick Practice Quiz' : `Topic: ${t.toUpperCase()}`);
        navigateToSection('tabQuiz');
      });
    }
    const btnStuDailyGo = document.getElementById('btnStuDailyGo');
    const btnStuDailyValidate = document.getElementById('btnStuDailyValidate');
    if (btnStuDailyGo) btnStuDailyGo.addEventListener('click', () => navigateToSection('tabCertificate'));
    if (btnStuDailyValidate) {
      btnStuDailyValidate.addEventListener('click', () => {
        const passed = (analyticsState.certCounts.expired + analyticsState.certCounts.selfSigned + analyticsState.certCounts.warnings) > 0;
        if (passed) {
          if (!studentState.completedChallenges.includes('chal_cert_fraud')) {
            studentState.completedChallenges.push('chal_cert_fraud');
            addStudentActivity('Daily Challenge Completed: Fraudulent Certificate Detection', 'SOLVED', 'ok');
          }
          playCyberTone('success');
          renderStudentDashboard();
          renderChallenges();
        } else {
          playCyberTone('error');
          const b = document.getElementById('stuDailyChalBadge');
          if (b) { b.textContent = 'Test Invalid Cert First'; b.className = 'conn-status-pill err'; }
        }
      });
    }

    // Challenge Center event listeners
    const chalCatFilter = document.getElementById('chalCategoryFilter');
    const chalDiffFilter = document.getElementById('chalDifficultyFilter');
    const btnChalOpenLab = document.getElementById('btnChalOpenLab');
    const btnChalSubmit = document.getElementById('btnChalSubmit');
    const btnChalHint = document.getElementById('btnChalHint');
    const btnChalReset = document.getElementById('btnChalReset');
    const btnClearChalHistory = document.getElementById('btnClearChalHistory');

    if (chalCatFilter) chalCatFilter.addEventListener('change', renderChallenges);
    if (chalDiffFilter) chalDiffFilter.addEventListener('change', renderChallenges);
    if (btnChalOpenLab) {
      btnChalOpenLab.addEventListener('click', () => {
        const ch = getChallengesList().find((x) => x.id === activeChallengeId);
        if (ch && ch.relatedTab) navigateToSection(ch.relatedTab);
      });
    }
    if (btnChalHint) {
      btnChalHint.addEventListener('click', () => {
        if (chalHintTier < 4) {
          chalHintTier += 1;
          playCyberTone('packet');
          renderActiveChallengeWorkbench();
        }
      });
    }
    if (btnChalReset) {
      btnChalReset.addEventListener('click', () => {
        chalHintTier = 0;
        chalStartTimeMs = Date.now();
        renderActiveChallengeWorkbench();
      });
    }
    if (btnClearChalHistory) {
      btnClearChalHistory.addEventListener('click', () => {
        localStorage.removeItem(CHAL_HISTORY_KEY);
        renderChallenges();
      });
    }
    if (btnChalSubmit) {
      btnChalSubmit.addEventListener('click', async () => {
        const ch = getChallengesList().find((x) => x.id === activeChallengeId);
        if (!ch) return;
        const inpVal = document.getElementById('chalInputField')?.value || '';
        const outEl = document.getElementById('chalOutputBox');
        const resPanel = document.getElementById('chalResultPanel');

        const result = await validateChallengeSubmission(ch, inpVal);
        const timeSec = Math.max(1, Math.round((Date.now() - chalStartTimeMs) / 1000));
        const estSec = (parseInt(ch.time, 10) || 5) * 60;
        const timeBonus = timeSec <= estSec ? 25 : 0;
        const hintPenalty = chalHintTier * 15;
        const earnedScore = result.ok ? Math.max(20, (ch.basePoints || 100) + timeBonus - hintPenalty) : 0;

        if (outEl) {
          outEl.style.color = result.ok ? '#4ade80' : '#ff6685';
          outEl.textContent = (result.ok ? '✓ ' : '✕ ') + result.msg;
        }

        const hist = loadChalHistory();
        hist.unshift({
          id: ch.id,
          title: ch.title,
          catLabel: ch.catLabel,
          diff: ch.diff,
          status: result.ok ? 'Passed' : 'Failed',
          score: earnedScore,
          timeSec,
          hintsUsed: chalHintTier,
          date: new Date().toLocaleDateString()
        });
        saveChalHistory(hist);

        if (result.ok) {
          if (!studentState.completedChallenges.includes(ch.id)) {
            studentState.completedChallenges.push(ch.id);
            addStudentActivity(`Challenge Passed: ${ch.title}`, 'SOLVED', 'ok');
          }
          playCyberTone('success');
          if (resPanel) {
            resPanel.style.display = 'block';
            const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
            setTxt('chalResStatus', 'Challenge Completed ✓');
            setTxt('chalResScore', `+${earnedScore} PTS (${timeBonus ? '+25 Speed Bonus' : 'Standard'})`);
            setTxt('chalResTime', `${timeSec}s`);
            setTxt('chalResAnswer', ch.correctAnswerDisplay || 'Verified');
            setTxt('chalResExplanation', ch.explanation || '');
            setTxt('chalResRecommendation', ch.recommendation ? `Next Recommended: ${ch.recommendation}` : '');
          }
          renderChallenges(true);
          renderStudentDashboard();
          renderProgressSystem();
        } else {
          playCyberTone('error');
          renderChallengeHistory();
        }
      });
    }
    if (btnResetStudentProgress) {
      btnResetStudentProgress.addEventListener('click', () => {
        studentState = defaultStudentState();
        saveStudentProgress();
        renderStudentDashboard();
        renderAcademy();
        renderQuiz();
        renderChallenges();
      });
    }
    if (btnMarkLessonComplete) {
      btnMarkLessonComplete.addEventListener('click', () => {
        const lesson = getAllAcademyLessons().find((l) => l.id === activeLessonId);
        if (lesson && !studentState.completedLessons.includes(lesson.id)) {
          studentState.completedLessons.push(lesson.id);
          addStudentActivity(`Completed Lesson: ${lesson.title}`, 'DONE', 'ok');
          playCyberTone('success');
          renderAcademy();
        }
      });
    }
    if (btnAcadTryLab) {
      btnAcadTryLab.addEventListener('click', () => {
        const lesson = getAllAcademyLessons().find((l) => l.id === activeLessonId);
        if (lesson) navigateToSection(lesson.relatedTab);
      });
    }
    const btnStartPracticeQuiz = document.getElementById('btnStartPracticeQuiz');
    if (btnStartPracticeQuiz) {
      btnStartPracticeQuiz.addEventListener('click', () => {
        const t = quizTopicFilter?.value || 'all';
        const d = quizDiffFilter?.value || 'all';
        const mins = document.getElementById('quizCustomMinutes')?.value || 10;
        startQuizSession(t, d, 10, mins, t === 'all' ? 'All Categories Practice' : `Topic: ${t.toUpperCase()}`);
      });
    }
    document.querySelectorAll('[data-mock-count]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cnt = parseInt(btn.getAttribute('data-mock-count'), 10);
        const mins = parseInt(btn.getAttribute('data-mock-mins'), 10);
        startQuizSession('all', 'all', cnt, mins, `Mock Exam (${cnt} Qs)`);
      });
    });
    if (btnQuizPrev) btnQuizPrev.addEventListener('click', () => { if (quizSession.index > 0) { quizSession.index--; renderActiveQuizQuestion(); } });
    if (btnQuizNext) btnQuizNext.addEventListener('click', () => { if (quizSession.index < quizSession.questions.length - 1) { quizSession.index++; renderActiveQuizQuestion(); } });
    const btnQuizSubmitTrigger = document.getElementById('btnQuizSubmitTrigger');
    const btnQuizCancelSubmit = document.getElementById('btnQuizCancelSubmit');
    const btnQuizConfirmSubmit = document.getElementById('btnQuizConfirmSubmit');
    const btnQuizReviewAnswers = document.getElementById('btnQuizReviewAnswers');
    const btnQuizNewAttempt = document.getElementById('btnQuizNewAttempt');
    const btnClearQuizHistory = document.getElementById('btnClearQuizHistory');

    if (btnQuizSubmitTrigger) btnQuizSubmitTrigger.addEventListener('click', () => {
      const unanswered = quizSession.questions.filter((q) => quizSession.answers[q.id] === undefined).length;
      document.getElementById('quizConfirmText').textContent = unanswered > 0
        ? `You still have ${unanswered} unanswered question(s). Submit quiz now?`
        : 'All questions answered! Confirm quiz submission?';
      document.getElementById('quizConfirmBox').style.display = 'flex';
    });
    if (btnQuizCancelSubmit) btnQuizCancelSubmit.addEventListener('click', () => {
      document.getElementById('quizConfirmBox').style.display = 'none';
    });
    if (btnQuizConfirmSubmit) btnQuizConfirmSubmit.addEventListener('click', () => submitQuizSession(false));
    if (btnQuizReviewAnswers) btnQuizReviewAnswers.addEventListener('click', () => {
      document.getElementById('quizResultsPanel').style.display = 'none';
      document.getElementById('quizActivePanel').style.display = 'flex';
      quizSession.index = 0;
      renderActiveQuizQuestion();
    });
    if (btnQuizNewAttempt) btnQuizNewAttempt.addEventListener('click', () => {
      stopQuizTimer();
      document.getElementById('quizResultsPanel').style.display = 'none';
      document.getElementById('quizActivePanel').style.display = 'none';
      document.getElementById('quizSetupPanel').style.display = 'grid';
    });
    if (btnClearQuizHistory) btnClearQuizHistory.addEventListener('click', () => {
      quizHistory = [];
      try { localStorage.removeItem(QUIZ_HISTORY_KEY); } catch (e) { }
      renderQuiz();
      renderProgressSystem();
    });

    // Progress & Achievement System Events
    const progGoalSelect = document.getElementById('progGoalSelect');
    const btnProgRefresh = document.getElementById('btnProgRefresh');
    const btnProgResetAll = document.getElementById('btnProgResetAll');
    if (progGoalSelect) {
      progGoalSelect.value = String(studentState.dailyGoal || 3);
      progGoalSelect.addEventListener('change', (e) => {
        studentState.dailyGoal = parseInt(e.target.value, 10) || 3;
        saveStudentProgress();
        renderProgressSystem();
      });
    }
    if (btnProgRefresh) btnProgRefresh.addEventListener('click', renderProgressSystem);
    if (btnProgResetAll) {
      btnProgResetAll.addEventListener('click', () => {
        studentState = defaultStudentState();
        quizHistory = [];
        try { localStorage.removeItem(QUIZ_HISTORY_KEY); } catch (e) { }
        saveStudentProgress();
        renderStudentDashboard();
        renderAcademy();
        renderQuiz();
        renderChallenges();
        renderProgressSystem();
        if (typeof renderReportsSystem === 'function') renderReportsSystem();
      });
    }

    // Security Reports & Certificate Center listeners
    const btnSaveStudentName = document.getElementById('btnSaveStudentName');
    const btnRepGenerate = document.getElementById('btnRepGenerate');
    const btnRepPreview = document.getElementById('btnRepPreview');
    const btnRepDownloadPdf = document.getElementById('btnRepDownloadPdf');
    const btnRepPrint = document.getElementById('btnRepPrint');
    const btnRepPreviewPdf = document.getElementById('btnRepPreviewPdf');
    const btnRepPreviewClose = document.getElementById('btnRepPreviewClose');
    const btnVerifyCert = document.getElementById('btnVerifyCert');
    const btnScanQrVerify = document.getElementById('btnScanQrVerify');
    const btnClearRepHistory = document.getElementById('btnClearRepHistory');

    if (btnSaveStudentName) {
      btnSaveStudentName.addEventListener('click', () => {
        const val = (document.getElementById('repStudentName')?.value || '').trim();
        if (!val) {
          setReportBanner('Please enter a valid student name.', 'err');
          playCyberTone('error');
          return;
        }
        try { localStorage.setItem(REP_STUDENT_NAME_KEY, val); } catch { }
        setReportBanner(`Student name saved: ${val}`, 'ok');
        playCyberTone('success');
        renderReportsSystem();
      });
    }
    if (btnRepGenerate) {
      btnRepGenerate.addEventListener('click', () => {
        generateAndSaveReportRecord();
      });
    }
    if (btnRepPreview) {
      btnRepPreview.addEventListener('click', () => {
        openReportPreview();
      });
    }
    if (btnRepDownloadPdf) {
      btnRepDownloadPdf.addEventListener('click', () => {
        downloadFullReportPdf();
      });
    }
    if (btnRepPreviewPdf) {
      btnRepPreviewPdf.addEventListener('click', () => {
        downloadFullReportPdf();
      });
    }
    if (btnRepPrint) {
      btnRepPrint.addEventListener('click', () => {
        openReportPreview();
        setTimeout(() => window.print(), 200);
      });
    }
    if (btnRepPreviewClose) {
      btnRepPreviewClose.addEventListener('click', () => {
        const pc = document.getElementById('repPreviewCard');
        if (pc) pc.style.display = 'none';
      });
    }
    if (btnVerifyCert) {
      btnVerifyCert.addEventListener('click', () => {
        verifyCertificateByInput(document.getElementById('verifyCertIdInput')?.value || '');
      });
    }
    if (btnScanQrVerify) {
      btnScanQrVerify.addEventListener('click', () => {
        verifyCertificateByQrPayload(document.getElementById('verifyQrInput')?.value || '');
      });
    }
    if (btnClearRepHistory) {
      btnClearRepHistory.addEventListener('click', () => {
        try { localStorage.removeItem(REP_HISTORY_KEY); } catch { }
        renderReportsSystem();
        setReportBanner('Report history cleared (issued certificates preserved).', 'info');
      });
    }

    // Student Profile & Settings listeners
    const btnSaveProfile = document.getElementById('btnSaveProfile');
    const btnSaveLearnPrefs = document.getElementById('btnSaveLearnPrefs');
    const btnSaveNotifs = document.getElementById('btnSaveNotifs');
    const btnSaveAppearance = document.getElementById('btnSaveAppearance');
    const btnSavePrivacy = document.getElementById('btnSavePrivacy');
    const btnPrivacyExport = document.getElementById('btnPrivacyExport');
    const btnAccUpdateEmail = document.getElementById('btnAccUpdateEmail');
    const btnAccChangePass = document.getElementById('btnAccChangePass');
    const btnAccLogout = document.getElementById('btnAccLogout');
    const btnAccDeleteReq = document.getElementById('btnAccDeleteReq');

    if (btnSaveProfile) {
      btnSaveProfile.addEventListener('click', () => {
        const name = (document.getElementById('profNameInput')?.value || '').trim();
        const course = (document.getElementById('profCourseInput')?.value || '').trim();
        const dept = (document.getElementById('profDeptInput')?.value || '').trim();
        const avatar = document.getElementById('profAvatarSelect')?.value || 'initials';
        if (!name || name.length < 2) {
          setProfileBanner('Error: Full name must be at least 2 characters.', 'err');
          playCyberTone('error');
          return;
        }
        const prof = loadStudentProfile();
        prof.name = name;
        prof.course = course || 'B.Tech CSE';
        prof.department = dept || 'Computer Science & Engineering';
        prof.avatar = avatar;
        saveStudentProfile(prof);
        setProfileBanner('Profile saved persistently!', 'ok');
        playCyberTone('success');
        renderProfileSystem();
        renderStudentDashboard();
        renderReportsSystem();
      });
    }

    if (btnSaveLearnPrefs) {
      btnSaveLearnPrefs.addEventListener('click', () => {
        const level = document.getElementById('prefLearningMode')?.value || 'Beginner';
        const goal = parseInt(document.getElementById('prefDailyGoal')?.value, 10);
        const quizDiff = document.getElementById('prefQuizDiff')?.value || 'Medium';
        const reminder = document.getElementById('prefStudyReminder')?.value || 'daily';
        if (isNaN(goal) || goal < 1 || goal > 20) {
          setProfileBanner('Error: Daily goal must be between 1 and 20.', 'err');
          playCyberTone('error');
          return;
        }
        const topics = Array.from(document.querySelectorAll('#prefTopicsGroup input[type="checkbox"]:checked')).map((c) => c.value);
        const prof = loadStudentProfile();
        prof.learningLevel = level;
        saveStudentProfile(prof);
        studentState.dailyGoal = goal;
        saveStudentProgress();

        const sets = loadStudentSettings();
        sets.preferredTopics = topics;
        sets.quizDiff = quizDiff;
        sets.studyReminder = reminder;
        saveStudentSettings(sets);

        const qDiffEl = document.getElementById('quizDifficultySelect');
        if (qDiffEl) qDiffEl.value = quizDiff;

        setProfileBanner('Learning preferences saved!', 'ok');
        playCyberTone('success');
        renderProfileSystem();
        renderStudentDashboard();
        renderProgressSystem();
      });
    }

    if (btnSaveNotifs) {
      btnSaveNotifs.addEventListener('click', () => {
        const sets = loadStudentSettings();
        sets.notifications = {
          learning: Boolean(document.getElementById('notifLearning')?.checked),
          quiz: Boolean(document.getElementById('notifQuiz')?.checked),
          achievement: Boolean(document.getElementById('notifAchievement')?.checked),
          challenge: Boolean(document.getElementById('notifChallenge')?.checked),
          weekly: Boolean(document.getElementById('notifWeekly')?.checked)
        };
        saveStudentSettings(sets);
        setProfileBanner('Notification preferences saved!', 'ok');
        playCyberTone('success');
      });
    }

    if (btnSaveAppearance) {
      btnSaveAppearance.addEventListener('click', () => {
        const sets = loadStudentSettings();
        sets.appearance = {
          theme: document.getElementById('appThemeSelect')?.value || 'burgundy',
          fontSize: document.getElementById('appFontSelect')?.value || '16',
          density: document.getElementById('appDensitySelect')?.value || 'comfortable'
        };
        saveStudentSettings(sets);
        applyAppearanceSettings();
        setProfileBanner('Appearance settings applied & saved!', 'ok');
        playCyberTone('success');
      });
    }

    if (btnSavePrivacy) {
      btnSavePrivacy.addEventListener('click', () => {
        const sets = loadStudentSettings();
        sets.privacy = {
          profileVis: document.getElementById('privProfileVis')?.value || 'private',
          activityVis: document.getElementById('privActivityVis')?.value || 'visible',
          analyticsOptIn: Boolean(document.getElementById('privAnalyticsOptIn')?.checked)
        };
        saveStudentSettings(sets);
        setProfileBanner('Privacy controls updated!', 'ok');
        playCyberTone('success');
      });
    }

    if (btnPrivacyExport) {
      btnPrivacyExport.addEventListener('click', () => {
        const exportObj = {
          exportedAt: new Date().toISOString(),
          profile: loadStudentProfile(),
          settings: loadStudentSettings(),
          progress: studentState,
          quizHistory,
          challengeHistory: typeof loadChalHistory === 'function' ? loadChalHistory() : [],
          issuedCertificates: typeof loadIssuedCerts === 'function' ? loadIssuedCerts() : {}
        };
        const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TLS_Security_Lab_Data_${getTodayKey()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setProfileBanner('Personal learning data exported (passwords excluded).', 'ok');
        playCyberTone('success');
      });
    }

    if (btnAccUpdateEmail) {
      btnAccUpdateEmail.addEventListener('click', () => {
        const email = (document.getElementById('accEmailInput')?.value || '').trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setProfileBanner('Error: Enter a valid email address.', 'err');
          playCyberTone('error');
          return;
        }
        const auth = loadAccountAuth();
        auth.email = email;
        saveAccountAuth(auth);
        setProfileBanner('Student email updated securely.', 'ok');
        playCyberTone('success');
      });
    }

    if (btnAccChangePass) {
      btnAccChangePass.addEventListener('click', async () => {
        const curr = document.getElementById('accCurrPass')?.value || '';
        const np = document.getElementById('accNewPass')?.value || '';
        const cp = document.getElementById('accConfirmPass')?.value || '';
        const auth = loadAccountAuth();
        if (auth.passwordHash) {
          const valid = await verifyStoredPassword(curr, auth.passwordHash);
          if (!valid) {
            setProfileBanner('Error: Current password is incorrect.', 'err');
            playCyberTone('error');
            return;
          }
        }
        if (np.length < 8 || !/[A-Za-z]/.test(np) || !/\d/.test(np)) {
          setProfileBanner('Error: Password must be >= 8 chars and include both letters and digits.', 'err');
          playCyberTone('error');
          return;
        }
        if (np !== cp) {
          setProfileBanner('Error: New passwords do not match.', 'err');
          playCyberTone('error');
          return;
        }
        auth.passwordHash = await hashPasswordPbkdf2(np);
        auth.sessionActive = true;
        saveAccountAuth(auth);
        ['accCurrPass', 'accNewPass', 'accConfirmPass'].forEach((id) => { const el = document.getElementById(id); if (el) el.value = ''; });
        setProfileBanner('Password hashed (PBKDF2-SHA256, 100k iterations) and updated!', 'ok');
        playCyberTone('success');
        renderProfileSystem();
      });
    }

    if (btnAccLogout) {
      btnAccLogout.addEventListener('click', async () => {
        const auth = loadAccountAuth();
        if (auth.sessionActive) {
          auth.sessionActive = false;
          saveAccountAuth(auth);
          setProfileBanner('Session logged out safely. Enter password in Current Password to resume.', 'info');
          renderProfileSystem();
          return;
        }
        if (auth.passwordHash) {
          const curr = document.getElementById('accCurrPass')?.value || '';
          const ok = await verifyStoredPassword(curr, auth.passwordHash);
          if (!ok) {
            setProfileBanner('Error: Enter your current password to resume session.', 'err');
            playCyberTone('error');
            return;
          }
          const currEl = document.getElementById('accCurrPass');
          if (currEl) currEl.value = '';
        }
        auth.sessionActive = true;
        saveAccountAuth(auth);
        setProfileBanner('Session authenticated and resumed.', 'ok');
        playCyberTone('success');
        renderProfileSystem();
      });
    }

    if (btnAccDeleteReq) {
      btnAccDeleteReq.addEventListener('click', async () => {
        const conf = (document.getElementById('accDeleteConfirm')?.value || '').trim();
        if (conf !== 'DELETE') {
          setProfileBanner('Error: Type DELETE to confirm account deletion.', 'err');
          playCyberTone('error');
          return;
        }
        const auth = loadAccountAuth();
        if (auth.passwordHash) {
          const curr = document.getElementById('accCurrPass')?.value || '';
          const ok = await verifyStoredPassword(curr, auth.passwordHash);
          if (!ok) {
            setProfileBanner('Error: Enter your current password before deleting your account.', 'err');
            playCyberTone('error');
            return;
          }
        }
        [PROF_STORAGE_KEY, PROF_SETTINGS_KEY, PROF_AUTH_KEY, REP_STUDENT_NAME_KEY, STUDENT_STORAGE_KEY, QUIZ_HISTORY_KEY, CHAL_HISTORY_KEY, REP_ISSUED_CERTS_KEY, REP_HISTORY_KEY].forEach((k) => {
          try { localStorage.removeItem(k); } catch { }
        });
        studentState = defaultStudentState();
        quizHistory = [];
        applyAppearanceSettings();
        renderProfileSystem();
        renderStudentDashboard();
        renderProgressSystem();
        renderReportsSystem();
        renderChallenges();
        setProfileBanner('Local account and learning data deleted.', 'info');
      });
    }

    // AI Security Advisor listeners
    const btnAiSubmit = document.getElementById('btnAiSubmit');
    const btnAiLoadEvidence = document.getElementById('btnAiLoadEvidence');
    const btnAiClearHistory = document.getElementById('btnAiClearHistory');
    const aiModeSelect = document.getElementById('aiModeSelect');
    if (aiModeSelect) aiModeSelect.addEventListener('change', updateAiModePromptHint);
    if (btnAiLoadEvidence) btnAiLoadEvidence.addEventListener('click', loadAiModeSampleOrEvidence);
    if (btnAiClearHistory) {
      btnAiClearHistory.addEventListener('click', () => {
        try { localStorage.removeItem(AI_HISTORY_KEY); } catch { }
        renderAiHistory();
      });
    }
    if (btnAiSubmit) btnAiSubmit.addEventListener('click', submitAiAnalysisRequest);

    // Admin & Faculty Portal listeners
    const btnAdmLogin = document.getElementById('btnAdmLogin');
    const btnAdmLogout = document.getElementById('btnAdmLogout');
    const btnAdmRefresh = document.getElementById('btnAdmRefresh');
    const admStudentSearch = document.getElementById('admStudentSearch');
    const btnAdmAddLesson = document.getElementById('btnAdmAddLesson');
    const btnAdmAddQuiz = document.getElementById('btnAdmAddQuiz');
    const btnAdmAddLab = document.getElementById('btnAdmAddLab');

    if (btnAdmLogin) btnAdmLogin.addEventListener('click', loginAdminPortal);
    if (btnAdmLogout) btnAdmLogout.addEventListener('click', logoutAdminPortal);
    if (btnAdmRefresh) btnAdmRefresh.addEventListener('click', renderAdminPortalSystem);
    if (admStudentSearch) admStudentSearch.addEventListener('input', renderAdminStudentsTable);
    if (btnAdmAddLesson) btnAdmAddLesson.addEventListener('click', createFacultyLesson);
    if (btnAdmAddQuiz) btnAdmAddQuiz.addEventListener('click', createFacultyQuiz);
    if (btnAdmAddLab) btnAdmAddLab.addEventListener('click', createFacultyLab);

    // Classroom & Collaboration listeners
    const btnClsGoAuth = document.getElementById('btnClsGoAuth');
    const btnClsJoin = document.getElementById('btnClsJoin');
    const btnClsCreate = document.getElementById('btnClsCreate');
    const clsSelector = document.getElementById('clsSelector');
    const btnClsArchiveToggle = document.getElementById('btnClsArchiveToggle');
    const btnClsLeave = document.getElementById('btnClsLeave');
    const btnClsAddAsg = document.getElementById('btnClsAddAsg');
    const btnClsAddAnn = document.getElementById('btnClsAddAnn');
    const btnClsAddDisc = document.getElementById('btnClsAddDisc');
    const btnClsAddProj = document.getElementById('btnClsAddProj');
    const btnClsOpenAtt = document.getElementById('btnClsOpenAtt');

    if (btnClsGoAuth) btnClsGoAuth.addEventListener('click', () => navigateToSection('tabAdminPortal'));
    if (btnClsJoin) btnClsJoin.addEventListener('click', joinClassroomByCode);
    if (btnClsCreate) btnClsCreate.addEventListener('click', createNewClassroom);
    if (clsSelector) clsSelector.addEventListener('change', () => { activeClassroomId = clsSelector.value; renderSelectedClassroom(); });
    if (btnClsArchiveToggle) btnClsArchiveToggle.addEventListener('click', toggleArchiveClassroom);
    if (btnClsLeave) btnClsLeave.addEventListener('click', leaveCurrentClassroom);
    if (btnClsAddAsg) btnClsAddAsg.addEventListener('click', createClassroomAssignment);
    if (btnClsAddAnn) btnClsAddAnn.addEventListener('click', createClassroomAnnouncement);
    if (btnClsAddDisc) btnClsAddDisc.addEventListener('click', createClassroomDiscussion);
    if (btnClsAddProj) btnClsAddProj.addEventListener('click', createClassroomProject);
    if (btnClsOpenAtt) btnClsOpenAtt.addEventListener('click', openClassroomAttendance);

    // Real-Time TLS Monitor listeners
    const btnMonProbe = document.getElementById('btnMonProbe');
    const btnMonClear = document.getElementById('btnMonClear');
    const monSearchInput = document.getElementById('monSearchInput');
    const monStatusFilter = document.getElementById('monStatusFilter');
    if (btnMonProbe) btnMonProbe.addEventListener('click', triggerLiveTlsProbe);
    if (btnMonClear) btnMonClear.addEventListener('click', clearTlsMonitorHistory);
    if (monSearchInput) monSearchInput.addEventListener('input', renderTlsMonitorViews);
    if (monStatusFilter) monStatusFilter.addEventListener('change', renderTlsMonitorViews);

    // PCAP & Traffic Analysis listeners
    const btnPcapLoadSample = document.getElementById('btnPcapLoadSample');
    const btnPcapUpload = document.getElementById('btnPcapUpload');
    const btnPcapGenReport = document.getElementById('btnPcapGenReport');
    const btnPcapCompleteLab = document.getElementById('btnPcapCompleteLab');
    ['pcapFilterIp', 'pcapFilterProto', 'pcapFilterPort', 'pcapFilterMinSize'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', renderPcapLab);
    });
    if (btnPcapLoadSample) btnPcapLoadSample.addEventListener('click', loadSamplePcapCapture);
    if (btnPcapUpload) btnPcapUpload.addEventListener('click', uploadAndAnalyzePcap);
    if (btnPcapGenReport) btnPcapGenReport.addEventListener('click', generatePcapReport);
    if (btnPcapCompleteLab) btnPcapCompleteLab.addEventListener('click', validatePcapStudentLab);

    // Career & Certification Center listeners
    const carRoadmapSelect = document.getElementById('carRoadmapSelect');
    const carCertSelect = document.getElementById('carCertSelect');
    const carIntTopicSelect = document.getElementById('carIntTopicSelect');
    const carIntDiffSelect = document.getElementById('carIntDiffSelect');
    const btnCarIntNext = document.getElementById('btnCarIntNext');
    const btnCarVivaRandom = document.getElementById('btnCarVivaRandom');
    const btnCarVivaRetry = document.getElementById('btnCarVivaRetry');
    const btnCarVivaReveal = document.getElementById('btnCarVivaReveal');
    const btnCarVivaGotIt = document.getElementById('btnCarVivaGotIt');
    const btnCarVivaMissed = document.getElementById('btnCarVivaMissed');
    const btnCarSkillSubmit = document.getElementById('btnCarSkillSubmit');
    const btnCarResumeSave = document.getElementById('btnCarResumeSave');
    const btnCarResumePdf = document.getElementById('btnCarResumePdf');
    const btnCarAiAsk = document.getElementById('btnCarAiAsk');

    if (carRoadmapSelect) carRoadmapSelect.addEventListener('change', renderSelectedRoadmap);
    if (carCertSelect) carCertSelect.addEventListener('change', renderSelectedCertification);
    if (carIntTopicSelect) carIntTopicSelect.addEventListener('change', () => { carIntIdx = 0; renderInterviewQuestion(); });
    if (carIntDiffSelect) carIntDiffSelect.addEventListener('change', () => { carIntIdx = 0; renderInterviewQuestion(); });
    if (btnCarIntNext) btnCarIntNext.addEventListener('click', () => { carIntIdx += 1; renderInterviewQuestion(); });
    if (btnCarVivaRandom) btnCarVivaRandom.addEventListener('click', () => pickVivaQuestion(false));
    if (btnCarVivaRetry) btnCarVivaRetry.addEventListener('click', () => pickVivaQuestion(true));
    if (btnCarVivaReveal) btnCarVivaReveal.addEventListener('click', () => { const b = document.getElementById('carVivaModelBox'); if (b) b.style.display = 'block'; });
    if (btnCarVivaGotIt) btnCarVivaGotIt.addEventListener('click', () => scoreVivaQuestion(true));
    if (btnCarVivaMissed) btnCarVivaMissed.addEventListener('click', () => scoreVivaQuestion(false));
    if (btnCarSkillSubmit) btnCarSkillSubmit.addEventListener('click', submitCareerSkillAssessment);
    if (btnCarResumeSave) btnCarResumeSave.addEventListener('click', saveCareerResume);
    if (btnCarResumePdf) btnCarResumePdf.addEventListener('click', exportCareerResumePdf);
    if (btnCarAiAsk) btnCarAiAsk.addEventListener('click', askCareerAiAssistant);
    document.querySelectorAll('[data-car-nav]').forEach((b) => {
      b.addEventListener('click', () => navigateToSection(b.getAttribute('data-car-nav')));
    });

    // Multi-Language & Text-to-Speech listeners
    const headerLangSelect = document.getElementById('headerLangSelect');
    const btnHeaderBilingual = document.getElementById('btnHeaderBilingual');
    const glossarySearchInput = document.getElementById('glossarySearchInput');
    const glossaryCatSelect = document.getElementById('glossaryCatSelect');
    const btnTtsPlay = document.getElementById('btnTtsPlay');
    const btnTtsPause = document.getElementById('btnTtsPause');
    const btnTtsResume = document.getElementById('btnTtsResume');
    const btnTtsStop = document.getElementById('btnTtsStop');

    if (headerLangSelect) {
      headerLangSelect.addEventListener('change', () => {
        const s = loadStudentSettings();
        s.language = headerLangSelect.value;
        saveStudentSettings(s);
        applyLanguageSettings();
      });
    }
    if (btnHeaderBilingual) {
      btnHeaderBilingual.addEventListener('click', () => {
        const s = loadStudentSettings();
        s.bilingual = !s.bilingual;
        saveStudentSettings(s);
        applyLanguageSettings();
      });
    }
    if (glossarySearchInput) glossarySearchInput.addEventListener('input', renderGlossarySystem);
    if (glossaryCatSelect) glossaryCatSelect.addEventListener('change', renderGlossarySystem);
    if (btnTtsPlay) btnTtsPlay.addEventListener('click', () => speakText(document.getElementById('ttsTextInput')?.value || ''));
    if (btnTtsPause) btnTtsPause.addEventListener('click', () => { if (window.speechSynthesis) window.speechSynthesis.pause(); });
    if (btnTtsResume) btnTtsResume.addEventListener('click', () => { if (window.speechSynthesis) window.speechSynthesis.resume(); });
    if (btnTtsStop) btnTtsStop.addEventListener('click', () => { if (window.speechSynthesis) window.speechSynthesis.cancel(); });

    // Mobile Bottom Nav + Offline + Advanced Analytics listeners
    document.querySelectorAll('[data-mbn-target]').forEach((b) => {
      b.addEventListener('click', () => navigateToSection(b.getAttribute('data-mbn-target')));
    });
    const btnAcadSaveOffline = document.getElementById('btnAcadSaveOffline');
    const btnAdvExportPdf = document.getElementById('btnAdvExportPdf');
    const btnAdvExportCsv = document.getElementById('btnAdvExportCsv');
    const btnAdvRefresh = document.getElementById('btnAdvRefresh');
    const advRangeFilter = document.getElementById('advRangeFilter');
    const advCatFilter = document.getElementById('advCatFilter');
    const btnAdvAiInsights = document.getElementById('btnAdvAiInsights');
    const btnAdvLoadFaculty = document.getElementById('btnAdvLoadFaculty');
    const btnAdvTlPrev = document.getElementById('btnAdvTlPrev');
    const btnAdvTlNext = document.getElementById('btnAdvTlNext');

    if (btnAcadSaveOffline) btnAcadSaveOffline.addEventListener('click', saveAcademyLessonsOffline);
    if (btnAdvExportPdf) btnAdvExportPdf.addEventListener('click', () => { if (typeof downloadFullReportPdf === 'function') downloadFullReportPdf(); });
    if (btnAdvExportCsv) btnAdvExportCsv.addEventListener('click', exportAnalyticsCsv);
    if (btnAdvRefresh) btnAdvRefresh.addEventListener('click', renderAdvancedAnalytics);
    if (advRangeFilter) advRangeFilter.addEventListener('change', () => { advTlPage = 1; renderAdvancedAnalytics(); });
    if (advCatFilter) advCatFilter.addEventListener('change', () => { advTlPage = 1; renderAdvancedAnalytics(); });
    if (btnAdvAiInsights) btnAdvAiInsights.addEventListener('click', generateAdvAiInsights);
    if (btnAdvLoadFaculty) btnAdvLoadFaculty.addEventListener('click', loadFacultyCohortAnalytics);
    if (btnAdvTlPrev) btnAdvTlPrev.addEventListener('click', () => { if (advTlPage > 1) { advTlPage--; renderAdvancedTimeline(); } });
    if (btnAdvTlNext) btnAdvTlNext.addEventListener('click', () => { advTlPage++; renderAdvancedTimeline(); });

    // V3.0 Upgrades across the 8 Main Features
    const acadSearchInput = document.getElementById('acadSearchInput');
    const btnAcadBookmark = document.getElementById('btnAcadBookmark');
    if (acadSearchInput) acadSearchInput.addEventListener('input', renderAcademy);
    if (btnAcadBookmark) {
      btnAcadBookmark.addEventListener('click', () => {
        if (!Array.isArray(studentState.bookmarkedLessons)) studentState.bookmarkedLessons = [];
        const idx = studentState.bookmarkedLessons.indexOf(activeLessonId);
        if (idx >= 0) studentState.bookmarkedLessons.splice(idx, 1);
        else studentState.bookmarkedLessons.push(activeLessonId);
        saveStudentProgress();
        renderAcademy();
      });
    }

    const btnCertLiveInspect = document.getElementById('btnCertLiveInspect');
    const btnCertDownloadReport = document.getElementById('btnCertDownloadReport');
    const btnCertToSecurity = document.getElementById('btnCertToSecurity');
    if (btnCertLiveInspect) btnCertLiveInspect.addEventListener('click', inspectLiveDomainCertificate);
    if (btnCertDownloadReport) btnCertDownloadReport.addEventListener('click', downloadCertificateInspectionReport);
    if (btnCertToSecurity) {
      btnCertToSecurity.addEventListener('click', () => {
        navigateToSection('tabSecurity');
        runSecurityAuditFindings();
      });
    }

    const btnSecRunAudit = document.getElementById('btnSecRunAudit');
    const btnSecDownloadReport = document.getElementById('btnSecDownloadReport');
    if (btnSecRunAudit) btnSecRunAudit.addEventListener('click', runSecurityAuditFindings);
    if (btnSecDownloadReport) btnSecDownloadReport.addEventListener('click', downloadSecurityFindingsReport);

    const stuChartRangeSelect = document.getElementById('stuChartRangeSelect');
    if (stuChartRangeSelect) stuChartRangeSelect.addEventListener('change', renderStudentDashboardCharts);

    document.querySelectorAll('[data-ai-suggest]').forEach((b) => {
      b.addEventListener('click', () => {
        const inp = document.getElementById('aiPromptInput');
        if (inp) inp.value = b.getAttribute('data-ai-suggest') || '';
        submitAiAnalysisRequest();
      });
    });
  }

  // ============================================================================
  // PROGRESS & ACHIEVEMENT MANAGEMENT SYSTEM (MODULE 1-6)
  // ============================================================================
  const progCharts = { weekly: null, quizTrend: null, course: null, lab: null, time: null };

  function computeStreaks() {
    const map = studentState.dailyActivityMap || {};
    const today = new Date();
    let current = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if ((map[k] || 0) > 0) {
        current++;
      } else if (i > 0) {
        break;
      } else {
        // Today has 0 so far; check if yesterday started a streak
        continue;
      }
    }
    // Longest streak across recorded keys
    const activeDates = Object.keys(map).filter((k) => map[k] > 0).sort();
    let longest = 0;
    let run = 0;
    let prevTime = null;
    activeDates.forEach((ds) => {
      const t = new Date(ds + 'T00:00:00').getTime();
      if (prevTime !== null && Math.round((t - prevTime) / 86400000) === 1) {
        run++;
      } else {
        run = 1;
      }
      if (run > longest) longest = run;
      prevTime = t;
    });
    return { current, longest: Math.max(longest, current) };
  }

  function evaluateAchievementBadges() {
    const allLessons = getAllAcademyLessons();
    const mod1 = ACADEMY_MODULES[0];
    const mod1Done = mod1 ? mod1.lessons.every((l) => studentState.completedLessons.includes(l.id)) : false;
    const allModulesDone = allLessons.length > 0 && allLessons.every((l) => studentState.completedLessons.includes(l.id));
    const has90Quiz = quizHistory.some((h) => h.pct >= 90);
    const expTotal = Math.max(studentState.experimentCount || 0, studentState.completedLabs.length);

    const defs = [
      { id: 'badge_first_step', name: 'First Step', desc: 'Begin your cybersecurity journey.', req: 'Complete 1 Academy lesson', unlocked: studentState.completedLessons.length >= 1 },
      { id: 'badge_crypto_exp', name: 'Crypto Explorer', desc: 'Practice hands-on cryptographic primitives.', req: 'Complete 3 unique Crypto Labs', unlocked: studentState.completedLabs.length >= 3 },
      { id: 'badge_tls_master', name: 'TLS Master', desc: 'Master Module 1: TLS Fundamentals.', req: 'Complete all 7 TLS Fundamentals lessons', unlocked: mod1Done },
      { id: 'badge_quiz_champ', name: 'Quiz Champion', desc: 'Demonstrate high exam accuracy.', req: 'Score ≥ 90% on any submitted quiz', unlocked: has90Quiz },
      { id: 'badge_lab_expert', name: 'Lab Expert', desc: 'Consistent practical experimentation.', req: 'Complete 10 practical experiments', unlocked: expTotal >= 10 },
      { id: 'badge_cyber_pro', name: 'Cybersecurity Pro', desc: 'Master the entire B.Tech curriculum.', req: 'Complete all 35 Academy lessons', unlocked: allModulesDone }
    ];

    let changed = false;
    const today = getTodayKey();
    defs.forEach((b) => {
      if (b.unlocked && !studentState.achievementDates[b.id]) {
        studentState.achievementDates[b.id] = today;
        studentState.activities.unshift({ title: `Badge Unlocked: ${b.name}`, time: getTimestamp(), badge: 'BADGE', badgeType: 'ok' });
        if (studentState.activities.length > 15) studentState.activities.pop();
        changed = true;
      }
    });
    if (changed) saveStudentProgress();
    return defs;
  }

  function renderProgressSystem() {
    const allLessons = getAllAcademyLessons();
    const totalLessons = allLessons.length || 35;
    const completedLessons = studentState.completedLessons.length;
    const pendingLessons = Math.max(0, totalLessons - completedLessons);
    const expTotal = Math.max(studentState.experimentCount || 0, studentState.completedLabs.length);

    const quizAvg = quizHistory.length > 0
      ? Math.round(quizHistory.reduce((s, h) => s + h.pct, 0) / quizHistory.length)
      : 0;

    const tSec = studentState.timeBySection || { academy: 0, lab: 0, quiz: 0, playground: 0 };
    const totalSecs = (tSec.academy || 0) + (tSec.lab || 0) + (tSec.quiz || 0) + (tSec.playground || 0);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;

    const streaks = computeStreaks();
    const overallPct = Math.round(((completedLessons + Math.min(10, expTotal) + (quizAvg >= 60 ? 5 : 0)) / (totalLessons + 15)) * 100);

    const setT = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setT('progOverallPct', `${overallPct}%`);
    setT('progCompletedLessons', `${completedLessons} / ${totalLessons}`);
    setT('progPendingLessons', `${pendingLessons}`);
    setT('progExperimentsDone', `${expTotal}`);
    setT('progQuizAvg', `${quizAvg}%`);
    setT('progQuizAttemptsSub', `${quizHistory.length} submitted`);
    setT('progTotalTime', `${mins}m ${String(secs).padStart(2, '0')}s`);
    setT('progCurrentStreak', `${streaks.current} Day${streaks.current === 1 ? '' : 's'}`);
    setT('progLongestStreakSub', `Longest: ${streaks.longest} Day${streaks.longest === 1 ? '' : 's'}`);

    // Weekly Calendar (Last 7 days)
    const calEl = document.getElementById('progWeeklyCalendar');
    const last7Labels = [];
    const last7Counts = [];
    const todayKey = getTodayKey();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayObj = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayObj);
      d.setDate(todayObj.getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const c = (studentState.dailyActivityMap || {})[k] || 0;
      last7Labels.push(dayNames[d.getDay()]);
      last7Counts.push(c);
    }
    if (calEl) {
      calEl.innerHTML = last7Labels.map((lbl, idx) => `
        <div class="streak-day-cell ${last7Counts[idx] > 0 ? 'active-day' : ''}">
          <span class="sdc-name">${lbl}</span>
          <span class="sdc-count">${last7Counts[idx]}</span>
        </div>
      `).join('');
    }

    const todayCount = (studentState.dailyActivityMap || {})[todayKey] || 0;
    const goal = studentState.dailyGoal || 3;
    const goalPct = Math.min(100, Math.round((todayCount / goal) * 100));
    setT('progTodayCountPill', `Today: ${todayCount} activities`);
    setT('progDailyGoalText', `${todayCount} / ${goal} activities today`);
    const goalFill = document.getElementById('progDailyGoalFill');
    if (goalFill) goalFill.style.width = `${goalPct}%`;

    // Performance Report
    const perfEl = document.getElementById('progPerfReport');
    if (perfEl) {
      const modStats = ACADEMY_MODULES.map((m) => ({
        title: m.title.replace(/^Module \d+:\s*/, ''),
        pct: Math.round((m.lessons.filter((l) => studentState.completedLessons.includes(l.id)).length / m.lessons.length) * 100)
      }));
      const strongMods = modStats.filter((m) => m.pct >= 50).map((m) => `${m.title} (${m.pct}%)`);
      const weakMods = modStats.filter((m) => m.pct < 50).map((m) => `${m.title} (${m.pct}%)`);
      perfEl.innerHTML = `
        <div class="perf-item"><span class="perf-lbl">Strongest Topics</span><span class="perf-val">${strongMods.length ? strongMods.join(', ') : 'Complete ≥50% of any module to identify strengths.'}</span></div>
        <div class="perf-item"><span class="perf-lbl">Needs Improvement</span><span class="perf-val">${weakMods.length ? weakMods.join(', ') : 'All modules are ≥50% complete!'}</span></div>
        <div class="perf-item"><span class="perf-lbl">Quiz Performance</span><span class="perf-val">${quizHistory.length ? `Avg ${quizAvg}% across ${quizHistory.length} attempt(s).` : 'No submitted quizzes yet.'}</span></div>
        <div class="perf-item"><span class="perf-lbl">Practical Experiments</span><span class="perf-val">${expTotal} experiment(s) executed (${studentState.completedLabs.length}/5 unique crypto labs).</span></div>
      `;
    }

    // Achievements Gallery
    const badges = evaluateAchievementBadges();
    const unlockedCount = badges.filter((b) => Boolean(studentState.achievementDates[b.id])).length;
    setT('sidebarBadgeCount', `${unlockedCount}/6`);
    setT('progGalleryCount', `${unlockedCount} / 6 Badges Unlocked`);
    const galEl = document.getElementById('progBadgeGallery');
    if (galEl) {
      galEl.innerHTML = badges.map((b) => {
        const date = studentState.achievementDates[b.id];
        const isUnlocked = Boolean(date);
        return `
          <div class="badge-gallery-card ${isUnlocked ? 'unlocked' : ''}">
            <div class="bgc-top">
              <span class="bgc-name">${isUnlocked ? '★ ' : ''}${b.name}</span>
              <span class="conn-status-pill ${isUnlocked ? 'ok' : 'warn'}">${isUnlocked ? 'UNLOCKED' : 'LOCKED'}</span>
            </div>
            <p class="bgc-desc">${b.desc}</p>
            <span class="bgc-req">Requirement: ${b.req}</span>
            <span class="bgc-date">${isUnlocked ? `Unlocked on: ${date}` : 'Not yet unlocked'}</span>
          </div>
        `;
      }).join('');
    }

    // 5 Charts
    if (typeof Chart !== 'undefined') {
      const mkChart = (key, canvasId, config) => {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        if (progCharts[key]) progCharts[key].destroy();
        progCharts[key] = new Chart(ctx, config);
      };

      mkChart('weekly', 'progWeeklyChart', {
        type: 'bar',
        data: { labels: last7Labels, datasets: [{ label: 'Activities', data: last7Counts, backgroundColor: 'rgba(255, 102, 133, 0.78)', borderColor: '#FF6685', borderWidth: 1, borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: '#D1B8C2' }, grid: { color: 'rgba(120,51,79,0.35)' } }, x: { ticks: { color: '#D1B8C2' }, grid: { display: false } } }, plugins: { legend: { labels: { color: '#FFFFFF' } } } }
      });

      const qRev = quizHistory.slice(0, 8).reverse();
      mkChart('quizTrend', 'progQuizTrendChart', {
        type: 'line',
        data: {
          labels: qRev.length ? qRev.map((_, i) => `#${i + 1}`) : ['No Data'],
          datasets: [{ label: 'Score %', data: qRev.length ? qRev.map((h) => h.pct) : [0], borderColor: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.2)', fill: true, tension: 0.3 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100, ticks: { color: '#D1B8C2' }, grid: { color: 'rgba(120,51,79,0.35)' } }, x: { ticks: { color: '#D1B8C2' }, grid: { display: false } } }, plugins: { legend: { labels: { color: '#FFFFFF' } } } }
      });

      mkChart('course', 'progCourseChart', {
        type: 'doughnut',
        data: { labels: ['Completed', 'Pending'], datasets: [{ data: [completedLessons, pendingLessons], backgroundColor: ['#10B981', 'rgba(120, 51, 79, 0.65)'], borderColor: ['#10B981', '#78334F'], borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: '#D1B8C2' } } } }
      });

      mkChart('lab', 'progLabChart', {
        type: 'bar',
        data: {
          labels: ['Crypto Labs (5)', 'Challenges (5)'],
          datasets: [
            { label: 'Completed', data: [studentState.completedLabs.length, studentState.completedChallenges.length], backgroundColor: '#10B981' },
            { label: 'Remaining', data: [5 - studentState.completedLabs.length, 5 - studentState.completedChallenges.length], backgroundColor: 'rgba(120, 51, 79, 0.6)' }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, ticks: { color: '#D1B8C2' } }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1, color: '#D1B8C2' }, grid: { color: 'rgba(120,51,79,0.35)' } } }, plugins: { legend: { labels: { color: '#FFFFFF' } } } }
      });

      mkChart('time', 'progTimeChart', {
        type: 'doughnut',
        data: {
          labels: ['Academy (s)', 'Crypto Lab (s)', 'Quiz Center (s)', 'Attack Playground (s)'],
          datasets: [{ data: [tSec.academy || 0, tSec.lab || 0, tSec.quiz || 0, tSec.playground || 0], backgroundColor: ['#FF6685', '#38BDF8', '#F59E0B', '#10B981'], borderWidth: 1 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: '#D1B8C2', font: { size: 10 } } } } }
      });
    }
  }

  // ============================================================================
  // SECURITY REPORTS & CERTIFICATE GENERATION SYSTEM (MODULE 1-8)
  // ============================================================================
  const REP_STUDENT_NAME_KEY = 'tls_lab_student_name_v1';
  const REP_ISSUED_CERTS_KEY = 'tls_lab_issued_certs_v1';
  const REP_HISTORY_KEY = 'tls_lab_reports_history_v1';

  const CERTIFICATE_CATALOG = [
    {
      id: 'cert_tls_fund',
      title: 'TLS Fundamentals Completion',
      reqDesc: 'Complete 100% of Module 1 (TLS Fundamentals) lessons + TLS Handshake Simulator.',
      check: (ctx) => ctx.modPct('mod_tls') >= 100 && ctx.hasLab('handshake')
    },
    {
      id: 'cert_crypto_lab',
      title: 'Cryptography Laboratory Completion',
      reqDesc: 'Complete AES-GCM, RSA-2048, ECDHE P-256, and SHA-256 Practical Crypto Labs.',
      check: (ctx) => ['aes', 'rsa', 'ecdh', 'sha256'].every((id) => ctx.hasLab(id))
    },
    {
      id: 'cert_netsec',
      title: 'Network Security Achievement',
      reqDesc: 'Complete 100% of Module 2 (Network Security) lessons + solve >= 1 Network/Attack Challenge.',
      check: (ctx) => ctx.modPct('mod_netsec') >= 100 && ctx.netAttackChallenges >= 1
    },
    {
      id: 'cert_academy',
      title: 'Cybersecurity Learning Academy',
      reqDesc: 'Complete all 35 Learning Academy lessons + achieve >= 60% Quiz Average.',
      check: (ctx) => ctx.completedLessons >= ctx.totalLessons && ctx.quizAvg >= 60
    },
    {
      id: 'cert_master',
      title: 'TLS Security Lab Completion',
      reqDesc: 'Achieve >= 80% overall completion, >= 3 quizzes, >= 4 labs, and >= 5 challenges solved.',
      check: (ctx) => ctx.overallPct >= 80 && ctx.quizAttempts >= 3 && ctx.uniqueLabs >= 4 && ctx.solvedChallenges >= 5
    }
  ];

  function loadIssuedCerts() {
    try {
      const parsed = JSON.parse(localStorage.getItem(REP_ISSUED_CERTS_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch { return {}; }
  }

  function saveIssuedCerts(obj) {
    try { localStorage.setItem(REP_ISSUED_CERTS_KEY, JSON.stringify(obj)); } catch { }
  }

  function loadReportHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(REP_HISTORY_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }

  function saveReportHistory(list) {
    try { localStorage.setItem(REP_HISTORY_KEY, JSON.stringify(list.slice(0, 40))); } catch { }
  }

  function setReportBanner(msg, type = 'info') {
    const el = document.getElementById('repStatusBanner');
    if (!el) return;
    el.textContent = msg;
    el.className = `badge ${type === 'ok' ? 'badge-pass' : type === 'err' ? 'badge-fail' : 'badge-info'}`;
  }

  function getSavedStudentName() {
    try { return (localStorage.getItem(REP_STUDENT_NAME_KEY) || '').trim(); } catch { return ''; }
  }

  function buildReportSnapshot() {
    const allLessons = getAllAcademyLessons();
    const totalLessons = allLessons.length || 35;
    const completedLessons = studentState.completedLessons.length;
    const pendingLessons = Math.max(0, totalLessons - completedLessons);
    const learnPct = Math.round((completedLessons / totalLessons) * 100);

    const tSec = studentState.timeBySection || { academy: 0, lab: 0, quiz: 0, playground: 0 };
    const totalSecs = (tSec.academy || 0) + (tSec.lab || 0) + (tSec.quiz || 0) + (tSec.playground || 0);
    const studyTimeFormatted = `${Math.floor(totalSecs / 60)}m ${String(totalSecs % 60).padStart(2, '0')}s`;

    const modProgress = ACADEMY_MODULES.map((m) => {
      const done = m.lessons.filter((l) => studentState.completedLessons.includes(l.id)).length;
      const pct = Math.round((done / m.lessons.length) * 100);
      return { id: m.id, title: m.title.replace(/^Module \d+:\s*/, ''), done, total: m.lessons.length, pct };
    });

    const quizAttempts = quizHistory.length;
    const quizAvg = quizAttempts > 0 ? Math.round(quizHistory.reduce((s, h) => s + (h.pct || 0), 0) / quizAttempts) : 0;
    const quizHighest = quizAttempts > 0 ? Math.max(...quizHistory.map((h) => h.pct || 0)) : 0;
    const totalQCorrect = quizHistory.reduce((s, h) => s + (h.score || 0), 0);
    const totalQAsked = quizHistory.reduce((s, h) => s + (h.total || 0), 0);
    const quizAccuracy = totalQAsked > 0 ? Math.round((totalQCorrect / totalQAsked) * 100) : 0;

    const topicMap = {};
    quizHistory.forEach((h) => {
      const k = h.cat || 'General';
      if (!topicMap[k]) topicMap[k] = { attempts: 0, sumPct: 0 };
      topicMap[k].attempts += 1;
      topicMap[k].sumPct += (h.pct || 0);
    });

    const labSpecs = [
      { id: 'aes', name: 'AES-128/256-GCM Encryption & Decryption', cat: 'Symmetric Crypto' },
      { id: 'rsa', name: 'RSA-2048 OAEP & Digital Signatures', cat: 'Asymmetric / Signatures' },
      { id: 'ecdh', name: 'ECDHE P-256 Ephemeral Key Exchange', cat: 'Key Agreement' },
      { id: 'sha256', name: 'SHA-256 / SHA-384 / SHA-512 Hashing', cat: 'Integrity & Avalanche' },
      { id: 'handshake', name: 'TLS 1.3 1-RTT Handshake Simulation', cat: 'Protocol Flow' }
    ];
    const labRows = labSpecs.map((sp) => ({
      ...sp,
      done: studentState.completedLabs.includes(sp.id),
      date: (studentState.labCompletionDates || {})[sp.id] || (studentState.completedLabs.includes(sp.id) ? getTodayKey() : '—')
    }));
    const uniqueLabs = labRows.filter((l) => l.done).length;

    const chBank = Array.isArray(window.CHALLENGES_BANK) ? window.CHALLENGES_BANK : [];
    const chalHist = typeof loadChalHistory === 'function' ? loadChalHistory() : [];
    const solvedIds = studentState.completedChallenges || [];
    const solvedChallenges = chBank.filter((c) => solvedIds.includes(c.id)).length;
    const totalChalPoints = typeof getChalTotalPoints === 'function' ? getChalTotalPoints() : 0;
    const successfulAttempts = chalHist.filter((h) => h.status === 'Passed').length;
    const diffBreakdown = ['Beginner', 'Intermediate', 'Advanced'].map((d) => {
      const sub = chBank.filter((c) => c.diff === d);
      const done = sub.filter((c) => solvedIds.includes(c.id)).length;
      return { diff: d, done, total: sub.length };
    });
    const netAttackChallenges = chBank.filter((c) => (c.cat === 'netsec' || c.cat === 'attack') && solvedIds.includes(c.id)).length;

    const expTotal = Math.max(studentState.experimentCount || 0, uniqueLabs);
    const overallPct = Math.round(((completedLessons + Math.min(10, expTotal) + (quizAvg >= 60 ? 5 : 0)) / (totalLessons + 15)) * 100);

    return {
      studentName: getSavedStudentName() || 'Student (Unnamed)',
      totalLessons, completedLessons, pendingLessons, learnPct, studyTimeFormatted, modProgress,
      quizAttempts, quizAvg, quizHighest, quizAccuracy, topicMap,
      labRows, uniqueLabs, expTotal,
      solvedChallenges, totalChallenges: chBank.length || 16, totalChalPoints, successfulAttempts, diffBreakdown, netAttackChallenges,
      overallPct,
      modPct: (modId) => (modProgress.find((m) => m.id === modId)?.pct || 0),
      hasLab: (labId) => studentState.completedLabs.includes(labId)
    };
  }

  function generateQrSvgHtml(payload) {
    if (typeof window.qrcode === 'function') {
      try {
        const qr = window.qrcode(0, 'M');
        qr.addData(payload);
        qr.make();
        return qr.createSvgTag({ cellSize: 2, margin: 2 });
      } catch { }
    }
    // Deterministic fallback SVG matrix if offline without CDN
    let hash = 0;
    for (let i = 0; i < payload.length; i++) hash = ((hash << 5) - hash + payload.charCodeAt(i)) | 0;
    let rects = '';
    for (let r = 0; r < 11; r++) {
      for (let c = 0; c < 11; c++) {
        if (((hash >> ((r + c) % 24)) ^ (r * 3 + c)) & 1) {
          rects += `<rect x="${c * 4}" y="${r * 4}" width="4" height="4" fill="#160810"/>`;
        }
      }
    }
    return `<svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><rect width="44" height="44" fill="#fff"/>${rects}</svg>`;
  }

  function createUniqueCertId(certKey, studentName) {
    const year = new Date().getFullYear();
    const seed = `${certKey}|${studentName}|${Date.now()}|${Math.random()}`;
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const hex = (h >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(0, 6);
    return `TLS-CERT-${year}-${hex}`;
  }

  function issueCertificate(certDef) {
    const name = getSavedStudentName();
    if (!name) {
      setReportBanner('Please enter and save your Student Full Name before issuing a certificate.', 'err');
      playCyberTone('error');
      return;
    }
    const issued = loadIssuedCerts();
    if (issued[certDef.id]) {
      setReportBanner(`Certificate "${certDef.title}" already issued (${issued[certDef.id].certId}). Duplicate prevented.`, 'info');
      return;
    }
    const snap = buildReportSnapshot();
    if (!certDef.check(snap)) {
      setReportBanner(`Requirements not yet met for "${certDef.title}".`, 'err');
      playCyberTone('error');
      return;
    }
    const certId = createUniqueCertId(certDef.id, name);
    const issueDate = getTodayKey();
    const qrPayload = `TLS-LAB|CERT:${certId}|KEY:${certDef.id}|DATE:${issueDate}`;
    const record = {
      id: certDef.id,
      certId,
      title: certDef.title,
      studentName: name,
      issueDate,
      platform: 'TLS Security Lab V3.0',
      qrPayload
    };
    issued[certDef.id] = record;
    saveIssuedCerts(issued);

    const hist = loadReportHistory();
    hist.unshift({ type: 'Certificate', title: certDef.title, certId, date: issueDate });
    saveReportHistory(hist);

    addStudentActivity(`Certificate Issued: ${certDef.title}`, 'CERTIFIED', 'ok');
    setReportBanner(`Issued ${certDef.title} (${certId})!`, 'ok');
    playCyberTone('success');
    renderReportsSystem();
  }

  function downloadCertificatePdf(certRecord) {
    if (!certRecord) return;
    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      doc.setFillColor(22, 8, 16);
      doc.rect(0, 0, 842, 595, 'F');
      doc.setDrawColor(255, 102, 133);
      doc.setLineWidth(4);
      doc.rect(28, 28, 786, 539);
      doc.setTextColor(255, 102, 133);
      doc.setFontSize(14);
      doc.text('TLS SECURITY LAB V3.0 — OFFICIAL VERIFIED CREDENTIAL', 421, 90, { align: 'center' });
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(30);
      doc.text('CERTIFICATE OF COMPLETION', 421, 145, { align: 'center' });
      doc.setFontSize(14);
      doc.setTextColor(209, 184, 194);
      doc.text('This certifies that', 421, 200, { align: 'center' });
      doc.setFontSize(28);
      doc.setTextColor(255, 142, 170);
      doc.text(certRecord.studentName, 421, 248, { align: 'center' });
      doc.setFontSize(14);
      doc.setTextColor(209, 184, 194);
      doc.text('has successfully satisfied all practical and academic requirements for', 421, 295, { align: 'center' });
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text(certRecord.title, 421, 340, { align: 'center' });
      doc.setFontSize(11);
      doc.setTextColor(209, 184, 194);
      doc.text(`Certificate ID: ${certRecord.certId}`, 80, 480);
      doc.text(`Issue Date: ${certRecord.issueDate}`, 80, 502);
      doc.text(`Platform: ${certRecord.platform}`, 80, 524);
      doc.text(`Verification Payload: ${certRecord.qrPayload}`, 80, 546);
      doc.save(`${certRecord.certId}.pdf`);
      setReportBanner(`Downloaded PDF certificate: ${certRecord.certId}.pdf`, 'ok');
    } else {
      openReportPreview();
      setTimeout(() => window.print(), 200);
    }
  }

  function generateAndSaveReportRecord() {
    const snap = buildReportSnapshot();
    const date = getTodayKey();
    const repId = `REP-${date.replace(/-/g, '')}-${String(Math.floor(100 + Math.random() * 900))}`;
    const hist = loadReportHistory();
    hist.unshift({ type: 'Security Report', title: `Full Progress Report (${snap.overallPct}%)`, certId: repId, date });
    saveReportHistory(hist);
    setReportBanner(`Report ${repId} generated and saved to history.`, 'ok');
    playCyberTone('success');
    renderReportsSystem();
    openReportPreview();
  }

  function openReportPreview() {
    const snap = buildReportSnapshot();
    const issued = Object.values(loadIssuedCerts());
    const card = document.getElementById('repPreviewCard');
    const area = document.getElementById('repPrintableArea');
    if (!card || !area) return;
    area.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; border-bottom:1px solid rgba(255,102,133,0.4); padding-bottom:12px; margin-bottom:14px;">
        <div>
          <div style="font-size:0.78rem; color:#ff8eaa; font-weight:700;">TLS SECURITY LAB V3.0 &bull; STUDENT REPORT</div>
          <h2 style="margin:4px 0;">Cybersecurity Performance &amp; Achievement Summary</h2>
          <div><strong>Student:</strong> ${escapeHtml(snap.studentName)} &nbsp;|&nbsp; <strong>Generated:</strong> ${getTodayKey()}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:1.5rem; font-weight:800; color:#ff6685;">${snap.overallPct}%</div>
          <div style="font-size:0.78rem; color:#d1b8c2;">Overall Completion</div>
        </div>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px,1fr)); gap:12px; margin-bottom:14px;">
        <div><strong>Lessons:</strong> ${snap.completedLessons} / ${snap.totalLessons} (${snap.learnPct}%)</div>
        <div><strong>Study Time:</strong> ${snap.studyTimeFormatted}</div>
        <div><strong>Quizzes:</strong> ${snap.quizAttempts} attempts (Avg ${snap.quizAvg}%, Best ${snap.quizHighest}%)</div>
        <div><strong>Practical Labs:</strong> ${snap.uniqueLabs} / 5 completed (${snap.expTotal} runs)</div>
        <div><strong>Challenges:</strong> ${snap.solvedChallenges} / ${snap.totalChallenges} (${snap.totalChalPoints} PTS)</div>
        <div><strong>Certificates Issued:</strong> ${issued.length} / 5</div>
      </div>
      <div style="margin-bottom:10px;"><strong>Course Progress:</strong> ${snap.modProgress.map((m) => `${m.title}: ${m.pct}%`).join(' • ')}</div>
      <div><strong>Issued Credentials:</strong> ${issued.length ? issued.map((c) => `${c.title} (${c.certId})`).join(', ') : 'None issued yet.'}</div>
    `;
    card.style.display = 'block';
  }

  function downloadFullReportPdf() {
    setReportBanner('Generating PDF report...', 'info');
    const snap = buildReportSnapshot();
    const issued = Object.values(loadIssuedCerts());
    if (window.jspdf && window.jspdf.jsPDF) {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        doc.setFillColor(22, 8, 16);
        doc.rect(0, 0, 595, 842, 'F');
        doc.setTextColor(255, 102, 133);
        doc.setFontSize(18);
        doc.text('TLS SECURITY LAB V3.0 — SECURITY REPORT', 40, 55);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.text(`Student: ${snap.studentName}    |    Date: ${getTodayKey()}`, 40, 82);
        doc.text(`Overall Completion: ${snap.overallPct}%    |    Study Time: ${snap.studyTimeFormatted}`, 40, 102);

        let y = 140;
        const section = (title, lines) => {
          doc.setTextColor(255, 142, 170);
          doc.setFontSize(13);
          doc.text(title, 40, y);
          y += 18;
          doc.setTextColor(235, 225, 230);
          doc.setFontSize(10);
          lines.forEach((ln) => {
            doc.text(ln, 48, y);
            y += 16;
          });
          y += 10;
        };

        section('1. Learning Progress Report', [
          `Completed Lessons: ${snap.completedLessons} / ${snap.totalLessons} (${snap.learnPct}%) | Pending: ${snap.pendingLessons}`,
          ...snap.modProgress.map((m) => `- ${m.title}: ${m.done}/${m.total} (${m.pct}%)`)
        ]);
        section('2. Quiz Performance Report', [
          `Total Attempts: ${snap.quizAttempts} | Average: ${snap.quizAvg}% | Highest: ${snap.quizHighest}% | Accuracy: ${snap.quizAccuracy}%`
        ]);
        section('3. Practical Lab Report', snap.labRows.map((l) => `- ${l.name}: ${l.done ? `Completed (${l.date})` : 'Pending'}`));
        section('4. Challenge Report', [
          `Solved Challenges: ${snap.solvedChallenges} / ${snap.totalChallenges} | Total Points: ${snap.totalChalPoints} PTS | Successful Runs: ${snap.successfulAttempts}`
        ]);
        section('5. Issued Certificates', issued.length
          ? issued.map((c) => `- ${c.title} | ID: ${c.certId} | Issued: ${c.issueDate}`)
          : ['No certificates issued yet.']);

        doc.save(`TLS_Security_Lab_Report_${getTodayKey()}.pdf`);
        setReportBanner('PDF Report downloaded successfully!', 'ok');
        playCyberTone('success');
      } catch (e) {
        setReportBanner('PDF library error; opening print dialog instead.', 'err');
        openReportPreview();
        setTimeout(() => window.print(), 200);
      }
    } else {
      setReportBanner('Offline mode: opening Print-to-PDF preview.', 'info');
      openReportPreview();
      setTimeout(() => window.print(), 200);
    }
  }

  function verifyCertificateByInput(rawId) {
    const out = document.getElementById('verifyCertResult');
    if (!out) return;
    const certId = (rawId || '').trim().toUpperCase();
    if (!certId) {
      out.style.color = '#ff6685';
      out.textContent = 'Error: Please enter a Certificate ID (e.g. TLS-CERT-2026-XXXXXX).';
      return;
    }
    const issued = Object.values(loadIssuedCerts());
    const found = issued.find((c) => c.certId.toUpperCase() === certId);
    if (!found) {
      out.style.color = '#ff6685';
      out.innerHTML = `<strong>STATUS: INVALID / NOT FOUND</strong><br>No authentic certificate matches ID <code>${escapeHtml(certId)}</code>.`;
      playCyberTone('error');
      return;
    }
    out.style.color = '#4ade80';
    out.innerHTML = `
      <strong>STATUS: VALID &amp; AUTHENTIC &checkmark;</strong><br>
      <strong>Certificate Title:</strong> ${escapeHtml(found.title)}<br>
      <strong>Certificate ID:</strong> <code>${escapeHtml(found.certId)}</code><br>
      <strong>Issue Date:</strong> ${escapeHtml(found.issueDate)}<br>
      <strong>Issuing Platform:</strong> ${escapeHtml(found.platform)}<br>
      <span style="color:var(--text-secondary); font-size:0.78rem;">Privacy Notice: Personal student details are omitted from public verification.</span>
    `;
    playCyberTone('success');
  }

  function verifyCertificateByQrPayload(rawPayload) {
    const txt = (rawPayload || '').trim();
    const match = txt.match(/CERT:(TLS-CERT-[A-Z0-9-]+)/i);
    if (!match) {
      const out = document.getElementById('verifyCertResult');
      if (out) {
        out.style.color = '#ff6685';
        out.textContent = 'Invalid QR payload format. Expected: TLS-LAB|CERT:TLS-CERT-YYYY-XXXXXX|...';
      }
      playCyberTone('error');
      return;
    }
    const idInput = document.getElementById('verifyCertIdInput');
    if (idInput) idInput.value = match[1];
    verifyCertificateByInput(match[1]);
  }

  function renderReportsSystem() {
    const nameInput = document.getElementById('repStudentName');
    const savedName = getSavedStudentName();
    if (nameInput && !nameInput.value && savedName) nameInput.value = savedName;

    const snap = buildReportSnapshot();
    const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

    // Module 1: Learning Progress
    setTxt('repLearnPctBadge', `${snap.learnPct}%`);
    const learnKpis = document.getElementById('repLearnKpis');
    if (learnKpis) {
      learnKpis.innerHTML = `
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Total Lessons</span><span class="rep-kpi-val">${snap.totalLessons}</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Completed</span><span class="rep-kpi-val">${snap.completedLessons}</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Pending</span><span class="rep-kpi-val">${snap.pendingLessons}</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Study Time</span><span class="rep-kpi-val">${snap.studyTimeFormatted}</span></div>
      `;
    }
    const courseList = document.getElementById('repCourseProgressList');
    if (courseList) {
      courseList.innerHTML = snap.modProgress.map((m) => `
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:3px;">
            <span>${m.title}</span><span>${m.done}/${m.total} (${m.pct}%)</span>
          </div>
          <div style="height:6px; background:rgba(120,51,79,0.4); border-radius:4px; overflow:hidden;">
            <div style="width:${m.pct}%; height:100%; background:var(--accent-primary);"></div>
          </div>
        </div>
      `).join('');
    }

    // Module 2: Quiz Performance
    setTxt('repQuizAvgBadge', `Avg: ${snap.quizAvg}%`);
    const quizKpis = document.getElementById('repQuizKpis');
    if (quizKpis) {
      quizKpis.innerHTML = `
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Attempted</span><span class="rep-kpi-val">${snap.quizAttempts}</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Average</span><span class="rep-kpi-val">${snap.quizAvg}%</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Highest</span><span class="rep-kpi-val">${snap.quizHighest}%</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Accuracy</span><span class="rep-kpi-val">${snap.quizAccuracy}%</span></div>
      `;
    }
    const topicPerf = document.getElementById('repTopicPerfList');
    if (topicPerf) {
      const entries = Object.entries(snap.topicMap);
      topicPerf.innerHTML = entries.length
        ? entries.map(([cat, st]) => `<div style="display:flex; justify-content:space-between; font-size:0.82rem;"><span>${cat}</span><span>${Math.round(st.sumPct / st.attempts)}% (${st.attempts}x)</span></div>`).join('')
        : '<div style="font-size:0.82rem; color:var(--text-secondary);">Complete a quiz to view topic-wise breakdown.</div>';
    }
    const qBody = document.getElementById('repQuizHistoryBody');
    if (qBody) {
      qBody.innerHTML = quizHistory.length
        ? quizHistory.slice(0, 8).map((h) => `<tr><td>${h.cat}</td><td>${h.diff}</td><td>${h.score}/${h.total}</td><td>${h.pct}%</td><td>${h.date}</td></tr>`).join('')
        : '<tr><td colspan="5" style="text-align:center; color:var(--text-secondary);">No quiz attempts recorded.</td></tr>';
    }

    // Module 3: Practical Lab Report
    setTxt('repLabCountBadge', `${snap.uniqueLabs} / 5 Labs`);
    const labBody = document.getElementById('repLabBody');
    if (labBody) {
      labBody.innerHTML = snap.labRows.map((l) => `
        <tr>
          <td>${l.name}</td>
          <td>${l.cat}</td>
          <td><span class="badge ${l.done ? 'badge-pass' : 'badge-info'}">${l.done ? 'Completed' : 'Pending'}</span></td>
          <td>${l.date}</td>
        </tr>
      `).join('');
    }

    // Module 4: Challenge Report
    setTxt('repChalPtsBadge', `${snap.totalChalPoints} PTS`);
    const chalKpis = document.getElementById('repChalKpis');
    if (chalKpis) {
      chalKpis.innerHTML = `
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Solved</span><span class="rep-kpi-val">${snap.solvedChallenges}/${snap.totalChallenges}</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Total Points</span><span class="rep-kpi-val">${snap.totalChalPoints}</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Successful Runs</span><span class="rep-kpi-val">${snap.successfulAttempts}</span></div>
      `;
    }
    const chalDiffList = document.getElementById('repChalDiffList');
    if (chalDiffList) {
      chalDiffList.innerHTML = snap.diffBreakdown.map((d) => `
        <div style="display:flex; justify-content:space-between; font-size:0.84rem;">
          <span>${d.diff} Challenges</span><span>${d.done} / ${d.total} Solved</span>
        </div>
      `).join('');
    }
    setTxt('repChalSummaryText', snap.solvedChallenges > 0
      ? `You have solved ${snap.solvedChallenges} practical cybersecurity challenge(s) earning ${snap.totalChalPoints} total points.`
      : 'No challenges solved yet. Visit Practical Challenges to earn points and unlock certifications.');

    // Module 5: Certificate Generation
    const issued = loadIssuedCerts();
    const issuedCount = Object.keys(issued).length;
    setTxt('repCertIssuedBadge', `${issuedCount} / 5 Issued`);
    setTxt('sidebarCertCount', `${issuedCount}/5`);

    const certsGrid = document.getElementById('repCertsGrid');
    if (certsGrid) {
      certsGrid.innerHTML = CERTIFICATE_CATALOG.map((c) => {
        const rec = issued[c.id];
        const eligible = c.check(snap);
        if (rec) {
          return `
            <div class="rep-cert-card issued">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                <strong style="color:var(--accent-primary);">${c.title}</strong>
                <span class="badge badge-pass">Issued &checkmark;</span>
              </div>
              <div style="font-size:0.82rem; color:var(--text-secondary);">
                <div><strong>Student:</strong> ${escapeHtml(rec.studentName)}</div>
                <div><strong>Cert ID:</strong> <code>${escapeHtml(rec.certId)}</code> &bull; <strong>Issued:</strong> ${escapeHtml(rec.issueDate)}</div>
              </div>
              <div class="rep-cert-qr-wrap">
                <div>${generateQrSvgHtml(rec.qrPayload)}</div>
                <div style="font-size:0.75rem; line-height:1.35;">
                  <strong>Verification QR</strong><br>
                  <span>${rec.platform}</span><br>
                  <button class="btn btn-sm btn-secondary" data-qr-copy="${rec.qrPayload}" style="margin-top:4px; padding:2px 8px; font-size:0.7rem;">Test QR Verify</button>
                </div>
              </div>
              <div style="display:flex; gap:8px; margin-top:auto;">
                <button class="btn btn-sm btn-primary" data-cert-pdf="${c.id}">Download PDF</button>
                <button class="btn btn-sm btn-secondary" data-cert-verify="${rec.certId}">Verify ID</button>
              </div>
            </div>
          `;
        }
        return `
          <div class="rep-cert-card">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <strong>${c.title}</strong>
              <span class="badge ${eligible ? 'badge-pass' : 'badge-info'}">${eligible ? 'Eligible' : 'Locked'}</span>
            </div>
            <p style="font-size:0.82rem; color:var(--text-secondary); margin:0;">${c.reqDesc}</p>
            <button class="btn btn-sm ${eligible ? 'btn-primary' : 'btn-secondary'}" data-cert-issue="${c.id}" ${eligible ? '' : 'disabled'} style="margin-top:auto;">
              ${eligible ? 'Issue Certificate' : 'Requirements Pending'}
            </button>
          </div>
        `;
      }).join('');

      certsGrid.querySelectorAll('[data-cert-issue]').forEach((b) => {
        b.addEventListener('click', () => {
          const def = CERTIFICATE_CATALOG.find((x) => x.id === b.getAttribute('data-cert-issue'));
          if (def) issueCertificate(def);
        });
      });
      certsGrid.querySelectorAll('[data-cert-pdf]').forEach((b) => {
        b.addEventListener('click', () => {
          const rec = loadIssuedCerts()[b.getAttribute('data-cert-pdf')];
          if (rec) downloadCertificatePdf(rec);
        });
      });
      certsGrid.querySelectorAll('[data-cert-verify]').forEach((b) => {
        b.addEventListener('click', () => {
          const cid = b.getAttribute('data-cert-verify');
          const inp = document.getElementById('verifyCertIdInput');
          if (inp) inp.value = cid;
          verifyCertificateByInput(cid);
        });
      });
      certsGrid.querySelectorAll('[data-qr-copy]').forEach((b) => {
        b.addEventListener('click', () => {
          const payload = b.getAttribute('data-qr-copy');
          const qrInp = document.getElementById('verifyQrInput');
          if (qrInp) qrInp.value = payload;
          verifyCertificateByQrPayload(payload);
        });
      });
    }

    // Module 8: Report & Certificate History
    const repBody = document.getElementById('repHistoryBody');
    if (repBody) {
      const hist = loadReportHistory();
      repBody.innerHTML = hist.length
        ? hist.map((h) => `
          <tr>
            <td><span class="badge ${h.type === 'Certificate' ? 'badge-pass' : 'badge-info'}">${escapeHtml(h.type)}</span></td>
            <td>${escapeHtml(h.title)}</td>
            <td><code>${escapeHtml(h.certId)}</code></td>
            <td>${escapeHtml(h.date)}</td>
            <td>${h.type === 'Certificate' ? `<button class="btn btn-sm btn-secondary" data-hist-verify="${escapeHtml(h.certId)}">Verify</button>` : 'Saved'}</td>
          </tr>
        `).join('')
        : '<tr><td colspan="5" style="text-align:center; color:var(--text-secondary);">No reports or certificates generated yet.</td></tr>';

      repBody.querySelectorAll('[data-hist-verify]').forEach((b) => {
        b.addEventListener('click', () => {
          const cid = b.getAttribute('data-hist-verify');
          const inp = document.getElementById('verifyCertIdInput');
          if (inp) inp.value = cid;
          verifyCertificateByInput(cid);
        });
      });
    }
  }

  // ============================================================================
  // STUDENT PROFILE & SETTINGS MANAGEMENT SYSTEM (MODULE 1-7)
  // ============================================================================
  const PROF_STORAGE_KEY = 'tls_lab_student_profile_v1';
  const PROF_SETTINGS_KEY = 'tls_lab_student_settings_v1';
  const PROF_AUTH_KEY = 'tls_lab_account_auth_v1';

  function loadStudentProfile() {
    try {
      const raw = localStorage.getItem(PROF_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Object.assign({
          name: getSavedStudentName() || '',
          studentId: 'TLS-STU-1024',
          course: 'B.Tech CSE',
          department: 'Computer Science & Engineering',
          learningLevel: 'Beginner',
          avatar: 'initials',
          createdAt: getTodayKey()
        }, parsed);
      }
    } catch { }
    const fresh = {
      name: getSavedStudentName() || '',
      studentId: `TLS-STU-${String(Math.floor(1000 + Math.random() * 9000))}`,
      course: 'B.Tech CSE',
      department: 'Computer Science & Engineering',
      learningLevel: 'Beginner',
      avatar: 'initials',
      createdAt: getTodayKey()
    };
    try { localStorage.setItem(PROF_STORAGE_KEY, JSON.stringify(fresh)); } catch { }
    return fresh;
  }

  function saveStudentProfile(prof) {
    try {
      localStorage.setItem(PROF_STORAGE_KEY, JSON.stringify(prof));
      if (prof.name) localStorage.setItem(REP_STUDENT_NAME_KEY, prof.name);
    } catch { }
  }

  function loadStudentSettings() {
    const defaults = {
      language: 'en',
      bilingual: false,
      ttsEnabled: true,
      preferredTopics: ['TLS Fundamentals', 'Cryptography'],
      quizDiff: 'Medium',
      studyReminder: 'daily',
      notifications: { learning: true, quiz: true, achievement: true, challenge: true, weekly: false },
      appearance: { theme: 'burgundy', fontSize: '16', density: 'comfortable' },
      privacy: { profileVis: 'private', activityVis: 'visible', analyticsOptIn: true }
    };
    try {
      const raw = localStorage.getItem(PROF_SETTINGS_KEY);
      if (!raw) return defaults;
      const p = JSON.parse(raw);
      return {
        language: p.language || defaults.language,
        bilingual: Boolean(p.bilingual),
        ttsEnabled: p.ttsEnabled !== false,
        preferredTopics: Array.isArray(p.preferredTopics) ? p.preferredTopics : defaults.preferredTopics,
        quizDiff: p.quizDiff || defaults.quizDiff,
        studyReminder: p.studyReminder || defaults.studyReminder,
        notifications: Object.assign({}, defaults.notifications, p.notifications || {}),
        appearance: Object.assign({}, defaults.appearance, p.appearance || {}),
        privacy: Object.assign({}, defaults.privacy, p.privacy || {})
      };
    } catch { return defaults; }
  }

  function saveStudentSettings(s) {
    try { localStorage.setItem(PROF_SETTINGS_KEY, JSON.stringify(s)); } catch { }
  }

  function loadAccountAuth() {
    try {
      const p = JSON.parse(localStorage.getItem(PROF_AUTH_KEY) || '{}');
      return Object.assign({ email: '', passwordHash: '', sessionActive: true }, p);
    } catch { return { email: '', passwordHash: '', sessionActive: true }; }
  }

  function saveAccountAuth(a) {
    try { localStorage.setItem(PROF_AUTH_KEY, JSON.stringify(a)); } catch { }
  }

  function constantTimeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  async function hashPasswordPbkdf2(pwd, existingSaltHex = null) {
    const saltBytes = existingSaltHex
      ? new Uint8Array(existingSaltHex.match(/.{1,2}/g).map((h) => parseInt(h, 16)))
      : window.crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(saltBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    const keyMat = await window.crypto.subtle.importKey('raw', new TextEncoder().encode(pwd), 'PBKDF2', false, ['deriveBits']);
    const bits = await window.crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' }, keyMat, 256);
    const hashHex = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
    return `pbkdf2$${saltHex}$${hashHex}`;
  }

  async function verifyStoredPassword(pwd, storedHash) {
    if (!storedHash) return true;
    if (storedHash.startsWith('pbkdf2$')) {
      const parts = storedHash.split('$');
      if (parts.length !== 3) return false;
      const derived = await hashPasswordPbkdf2(pwd, parts[1]);
      return constantTimeEqual(derived, storedHash);
    }
    const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(`tls_lab_salt_v3:${pwd}`));
    const legacyHex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    return constantTimeEqual(legacyHex, storedHash);
  }

  function setProfileBanner(msg, type = 'info') {
    const el = document.getElementById('profStatusBanner');
    if (!el) return;
    el.textContent = msg;
    el.className = `badge ${type === 'ok' ? 'badge-pass' : type === 'err' ? 'badge-fail' : 'badge-info'}`;
  }

  function applyAppearanceSettings() {
    const s = loadStudentSettings();
    const ap = s.appearance || { theme: 'burgundy', fontSize: '16', density: 'comfortable' };
    document.body.classList.toggle('theme-light', ap.theme === 'light');
    document.body.classList.toggle('layout-compact', ap.density === 'compact');
    document.documentElement.style.fontSize = `${parseInt(ap.fontSize, 10) || 16}px`;
  }

  function renderProfileSystem() {
    const prof = loadStudentProfile();
    const sets = loadStudentSettings();
    const auth = loadAccountAuth();
    const snap = buildReportSnapshot();
    const streaks = computeStreaks();
    const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };

    // Module 1: Profile Display & Form
    const displayName = prof.name || 'Student User';
    setTxt('profDisplayName', displayName);
    setTxt('profDisplayId', prof.studentId);
    setTxt('profDisplayCreated', prof.createdAt);
    setTxt('profDisplayCourse', prof.course);
    setTxt('profDisplayDept', prof.department);
    setTxt('profDisplayLevel', prof.learningLevel);
    setTxt('profProgressBadge', `${snap.overallPct}% Complete`);

    const avatarEl = document.getElementById('profAvatarPreview');
    if (avatarEl) {
      if (prof.avatar === 'initials') {
        const parts = displayName.trim().split(/\s+/);
        avatarEl.textContent = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : displayName.slice(0, 2).toUpperCase();
      } else {
        avatarEl.textContent = prof.avatar || '🛡️';
      }
    }
    setVal('profNameInput', prof.name || '');
    setVal('profAvatarSelect', prof.avatar || 'initials');
    setVal('profCourseInput', prof.course || 'B.Tech CSE');
    setVal('profDeptInput', prof.department || 'Computer Science & Engineering');

    // Module 2: Learning Preferences
    setVal('prefLearningMode', prof.learningLevel || 'Beginner');
    setVal('prefDailyGoal', studentState.dailyGoal || 3);
    setVal('prefQuizDiff', sets.quizDiff || 'Medium');
    setVal('prefStudyReminder', sets.studyReminder || 'daily');
    document.querySelectorAll('#prefTopicsGroup input[type="checkbox"]').forEach((cb) => {
      cb.checked = sets.preferredTopics.includes(cb.value);
    });

    // Module 4: Notifications
    const setChk = (id, v) => { const el = document.getElementById(id); if (el) el.checked = Boolean(v); };
    setChk('notifLearning', sets.notifications.learning);
    setChk('notifQuiz', sets.notifications.quiz);
    setChk('notifAchievement', sets.notifications.achievement);
    setChk('notifChallenge', sets.notifications.challenge);
    setChk('notifWeekly', sets.notifications.weekly);

    // Module 5: Appearance
    setVal('appThemeSelect', sets.appearance.theme || 'burgundy');
    setVal('appFontSelect', sets.appearance.fontSize || '16');
    setVal('appDensitySelect', sets.appearance.density || 'comfortable');

    // Module 6: Privacy
    setVal('privProfileVis', sets.privacy.profileVis || 'private');
    setVal('privActivityVis', sets.privacy.activityVis || 'visible');
    setChk('privAnalyticsOptIn', sets.privacy.analyticsOptIn !== false);

    // Module 3: Account Security (never expose password hash)
    setVal('accEmailInput', auth.email || '');
    setTxt('accAuthStatusBadge', auth.sessionActive ? 'Session Active' : 'Logged Out');

    // Module 7: Personalization
    setTxt('profStreakBadge', `${streaks.current} Day Streak`);
    const pkpis = document.getElementById('profPersonalKpis');
    if (pkpis) {
      const todayCount = (studentState.dailyActivityMap || {})[getTodayKey()] || 0;
      pkpis.innerHTML = `
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Daily Goal</span><span class="rep-kpi-val">${todayCount}/${studentState.dailyGoal || 3}</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Preferred Topics</span><span class="rep-kpi-val">${sets.preferredTopics.length}</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Lessons Done</span><span class="rep-kpi-val">${snap.completedLessons}/${snap.totalLessons}</span></div>
      `;
    }
    const recentBadges = document.getElementById('profRecentBadges');
    if (recentBadges) {
      const unlocked = Object.entries(studentState.achievementDates || {});
      recentBadges.innerHTML = unlocked.length
        ? unlocked.slice(0, 4).map(([id, dt]) => `<span class="badge badge-pass">★ ${id.replace('ach_', '').toUpperCase()} (${dt})</span>`).join('')
        : '<span style="font-size:0.82rem; color:var(--text-secondary);">Complete lessons or labs to unlock badges.</span>';
    }
    const recEl = document.getElementById('profRecommendedLessons');
    if (recEl && Array.isArray(ACADEMY_MODULES)) {
      const recs = [];
      ACADEMY_MODULES.forEach((m) => {
        const modTitle = m.title.replace(/^Module \d+:\s*/, '');
        const isPref = sets.preferredTopics.some((t) => modTitle.toLowerCase().includes(t.toLowerCase().split(' ')[0]));
        m.lessons.forEach((l) => {
          if (!studentState.completedLessons.includes(l.id)) {
            recs.push({ id: l.id, title: l.title, mod: modTitle, prio: isPref ? 1 : 0 });
          }
        });
      });
      recs.sort((a, b) => b.prio - a.prio);
      recEl.innerHTML = recs.length
        ? recs.slice(0, 3).map((r) => `
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:8px 10px; border-radius:8px; background:rgba(25,10,18,0.6); border:1px solid rgba(120,51,79,0.45);">
            <div>
              <div style="font-size:0.85rem; font-weight:600;">${r.title}</div>
              <div style="font-size:0.74rem; color:var(--text-secondary);">${r.mod}</div>
            </div>
            <button class="btn btn-sm btn-secondary" data-prof-lesson="${r.id}">Open</button>
          </div>
        `).join('')
        : '<span style="font-size:0.84rem; color:#4ade80;">All Academy lessons completed!</span>';

      recEl.querySelectorAll('[data-prof-lesson]').forEach((b) => {
        b.addEventListener('click', () => {
          navigateToSection('tabAcademy');
          if (typeof selectAcademyLesson === 'function') selectAcademyLesson(b.getAttribute('data-prof-lesson'));
        });
      });
    }
  }

  // ============================================================================
  // AI-POWERED CYBERSECURITY INTELLIGENCE CLIENT
  // ============================================================================
  const AI_HISTORY_KEY = 'tls_lab_ai_history_v1';

  function loadAiHistory() {
    try {
      const p = JSON.parse(localStorage.getItem(AI_HISTORY_KEY) || '[]');
      return Array.isArray(p) ? p : [];
    } catch { return []; }
  }

  function saveAiHistory(list) {
    try { localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(list.slice(0, 20))); } catch { }
  }

  function updateAiModePromptHint() {
    const mode = document.getElementById('aiModeSelect')?.value || 'advisor';
    const inp = document.getElementById('aiPromptInput');
    if (!inp) return;
    const placeholders = {
      advisor: 'Ask any TLS, certificate, cryptography, or network security question...',
      tls_scan: 'Optional question about your current TLS session (live session evidence is attached automatically).',
      phishing_url: 'Paste a suspicious URL to inspect (e.g. http://secure-login.example.tk/verify)...',
      certificate: 'Optional question about X.509 certificate tests (live certificate test counts are attached).',
      code_review: 'Paste JavaScript/Node cryptographic code to audit for insecure patterns...',
      smart_recommendations: 'Optional focus request (your live Academy, Quiz & Lab progress is attached automatically).',
      report_explainer: 'Optional question about your generated Security Report (live snapshot is attached).'
    };
    inp.placeholder = placeholders[mode] || placeholders.advisor;
  }

  function loadAiModeSampleOrEvidence() {
    const mode = document.getElementById('aiModeSelect')?.value || 'advisor';
    const inp = document.getElementById('aiPromptInput');
    if (!inp) return;
    const samples = {
      advisor: 'Explain why TLS 1.3 requires Forward Secrecy and how ECDHE P-256 works.',
      tls_scan: 'Analyze my current TLS session score, handshake state, and cipher configuration.',
      phishing_url: 'http://login-verify-bank.example.tk/@account/update',
      certificate: 'Interpret my X.509 certificate test results and explain how to fix untrusted CA or SAN mismatch errors.',
      code_review: "const cipher = crypto.createCipheriv('aes-128-ecb', 'hardcodedkey1234', '');\nconst token = Math.random().toString(36);",
      smart_recommendations: 'Identify my weakest cybersecurity topics and recommend my next 3 study steps.',
      report_explainer: 'Summarize the key risks and achievements in my current Security Report.'
    };
    inp.value = samples[mode] || samples.advisor;
  }

  function buildAiSessionEvidence() {
    const snap = buildReportSnapshot();
    return {
      securityScore: typeof calculateSecurityScore === 'function' ? calculateSecurityScore().score : undefined,
      handshakeCompleted: Boolean(analyticsState.handshakeCompleted),
      connections: (analyticsState.connections || []).slice(0, 5),
      certCounts: analyticsState.certCounts || {},
      completedLessons: snap.completedLessons,
      totalLessons: snap.totalLessons,
      quizAvg: snap.quizAvg,
      quizAttempts: snap.quizAttempts,
      uniqueLabs: snap.uniqueLabs,
      overallPct: snap.overallPct,
      solvedChallenges: snap.solvedChallenges
    };
  }

  function renderAiHistory() {
    const box = document.getElementById('aiHistoryList');
    if (!box) return;
    const hist = loadAiHistory();
    if (!hist.length) {
      box.innerHTML = '<div style="font-size:0.85rem; color:var(--text-secondary);">No AI analyses recorded yet.</div>';
      return;
    }
    box.innerHTML = hist.map((item) => `
      <div style="padding:10px 12px; border-radius:8px; background:rgba(25,10,18,0.65); border:1px solid rgba(120,51,79,0.5);">
        <div style="display:flex; justify-content:space-between; font-size:0.74rem; color:var(--accent-secondary); margin-bottom:4px;">
          <span>${escapeHtml(item.mode)} &bull; ${escapeHtml(item.level)}</span>
          <span>${escapeHtml(item.source)} &bull; ${escapeHtml(item.time)}</span>
        </div>
        <div style="font-size:0.82rem; font-weight:600; margin-bottom:4px;">${escapeHtml(item.prompt || '(Session Evidence Analysis)')}</div>
        <div style="font-size:0.78rem; color:var(--text-secondary); white-space:pre-wrap;">${escapeHtml((item.reply || '').slice(0, 240))}${item.reply && item.reply.length > 240 ? '...' : ''}</div>
      </div>
    `).join('');
  }

  async function renderAiAdvisorSystem() {
    updateAiModePromptHint();
    renderAiHistory();
    const pill = document.getElementById('aiBackendStatusPill');
    if (!pill) return;
    try {
      const r = await fetch('/api/health');
      if (!r.ok) throw new Error('HTTP_' + r.status);
      const data = await r.json();
      pill.textContent = data.aiConfigured
        ? `Backend Online • AI Provider: ${data.provider}`
        : 'Backend Online • Rule Engine (Set API key in .env for LLM)';
      pill.className = `badge ${data.aiConfigured ? 'badge-pass' : 'badge-info'}`;
    } catch {
      pill.textContent = 'Backend Offline (Start node server.js)';
      pill.className = 'badge badge-fail';
    }
  }

  async function submitAiAnalysisRequest() {
    const mode = document.getElementById('aiModeSelect')?.value || 'advisor';
    const level = document.getElementById('aiLevelSelect')?.value || 'beginner';
    const prompt = (document.getElementById('aiPromptInput')?.value || '').trim();
    const findingsBox = document.getElementById('aiVerifiedFindingsBox');
    const expBox = document.getElementById('aiExplanationBox');
    const srcBadge = document.getElementById('aiSourceBadge');
    const discEl = document.getElementById('aiDisclaimerText');
    const btn = document.getElementById('btnAiSubmit');

    if (btn) { btn.disabled = true; btn.textContent = 'Analyzing...'; }
    if (srcBadge) { srcBadge.textContent = 'Processing...'; srcBadge.className = 'badge badge-info'; }

    try {
      const history = loadAiHistory().slice(0, 4).map((h) => ({ role: 'user', text: h.prompt }));
      const resp = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          level,
          language: loadStudentSettings().language || 'en',
          bilingual: Boolean(loadStudentSettings().bilingual),
          prompt,
          evidence: buildAiSessionEvidence(),
          history
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || `HTTP ${resp.status}`);
      }

      if (findingsBox) {
        const list = Array.isArray(data.verifiedFindings) ? data.verifiedFindings : [];
        findingsBox.innerHTML = list.length
          ? list.map((f) => `<li>${escapeHtml(f)}</li>`).join('')
          : '<li>No specific findings triggered.</li>';
      }
      if (expBox) expBox.textContent = data.aiExplanation || '';
      if (discEl) discEl.textContent = data.disclaimer || '';
      if (srcBadge) {
        srcBadge.textContent = data.source === 'ai_api' ? `Live AI (${data.model})` : 'Offline Rule Engine';
        srcBadge.className = `badge ${data.source === 'ai_api' ? 'badge-pass' : 'badge-info'}`;
      }

      const hist = loadAiHistory();
      hist.unshift({
        mode,
        level,
        source: data.source,
        prompt: prompt || `[${mode}]`,
        reply: data.aiExplanation || '',
        time: getTimestamp()
      });
      saveAiHistory(hist);
      renderAiHistory();
      playCyberTone('success');
    } catch (err) {
      if (expBox) expBox.textContent = `Error: ${err.message}`;
      if (srcBadge) { srcBadge.textContent = 'Error'; srcBadge.className = 'badge badge-fail'; }
      playCyberTone('error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Analyze with AI Backend'; }
    }
  }

  // ============================================================================
  // ADMIN & FACULTY PORTAL CLIENT (BACKEND-ENFORCED RBAC)
  // ============================================================================
  let portalAuthUser = null;
  let admCachedStudents = [];

  async function syncStudentProgressToBackend(activityLabel = '') {
    try {
      const prof = typeof loadStudentProfile === 'function' ? loadStudentProfile() : {};
      const quizAvg = quizHistory.length > 0 ? Math.round(quizHistory.reduce((s, h) => s + (h.pct || 0), 0) / quizHistory.length) : 0;
      await fetch('/api/student/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: prof.studentId || 'usr_stu_1',
          name: prof.name || 'Student Demo',
          course: prof.course || 'B.Tech CSE',
          completedLessons: studentState.completedLessons.length,
          completedLabs: studentState.completedLabs.length,
          quizAvg,
          quizAttempts: quizHistory.length,
          activity: activityLabel
        })
      });
    } catch { /* ignore when offline */ }
  }

  async function loadPublicFacultyContent() {
    try {
      const r = await fetch('/api/content/public');
      if (!r.ok) return;
      const data = await r.json();
      if (Array.isArray(data.lessons) && Array.isArray(ACADEMY_MODULES) && ACADEMY_MODULES[0]) {
        const existingIds = new Set(ACADEMY_MODULES.flatMap((m) => m.lessons.map((l) => l.id)));
        data.lessons.forEach((l) => {
          if (!existingIds.has(l.id)) {
            const targetMod = ACADEMY_MODULES.find((m) => m.id === l.moduleId) || ACADEMY_MODULES[0];
            targetMod.lessons.push({
              id: l.id,
              title: `${l.title} (Faculty)`,
              time: l.duration || '10 min',
              difficulty: l.difficulty || 'Intermediate',
              objectives: ['Faculty-published module lesson'],
              explanation: l.summary,
              concepts: ['Faculty Content'],
              diagram: ['Faculty Material', 'Student Study', 'Completion'],
              takeaways: [l.summary],
              check: { q: `Did you review "${l.title}"?`, opts: ['Yes, completed', 'Not yet'], ans: 0, exp: 'Faculty lesson reviewed.' }
            });
          }
        });
        renderAcademy();
      }
      if (Array.isArray(data.quizzes) && Array.isArray(window.QUIZ_BANK)) {
        const existingQ = new Set(window.QUIZ_BANK.map((q) => q.id));
        data.quizzes.forEach((q) => {
          if (!existingQ.has(q.id)) window.QUIZ_BANK.push(q);
        });
      }
    } catch { /* ignore */ }
  }

  async function loginAdminPortal() {
    const email = (document.getElementById('admLoginEmail')?.value || '').trim();
    const password = document.getElementById('admLoginPass')?.value || '';
    const msgEl = document.getElementById('admAuthMsg');
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await r.json();
      if (!r.ok) {
        if (msgEl) { msgEl.style.color = '#ff6685'; msgEl.textContent = data.error || 'Login failed.'; }
        playCyberTone('error');
        return;
      }
      portalAuthUser = data.user;
      if (msgEl) { msgEl.style.color = '#4ade80'; msgEl.textContent = `Signed in as ${data.user.name} (${data.user.role}).`; }
      playCyberTone('success');
      renderAdminPortalSystem();
    } catch (e) {
      if (msgEl) { msgEl.style.color = '#ff6685'; msgEl.textContent = 'Backend unreachable.'; }
    }
  }

  async function logoutAdminPortal() {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { }
    portalAuthUser = null;
    renderAdminPortalSystem();
  }

  function renderAdminStudentsTable() {
    const tbody = document.getElementById('admStudentsBody');
    if (!tbody) return;
    const q = (document.getElementById('admStudentSearch')?.value || '').trim().toLowerCase();
    const list = admCachedStudents.filter((s) => !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-secondary);">No matching students found.</td></tr>';
      return;
    }
    const isAdmin = portalAuthUser && portalAuthUser.role === 'admin';
    tbody.innerHTML = list.map((s) => `
      <tr>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.email)}</td>
        <td>${escapeHtml(s.course || 'B.Tech CSE')}</td>
        <td>${s.completedLessons || 0}</td>
        <td>${s.completedLabs || 0}</td>
        <td>${s.quizAvg || 0}%</td>
        <td><span class="badge ${s.active ? 'badge-pass' : 'badge-fail'}">${s.active ? 'Active' : 'Disabled'}</span></td>
        <td>${isAdmin ? `<button class="btn btn-sm btn-secondary" data-stu-toggle="${escapeHtml(s.id)}" data-stu-active="${s.active}">${s.active ? 'Deactivate' : 'Activate'}</button>` : '<span style="font-size:0.76rem; color:var(--text-secondary);">Admin Only</span>'}</td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-stu-toggle]').forEach((b) => {
      b.addEventListener('click', async () => {
        const id = b.getAttribute('data-stu-toggle');
        const currentlyActive = b.getAttribute('data-stu-active') === 'true';
        await fetch(`/api/admin/students/${encodeURIComponent(id)}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: !currentlyActive })
        });
        renderAdminPortalSystem();
      });
    });
  }

  async function renderAdminPortalSystem() {
    const badge = document.getElementById('admRoleBadge');
    const sideBadge = document.getElementById('sidebarRoleBadge');
    const logoutBtn = document.getElementById('btnAdmLogout');
    const workspace = document.getElementById('admWorkspace');
    const msgEl = document.getElementById('admAuthMsg');

    try {
      const me = await (await fetch('/api/auth/me')).json();
      portalAuthUser = me.authenticated ? me.user : null;
    } catch { portalAuthUser = null; }

    if (!portalAuthUser) {
      if (badge) { badge.textContent = 'Not Signed In'; badge.className = 'badge badge-info'; }
      if (sideBadge) sideBadge.textContent = 'RBAC';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (workspace) workspace.style.display = 'none';
      return;
    }

    if (badge) { badge.textContent = `${portalAuthUser.role.toUpperCase()} • ${portalAuthUser.email}`; badge.className = 'badge badge-pass'; }
    if (sideBadge) sideBadge.textContent = portalAuthUser.role.toUpperCase();
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';

    if (!['admin', 'faculty'].includes(portalAuthUser.role)) {
      if (workspace) workspace.style.display = 'none';
      if (msgEl) { msgEl.style.color = '#ff6685'; msgEl.textContent = `Access Denied (403): Role "${portalAuthUser.role}" cannot access Admin & Faculty management tools.`; }
      return;
    }

    if (workspace) workspace.style.display = 'block';
    const [ovResp, stResp, lesResp, qzResp, lbResp] = await Promise.all([
      fetch('/api/admin/overview'),
      fetch('/api/admin/students'),
      fetch('/api/admin/lessons'),
      fetch('/api/admin/quizzes'),
      fetch('/api/admin/labs')
    ]);

    if (ovResp.ok) {
      const ov = await ovResp.json();
      const kpis = document.getElementById('admOverviewKpis');
      if (kpis) {
        kpis.innerHTML = `
          <div class="rep-kpi-box"><span class="rep-kpi-lbl">Students</span><span class="rep-kpi-val">${ov.activeStudents}/${ov.totalStudents}</span></div>
          <div class="rep-kpi-box"><span class="rep-kpi-lbl">Total Lessons</span><span class="rep-kpi-val">${ov.totalLessons}</span></div>
          <div class="rep-kpi-box"><span class="rep-kpi-lbl">Lessons Done</span><span class="rep-kpi-val">${ov.completedLessonsSum}</span></div>
          <div class="rep-kpi-box"><span class="rep-kpi-lbl">Quiz Avg</span><span class="rep-kpi-val">${ov.quizAvgAll}%</span></div>
          <div class="rep-kpi-box"><span class="rep-kpi-lbl">Lab Runs</span><span class="rep-kpi-val">${ov.completedLabsSum}</span></div>
        `;
      }
      const audBody = document.getElementById('admAuditBody');
      if (audBody) {
        audBody.innerHTML = (ov.auditLogs || []).length
          ? ov.auditLogs.map((a) => `<tr><td>${escapeHtml(a.actor)}</td><td>${escapeHtml(a.role)}</td><td><code>${escapeHtml(a.action)}</code></td><td>${escapeHtml(a.target)}</td><td>${escapeHtml(a.timestamp.slice(11, 19))}</td></tr>`).join('')
          : '<tr><td colspan="5" style="text-align:center; color:var(--text-secondary);">No audit events yet.</td></tr>';
      }
    }

    if (stResp.ok) {
      const sd = await stResp.json();
      admCachedStudents = sd.students || [];
      renderAdminStudentsTable();
    }

    if (lesResp.ok) {
      const ld = await lesResp.json();
      const box = document.getElementById('admLessonsList');
      if (box) {
        box.innerHTML = (ld.lessons || []).map((l) => `
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:8px 10px; border-radius:8px; background:rgba(25,10,18,0.65); border:1px solid rgba(120,51,79,0.5);">
            <div><strong style="font-size:0.84rem;">${escapeHtml(l.title)}</strong> <span class="badge ${l.published ? 'badge-pass' : 'badge-info'}">${l.published ? 'Published' : 'Draft'}</span></div>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-sm btn-secondary" data-les-pub="${escapeHtml(l.id)}" data-pub="${l.published}">${l.published ? 'Unpublish' : 'Publish'}</button>
              <button class="btn btn-sm btn-outline" data-les-del="${escapeHtml(l.id)}">Delete</button>
            </div>
          </div>
        `).join('') || '<div style="font-size:0.82rem; color:var(--text-secondary);">No custom faculty lessons yet.</div>';
        box.querySelectorAll('[data-les-pub]').forEach((b) => {
          b.addEventListener('click', async () => {
            await fetch(`/api/admin/lessons/${encodeURIComponent(b.getAttribute('data-les-pub'))}`, {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ published: b.getAttribute('data-pub') !== 'true' })
            });
            renderAdminPortalSystem();
            loadPublicFacultyContent();
          });
        });
        box.querySelectorAll('[data-les-del]').forEach((b) => {
          b.addEventListener('click', async () => {
            await fetch(`/api/admin/lessons/${encodeURIComponent(b.getAttribute('data-les-del'))}`, { method: 'DELETE' });
            renderAdminPortalSystem();
          });
        });
      }
    }

    if (qzResp.ok) {
      const qd = await qzResp.json();
      const box = document.getElementById('admQuizzesList');
      if (box) {
        box.innerHTML = (qd.quizzes || []).map((q) => `
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:8px 10px; border-radius:8px; background:rgba(25,10,18,0.65); border:1px solid rgba(120,51,79,0.5);">
            <div style="font-size:0.82rem;"><strong>${escapeHtml(q.diff)}</strong>: ${escapeHtml(q.q)}</div>
            <button class="btn btn-sm btn-outline" data-qz-del="${escapeHtml(q.id)}">Delete</button>
          </div>
        `).join('') || '<div style="font-size:0.82rem; color:var(--text-secondary);">No custom questions yet.</div>';
        box.querySelectorAll('[data-qz-del]').forEach((b) => {
          b.addEventListener('click', async () => {
            await fetch(`/api/admin/quizzes/${encodeURIComponent(b.getAttribute('data-qz-del'))}`, { method: 'DELETE' });
            renderAdminPortalSystem();
          });
        });
      }
    }

    if (lbResp.ok) {
      const lbd = await lbResp.json();
      const box = document.getElementById('admLabsList');
      if (box) {
        box.innerHTML = (lbd.labs || []).map((l) => `
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:8px 10px; border-radius:8px; background:rgba(25,10,18,0.65); border:1px solid rgba(120,51,79,0.5);">
            <div style="font-size:0.82rem;"><strong>${escapeHtml(l.title)}</strong> &bull; ${escapeHtml(l.requirement)}</div>
            <button class="btn btn-sm btn-outline" data-lab-del="${escapeHtml(l.id)}">Delete</button>
          </div>
        `).join('') || '<div style="font-size:0.82rem; color:var(--text-secondary);">No custom labs yet.</div>';
        box.querySelectorAll('[data-lab-del]').forEach((b) => {
          b.addEventListener('click', async () => {
            await fetch(`/api/admin/labs/${encodeURIComponent(b.getAttribute('data-lab-del'))}`, { method: 'DELETE' });
            renderAdminPortalSystem();
          });
        });
      }
    }
  }

  async function createFacultyLesson() {
    const title = (document.getElementById('admLesTitle')?.value || '').trim();
    const difficulty = document.getElementById('admLesDiff')?.value || 'Beginner';
    const summary = (document.getElementById('admLesSummary')?.value || '').trim();
    if (!title || !summary) return;
    await fetch('/api/admin/lessons', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, difficulty, summary, published: true })
    });
    document.getElementById('admLesTitle').value = '';
    document.getElementById('admLesSummary').value = '';
    renderAdminPortalSystem();
    loadPublicFacultyContent();
  }

  async function createFacultyQuiz() {
    const q = (document.getElementById('admQuizQ')?.value || '').trim();
    const opts = [0, 1, 2, 3].map((i) => (document.getElementById(`admQuizOpt${i}`)?.value || '').trim());
    const ans = Number(document.getElementById('admQuizAns')?.value || 0);
    const diff = document.getElementById('admQuizDiff')?.value || 'Medium';
    if (!q || opts.some((o) => !o)) return;
    await fetch('/api/admin/quizzes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, opts, ans, diff })
    });
    document.getElementById('admQuizQ').value = '';
    [0, 1, 2, 3].forEach((i) => { document.getElementById(`admQuizOpt${i}`).value = ''; });
    renderAdminPortalSystem();
    loadPublicFacultyContent();
  }

  async function createFacultyLab() {
    const title = (document.getElementById('admLabTitle')?.value || '').trim();
    const requirement = (document.getElementById('admLabReq')?.value || '').trim();
    const instructions = (document.getElementById('admLabInst')?.value || '').trim();
    if (!title || !instructions) return;
    await fetch('/api/admin/labs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, requirement, instructions })
    });
    document.getElementById('admLabTitle').value = '';
    document.getElementById('admLabReq').value = '';
    document.getElementById('admLabInst').value = '';
    renderAdminPortalSystem();
  }

  // ============================================================================
  // CYBERSECURITY CLASSROOM & COLLABORATION SYSTEM (MODULE 1-9)
  // ============================================================================
  let cachedClassrooms = [];
  let activeClassroomId = '';

  function setClassroomBanner(msg, type = 'info') {
    const el = document.getElementById('clsStatusBanner');
    if (!el) return;
    el.textContent = msg;
    el.className = `badge ${type === 'ok' ? 'badge-pass' : type === 'err' ? 'badge-fail' : 'badge-info'}`;
  }

  async function renderClassroomSystem() {
    const userBadge = document.getElementById('clsUserStatusBadge');
    const createCard = document.getElementById('clsCreateCard');
    const workspace = document.getElementById('clsWorkspace');
    try {
      const me = await (await fetch('/api/auth/me')).json();
      portalAuthUser = me.authenticated ? me.user : null;
    } catch { portalAuthUser = null; }

    if (!portalAuthUser) {
      if (userBadge) { userBadge.textContent = 'Not Signed In (Sign in via Admin/Portal)'; userBadge.className = 'badge badge-info'; }
      if (createCard) createCard.style.display = 'none';
      if (workspace) workspace.style.display = 'none';
      setClassroomBanner('Sign in as Student, Faculty, or Admin in Admin & Faculty Portal to access classrooms.', 'info');
      return;
    }

    if (userBadge) { userBadge.textContent = `${portalAuthUser.name} (${portalAuthUser.role.toUpperCase()})`; userBadge.className = 'badge badge-pass'; }
    const isStaff = ['admin', 'faculty'].includes(portalAuthUser.role);
    if (createCard) createCard.style.display = isStaff ? 'block' : 'none';

    const resp = await fetch('/api/classrooms');
    if (!resp.ok) return;
    const data = await resp.json();
    cachedClassrooms = data.classrooms || [];

    const sel = document.getElementById('clsSelector');
    if (sel) {
      sel.innerHTML = cachedClassrooms.length
        ? cachedClassrooms.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)} (${escapeHtml(c.joinCode)})${c.archived ? ' [Archived]' : ''}</option>`).join('')
        : '<option value="">No classrooms joined yet</option>';
      if (!cachedClassrooms.some((c) => c.id === activeClassroomId)) {
        activeClassroomId = cachedClassrooms[0]?.id || '';
      }
      if (activeClassroomId) sel.value = activeClassroomId;
    }
    renderSelectedClassroom();
  }

  async function renderSelectedClassroom() {
    const workspace = document.getElementById('clsWorkspace');
    const cls = cachedClassrooms.find((c) => c.id === activeClassroomId);
    if (!cls || !workspace) {
      if (workspace) workspace.style.display = 'none';
      return;
    }
    workspace.style.display = 'block';
    const isStaff = portalAuthUser && ['admin', 'faculty'].includes(portalAuthUser.role);

    const setT = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setT('clsActiveTitle', `${cls.name}${cls.archived ? ' [Archived]' : ''}`);
    setT('clsActiveMeta', `${cls.subject} • Join Code: ${cls.joinCode} • Faculty: ${cls.facultyEmail}`);
    setT('clsMembersList', (cls.members || []).map((m) => `${m.name} (${m.role})`).join(', '));

    const archBtn = document.getElementById('btnClsArchiveToggle');
    const leaveBtn = document.getElementById('btnClsLeave');
    if (archBtn) {
      archBtn.style.display = isStaff ? 'inline-flex' : 'none';
      archBtn.textContent = cls.archived ? 'Unarchive' : 'Archive';
    }
    if (leaveBtn) leaveBtn.style.display = portalAuthUser?.role === 'student' ? 'inline-flex' : 'none';

    ['clsAsgFacultyForm', 'clsAnnFacultyForm', 'clsProjFacultyForm'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = isStaff ? 'block' : 'none';
    });
    const attCtrl = document.getElementById('clsAttFacultyControls');
    if (attCtrl) attCtrl.style.display = isStaff ? 'flex' : 'none';

    // Module 8: Analytics
    try {
      const an = await (await fetch(`/api/classrooms/${encodeURIComponent(cls.id)}/analytics`)).json();
      const row = document.getElementById('clsAnalyticsRow');
      if (row) {
        row.innerHTML = `
          <div class="rep-kpi-box"><span class="rep-kpi-lbl">Students</span><span class="rep-kpi-val">${an.enrolledStudents || 0}</span></div>
          <div class="rep-kpi-box"><span class="rep-kpi-lbl">Assignments</span><span class="rep-kpi-val">${an.totalAssignments || 0}</span></div>
          <div class="rep-kpi-box"><span class="rep-kpi-lbl">Submissions</span><span class="rep-kpi-val">${an.totalSubmissions || 0}</span></div>
          <div class="rep-kpi-box"><span class="rep-kpi-lbl">Discussions</span><span class="rep-kpi-val">${an.discussionTopics || 0}</span></div>
          <div class="rep-kpi-box"><span class="rep-kpi-lbl">Attendance</span><span class="rep-kpi-val">${an.myAttendancePct || 0}%</span></div>
          <div class="rep-kpi-box"><span class="rep-kpi-lbl">Quiz Avg</span><span class="rep-kpi-val">${an.quizAvg || 0}%</span></div>
        `;
      }
    } catch { }

    // Module 3: Assignments
    const asgBox = document.getElementById('clsAssignmentsList');
    if (asgBox) {
      asgBox.innerHTML = (cls.assignments || []).length
        ? cls.assignments.map((a) => `
          <div style="padding:10px; border-radius:8px; background:rgba(25,10,18,0.65); border:1px solid rgba(120,51,79,0.5);">
            <div style="display:flex; justify-content:space-between; gap:8px;">
              <strong>${escapeHtml(a.title)}</strong>
              <span class="badge badge-info">${escapeHtml(a.difficulty)} &bull; Due ${escapeHtml(a.deadline)}</span>
            </div>
            <p style="font-size:0.82rem; color:var(--text-secondary); margin:4px 0 8px 0;">${escapeHtml(a.instructions)}</p>
            <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:6px;">
              <input type="text" class="text-input" data-sub-ans="${escapeHtml(a.id)}" placeholder="Enter submission answer..." style="flex:1; min-width:160px;" />
              <input type="file" data-sub-file="${escapeHtml(a.id)}" accept=".pdf,.txt,.md,.pcap,.json" style="font-size:0.75rem; max-width:170px;" />
              <button class="btn btn-sm btn-primary" data-sub-btn="${escapeHtml(a.id)}">Submit</button>
            </div>
            ${(a.submissions || []).map((s) => `
              <div style="font-size:0.78rem; padding:6px 8px; margin-top:4px; border-radius:6px; background:rgba(41,18,31,0.8);">
                <strong>${escapeHtml(s.studentName)}</strong>: ${escapeHtml(s.answer)} ${s.fileName ? `[File: ${escapeHtml(s.fileName)}]` : ''} &bull; <span class="badge badge-pass">${escapeHtml(s.status)}</span>
                ${s.feedback ? `<div style="color:#4ade80;">Feedback: ${escapeHtml(s.feedback)}</div>` : ''}
                ${isStaff ? `<div style="display:flex; gap:6px; margin-top:4px;"><input type="text" class="text-input" data-fb-inp="${escapeHtml(a.id)}|${escapeHtml(s.id)}" placeholder="Faculty feedback..." /><button class="btn btn-sm btn-secondary" data-fb-btn="${escapeHtml(a.id)}|${escapeHtml(s.id)}">Review</button></div>` : ''}
              </div>
            `).join('')}
          </div>
        `).join('')
        : '<div style="font-size:0.84rem; color:var(--text-secondary);">No assignments posted yet.</div>';

      asgBox.querySelectorAll('[data-sub-btn]').forEach((b) => {
        b.addEventListener('click', async () => {
          const aid = b.getAttribute('data-sub-btn');
          const ans = asgBox.querySelector(`[data-sub-ans="${aid}"]`)?.value || '';
          const fileInput = asgBox.querySelector(`[data-sub-file="${aid}"]`);
          const f = fileInput?.files?.[0];
          const r = await fetch(`/api/classrooms/${encodeURIComponent(cls.id)}/assignments/${encodeURIComponent(aid)}/submit`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer: ans, fileName: f ? f.name : '', fileSize: f ? f.size : 0 })
          });
          const d = await r.json();
          if (!r.ok) { setClassroomBanner(d.error || 'Submission failed.', 'err'); return; }
          setClassroomBanner('Assignment submitted!', 'ok');
          renderClassroomSystem();
        });
      });

      asgBox.querySelectorAll('[data-fb-btn]').forEach((b) => {
        b.addEventListener('click', async () => {
          const [aid, sid] = b.getAttribute('data-fb-btn').split('|');
          const fb = asgBox.querySelector(`[data-fb-inp="${aid}|${sid}"]`)?.value || '';
          await fetch(`/api/classrooms/${encodeURIComponent(cls.id)}/assignments/${encodeURIComponent(aid)}/submissions/${encodeURIComponent(sid)}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Reviewed', feedback: fb })
          });
          renderClassroomSystem();
        });
      });
    }

    // Module 4: Announcements
    const annBox = document.getElementById('clsAnnouncementsList');
    if (annBox) {
      annBox.innerHTML = (cls.announcements || []).length
        ? cls.announcements.map((a) => `
          <div style="padding:8px 10px; border-radius:8px; background:rgba(25,10,18,0.65); border:1px solid rgba(255,102,133,0.35);">
            <div style="font-weight:600; font-size:0.86rem;">${escapeHtml(a.title)}</div>
            <div style="font-size:0.82rem; color:var(--text-secondary);">${escapeHtml(a.message)}</div>
            <div style="font-size:0.72rem; color:var(--accent-secondary); margin-top:2px;">By ${escapeHtml(a.author)} &bull; ${escapeHtml(a.createdAt.slice(0, 10))}</div>
          </div>
        `).join('')
        : '<div style="font-size:0.84rem; color:var(--text-secondary);">No announcements yet.</div>';
    }

    // Module 5: Discussions
    const discBox = document.getElementById('clsDiscussionsList');
    if (discBox) {
      discBox.innerHTML = (cls.discussions || []).length
        ? cls.discussions.map((d) => `
          <div style="padding:10px; border-radius:8px; background:rgba(25,10,18,0.65); border:1px solid rgba(120,51,79,0.5);">
            <div style="display:flex; justify-content:space-between; gap:8px;">
              <strong>${escapeHtml(d.title)}</strong>
              ${isStaff ? `<button class="btn btn-sm btn-outline" data-disc-del="${escapeHtml(d.id)}">Remove</button>` : ''}
            </div>
            <div style="font-size:0.82rem; color:var(--text-secondary); margin:4px 0;">${escapeHtml(d.body)} <span style="font-size:0.74rem;">(${escapeHtml(d.authorName)})</span></div>
            <div style="display:flex; gap:6px; margin-top:6px;">
              <input type="text" class="text-input" data-rep-inp="${escapeHtml(d.id)}" placeholder="Reply..." />
              <button class="btn btn-sm btn-secondary" data-rep-btn="${escapeHtml(d.id)}">Reply</button>
            </div>
            ${(d.replies || []).map((r) => `<div style="font-size:0.78rem; margin-top:4px; padding-left:10px; border-left:2px solid var(--accent-primary);"><strong>${escapeHtml(r.authorName)}:</strong> ${escapeHtml(r.text)}</div>`).join('')}
          </div>
        `).join('')
        : '<div style="font-size:0.84rem; color:var(--text-secondary);">No discussion topics yet.</div>';

      discBox.querySelectorAll('[data-rep-btn]').forEach((b) => {
        b.addEventListener('click', async () => {
          const did = b.getAttribute('data-rep-btn');
          const txt = discBox.querySelector(`[data-rep-inp="${did}"]`)?.value || '';
          if (!txt.trim()) return;
          await fetch(`/api/classrooms/${encodeURIComponent(cls.id)}/discussions/${encodeURIComponent(did)}/reply`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: txt })
          });
          renderClassroomSystem();
        });
      });
      discBox.querySelectorAll('[data-disc-del]').forEach((b) => {
        b.addEventListener('click', async () => {
          await fetch(`/api/classrooms/${encodeURIComponent(cls.id)}/discussions/${encodeURIComponent(b.getAttribute('data-disc-del'))}`, { method: 'DELETE' });
          renderClassroomSystem();
        });
      });
    }

    // Module 6: Group Projects
    const projBox = document.getElementById('clsProjectsList');
    if (projBox) {
      projBox.innerHTML = (cls.projects || []).length
        ? cls.projects.map((p) => `
          <div style="padding:10px; border-radius:8px; background:rgba(25,10,18,0.65); border:1px solid rgba(120,51,79,0.5);">
            <strong>${escapeHtml(p.title)}</strong> <span class="badge badge-info">${escapeHtml(p.teamName)}</span>
            <div style="font-size:0.82rem; color:var(--text-secondary); margin:4px 0;">${escapeHtml(p.objectives)}</div>
            <div style="display:flex; gap:6px; margin-top:6px;">
              <input type="text" class="text-input" data-prj-inp="${escapeHtml(p.id)}" placeholder="Post progress update / deliverable..." />
              <button class="btn btn-sm btn-secondary" data-prj-btn="${escapeHtml(p.id)}">Update</button>
            </div>
            ${(p.updates || []).map((u) => `<div style="font-size:0.78rem; margin-top:4px;"><strong>${escapeHtml(u.author)}:</strong> ${escapeHtml(u.note)}</div>`).join('')}
          </div>
        `).join('')
        : '<div style="font-size:0.84rem; color:var(--text-secondary);">No group projects assigned yet.</div>';

      projBox.querySelectorAll('[data-prj-btn]').forEach((b) => {
        b.addEventListener('click', async () => {
          const pid = b.getAttribute('data-prj-btn');
          const note = projBox.querySelector(`[data-prj-inp="${pid}"]`)?.value || '';
          if (!note.trim()) return;
          await fetch(`/api/classrooms/${encodeURIComponent(cls.id)}/projects/${encodeURIComponent(pid)}/update`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ note })
          });
          renderClassroomSystem();
        });
      });
    }

    // Module 7: Attendance
    const attBox = document.getElementById('clsAttendanceList');
    if (attBox) {
      attBox.innerHTML = (cls.attendanceSessions || []).length
        ? cls.attendanceSessions.map((s) => {
          const marked = portalAuthUser && (s.presentIds || []).includes(portalAuthUser.id);
          return `
            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:8px; padding:10px; border-radius:8px; background:rgba(25,10,18,0.65); border:1px solid rgba(120,51,79,0.5);">
              <div>
                <strong>${escapeHtml(s.topic)}</strong> &bull; Present: ${(s.presentIds || []).length}
                ${isStaff ? `<span class="badge badge-info" style="margin-left:6px;">Code: ${escapeHtml(s.code)}</span>` : ''}
              </div>
              ${marked
              ? '<span class="badge badge-pass">Present &checkmark;</span>'
              : `<div style="display:flex; gap:6px;"><input type="text" class="text-input" data-att-inp="${escapeHtml(s.id)}" placeholder="Enter Code (ATT-XXXX)" style="max-width:160px;" /><button class="btn btn-sm btn-primary" data-att-btn="${escapeHtml(s.id)}">Check In</button></div>`}
            </div>
          `;
        }).join('')
        : '<div style="font-size:0.84rem; color:var(--text-secondary);">No attendance sessions opened yet.</div>';

      attBox.querySelectorAll('[data-att-btn]').forEach((b) => {
        b.addEventListener('click', async () => {
          const sid = b.getAttribute('data-att-btn');
          const code = attBox.querySelector(`[data-att-inp="${sid}"]`)?.value || '';
          const r = await fetch(`/api/classrooms/${encodeURIComponent(cls.id)}/attendance/${encodeURIComponent(sid)}/checkin`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });
          const d = await r.json();
          if (!r.ok) { setClassroomBanner(d.error || 'Check-in failed.', 'err'); return; }
          setClassroomBanner('Attendance verified and recorded!', 'ok');
          renderClassroomSystem();
        });
      });
    }
  }

  async function joinClassroomByCode() {
    const code = (document.getElementById('clsJoinCodeInput')?.value || '').trim();
    if (!code) return;
    const r = await fetch('/api/classrooms/join', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ joinCode: code })
    });
    const d = await r.json();
    if (!r.ok) { setClassroomBanner(d.error || 'Could not join classroom.', 'err'); return; }
    activeClassroomId = d.classroom.id;
    document.getElementById('clsJoinCodeInput').value = '';
    setClassroomBanner(`Joined classroom: ${d.classroom.name}`, 'ok');
    renderClassroomSystem();
  }

  async function createNewClassroom() {
    const name = (document.getElementById('clsCreateName')?.value || '').trim();
    const subject = (document.getElementById('clsCreateSubject')?.value || '').trim();
    const description = (document.getElementById('clsCreateDesc')?.value || '').trim();
    const r = await fetch('/api/classrooms', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, subject, description })
    });
    const d = await r.json();
    if (!r.ok) { setClassroomBanner(d.error || 'Create failed.', 'err'); return; }
    activeClassroomId = d.classroom.id;
    ['clsCreateName', 'clsCreateSubject', 'clsCreateDesc'].forEach((id) => { const el = document.getElementById(id); if (el) el.value = ''; });
    setClassroomBanner(`Created "${d.classroom.name}" with Join Code ${d.classroom.joinCode}`, 'ok');
    renderClassroomSystem();
  }

  async function toggleArchiveClassroom() {
    const cls = cachedClassrooms.find((c) => c.id === activeClassroomId);
    if (!cls) return;
    await fetch(`/api/classrooms/${encodeURIComponent(cls.id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: !cls.archived })
    });
    renderClassroomSystem();
  }

  async function leaveCurrentClassroom() {
    if (!activeClassroomId) return;
    await fetch(`/api/classrooms/${encodeURIComponent(activeClassroomId)}/leave`, { method: 'POST' });
    activeClassroomId = '';
    renderClassroomSystem();
  }

  async function createClassroomAssignment() {
    if (!activeClassroomId) return;
    const title = (document.getElementById('clsAsgTitle')?.value || '').trim();
    const difficulty = document.getElementById('clsAsgDiff')?.value || 'Intermediate';
    const instructions = (document.getElementById('clsAsgInst')?.value || '').trim();
    const r = await fetch(`/api/classrooms/${encodeURIComponent(activeClassroomId)}/assignments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, difficulty, instructions })
    });
    if (r.ok) {
      document.getElementById('clsAsgTitle').value = '';
      document.getElementById('clsAsgInst').value = '';
      renderClassroomSystem();
    }
  }

  async function createClassroomAnnouncement() {
    if (!activeClassroomId) return;
    const title = (document.getElementById('clsAnnTitle')?.value || '').trim();
    const message = (document.getElementById('clsAnnMsg')?.value || '').trim();
    const r = await fetch(`/api/classrooms/${encodeURIComponent(activeClassroomId)}/announcements`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message })
    });
    if (r.ok) {
      document.getElementById('clsAnnTitle').value = '';
      document.getElementById('clsAnnMsg').value = '';
      renderClassroomSystem();
    }
  }

  async function createClassroomDiscussion() {
    if (!activeClassroomId) return;
    const title = (document.getElementById('clsDiscTitle')?.value || '').trim();
    const body = (document.getElementById('clsDiscBody')?.value || '').trim();
    const r = await fetch(`/api/classrooms/${encodeURIComponent(activeClassroomId)}/discussions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body })
    });
    if (r.ok) {
      document.getElementById('clsDiscTitle').value = '';
      document.getElementById('clsDiscBody').value = '';
      renderClassroomSystem();
    }
  }

  async function createClassroomProject() {
    if (!activeClassroomId) return;
    const title = (document.getElementById('clsProjTitle')?.value || '').trim();
    const teamName = (document.getElementById('clsProjTeam')?.value || '').trim();
    const objectives = (document.getElementById('clsProjObj')?.value || '').trim();
    const r = await fetch(`/api/classrooms/${encodeURIComponent(activeClassroomId)}/projects`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, teamName, objectives })
    });
    if (r.ok) {
      document.getElementById('clsProjTitle').value = '';
      document.getElementById('clsProjTeam').value = '';
      document.getElementById('clsProjObj').value = '';
      renderClassroomSystem();
    }
  }

  async function openClassroomAttendance() {
    if (!activeClassroomId) return;
    const topic = (document.getElementById('clsAttTopic')?.value || '').trim();
    const r = await fetch(`/api/classrooms/${encodeURIComponent(activeClassroomId)}/attendance/sessions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });
    if (r.ok) {
      document.getElementById('clsAttTopic').value = '';
      renderClassroomSystem();
    }
  }

  // ============================================================================
  // REAL-TIME TLS MONITORING SYSTEM CLIENT (SSE + LIVE BACKEND PROBES)
  // ============================================================================
  let tlsMonSnapshot = { connections: [], events: [], alerts: [], metrics: { total: 0, successRate: 0, failRate: 0, avgMs: 0, minMs: 0, maxMs: 0, tls13: 0, tls12: 0, unsupported: 0 } };
  let tlsMonSse = null;
  let tlsMonVersionChart = null;

  function initTlsMonitorSse() {
    if (tlsMonSse || typeof EventSource === 'undefined') return;
    const badge = document.getElementById('monSseStatusBadge');
    const sidePill = document.getElementById('sidebarSsePill');
    try {
      tlsMonSse = new EventSource('/api/tls-monitor/stream');
      tlsMonSse.addEventListener('connected', () => {
        if (badge) { badge.textContent = 'SSE: Connected (Live)'; badge.className = 'badge badge-pass'; }
        if (sidePill) sidePill.textContent = 'LIVE';
      });
      tlsMonSse.addEventListener('tls_event', (e) => {
        try {
          const ev = JSON.parse(e.data);
          tlsMonSnapshot.events.unshift(ev);
          if (tlsMonSnapshot.events.length > 60) tlsMonSnapshot.events.pop();
          renderTlsMonitorViews();
        } catch { }
      });
      tlsMonSse.addEventListener('tls_alert', (e) => {
        try {
          const al = JSON.parse(e.data);
          tlsMonSnapshot.alerts.unshift(al);
          if (tlsMonSnapshot.alerts.length > 30) tlsMonSnapshot.alerts.pop();
          renderTlsMonitorViews();
        } catch { }
      });
      tlsMonSse.addEventListener('tls_connection', () => {
        renderTlsMonitorSystem();
      });
      tlsMonSse.addEventListener('tls_reset', () => {
        renderTlsMonitorSystem();
      });
      tlsMonSse.onerror = () => {
        if (badge) { badge.textContent = 'SSE: Reconnecting...'; badge.className = 'badge badge-info'; }
      };
    } catch { }
  }

  async function renderTlsMonitorSystem() {
    initTlsMonitorSse();
    try {
      const r = await fetch('/api/tls-monitor/state');
      if (!r.ok) return;
      tlsMonSnapshot = await r.json();
      // Sync live backend TLS probes with Main Dashboard analyticsState
      if (Array.isArray(tlsMonSnapshot.connections) && tlsMonSnapshot.connections.length) {
        tlsMonSnapshot.connections.slice(0, 4).forEach((c) => {
          if (!analyticsState.connections.some((ac) => ac.id === c.id)) {
            analyticsState.connections.unshift({
              id: c.id,
              host: `${c.host} [LIVE]`,
              version: c.protocol,
              cipher: c.cipher,
              status: c.status,
              durationMs: c.handshakeMs
            });
          }
        });
        if (analyticsState.connections.length > 10) analyticsState.connections.length = 10;
      }
      renderTlsMonitorViews();
    } catch { }
  }

  function renderTlsMonitorViews() {
    const m = tlsMonSnapshot.metrics || {};
    const search = (document.getElementById('monSearchInput')?.value || '').trim().toLowerCase();
    const stFilter = document.getElementById('monStatusFilter')?.value || 'all';

    // Module 7: Performance Analytics KPIs
    const kpis = document.getElementById('monMetricsRow');
    if (kpis) {
      kpis.innerHTML = `
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Total Probes</span><span class="rep-kpi-val">${m.total || 0}</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Success Rate</span><span class="rep-kpi-val">${m.successRate || 0}%</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Failure Rate</span><span class="rep-kpi-val">${m.failRate || 0}%</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Avg Handshake</span><span class="rep-kpi-val">${m.avgMs || 0} ms</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Min / Max</span><span class="rep-kpi-val">${m.minMs || 0} / ${m.maxMs || 0} ms</span></div>
      `;
    }

    // Filter connections
    const filteredConns = (tlsMonSnapshot.connections || []).filter((c) => {
      const qOk = !search || (c.host || '').toLowerCase().includes(search) || (c.cipher || '').toLowerCase().includes(search);
      const sOk = stFilter === 'all' || (c.status || '').includes(stFilter);
      return qOk && sOk;
    });

    // Module 1: Live Connection Monitor
    const cBody = document.getElementById('monConnectionsBody');
    if (cBody) {
      cBody.innerHTML = filteredConns.length
        ? filteredConns.map((c) => `
          <tr>
            <td><strong>${escapeHtml(c.host)}</strong></td>
            <td><code>${escapeHtml(c.protocol)}</code></td>
            <td style="font-size:0.78rem;">${escapeHtml(c.cipher)}</td>
            <td><span class="badge ${c.status === 'Connected' ? 'badge-pass' : c.status.startsWith('Warning') ? 'badge-warn' : 'badge-fail'}">${escapeHtml(c.status)}</span></td>
            <td>${c.handshakeMs || 0} ms</td>
            <td style="font-size:0.76rem;">${escapeHtml((c.establishedAt || '').slice(11, 19))}</td>
          </tr>
        `).join('')
        : '<tr><td colspan="6" style="text-align:center; color:var(--text-secondary);">No live TLS probes recorded yet. Run a probe above!</td></tr>';
    }

    // Module 3: TLS Version Distribution Chart
    const canvas = document.getElementById('monVersionChart');
    if (canvas && typeof Chart !== 'undefined') {
      const counts = [m.tls13 || 0, m.tls12 || 0, m.unsupported || 0];
      if (tlsMonVersionChart) {
        tlsMonVersionChart.data.datasets[0].data = counts;
        tlsMonVersionChart.update();
      } else {
        tlsMonVersionChart = new Chart(canvas.getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: ['TLS 1.3', 'TLS 1.2', 'Unsupported / Legacy'],
            datasets: [{ data: counts, backgroundColor: ['#10B981', '#FF6685', '#EF4444'], borderWidth: 1 }]
          },
          options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { color: '#D1B8C2' } } } }
        });
      }
    }

    // Module 4: Certificate Monitor
    const certBox = document.getElementById('monCertList');
    if (certBox) {
      certBox.innerHTML = filteredConns.length
        ? filteredConns.slice(0, 8).map((c) => {
          const ct = c.cert || {};
          return `
            <div style="padding:8px 10px; border-radius:8px; background:rgba(25,10,18,0.65); border:1px solid rgba(120,51,79,0.5); font-size:0.8rem;">
              <div style="display:flex; justify-content:space-between; gap:6px;">
                <strong>${escapeHtml(ct.subject || c.host)}</strong>
                <span class="badge ${ct.authorized && !ct.isExpired ? 'badge-pass' : 'badge-fail'}">${ct.authorized && !ct.isExpired ? 'Trusted' : escapeHtml(ct.authError || 'Untrusted/Expired')}</span>
              </div>
              <div style="color:var(--text-secondary);">Issuer: ${escapeHtml(ct.issuer || 'N/A')} &bull; Expires: ${escapeHtml(ct.validTo || 'N/A')} ${ct.bits ? `&bull; ${ct.bits} bits` : ''}</div>
            </div>
          `;
        }).join('')
        : '<div style="font-size:0.84rem; color:var(--text-secondary);">Run a TLS probe to inspect X.509 certificates.</div>';
    }

    // Module 5: Cipher Suite Monitor
    const cipherBox = document.getElementById('monCipherList');
    if (cipherBox) {
      cipherBox.innerHTML = filteredConns.length
        ? filteredConns.slice(0, 8).map((c) => `
          <div style="padding:8px 10px; border-radius:8px; background:rgba(25,10,18,0.65); border:1px solid rgba(120,51,79,0.5); font-size:0.8rem;">
            <div style="display:flex; justify-content:space-between; gap:6px;">
              <code>${escapeHtml(c.cipher)}</code>
              <span class="badge ${c.isWeakCipher ? 'badge-fail' : 'badge-pass'}">${c.isWeakCipher ? 'Weak' : 'Strong AEAD'}</span>
            </div>
            <div style="color:var(--text-secondary);">Host: ${escapeHtml(c.host)} &bull; Protocol: ${escapeHtml(c.protocol)}</div>
          </div>
        `).join('')
        : '<div style="font-size:0.84rem; color:var(--text-secondary);">No cipher suites observed yet.</div>';
    }

    // Module 6: Real-Time Security Alerts
    const alBox = document.getElementById('monAlertsList');
    if (alBox) {
      const als = tlsMonSnapshot.alerts || [];
      alBox.innerHTML = als.length
        ? als.map((a) => `
          <div style="padding:10px; border-radius:8px; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.45); font-size:0.82rem;">
            <div style="display:flex; justify-content:space-between; gap:6px; margin-bottom:4px;">
              <strong style="color:#ff6685;">[${escapeHtml(a.severity)}] ${escapeHtml(a.title)}</strong>
              <span style="font-size:0.74rem; color:var(--text-secondary);">${escapeHtml((a.ts || '').slice(11, 19))}</span>
            </div>
            <div style="color:var(--text-primary);">${escapeHtml(a.explanation)}</div>
            <div style="color:#4ade80; font-size:0.78rem; margin-top:4px;">Action: ${escapeHtml(a.remediation)}</div>
          </div>
        `).join('')
        : '<div style="font-size:0.84rem; color:var(--text-secondary);">No security alerts triggered.</div>';
    }

    // Module 2 & 8: Live Handshake & Event Timeline
    const tlBox = document.getElementById('monTimelineList');
    if (tlBox) {
      const evs = tlsMonSnapshot.events || [];
      tlBox.innerHTML = evs.length
        ? evs.slice(0, 25).map((ev) => `
          <div style="padding:8px 10px; border-left:3px solid ${ev.status === 'ok' ? '#10B981' : ev.status === 'err' ? '#EF4444' : '#FF6685'}; background:rgba(25,10,18,0.6); border-radius:0 8px 8px 0; font-size:0.8rem;">
            <div style="display:flex; justify-content:space-between;">
              <strong>${escapeHtml(ev.stage)} &bull; ${escapeHtml(ev.host)}</strong>
              <span style="font-size:0.72rem; color:var(--text-secondary);">${escapeHtml((ev.ts || '').slice(11, 19))}</span>
            </div>
            <div style="color:var(--text-secondary);">${escapeHtml(ev.detail)}</div>
          </div>
        `).join('')
        : '<div style="font-size:0.84rem; color:var(--text-secondary);">No handshake events captured yet.</div>';
    }
  }

  async function triggerLiveTlsProbe() {
    const host = (document.getElementById('monProbeHost')?.value || '').trim();
    const version = document.getElementById('monProbeVersion')?.value || 'auto';
    const msg = document.getElementById('monProbeMsg');
    const btn = document.getElementById('btnMonProbe');
    if (!host) {
      if (msg) { msg.textContent = 'Enter a hostname'; msg.className = 'badge badge-fail'; }
      return;
    }
    if (btn) { btn.disabled = true; btn.textContent = 'Probing...'; }
    if (msg) { msg.textContent = `Probing ${host}:443...`; msg.className = 'badge badge-info'; }
    try {
      const r = await fetch('/api/tls-monitor/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port: 443, version })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      tlsMonSnapshot = data.snapshot;
      renderTlsMonitorViews();
      if (msg) {
        msg.textContent = `${data.result.protocol} • ${data.result.handshakeMs} ms`;
        msg.className = `badge ${data.result.status === 'Connected' ? 'badge-pass' : 'badge-warn'}`;
      }
      playCyberTone(data.result.status === 'Connected' ? 'success' : 'error');
    } catch (e) {
      if (msg) { msg.textContent = e.message; msg.className = 'badge badge-fail'; }
      playCyberTone('error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Run Live TLS Probe'; }
    }
  }

  async function clearTlsMonitorHistory() {
    await fetch('/api/tls-monitor/history', { method: 'DELETE' });
    renderTlsMonitorSystem();
  }

  // ============================================================================
  // NETWORK TRAFFIC ANALYSIS & PCAP INSPECTION CLIENT (MODULE 1-10)
  // ============================================================================
  let activePcapResult = null;
  let pcapProtoChart = null;
  let pcapSizeChart = null;

  function setPcapStatus(msg, type = 'info') {
    const el = document.getElementById('pcapStatusBadge');
    if (!el) return;
    el.textContent = msg;
    el.className = `badge ${type === 'ok' ? 'badge-pass' : type === 'err' ? 'badge-fail' : 'badge-info'}`;
  }

  async function loadSamplePcapCapture() {
    setPcapStatus('Loading sample .pcap...', 'info');
    try {
      const r = await fetch('/api/pcap/sample');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to load sample.');
      activePcapResult = d;
      setPcapStatus(`Loaded ${d.fileName} (${d.analysis.packetCount} packets)`, 'ok');
      renderPcapLab();
      playCyberTone('success');
    } catch (e) {
      setPcapStatus(e.message, 'err');
    }
  }

  async function uploadAndAnalyzePcap() {
    const inp = document.getElementById('pcapFileInput');
    const file = inp?.files?.[0];
    if (!file) {
      setPcapStatus('Select a .pcap or .pcapng file first.', 'err');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPcapStatus('Error: File exceeds 5 MB limit.', 'err');
      return;
    }
    setPcapStatus(`Uploading & decoding ${file.name}...`, 'info');
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const base64Data = btoa(bin);
      const r = await fetch('/api/pcap/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, base64Data })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'PCAP decode failed.');
      activePcapResult = d;
      setPcapStatus(`Decoded ${d.fileName} (${d.analysis.format}, ${d.analysis.packetCount} pkts)`, 'ok');
      renderPcapLab();
      playCyberTone('success');
    } catch (e) {
      setPcapStatus(e.message, 'err');
      playCyberTone('error');
    }
  }

  function renderPcapLab() {
    if (!activePcapResult || !activePcapResult.analysis) return;
    const an = activePcapResult.analysis;

    const kpis = document.getElementById('pcapSummaryKpis');
    if (kpis) {
      kpis.innerHTML = `
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Format</span><span class="rep-kpi-val">${escapeHtml(an.format)}</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Packets</span><span class="rep-kpi-val">${an.packetCount}</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Duration</span><span class="rep-kpi-val">${an.durationSec}s</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">TLS Records</span><span class="rep-kpi-val">${(an.tlsRecords || []).length}</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">File Size</span><span class="rep-kpi-val">${activePcapResult.sizeBytes} B</span></div>
      `;
    }

    const fIp = (document.getElementById('pcapFilterIp')?.value || '').trim().toLowerCase();
    const fProto = document.getElementById('pcapFilterProto')?.value || 'all';
    const fPort = Number(document.getElementById('pcapFilterPort')?.value || 0);
    const fMinSize = Number(document.getElementById('pcapFilterMinSize')?.value || 0);

    const filtered = (an.packets || []).filter((p) => {
      const ipOk = !fIp || p.srcIp.toLowerCase().includes(fIp) || p.dstIp.toLowerCase().includes(fIp);
      const prOk = fProto === 'all' || p.appProto === fProto || p.transportProto === fProto || p.networkProto === fProto;
      const ptOk = !fPort || p.srcPort === fPort || p.dstPort === fPort;
      const szOk = !fMinSize || p.length >= fMinSize;
      return ipOk && prOk && ptOk && szOk;
    });

    const pBody = document.getElementById('pcapPacketsBody');
    if (pBody) {
      pBody.innerHTML = filtered.length
        ? filtered.slice(0, 150).map((p) => `
          <tr data-pkt-no="${p.no}" style="cursor:pointer;">
            <td>${p.no}</td>
            <td style="font-size:0.75rem;">${escapeHtml(p.timestamp.slice(11, 19))}</td>
            <td>${escapeHtml(p.srcIp)}${p.srcPort ? `:${p.srcPort}` : ''}</td>
            <td>${escapeHtml(p.dstIp)}${p.dstPort ? `:${p.dstPort}` : ''}</td>
            <td><span class="badge badge-info">${escapeHtml(p.appProto || p.transportProto || p.networkProto)}</span></td>
            <td>${p.length} B</td>
            <td style="font-size:0.74rem;">${escapeHtml(p.tcpFlags || '—')}</td>
          </tr>
        `).join('')
        : '<tr><td colspan="7" style="text-align:center; color:var(--text-secondary);">No packets match filters.</td></tr>';

      pBody.querySelectorAll('[data-pkt-no]').forEach((row) => {
        row.addEventListener('click', () => {
          const no = Number(row.getAttribute('data-pkt-no'));
          const pkt = (an.packets || []).find((x) => x.no === no);
          const det = document.getElementById('pcapPacketDetail');
          if (pkt && det) {
            det.style.color = 'var(--text-primary)';
            det.textContent = [
              `Packet #${pkt.no} (${pkt.length} bytes) @ ${pkt.timestamp}`,
              `Link Layer: ${pkt.linkProto}`,
              `Network Layer: ${pkt.networkProto} (${pkt.srcIp} -> ${pkt.dstIp})`,
              `Transport Layer: ${pkt.transportProto} (SrcPort: ${pkt.srcPort ?? 'N/A'}, DstPort: ${pkt.dstPort ?? 'N/A'}, Flags: ${pkt.tcpFlags || 'None'})`,
              `Application Layer: ${pkt.appProto || 'N/A'}`,
              pkt.tls
                ? `TLS Record: ${pkt.tls.recordType} | Version: ${pkt.tls.version} | Handshake: ${pkt.tls.handshakeType || 'N/A'} | Payload: ${pkt.tls.encryptedPayload ? '[ENCRYPTED - NOT DECRYPTED]' : 'Plaintext Handshake Header'}`
                : 'TLS Record: None'
            ].join('\n');
          }
        });
      });
    }

    // Module 3 & 7: Charts
    const protoCanvas = document.getElementById('pcapProtoChart');
    if (protoCanvas && typeof Chart !== 'undefined') {
      const labels = Object.keys(an.protoCounts || {});
      const vals = Object.values(an.protoCounts || {});
      if (pcapProtoChart) {
        pcapProtoChart.data.labels = labels;
        pcapProtoChart.data.datasets[0].data = vals;
        pcapProtoChart.update();
      } else {
        pcapProtoChart = new Chart(protoCanvas.getContext('2d'), {
          type: 'doughnut',
          data: { labels, datasets: [{ data: vals, backgroundColor: ['#FF6685', '#10B981', '#38BDF8', '#F59E0B', '#A855F7', '#EC4899'], borderWidth: 1 }] },
          options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: '#D1B8C2' } } } }
        });
      }
    }

    const sizeCanvas = document.getElementById('pcapSizeChart');
    if (sizeCanvas && typeof Chart !== 'undefined') {
      const slice = filtered.slice(0, 30);
      const labels = slice.map((p) => `#${p.no}`);
      const vals = slice.map((p) => p.length);
      if (pcapSizeChart) {
        pcapSizeChart.data.labels = labels;
        pcapSizeChart.data.datasets[0].data = vals;
        pcapSizeChart.update();
      } else {
        pcapSizeChart = new Chart(sizeCanvas.getContext('2d'), {
          type: 'bar',
          data: { labels, datasets: [{ label: 'Frame Length (bytes)', data: vals, backgroundColor: '#FF6685' }] },
          options: { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { color: '#D1B8C2' } }, x: { ticks: { color: '#D1B8C2' } } }, plugins: { legend: { labels: { color: '#D1B8C2' } } } }
        });
      }
    }

    // Module 4: TLS Packet Analysis
    const tlsBox = document.getElementById('pcapTlsRecordsList');
    if (tlsBox) {
      const recs = an.tlsRecords || [];
      tlsBox.innerHTML = recs.length
        ? recs.map((r) => `
          <div style="padding:8px 10px; border-radius:8px; background:rgba(25,10,18,0.65); border:1px solid rgba(120,51,79,0.5); font-size:0.8rem;">
            <strong>Pkt #${r.no}: ${escapeHtml(r.recordType)}</strong> (${escapeHtml(r.version)}) ${r.handshakeType ? `&bull; ${escapeHtml(r.handshakeType)}` : ''}
            <div style="color:${r.encryptedPayload ? '#ff8eaa' : '#4ade80'};">${r.encryptedPayload ? 'Encrypted Application Data — payload protected (not decrypted)' : 'Plaintext TLS Handshake Metadata'}</div>
          </div>
        `).join('')
        : '<div style="font-size:0.84rem; color:var(--text-secondary);">No TLS records detected in this capture.</div>';
    }

    // Module 5 & 6: IP & Port Analysis
    const ipBox = document.getElementById('pcapIpPortBox');
    if (ipBox) {
      const pairs = Object.entries(an.pairCounts || {}).slice(0, 6).map(([k, v]) => `${escapeHtml(k)} (${v} pkts)`).join('<br>');
      const ports = Object.entries(an.portCounts || {}).map(([p, v]) => `Port ${escapeHtml(p)} (${v}x)`).join(' • ');
      ipBox.innerHTML = `
        <div style="margin-bottom:8px;"><strong>Communication Pairs:</strong><br>${pairs || 'None'}</div>
        <div><strong>Observed Destination Ports:</strong><br>${ports || 'None'}</div>
      `;
    }
  }

  function generatePcapReport() {
    const box = document.getElementById('pcapReportBox');
    if (!box || !activePcapResult) return;
    const an = activePcapResult.analysis;
    const hasHttp = Boolean((an.protoCounts || {}).HTTP);
    box.textContent = [
      `NETWORK TRAFFIC ANALYSIS REPORT — ${activePcapResult.fileName}`,
      `Format: ${an.format} | Packets: ${an.packetCount} | Duration: ${an.durationSec}s | Start: ${an.captureStart}`,
      `Protocols: ${Object.entries(an.protoCounts || {}).map(([k, v]) => `${k}=${v}`).join(', ')}`,
      `TLS Records Observed: ${(an.tlsRecords || []).length} (Application Data records remain encrypted)`,
      `Security Findings: ${hasHttp ? 'Plaintext HTTP (Port 80) traffic observed — recommend migrating to HTTPS/TLS 1.3.' : 'No plaintext HTTP traffic detected in capture.'}`
    ].join('\n');
  }

  function validatePcapStudentLab() {
    const val = document.getElementById('pcapQuizAns')?.value || '';
    const fb = document.getElementById('pcapQuizFeedback');
    if (!fb) return;
    if (val === 'ApplicationData') {
      fb.style.color = '#4ade80';
      fb.textContent = '✓ Correct! TLS Application Data (0x17) is encrypted with AEAD keys; only handshake headers (ClientHello/ServerHello) are visible.';
      recordLabCompletion('pcap', 'Completed PCAP Network Traffic Analysis Lab');
      playCyberTone('success');
    } else {
      fb.style.color = '#ff6685';
      fb.textContent = '✕ Incorrect. Hint: Handshake messages (0x16) like ClientHello/ServerHello occur before application encryption.';
      playCyberTone('error');
    }
  }

  // ============================================================================
  // CYBERSECURITY CAREER & CERTIFICATION PREPARATION CENTER (MODULE 1-10)
  // ============================================================================
  const CAREER_STATE_KEY = 'tls_lab_career_state_v1';
  let carIntIdx = 0;
  let activeVivaId = 'vv_1';

  function loadCareerState() {
    const def = {
      certProgress: {},
      interviewSolved: [],
      vivaMastered: [],
      vivaMissed: [],
      skillScore: null,
      resume: { name: '', edu: 'B.Tech CSE', skills: 'TLS 1.3, AES-GCM, ECDHE, Wireshark/PCAP, Linux', intern: '', summary: '' }
    };
    try {
      const p = JSON.parse(localStorage.getItem(CAREER_STATE_KEY) || '{}');
      return Object.assign({}, def, p, { resume: Object.assign({}, def.resume, p.resume || {}) });
    } catch { return def; }
  }

  function saveCareerState(st) {
    try { localStorage.setItem(CAREER_STATE_KEY, JSON.stringify(st)); } catch { }
  }

  function renderCareerReadiness() {
    const kpis = document.getElementById('carReadinessKpis');
    if (!kpis) return;
    const cs = loadCareerState();
    const snap = buildReportSnapshot();
    const issuedCount = Object.keys(typeof loadIssuedCerts === 'function' ? loadIssuedCerts() : {}).length;
    const certPrepCount = Object.values(cs.certProgress || {}).filter((v) => v > 0).length;
    const portfolioItems = snap.uniqueLabs + issuedCount + (cs.resume.summary ? 1 : 0);

    kpis.innerHTML = `
      <div class="rep-kpi-box"><span class="rep-kpi-lbl">Skill Assessment</span><span class="rep-kpi-val">${cs.skillScore !== null ? `${cs.skillScore}%` : 'Pending'}</span></div>
      <div class="rep-kpi-box"><span class="rep-kpi-lbl">Interview Solved</span><span class="rep-kpi-val">${(cs.interviewSolved || []).length}/10</span></div>
      <div class="rep-kpi-box"><span class="rep-kpi-lbl">Certs Preparing</span><span class="rep-kpi-val">${certPrepCount}/5</span></div>
      <div class="rep-kpi-box"><span class="rep-kpi-lbl">Challenges Done</span><span class="rep-kpi-val">${snap.solvedChallenges}/${snap.totalChallenges}</span></div>
      <div class="rep-kpi-box"><span class="rep-kpi-lbl">Portfolio Items</span><span class="rep-kpi-val">${portfolioItems}</span></div>
    `;
  }

  function renderSelectedRoadmap() {
    const cd = window.CAREER_DATA;
    const sel = document.getElementById('carRoadmapSelect');
    const box = document.getElementById('carRoadmapDetail');
    if (!cd || !sel || !box) return;
    const rm = cd.roadmaps.find((r) => r.id === sel.value) || cd.roadmaps[0];
    if (!rm) return;
    box.innerHTML = `
      <p style="color:var(--text-secondary); margin-top:0;">${escapeHtml(rm.desc)}</p>
      <div><strong>Required Skills:</strong> ${rm.skills.map(escapeHtml).join(', ')}</div>
      <div><strong>Tools:</strong> ${rm.tools.map(escapeHtml).join(', ')}</div>
      <div><strong>Recommended Projects:</strong> ${rm.projects.map(escapeHtml).join(', ')}</div>
      <div style="margin-top:6px;"><strong>Roadmap:</strong><ul style="margin:4px 0; padding-left:18px;">${rm.stages.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul></div>
      <div><strong>Interview Focus:</strong> ${rm.interview.map(escapeHtml).join(' • ')}</div>
    `;
  }

  function renderSelectedCertification() {
    const cd = window.CAREER_DATA;
    const sel = document.getElementById('carCertSelect');
    const box = document.getElementById('carCertDetail');
    if (!cd || !sel || !box) return;
    const cert = cd.certifications.find((c) => c.id === sel.value) || cd.certifications[0];
    if (!cert) return;
    const cs = loadCareerState();
    const score = (cs.certProgress || {})[cert.id] || 0;
    box.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <strong>${escapeHtml(cert.title)}</strong>
        <span class="badge badge-pass">Mock Score: ${score}%</span>
      </div>
      <p style="color:var(--text-secondary); margin:0 0 6px 0;">${escapeHtml(cert.overview)} <em>(Prereq: ${escapeHtml(cert.prereq)})</em></p>
      <div><strong>Topics:</strong> ${cert.topics.map(escapeHtml).join(' • ')}</div>
      <div style="margin:6px 0;"><strong>Study Path:</strong><ol style="margin:4px 0; padding-left:18px;">${cert.roadmap.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol></div>
      <div style="padding:8px; border-radius:8px; background:rgba(25,10,18,0.65); border:1px solid rgba(120,51,79,0.5);">
        <strong>Quick Mock Check:</strong>
        ${cert.questions.map((q, qi) => `
          <div style="margin-top:6px;">
            <div>${qi + 1}. ${escapeHtml(q.q)}</div>
            <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;">
              ${q.opts.map((o, oi) => `<button type="button" class="btn btn-sm btn-secondary" data-cert-q="${escapeHtml(cert.id)}|${qi}|${oi}">${escapeHtml(o)}</button>`).join('')}
            </div>
          </div>
        `).join('')}
        <div id="carCertFeedback" style="margin-top:6px; font-size:0.8rem;"></div>
      </div>
    `;
    box.querySelectorAll('[data-cert-q]').forEach((b) => {
      b.addEventListener('click', () => {
        const [cid, qi, oi] = b.getAttribute('data-cert-q').split('|');
        const qObj = cert.questions[Number(qi)];
        const fb = document.getElementById('carCertFeedback');
        const ok = Number(oi) === qObj.ans;
        if (fb) {
          fb.style.color = ok ? '#4ade80' : '#ff6685';
          fb.textContent = (ok ? '✓ Correct! ' : '✕ Incorrect. ') + qObj.exp;
        }
        if (ok) {
          const st = loadCareerState();
          st.certProgress[cid] = Math.min(100, (st.certProgress[cid] || 0) + 50);
          saveCareerState(st);
          renderCareerReadiness();
          playCyberTone('success');
        } else {
          playCyberTone('error');
        }
      });
    });
  }

  function renderInterviewQuestion() {
    const cd = window.CAREER_DATA;
    const box = document.getElementById('carInterviewBox');
    if (!cd || !box) return;
    const topic = document.getElementById('carIntTopicSelect')?.value || 'all';
    const diff = document.getElementById('carIntDiffSelect')?.value || 'all';
    const pool = cd.interviewBank.filter((q) => (topic === 'all' || q.topic === topic) && (diff === 'all' || q.diff === diff));
    const cs = loadCareerState();
    const badge = document.getElementById('carInterviewScoreBadge');
    if (badge) badge.textContent = `${(cs.interviewSolved || []).length}/${cd.interviewBank.length} Solved`;

    if (!pool.length) {
      box.innerHTML = '<div style="color:var(--text-secondary);">No questions match these filters.</div>';
      return;
    }
    const q = pool[carIntIdx % pool.length];
    box.innerHTML = `
      <div style="margin-bottom:6px;"><span class="badge badge-info">${escapeHtml(q.topic)} &bull; ${escapeHtml(q.diff)}</span></div>
      <div style="font-weight:600; margin-bottom:8px;">${escapeHtml(q.q)}</div>
      <div style="display:flex; flex-direction:column; gap:6px;">
        ${q.opts.map((o, i) => `<button type="button" class="btn btn-sm btn-secondary" style="text-align:left;" data-int-opt="${i}">${escapeHtml(o)}</button>`).join('')}
      </div>
      <div id="carIntFeedback" style="margin-top:8px; font-size:0.82rem;"></div>
    `;
    box.querySelectorAll('[data-int-opt]').forEach((b) => {
      b.addEventListener('click', () => {
        const idx = Number(b.getAttribute('data-int-opt'));
        const fb = document.getElementById('carIntFeedback');
        const ok = idx === q.ans;
        if (fb) {
          fb.style.color = ok ? '#4ade80' : '#ff6685';
          fb.textContent = (ok ? '✓ Correct! ' : '✕ Incorrect. ') + q.exp;
        }
        if (ok) {
          const st = loadCareerState();
          if (!st.interviewSolved.includes(q.id)) st.interviewSolved.push(q.id);
          saveCareerState(st);
          renderCareerReadiness();
          playCyberTone('success');
        } else {
          playCyberTone('error');
        }
      });
    });
  }

  function pickVivaQuestion(retryMissedOnly = false) {
    const cd = window.CAREER_DATA;
    if (!cd) return;
    const cs = loadCareerState();
    let pool = cd.vivaQuestions;
    if (retryMissedOnly && cs.vivaMissed.length) {
      pool = cd.vivaQuestions.filter((v) => cs.vivaMissed.includes(v.id));
    }
    const q = pool[Math.floor(Math.random() * pool.length)] || cd.vivaQuestions[0];
    activeVivaId = q.id;
    const qEl = document.getElementById('carVivaQuestion');
    const mEl = document.getElementById('carVivaModelBox');
    const inp = document.getElementById('carVivaInput');
    if (qEl) qEl.textContent = `[${q.topic} • ${q.diff}] ${q.q}`;
    if (mEl) { mEl.style.display = 'none'; mEl.textContent = `Model Answer: ${q.model}`; }
    if (inp) inp.value = '';
    const sb = document.getElementById('carVivaScoreBadge');
    if (sb) sb.textContent = `Mastered: ${cs.vivaMastered.length}/${cd.vivaQuestions.length}`;
  }

  function scoreVivaQuestion(mastered) {
    const cs = loadCareerState();
    if (mastered) {
      if (!cs.vivaMastered.includes(activeVivaId)) cs.vivaMastered.push(activeVivaId);
      cs.vivaMissed = cs.vivaMissed.filter((id) => id !== activeVivaId);
    } else {
      if (!cs.vivaMissed.includes(activeVivaId)) cs.vivaMissed.push(activeVivaId);
    }
    saveCareerState(cs);
    pickVivaQuestion(false);
  }

  function renderSkillAssessment() {
    const cd = window.CAREER_DATA;
    const box = document.getElementById('carSkillQuizBox');
    if (!cd || !box) return;
    box.innerHTML = cd.skillDomains.map((d) => `
      <div style="padding:8px; border-radius:8px; background:rgba(25,10,18,0.65); border:1px solid rgba(120,51,79,0.45); font-size:0.82rem;">
        <div><strong>${escapeHtml(d.label)}:</strong> ${escapeHtml(d.q)}</div>
        <select class="select-input" data-skill-q="${escapeHtml(d.id)}" style="margin-top:4px;">
          <option value="-1">Select...</option>
          ${d.opts.map((o, i) => `<option value="${i}">${escapeHtml(o)}</option>`).join('')}
        </select>
      </div>
    `).join('');
    const cs = loadCareerState();
    const b = document.getElementById('carSkillScoreBadge');
    if (b) b.textContent = cs.skillScore !== null ? `Score: ${cs.skillScore}%` : 'Not Assessed';
  }

  function submitCareerSkillAssessment() {
    const cd = window.CAREER_DATA;
    if (!cd) return;
    let correct = 0;
    cd.skillDomains.forEach((d) => {
      const v = Number(document.querySelector(`[data-skill-q="${d.id}"]`)?.value ?? -1);
      if (v === d.ans) correct += 1;
    });
    const pct = Math.round((correct / cd.skillDomains.length) * 100);
    const cs = loadCareerState();
    cs.skillScore = pct;
    saveCareerState(cs);
    const b = document.getElementById('carSkillScoreBadge');
    if (b) b.textContent = `Score: ${pct}% (${correct}/${cd.skillDomains.length})`;
    renderCareerReadiness();
    playCyberTone('success');
  }

  function saveCareerResume() {
    const cs = loadCareerState();
    cs.resume = {
      name: (document.getElementById('carResName')?.value || '').trim(),
      edu: (document.getElementById('carResEdu')?.value || '').trim(),
      skills: (document.getElementById('carResSkills')?.value || '').trim(),
      intern: (document.getElementById('carResIntern')?.value || '').trim(),
      summary: (document.getElementById('carResSummary')?.value || '').trim()
    };
    saveCareerState(cs);
    renderCareerReadiness();
    playCyberTone('success');
  }

  function exportCareerResumePdf() {
    saveCareerResume();
    const cs = loadCareerState();
    const r = cs.resume;
    const snap = buildReportSnapshot();
    const certs = Object.values(typeof loadIssuedCerts === 'function' ? loadIssuedCerts() : {});
    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      doc.setFontSize(20);
      doc.text(r.name || snap.studentName || 'Cybersecurity Candidate', 45, 55);
      doc.setFontSize(11);
      doc.text(`Education: ${r.edu || 'B.Tech CSE'}`, 45, 78);
      doc.text(`Summary: ${r.summary || 'B.Tech CSE student specializing in TLS 1.3, Cryptography, and Network Security.'}`, 45, 102, { maxWidth: 500 });
      doc.text(`Technical Skills: ${r.skills}`, 45, 145, { maxWidth: 500 });
      doc.text(`Internships: ${r.intern || 'TLS Security Lab Practical Track'}`, 45, 180, { maxWidth: 500 });
      doc.text(`Verified Lab Projects: ${snap.uniqueLabs}/5 Crypto/TLS Labs | ${snap.solvedChallenges} Security Challenges`, 45, 210);
      doc.text(`Platform Certificates: ${certs.length ? certs.map((c) => c.title).join(', ') : 'In Progress'}`, 45, 235, { maxWidth: 500 });
      doc.save('Cybersecurity_Resume.pdf');
    } else {
      window.print();
    }
  }

  function renderCareerPortfolio() {
    const box = document.getElementById('carPortfolioList');
    if (!box) return;
    const snap = buildReportSnapshot();
    const certs = Object.values(typeof loadIssuedCerts === 'function' ? loadIssuedCerts() : {});
    const doneLabs = snap.labRows.filter((l) => l.done);
    const items = [
      ...doneLabs.map((l) => `<div style="padding:8px; border-radius:8px; background:rgba(25,10,18,0.65); border:1px solid rgba(16,185,129,0.4);"><strong>Lab Project:</strong> ${escapeHtml(l.name)} (${escapeHtml(l.date)})</div>`),
      ...certs.map((c) => `<div style="padding:8px; border-radius:8px; background:rgba(25,10,18,0.65); border:1px solid rgba(255,102,133,0.5);"><strong>Credential:</strong> ${escapeHtml(c.title)} (<code>${escapeHtml(c.certId)}</code>)</div>`)
    ];
    box.innerHTML = items.length ? items.join('') : '<div style="color:var(--text-secondary);">Complete Practical Labs or earn Certificates to populate your verified portfolio automatically.</div>';
  }

  async function askCareerAiAssistant() {
    const prompt = (document.getElementById('carAiPrompt')?.value || '').trim();
    const box = document.getElementById('carAiReplyBox');
    if (!prompt || !box) return;
    box.textContent = 'Consulting AI Career Assistant...';
    try {
      const resp = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'smart_recommendations',
          level: 'beginner',
          prompt: `Career & Certification Prep Question: ${prompt}`,
          evidence: typeof buildAiSessionEvidence === 'function' ? buildAiSessionEvidence() : {}
        })
      });
      const d = await resp.json();
      box.textContent = d.aiExplanation || d.error || 'No response.';
    } catch (e) {
      box.textContent = `Error: ${e.message}`;
    }
  }

  function renderCareerCenter() {
    const cd = window.CAREER_DATA;
    if (!cd) return;
    const rmSel = document.getElementById('carRoadmapSelect');
    if (rmSel && !rmSel.options.length) {
      rmSel.innerHTML = cd.roadmaps.map((r) => `<option value="${escapeHtml(r.id)}">${escapeHtml(r.title)}</option>`).join('');
    }
    const cSel = document.getElementById('carCertSelect');
    if (cSel && !cSel.options.length) {
      cSel.innerHTML = cd.certifications.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.title)}</option>`).join('');
    }
    const tSel = document.getElementById('carIntTopicSelect');
    if (tSel && tSel.options.length <= 1) {
      const topics = [...new Set(cd.interviewBank.map((q) => q.topic))];
      topics.forEach((t) => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        tSel.appendChild(opt);
      });
    }

    const cs = loadCareerState();
    const prof = typeof loadStudentProfile === 'function' ? loadStudentProfile() : {};
    const setV = (id, v) => { const el = document.getElementById(id); if (el && !el.value && v) el.value = v; };
    setV('carResName', cs.resume.name || prof.name || '');
    setV('carResEdu', cs.resume.edu || prof.course || 'B.Tech CSE');
    setV('carResSkills', cs.resume.skills);
    setV('carResIntern', cs.resume.intern);
    setV('carResSummary', cs.resume.summary);

    renderCareerReadiness();
    renderSelectedRoadmap();
    renderSelectedCertification();
    renderInterviewQuestion();
    pickVivaQuestion(false);
    renderSkillAssessment();
    renderCareerPortfolio();
  }

  // ============================================================================
  // MULTI-LANGUAGE LEARNING SUPPORT, GLOSSARY & TEXT-TO-SPEECH (MODULE 1-9)
  // ============================================================================
  function applyLanguageSettings() {
    const i18n = window.I18N_DATA;
    if (!i18n) return;
    const sets = loadStudentSettings();
    const lang = i18n.UI[sets.language] ? sets.language : 'en';
    const dict = i18n.UI[lang] || i18n.UI.en;
    const bilingual = Boolean(sets.bilingual);

    document.documentElement.lang = lang;
    const hSel = document.getElementById('headerLangSelect');
    if (hSel) hSel.value = lang;
    const biTxt = document.getElementById('bilingualStatusText');
    if (biTxt) biTxt.textContent = `${dict.bilingual_label || 'Bilingual'}: ${bilingual ? 'On' : 'Off'}`;

    const navMap = {
      navItemDashboard: 'nav_dashboard',
      navItemSimulator: 'nav_simulator',
      navItemCertificate: 'nav_certificate',
      navItemCrypto: 'nav_crypto',
      navItemComparison: 'nav_comparison',
      navItemSecurity: 'nav_security',
      navItemStudentDash: 'nav_student_dash',
      navItemAcademy: 'nav_academy',
      navItemQuiz: 'nav_quiz',
      navItemChallenges: 'nav_challenges',
      navItemProgress: 'nav_progress',
      navItemReports: 'nav_reports',
      navItemProfile: 'nav_profile',
      navItemAiAdvisor: 'nav_ai',
      navItemAdminPortal: 'nav_admin',
      navItemClassroom: 'nav_classroom',
      navItemTlsMonitor: 'nav_monitor',
      navItemPcapLab: 'nav_pcap',
      navItemCareerCenter: 'nav_career',
      navItemGlossary: 'nav_glossary'
    };
    Object.entries(navMap).forEach(([id, key]) => {
      const lbl = document.querySelector(`#${id} .nav-label`);
      if (lbl && dict[key]) lbl.textContent = dict[key];
    });

    const btnCont = document.getElementById('btnStudentGoAcademy');
    if (btnCont && dict.btn_continue) btnCont.textContent = `${dict.btn_continue} →`;

    // Bilingual concept banner in Learning Academy
    const acadBody = document.getElementById('acadLessonBody');
    if (acadBody && i18n.CONCEPT_NOTES) {
      let noteEl = document.getElementById('acadBilingualNoteBox');
      if (!noteEl) {
        noteEl = document.createElement('div');
        noteEl.id = 'acadBilingualNoteBox';
        noteEl.style.cssText = 'margin-top:10px; padding:10px 12px; border-radius:8px; background:rgba(255,102,133,0.08); border:1px solid rgba(255,102,133,0.35); font-size:0.86rem;';
        acadBody.parentNode.insertBefore(noteEl, acadBody.nextSibling);
      }
      const note = i18n.CONCEPT_NOTES.tls;
      if (lang === 'en' && !bilingual) {
        noteEl.style.display = 'none';
      } else {
        noteEl.style.display = 'block';
        noteEl.innerHTML = `<strong style="color:var(--accent-primary);">${escapeHtml(dict.academy_bilingual_title || 'Bilingual Summary')}:</strong><br>` +
          (bilingual ? `<div><strong>English:</strong> ${escapeHtml(note.en)}</div>` : '') +
          `<div><strong>${escapeHtml(i18n.LANG_META[lang].native)}:</strong> ${escapeHtml(note[lang] || note.en)}</div>`;
      }
    }

    if (currentActiveTabId === 'tabGlossary') renderGlossarySystem();
  }

  function speakText(text) {
    const badge = document.getElementById('ttsStatusBadge');
    const sets = loadStudentSettings();
    const lang = sets.language || 'en';
    const bcp = (window.I18N_DATA && window.I18N_DATA.LANG_META[lang]?.speech) || 'en-US';
    if (!window.speechSynthesis || !text.trim()) {
      if (badge) badge.textContent = !window.speechSynthesis ? 'TTS unsupported in this browser' : 'Enter text to speak';
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.trim());
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang.toLowerCase().startsWith(bcp.split('-')[0].toLowerCase()));
    if (match) {
      utter.voice = match;
      utter.lang = match.lang;
      if (badge) { badge.textContent = `Speaking (${match.lang})`; badge.className = 'badge badge-pass'; }
    } else {
      utter.lang = 'en-US';
      if (badge) { badge.textContent = `No ${bcp} OS voice installed — using default voice`; badge.className = 'badge badge-info'; }
    }
    utter.rate = Number(document.getElementById('ttsSpeedSelect')?.value || 1);
    window.speechSynthesis.speak(utter);
  }

  function renderGlossarySystem() {
    const i18n = window.I18N_DATA;
    const grid = document.getElementById('glossaryGrid');
    if (!i18n || !grid) return;
    const sets = loadStudentSettings();
    const lang = sets.language || 'en';
    const q = (document.getElementById('glossarySearchInput')?.value || '').trim().toLowerCase();
    const cat = document.getElementById('glossaryCatSelect')?.value || 'all';

    const list = i18n.GLOSSARY.filter((g) => {
      const cOk = cat === 'all' || g.cat === cat;
      const qOk = !q || g.term.toLowerCase().includes(q) || g.def.toLowerCase().includes(q);
      return cOk && qOk;
    });

    const cnt = document.getElementById('glossaryCountBadge');
    if (cnt) cnt.textContent = `${list.length} / ${i18n.GLOSSARY.length} Terms`;

    grid.innerHTML = list.map((g) => {
      const reg = lang !== 'en' && g.meanings[lang] ? `<div style="margin-top:4px; color:var(--accent-secondary); font-size:0.8rem;">${escapeHtml(g.meanings[lang])}</div>` : '';
      return `
        <div class="rep-cert-card" style="padding:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
            <strong style="color:var(--accent-primary);">${escapeHtml(g.term)}</strong>
            <span class="badge badge-info">${escapeHtml(g.cat)}</span>
          </div>
          <div style="font-size:0.82rem; color:var(--text-primary);">${escapeHtml(g.def)}</div>
          ${reg}
          <div style="font-size:0.76rem; color:var(--text-secondary);">Ex: ${escapeHtml(g.ex)}</div>
          <button type="button" class="btn btn-sm btn-secondary" data-tts-term="${escapeHtml(g.term + '. ' + g.def)}" style="margin-top:auto;">Speak</button>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('[data-tts-term]').forEach((b) => {
      b.addEventListener('click', () => {
        const txt = b.getAttribute('data-tts-term');
        const inp = document.getElementById('ttsTextInput');
        if (inp) inp.value = txt;
        speakText(txt);
      });
    });
  }

  // ============================================================================
  // PWA SERVICE WORKER, OFFLINE LEARNING & ADVANCED ANALYTICS (MODULE 1-11)
  // ============================================================================
  const OFFLINE_LESSONS_KEY = 'tls_lab_offline_lessons_v1';
  const advCharts = { line: null, bar: null, doughnut: null, radar: null };
  let advTlPage = 1;

  function initPwaAndOfflineSync() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => { });
    }
    const updateOnlineBadge = () => {
      const pill = document.getElementById('offlineStatusPill');
      if (!pill) return;
      if (navigator.onLine) {
        pill.textContent = 'Online';
        pill.className = 'badge badge-pass';
        if (typeof syncStudentProgressToBackend === 'function') syncStudentProgressToBackend();
      } else {
        pill.textContent = 'Offline (Saved Lessons Ready)';
        pill.className = 'badge badge-warn';
      }
    };
    window.addEventListener('online', updateOnlineBadge);
    window.addEventListener('offline', updateOnlineBadge);
    updateOnlineBadge();
    updateOfflineSavedBadge();
  }

  function updateOfflineSavedBadge() {
    const b = document.getElementById('advOfflineSavedBadge');
    if (!b) return;
    try {
      const raw = JSON.parse(localStorage.getItem(OFFLINE_LESSONS_KEY) || '[]');
      b.textContent = Array.isArray(raw) && raw.length ? `Offline Cache: ${raw.length} Lessons Saved` : 'Offline Cache: Not Saved Yet';
    } catch { b.textContent = 'Offline Cache: Empty'; }
  }

  function saveAcademyLessonsOffline() {
    try {
      const all = typeof getAllAcademyLessons === 'function' ? getAllAcademyLessons() : [];
      localStorage.setItem(OFFLINE_LESSONS_KEY, JSON.stringify(all));
      updateOfflineSavedBadge();
      playCyberTone('success');
    } catch { }
  }

  function renderAdvancedTimeline() {
    const box = document.getElementById('advTimelineList');
    const pInfo = document.getElementById('advTlPageInfo');
    if (!box) return;
    const cat = document.getElementById('advCatFilter')?.value || 'all';
    const items = (studentState.activities || []).filter((a) => cat === 'all' || (a.badge || '').includes(cat));
    const pageSize = 5;
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    if (advTlPage > totalPages) advTlPage = totalPages;
    const slice = items.slice((advTlPage - 1) * pageSize, advTlPage * pageSize);

    if (pInfo) pInfo.textContent = `Page ${advTlPage} / ${totalPages}`;
    box.innerHTML = slice.length
      ? slice.map((a) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border-radius:8px; background:rgba(25,10,18,0.65); border:1px solid rgba(120,51,79,0.45); font-size:0.82rem;">
          <span>${escapeHtml(a.title)}</span>
          <span class="badge badge-info">${escapeHtml(a.badge || 'EVENT')} &bull; ${escapeHtml(a.time || '')}</span>
        </div>
      `).join('')
      : '<div style="font-size:0.84rem; color:var(--text-secondary);">No recorded activities match the selected filter.</div>';
  }

  function renderAdvancedAnalytics() {
    updateOfflineSavedBadge();
    const snap = buildReportSnapshot();
    const streaks = computeStreaks();
    const tSec = studentState.timeBySection || { academy: 0, lab: 0, quiz: 0, playground: 0 };
    const totalHrs = (((tSec.academy || 0) + (tSec.lab || 0) + (tSec.quiz || 0) + (tSec.playground || 0)) / 3600).toFixed(2);

    const kpis = document.getElementById('advStudentKpis');
    if (kpis) {
      kpis.innerHTML = `
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Learning Hours</span><span class="rep-kpi-val">${totalHrs}h</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Lessons Done</span><span class="rep-kpi-val">${snap.completedLessons}/${snap.totalLessons}</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Quiz Attempts</span><span class="rep-kpi-val">${snap.quizAttempts}</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Avg Quiz</span><span class="rep-kpi-val">${snap.quizAvg}%</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Challenges</span><span class="rep-kpi-val">${snap.solvedChallenges}/${snap.totalChallenges}</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Lab Runs</span><span class="rep-kpi-val">${snap.expTotal}</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Streak</span><span class="rep-kpi-val">${streaks.current}d</span></div>
        <div class="rep-kpi-box"><span class="rep-kpi-lbl">Overall</span><span class="rep-kpi-val">${snap.overallPct}%</span></div>
      `;
    }

    // 28-Day Heatmap
    const heat = document.getElementById('advHeatmapGrid');
    if (heat) {
      const cells = [];
      const today = new Date();
      for (let i = 27; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const cnt = (studentState.dailyActivityMap || {})[k] || 0;
        const alpha = cnt === 0 ? 0.08 : Math.min(0.85, 0.22 + cnt * 0.18);
        cells.push(`<div class="adv-heat-cell" style="background:rgba(255,102,133,${alpha});" title="${k}: ${cnt} activities">${cnt || ''}</div>`);
      }
      heat.innerHTML = cells.join('');
    }

    // Skill & Practical Lab Summary
    const skBox = document.getElementById('advSkillSummaryBox');
    if (skBox) {
      const strong = snap.modProgress.filter((m) => m.pct >= 50).map((m) => m.title);
      const weak = snap.modProgress.filter((m) => m.pct < 50).map((m) => m.title);
      skBox.innerHTML = `
        <div><strong>Strongest Areas:</strong> ${strong.length ? strong.map(escapeHtml).join(', ') : 'Complete >= 50% of a module to highlight strengths.'}</div>
        <div><strong>Needs Improvement:</strong> ${weak.length ? weak.map(escapeHtml).join(', ') : 'All modules >= 50%!'}</div>
        <div style="margin-top:6px;"><strong>Practical Labs:</strong> ${snap.labRows.map((l) => `${escapeHtml(l.id.toUpperCase())}: ${l.done ? '✓' : 'Pending'}`).join(' • ')}</div>
      `;
    }

    // Charts (Line, Bar, Doughnut, Radar)
    if (typeof Chart !== 'undefined') {
      const rangeDays = Number(document.getElementById('advRangeFilter')?.value || 30);
      const qSlice = (quizHistory || []).slice(0, rangeDays === 7 ? 7 : 15).reverse();
      const lineLabels = qSlice.length ? qSlice.map((q, i) => `#${i + 1} ${q.cat.slice(0, 8)}`) : ['No Quizzes Yet'];
      const lineData = qSlice.length ? qSlice.map((q) => q.pct) : [0];

      const upsertChart = (key, canvasId, cfg) => {
        const el = document.getElementById(canvasId);
        if (!el) return;
        if (advCharts[key]) { advCharts[key].destroy(); }
        advCharts[key] = new Chart(el.getContext('2d'), cfg);
      };

      upsertChart('line', 'advLineChart', {
        type: 'line',
        data: { labels: lineLabels, datasets: [{ label: 'Quiz Score %', data: lineData, borderColor: '#FF6685', backgroundColor: 'rgba(255,102,133,0.2)', tension: 0.3, fill: true }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100, ticks: { color: '#D1B8C2' } }, x: { ticks: { color: '#D1B8C2' } } }, plugins: { legend: { labels: { color: '#D1B8C2' } } } }
      });

      upsertChart('bar', 'advBarChart', {
        type: 'bar',
        data: { labels: snap.modProgress.map((m) => m.title.slice(0, 14)), datasets: [{ label: 'Module Completion %', data: snap.modProgress.map((m) => m.pct), backgroundColor: '#FF8EAA' }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100, ticks: { color: '#D1B8C2' } }, x: { ticks: { color: '#D1B8C2' } } }, plugins: { legend: { labels: { color: '#D1B8C2' } } } }
      });

      upsertChart('doughnut', 'advDoughnutChart', {
        type: 'doughnut',
        data: { labels: ['Completed Lessons', 'Pending Lessons'], datasets: [{ data: [snap.completedLessons, snap.pendingLessons], backgroundColor: ['#10B981', '#78334F'] }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: '#D1B8C2' } } } }
      });

      const radarVals = [
        snap.modPct('mod_netsec'), snap.modPct('mod_crypto'), snap.modPct('mod_tls'), snap.modPct('mod_certs'),
        snap.hasLab('sha256') ? 80 : 10, snap.modPct('mod_https'), snap.hasLab('pcap') ? 90 : 10, snap.solvedChallenges * 10
      ].map((v) => Math.min(100, v));
      upsertChart('radar', 'advRadarChart', {
        type: 'radar',
        data: {
          labels: ['NetSec', 'Crypto', 'TLS/SSL', 'Certs', 'Linux/Hash', 'WebSec', 'PCAP', 'Hacking'],
          datasets: [{ label: 'Skill Profile %', data: radarVals, borderColor: '#FF6685', backgroundColor: 'rgba(255,102,133,0.22)' }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { r: { min: 0, max: 100, ticks: { display: false }, pointLabels: { color: '#D1B8C2' } } }, plugins: { legend: { labels: { color: '#D1B8C2' } } } }
      });
    }

    renderAdvancedTimeline();
  }

  function exportAnalyticsCsv() {
    const snap = buildReportSnapshot();
    const rows = [
      ['Metric', 'Value'],
      ['Student Name', snap.studentName],
      ['Completed Lessons', `${snap.completedLessons}/${snap.totalLessons}`],
      ['Quiz Attempts', snap.quizAttempts],
      ['Quiz Average %', snap.quizAvg],
      ['Practical Labs Completed', `${snap.uniqueLabs}/5`],
      ['Challenges Solved', `${snap.solvedChallenges}/${snap.totalChallenges}`],
      ['Overall Completion %', snap.overallPct]
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TLS_Lab_Analytics_${getTodayKey()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function generateAdvAiInsights() {
    const box = document.getElementById('advAiInsightsBox');
    if (!box) return;
    box.textContent = 'Analyzing your real learning activity...';
    try {
      const r = await fetch('/api/ai/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'smart_recommendations',
          level: 'beginner',
          language: loadStudentSettings().language || 'en',
          bilingual: Boolean(loadStudentSettings().bilingual),
          prompt: 'Generate weekly learning summary, weak topics, and recommended practical exercises.',
          evidence: buildAiSessionEvidence()
        })
      });
      const d = await r.json();
      box.textContent = d.aiExplanation || d.error || 'No insights available.';
    } catch (e) {
      box.textContent = `Offline or error: ${e.message}`;
    }
  }

  async function loadFacultyCohortAnalytics() {
    const box = document.getElementById('advFacultyBox');
    if (!box) return;
    try {
      const r = await fetch('/api/analytics/faculty');
      const d = await r.json();
      if (!r.ok) {
        box.innerHTML = `<span style="color:#ff6685;">${escapeHtml(d.error || 'Access Denied')}</span>`;
        return;
      }
      box.innerHTML = `
        <div><strong>Classrooms:</strong> ${d.classroomCount} | <strong>Students:</strong> ${d.studentCount} | <strong>Assignments:</strong> ${d.totalAssignments} | <strong>Submissions:</strong> ${d.totalSubmissions} | <strong>Cohort Quiz Avg:</strong> ${d.avgQuizScore}%</div>
        <div style="margin-top:6px;"><strong>Students Needing Support (&lt;60% Quiz or &lt;3 Lessons):</strong> ${d.needSupport.length ? d.needSupport.map((s) => `${escapeHtml(s.name)} (${s.quizAvg}%)`).join(', ') : 'None'}</div>
      `;
    } catch (e) {
      box.textContent = `Error: ${e.message}`;
    }
  }

  // Real-time learning time tracker (1s interval)
  setInterval(() => {
    if (document.hidden) return;
    if (currentActiveTabId === 'tabAcademy') studentState.timeBySection.academy = (studentState.timeBySection.academy || 0) + 1;
    else if (currentActiveTabId === 'tabCrypto' || currentActiveTabId === 'tabSimulator' || currentActiveTabId === 'tabChallenges') studentState.timeBySection.lab = (studentState.timeBySection.lab || 0) + 1;
    else if (currentActiveTabId === 'tabQuiz') studentState.timeBySection.quiz = (studentState.timeBySection.quiz || 0) + 1;
    else if (currentActiveTabId === 'tabSecurity') studentState.timeBySection.playground = (studentState.timeBySection.playground || 0) + 1;
    else return;
    saveStudentProgress();
  }, 1000);

  // ============================================================================
  // V3.0 FEATURE UPGRADE HANDLERS (DASHBOARD CHARTS, LIVE CERT, SEC AUDIT)
  // ============================================================================
  const stuDashCharts = { activity: null, skill: null };
  let lastLiveCertInspection = null;

  function renderStudentDashboardCharts() {
    if (typeof Chart === 'undefined') return;
    const allLessons = getAllAcademyLessons();
    const nextLes = allLessons.find((l) => !studentState.completedLessons.includes(l.id)) || allLessons[0];
    const pill = document.getElementById('stuRecNextPill');
    const recTitle = document.getElementById('stuRecNextTitle');
    const recDesc = document.getElementById('stuRecNextDesc');
    const recBtn = document.getElementById('btnStuRecOpen');
    if (pill && nextLes) pill.textContent = `${nextLes.diff} • ${nextLes.time}`;
    if (recTitle && nextLes) recTitle.textContent = nextLes.title;
    if (recDesc && nextLes) recDesc.textContent = nextLes.objectives?.[0] || 'Continue your structured cybersecurity curriculum.';
    if (recBtn && nextLes) {
      recBtn.onclick = () => {
        navigateToSection('tabAcademy');
        if (typeof selectAcademyLesson === 'function') selectAcademyLesson(nextLes.id);
      };
    }

    const actCanvas = document.getElementById('stuActivityChart');
    if (actCanvas) {
      const days = Number(document.getElementById('stuChartRangeSelect')?.value || 7);
      const labels = [];
      const counts = [];
      const today = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        labels.push(k.slice(5));
        counts.push((studentState.dailyActivityMap || {})[k] || 0);
      }
      if (stuDashCharts.activity) stuDashCharts.activity.destroy();
      stuDashCharts.activity = new Chart(actCanvas.getContext('2d'), {
        type: 'bar',
        data: { labels, datasets: [{ label: `Activities (${days}d)`, data: counts, backgroundColor: '#FF6685', borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { color: '#D1B8C2' } }, x: { ticks: { color: '#D1B8C2' } } }, plugins: { legend: { labels: { color: '#D1B8C2' } } } }
      });
    }

    const skCanvas = document.getElementById('stuSkillChart');
    if (skCanvas && Array.isArray(ACADEMY_MODULES)) {
      const modPct = (id) => {
        const m = ACADEMY_MODULES.find((x) => x.id === id);
        return m ? Math.round((m.lessons.filter((l) => studentState.completedLessons.includes(l.id)).length / m.lessons.length) * 100) : 0;
      };
      const radarVals = [
        modPct('mod_netsec'),
        modPct('mod_crypto'),
        modPct('mod_tls'),
        modPct('mod_certs'),
        studentState.completedLabs.includes('sha256') ? 75 : 0,
        modPct('mod_https')
      ];
      if (stuDashCharts.skill) stuDashCharts.skill.destroy();
      stuDashCharts.skill = new Chart(skCanvas.getContext('2d'), {
        type: 'radar',
        data: {
          labels: ['Network Security', 'Cryptography', 'TLS & SSL', 'Digital Certs', 'Linux / Hashing', 'Web Security'],
          datasets: [{ label: 'Skill Level %', data: radarVals, borderColor: '#FF6685', backgroundColor: 'rgba(255,102,133,0.22)', pointBackgroundColor: '#FF8EAA' }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { r: { min: 0, max: 100, ticks: { display: false }, pointLabels: { color: '#D1B8C2', font: { size: 10 } } } }, plugins: { legend: { labels: { color: '#D1B8C2' } } } }
      });
    }
  }

  async function inspectLiveDomainCertificate() {
    const host = (document.getElementById('certLiveHostInput')?.value || '').trim();
    const badge = document.getElementById('certLiveStatusBadge');
    if (!host) {
      if (badge) { badge.textContent = 'Enter hostname (e.g. example.com)'; badge.className = 'badge badge-fail'; }
      return;
    }
    if (badge) { badge.textContent = `Inspecting ${host}:443...`; badge.className = 'badge badge-info'; }
    try {
      const r = await fetch('/api/tls-monitor/probe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port: 443, version: 'auto' })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Probe failed');
      lastLiveCertInspection = d.result;
      const c = d.result.cert || {};
      if (badge) {
        badge.textContent = `${d.result.protocol} • ${c.subject || host} • ${c.authorized ? 'Trusted CA' : 'Untrusted/Expired'}`;
        badge.className = `badge ${c.authorized && !c.isExpired ? 'badge-pass' : 'badge-fail'}`;
      }
      playCyberTone(c.authorized ? 'success' : 'error');
    } catch (e) {
      if (badge) { badge.textContent = e.message; badge.className = 'badge badge-fail'; }
      playCyberTone('error');
    }
  }

  function downloadCertificateInspectionReport() {
    const scenario = document.getElementById('certScenarioSelect')?.value || 'valid';
    const lines = [
      'TLS SECURITY LAB V3.0 — X.509 CERTIFICATE INSPECTION REPORT',
      `Generated: ${new Date().toISOString()}`,
      `Selected Scenario: ${scenario}`,
      lastLiveCertInspection
        ? `Live Probe: ${lastLiveCertInspection.host} | Protocol: ${lastLiveCertInspection.protocol} | Cipher: ${lastLiveCertInspection.cipher} | Authorized: ${lastLiveCertInspection.cert?.authorized} | Issuer: ${lastLiveCertInspection.cert?.issuer} | Valid To: ${lastLiveCertInspection.cert?.validTo}`
        : 'Live Probe: None executed in this session (Simulated scenario inspected).'
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificate_Inspection_${getTodayKey()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function runSecurityAuditFindings() {
    const box = document.getElementById('secFindingsList');
    if (!box) return;
    const scenario = document.getElementById('certScenarioSelect')?.value || 'valid';
    const findings = [];
    if (scenario === 'expired') findings.push({ sev: 'CRITICAL', title: 'Expired X.509 Certificate', desc: 'Certificate validity period has expired.', rem: 'Renew certificate via trusted CA / ACME automation.' });
    if (scenario === 'fake_ca') findings.push({ sev: 'HIGH', title: 'Untrusted / Self-Signed Root CA', desc: 'Certificate chain does not terminate at a trusted Root CA.', rem: 'Deploy CA-signed certificate with full intermediate chain.' });
    if (scenario === 'mismatch') findings.push({ sev: 'HIGH', title: 'Hostname / SAN Mismatch', desc: 'Requested domain does not match Subject Alternative Name.', rem: 'Reissue certificate with matching SAN DNS entries.' });
    if (lastLiveCertInspection && !lastLiveCertInspection.cert?.authorized) {
      findings.push({ sev: 'HIGH', title: `Live Probe Trust Failure (${lastLiveCertInspection.host})`, desc: lastLiveCertInspection.cert?.authError || 'Verification failed.', rem: 'Fix certificate chain or expiry on target server.' });
    }
    if (!analyticsState.handshakeCompleted) {
      findings.push({ sev: 'MEDIUM', title: 'TLS 1.3 Handshake Not Yet Verified', desc: 'Handshake simulator has not reached Step 5 in this session.', rem: 'Run TLS Handshake Simulator to verify 1-RTT AEAD setup.' });
    }
    if (!analyticsState.aesVerified) {
      findings.push({ sev: 'LOW', title: 'AES-GCM Experiment Pending', desc: 'AEAD encryption not yet tested in Cryptography Lab.', rem: 'Test AES-256-GCM with 96-bit CSPRNG IV.' });
    }
    findings.push({ sev: 'INFO', title: 'Assessment Scope Notice', desc: 'Automated checks cover only tested parameters and never guarantee complete security.', rem: 'Perform full server-side TLS & infrastructure audits for production.' });

    const sevClass = (s) => (s === 'CRITICAL' || s === 'HIGH') ? 'badge-fail' : s === 'MEDIUM' ? 'badge-warn' : 'badge-info';
    box.innerHTML = findings.map((f) => `
      <div style="padding:10px; border-radius:8px; background:rgba(41,18,31,0.85); border:1px solid rgba(120,51,79,0.55);">
        <div style="display:flex; justify-content:space-between; gap:8px; margin-bottom:4px;">
          <strong>${escapeHtml(f.title)}</strong>
          <span class="badge ${sevClass(f.sev)}">${escapeHtml(f.sev)}</span>
        </div>
        <div style="color:var(--text-secondary);">${escapeHtml(f.desc)}</div>
        <div style="color:#4ade80; font-size:0.78rem; margin-top:4px;">Remediation: ${escapeHtml(f.rem)}</div>
      </div>
    `).join('');
  }

  function downloadSecurityFindingsReport() {
    runSecurityAuditFindings();
    const text = document.getElementById('secFindingsList')?.innerText || 'No findings';
    const blob = new Blob([`TLS SECURITY LAB V3.0 — SECURITY ANALYZER REPORT\n${new Date().toISOString()}\n\n${text}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TLS_Security_Audit_${getTodayKey()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ============================================================================
  // INITIALIZE APPLICATION
  // INITIALIZE APPLICATION (WITH GLOBAL ERROR BOUNDARY & LAZY CHART DEFERRAL)
  // ============================================================================
  window.addEventListener('unhandledrejection', (e) => {
    if (e && e.reason) console.warn('Handled async rejection:', e.reason.message || e.reason);
  });

  applyAppearanceSettings();
  initEvents();
  renderOverviewStep(1);
  updateCertScenario();
  selectAttackTab('mitm');
  runWebCryptoEcdhDemo(); // Warm up Web Crypto ECDH
  computeSha256Compare();
  isWarmupPhase = false;
  renderAcademy();
  renderQuiz();
  renderChallenges();
  renderStudentDashboard();
  renderProgressSystem();
  renderReportsSystem();
  renderProfileSystem();
  renderAiAdvisorSystem();
  loadPublicFacultyContent();
  renderAdminPortalSystem();
  renderTlsMonitorSystem();
  renderCareerCenter();
  applyLanguageSettings();
  renderGlossarySystem();
  initPwaAndOfflineSync();
  renderAdvancedAnalytics();

  // Defer secondary & chart-heavy initializers after first paint
  setTimeout(() => {
    renderStudentDashboardCharts();
    runSecurityAuditFindings();
    renderProgressSystem();
    renderAiAdvisorSystem();
    loadPublicFacultyContent();
    renderAdminPortalSystem();
    renderTlsMonitorSystem();
    renderCareerCenter();
    renderGlossarySystem();
    renderAdvancedAnalytics();
  }, 60);
})();
