/**
 * TLS SECURITY LAB V3.0 - Cybersecurity Career & Certification Preparation Data
 * Educational study guides only — not affiliated with official certification bodies.
 */
window.CAREER_DATA = {
  roadmaps: [
    {
      id: 'cyber_analyst', title: 'Cybersecurity Analyst',
      desc: 'Monitor organizational security posture, investigate alerts, and remediate vulnerabilities.',
      skills: ['SIEM Monitoring', 'TCP/IP & TLS', 'Incident Triage', 'Vulnerability Scanning'],
      topics: ['TLS Fundamentals', 'Network Security', 'Digital Certificates'],
      projects: ['TLS Security Lab Analyzer', 'PCAP Traffic Investigation Report'],
      tools: ['Wireshark', 'Nmap', 'Splunk', 'OpenSSL'],
      stages: ['Beginner: Networking, OSI Model, Linux basics', 'Intermediate: SIEM logs, PCAP analysis, X.509/TLS', 'Advanced: Threat hunting, IR playbooks, compliance'],
      interview: ['TLS 1.3 vs 1.2 handshake', 'How X.509 certificate chains prevent MITM', 'TCP 3-way handshake & flags']
    },
    {
      id: 'soc_analyst', title: 'SOC Analyst (Tier 1 / Tier 2)',
      desc: 'Detect, analyze, and respond to real-time security alerts in a Security Operations Center.',
      skills: ['Log Correlation', 'MITRE ATT&CK', 'Phishing Triage', 'Packet Analysis'],
      topics: ['Attack Playground', 'Live TLS Monitor', 'PCAP Analyzer'],
      projects: ['Real-Time TLS Alert Triage', 'Phishing URL Indicator Classifier'],
      tools: ['Wireshark', 'ELK Stack', 'Suricata', 'VirusTotal'],
      stages: ['Beginner: HTTP/DNS/TLS protocols, Windows/Linux logs', 'Intermediate: SIEM rules, PCAP forensics', 'Advanced: Malware triage, SOAR automation'],
      interview: ['How to investigate a suspicious TLS connection', 'Indicators of phishing URLs', 'Alert severity classification']
    },
    {
      id: 'netsec_eng', title: 'Network Security Engineer',
      desc: 'Design, deploy, and harden firewalls, VPNs, zero-trust proxies, and TLS termination.',
      skills: ['Routing & Switching', 'Firewalls/IDS', 'IPsec & TLS', 'PKI Architecture'],
      topics: ['TLS 1.2 vs 1.3', 'Certificate Inspector', 'Network Security'],
      projects: ['TLS 1.3 Hardening & Cipher Suite Audit', 'PKI Root-to-Leaf Validation Lab'],
      tools: ['OpenSSL', 'pfSense', 'Wireshark', 'Zeek'],
      stages: ['Beginner: Subnetting, DNS, TCP/UDP, NAT', 'Intermediate: VPNs, TLS cipher suites, ACLs', 'Advanced: Zero-Trust NAC, BGP security, DDoS mitigation'],
      interview: ['ECDHE Forward Secrecy', 'AEAD ciphers (AES-GCM vs ChaCha20)', 'mTLS architecture']
    },
    {
      id: 'pentester', title: 'Penetration Tester',
      desc: 'Conduct authorized security assessments to discover and report exploitable weaknesses.',
      skills: ['Web App Testing', 'Network Enumeration', 'Auth Bypass Analysis', 'Reporting'],
      topics: ['Attack Playground', 'Practical Challenges', 'Web Security'],
      projects: ['Authorized Lab Security Audit', 'Insecure Crypto Pattern Code Review'],
      tools: ['Burp Suite', 'Nmap', 'Metasploit', 'OWASP ZAP'],
      stages: ['Beginner: Linux CLI, HTTP/TLS, OWASP Top 10', 'Intermediate: Auth/RBAC testing, SQLi/XSS', 'Advanced: Active Directory, custom PoCs, executive reporting'],
      interview: ['Difference between XSS, CSRF, and SQLi', 'How to test RBAC authorization', 'Reporting CVSS severity']
    },
    {
      id: 'ethical_hacker', title: 'Ethical Hacker',
      desc: 'Think like an adversary under strict legal authorization to strengthen defensive controls.',
      skills: ['Reconnaissance', 'Vulnerability Assessment', 'Crypto Weaknesses', 'Remediation'],
      topics: ['MITM & Replay Simulation', 'Cryptography', 'Quiz Center'],
      projects: ['Replay & MITM Defense Demonstration', 'Weak Cipher Audit'],
      tools: ['Nmap', 'Wireshark', 'Burp Suite', 'John the Ripper'],
      stages: ['Beginner: Ethics & scope, TCP/IP, Linux', 'Intermediate: Scanning, web/API testing', 'Advanced: Exploit analysis, purple teaming'],
      interview: ['Authorized vs unauthorized testing', 'How nonces prevent replay attacks', 'Password hashing with PBKDF2/Argon2']
    },
    {
      id: 'sec_eng', title: 'Security Engineer',
      desc: 'Build secure systems, cryptographic pipelines, authentication services, and automated guardrails.',
      skills: ['Secure Coding', 'Web Crypto / KMS', 'RBAC & OAuth2', 'CI/CD Security'],
      topics: ['Practical Crypto Lab', 'AI Code Reviewer', 'Security Hardening'],
      projects: ['PBKDF2-SHA256 Auth & RBAC Portal', 'AES-256-GCM Encryption Service'],
      tools: ['Node.js Crypto', 'Web Crypto API', 'Docker', 'Semgrep'],
      stages: ['Beginner: Programming, HTTP/TLS, hashing', 'Intermediate: Symmetric/asymmetric crypto, CSP/CORS', 'Advanced: Threat modeling, KMS, zero-trust'],
      interview: ['Why AES-GCM requires a unique 96-bit IV', 'Constant-time comparison', 'CSP & HttpOnly cookies']
    },
    {
      id: 'cloud_sec', title: 'Cloud Security Engineer',
      desc: 'Secure cloud infrastructure, IAM policies, KMS keys, containers, and TLS ingress.',
      skills: ['IAM Least Privilege', 'Cloud KMS', 'VPC & WAF', 'Container Security'],
      topics: ['HTTPS & TLS Termination', 'Certificate Management', 'Privacy & Access'],
      projects: ['Vercel Security Headers & CSP Setup', 'RBAC & Audit Log Architecture'],
      tools: ['AWS IAM/KMS', 'Terraform', 'Trivy', 'Cloudflare'],
      stages: ['Beginner: Cloud fundamentals, Linux, networking', 'Intermediate: IAM, KMS, TLS ingress', 'Advanced: Multi-account governance, Kubernetes security'],
      interview: ['Shared responsibility model', 'Metadata SSRF protection (169.254.169.254)', 'Envelope encryption']
    },
    {
      id: 'appsec_eng', title: 'Application Security Engineer',
      desc: 'Review source code, eliminate OWASP Top 10 flaws, and embed security into SDLC.',
      skills: ['SAST / DAST', 'Code Review', 'XSS / SQLi Prevention', 'Crypto Implementation'],
      topics: ['AI Code Reviewer', 'Practical Crypto Lab', 'Quiz Center'],
      projects: ['Cryptographic Code Reviewer Audit', 'HTML Escaping & CSP Hardening'],
      tools: ['ESLint Security', 'Semgrep', 'Burp Suite', 'GitHub Advanced Security'],
      stages: ['Beginner: Web architecture, HTTP, DOM', 'Intermediate: Auth, RBAC, input validation', 'Advanced: Threat modeling, SAST rules, secure crypto'],
      interview: ['Why AES-ECB and Math.random() are insecure', 'Parameterized queries vs concatenation', 'Rate limiting strategies']
    },
    {
      id: 'dfir_analyst', title: 'Digital Forensics Analyst',
      desc: 'Preserve, acquire, and analyze digital evidence, logs, and packet captures after incidents.',
      skills: ['PCAP Forensics', 'Timeline Reconstruction', 'Hashing Integrity', 'Chain of Custody'],
      topics: ['PCAP Analyzer', 'SHA-256 Hashing', 'Audit Logs'],
      projects: ['Binary PCAP/PCAPNG Investigation', 'SHA-256 Evidence Integrity Verification'],
      tools: ['Wireshark', 'TShark', 'Autopsy', 'Volatility'],
      stages: ['Beginner: File systems, SHA-256 hashing, OS internals', 'Intermediate: PCAP/PCAPNG decoding, log correlation', 'Advanced: Memory forensics, malware timelines'],
      interview: ['Why SHA-256 is used for evidence integrity', 'What is visible vs encrypted in TLS PCAPs', 'Audit trail requirements']
    },
    {
      id: 'sec_researcher', title: 'Security Researcher',
      desc: 'Investigate novel protocol weaknesses, cryptographic edge cases, and defensive mechanisms.',
      skills: ['Protocol Analysis', 'Applied Cryptography', 'Reverse Engineering', 'PoC Writing'],
      topics: ['TLS 1.3 RFC 8446', 'ECDH & RSA Math', 'Attack Simulations'],
      projects: ['TLS 1.2 vs 1.3 Latency & Security Benchmark', 'Avalanche Effect Empirical Study'],
      tools: ['OpenSSL', 'Python/Scapy', 'Wireshark', 'Ghidra'],
      stages: ['Beginner: C/Python/JS, discrete math, networking', 'Intermediate: RFC analysis, Web Crypto internals', 'Advanced: Fuzzing, formal verification, responsible disclosure'],
      interview: ['Downgrade protection in TLS 1.3 ServerHello.random', 'RSA-OAEP vs textbook RSA', 'Timing side-channels']
    }
  ],

  certifications: [
    {
      id: 'net_plus', title: 'CompTIA Network+ (Educational Prep)',
      overview: 'Core networking concepts, OSI/TCP-IP models, routing, ports, DNS, and network troubleshooting.',
      prereq: 'Basic computer literacy (recommended 6+ months networking study).',
      topics: ['OSI Model & Encapsulation', 'TCP/UDP Ports (443, 80, 53)', 'IPv4/IPv6 & Subnetting', 'Network Security Basics'],
      roadmap: ['Complete Academy Module 2 (Network Security)', 'Practice PCAP Analyzer Protocol & Port modules', 'Pass Networking Quiz at >= 80%'],
      questions: [
        { q: 'Which port is the standard IANA port for HTTPS (HTTP over TLS)?', opts: ['22', '53', '80', '443'], ans: 3, exp: 'Port 443 is reserved for HTTPS.' },
        { q: 'Which OSI layer is responsible for end-to-end reliable transport via TCP?', opts: ['Layer 2 (Data Link)', 'Layer 3 (Network)', 'Layer 4 (Transport)', 'Layer 7 (Application)'], ans: 2, exp: 'TCP and UDP operate at OSI Layer 4 (Transport).' }
      ]
    },
    {
      id: 'sec_plus', title: 'CompTIA Security+ (Educational Prep)',
      overview: 'Foundational cybersecurity skills: threats, cryptography, PKI/X.509, IAM/RBAC, and incident response.',
      prereq: 'Network+ level networking knowledge recommended.',
      topics: ['CIA Triad & Zero Trust', 'Symmetric vs Asymmetric Crypto', 'PKI & X.509 Certificates', 'MITM, Replay & Phishing Defense'],
      roadmap: ['Complete all 5 Academy Modules', 'Finish AES, RSA, ECDH & SHA-256 labs', 'Score >= 85% in Security+ mock questions'],
      questions: [
        { q: 'Which cryptographic property ensures past TLS sessions stay confidential if a server private key is later leaked?', opts: ['Non-repudiation', 'Forward Secrecy (ECDHE)', 'ECB Mode', 'Compression'], ans: 1, exp: 'Ephemeral Diffie-Hellman (ECDHE) provides Forward Secrecy.' },
        { q: 'Which mechanism protects passwords against rainbow tables?', opts: ['Static Base64', 'Unique CSPRNG Salt + PBKDF2', 'MD5 without salt', 'Plaintext storage'], ans: 1, exp: 'Per-user random salt + slow KDF (PBKDF2/Argon2) prevents rainbow table attacks.' }
      ]
    },
    {
      id: 'ceh', title: 'Certified Ethical Hacker — CEH (Educational Prep)',
      overview: 'Ethical hacking methodology, footprinting, scanning, web vulnerabilities, and attack countermeasures.',
      prereq: 'Strong networking, Linux, and web application fundamentals.',
      topics: ['Reconnaissance & Enumeration', 'MITM & Sniffing Countermeasures', 'Web App Security (XSS/SQLi/CSRF)', 'Cryptography Attacks'],
      roadmap: ['Explore all 5 Attack Playground scenarios', 'Complete AI Code Reviewer exercises', 'Complete Practical Challenges'],
      questions: [
        { q: 'What HTTP response header restricts which script origins a browser may execute to mitigate XSS?', opts: ['Content-Security-Policy', 'X-Powered-By', 'Accept-Encoding', 'Cache-Control'], ans: 0, exp: 'CSP restricts allowed script, style, and connection sources.' },
        { q: 'Why is AES-ECB unsafe for encrypting structured data?', opts: ['Uses 256-bit keys', 'Identical plaintext blocks produce identical ciphertext blocks', 'Requires an IV', 'Too slow'], ans: 1, exp: 'ECB leaks patterns because it lacks an IV and chaining.' }
      ]
    },
    {
      id: 'ccna', title: 'Cisco CCNA (Educational Prep)',
      overview: 'Enterprise switching, IP routing, VLANs, ACLs, network services (DNS/DHCP), and infrastructure security.',
      prereq: 'Basic IP addressing and binary math.',
      topics: ['IPv4/IPv6 Routing', 'TCP/UDP & Port Security', 'ACLs & Firewalling', 'TLS/SSH Device Management'],
      roadmap: ['Master PCAP Packet Inspector', 'Review Network Security lessons', 'Practice Networking interview bank'],
      questions: [
        { q: 'Which TCP flag combination initiates a standard 3-way handshake?', opts: ['FIN -> ACK', 'SYN -> SYN-ACK -> ACK', 'RST -> SYN', 'PSH -> URG'], ans: 1, exp: 'TCP connections begin with SYN, SYN-ACK, ACK.' },
        { q: 'Which protocol resolves domain names to IP addresses over UDP/TCP port 53?', opts: ['ARP', 'ICMP', 'DNS', 'SNMP'], ans: 2, exp: 'DNS uses port 53.' }
      ]
    },
    {
      id: 'cissp', title: 'CISSP — Advanced Overview (Educational Prep)',
      overview: 'Security architecture, governance, risk management, cryptography engineering, and IAM at enterprise scale.',
      prereq: 'Advanced understanding of all 8 security domains.',
      topics: ['Security & Risk Management', 'Security Architecture & Engineering', 'Communication & Network Security', 'IAM & Audit Trails'],
      roadmap: ['Achieve >= 80% Overall Completion', 'Review Security Audit & RBAC architecture', 'Attempt Advanced Interview & Viva banks'],
      questions: [
        { q: 'Which access control model enforces permissions based on assigned organizational job functions?', opts: ['DAC', 'RBAC (Role-Based Access Control)', 'MAC', 'Open Access'], ans: 1, exp: 'RBAC assigns permissions to roles (Admin, Faculty, Student) rather than individuals.' },
        { q: 'What is the primary purpose of an immutable administrative audit log?', opts: ['Speed up encryption', 'Accountability and forensic traceability', 'Replace TLS', 'Compress databases'], ans: 1, exp: 'Audit logs provide non-repudiable accountability for sensitive actions.' }
      ]
    }
  ],

  interviewBank: [
    { id: 'iv_1', topic: 'Computer Networks', diff: 'Beginner', q: 'What is the difference between TCP and UDP?', opts: ['TCP is connection-oriented and reliable; UDP is connectionless', 'UDP is encrypted by default', 'TCP uses port 53 only', 'No difference'], ans: 0, exp: 'TCP guarantees ordered delivery via handshakes and ACKs; UDP is low-overhead.' },
    { id: 'iv_2', topic: 'TLS and SSL', diff: 'Intermediate', q: 'How does TLS 1.3 achieve a 1-RTT handshake?', opts: ['Skips certificates', 'Sends ECDHE key_share inside ClientHello', 'Uses MD5', 'Uses UDP'], ans: 1, exp: 'Including key_share in ClientHello lets the server derive keys immediately.' },
    { id: 'iv_3', topic: 'Cryptography', diff: 'Intermediate', q: 'Why does AES-GCM provide both confidentiality and integrity?', opts: ['Uses ECB', 'It is an AEAD cipher producing ciphertext + GHASH authentication tag', 'Uses 56-bit keys', 'Compresses data'], ans: 1, exp: 'AES-GCM combines CTR encryption with GMAC authentication.' },
    { id: 'iv_4', topic: 'Network Security', diff: 'Beginner', q: 'How does HTTPS mitigate Man-in-the-Middle (MITM) attacks?', opts: ['Hides IP addresses', 'Authenticates server via CA-signed X.509 certificate and encrypts traffic', 'Disables DNS', 'Uses HTTP port 80'], ans: 1, exp: 'Certificate verification stops impersonation while AEAD stops tampering.' },
    { id: 'iv_5', topic: 'Linux', diff: 'Beginner', q: 'Which Linux command displays active listening TCP/UDP sockets?', opts: ['ls -la', 'ss -tuln', 'chmod 777', 'mkdir'], ans: 1, exp: 'ss -tuln (or netstat -tuln) lists listening TCP/UDP sockets.' },
    { id: 'iv_6', topic: 'Operating Systems', diff: 'Intermediate', q: 'Why should private cryptographic keys never be stored in world-readable files?', opts: ['Increases CPU usage', 'Any local process/user could read and impersonate the server', 'Breaks DNS', 'Slows disk I/O'], ans: 1, exp: 'Private key compromise allows impersonation and breaks authentication.' },
    { id: 'iv_7', topic: 'Web Security', diff: 'Intermediate', q: 'Why are HttpOnly cookies recommended for session tokens?', opts: ['Larger size', 'Prevents client-side JavaScript (document.cookie) from reading them during XSS', 'Disables TLS', 'Works without HTTP'], ans: 1, exp: 'HttpOnly blocks JS access to session cookies.' },
    { id: 'iv_8', topic: 'Ethical Hacking', diff: 'Advanced', q: 'How does TLS 1.3 detect downgrade attacks to TLS 1.2?', opts: ['Port number', 'Special sentinel bytes in ServerHello.random', 'User-Agent header', 'ICMP ping'], ans: 1, exp: 'RFC 8446 embeds a fixed downgrade sentinel in the last 8 bytes of ServerHello.random.' },
    { id: 'iv_9', topic: 'Database Security', diff: 'Intermediate', q: 'What is the primary defense against SQL Injection?', opts: ['Base64 encoding', 'Parameterized queries / prepared statements', 'Hiding table names', 'Using HTTP'], ans: 1, exp: 'Parameterized queries separate SQL code from user-supplied data.' },
    { id: 'iv_10', topic: 'Cloud Security', diff: 'Advanced', q: 'Why must server-side URL fetchers block 169.254.169.254 and 127.0.0.1?', opts: ['To prevent SSRF access to cloud metadata and internal services', 'To speed up DNS', 'To enable HTTP/1.0', 'To allow CORS'], ans: 0, exp: 'Blocking link-local and loopback IPs prevents Server-Side Request Forgery (SSRF).' }
  ],

  vivaQuestions: [
    { id: 'vv_1', topic: 'TLS 1.3', diff: 'Beginner', q: 'Explain the role of ClientHello and ServerHello in a TLS handshake.', model: 'ClientHello advertises supported TLS versions, cipher suites, a 32-byte random nonce, and (in TLS 1.3) an ECDHE key_share. ServerHello selects the strongest mutually supported version/cipher and returns its own random nonce and key_share.' },
    { id: 'vv_2', topic: 'Cryptography', diff: 'Intermediate', q: 'Why do we combine asymmetric (ECDHE/RSA) and symmetric (AES-GCM) cryptography in TLS?', model: 'Asymmetric crypto solves key distribution and authentication over untrusted networks, while symmetric AEAD ciphers (AES-256-GCM) are orders of magnitude faster for bulk application data encryption.' },
    { id: 'vv_3', topic: 'X.509 & PKI', diff: 'Intermediate', q: 'What checks does a browser perform when validating an X.509 certificate?', model: 'The browser verifies the cryptographic signature chain up to a trusted Root CA, checks validity timestamps (NotBefore/NotAfter), verifies Subject Alternative Name (SAN) matches the hostname, and checks revocation status.' },
    { id: 'vv_4', topic: 'Web Security', diff: 'Advanced', q: 'How does RBAC differ from frontend-only UI hiding, and why must RBAC be enforced on the backend?', model: 'Frontend checks only hide UI elements and can be bypassed with curl or DevTools. Backend RBAC verifies a signed HttpOnly session token and checks the user role on every protected API endpoint.' }
  ],

  skillDomains: [
    { id: 'sk_net', label: 'Networking & TCP/IP', q: 'Which protocol maps a domain name to an IP address?', opts: ['DNS', 'ARP', 'ICMP'], ans: 0 },
    { id: 'sk_crypto', label: 'Applied Cryptography', q: 'Which cipher mode provides authenticated encryption (AEAD)?', opts: ['AES-ECB', 'AES-256-GCM', 'DES'], ans: 1 },
    { id: 'sk_tls', label: 'TLS & HTTPS', q: 'Which TLS version mandates Forward Secrecy and 1-RTT handshakes?', opts: ['SSL 3.0', 'TLS 1.0', 'TLS 1.3'], ans: 2 },
    { id: 'sk_linux', label: 'Linux & OS Security', q: 'Which command inspects listening ports on Linux?', opts: ['ss -tuln', 'echo', 'cat'], ans: 0 },
    { id: 'sk_sec', label: 'Security Fundamentals', q: 'Which KDF is recommended for password storage with a random salt?', opts: ['PBKDF2 / Argon2', 'MD5', 'ROT13'], ans: 0 },
    { id: 'sk_web', label: 'Web & API Security', q: 'Which header mitigates XSS by restricting script origins?', opts: ['Content-Security-Policy', 'Server', 'Date'], ans: 0 },
    { id: 'sk_pcap', label: 'Network Traffic Analysis', q: 'In a TLS PCAP without session keys, which record is encrypted?', opts: ['ClientHello', 'Application Data (0x17)', 'DNS Query'], ans: 1 }
  ]
};
