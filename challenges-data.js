/**
 * TLS SECURITY LAB V3.0 - Practical Cybersecurity Challenge Center
 * 16 Hands-on Challenges across 8 Categories & 3 Difficulty Levels
 */
window.CHALLENGES_BANK = [
  // 1. TLS CHALLENGES
  {
    id: 'chal_tls_version',
    cat: 'tls', catLabel: 'TLS Challenges',
    title: 'Identify the Modern 1-RTT TLS Version',
    diff: 'Beginner', time: '5 min', basePoints: 100, relatedTab: 'tabSimulator',
    desc: 'Analyze TLS protocol versions and identify the RFC 8446 standard that introduced 1-RTT handshakes and encrypted certificates.',
    objectives: ['Distinguish TLS 1.2 from TLS 1.3.', 'Identify the modern IETF standard for HTTPS.'],
    instructions: ['Review the Handshake Simulator or Learning Academy Module 1.', 'Enter the exact protocol version (e.g. TLS 1.X) that mandates Forward Secrecy and 1-RTT handshakes.'],
    inputLabel: 'Enter Protocol Version:', inputPlaceholder: 'e.g. TLS 1.3',
    outputLabel: 'Validation Output:',
    validator: { type: 'text', accepted: ['tls 1.3', 'tls1.3', '1.3'] },
    hints: [
      'Hint 1: It was standardized in RFC 8446 in 2018.',
      'Hint 2: It replaced TLS 1.2 and removed static RSA key exchange.',
      'Explanation: TLS 1.3 (RFC 8446) sends ECDHE key_share inside ClientHello to achieve 1-RTT.',
      'Solution: TLS 1.3'
    ],
    correctAnswerDisplay: 'TLS 1.3',
    explanation: 'TLS 1.3 (RFC 8446) is the modern standard supporting 1-RTT handshakes, 0-RTT resumption, and mandatory Forward Secrecy.',
    recommendation: 'Review Module 1: TLS 1.2 vs TLS 1.3 in Learning Academy.'
  },
  {
    id: 'chal_tls_handshake_live',
    cat: 'tls', catLabel: 'TLS Challenges',
    title: 'Execute a Complete TLS 1.3 Handshake',
    diff: 'Intermediate', time: '8 min', basePoints: 200, relatedTab: 'tabSimulator',
    desc: 'Run the interactive TLS Handshake Simulator from ClientHello all the way to Step 5 (Encrypted HTTPS Tunnel).',
    objectives: ['Trace all 5 stages of the TLS handshake.', 'Verify the transition from http:// to https://.'],
    instructions: ['Click "Open Related Lab" to go to Handshake Simulator.', 'Step through Steps 1 to 5 until "Secure Connection Established" appears.', 'Return here and enter "CONFIRMED" (or click Submit Answer directly).'],
    inputLabel: 'Optional Confirmation Note:', inputPlaceholder: 'Type CONFIRMED after completing Step 5',
    outputLabel: 'Handshake State Check:',
    validator: { type: 'live_handshake' },
    hints: [
      'Hint 1: Open the Handshake Simulator from the left sidebar or the button below.',
      'Hint 2: Click Next Step until you reach Step 5: Secure Communication.',
      'Explanation: Completing Step 5 verifies ClientHello, ServerHello, Certificate, ECDHE Key Establishment, and AES-256-GCM tunnel activation.',
      'Solution: Complete Step 5 in Handshake Simulator, then click Submit Answer.'
    ],
    correctAnswerDisplay: 'Step 5 Completed (Secure Connection Established)',
    explanation: 'A full TLS 1.3 handshake establishes server identity via X.509 and derives symmetric AEAD keys via ECDHE.',
    recommendation: 'Try Detailed TLS 1.3 (8 Messages) mode in Handshake Simulator.'
  },

  // 2. CRYPTOGRAPHY CHALLENGES
  {
    id: 'chal_crypto_aes_live',
    cat: 'crypto', catLabel: 'Cryptography Challenges',
    title: 'Perform Real AES-GCM Authenticated Encryption',
    diff: 'Beginner', time: '6 min', basePoints: 100, relatedTab: 'tabCrypto',
    desc: 'Use the native Web Crypto API in the Practical Crypto Lab to encrypt a secret message with AES-GCM and generate a 128-bit authentication tag.',
    objectives: ['Generate a CSPRNG AES-GCM key and 96-bit IV.', 'Observe separate ciphertext and authentication tag outputs.'],
    instructions: ['Open Practical Crypto Lab -> Module 1: AES-GCM.', 'Click "Encrypt" on any secret message.', 'Return here and click Submit Answer to validate.'],
    inputLabel: 'Lab Verification Note (Optional):', inputPlaceholder: 'Leave blank or enter AES-GCM',
    outputLabel: 'Web Crypto AES-GCM Status:',
    validator: { type: 'live_aes' },
    hints: [
      'Hint 1: Navigate to Practical Crypto Lab in the sidebar.',
      'Hint 2: Click the pink "Encrypt" button in the AES-GCM card.',
      'Explanation: Web Crypto generates a random key, 96-bit IV, ciphertext, and 128-bit GCM tag.',
      'Solution: Execute AES-GCM encryption in Practical Crypto Lab, then submit.'
    ],
    correctAnswerDisplay: 'AES-GCM Encryption Executed via Web Crypto API',
    explanation: 'AES-GCM is an AEAD cipher providing both confidentiality and integrity protection in TLS 1.3.',
    recommendation: 'Test decrypting the ciphertext in Practical Crypto Lab.'
  },
  {
    id: 'chal_crypto_cipher_decode',
    cat: 'crypto', catLabel: 'Cryptography Challenges',
    title: 'Decode a TLS 1.3 Cipher Suite String',
    diff: 'Intermediate', time: '7 min', basePoints: 200, relatedTab: 'tabAcademy',
    desc: 'Identify the symmetric AEAD encryption algorithm inside the cipher suite "TLS_CHACHA20_POLY1305_SHA256".',
    objectives: ['Parse TLS 1.3 cipher suite naming.', 'Distinguish the AEAD cipher from the HKDF hash algorithm.'],
    instructions: ['Inspect the string: TLS_CHACHA20_POLY1305_SHA256.', 'Enter the AEAD cipher name (without TLS_ or _SHA256).'],
    inputLabel: 'AEAD Cipher Name:', inputPlaceholder: 'e.g. CHACHA20_POLY1305',
    outputLabel: 'Cipher Audit:',
    validator: { type: 'text', accepted: ['chacha20_poly1305', 'chacha20-poly1305', 'chacha20 poly1305'] },
    hints: [
      'Hint 1: SHA256 at the end is the HKDF hash, not the encryption cipher.',
      'Hint 2: It combines the ChaCha20 stream cipher with the Poly1305 MAC.',
      'Explanation: TLS 1.3 cipher suites specify [AEAD Cipher]_[HKDF Hash].',
      'Solution: CHACHA20-POLY1305'
    ],
    correctAnswerDisplay: 'CHACHA20-POLY1305',
    explanation: 'ChaCha20-Poly1305 is a fast, constant-time software AEAD cipher ideal for mobile CPUs without AES-NI hardware.',
    recommendation: 'Read Module 5: Cipher Suites in Learning Academy.'
  },

  // 3. HASHING CHALLENGES
  {
    id: 'chal_hash_sha256_real',
    cat: 'hash', catLabel: 'Hashing Challenges',
    title: 'Compute the Exact SHA-256 Digest of "TLS1.3"',
    diff: 'Beginner', time: '6 min', basePoints: 100, relatedTab: 'tabCrypto',
    desc: 'Compute the real 64-character hexadecimal SHA-256 hash of the exact string "TLS1.3" (case-sensitive) using the Web Crypto Hash Generator.',
    objectives: ['Generate a real SHA-256 digest.', 'Verify deterministic 256-bit hash output.'],
    instructions: ['Open Practical Crypto Lab -> Hash Generator (SHA-256).', 'Enter "TLS1.3" into Input A and copy Digest A.', 'Paste the 64-character hex digest below and click Submit Answer.'],
    inputLabel: 'SHA-256 Hex Digest of "TLS1.3":', inputPlaceholder: 'Paste 64-char hex digest...',
    outputLabel: 'Real-Time Web Crypto Comparison:',
    validator: { type: 'sha256_exact', sourceText: 'TLS1.3' },
    hints: [
      'Hint 1: Make sure SHA-256 (not SHA-384 or SHA-512) is selected in Hash Generator.',
      'Hint 2: Type TLS1.3 with no extra spaces, then click Copy next to Digest A.',
      'Explanation: Your input is compared directly against window.crypto.subtle.digest("SHA-256", "TLS1.3").',
      'Solution: Use Hash Generator on "TLS1.3" and paste the 64-char hex output.'
    ],
    correctAnswerDisplay: 'Exact 64-char SHA-256 digest of "TLS1.3"',
    explanation: 'SHA-256 deterministically maps "TLS1.3" to a unique 256-bit digest used in transcript hashing and HKDF.',
    recommendation: 'Try changing "TLS1.3" to "TLS1.2" to observe the Avalanche Effect.'
  },
  {
    id: 'chal_hash_avalanche',
    cat: 'hash', catLabel: 'Hashing Challenges',
    title: 'Analyze the Hash Avalanche Effect',
    diff: 'Intermediate', time: '7 min', basePoints: 200, relatedTab: 'tabCrypto',
    desc: 'Determine the fixed bit length of a SHA-384 digest used in TLS_AES_256_GCM_SHA384.',
    objectives: ['Understand fixed-length hash outputs.', 'Know the bit length of SHA-256, SHA-384, and SHA-512.'],
    instructions: ['Enter the output size in bits (numbers only) of a SHA-384 digest.'],
    inputLabel: 'Output Size (in bits):', inputPlaceholder: 'e.g. 256',
    outputLabel: 'Validation Result:',
    validator: { type: 'text', accepted: ['384', '384 bits'] },
    hints: [
      'Hint 1: Look at the number in the algorithm name "SHA-384".',
      'Hint 2: In hex, it is 96 characters (96 × 4 = 384 bits).',
      'Explanation: SHA-384 always outputs 384 bits (48 bytes).',
      'Solution: 384'
    ],
    correctAnswerDisplay: '384 bits',
    explanation: 'SHA-384 produces a 384-bit digest and is paired with AES-256-GCM in TLS_AES_256_GCM_SHA384.',
    recommendation: 'Test SHA-384 and SHA-512 in the Hash Generator.'
  },

  // 4. RSA CHALLENGES
  {
    id: 'chal_rsa_sig_live',
    cat: 'rsa', catLabel: 'RSA Challenges',
    title: 'Sign & Verify a Transcript with RSA-2048',
    diff: 'Intermediate', time: '8 min', basePoints: 200, relatedTab: 'tabCrypto',
    desc: 'Generate an RSA-2048 signing key pair, sign a handshake transcript, and verify its authenticity using the public key.',
    objectives: ['Perform real RSASSA-PKCS1-v1_5 signing & verification.', 'Understand private-key signing vs public-key verification.'],
    instructions: ['Open Practical Crypto Lab -> Module 5: RSA Digital Signatures.', 'Click "Generate Keys", then "Sign with Private Key", then "Verify with Public Key".', 'Return here and click Submit Answer.'],
    inputLabel: 'Verification Status:', inputPlaceholder: 'Click Submit Answer after verifying in lab',
    outputLabel: 'RSA Signature Check:',
    validator: { type: 'live_rsa' },
    hints: [
      'Hint 1: Go to Practical Crypto Lab and scroll to RSA Digital Signatures.',
      'Hint 2: Make sure you click "Verify with Public Key" and see the green SIGNATURE VALID message.',
      'Explanation: Only the matching public key can verify a signature produced by the private key.',
      'Solution: Run Sign & Verify in Practical Crypto Lab, then submit.'
    ],
    correctAnswerDisplay: 'RSA-2048 Signature Verified',
    explanation: 'RSA digital signatures provide authentication, integrity, and non-repudiation in X.509 certificates and CertificateVerify.',
    recommendation: 'Edit the signed message in the lab and re-verify to see tamper detection!'
  },
  {
    id: 'chal_rsa_math',
    cat: 'rsa', catLabel: 'RSA Challenges',
    title: 'Compute RSA Modulus n = p × q',
    diff: 'Beginner', time: '5 min', basePoints: 100, relatedTab: 'tabAcademy',
    desc: 'In a toy RSA example, given primes p = 11 and q = 13, calculate the public modulus n.',
    objectives: ['Practice the foundational RSA modulus formula.', 'Understand why real RSA uses 2048-bit primes.'],
    instructions: ['Calculate n = p × q for p = 11 and q = 13.', 'Enter the integer value of n below.'],
    inputLabel: 'RSA Modulus n:', inputPlaceholder: 'Enter integer...',
    outputLabel: 'Math Validation:',
    validator: { type: 'text', accepted: ['143'] },
    hints: [
      'Hint 1: Multiply 11 by 13.',
      'Hint 2: 11 × 10 = 110, plus 11 × 3 = 33.',
      'Explanation: n = p × q = 11 × 13 = 143.',
      'Solution: 143'
    ],
    correctAnswerDisplay: '143',
    explanation: 'RSA security depends on the difficulty of factoring n back into primes p and q when n is 2048+ bits long.',
    recommendation: 'Read Module 3: RSA Algorithm in Learning Academy.'
  },

  // 5. ECDH CHALLENGES
  {
    id: 'chal_ecdh_live',
    cat: 'ecdh', catLabel: 'ECDH Challenges',
    title: 'Derive Matching P-256 Shared Secrets (Alice & Bob)',
    diff: 'Intermediate', time: '7 min', basePoints: 200, relatedTab: 'tabCrypto',
    desc: 'Perform a real Elliptic Curve Diffie-Hellman (P-256) key exchange between Alice and Bob and verify both derive identical 256-bit secrets.',
    objectives: ['Execute real ECDH key agreement via Web Crypto API.', 'Confirm shared secret derivation without sending private keys.'],
    instructions: ['Open Practical Crypto Lab -> Module 3: ECDH Key Exchange.', 'Click "Generate & Derive" and confirm "Matched Exactly (256 bits)".', 'Return here and click Submit Answer.'],
    inputLabel: 'Confirmation (Optional):', inputPlaceholder: 'Click Submit Answer after deriving in lab',
    outputLabel: 'ECDH Lab Status:',
    validator: { type: 'live_ecdh' },
    hints: [
      'Hint 1: Open Practical Crypto Lab and click "Generate & Derive" in the ECDH card.',
      'Hint 2: Verify that Alice and Bob derive the identical 256-bit hex secret.',
      'Explanation: Alice computes a·B and Bob computes b·A, arriving at the same curve point.',
      'Solution: Click "Generate & Derive" in Practical Crypto Lab, then submit.'
    ],
    correctAnswerDisplay: 'ECDH P-256 Shared Secret Matched (256 bits)',
    explanation: 'ECDHE provides Forward Secrecy in TLS 1.3 by generating fresh ephemeral curve keys for every session.',
    recommendation: 'Read Module 3: ECDH Key Exchange in Learning Academy.'
  },
  {
    id: 'chal_ecdh_curve',
    cat: 'ecdh', catLabel: 'ECDH Challenges',
    title: 'Identify the Default Modern TLS 1.3 Elliptic Curve',
    diff: 'Advanced', time: '6 min', basePoints: 300, relatedTab: 'tabSimulator',
    desc: 'Name the high-speed modern Montgomery curve (designed by Daniel J. Bernstein) most commonly sent as the default key_share in TLS 1.3 ClientHello.',
    objectives: ['Recognize modern elliptic curves used in TLS 1.3.', 'Distinguish Curve25519 / X25519 from legacy curves.'],
    instructions: ['Enter the curve name (e.g. X25519 or Curve25519).'],
    inputLabel: 'Curve Name:', inputPlaceholder: 'e.g. X25519',
    outputLabel: 'Curve Check:',
    validator: { type: 'text', accepted: ['x25519', 'curve25519'] },
    hints: [
      'Hint 1: Look at the ECDHE Key Share field on the Client card in Handshake Simulator.',
      'Hint 2: Its name includes the prime 2^255 - 19.',
      'Explanation: X25519 (Curve25519) offers ~128-bit security with fast constant-time arithmetic.',
      'Solution: X25519 (or Curve25519)'
    ],
    correctAnswerDisplay: 'X25519 / Curve25519',
    explanation: 'X25519 is the preferred ECDHE group in TLS 1.3 due to speed and resistance to side-channel timing attacks.',
    recommendation: 'Inspect the key_share extension in Detailed TLS 1.3 mode.'
  },

  // 6. DIGITAL CERTIFICATE CHALLENGES
  {
    id: 'chal_cert_fraud',
    cat: 'cert', catLabel: 'Digital Certificate Challenges',
    title: 'Detect an Invalid or Fraudulent X.509 Certificate',
    diff: 'Beginner', time: '6 min', basePoints: 100, relatedTab: 'tabCertificate',
    desc: 'Use the Certificate Inspector to test an Expired, Untrusted CA, or Domain Mismatch certificate and observe PKI rejection.',
    objectives: ['Identify why browsers reject invalid certificates.', 'Test X.509 trust chain failure modes.'],
    instructions: ['Open Certificate Inspector.', 'Select Scenario 2, 3, or 4 and click "Verify Certificate".', 'Return here and click Submit Answer.'],
    inputLabel: 'Optional Note:', inputPlaceholder: 'Click Submit Answer after testing invalid cert',
    outputLabel: 'Certificate Inspector Check:',
    validator: { type: 'live_cert_invalid' },
    hints: [
      'Hint 1: Go to Certificate Inspector in the left sidebar.',
      'Hint 2: Choose Scenario 2 (Expired), 3 (Fake CA), or 4 (Mismatch) and click Verify Certificate.',
      'Explanation: Browsers reject certificates that fail expiry, CA trust, or SAN hostname checks.',
      'Solution: Verify any invalid scenario in Certificate Inspector, then submit.'
    ],
    correctAnswerDisplay: 'Invalid Certificate Detected & Rejected',
    explanation: 'PKI validation protects users from expired credentials, rogue CAs, and phishing domain mismatches.',
    recommendation: 'Read Module 4: Certificate Validation in Learning Academy.'
  },
  {
    id: 'chal_cert_san',
    cat: 'cert', catLabel: 'Digital Certificate Challenges',
    title: 'Identify the Hostname-Matching X.509 Extension',
    diff: 'Intermediate', time: '6 min', basePoints: 200, relatedTab: 'tabCertificate',
    desc: 'Which X.509 v3 extension (3-letter acronym) do modern browsers check to verify that a certificate matches the visited domain?',
    objectives: ['Understand X.509 v3 extensions.', 'Know why SAN replaced Common Name (CN).'],
    instructions: ['Enter the 3-letter acronym (or full name) of the extension.'],
    inputLabel: 'X.509 Extension:', inputPlaceholder: 'e.g. SAN',
    outputLabel: 'Extension Check:',
    validator: { type: 'text', accepted: ['san', 'subject alternative name', 'subject alternative names'] },
    hints: [
      'Hint 1: Look at the second field in Certificate Inspector.',
      'Hint 2: It stands for Subject Alternative Name.',
      'Explanation: Modern browsers require domain names to appear in the SAN extension.',
      'Solution: SAN (Subject Alternative Name)'
    ],
    correctAnswerDisplay: 'SAN (Subject Alternative Name)',
    explanation: 'SAN allows one certificate to securely list multiple DNS hostnames and wildcards (e.g., *.secure-bank.edu).',
    recommendation: 'Read Module 4: X.509 Certificates in Learning Academy.'
  },

  // 7. NETWORK SECURITY CHALLENGES
  {
    id: 'chal_net_hsts',
    cat: 'netsec', catLabel: 'Network Security Challenges',
    title: 'Defend Against SSL Stripping Downgrades',
    diff: 'Intermediate', time: '7 min', basePoints: 200, relatedTab: 'tabAcademy',
    desc: 'Identify the HTTP security response header (4-letter acronym) that forces browsers to connect strictly over HTTPS.',
    objectives: ['Understand SSL stripping attacks.', 'Identify how HSTS enforces HTTPS-only connections.'],
    instructions: ['Enter the 4-letter acronym (or full header name) that prevents HTTP downgrades.'],
    inputLabel: 'Security Header / Acronym:', inputPlaceholder: 'e.g. HSTS',
    outputLabel: 'Header Audit:',
    validator: { type: 'text', accepted: ['hsts', 'strict-transport-security', 'http strict transport security'] },
    hints: [
      'Hint 1: It stands for HTTP Strict Transport Security.',
      'Hint 2: The header name is Strict-Transport-Security.',
      'Explanation: HSTS caches a policy in the browser forbidding plaintext HTTP.',
      'Solution: HSTS (Strict-Transport-Security)'
    ],
    correctAnswerDisplay: 'HSTS (Strict-Transport-Security)',
    explanation: 'HSTS prevents active attackers from stripping HTTPS links down to plaintext HTTP on first-hop networks.',
    recommendation: 'Read Module 2: Network Protection Mechanisms in Learning Academy.'
  },
  {
    id: 'chal_net_mtls',
    cat: 'netsec', catLabel: 'Network Security Challenges',
    title: 'Zero Trust Mutual Authentication',
    diff: 'Advanced', time: '8 min', basePoints: 300, relatedTab: 'tabAcademy',
    desc: 'What is the 4-letter term for TLS connections where BOTH the server AND the client present X.509 certificates?',
    objectives: ['Distinguish one-way HTTPS from mutual authentication.', 'Understand Zero Trust API security.'],
    instructions: ['Enter the 4-letter abbreviation (e.g. mTLS).'],
    inputLabel: 'Authentication Mode:', inputPlaceholder: 'e.g. mTLS',
    outputLabel: 'Architecture Check:',
    validator: { type: 'text', accepted: ['mtls', 'mutual tls'] },
    hints: [
      'Hint 1: The "m" stands for Mutual.',
      'Hint 2: Used heavily in microservices and Zero Trust APIs.',
      'Explanation: Mutual TLS (mTLS) adds client certificate authentication via CertificateRequest.',
      'Solution: mTLS (Mutual TLS)'
    ],
    correctAnswerDisplay: 'mTLS (Mutual TLS)',
    explanation: 'mTLS ensures cryptographic identity verification for both communicating endpoints.',
    recommendation: 'Read Module 5: Authentication in Learning Academy.'
  },

  // 8. ATTACK DETECTION CHALLENGES
  {
    id: 'chal_atk_shield_live',
    cat: 'attack', catLabel: 'Attack Detection Challenges',
    title: 'Trigger & Verify TLS Defense in Attack Playground',
    diff: 'Beginner', time: '6 min', basePoints: 100, relatedTab: 'tabSecurity',
    desc: 'Simulate a network attack in the Attack Playground and verify the TLS cryptographic defense shield blocks it.',
    objectives: ['Observe how TLS neutralizes active network attacks.', 'Inspect Before vs After security states.'],
    instructions: ['Open Attack Playground.', 'Click "Start Simulation" on any attack module and wait for "TLS DEFENSE ACTIVE".', 'Return here and click Submit Answer.'],
    inputLabel: 'Optional Note:', inputPlaceholder: 'Click Submit Answer after running simulation',
    outputLabel: 'Threat Shield Check:',
    validator: { type: 'live_shield' },
    hints: [
      'Hint 1: Open Attack Playground in the left sidebar.',
      'Hint 2: Click "Start Simulation" and let all 3 steps complete.',
      'Explanation: Running the simulation verifies how TLS stops MITM, Replay, Eavesdropping, Tampering, Spoofing, or Downgrade attacks.',
      'Solution: Run any simulation in Attack Playground, then submit.'
    ],
    correctAnswerDisplay: 'TLS Defense Shield Verified',
    explanation: 'Active simulation demonstrates how X.509, AEAD tags, nonces, and sentinels neutralize network threats.',
    recommendation: 'Explore all 6 modules in Attack Playground.'
  },
  {
    id: 'chal_atk_downgrade',
    cat: 'attack', catLabel: 'Attack Detection Challenges',
    title: 'Spot the TLS 1.3 Downgrade Protection Field',
    diff: 'Advanced', time: '8 min', basePoints: 300, relatedTab: 'tabSecurity',
    desc: 'In RFC 8446, which ServerHello field carries the special magic sentinel bytes that allow a TLS 1.3 client to detect a forced downgrade to TLS 1.2?',
    objectives: ['Understand RFC 8446 downgrade protection.', 'Analyze ServerHello fields.'],
    instructions: ['Enter the ServerHello field name (e.g. Random or ServerHello.Random).'],
    inputLabel: 'ServerHello Field:', inputPlaceholder: 'e.g. ServerHello.Random',
    outputLabel: 'Protocol Audit:',
    validator: { type: 'text', accepted: ['random', 'serverhello.random', 'server random', 'serverhello random'] },
    hints: [
      'Hint 1: It is the 32-byte nonce field in ServerHello.',
      'Hint 2: The last 8 bytes of this field are set to a fixed sentinel value on downgrades.',
      'Explanation: Because the handshake transcript (including ServerHello.Random) is signed in CertificateVerify and Finished, attackers cannot alter it undetected.',
      'Solution: ServerHello.Random (or Random)'
    ],
    correctAnswerDisplay: 'ServerHello.Random',
    explanation: 'The downgrade sentinel in ServerHello.Random prevents active attackers from silently forcing TLS 1.3 peers down to weaker versions.',
    recommendation: 'Try Simulation 6: TLS Downgrade in Attack Playground.'
  }
];
