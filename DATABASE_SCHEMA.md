# Database & Persistence Schema — TLS SECURITY LAB V3.0

## 1. Database Architecture Status
**No SQL or NoSQL database server exists in this repository.** All student learning records, quizzes, challenges, certificates, and profile preferences are stored persistently in browser **`localStorage`** as structured JSON collections.

## 2. `localStorage` Collections

### 1. `tls_lab_student_progress_v1` (Student Learning Progress)
- `completedLessons`: `string[]` (Lesson IDs from `ACADEMY_MODULES`)
- `completedLabs`: `string[]` (`'aes' | 'rsa' | 'ecdh' | 'sha256' | 'handshake'`)
- `labCompletionDates`: `Record<string, string>` (`{ labId: 'YYYY-MM-DD' }`)
- `completedChallenges`: `string[]` (Challenge IDs from `CHALLENGES_BANK`)
- `achievementDates`: `Record<string, string>` (`{ badgeId: 'YYYY-MM-DD' }`)
- `experimentCount`: `number`
- `dailyActivityMap`: `Record<string, number>` (`{ 'YYYY-MM-DD': count }`)
- `timeBySection`: `{ academy: number, lab: number, quiz: number, playground: number }`
- `dailyGoal`: `number`
- `activities`: `{ title: string, time: string, badge: string, badgeType: string }[]`

### 2. `tls_lab_quiz_history_v1` (Quiz Attempts)
Array of `{ cat: string, diff: string, score: number, total: number, pct: number, date: string }`.

### 3. `tls_lab_challenge_history_v1` (Challenge Attempts)
Array of `{ id: string, title: string, catLabel: string, diff: string, status: 'Passed' | 'Failed', score: number, timeSec: number, hintsUsed: number, date: string }`.

### 4. `tls_lab_issued_certs_v1` (Issued Certificates)
Map keyed by certificate key (`cert_tls_fund`, `cert_crypto_lab`, `cert_netsec`, `cert_academy`, `cert_master`):
`{ id: string, certId: string, title: string, studentName: string, issueDate: string, platform: string, qrPayload: string }`.

### 5. `tls_lab_reports_history_v1` (Report & Certificate History)
Array of `{ type: 'Security Report' | 'Certificate', title: string, certId: string, date: string }`.

### 6. `tls_lab_student_profile_v1` (Student Profile)
`{ name: string, studentId: string, course: string, department: string, learningLevel: 'Beginner' | 'Intermediate' | 'Advanced', avatar: string, createdAt: string }`.

### 7. `tls_lab_student_settings_v1` (Preferences, Notifications, Appearance, Privacy)
`{ preferredTopics: string[], quizDiff: string, studyReminder: string, notifications: object, appearance: { theme: string, fontSize: string, density: string }, privacy: { profileVis: string, activityVis: string, analyticsOptIn: boolean } }`.

### 8. `tls_lab_account_auth_v1` (Local Account Security)
`{ email: string, passwordHash: string, sessionActive: boolean }` — `passwordHash` stores `pbkdf2$<saltHex>$<hashHex>` (never plaintext).
