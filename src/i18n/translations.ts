import type { LanguageCode } from '../types/drishti';

export interface TranslationBundle {
  appName: string;
  tagline: string;
  skipToMain: string;
  onlineLabel: string;
  offlineLabel: string;
  listenCommand: string;
  stopListening: string;
  speakStop: string;
  nav: {
    dashboard: string;
    camera: string;
    ocr: string;
    voice: string;
    navigation: string;
    currency: string;
    finder: string;
    learning: string;
    sos: string;
    tools: string;
    settings: string;
    help: string;
  };
  onboarding: {
    welcomeTitle: string;
    welcomeBody: string;
    chooseLanguage: string;
    testSpeech: string;
    speechSample: string;
    privacyTitle: string;
    privacyBody: string;
    startButton: string;
    signInLink: string;
  };
  dashboard: {
    heading: string;
    subheading: string;
    cameraTitle: string;
    cameraDesc: string;
    ocrTitle: string;
    ocrDesc: string;
    navTitle: string;
    navDesc: string;
    finderTitle: string;
    finderDesc: string;
    currencyTitle: string;
    currencyDesc: string;
    sosTitle: string;
    sosDesc: string;
    secondaryHeading: string;
  };
  safety: {
    visionDisclaimer: string;
    medicineWarning: string;
    currencyWarning: string;
    navigationWarning: string;
  };
  common: {
    loading: string;
    retry: string;
    cancel: string;
    save: string;
    delete: string;
    play: string;
    pause: string;
    resume: string;
    repeat: string;
    uploadImage: string;
    startCamera: string;
    stopCamera: string;
    captureAnalyze: string;
    backHome: string;
    confidenceLabel: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, TranslationBundle> = {
  en: {
    appName: 'DRISHTI',
    tagline: 'Your AI Visual Companion',
    skipToMain: 'Skip to main content',
    onlineLabel: 'Online — AI vision & routing ready',
    offlineLabel: 'Offline — Local OCR, Color Detector & SOS contacts active',
    listenCommand: 'Speak Command',
    stopListening: 'Stop Listening',
    speakStop: 'Stop Speaking',
    nav: {
      dashboard: 'Home',
      camera: 'Camera',
      ocr: 'Read Text',
      voice: 'Voice',
      navigation: 'Navigate',
      currency: 'Currency',
      finder: 'Finder',
      learning: 'Learning',
      sos: 'SOS',
      tools: 'Tools',
      settings: 'Settings',
      help: 'Help',
    },
    onboarding: {
      welcomeTitle: 'Welcome to DRISHTI',
      welcomeBody:
        'A calm, voice-first visual companion built for blind and low-vision users. Choose your preferred language, test spoken feedback, and review our privacy pledges.',
      chooseLanguage: 'Select Spoken & Display Language',
      testSpeech: 'Test Spoken Voice',
      speechSample: 'Namaste. This is DRISHTI, your AI visual companion. Your voice speed is comfortable and clear.',
      privacyTitle: 'Privacy & Safety by Design',
      privacyBody:
        'Camera, microphone, and location are requested only when you trigger a tool. Images are never retained unnecessarily, and Emergency SOS never contacts anyone without your explicit confirmation.',
      startButton: 'Enter DRISHTI Dashboard',
      signInLink: 'Sign in or sync account',
    },
    dashboard: {
      heading: 'What would you like to do?',
      subheading: 'Tap any large action card, use Tab or TalkBack gestures, or press Speak Command.',
      cameraTitle: 'AI Camera Assistant',
      cameraDesc: 'Describe surroundings and identify visible objects aloud.',
      ocrTitle: 'OCR Text Reader',
      ocrDesc: 'Read books, documents, menus, and medicine labels offline.',
      navTitle: 'Accessible Navigation',
      navDesc: 'Spoken route guidance, GPS location, and consent-based sharing.',
      finderTitle: 'Everyday Object Finder',
      finderDesc: 'Search camera frames for keys, glasses, bottles, or essentials.',
      currencyTitle: 'Currency Recognition',
      currencyDesc: 'Identify Indian Rupee notes with tactile verification cues.',
      sosTitle: 'Emergency SOS',
      sosDesc: 'Reach trusted contacts with explicit two-step confirmation.',
      secondaryHeading: 'More Assistive Tools',
    },
    safety: {
      visionDisclaimer:
        'AI vision describes a single camera frame and cannot guarantee obstacle detection or safe road crossing. Always rely on your white cane, guide dog, and physical awareness.',
      medicineWarning:
        'Important safety notice: Always verify medicine dosage, strength, and expiry date with a pharmacist, caregiver, or tactile label before taking medication.',
      currencyWarning:
        'Currency detection is an assistive estimate and not guaranteed. Confirm high-value notes using tactile bleed lines or trusted assistance.',
      navigationWarning:
        'Navigation aids never replace a white cane, guide dog, or traffic judgment at crossings.',
    },
    common: {
      loading: 'Processing...',
      retry: 'Try Again',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      play: 'Read Aloud',
      pause: 'Pause',
      resume: 'Resume',
      repeat: 'Repeat',
      uploadImage: 'Choose Image File',
      startCamera: 'Enable Camera',
      stopCamera: 'Turn Off Camera',
      captureAnalyze: 'Capture & Analyze',
      backHome: 'Back to Home',
      confidenceLabel: 'Confidence',
    },
  },
  kn: {
    appName: 'ದೃಷ್ಟಿ (DRISHTI)',
    tagline: 'ನಿಮ್ಮ AI ದೃಶ್ಯ ಸಹಾಯಕ',
    skipToMain: 'ಮುಖ್ಯ ವಿಷಯಕ್ಕೆ ತೆರಳಿ',
    onlineLabel: 'ಆನ್‌ಲೈನ್ — AI ದೃಶ್ಯ ಮತ್ತು ಮಾರ್ಗದರ್ಶನ ಸಿದ್ಧ',
    offlineLabel: 'ಆಫ್‌ಲೈನ್ — ಸ್ಥಳೀಯ OCR, ಬಣ್ಣ ಗುರುತಿಸುವಿಕೆ ಮತ್ತು SOS ಸಂಪರ್ಕಗಳು ಸಕ್ರಿಯ',
    listenCommand: 'ಧ್ವನಿ ಆಜ್ಞೆ ನೀಡಿ',
    stopListening: 'ಆಲಿಸುವುದನ್ನು ನಿಲ್ಲಿಸಿ',
    speakStop: 'ಮಾತು ನಿಲ್ಲಿಸಿ',
    nav: {
      dashboard: 'ಮುಖಪುಟ',
      camera: 'ಕ್ಯಾಮೆರಾ',
      ocr: 'ಪಠ್ಯ ಓದಿ',
      voice: 'ಧ್ವನಿ',
      navigation: 'ಮಾರ್ಗದರ್ಶನ',
      currency: 'ನೋಟು ಗುರುತು',
      finder: 'ವಸ್ತು ಹುಡುಕಿ',
      learning: 'ಕಲಿಕೆ',
      sos: 'SOS ತುರ್ತು',
      tools: 'ಸಾಧನಗಳು',
      settings: 'ಸಿದ್ಧತೆಗಳು',
      help: 'ಸಹಾಯ',
    },
    onboarding: {
      welcomeTitle: 'ದೃಷ್ಟಿ (DRISHTI) ಗೆ ಸ್ವಾಗತ',
      welcomeBody:
        'ಅಂಧರು ಮತ್ತು ಕಡಿಮೆ ದೃಷ್ಟಿ ಹೊಂದಿರುವವರಿಗಾಗಿ ಧ್ವನಿ-ಮೊದಲ ದೃಶ್ಯ ಸಹಾಯಕ. ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ, ಧ್ವನಿಯನ್ನು ಪರೀಕ್ಷಿಸಿ ಮತ್ತು ಗೌಪ್ಯತೆ ನಿಯಮಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.',
      chooseLanguage: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
      testSpeech: 'ಧ್ವನಿಯನ್ನು ಪರೀಕ್ಷಿಸಿ',
      speechSample: 'ನಮಸ್ಕಾರ. ಇದು ದೃಷ್ಟಿ, ನಿಮ್ಮ AI ದೃಶ್ಯ ಸಹಾಯಕ. ಧ್ವನಿ ವೇಗ ಸ್ಪಷ್ಟವಾಗಿದೆ.',
      privacyTitle: 'ಗೌಪ್ಯತೆ ಮತ್ತು ಸುರಕ್ಷತೆ',
      privacyBody:
        'ನೀವು ಅನುಮತಿ ನೀಡಿದಾಗ ಮಾತ್ರ ಕ್ಯಾಮೆರಾ, ಮೈಕ್ರೋಫೋನ್ ಮತ್ತು ಸ್ಥಳವನ್ನು ಬಳಸಲಾಗುತ್ತದೆ. ನಿಮ್ಮ ಒಪ್ಪಿಗೆಯಿಲ್ಲದೆ ತುರ್ತು ಸಂದೇಶಗಳನ್ನು ಕಳುಹಿಸಲಾಗುವುದಿಲ್ಲ.',
      startButton: 'ಮುಖಪುಟಕ್ಕೆ ಪ್ರವೇಶಿಸಿ',
      signInLink: 'ಖಾತೆಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ',
    },
    dashboard: {
      heading: 'ನೀವು ಏನು ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?',
      subheading: 'ದೊಡ್ಡ ಗುಂಡಿಯನ್ನು ಒತ್ತಿ ಅಥವಾ ಧ್ವನಿ ಆಜ್ಞೆ ನೀಡಿ.',
      cameraTitle: 'AI ಕ್ಯಾಮೆರಾ ಸಹಾಯಕ',
      cameraDesc: 'ಸುತ್ತಮುತ್ತಲಿನ ದೃಶ್ಯ ಮತ್ತು ವಸ್ತುಗಳನ್ನು ಧ್ವನಿಯಲ್ಲಿ ವಿವರಿಸುತ್ತದೆ.',
      ocrTitle: 'ಪಠ್ಯ ಓದುಗ (OCR)',
      ocrDesc: 'ಪುಸ್ತಕಗಳು, ದಾಖಲೆಗಳು ಮತ್ತು ಔಷಧಿ ಚೀಟಿಗಳನ್ನು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಓದಿ.',
      navTitle: 'ಸುಲಭ ಮಾರ್ಗದರ್ಶನ',
      navDesc: 'ಧ್ವನಿ ಮಾರ್ಗದರ್ಶನ, GPS ಸ್ಥಳ ಮತ್ತು ಒಪ್ಪಿಗೆ-ಆಧಾರಿತ ಹಂಚಿಕೆ.',
      finderTitle: 'ವಸ್ತು ಹುಡುಕುವ ಸಾಧನ',
      finderDesc: 'ಕೀಲಿಗಳು, ಕನ್ನಡಕ ಅಥವಾ ಬಾಟಲಿಯನ್ನು ಕ್ಯಾಮೆರಾದಲ್ಲಿ ಹುಡುಕಿ.',
      currencyTitle: 'ಭಾರತೀಯ ನೋಟು ಗುರುತು',
      currencyDesc: 'ಭಾರತೀಯ ರೂಪಾಯಿ ನೋಟುಗಳನ್ನು ಸ್ಪರ್ಶ ಸೂಚನೆಗಳೊಂದಿಗೆ ಗುರುತಿಸಿ.',
      sosTitle: 'ತುರ್ತು SOS',
      sosDesc: 'ದೃಢೀಕರಣದ ನಂತರ ವಿಶ್ವಾಸಾರ್ಹ ಸಂಪರ್ಕಗಳಿಗೆ ತಿಳಿಸಿ.',
      secondaryHeading: 'ಇತರ ಸಹಾಯಕ ಸಾಧನಗಳು',
    },
    safety: {
      visionDisclaimer:
        'AI ದೃಶ್ಯ ವಿವರಣೆಯು ಬಿಳಿ ಕೋಲು, ಮಾರ್ಗದರ್ಶಿ ನಾಯಿ ಅಥವಾ ಸುರಕ್ಷಿತ ರಸ್ತೆ ದಾಟುವ ತೀರ್ಪಿಗೆ ಪರ್ಯಾಯವಲ್ಲ.',
      medicineWarning:
        'ಪ್ರಮುಖ ಎಚ್ಚರಿಕೆ: ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳುವ ಮೊದಲು ಪ್ರಮಾಣ ಮತ್ತು ಅವಧಿ ಮುಗಿಯುವ ದಿನಾಂಕವನ್ನು ಔಷಧಿ ತಜ್ಞರಿಂದ ದೃಢೀಕರಿಸಿ.',
      currencyWarning:
        'ನೋಟು ಗುರುತಿಸುವಿಕೆ ಸಹಾಯಕ ಅಂದಾಜು ಮಾತ್ರ. ಸ್ಪರ್ಶ ಗುರುತುಗಳಿಂದ ದೃಢಪಡಿಸಿ.',
      navigationWarning:
        'ಮಾರ್ಗದರ್ಶನವು ಬಿಳಿ ಕೋಲು ಅಥವಾ ಸುರಕ್ಷಿತ ದಾಟುವ ಎಚ್ಚರಿಕೆಗೆ ಬದಲಿಯಲ್ಲ.',
    },
    common: {
      loading: 'ಪ್ರಕ್ರಿಯೆ ನಡೆಯುತ್ತಿದೆ...',
      retry: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
      cancel: 'ರದ್ದುಮಾಡಿ',
      save: 'ಉಳಿಸಿ',
      delete: 'ಅಳಿಸಿ',
      play: 'ಗಟ್ಟಿಯಾಗಿ ಓದಿ',
      pause: 'ವಿರಾಮ',
      resume: 'ಮುಂದುವರಿಸಿ',
      repeat: 'ಮತ್ತೆ ಓದಿ',
      uploadImage: 'ಚಿತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
      startCamera: 'ಕ್ಯಾಮೆರಾ ಆನ್ ಮಾಡಿ',
      stopCamera: 'ಕ್ಯಾಮೆರಾ ಆಫ್ ಮಾಡಿ',
      captureAnalyze: 'ಚಿತ್ರ ತೆಗೆದು ವಿಶ್ಲೇಷಿಸಿ',
      backHome: 'ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ',
      confidenceLabel: 'ವಿಶ್ವಾಸಾರ್ಹತೆ',
    },
  },
  hi: {
    appName: 'दृष्टि (DRISHTI)',
    tagline: 'आपका AI दृश्य साथी',
    skipToMain: 'मुख्य सामग्री पर जाएं',
    onlineLabel: 'ऑनलाइन — AI विज़न और नेविगेशन तैयार',
    offlineLabel: 'ऑफ़लाइन — स्थानीय OCR, रंग पहचान और SOS संपर्क सक्रिय',
    listenCommand: 'आवाज़ से आदेश दें',
    stopListening: 'सुनना बंद करें',
    speakStop: 'बोलना बंद करें',
    nav: {
      dashboard: 'होम',
      camera: 'कैमरा',
      ocr: 'पाठ पढ़ें',
      voice: 'आवाज़',
      navigation: 'नेविगेशन',
      currency: 'नोट पहचान',
      finder: 'वस्तु खोजें',
      learning: 'अध्ययन',
      sos: 'SOS आपातकाल',
      tools: 'उपकरण',
      settings: 'सेटिंग्स',
      help: 'सहायता',
    },
    onboarding: {
      welcomeTitle: 'दृष्टि (DRISHTI) में आपका स्वागत है',
      welcomeBody:
        'दृष्टिहीन और कम दृष्टि वाले उपयोगकर्ताओं के लिए आवाज़-प्रमुख दृश्य साथी। अपनी भाषा चुनें, आवाज़ की गति जांचें और गोपनीयता नियम पढ़ें।',
      chooseLanguage: 'अपनी भाषा चुनें',
      testSpeech: 'आवाज़ जांचें',
      speechSample: 'नमस्ते। यह दृष्टि है, आपका AI दृश्य साथी। आवाज़ की गति स्पष्ट है।',
      privacyTitle: 'गोपनीयता और सुरक्षा',
      privacyBody:
        'कैमरा, माइक्रोफ़ोन और लोकेशन केवल आपकी अनुमति से चालू होते हैं। आपकी स्पष्ट पुष्टि के बिना कोई आपातकालीन संदेश नहीं भेजा जाता।',
      startButton: 'होम डैशबोर्ड खोलें',
      signInLink: 'साइन इन या सिंक करें',
    },
    dashboard: {
      heading: 'आप क्या करना चाहते हैं?',
      subheading: 'किसी भी बड़े बटन को दबाएं या आवाज़ से आदेश दें।',
      cameraTitle: 'AI कैमरा सहायक',
      cameraDesc: 'आसपास के दृश्य और वस्तुओं को बोलकर समझाता है।',
      ocrTitle: 'टेक्स्ट रीडर (OCR)',
      ocrDesc: 'किताबें, दस्तावेज़ और दवा की पर्ची ऑफ़लाइन पढ़ें।',
      navTitle: 'सुलभ नेविगेशन',
      navDesc: 'बोलकर रास्ता, GPS स्थिति और अनुमति-आधारित लोकेशन साझा।',
      finderTitle: 'वस्तु खोजक',
      finderDesc: 'कैमरे में चाबी, चश्मा या बोतल ढूंढें।',
      currencyTitle: 'भारतीय नोट पहचान',
      currencyDesc: 'स्पर्श संकेतों के साथ भारतीय रुपये के नोट पहचानें।',
      sosTitle: 'आपातकालीन SOS',
      sosDesc: 'दो-चरणीय पुष्टि के साथ विश्वसनीय संपर्कों को सूचित करें।',
      secondaryHeading: 'अन्य सहायक उपकरण',
    },
    safety: {
      visionDisclaimer:
        'AI दृश्य विवरण सफ़ेद छड़ी, गाइड डॉग या सुरक्षित सड़क पार करने के निर्णय का विकल्प नहीं है।',
      medicineWarning:
        'महत्वपूर्ण चेतावनी: दवा लेने से पहले खुराक और समाप्ति तिथि की पुष्टि फार्मासिस्ट या देखभालकर्ता से अवश्य करें।',
      currencyWarning:
        'नोट पहचान केवल सहायक अनुमान है। कृपया स्पर्श रेखाओं या विश्वसनीय व्यक्ति से पुष्टि करें।',
      navigationWarning:
        'नेविगेशन सहायता सफ़ेद छड़ी या यातायात सुरक्षा निर्णय की जगह नहीं ले सकती।',
    },
    common: {
      loading: 'प्रक्रिया जारी है...',
      retry: 'फिर से प्रयास करें',
      cancel: 'रद्द करें',
      save: 'सहेजें',
      delete: 'हटाएं',
      play: 'बोलकर सुनाएं',
      pause: 'रोकें',
      resume: 'जारी रखें',
      repeat: 'दोहराएं',
      uploadImage: 'छवि फ़ाइल चुनें',
      startCamera: 'कैमरा चालू करें',
      stopCamera: 'कैमरा बंद करें',
      captureAnalyze: 'फ़ोटो लें और जांचें',
      backHome: 'होम पर लौटें',
      confidenceLabel: 'विश्वसनीयता',
    },
  },
};

export function getSpeechLocale(lang: LanguageCode): string {
  if (lang === 'kn') return 'kn-IN';
  if (lang === 'hi') return 'hi-IN';
  return 'en-IN';
}
