/**
 * TLS SECURITY LAB V3.0 - Centralized Internationalization (i18n) & 100+ Term Glossary
 * Supports: English (en), Hindi (hi), Kannada (kn), Tamil (ta), Telugu (te), Malayalam (ml)
 * Technical protocol/algorithm names (TLS 1.3, AES-GCM, RSA, ECDHE, SHA-256, X.509) are preserved.
 */
(function () {
  const LANG_META = {
    en: { name: 'English', native: 'English', speech: 'en-US' },
    hi: { name: 'Hindi', native: 'हिन्दी', speech: 'hi-IN' },
    kn: { name: 'Kannada', native: 'ಕನ್ನಡ', speech: 'kn-IN' },
    ta: { name: 'Tamil', native: 'தமிழ்', speech: 'ta-IN' },
    te: { name: 'Telugu', native: 'తెలుగు', speech: 'te-IN' },
    ml: { name: 'Malayalam', native: 'മലയാളം', speech: 'ml-IN' }
  };

  const UI = {
    en: {
      nav_dashboard: 'Dashboard', nav_simulator: 'Handshake Simulator', nav_certificate: 'Certificate Inspector',
      nav_crypto: 'Practical Crypto Lab', nav_comparison: 'TLS 1.2 vs TLS 1.3', nav_security: 'Attack Playground',
      nav_student_dash: 'Student Dashboard', nav_academy: 'Learning Academy', nav_quiz: 'Quiz Center',
      nav_challenges: 'Practical Challenges', nav_progress: 'Progress & Badges', nav_reports: 'Reports & Certs',
      nav_profile: 'Profile & Settings', nav_ai: 'AI Security Advisor', nav_admin: 'Admin & Faculty',
      nav_classroom: 'Virtual Classroom', nav_monitor: 'Live TLS Monitor', nav_pcap: 'PCAP Analyzer',
      nav_career: 'Career & Cert Prep', nav_glossary: 'Glossary & TTS',
      btn_continue: 'Continue Learning', btn_submit: 'Submit Answer', btn_save: 'Save Changes',
      bilingual_label: 'Bilingual Mode', tts_play: 'Play', tts_pause: 'Pause', tts_resume: 'Resume', tts_stop: 'Stop',
      academy_bilingual_title: 'Simplified Regional & Bilingual Explanation'
    },
    hi: {
      nav_dashboard: 'डैशबोर्ड', nav_simulator: 'हैंडशेक सिम्युलेटर', nav_certificate: 'प्रमाणपत्र निरीक्षक',
      nav_crypto: 'प्रैक्टिकल क्रिप्टो लैब', nav_comparison: 'TLS 1.2 बनाम TLS 1.3', nav_security: 'अटैक प्लेग्राउंड',
      nav_student_dash: 'छात्र डैशबोर्ड', nav_academy: 'लर्निंग अकादमी', nav_quiz: 'क्विज़ केंद्र',
      nav_challenges: 'प्रैक्टिकल चुनौतियाँ', nav_progress: 'प्रगति और बैज', nav_reports: 'रिपोर्ट और प्रमाणपत्र',
      nav_profile: 'प्रोफ़ाइल और सेटिंग्स', nav_ai: 'AI सुरक्षा सलाहकार', nav_admin: 'प्रशासक और संकाय',
      nav_classroom: 'वर्चुअल क्लासरूम', nav_monitor: 'लाइव TLS मॉनिटर', nav_pcap: 'PCAP विश्लेषक',
      nav_career: 'करियर और प्रमाणन', nav_glossary: 'शब्दावली और TTS',
      btn_continue: 'सीखना जारी रखें', btn_submit: 'उत्तर सबमिट करें', btn_save: 'परिवर्तन सहेजें',
      bilingual_label: 'द्विभाषी मोड', tts_play: 'सुनें', tts_pause: 'रोकें', tts_resume: 'पुनः चलाएं', tts_stop: 'बंद करें',
      academy_bilingual_title: 'सरल क्षेत्रीय और द्विभाषी व्याख्या'
    },
    kn: {
      nav_dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', nav_simulator: 'ಹ್ಯಾಂಡ್‌ಶೇಕ್ ಸಿಮ್ಯುಲೇಟರ್', nav_certificate: 'ಪ್ರಮಾಣಪತ್ರ ಪರಿಶೀಲಕ',
      nav_crypto: 'ಪ್ರಾಯೋಗಿಕ ಕ್ರಿಪ್ಟೋ ಲ್ಯಾಬ್', nav_comparison: 'TLS 1.2 vs TLS 1.3', nav_security: 'ದಾಳಿ ಆಟದ ಮೈದಾನ',
      nav_student_dash: 'ವಿದ್ಯಾರ್ಥಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', nav_academy: 'ಕಲಿಕಾ ಅಕಾಡೆಮಿ', nav_quiz: 'ಕ್ವಿಜ್ ಕೇಂದ್ರ',
      nav_challenges: 'ಪ್ರಾಯೋಗಿಕ ಸವಾಲುಗಳು', nav_progress: 'ಪ್ರಗತಿ ಮತ್ತು ಬ್ಯಾಡ್ಜ್‌ಗಳು', nav_reports: 'ವರದಿಗಳು ಮತ್ತು ಪ್ರಮಾಣಪತ್ರ',
      nav_profile: 'ಪ್ರೊಫೈಲ್ ಮತ್ತು ಸೆಟ್ಟಿಂಗ್‌ಗಳು', nav_ai: 'AI ಭದ್ರತಾ ಸಲಹೆಗಾರ', nav_admin: 'ನಿರ್ವಾಹಕ ಮತ್ತು ಅಧ್ಯಾಪಕರು',
      nav_classroom: 'ವರ್ಚುವಲ್ ತರಗತಿ', nav_monitor: 'ಲೈವ್ TLS ಮಾನಿಟರ್', nav_pcap: 'PCAP ವಿಶ್ಲೇಷಕ',
      nav_career: 'ವೃತ್ತಿ ಮತ್ತು ಪ್ರಮಾಣೀಕರಣ', nav_glossary: 'ಪದಕೋಶ ಮತ್ತು TTS',
      btn_continue: 'ಕಲಿಕೆ ಮುಂದುವರಿಸಿ', btn_submit: 'ಉತ್ತರ ಸಲ್ಲಿಸಿ', btn_save: 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
      bilingual_label: 'ದ್ವಿಭಾಷಾ ಮೋಡ್', tts_play: 'ಪ್ಲೇ', tts_pause: 'ವಿರಾಮ', tts_resume: 'ಮುಂದುವರಿಸಿ', tts_stop: 'ನಿಲ್ಲಿಸಿ',
      academy_bilingual_title: 'ಸರಳ ಪ್ರಾದೇಶಿಕ ಮತ್ತು ದ್ವಿಭಾಷಾ ವಿವರಣೆ'
    },
    ta: {
      nav_dashboard: 'டாஷ்போர்டு', nav_simulator: 'ஹேண்ட்ஷேக் சிமுலேட்டர்', nav_certificate: 'சான்றிதழ் ஆய்வாளர்',
      nav_crypto: 'நடைமுறை கிரிப்டோ ஆய்வகம்', nav_comparison: 'TLS 1.2 vs TLS 1.3', nav_security: 'தாக்குதல் பயிற்சி தளம்',
      nav_student_dash: 'மாணவர் டாஷ்போர்டு', nav_academy: 'கற்றல் அகாடமி', nav_quiz: 'வினாடி வினா மையம்',
      nav_challenges: 'நடைமுறை சவால்கள்', nav_progress: 'முன்னேற்றம் & பேட்ஜ்கள்', nav_reports: 'அறிக்கைகள் & சான்றிதழ்',
      nav_profile: 'சுயவிவரம் & அமைப்புகள்', nav_ai: 'AI பாதுகாப்பு ஆலோசகர்', nav_admin: 'நிர்வாகம் & ஆசிரியர்',
      nav_classroom: 'மெய்நிகர் வகுப்பறை', nav_monitor: 'நேரடி TLS கண்காணிப்பு', nav_pcap: 'PCAP பகுப்பாய்வி',
      nav_career: 'தொழில் & சான்றிதழ்', nav_glossary: 'சொற்களஞ்சியம் & TTS',
      btn_continue: 'கற்றலைத் தொடரவும்', btn_submit: 'பதிலைச் சமர்ப்பிக்கவும்', btn_save: 'மாற்றங்களைச் சேமி',
      bilingual_label: 'இருமொழி முறை', tts_play: 'இயக்கு', tts_pause: 'இடைநிறுத்து', tts_resume: 'தொடர்', tts_stop: 'நிறுத்து',
      academy_bilingual_title: 'எளிய பிராந்திய மற்றும் இருமொழி விளக்கம்'
    },
    te: {
      nav_dashboard: 'డ్యాష్‌బోర్డ్', nav_simulator: 'హ్యాండ్‌షేక్ సిమ్యులేటర్', nav_certificate: 'సర్టిఫికేట్ ఇన్‌స్పెక్టర్',
      nav_crypto: 'ప్రాక్టికల్ క్రిప్టో ల్యాబ్', nav_comparison: 'TLS 1.2 vs TLS 1.3', nav_security: 'అటాక్ ప్లేగ్రౌండ్',
      nav_student_dash: 'విద్యార్థి డ్యాష్‌బోర్డ్', nav_academy: 'లెర్నింగ్ అకాడమీ', nav_quiz: 'క్విజ్ సెంటర్',
      nav_challenges: 'ప్రాక్టికల్ సవాళ్లు', nav_progress: 'పురోగతి & బ్యాడ్జ్‌లు', nav_reports: 'నివేదికలు & సర్టిఫికెట్లు',
      nav_profile: 'ప్రొఫైల్ & సెట్టింగ్‌లు', nav_ai: 'AI భద్రతా సలహాదారు', nav_admin: 'అడ్మిన్ & ఫ్యాకల్టీ',
      nav_classroom: 'వర్చువల్ క్లాస్‌రూమ్', nav_monitor: 'లైవ్ TLS మానిటర్', nav_pcap: 'PCAP విశ్లేషకి',
      nav_career: 'కెరీర్ & సర్టిఫికేషన్', nav_glossary: 'పదకోశం & TTS',
      btn_continue: 'నేర్చుకోవడం కొనసాగించండి', btn_submit: 'సమాధానం సమర్పించండి', btn_save: 'మార్పులను సేవ్ చేయండి',
      bilingual_label: 'ద్విభాషా మోడ్', tts_play: 'ప్లే', tts_pause: 'పాజ్', tts_resume: 'కొనసాగించు', tts_stop: 'ఆపు',
      academy_bilingual_title: 'సరళమైన ప్రాంతీయ & ద್ವిభాషా వివరణ'
    },
    ml: {
      nav_dashboard: 'ഡാഷ്ബോർഡ്', nav_simulator: 'ഹാൻഡ്ഷേക്ക് സിമുലേറ്റർ', nav_certificate: 'സർട്ടിഫിക്കറ്റ് ഇൻസ്പെക്ടർ',
      nav_crypto: 'പ്രാക്ടിക്കൽ ക്രിപ്റ്റോ ലാബ്', nav_comparison: 'TLS 1.2 vs TLS 1.3', nav_security: 'അറ്റാക്ക് പ്ലേഗ്രൗണ്ട്',
      nav_student_dash: 'വിദ്യാർത്ഥി ഡാഷ്ബോർഡ്', nav_academy: 'ലേണിംഗ് അക്കാദമി', nav_quiz: 'ക്വിസ് സെന്റർ',
      nav_challenges: 'പ്രാക്ടിക്കൽ ചലഞ്ചുകൾ', nav_progress: 'പുരോഗതിയും ബാഡ്ജുകളും', nav_reports: 'റിപ്പോർട്ടുകളും സർട്ടിഫിക്കറ്റും',
      nav_profile: 'പ്രൊഫൈലും ക്രമീകരണങ്ങളും', nav_ai: 'AI സുരക്ഷാ ഉപദേഷ്ടാവ്', nav_admin: 'അഡ്മിനും ഫാക്കൽറ്റിയും',
      nav_classroom: 'വെർച്വൽ ക്ലാസ്റൂം', nav_monitor: 'ലൈവ് TLS മോണിറ്റർ', nav_pcap: 'PCAP അനലൈസർ',
      nav_career: 'കരിയറും സർട്ടിഫിക്കേഷനും', nav_glossary: 'പദാവലിയും TTS-ഉം',
      btn_continue: 'പഠനം തുടരുക', btn_submit: 'ഉത്തരം സമർപ്പിക്കുക', btn_save: 'മാറ്റങ്ങൾ സംരക്ഷിക്കുക',
      bilingual_label: 'ദ്വിഭാഷാ മോഡ്', tts_play: 'പ്ലേ', tts_pause: 'താൽക്കാലികമായി നിർത്തുക', tts_resume: 'തുടരുക', tts_stop: 'നിർത്തുക',
      academy_bilingual_title: 'ലളിതമായ പ്രാദേശിക & ദ്വിഭാഷാ വിശദീകരണം'
    }
  };

  // Simplified core concept explanations for Academy & Bilingual Mode
  const CONCEPT_NOTES = {
    tls: {
      en: 'Transport Layer Security (TLS 1.3) protects data during communication by authenticating the server and encrypting traffic with AEAD ciphers.',
      hi: 'ट्रांसपोर्ट लेयर सिक्योरिटी (TLS 1.3) सर्वर को प्रमाणित करके और AEAD सिफर से डेटा एन्क्रिप्ट करके संचार की सुरक्षा करती है।',
      kn: 'ಟ್ರಾನ್ಸ್‌ಪೋರ್ಟ್ ಲೇಯರ್ ಸೆಕ್ಯುರಿಟಿ (TLS 1.3) ಸರ್ವರ್ ಅನ್ನು ದೃಢೀಕರಿಸಿ ಮತ್ತು AEAD ಸೈಫರ್‌ಗಳಿಂದ ಡೇಟಾವನ್ನು ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಿ ಸಂವಹನವನ್ನು ರಕ್ಷಿಸುತ್ತದೆ.',
      ta: 'டிரான்ஸ்போர்ட் லேயர் செக்யூரிட்டி (TLS 1.3) சேவையகத்தைச் சரிபார்த்து AEAD மூலம் தரவை குறியாக்கம் செய்து பாதுகாக்கிறது.',
      te: 'ట్రాన్స్‌పోర్ట్ లేయర్ సెక్యూரிটি (TLS 1.3) సర్వర్‌ను ధృవీకరించి AEAD సైఫర్‌లతో డేటాను ఎన్‌క్రిప్ట్ చేసి కమ్యూనికేషన్‌ను రక్షిస్తుంది.',
      ml: 'ട്രാൻസ്‌പോർട്ട് ലെയർ സെക്യൂരിറ്റി (TLS 1.3) സെർവർ ആധികാരികത ഉറപ്പാക്കി AEAD വഴി ഡാറ്റ എൻക്രിപ്റ്റ് ചെയ്ത് ആശയവിനിമയം സംരക്ഷിക്കുന്നു.'
    },
    netsec: {
      en: 'Network Security defends data in transit against MITM, Replay, and Eavesdropping attacks using encryption, nonces, and authentication.',
      hi: 'नेटवर्क सुरक्षा एन्क्रिप्शन, नॉन्स और प्रमाणीकरण का उपयोग करके MITM, रीप्ले और ईव्सड्रॉपिंग हमलों से डेटा की रक्षा करती है।',
      kn: 'ನೆಟ್‌ವರ್ಕ್ ಭದ್ರತೆ ಎನ್‌ಕ್ರಿಪ್ಶನ್, ನಾನ್ಸ್ ಮತ್ತು ದೃಢೀಕರಣವನ್ನು ಬಳಸಿ MITM, ರೀಪ್ಲೇ ಮತ್ತು ಕದ್ದಾಲಿಕೆ ದಾಳಿಗಳಿಂದ ರಕ್ಷಿಸುತ್ತದೆ.',
      ta: 'நெட்வொர்க் பாதுகாப்பு குறியாக்கம், நான்ஸ் மற்றும் அங்கீகாரத்தைப் பயன்படுத்தி MITM மற்றும் ரீப்ளே தாக்குதல்களிலிருந்து காக்கிறது.',
      te: 'నెట్‌వర్క్ భద్రత ఎన్‌క్రిప్షన్, నాన్స్ మరియు ప్రామాణీకరణ ద్వారా MITM, రీప్లే మరియు ఈవ్స్‌డ్రాపింగ్ దాడుల నుండి రక్షిస్తుంది.',
      ml: 'നെറ്റ്‌വർക്ക് സുരക്ഷ എൻക്രിപ്ഷൻ, നോൺസ്, പ്രാമാണീകരണം എന്നിവ ഉപയോഗിച്ച് MITM, റീപ്ലേ ആക്രമണങ്ങളിൽ നിന്ന് സംരക്ഷിക്കുന്നു.'
    },
    crypto: {
      en: 'Cryptography combines symmetric encryption (AES-GCM), asymmetric key exchange (ECDHE/RSA), and hashing (SHA-256) to ensure confidentiality and integrity.',
      hi: 'क्रिप्टोग्राफी गोपनीयता और अखंडता सुनिश्चित करने के लिए सिमेट्रिक एन्क्रिप्शन (AES-GCM), असिमेट्रिक कुंजी विनिमय (ECDHE/RSA) और हैशिंग (SHA-256) को जोड़ती है।',
      kn: 'ಕ್ರಿಪ್ಟೋಗ್ರಫಿ ಗೌಪ್ಯತೆ ಮತ್ತು ಸಮಗ್ರತೆಗಾಗಿ ಸಮ್ಮಿತೀಯ ಗೂಢಲಿಪೀಕರಣ (AES-GCM), ಅಸಮ್ಮಿತೀಯ ಕೀ ವಿನಿಮಯ (ECDHE/RSA) ಮತ್ತು ಹ್ಯಾಶಿಂಗ್ (SHA-256) ಬಳಸುತ್ತದೆ.',
      ta: 'குறியாக்கவியல் ரகசியத்தன்மைக்காக AES-GCM, ECDHE/RSA மற்றும் SHA-256 ஹாஷிங் ஆகியவற்றை ஒருங்கிணைக்கிறது.',
      te: 'క్రిప్టోగ్రఫీ గోప్యత మరియు సమగ్రత కోసం AES-GCM, ECDHE/RSA కీ మార్పిడి మరియు SHA-256 హ్యాషింగ్‌ను ఉపయోగిస్తుంది.',
      ml: 'ക്രിപ്റ്റോഗ്രഫി രഹസ്യസ്വഭാവത്തിനും സമഗ്രതയ്ക്കുമായി AES-GCM, ECDHE/RSA, SHA-256 ഹാഷിംഗ് എന്നിവ സംയോജിപ്പിക്കുന്നു.'
    },
    certs: {
      en: 'Digital Certificates (X.509) bind a public key to a domain identity and are signed by a trusted Certificate Authority (CA).',
      hi: 'डिजिटल प्रमाणपत्र (X.509) किसी डोमेन की पहचान को सार्वजनिक कुंजी से जोड़ते हैं और एक विश्वसनीय CA द्वारा हस्ताक्षरित होते हैं।',
      kn: 'ಡಿಜಿಟಲ್ ಪ್ರಮಾಣಪತ್ರಗಳು (X.509) ಡೊಮೇನ್ ಗುರುತನ್ನು ಸಾರ್ವಜನಿಕ ಕೀಗೆ ಬಂಧಿಸುತ್ತವೆ ಮತ್ತು ವಿಶ್ವಾಸಾರ್ಹ CA ನಿಂದ ಸಹಿ ಮಾಡಲ್ಪಡುತ್ತವೆ.',
      ta: 'டிஜிட்டல் சான்றிதழ்கள் (X.509) ஒரு டொமைன் அடையாளத்தை பொது விசையுடன் இணைத்து நம்பகமான CA ஆல் கையொப்பமிடப்படுகின்றன.',
      te: 'డిజిటల్ సర్టిఫికెట్లు (X.509) డొమైൻ గుర్తింపును పబ్లిక్ కీతో బంధిస్తాయి మరియు విశ్వసనీయ CA ద్వారా సంతకం చేయబడతాయి.',
      ml: 'ഡിജിറ്റൽ സർട്ടിഫിക്കറ്റുകൾ (X.509) ഒരു ഡൊമെയ്ൻ ഐഡന്റിറ്റിയെ പബ്ലിക് കീയുമായി ബന്ധിപ്പിക്കുകയും വിശ്വസനീയമായ CA ഒപ്പിടുകയും ചെയ്യുന്നു.'
    },
    https: {
      en: 'HTTPS runs HTTP inside an encrypted TLS tunnel on port 443, protecting credentials, cookies, and API payloads.',
      hi: 'HTTPS पोर्ट 443 पर एक एन्क्रिप्टेड TLS टनल के अंदर HTTP चलाता है, जिससे पासवर्ड और डेटा सुरक्षित रहते हैं।',
      kn: 'HTTPS ಪೋರ್ಟ್ 443 ರಲ್ಲಿ ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಿದ TLS ಸುರಂಗದೊಳಗೆ HTTP ಅನ್ನು ಚಲಾಯಿಸುತ್ತದೆ, ಪಾಸ್‌ವರ್ಡ್ ಮತ್ತು ಡೇಟಾವನ್ನು ರಕ್ಷಿಸುತ್ತದೆ.',
      ta: 'HTTPS போர்ட் 443 இல் மறைகுறியாக்கப்பட்ட TLS சுரங்கப்பாதையில் HTTP ஐ இயக்குகிறது.',
      te: 'HTTPS పోర్ట్ 443 వద్ద ఎన్‌క్రిప్ట్ చేయబడిన TLS టన్నెల్‌లో HTTP ని నడుపుతుంది, పాస్‌వర్డ్‌లు మరియు డేటాను రక్షిస్తుంది.',
      ml: 'HTTPS പോർട്ട് 443-ൽ എൻക്രിപ്റ്റ് ചെയ്ത TLS ടണലിനുള്ളിൽ HTTP പ്രവർത്തിപ്പിച്ച് ഡാറ്റയും പാസ്‌വേഡുകളും സംരക്ഷിക്കുന്നു.'
    }
  };

  // 104 Cybersecurity & Networking Technical Glossary Terms
  const CORE_TERMS = [
    ['TLS 1.3', 'Protocol', 'Modern IETF transport security standard (RFC 8446) with 1-RTT handshakes and mandatory Forward Secrecy.', 'HTTPS websites negotiating TLS_AES_256_GCM_SHA384.'],
    ['SSL 3.0', 'Protocol', 'Deprecated predecessor to TLS, vulnerable to POODLE and padding oracle attacks.', 'Disabled on modern browsers and servers.'],
    ['HTTPS', 'Protocol', 'HTTP encapsulated inside an encrypted TLS channel on TCP port 443.', 'Online banking login pages showing the lock icon.'],
    ['AES-256-GCM', 'Crypto', 'Authenticated Encryption with Associated Data (AEAD) cipher using a 256-bit key and 96-bit IV.', 'Encrypting TLS application traffic and verifying integrity.'],
    ['RSA-2048', 'Crypto', 'Asymmetric cryptosystem used for digital signatures and legacy key transport.', 'Signing X.509 certificates with RSA-PSS or PKCS#1.'],
    ['ECDHE', 'Crypto', 'Ephemeral Elliptic Curve Diffie-Hellman key agreement providing Forward Secrecy.', 'Client and server deriving matching 256-bit P-256 secrets.'],
    ['SHA-256', 'Hashing', 'Cryptographic 256-bit hash function producing a fixed 64-hex-character digest.', 'Verifying file integrity and computing PBKDF2 digests.'],
    ['X.509 Certificate', 'PKI', 'Standard format binding a public key to a domain subject, signed by a CA.', 'DigiCert-issued leaf certificate for example.com.'],
    ['Certificate Authority (CA)', 'PKI', 'Trusted entity that verifies domain ownership and digitally signs certificates.', 'Root CA pre-installed in OS/browser trust stores.'],
    ['PKI', 'PKI', 'Public Key Infrastructure managing keys, certificates, CAs, and revocation.', 'Enterprise TLS certificate lifecycle management.'],
    ['Forward Secrecy (PFS)', 'Crypto', 'Guarantees past sessions stay secret even if long-term private keys leak later.', 'Using ECDHE instead of static RSA key exchange.'],
    ['AEAD', 'Crypto', 'Cipher mode providing both confidentiality and integrity authentication in one pass.', 'AES-GCM and ChaCha20-Poly1305 in TLS 1.3.'],
    ['Nonce / IV', 'Crypto', 'Unique random value used once per encryption to prevent replay or keystream reuse.', '96-bit CSPRNG IV generated via crypto.getRandomValues().'],
    ['MITM Attack', 'Attack', 'Man-in-the-Middle attacker intercepts or alters traffic between two endpoints.', 'Rogue Wi-Fi hotspot attempting SSL stripping.'],
    ['Replay Attack', 'Attack', 'Attacker captures and re-transmits valid packets to repeat an action.', 'Blocked by TLS sequence numbers and random nonces.'],
    ['Eavesdropping', 'Attack', 'Passive sniffing of unencrypted network traffic to read sensitive data.', 'Capturing plaintext HTTP credentials on port 80.'],
    ['Certificate Spoofing', 'Attack', 'Presenting a forged or self-signed certificate to impersonate a server.', 'Browser blocking an untrusted CA warning.'],
    ['Data Tampering', 'Attack', 'Unauthorized modification of packets in transit.', 'AES-GCM authentication tag rejects modified ciphertext.'],
    ['PBKDF2', 'Auth', 'Password-Based Key Derivation Function using salt and high iteration counts.', '100,000-iteration PBKDF2-SHA256 for account passwords.'],
    ['Salt', 'Auth', 'Random bytes combined with a password before hashing to defeat rainbow tables.', '16-byte random salt stored alongside PBKDF2 hash.'],
    ['RBAC', 'Auth', 'Role-Based Access Control restricting actions by assigned user roles.', 'Blocking Student role (403) from Admin endpoints.'],
    ['XSS', 'Web', 'Cross-Site Scripting injects malicious scripts into trusted web pages.', 'Prevented via escapeHtml() and Content-Security-Policy.'],
    ['CSRF', 'Web', 'Cross-Site Request Forgery tricks a browser into sending authenticated requests.', 'Mitigated using SameSite=Lax/Strict cookies and tokens.'],
    ['SQL Injection', 'Web', 'Injecting SQL syntax into input fields to manipulate database queries.', 'Prevented using parameterized prepared statements.'],
    ['SSRF', 'Web', 'Server-Side Request Forgery abuses a server to probe internal networks.', 'Blocking 127.0.0.1 and 169.254.169.254 in URL probes.'],
    ['CSP', 'Web', 'Content-Security-Policy header restricting allowed script and resource origins.', 'script-src \'self\' https://cdn.jsdelivr.net.'],
    ['HSTS', 'Web', 'HTTP Strict Transport Security forces browsers to connect only over HTTPS.', 'Strict-Transport-Security: max-age=63072000.'],
    ['HttpOnly Cookie', 'Web', 'Cookie flag preventing client-side JavaScript from reading session tokens.', 'Protects tls_portal_session cookie during XSS.'],
    ['SAN', 'PKI', 'Subject Alternative Name extension listing valid hostnames for a certificate.', 'DNS:example.com, DNS:www.example.com.'],
    ['ClientHello', 'TLS', 'First TLS handshake message advertising versions, ciphers, and key_share.', 'Initiates 1-RTT TLS 1.3 negotiation.'],
    ['ServerHello', 'TLS', 'Server response selecting the cipher suite, version, and key_share.', 'Contains RFC 8446 downgrade protection sentinel.'],
    ['mTLS', 'TLS', 'Mutual TLS where both client and server verify X.509 certificates.', 'Zero-Trust microservice-to-microservice auth.'],
    ['PCAP / PCAPNG', 'Network', 'Binary packet capture formats used by Wireshark and TShark.', 'Inspecting Ethernet, IPv4, TCP, and TLS headers.'],
    ['Port 443', 'Network', 'Standard IANA TCP port for HTTPS (HTTP over TLS).', 'Encrypted web traffic.'],
    ['Port 80', 'Network', 'Standard IANA TCP port for unencrypted HTTP.', 'Plaintext web requests vulnerable to sniffing.'],
    ['Port 53', 'Network', 'Standard UDP/TCP port for Domain Name System (DNS) resolution.', 'Resolving example.com to its IPv4 address.']
  ];

  // Expand to 104 practical cybersecurity & networking terms cleanly
  const EXTRA_TERM_NAMES = [
    ['Port 22 (SSH)', 'Network', 'Encrypted remote shell and file transfer protocol on TCP port 22.'],
    ['TCP 3-Way Handshake', 'Network', 'SYN, SYN-ACK, ACK sequence establishing a reliable TCP connection.'],
    ['UDP', 'Network', 'Connectionless, low-latency transport protocol used by DNS and QUIC.'],
    ['IPv4', 'Network', '32-bit Internet Protocol addressing (e.g., 192.168.1.1).'],
    ['IPv6', 'Network', '128-bit Internet Protocol addressing solving IPv4 exhaustion.'],
    ['ICMP', 'Network', 'Control message protocol used by ping and traceroute diagnostics.'],
    ['ARP', 'Network', 'Resolves IPv4 addresses to MAC hardware addresses on a LAN.'],
    ['DNS', 'Network', 'Translates human-readable domain names into IP addresses.'],
    ['DNSSEC', 'Network', 'Cryptographically signs DNS records to prevent cache poisoning.'],
    ['NAT', 'Network', 'Network Address Translation mapping private IPs to public IPs.'],
    ['VLAN', 'Network', 'Virtual LAN segmenting broadcast domains at Layer 2.'],
    ['Firewall', 'Defense', 'Filters inbound/outbound network traffic based on security rules.'],
    ['IDS', 'Defense', 'Intrusion Detection System alerting on suspicious traffic patterns.'],
    ['IPS', 'Defense', 'Intrusion Prevention System actively blocking detected attacks.'],
    ['WAF', 'Defense', 'Web Application Firewall filtering HTTP/HTTPS attacks like SQLi/XSS.'],
    ['SIEM', 'Defense', 'Security Information and Event Management aggregating logs and alerts.'],
    ['SOC', 'Defense', 'Security Operations Center monitoring and responding to threats 24/7.'],
    ['Zero Trust', 'Defense', 'Security model requiring continuous verification regardless of network location.'],
    ['VPN', 'Network', 'Virtual Private Network creating an encrypted tunnel over public networks.'],
    ['IPsec', 'Crypto', 'Network-layer protocol suite authenticating and encrypting IP packets.'],
    ['HMAC', 'Crypto', 'Hash-based Message Authentication Code verifying integrity with a secret key.'],
    ['HKDF', 'Crypto', 'HMAC-based Key Derivation Function mandated in TLS 1.3.'],
    ['KDF', 'Crypto', 'Key Derivation Function stretching secrets into cryptographic keys.'],
    ['CSPRNG', 'Crypto', 'Cryptographically Secure Pseudo-Random Number Generator (getRandomValues).'],
    ['Symmetric Encryption', 'Crypto', 'Uses the same shared secret key for encryption and decryption (e.g., AES).'],
    ['Asymmetric Encryption', 'Crypto', 'Uses a public/private key pair (e.g., RSA-OAEP).'],
    ['Digital Signature', 'Crypto', 'Cryptographic proof of authenticity, integrity, and non-repudiation.'],
    ['Avalanche Effect', 'Crypto', 'Small input change flips ~50% of bits in a cryptographic hash output.'],
    ['Collision Resistance', 'Crypto', 'Infeasibility of finding two distinct inputs with the same hash digest.'],
    ['Cipher Suite', 'TLS', 'Agreed set of key exchange, authentication, encryption, and hash algorithms.'],
    ['ChaCha20-Poly1305', 'Crypto', 'Modern high-speed AEAD stream cipher supported in TLS 1.3.'],
    ['OCSP', 'PKI', 'Online Certificate Status Protocol checking real-time certificate revocation.'],
    ['CRL', 'PKI', 'Certificate Revocation List publishing revoked serial numbers.'],
    ['SNI', 'TLS', 'Server Name Indication sending the target hostname in ClientHello.'],
    ['0-RTT Resumption', 'TLS', 'TLS 1.3 early data mode trading replay resistance for zero round-trip latency.'],
    ['Downgrade Attack', 'Attack', 'Forcing endpoints to negotiate a weaker legacy protocol or cipher.'],
    ['SSL Stripping', 'Attack', 'Downgrading HTTPS links to plaintext HTTP during an MITM attack.'],
    ['Phishing', 'Attack', 'Social engineering tricking users into revealing credentials on fake sites.'],
    ['Punycode (IDN)', 'Web', 'ASCII encoding (xn--) representing Unicode domains, sometimes abused in lookalikes.'],
    ['Brute Force', 'Attack', 'Trying all possible keys or passwords systematically.'],
    ['Rainbow Table', 'Attack', 'Precomputed hash lookup table defeated by per-user random salts.'],
    ['DDoS', 'Attack', 'Distributed Denial of Service overwhelming availability with traffic floods.'],
    ['Ransomware', 'Malware', 'Malware encrypting victim files and demanding payment for decryption.'],
    ['Trojan', 'Malware', 'Malicious software disguised as legitimate software.'],
    ['Keylogger', 'Malware', 'Captures keystrokes to steal passwords and private messages.'],
    ['Rootkit', 'Malware', 'Hides malicious processes or files deep within the OS kernel.'],
    ['Privilege Escalation', 'Attack', 'Gaining higher permissions (e.g., standard user to admin/root).'],
    ['Directory Traversal', 'Web', 'Using ../ sequences to read restricted files outside web root.'],
    ['Clickjacking', 'Web', 'Tricking users into clicking hidden UI elements; blocked by X-Frame-Options: DENY.'],
    ['Session Hijacking', 'Web', 'Stealing a valid session cookie or token to impersonate a user.'],
    ['JWT', 'Auth', 'JSON Web Token for signed stateless claims between client and server.'],
    ['OAuth 2.0', 'Auth', 'Authorization framework granting scoped access without sharing passwords.'],
    ['MFA / 2FA', 'Auth', 'Multi-Factor Authentication requiring 2+ independent verification factors.'],
    ['Rate Limiting', 'Defense', 'Throttling excessive API requests (HTTP 429) to prevent abuse.'],
    ['Audit Log', 'Defense', 'Chronological record of security-sensitive admin and user actions.'],
    ['CORS', 'Web', 'Cross-Origin Resource Sharing controlling which origins can read API responses.'],
    ['SameSite Cookie', 'Web', 'Cookie attribute restricting cross-site cookie transmission.'],
    ['CVE', 'Vuln', 'Common Vulnerabilities and Exposures unique identifier for public flaws.'],
    ['CVSS', 'Vuln', 'Common Vulnerability Scoring System rating severity from 0.0 to 10.0.'],
    ['Zero-Day', 'Vuln', 'Previously unknown vulnerability without an available vendor patch.'],
    ['Sandboxing', 'Defense', 'Isolating untrusted code execution from the host system.'],
    ['Honeypot', 'Defense', 'Decoy system deployed to detect and study attacker behavior.'],
    ['Least Privilege', 'Defense', 'Granting users/services only the minimum permissions required.'],
    ['Defense in Depth', 'Defense', 'Layering multiple independent security controls across the stack.'],
    ['CIA Triad', 'Concept', 'Confidentiality, Integrity, and Availability — core security pillars.'],
    ['Non-Repudiation', 'Concept', 'Assurance that a sender cannot deny signing or sending a message.'],
    ['Chain of Custody', 'Forensics', 'Documented timeline proving digital evidence was not tampered with.'],
    ['Steganography', 'Crypto', 'Hiding secret messages inside ordinary images, audio, or files.']
  ];

  const LANG_LABELS = {
    hi: 'हिन्दी अर्थ', kn: 'ಕನ್ನಡ ಅರ್ಥ', ta: 'தமிழ் பொருள்', te: 'తెలుగు అర్థం', ml: 'മലയാളം അർത്ഥം'
  };

  const GLOSSARY = [
    ...CORE_TERMS.map(([term, cat, def, ex]) => ({
      term, cat, def, ex,
      meanings: {
        hi: `${term}: ${def}`, kn: `${term}: ${def}`, ta: `${term}: ${def}`, te: `${term}: ${def}`, ml: `${term}: ${def}`
      }
    })),
    ...EXTRA_TERM_NAMES.map(([term, cat, def]) => ({
      term, cat, def, ex: `Observed in ${cat} labs and network security audits.`,
      meanings: {
        hi: `${LANG_LABELS.hi}: ${term} — ${def}`,
        kn: `${LANG_LABELS.kn}: ${term} — ${def}`,
        ta: `${LANG_LABELS.ta}: ${term} — ${def}`,
        te: `${LANG_LABELS.te}: ${term} — ${def}`,
        ml: `${LANG_LABELS.ml}: ${term} — ${def}`
      }
    }))
  ];

  // Key high-frequency glossary terms get rich native translations
  const NATIVE_GLOSSARY_OVERRIDES = {
    'TLS 1.3': {
      hi: 'आधुनिक परिवहन परत सुरक्षा प्रोटोकॉल (1-RTT हैंडशेक और अनिवार्य फॉरवर्ड सीक्रेसी)।',
      kn: 'ಆಧುನಿಕ ಟ್ರಾನ್ಸ್‌ಪೋರ್ಟ್ ಲೇಯರ್ ಸೆಕ್ಯುರಿಟಿ ಪ್ರೋಟೋಕಾಲ್ (1-RTT ಮತ್ತು ಫಾರ್ವರ್ಡ್ ಸೀಕ್ರೆಸಿ).',
      ta: 'நவீன போக்குவரத்து அடுக்கு பாதுகாப்பு நெறிமுறை (1-RTT மற்றும் முன்னோக்கு ரகசியம்).',
      te: 'ఆధునిక ట్రాన్స్‌పోర్ట్ లేయర్ సెక్యూரிటీ ప్రోటోకాల్ (1-RTT మరియు ఫార్వర్డ్ సీక్రసీ).',
      ml: 'ആധുനിക ട്രാൻസ്‌പോർട്ട് ലെയർ സെക്യൂരിറ്റി പ്രോട്ടോക്കോൾ (1-RTT, ഫോർവേഡ് സീക്രസി).'
    },
    'HTTPS': {
      hi: 'TLS एन्क्रिप्टेड टनल (पोर्ट 443) के भीतर सुरक्षित HTTP संचार।',
      kn: 'TLS ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಿದ ಸುರಂಗದ (ಪೋರ್ಟ್ 443) ಒಳಗೆ ಸುರಕ್ಷಿತ HTTP ಸಂವಹನ.',
      ta: 'TLS குறியாக்கப்பட்ட சுரங்கப்பாதைக்குள் (போர்ட் 443) பாதுகாப்பான HTTP.',
      te: 'TLS ఎన్‌క్రిప్టెడ్ టన్నెల్ (పోర్ట్ 443) లోపల సురక్షిత HTTP కమ్యూనికేషన్.',
      ml: 'TLS എൻക്രിപ്റ്റഡ് ടണലിനുള്ളിൽ (പോർട്ട് 443) സുരക്ഷിതമായ HTTP ആശയവിനിമയം.'
    },
    'MITM Attack': {
      hi: 'मैन-इन-द-मिडल हमला जिसमें हमलावर दो पक्षों के बीच डेटा को रोकता या बदलता है।',
      kn: 'ಮ್ಯಾನ್-ಇನ್-ದಿ-ಮಿಡಲ್ ದಾಳಿ: ಇಬ್ಬರ ನಡುವಿನ ಸಂವಹನವನ್ನು ತಡೆಯುವುದು ಅಥವಾ ಬದಲಾಯಿಸುವುದು.',
      ta: 'இரு தரப்பினருக்கு இடையிலான தரவை இடைமறித்து மாற்றும் தாக்குதல்.',
      te: 'ఇద్దరి మధ్య కమ్యూనికేషన్‌ను అడ్డుకుని మార్చే మ్యాన్-ఇన్-ది-మిడిల్ దాడి.',
      ml: 'രണ്ട് കക്ഷികൾക്കിടയിലുള്ള ഡാറ്റ ചോർത്തുകയോ മാറ്റുകയോ ചെയ്യുന്ന ആക്രമണം.'
    }
  };

  GLOSSARY.forEach((g) => {
    if (NATIVE_GLOSSARY_OVERRIDES[g.term]) {
      Object.assign(g.meanings, NATIVE_GLOSSARY_OVERRIDES[g.term]);
    }
  });

  window.I18N_DATA = {
    LANG_META,
    UI,
    CONCEPT_NOTES,
    GLOSSARY
  };
})();
