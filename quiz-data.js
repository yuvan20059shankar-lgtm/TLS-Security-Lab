/**
 * TLS SECURITY LAB V3.0 - Cybersecurity Quiz Center Question Bank
 * 50 Authentic B.Tech CSE MCQs across 6 Categories & 3 Difficulty Levels
 */
window.QUIZ_BANK = [
  // 1. TLS FUNDAMENTALS (9 Questions)
  {
    id: 'tls1', cat: 'tls', catLabel: 'TLS Fundamentals', diff: 'Easy',
    q: 'Which transport-layer protocol does standard TLS operate over?',
    opts: ['UDP', 'TCP', 'ICMP', 'ARP'],
    ans: 1,
    concept: 'Transport Layer Security Architecture',
    exp: 'Standard TLS requires a reliable, ordered byte stream, which is provided by TCP (typically on port 443 for HTTPS). DTLS is used for UDP.'
  },
  {
    id: 'tls2', cat: 'tls', catLabel: 'TLS Fundamentals', diff: 'Easy',
    q: 'How many round-trip times (RTT) does a standard TLS 1.3 handshake require?',
    opts: ['0 RTT always', '1 RTT', '2 RTT', '3 RTT'],
    ans: 1,
    concept: 'TLS 1.3 Latency Optimization',
    exp: 'TLS 1.3 reduces the standard handshake from 2 RTT (TLS 1.2) to 1 RTT by sending the client’s ECDHE key_share inside ClientHello.'
  },
  {
    id: 'tls3', cat: 'tls', catLabel: 'TLS Fundamentals', diff: 'Easy',
    q: 'Which RFC formally specifies TLS 1.3?',
    opts: ['RFC 5246', 'RFC 8446', 'RFC 2616', 'RFC 1918'],
    ans: 1,
    concept: 'IETF TLS Standardization',
    exp: 'RFC 8446 (published in August 2018) defines TLS 1.3, whereas RFC 5246 defined TLS 1.2.'
  },
  {
    id: 'tls4', cat: 'tls', catLabel: 'TLS Fundamentals', diff: 'Medium',
    q: 'Which message in TLS 1.3 proves the server possesses the private key matching its certificate?',
    opts: ['ServerHello', 'EncryptedExtensions', 'CertificateVerify', 'ChangeCipherSpec'],
    ans: 2,
    concept: 'Asymmetric Server Authentication',
    exp: 'CertificateVerify contains a digital signature over the handshake transcript hash, signed using the server’s private key.'
  },
  {
    id: 'tls5', cat: 'tls', catLabel: 'TLS Fundamentals', diff: 'Medium',
    q: 'Which legacy protocol versions were formally deprecated by RFC 8996?',
    opts: ['TLS 1.2 and TLS 1.3', 'TLS 1.0 and TLS 1.1', 'SSHv2 and IPsec', 'HTTP/2 and HTTP/3'],
    ans: 1,
    concept: 'Protocol Deprecation & Downgrade Defense',
    exp: 'RFC 8996 formally deprecated TLS 1.0 and TLS 1.1 due to weak cipher dependencies and vulnerability to attacks like BEAST and POODLE.'
  },
  {
    id: 'tls6', cat: 'tls', catLabel: 'TLS Fundamentals', diff: 'Medium',
    q: 'What is the purpose of the Finished message at the end of a TLS handshake?',
    opts: ['To close the TCP socket', 'To verify the integrity of the entire handshake transcript via HMAC', 'To transmit the Root CA certificate', 'To compress HTTP headers'],
    ans: 1,
    concept: 'Handshake Transcript Integrity',
    exp: 'The Finished message carries an HMAC over all previous handshake messages, ensuring no attacker tampered with or downgraded parameters.'
  },
  {
    id: 'tls7', cat: 'tls', catLabel: 'TLS Fundamentals', diff: 'Hard',
    q: 'In TLS 1.3, which messages are transmitted in plaintext on the wire?',
    opts: ['ClientHello and ServerHello only', 'Certificate and CertificateVerify', 'EncryptedExtensions and Finished', 'Application Data'],
    ans: 0,
    concept: 'Handshake Encryption in TLS 1.3',
    exp: 'In TLS 1.3, everything after ServerHello (EncryptedExtensions, Certificate, CertificateVerify, Finished) is encrypted using handshake traffic keys.'
  },
  {
    id: 'tls8', cat: 'tls', catLabel: 'TLS Fundamentals', diff: 'Hard',
    q: 'Why does TLS 1.3 include a 32-byte random nonce in both ClientHello and ServerHello?',
    opts: ['To serve as the TCP port number', 'To ensure key freshness and prevent replay attacks', 'To replace X.509 certificates', 'To identify the browser vendor'],
    ans: 1,
    concept: 'Cryptographic Freshness & Anti-Replay',
    exp: 'Fresh 32-byte random values ensure every handshake produces unique session keys and defeat replay attacks.'
  },
  {
    id: 'tls9', cat: 'tls', catLabel: 'TLS Fundamentals', diff: 'Hard',
    q: 'What does Perfect Forward Secrecy (PFS) guarantee in TLS 1.3?',
    opts: ['Zero packet loss over Wi-Fi', 'Compromising the server’s long-term private key cannot decrypt past recorded sessions', 'Certificates never expire', 'Servers do not need a CA'],
    ans: 1,
    concept: 'Ephemeral Key Exchange & Forward Secrecy',
    exp: 'Because TLS 1.3 mandates ephemeral ECDHE/DHE keys that are destroyed after the session, past traffic remains safe even if the cert private key leaks.'
  },

  // 2. NETWORK SECURITY (9 Questions)
  {
    id: 'net1', cat: 'netsec', catLabel: 'Network Security', diff: 'Easy',
    q: 'Which three properties form the classic CIA Triad in Network Security?',
    opts: ['Confidentiality, Integrity, Availability', 'Compression, Indexing, Authentication', 'Cookies, IP, ARP'],
    ans: 0,
    concept: 'CIA Triad',
    exp: 'The CIA Triad stands for Confidentiality, Integrity, and Availability—the foundational pillars of information security.'
  },
  {
    id: 'net2', cat: 'netsec', catLabel: 'Network Security', diff: 'Easy',
    q: 'Which type of attack involves passively capturing network packets without altering them?',
    opts: ['Eavesdropping (Packet Sniffing)', 'ARP Cache Poisoning Injection', 'SYN Flood DoS', 'SQL Injection'],
    ans: 0,
    concept: 'Passive vs Active Attacks',
    exp: 'Eavesdropping is a passive attack where an attacker observes unencrypted traffic (e.g., via Wireshark in promiscuous mode).'
  },
  {
    id: 'net3', cat: 'netsec', catLabel: 'Network Security', diff: 'Easy',
    q: 'In the OSI model, which layer is responsible for end-to-end reliable delivery (TCP)?',
    opts: ['Layer 2 (Data Link)', 'Layer 3 (Network)', 'Layer 4 (Transport)', 'Layer 7 (Application)'],
    ans: 2,
    concept: 'OSI Layer Architecture',
    exp: 'Layer 4 (Transport Layer) hosts TCP and UDP. TLS operates directly above Layer 4 to secure Layer 7 protocols.'
  },
  {
    id: 'net4', cat: 'netsec', catLabel: 'Network Security', diff: 'Medium',
    q: 'How does an attacker typically position themselves for a Man-in-the-Middle (MITM) attack on a local LAN?',
    opts: ['ARP Spoofing / Rogue Access Point', 'SHA-256 Hashing', 'Enabling HSTS', 'Using AES-256-GCM'],
    ans: 0,
    concept: 'LAN Interception Vectors',
    exp: 'ARP spoofing tricks the client and gateway into routing traffic through the attacker’s MAC address, enabling MITM interception.'
  },
  {
    id: 'net5', cat: 'netsec', catLabel: 'Network Security', diff: 'Medium',
    q: 'What does a Replay Attack attempt to do?',
    opts: ['Factor the server’s RSA modulus', 'Re-transmit previously captured valid packets to repeat an action', 'Crack SHA-256 offline', 'Overflow the DNS cache'],
    ans: 1,
    concept: 'Replay Attack Mechanics',
    exp: 'In a replay attack, an adversary captures legitimate network messages and resends them later without needing to decrypt them.'
  },
  {
    id: 'net6', cat: 'netsec', catLabel: 'Network Security', diff: 'Medium',
    q: 'Which HTTP response header instructs browsers to never downgrade a site from HTTPS to plaintext HTTP?',
    opts: ['Content-Type', 'Strict-Transport-Security (HSTS)', 'Cache-Control', 'X-Forwarded-For'],
    ans: 1,
    concept: 'SSL Stripping Defense (HSTS)',
    exp: 'HSTS (RFC 6797) forces browsers to communicate exclusively over HTTPS, neutralizing SSL-stripping MITM attacks.'
  },
  {
    id: 'net7', cat: 'netsec', catLabel: 'Network Security', diff: 'Hard',
    q: 'Why does Diffie-Hellman key exchange alone NOT prevent a Man-in-the-Middle attack?',
    opts: ['DH uses symmetric keys', 'Without authentication, an attacker can perform separate DH exchanges with both client and server', 'DH keys are only 8 bits long', 'DH only works over UDP'],
    ans: 1,
    concept: 'Unauthenticated Key Exchange Vulnerability',
    exp: 'Anonymous DH lacks identity verification; TLS binds ECDHE key shares to an X.509 certificate and CertificateVerify signature to stop MITM.'
  },
  {
    id: 'net8', cat: 'netsec', catLabel: 'Network Security', diff: 'Hard',
    q: 'In Zero Trust network architectures, what mechanism is commonly used for service-to-service authentication?',
    opts: ['Telnet', 'Mutual TLS (mTLS)', 'Plaintext API keys in URL', 'Disable firewalls'],
    ans: 1,
    concept: 'Zero Trust & Mutual Authentication',
    exp: 'Zero Trust verifies every connection regardless of network location, typically using mTLS where both client and server present X.509 certificates.'
  },
  {
    id: 'net9', cat: 'netsec', catLabel: 'Network Security', diff: 'Easy',
    q: 'What security principle ensures a sender cannot later deny having sent a signed message?',
    opts: ['Availability', 'Non-Repudiation', 'Load Balancing', 'Fragmentation'],
    ans: 1,
    concept: 'Non-Repudiation',
    exp: 'Digital signatures created with a sender’s private key provide non-repudiation because only that key could produce the valid signature.'
  },

  // 3. CRYPTOGRAPHY (9 Questions)
  {
    id: 'cry1', cat: 'crypto', catLabel: 'Cryptography', diff: 'Easy',
    q: 'What is the output size of a SHA-256 cryptographic hash digest?',
    opts: ['128 bits', '160 bits', '256 bits', '512 bits'],
    ans: 2,
    concept: 'Cryptographic Hash Length',
    exp: 'SHA-256 always produces a fixed 256-bit (32 bytes / 64 hex characters) digest regardless of input length.'
  },
  {
    id: 'cry2', cat: 'crypto', catLabel: 'Cryptography', diff: 'Easy',
    q: 'Which type of encryption uses the exact same secret key for both encryption and decryption?',
    opts: ['Symmetric Encryption', 'Asymmetric Encryption', 'Hashing', 'Base64 Encoding'],
    ans: 0,
    concept: 'Symmetric Cryptography',
    exp: 'Symmetric algorithms like AES and ChaCha20 share one secret key between sender and receiver.'
  },
  {
    id: 'cry3', cat: 'crypto', catLabel: 'Cryptography', diff: 'Easy',
    q: 'According to Kerckhoffs’s principle, what should the security of a cryptosystem depend on?',
    opts: ['Keeping the algorithm secret', 'Keeping the cryptographic key secret', 'Using Base64', 'Hiding the source code'],
    ans: 1,
    concept: 'Kerckhoffs’s Principle',
    exp: 'A cryptosystem must remain secure even if the algorithm is public knowledge, relying solely on the secrecy of the key.'
  },
  {
    id: 'cry4', cat: 'crypto', catLabel: 'Cryptography', diff: 'Medium',
    q: 'How many rounds does AES-256 perform on each 128-bit data block?',
    opts: ['10 rounds', '12 rounds', '14 rounds', '16 rounds'],
    ans: 2,
    concept: 'AES Round Structure',
    exp: 'AES-128 uses 10 rounds, AES-192 uses 12 rounds, and AES-256 uses 14 rounds.'
  },
  {
    id: 'cry5', cat: 'crypto', catLabel: 'Cryptography', diff: 'Medium',
    q: 'What property of a hash function causes ~50% of output bits to flip when 1 input bit changes?',
    opts: ['Collision Resistance', 'Avalanche Effect', 'Padding Oracle', 'Key Stretching'],
    ans: 1,
    concept: 'Avalanche Effect',
    exp: 'The Avalanche Effect ensures similar inputs produce completely uncorrelated hash digests.'
  },
  {
    id: 'cry6', cat: 'crypto', catLabel: 'Cryptography', diff: 'Medium',
    q: 'What hard mathematical problem forms the basis of RSA security?',
    opts: ['Integer Factorization of large semiprimes (n = p × q)', 'Shortest Path in Graphs', 'Discrete Fourier Transform', 'Linear Regression'],
    ans: 0,
    concept: 'RSA Mathematical Foundation',
    exp: 'Multiplying two large primes p and q is trivial, but factoring n = p × q back into p and q is computationally infeasible for 2048+ bit keys.'
  },
  {
    id: 'cry7', cat: 'crypto', catLabel: 'Cryptography', diff: 'Hard',
    q: 'Why is reusing the same (Key, IV/Nonce) pair catastrophic in AES-GCM?',
    opts: ['It slows down CPU cache', 'It leaks XOR of plaintexts and allows forging the GHASH authentication key', 'It doubles ciphertext size', 'It converts AES to DES'],
    ans: 1,
    concept: 'AES-GCM Nonce Reuse Vulnerability',
    exp: 'Because GCM uses Counter (CTR) mode, nonce reuse XORs out the keystream and exposes the GHASH authentication key H.'
  },
  {
    id: 'cry8', cat: 'crypto', catLabel: 'Cryptography', diff: 'Hard',
    q: 'In ECDH over elliptic curve with generator G, if Alice picks private a and Bob picks private b, what is their shared secret?',
    opts: ['a + b + G', '(a · b) · G', 'a / b', 'SHA256(a)'],
    ans: 1,
    concept: 'Elliptic Curve Diffie-Hellman Math',
    exp: 'Alice computes a·(b·G) and Bob computes b·(a·G); both arrive at the identical curve point (a·b)·G.'
  },
  {
    id: 'cry9', cat: 'crypto', catLabel: 'Cryptography', diff: 'Medium',
    q: 'When creating an RSA digital signature, which key does the sender use to sign the message digest?',
    opts: ['Sender’s Private Key', 'Sender’s Public Key', 'Receiver’s Public Key', 'Random AES Key'],
    ans: 0,
    concept: 'Digital Signature Generation',
    exp: 'The sender signs with their Private Key; anyone can verify authenticity using the sender’s Public Key.'
  },

  // 4. DIGITAL CERTIFICATES (8 Questions)
  {
    id: 'pki1', cat: 'pki', catLabel: 'Digital Certificates', diff: 'Easy',
    q: 'What standard format defines TLS digital certificates on the internet?',
    opts: ['JSON-LD', 'X.509 v3', 'XML-RPC', 'YAML'],
    ans: 1,
    concept: 'X.509 Standard',
    exp: 'ITU-T X.509 v3 defines the standard structure for public key certificates used in TLS/HTTPS.'
  },
  {
    id: 'pki2', cat: 'pki', catLabel: 'Digital Certificates', diff: 'Easy',
    q: 'Which organization issues and digitally signs trusted website certificates?',
    opts: ['Certificate Authority (CA)', 'Internet Service Provider (ISP)', 'DHCP Server', 'MAC Vendor'],
    ans: 0,
    concept: 'Certificate Authority Role',
    exp: 'Certificate Authorities (e.g., DigiCert, Let’s Encrypt) verify domain control and sign certificates.'
  },
  {
    id: 'pki3', cat: 'pki', catLabel: 'Digital Certificates', diff: 'Easy',
    q: 'What happens when a browser encounters an expired TLS certificate?',
    opts: ['It silently extends the date', 'It displays a security warning and blocks/halts the connection', 'It converts RSA to AES', 'It ignores the CA'],
    ans: 1,
    concept: 'Certificate Validity Window',
    exp: 'Browsers enforce the Not Before / Not After validity window and warn users if a certificate has expired.'
  },
  {
    id: 'pki4', cat: 'pki', catLabel: 'Digital Certificates', diff: 'Medium',
    q: 'Which X.509 extension do modern browsers inspect to verify the visited domain name?',
    opts: ['Serial Number', 'Subject Alternative Name (SAN)', 'Basic Constraints', 'Authority Key Identifier'],
    ans: 1,
    concept: 'Hostname Verification via SAN',
    exp: 'Modern browsers match the visited hostname against DNS entries inside the Subject Alternative Name (SAN) extension.'
  },
  {
    id: 'pki5', cat: 'pki', catLabel: 'Digital Certificates', diff: 'Medium',
    q: 'Why do CAs use Intermediate CAs to sign website Leaf certificates instead of the Root CA directly?',
    opts: ['To keep the Root CA private key offline in HSMs and limit risk', 'Because Root CAs cannot use RSA', 'To make certificates expire faster', 'To bypass browser trust stores'],
    ans: 0,
    concept: 'PKI Hierarchy & Risk Isolation',
    exp: 'Keeping Root CA keys offline protects the ultimate trust anchor; if an Intermediate CA is compromised, it can be revoked.'
  },
  {
    id: 'pki6', cat: 'pki', catLabel: 'Digital Certificates', diff: 'Medium',
    q: 'Where does your browser obtain the initial Root CA public keys needed to verify trust chains?',
    opts: ['From the website’s HTTP headers', 'From the OS / Browser pre-installed Root Trust Store', 'From DNS A records', 'From TCP SYN packets'],
    ans: 1,
    concept: 'Root Trust Store',
    exp: 'Operating systems and browsers ship with a curated Root Trust Store of vetted Root CA certificates.'
  },
  {
    id: 'pki7', cat: 'pki', catLabel: 'Digital Certificates', diff: 'Hard',
    q: 'Which protocol allows a web server to attach a time-stamped CA revocation status directly inside the TLS handshake?',
    opts: ['OCSP Stapling', 'ARP Inspection', 'BGP Routing', 'SNMPv3'],
    ans: 0,
    concept: 'Certificate Revocation (OCSP Stapling)',
    exp: 'OCSP Stapling lets the server fetch and staple a signed OCSP response from the CA, preserving client privacy and speed.'
  },
  {
    id: 'pki8', cat: 'pki', catLabel: 'Digital Certificates', diff: 'Hard',
    q: 'What problem does Certificate Transparency (CT) solve?',
    opts: ['Compressing X.509 DER bytes', 'Detecting mis-issued or rogue certificates by logging all issued certs publicly', 'Replacing AES with RSA', 'Eliminating DNS'],
    ans: 1,
    concept: 'Certificate Transparency Logs',
    exp: 'CT logs provide an append-only public audit trail so domain owners can spot unauthorized certificates issued by any CA.'
  },

  // 5. HTTPS AND SECURE COMMUNICATION (8 Questions)
  {
    id: 'htp1', cat: 'https', catLabel: 'HTTPS and Secure Communication', diff: 'Easy',
    q: 'What is the default TCP port for HTTPS traffic?',
    opts: ['21', '80', '443', '3306'],
    ans: 2,
    concept: 'HTTPS Standard Port',
    exp: 'HTTPS runs on TCP port 443, whereas plaintext HTTP uses port 80.'
  },
  {
    id: 'htp2', cat: 'https', catLabel: 'HTTPS and Secure Communication', diff: 'Easy',
    q: 'Which parts of an HTTP request are encrypted by HTTPS?',
    opts: ['Only the password field', 'URL path, query string, headers, cookies, and body', 'Only the IP address', 'None of the headers'],
    ans: 1,
    concept: 'HTTPS Payload Confidentiality',
    exp: 'Because HTTP runs inside the TLS tunnel, the entire HTTP message (method, path, query, cookies, headers, body) is encrypted.'
  },
  {
    id: 'htp3', cat: 'https', catLabel: 'HTTPS and Secure Communication', diff: 'Easy',
    q: 'What is "Mixed Content" on an HTTPS website?',
    opts: ['Using both RSA and ECDSA', 'An HTTPS page loading insecure HTTP subresources (scripts/images)', 'Using HTTP/2 and HTTP/3', 'Having two SSL certificates'],
    ans: 1,
    concept: 'Mixed Content Vulnerability',
    exp: 'Loading plaintext HTTP scripts on an HTTPS page allows an active MITM attacker to inject malicious JavaScript.'
  },
  {
    id: 'htp4', cat: 'https', catLabel: 'HTTPS and Secure Communication', diff: 'Medium',
    q: 'Which TLS extension lets the client tell the server which hostname it is connecting to during ClientHello?',
    opts: ['ALPN', 'SNI (Server Name Indication)', 'OCSP', 'HKDF'],
    ans: 1,
    concept: 'Server Name Indication (SNI)',
    exp: 'SNI allows a single IP address hosting multiple domains to select the right certificate before encryption starts.'
  },
  {
    id: 'htp5', cat: 'https', catLabel: 'HTTPS and Secure Communication', diff: 'Medium',
    q: 'Which TLS extension negotiates whether the connection will speak HTTP/1.1 or HTTP/2 (h2)?',
    opts: ['SNI', 'ALPN (Application-Layer Protocol Negotiation)', 'PSK', 'CRL'],
    ans: 1,
    concept: 'Application-Layer Protocol Negotiation',
    exp: 'ALPN avoids an extra round trip by negotiating the application protocol (e.g., h2) inside the TLS handshake.'
  },
  {
    id: 'htp6', cat: 'https', catLabel: 'HTTPS and Secure Communication', diff: 'Medium',
    q: 'In TLS 1.3, what is a cipher suite like TLS_AES_256_GCM_SHA384 specifying?',
    opts: ['Key exchange + Certificate type + Compression', 'AEAD encryption algorithm + HKDF hash algorithm', 'TCP window size', 'DNS TTL'],
    ans: 1,
    concept: 'TLS 1.3 Cipher Suite Simplification',
    exp: 'TLS 1.3 separates key exchange and authentication into extensions; cipher suites only define the AEAD cipher and HKDF hash.'
  },
  {
    id: 'htp7', cat: 'https', catLabel: 'HTTPS and Secure Communication', diff: 'Hard',
    q: 'How does TLS 1.3 construct the unique nonce for each encrypted Application Data record?',
    opts: ['XORing the static traffic IV with the 64-bit record sequence number', 'Sending a 256-bit random string in plaintext', 'Reusing the ClientHello random', 'Using the server IP'],
    ans: 0,
    concept: 'TLS 1.3 Record Nonce Construction',
    exp: 'XORing the base IV with the padded sequence number guarantees nonce uniqueness without extra wire bytes.'
  },
  {
    id: 'htp8', cat: 'https', catLabel: 'HTTPS and Secure Communication', diff: 'Hard',
    q: 'What is the primary security risk of TLS 1.3 0-RTT Early Data?',
    opts: ['0-RTT data is sent in plaintext', '0-RTT data lacks Forward Secrecy and is vulnerable to replay attacks', '0-RTT disables certificates', '0-RTT uses MD5'],
    ans: 1,
    concept: '0-RTT Replay Trade-off',
    exp: 'Because 0-RTT data is sent before the server contributes a fresh random nonce, an attacker can replay 0-RTT requests—so only idempotent operations are safe.'
  },

  // 6. ADVANCED CYBERSECURITY (7 Questions)
  {
    id: 'adv1', cat: 'advanced', catLabel: 'Advanced Cybersecurity', diff: 'Medium',
    q: 'Which Key Derivation Function does TLS 1.3 use to derive Early, Handshake, and Application secrets?',
    opts: ['PBKDF2', 'HKDF (HMAC-based KDF)', 'bcrypt', 'DES-CBC'],
    ans: 1,
    concept: 'TLS 1.3 Key Schedule (HKDF)',
    exp: 'RFC 8446 uses HKDF-Extract and HKDF-Expand-Label to derive cryptographically separated traffic keys.'
  },
  {
    id: 'adv2', cat: 'advanced', catLabel: 'Advanced Cybersecurity', diff: 'Medium',
    q: 'Which padding oracle vulnerability exploited SSL 3.0 CBC mode encryption?',
    opts: ['Heartbleed', 'POODLE', 'Log4Shell', 'Spectre'],
    ans: 1,
    concept: 'Legacy CBC Padding Oracle Attacks',
    exp: 'POODLE (Padding Oracle On Downgraded Legacy Encryption) exploited non-authenticated CBC padding in SSL 3.0.'
  },
  {
    id: 'adv3', cat: 'advanced', catLabel: 'Advanced Cybersecurity', diff: 'Hard',
    q: 'What does Encrypted Client Hello (ECH) aim to protect that traditional TLS 1.3 leaves exposed?',
    opts: ['The IPv4 destination port', 'The SNI hostname and ClientHello metadata', 'The AES-256-GCM tag', 'The server’s MAC address'],
    ans: 1,
    concept: 'Encrypted Client Hello (ECH)',
    exp: 'ECH encrypts the inner ClientHello (including the real SNI) using a server public key published via DNS HTTPS records.'
  },
  {
    id: 'adv4', cat: 'advanced', catLabel: 'Advanced Cybersecurity', diff: 'Hard',
    q: 'Why is ChaCha20-Poly1305 included alongside AES-GCM in TLS 1.3?',
    opts: ['It is a post-quantum signature', 'It runs fast in constant-time software on mobile CPUs lacking AES-NI hardware', 'It uses 56-bit keys', 'It replaces ECDHE'],
    ans: 1,
    concept: 'Constant-Time Software AEAD',
    exp: 'ChaCha20-Poly1305 delivers high speed and cache-timing resistance on ARM/mobile devices without dedicated AES hardware instructions.'
  },
  {
    id: 'adv5', cat: 'advanced', catLabel: 'Advanced Cybersecurity', diff: 'Hard',
    q: 'In Post-Quantum TLS (e.g., X25519MLKEM768), why are classical ECDHE and ML-KEM combined in a hybrid key exchange?',
    opts: ['To double the TCP MTU', 'So security holds even if either quantum computers break ECDHE OR a flaw is found in ML-KEM', 'To remove X.509 certificates', 'To support SSL 2.0'],
    ans: 1,
    concept: 'Hybrid Post-Quantum Key Exchange',
    exp: 'Hybrid key exchange combines classical X25519 with post-quantum ML-KEM (Kyber) to protect against Harvest-Now-Decrypt-Later attacks.'
  },
  {
    id: 'adv6', cat: 'advanced', catLabel: 'Advanced Cybersecurity', diff: 'Medium',
    q: 'What attack attempts to force a TLS 1.3 client and server to negotiate an older, weaker protocol like TLS 1.2?',
    opts: ['Downgrade Attack', 'Buffer Overflow', 'Clickjacking', 'CSRF'],
    ans: 0,
    concept: 'Protocol Downgrade Defense',
    exp: 'TLS 1.3 embeds a special sentinel value inside ServerHello.Random when downgrading to TLS 1.2/1.1 so clients detect forced downgrades.'
  },
  {
    id: 'adv7', cat: 'advanced', catLabel: 'Advanced Cybersecurity', diff: 'Hard',
    q: 'What does TLS 1.3’s KeyUpdate message accomplish on a long-lived connection?',
    opts: ['Re-verifies the Root CA', 'Rotates Application Traffic Keys in-band without re-running the handshake', 'Resets TCP sequence numbers', 'Disables encryption'],
    ans: 1,
    concept: 'In-Band Key Rotation',
    exp: 'KeyUpdate derives fresh application traffic keys before AEAD invocation limits are reached on high-throughput connections.'
  }
];
