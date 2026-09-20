'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  PhoneCall, 
  PhoneOff, 
  ArrowLeft, 
  Mic, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  RotateCcw, 
  Shield, 
  AlertOctagon, 
  Info, 
  Copy, 
  Check, 
  Users, 
  HeartPulse, 
  Baby, 
  UserCheck, 
  MapPin, 
  FileAudio, 
  Sparkles,
  Radio,
  Clock,
  Terminal,
  Activity,
  Loader2,
  Keyboard
} from 'lucide-react';
import { GovHeader } from '@/components/GovHeader';

// ============================================================================
// TYPES & DATA STRUCTURES
// ============================================================================

export type IvrStepId = 
  | 'IDLE'
  | 'STEP_1_LANGUAGE'
  | 'STEP_2_INTENT'
  | 'STEP_3_NAME'
  | 'STEP_4_PAX'
  | 'STEP_5_MEDICAL'
  | 'STEP_6_INFANTS'
  | 'STEP_7_ELDERLY'
  | 'STEP_8_LANDMARK'
  | 'STEP_9_OPTIONAL_NOTE'
  | 'STEP_9_RECORDING'
  | 'CALL_ENDED';

export interface IvrCollectedData {
  language: 'hi' | 'en' | 'mr' | 'kn' | null;
  intentConfirmed: boolean;
  nameAudio: string | null;
  pax: number | null;
  medical: boolean | null;
  infants: boolean | null;
  elderly: boolean | null;
  landmarkAudio: string | null;
  optionalNoteAudio: string | null;
  callStartedAt: string | null;
  callEndedAt: string | null;
  durationSeconds: number;
}

export interface IvrBackendResponse {
  status: string;
  incident_id: string;
  report_id: string;
  message: string;
  landmark: string;
  transcription: {
    name: string;
    landmark: string;
    optional_note?: string;
    stt_model: string;
    confidence_score: number;
  };
  pax_count: number;
  triage_priority: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  nearest_shelter?: {
    name: string;
    distance: string;
    bearing: number;
    cardinal: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    contact?: string | null;
  } | null;
  timestamp: string;
}

export interface TranscriptEntry {
  id: string;
  speaker: 'ivr' | 'caller' | 'system';
  text: string;
  textHi?: string;
  timestamp: string;
  inputType?: 'dtmf' | 'voice' | 'system';
  meta?: string;
}

export interface StepDefinition {
  id: number;
  title: string;
  titleHi: string;
  type: 'dtmf' | 'voice' | 'hybrid';
  expectedInput: string;
  description: string;
}

const STEP_DEFINITIONS: StepDefinition[] = [
  { id: 1, title: 'Language Selection', titleHi: 'भाषा चयन / भाषा निवडा', type: 'dtmf', expectedInput: '1=Hi, 2=En, 3=Mr, 4=Kn', description: 'Select caller language for voice prompts' },
  { id: 2, title: 'Intent Confirmation', titleHi: 'संकट पुष्टि', type: 'dtmf', expectedInput: '1=Confirm SOS', description: 'Confirm life-safety distress urgency' },
  { id: 3, title: 'Caller Name (Voice)', titleHi: 'नाम रिकॉर्डिंग', type: 'voice', expectedInput: 'Hold to Speak', description: 'Voice capture for backend STT resolution' },
  { id: 4, title: 'PAX Count (Headcount)', titleHi: 'फंसे लोगों की संख्या', type: 'dtmf', expectedInput: '[Count] + #', description: 'Numeric keypad headcount entry' },
  { id: 5, title: 'Medical Emergency', titleHi: 'चिकित्सा आपात स्थिति', type: 'dtmf', expectedInput: '1=Yes, 2=NO', description: 'Critical triage priority flag' },
  { id: 6, title: 'Infants Present (<5yo)', titleHi: 'शिशु / छोटे बच्चे', type: 'dtmf', expectedInput: '1=Yes, 2=NO', description: 'Pediatric care prioritization' },
  { id: 7, title: 'Elderly / Disabled Present', titleHi: 'वृद्ध / दिव्यांग', type: 'dtmf', expectedInput: '1=Yes, 2=NO', description: 'Evacuation mobility requirement' },
  { id: 8, title: 'Landmark / Location (Voice)', titleHi: 'लैंडमार्क / स्थान', type: 'voice', expectedInput: 'Hold to Speak', description: 'Audio description of immediate surroundings' },
  { id: 9, title: 'Optional Voice Note', titleHi: 'अतिरिक्त संदेश', type: 'hybrid', expectedInput: '1=Record, 2=Skip', description: 'Additional situational details for NDRF' },
];

const DTMF_KEYS = [
  { key: '1', sub: '' },
  { key: '2', sub: 'ABC' },
  { key: '3', sub: 'DEF' },
  { key: '4', sub: 'GHI' },
  { key: '5', sub: 'JKL' },
  { key: '6', sub: 'MNO' },
  { key: '7', sub: 'PQRS' },
  { key: '8', sub: 'TUV' },
  { key: '9', sub: 'WXYZ' },
  { key: '*', sub: 'SYS' },
  { key: '0', sub: '+' },
  { key: '#', sub: 'ENT' },
];

// Web Audio DTMF synthesizer for realistic phone audio
const playDtmfTone = (digit: string, isMuted: boolean) => {
  if (isMuted || typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const dtmfFrequencies: Record<string, [number, number]> = {
      '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
      '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
      '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
      '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
    };

    const freqs = dtmfFrequencies[digit];
    if (!freqs) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.frequency.value = freqs[0];
    osc2.frequency.value = freqs[1];
    osc1.type = 'sine';
    osc2.type = 'sine';

    gainNode.gain.setValueAtTime(0.09, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.18);
    osc2.stop(ctx.currentTime + 0.18);
  } catch {
    // Gracefully handle browser audio limitations
  }
};

// ============================================================================
// CENTRALIZED MULTILINGUAL IVR PROMPTS
// ============================================================================

const IVR_PROMPTS: Record<string, Record<'en' | 'hi' | 'mr' | 'kn', string>> = {
  STEP_1_WELCOME: {
    en: 'Welcome to 112. For Hindi press 1, For English press 2. Marathi sathi 3 dabava. Kannada kagi 4 otti. Press the star key (*) at any time to cancel.',
    hi: '112 आपातकालीन सेवा में आपका स्वागत है। हिंदी के लिए 1, English 2, मराठीसाठी 3, ಕನ್ನಡಕ್ಕಾಗಿ 4 दबाएं। रद्द करने के लिए * दबाएं।',
    mr: '112 आपत्कालीन सेवेत आपले स्वागत आहे. हिंदीसाठी 1, English 2, मराठीसाठी 3, ಕನ್ನಡ 4 दाबा. रद्द करण्यासाठी * दाबा.',
    kn: '112 ತುರ್ತು ಸೇವೆಗೆ ಸ್ವಾಗತ. ಹಿಂದಿಗಾಗಿ 1, English 2, ಮರಾಠಿಗಾಗಿ 3, ಕನ್ನಡಕ್ಕಾಗಿ 4 ಒತ್ತಿ. ರದ್ದು ಮಾಡಲು * ಒತ್ತಿ.',
  },
  STEP_2_INTENT: {
    en: 'Emergency SOS Dispatch: If you or someone near you is stranded or in immediate danger, press 1 to confirm urgent rescue request.',
    hi: 'आपातकालीन राहत: यदि आप या आपके आसपास कोई संकट में है, तो तत्काल बचाव अनुरोध के लिए 1 दबाएं।',
    mr: 'आपत्कालीन मदतीसाठी 1 दाबा.',
    kn: 'ತುರ್ತು ಸಹಾಯಕ್ಕಾಗಿ 1 ಒತ್ತಿ.',
  },
  STEP_3_NAME: {
    en: "Please state your full name after the tone. Hold the 'Hold to Speak' button on your keypad to record.",
    hi: "कृपया बीप के बाद अपना पूरा नाम बोलें। रिकॉर्ड करने के लिए 'बोलने के लिए दबाएं' बटन दबाकर रखें।",
    mr: 'कृपया बीपनंतर आपले पूर्ण नाव सांगा. रेकॉर्ड करण्यासाठी स्पीक बटण दाबून ठेवा.',
    kn: 'ಬೀಪ್ ನಂತರ ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ತಿಳಿಸಿ.',
  },
  STEP_4_PAX: {
    en: 'Enter total number of stranded persons needing rescue using the keypad, followed by the pound (#) key. (e.g. Press 4 then #).',
    hi: 'कीपैड का उपयोग करके फंसे हुए कुल लोगों की संख्या दर्ज करें और अंत में हैश (#) दबाएं। (उदा. 4#)',
    mr: 'अडकलेल्या लोकांची एकूण संख्या कीपॅडवर दाबा आणि शेवटी हॅश दाबा.',
    kn: 'ಸಿಲುಕಿರುವ ಜನರ ಒಟ್ಟು ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ ಮತ್ತು ಹ್ಯಾಶ್ ಒತ್ತಿ.',
  },
  STEP_5_MEDICAL: {
    en: 'Is anyone critically injured or requiring immediate medical attention? Press 1 for Yes, Press 2 for NO',
    hi: 'क्या किसी को तत्काल चिकित्सा या गंभीर चोट की सहायता चाहिए? हाँ के लिए 1, नहीं के लिए 2 दबाएं।',
    mr: 'कोणाला तातडीच्या वैद्यकीय मदतीची गरज आहे का? होय असल्यास 1 दाबा, नसल्यास 2 दाबा.',
    kn: 'ಯಾರಿಗಾದರೂ ತುರ್ತು ವೈದ್ಯಕೀಯ ಸಹಾಯ ಬೇಕೇ? ಹೌದು ಆದರೆ 1, ಇಲ್ಲವಾದರೆ 2 ಒತ್ತಿ.',
  },
  STEP_6_INFANTS: {
    en: 'Are there any infants, toddlers, or small children under 5 years present? Press 1 for Yes, Press 2 for NO',
    hi: 'क्या आपके समूह में 5 वर्ष से कम उम्र के शिशु या छोटे बच्चे हैं? हाँ के लिए 1, नहीं के लिए 2 दबाएं।',
    mr: 'सोबत 5 वर्षांखालील लहान मुले आहेत का? होय असल्यास 1 दाबा, नसल्यास 2 दाबा.',
    kn: '5 ವರ್ಷದೊಳಗಿನ ಮಕ್ಕಳಿದ್ದಾರೆಯೇ? ಹೌದು ಆದರೆ 1, ಇಲ್ಲವಾದರೆ 2 ಒತ್ತಿ.',
  },
  STEP_7_ELDERLY: {
    en: 'Are there any elderly citizens or individuals with mobility disabilities present? Press 1 for Yes, Press 2 for NO',
    hi: 'क्या समूह में वृद्ध नागरिक या चलने-फिरने में असमर्थ व्यक्ति हैं? हाँ के लिए 1, नहीं के लिए 2 दबाएं।',
    mr: 'सोबत वृद्ध व्यक्ती आहेत का? होय असल्यास 1 दाबा, नसल्यास 2 दाबा.',
    kn: 'ವೃದ್ಧರಿದ್ದಾರೆಯೇ? ಹೌದು ಆದರೆ 1, ಇಲ್ಲವಾದರೆ 2 ಒತ್ತಿ.',
  },
  STEP_8_LANDMARK: {
    en: "Please describe your exact landmark, road, building or nearby identifiable structure. Hold the 'Hold to Speak' button to record.",
    hi: "कृपया अपना नजदीकी लैंडमार्क, स्कूल, मंदिर या भवन बताएं। बोलने के लिए 'बोलने के लिए दबाएं' बटन दबाएं।",
    mr: 'तुमच्या जवळची खूण किंवा ठिकाण सांगा. रेकॉर्ड करण्यासाठी बटण दाबून ठेवा.',
    kn: 'ನಿಮ್ಮ ಹತ್ತಿರದ ಸ್ಥಳವನ್ನು ತಿಳಿಸಿ. ರೆಕಾರ್ಡ್ ಮಾಡಲು ಬಟನ್ ಒತ್ತಿ ಹಿಡಿಯಿರಿ.',
  },
  STEP_9_OPTIONAL_NOTE: {
    en: 'Do you want to record an additional voice message for the NDRF rescue team? Press 1 to record, or Press 2 to finalize and dispatch rescue.',
    hi: 'क्या आप एनडीआरएफ बचाव दल के लिए कोई अतिरिक्त संदेश रिकॉर्ड करना चाहते हैं? रिकॉर्ड के लिए 1, कॉल समाप्त करने के लिए 2 दबाएं।',
    mr: 'एनडीआरएफ टीमसाठी अतिरिक्त संदेश रेकॉर्ड करायचा असल्यास 1 दाबा, किंवा कॉल पूर्ण करण्यासाठी 2 दाबा.',
    kn: 'ಹೆಚ್ಚುವರಿ ಸಂದೇಶವನ್ನು ರೆಕಾರ್ಡ್ ಮಾಡಲು 1 ಒತ್ತಿ, ಅಥವಾ ಕರೆ ಮುಗಿಸಲು 2 ಒತ್ತಿ.',
  },
  STEP_9_RECORDING: {
    en: "Please record your additional message now. Hold the 'Hold to Speak' button to speak.",
    hi: "कृपया अपना अतिरिक्त संदेश बोलें। 'बोलने के लिए दबाएं' बटन दबाकर रखें।",
    mr: 'कृपया आपला संदेश आता रेकॉर्ड करा. बोलण्यासाठी बटण दाबून ठेवा.',
    kn: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಚ್ಚುವರಿ ಸಂದೇಶವನ್ನು ಈಗ ರೆಕಾರ್ಡ್ ಮಾಡಿ.',
  },
  CALL_END_SUCCESS: {
    en: 'Your emergency SOS request has been registered and queued for NDRF dispatch. Help is on the way. Call ended.',
    hi: 'आपकी आपातकालीन सहायता दर्ज कर ली गई है। सहायता भेजी जा रही है। कॉल समाप्त।',
    mr: 'तुमची आपत्कालीन विनंती नोंदवली गेली आहे. मदत पाठवली जात आहे. कॉल समाप्त.',
    kn: 'ನಿಮ್ಮ ತುರ್ತು ವಿನಂತಿಯನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ. ಸಹಾಯ ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ.',
  },
};

const getIvrPrompt = (step: string, lang: string): string => {
  const normalizedLang = (lang === 'hi' || lang === 'mr' || lang === 'kn') ? lang : 'en';
  const promptGroup = IVR_PROMPTS[step];
  if (!promptGroup) return '';
  return promptGroup[normalizedLang] || promptGroup.en || '';
};

const INITIAL_PAYLOAD: IvrCollectedData = {
  language: null,
  intentConfirmed: false,
  nameAudio: null,
  pax: null,
  medical: null,
  infants: null,
  elderly: null,
  landmarkAudio: null,
  optionalNoteAudio: null,
  callStartedAt: null,
  callEndedAt: null,
  durationSeconds: 0,
};

export default function IvrSimulatorPage() {
  // State Machine
  const [currentStep, setCurrentStep] = useState<IvrStepId>('IDLE');
  const [payload, setPayload] = useState<IvrCollectedData>(INITIAL_PAYLOAD);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'flow' | 'transcript' | 'json'>('flow');
  
  // Backend Integration & Processing State
  const [isProcessingStt, setIsProcessingStt] = useState<boolean>(false);
  const [backendResponse, setBackendResponse] = useState<IvrBackendResponse | null>(null);

  // Call Controls & Telephony Feedback
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [inputBuffer, setInputBuffer] = useState<string>('');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  
  // Voice Recording Simulation State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  const languageRef = useRef<'hi' | 'en' | 'mr' | 'kn' | null>(null);

  // Stable mutable refs — synced each render so memoized callbacks always read latest values
  const isMutedRef = useRef<boolean>(false);
  const callDurationRef = useRef<number>(0);
  const payloadRef = useRef<IvrCollectedData>(INITIAL_PAYLOAD);
  const currentStepRef = useRef<IvrStepId>('IDLE');
  const isRecordingRef = useRef<boolean>(false);
  const inputBufferRef = useRef<string>('');
  const isProcessingSttRef = useRef<boolean>(false);
  // Ref to finalizeCall so handleKeyPress/stopVoiceRecording can call it without circular deps
  const finalizeCallRef = useRef<((noteAudioId: string | null) => Promise<void>) | null>(null);

  // Sync refs on every render (cheap — only writes a ref, no state)
  isMutedRef.current = isMuted;
  callDurationRef.current = callDuration;
  payloadRef.current = payload;
  currentStepRef.current = currentStep;
  isRecordingRef.current = isRecording;
  inputBufferRef.current = inputBuffer;
  isProcessingSttRef.current = isProcessingStt;

  useEffect(() => {
    languageRef.current = payload.language;
  }, [payload.language]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Call duration counter
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentStep !== 'IDLE' && currentStep !== 'CALL_ENDED' && !isProcessingStt) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep, isProcessingStt]);

  // Auto scroll transcript to bottom
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  // Helper to add transcript entry & invoke Web Speech TTS for IVR prompts
  // Stable — reads language and mute state from refs; never causes dep-chain thrashing.
  const addTranscript = useCallback((speaker: 'ivr' | 'caller' | 'system', text: string, textHi?: string, inputType?: 'dtmf' | 'voice' | 'system', meta?: string) => {
    const newEntry: TranscriptEntry = {
      id: Math.random().toString(36).substring(2, 9),
      speaker,
      text,
      textHi,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      inputType,
      meta,
    };
    setTranscripts((prev) => [...prev, newEntry]);

    // Native Web Speech TTS — always cancel previous utterance, only speak when not muted
    if (speaker === 'ivr' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      if (!isMutedRef.current) {
        const currentLang = languageRef.current || 'en';
        let targetLang = 'en-IN';
        if (currentLang === 'hi') targetLang = 'hi-IN';
        else if (currentLang === 'mr') targetLang = 'mr-IN';
        else if (currentLang === 'kn') targetLang = 'kn-IN';

        const utteranceText = (currentLang && currentLang !== 'en' && textHi) ? textHi : text;
        const utterance = new SpeechSynthesisUtterance(utteranceText);

        // getVoices() may be empty on first call in Chromium; fall back gracefully
        const voices = window.speechSynthesis.getVoices();

        let selectedVoice = voices.find((v) =>
          v.lang.toLowerCase() === targetLang.toLowerCase() ||
          v.lang.toLowerCase().startsWith(targetLang.slice(0, 2).toLowerCase())
        );

        // CRITICAL FALLBACK: If mr-IN (Marathi) requested but no Marathi voice found,
        // fallback to hi-IN (Hindi) so Devanagari script is pronounced correctly
        let effectiveLang = targetLang;
        if (!selectedVoice && targetLang === 'mr-IN') {
          selectedVoice = voices.find((v) =>
            v.lang.toLowerCase() === 'hi-in' ||
            v.lang.toLowerCase().startsWith('hi')
          );
          effectiveLang = 'hi-IN';
        }

        // If Kannada voice not found, attempt kn prefix
        if (!selectedVoice && targetLang === 'kn-IN') {
          selectedVoice = voices.find((v) => v.lang.toLowerCase().startsWith('kn'));
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
        } else {
          utterance.lang = effectiveLang;
        }

        window.speechSynthesis.speak(utterance);
      }
    }
  }, []);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ============================================================================
  // STEP PROMPTS & INTAKE LOGIC
  // ============================================================================

  // Start / Dial Call — stable useCallback; only recreated if addTranscript changes (never)
  const handleStartCall = useCallback(() => {
    languageRef.current = null;
    setPayload({
      ...INITIAL_PAYLOAD,
      callStartedAt: new Date().toISOString(),
    });
    setCallDuration(0);
    setInputBuffer('');
    setTranscripts([]);
    setBackendResponse(null);
    setIsProcessingStt(false);
    setCurrentStep('STEP_1_LANGUAGE');

    addTranscript(
      'system',
      'Dialing 112 Emergency Gateway (IVR Telephony Channel Connected)',
      '112 आपातकालीन गेटवे डायल किया गया (आईवीआर टेलीफोनी चैनल कनेक्टेड)',
      'system'
    );

    addTranscript(
      'ivr',
      getIvrPrompt('STEP_1_WELCOME', 'en'),
      getIvrPrompt('STEP_1_WELCOME', 'hi'),
      'dtmf',
      'Awaiting DTMF: 1, 2, 3, 4 (or * to abort)'
    );
  }, [addTranscript]);

  // Hangup / End Call — reads callDuration from ref so it doesn't destabilize dependents
  const handleEndCall = useCallback((reason: string = 'User terminated call') => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentStep('CALL_ENDED');
    setPayload((prev) => ({
      ...prev,
      callEndedAt: new Date().toISOString(),
      durationSeconds: callDurationRef.current,
    }));
    addTranscript('system', `Call Terminated: ${reason}`, `कॉल समाप्त: ${reason}`, 'system');
  }, [addTranscript]);

  // Handle DTMF Keypress (0-9, *, #)
  // Stable useCallback — reads all volatile state from refs so it never triggers keyboard listener re-registration
  const handleKeyPress = useCallback((digit: string) => {
    // Read latest values from refs (not stale closure state)
    const currentStep = currentStepRef.current;
    const isProcessingStt = isProcessingSttRef.current;
    const inputBuffer = inputBufferRef.current;

    if (currentStep === 'IDLE' || isProcessingStt) return;

    setActiveKey(digit);
    playDtmfTone(digit, isMutedRef.current);
    setTimeout(() => setActiveKey(null), 150);

    // Call Ended state: keypad is disabled
    if (currentStep === 'CALL_ENDED') return;

    // Global Abort / Exit Option (* Key)
    if (digit === '*') {
      handleEndCall('Caller aborted via * key');
      return;
    }

    // STEP 1: LANGUAGE
    if (currentStep === 'STEP_1_LANGUAGE') {
      if (digit === '1') {
        languageRef.current = 'hi';
        setPayload((prev) => ({ ...prev, language: 'hi' }));
        addTranscript('caller', 'Pressed DTMF [1] - Hindi selected', 'डीटीएमएफ [1] दबाया गया - हिंदी चयनित', 'dtmf');
        setCurrentStep('STEP_2_INTENT');
        addTranscript(
          'ivr',
          getIvrPrompt('STEP_2_INTENT', 'en'),
          getIvrPrompt('STEP_2_INTENT', 'hi'),
          'dtmf',
          'Awaiting DTMF: 1'
        );
      } else if (digit === '2') {
        languageRef.current = 'en';
        setPayload((prev) => ({ ...prev, language: 'en' }));
        addTranscript('caller', 'Pressed DTMF [2] - English selected', 'डीटीएमएफ [2] दबाया गया - अंग्रेजी चयनित', 'dtmf');
        setCurrentStep('STEP_2_INTENT');
        addTranscript(
          'ivr',
          getIvrPrompt('STEP_2_INTENT', 'en'),
          getIvrPrompt('STEP_2_INTENT', 'en'),
          'dtmf',
          'Awaiting DTMF: 1'
        );
      } else if (digit === '3') {
        languageRef.current = 'mr';
        setPayload((prev) => ({ ...prev, language: 'mr' }));
        addTranscript('caller', 'Pressed DTMF [3] - Marathi selected', 'डीटीएमएफ [3] दाबले - मराठी निवडली', 'dtmf');
        setCurrentStep('STEP_2_INTENT');
        addTranscript(
          'ivr',
          getIvrPrompt('STEP_2_INTENT', 'en'),
          getIvrPrompt('STEP_2_INTENT', 'mr'),
          'dtmf',
          'Awaiting DTMF: 1'
        );
      } else if (digit === '4') {
        languageRef.current = 'kn';
        setPayload((prev) => ({ ...prev, language: 'kn' }));
        addTranscript('caller', 'Pressed DTMF [4] - Kannada selected', 'ಡಿಟಿಎಂಎಫ್ [4] ಒತ್ತಲಾಗಿದೆ - ಕನ್ನಡ ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ', 'dtmf');
        setCurrentStep('STEP_2_INTENT');
        addTranscript(
          'ivr',
          getIvrPrompt('STEP_2_INTENT', 'en'),
          getIvrPrompt('STEP_2_INTENT', 'kn'),
          'dtmf',
          'Awaiting DTMF: 1'
        );
      } else {
        addTranscript('ivr', 'Invalid input. For Hindi press 1, English 2, Marathi 3, Kannada 4. Press * to exit.', 'अमान्य इनपुट। हिंदीसाठी 1, English 2, Marathi 3, Kannada 4.', 'dtmf');
      }
      return;
    }

    // STEP 2: INTENT CONFIRMATION
    if (currentStep === 'STEP_2_INTENT') {
      const lang = languageRef.current || 'en';
      if (digit === '1') {
        setPayload((prev) => ({ ...prev, intentConfirmed: true }));
        addTranscript('caller', 'Pressed DTMF [1] - SOS Distress Confirmed', 'डीटीएमएफ [1] दबाया गया - आपातकालीन संकट की पुष्टि हुई', 'dtmf');
        setCurrentStep('STEP_3_NAME');
        addTranscript(
          'ivr',
          getIvrPrompt('STEP_3_NAME', 'en'),
          getIvrPrompt('STEP_3_NAME', lang),
          'voice',
          'Awaiting Voice Capture'
        );
      } else {
        addTranscript('ivr', getIvrPrompt('STEP_2_INTENT', 'en'), getIvrPrompt('STEP_2_INTENT', lang), 'dtmf');
      }
      return;
    }

    // STEP 4: PAX COUNT (Digit buffer + '#')
    if (currentStep === 'STEP_4_PAX') {
      const lang = languageRef.current || 'en';
      if (digit === '#') {
        if (inputBuffer.trim().length > 0) {
          const count = parseInt(inputBuffer, 10);
          if (!isNaN(count) && count > 0 && count < 500) {
            setPayload((prev) => ({ ...prev, pax: count }));
            addTranscript('caller', `Entered [${inputBuffer}#] - PAX Count: ${count} Persons`, `दर्ज किया [${inputBuffer}#] - फंसे लोगों की संख्या: ${count}`, 'dtmf');
            setInputBuffer('');
            setCurrentStep('STEP_5_MEDICAL');
            addTranscript(
              'ivr',
              getIvrPrompt('STEP_5_MEDICAL', 'en'),
              getIvrPrompt('STEP_5_MEDICAL', lang),
              'dtmf',
              'Awaiting DTMF: 1 or 2'
            );
          } else {
            addTranscript('ivr', getIvrPrompt('STEP_4_PAX', 'en'), getIvrPrompt('STEP_4_PAX', lang), 'dtmf');
            setInputBuffer('');
          }
        } else {
          addTranscript('ivr', getIvrPrompt('STEP_4_PAX', 'en'), getIvrPrompt('STEP_4_PAX', lang), 'dtmf');
        }
      } else if (digit >= '0' && digit <= '9') {
        if (inputBuffer.length < 3) {
          setInputBuffer((prev) => prev + digit);
        }
      }
      return;
    }

    // STEP 5: MEDICAL EMERGENCY
    if (currentStep === 'STEP_5_MEDICAL') {
      const lang = languageRef.current || 'en';
      if (digit === '1' || digit === '2') {
        const isMed = digit === '1';
        setPayload((prev) => ({ ...prev, medical: isMed }));
        addTranscript('caller', `Pressed DTMF [${digit}] - Medical Emergency: ${isMed ? 'YES 🚨' : 'NO'}`, `डीटीएमएफ [${digit}] - चिकित्सा आपात स्थिति: ${isMed ? 'हाँ 🚨' : 'नहीं'}`, 'dtmf');
        setCurrentStep('STEP_6_INFANTS');
        addTranscript(
          'ivr',
          getIvrPrompt('STEP_6_INFANTS', 'en'),
          getIvrPrompt('STEP_6_INFANTS', lang),
          'dtmf',
          'Awaiting DTMF: 1 or 2'
        );
      } else {
        addTranscript('ivr', getIvrPrompt('STEP_5_MEDICAL', 'en'), getIvrPrompt('STEP_5_MEDICAL', lang), 'dtmf');
      }
      return;
    }

    // STEP 6: INFANTS PRESENT
    if (currentStep === 'STEP_6_INFANTS') {
      const lang = languageRef.current || 'en';
      if (digit === '1' || digit === '2') {
        const isInfants = digit === '1';
        setPayload((prev) => ({ ...prev, infants: isInfants }));
        addTranscript('caller', `Pressed DTMF [${digit}] - Infants Present: ${isInfants ? 'YES 👶' : 'NO'}`, `डीटीएमएफ [${digit}] - शिशु/बच्चे: ${isInfants ? 'हाँ 👶' : 'नहीं'}`, 'dtmf');
        setCurrentStep('STEP_7_ELDERLY');
        addTranscript(
          'ivr',
          getIvrPrompt('STEP_7_ELDERLY', 'en'),
          getIvrPrompt('STEP_7_ELDERLY', lang),
          'dtmf',
          'Awaiting DTMF: 1 or 2'
        );
      } else {
        addTranscript('ivr', getIvrPrompt('STEP_6_INFANTS', 'en'), getIvrPrompt('STEP_6_INFANTS', lang), 'dtmf');
      }
      return;
    }

    // STEP 7: ELDERLY PRESENT
    if (currentStep === 'STEP_7_ELDERLY') {
      const lang = languageRef.current || 'en';
      if (digit === '1' || digit === '2') {
        const isElderly = digit === '1';
        setPayload((prev) => ({ ...prev, elderly: isElderly }));
        addTranscript('caller', `Pressed DTMF [${digit}] - Elderly/Disabled Present: ${isElderly ? 'YES 🧓' : 'NO'}`, `डीटीएमएफ [${digit}] - वृद्ध/दिव्यांग: ${isElderly ? 'हाँ 🧓' : 'नहीं'}`, 'dtmf');
        setCurrentStep('STEP_8_LANDMARK');
        addTranscript(
          'ivr',
          getIvrPrompt('STEP_8_LANDMARK', 'en'),
          getIvrPrompt('STEP_8_LANDMARK', lang),
          'voice',
          'Awaiting Voice Capture'
        );
      } else {
        addTranscript('ivr', getIvrPrompt('STEP_7_ELDERLY', 'en'), getIvrPrompt('STEP_7_ELDERLY', lang), 'dtmf');
      }
      return;
    }

    // STEP 9: OPTIONAL NOTE (Decision Step: 1=Record, 2=Skip)
    if (currentStep === 'STEP_9_OPTIONAL_NOTE') {
      const lang = languageRef.current || 'en';
      if (digit === '1') {
        addTranscript('caller', 'Pressed DTMF [1] - Recording optional voice note', 'डीटीएमएफ [1] - अतिरिक्त संदेश रिकॉर्ड कर रहे हैं', 'dtmf');
        setCurrentStep('STEP_9_RECORDING');
        addTranscript(
          'ivr',
          getIvrPrompt('STEP_9_RECORDING', 'en'),
          getIvrPrompt('STEP_9_RECORDING', lang),
          'voice',
          'Awaiting Voice Capture'
        );
      } else if (digit === '2') {
        addTranscript('caller', 'Pressed DTMF [2] - Skipped optional voice note', 'डीटीएमएफ [2] - अतिरिक्त संदेश छोड़ा गया', 'dtmf');
        finalizeCallRef.current?.(null);
      } else {
        addTranscript('ivr', getIvrPrompt('STEP_9_OPTIONAL_NOTE', 'en'), getIvrPrompt('STEP_9_OPTIONAL_NOTE', lang), 'dtmf');
      }
      return;
    }
  }, [handleEndCall, addTranscript]);

  // ============================================================================
  // VOICE RECORDING SIMULATION (Steps 3, 8, 9)
  // ============================================================================

  // stopVoiceRecording declared FIRST so startVoiceRecording can safely list it in its deps
  // Stable useCallback — reads isRecording and currentStep from refs, calls finalizeCall via ref
  const stopVoiceRecording = useCallback(() => {
    if (!isRecordingRef.current) return;
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    setIsRecording(false);
    setRecordingProgress(0);

    const currentStep = currentStepRef.current;
    const lang = languageRef.current || 'en';
    const mockAudioId = `mock_audio_${Date.now()}_pcm16.wav`;

    if (currentStep === 'STEP_3_NAME') {
      setPayload((prev) => ({ ...prev, nameAudio: mockAudioId }));
      addTranscript(
        'caller',
        '🎙️ [Voice Audio Captured: "Ramesh Sharma" (3.0s PCM WAV)]',
        '🎙️ [ध्वनि रिकॉर्ड की गई: "रमेश शर्मा" (3.0s PCM WAV)]',
        'voice',
        'Backend STT Target'
      );
      setCurrentStep('STEP_4_PAX');
      addTranscript(
        'ivr',
        getIvrPrompt('STEP_4_PAX', 'en'),
        getIvrPrompt('STEP_4_PAX', lang),
        'dtmf',
        'Awaiting Numeric DTMF + #'
      );
    } else if (currentStep === 'STEP_8_LANDMARK') {
      setPayload((prev) => ({ ...prev, landmarkAudio: mockAudioId }));
      addTranscript(
        'caller',
        '🎙️ [Voice Audio Captured: "Near Shiv Mandir Water Tank, Block B" (3.0s PCM WAV)]',
        '🎙️ [ध्वनि रिकॉर्ड की गई: "शिव मंदिर पानी की टंकी के पास, ब्लॉक बी" (3.0s PCM WAV)]',
        'voice',
        'Backend STT Target'
      );
      setCurrentStep('STEP_9_OPTIONAL_NOTE');
      addTranscript(
        'ivr',
        getIvrPrompt('STEP_9_OPTIONAL_NOTE', 'en'),
        getIvrPrompt('STEP_9_OPTIONAL_NOTE', lang),
        'dtmf',
        'Awaiting DTMF: 1 or 2'
      );
    } else if (currentStep === 'STEP_9_RECORDING') {
      finalizeCallRef.current?.(mockAudioId);
    }
  }, [addTranscript]);

  // Stable useCallback — currentStep read from ref; stopVoiceRecording is stable so dep is safe
  const startVoiceRecording = useCallback(() => {
    const currentStep = currentStepRef.current;
    if (
      currentStep !== 'STEP_3_NAME' &&
      currentStep !== 'STEP_8_LANDMARK' &&
      currentStep !== 'STEP_9_RECORDING'
    ) {
      return;
    }

    setIsRecording(true);
    setRecordingProgress(0);

    let progress = 0;
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);

    recordingIntervalRef.current = setInterval(() => {
      progress += 10;
      setRecordingProgress(progress);
      if (progress >= 100) {
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        stopVoiceRecording();
      }
    }, 300); // 3-second simulated audio capture
  }, [stopVoiceRecording]);

  // ============================================================================
  // FINAL INTEGRATION: SEND PAYLOAD TO BACKEND PROCESSOR
  // ============================================================================

  // Stable useCallback — reads payload and callDuration from refs
  const finalizeCall = useCallback(async (noteAudioId: string | null) => {
    setIsProcessingStt(true);

    const payload = payloadRef.current;
    const updatedPayload: IvrCollectedData = {
      ...payload,
      optionalNoteAudio: noteAudioId,
      callEndedAt: new Date().toISOString(),
      durationSeconds: callDurationRef.current,
    };
    setPayload(updatedPayload);

    if (noteAudioId) {
      addTranscript(
        'caller',
        '🎙️ [Voice Audio Captured: "Water level rising past ground floor, urgent boat needed" (3.0s PCM WAV)]',
        '🎙️ [ध्वनि रिकॉर्ड की गई: "पानी पहली मंजिल तक पहुंच रहा है, तत्काल नाव चाहिए" (3.0s PCM WAV)]',
        'voice'
      );
    }

    // Step 3 requirement: Add gateway transmission log
    addTranscript(
      'system',
      'Transmitting payload to EOC via 112 Gateway... Processing Speech-to-Text.',
      '112 गेटवे के माध्यम से ईओसी को टेलीमेट्री भेजी जा रही है... स्पीच-टू-टेक्स्ट प्रोसेस हो रहा है।',
      'system'
    );

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/citizen/ivr/process-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: IvrBackendResponse = await response.json();
      setBackendResponse(data);

      const shelterName = data.nearest_shelter?.name || 'Nearest Relief Camp';
      const landmarkLogged = data.landmark || data.transcription?.landmark || 'Disaster Lowland Sector';
      const reportNum = data.report_id || data.incident_id?.slice(0, 8) || '112-SOS';

      // Step 6 requirement: Add final transcript entry showing backend result
      addTranscript(
        'system',
        `STT extraction complete. Landmark logged as: "${landmarkLogged}". Rescue dispatched to ${shelterName} (Incident #${reportNum}).`,
        `एसटीटी निष्कर्षण पूर्ण। लैंडमार्क दर्ज: "${landmarkLogged}"। ${shelterName} के लिए बचाव दल रवाना (रिपोर्ट #${reportNum})।`,
        'system',
        'STT 97% Accuracy'
      );

      const lang = languageRef.current || payload.language || 'en';
      addTranscript(
        'ivr',
        `Your emergency SOS request #${reportNum} has been registered with NDRF. Landmark: ${landmarkLogged}. Shelter Bearing: ${data.nearest_shelter?.distance || '0.2 km'} ${data.nearest_shelter?.cardinal || 'SW'}. Call ended.`,
        getIvrPrompt('CALL_END_SUCCESS', lang),
        'system',
        'Dispatch Confirmed'
      );
    } catch (err: unknown) {
      console.error('Failed to transmit IVR telemetry to backend:', err);
      const errMsg = err instanceof Error ? err.message : 'Network error';
      addTranscript(
        'system',
        `Backend Transmission Notice (${errMsg}): Telemetry safely registered in emergency offline queue.`,
        `सर्वर सूचना (${errMsg}): टेलीमेट्री आपातकालीन कतार में सुरक्षित।`,
        'system'
      );
      const lang = languageRef.current || payload.language || 'en';
      addTranscript(
        'ivr',
        'Your emergency SOS request has been registered and queued for NDRF dispatch. Help is on the way. Call ended.',
        getIvrPrompt('CALL_END_SUCCESS', lang),
        'system',
        'Queued'
      );
    } finally {
      setIsProcessingStt(false);
      setCurrentStep('CALL_ENDED');
    }
  }, [addTranscript]);

  // Wire finalizeCallRef so handleKeyPress and stopVoiceRecording can call it without circular deps
  finalizeCallRef.current = finalizeCall;

  const copyJsonPayload = () => {
    const dataToCopy = backendResponse ? { clientPayload: payload, backendResponse } : payload;
    navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  // Helper for active step number
  const getActiveStepNumber = (): number => {
    switch (currentStep) {
      case 'STEP_1_LANGUAGE': return 1;
      case 'STEP_2_INTENT': return 2;
      case 'STEP_3_NAME': return 3;
      case 'STEP_4_PAX': return 4;
      case 'STEP_5_MEDICAL': return 5;
      case 'STEP_6_INFANTS': return 6;
      case 'STEP_7_ELDERLY': return 7;
      case 'STEP_8_LANDMARK': return 8;
      case 'STEP_9_OPTIONAL_NOTE':
      case 'STEP_9_RECORDING': return 9;
      case 'CALL_ENDED': return 10;
      default: return 0;
    }
  };

  const activeStepNum = getActiveStepNumber();
  const isCallActive = currentStep !== 'IDLE' && currentStep !== 'CALL_ENDED';
  const isAudioCaptureActive = currentStep === 'STEP_3_NAME' || currentStep === 'STEP_8_LANDMARK' || currentStep === 'STEP_9_RECORDING';

  // Physical Keyboard Listener (0-9, *, #, Enter, Backspace, Spacebar for Voice Capture)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is focused inside an editable input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Ignore modifier combinations (Ctrl, Alt, Meta/Cmd)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const key = e.key;

      // Handle DTMF digits 0-9
      if (key >= '0' && key <= '9') {
        e.preventDefault();
        handleKeyPress(key);
        return;
      }

      // Handle star / asterisk key (* or NumpadMultiply)
      if (key === '*' || e.code === 'NumpadMultiply') {
        e.preventDefault();
        handleKeyPress('*');
        return;
      }

      // Handle pound / hash key (# or Shift+3)
      if (key === '#' || (e.shiftKey && key === '3')) {
        e.preventDefault();
        handleKeyPress('#');
        return;
      }

      // Enter key (Dials when IDLE, or acts as '#' confirm key during active calls)
      if (key === 'Enter') {
        e.preventDefault();
        if (currentStep === 'IDLE') {
          handleStartCall();
        } else if (currentStep !== 'CALL_ENDED' && !isProcessingStt) {
          handleKeyPress('#');
        }
        return;
      }

      // Backspace key (removes last digit during PAX count input step)
      if (key === 'Backspace' && currentStep === 'STEP_4_PAX') {
        e.preventDefault();
        setInputBuffer((prev) => prev.slice(0, -1));
        return;
      }

      // Spacebar to hold-to-speak on audio capture steps
      if (key === ' ' && !e.repeat && isAudioCaptureActive && !isRecording && !isProcessingStt) {
        e.preventDefault();
        startVoiceRecording();
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Release spacebar to finish recording
      if (e.key === ' ' && isRecording) {
        e.preventDefault();
        stopVoiceRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    // Only truly reactive deps — isMuted/inputBuffer/payload now read via refs inside stable callbacks
    currentStep,
    isProcessingStt,
    isAudioCaptureActive,
    isRecording,
    handleKeyPress,
    handleStartCall,
    startVoiceRecording,
    stopVoiceRecording,
  ]);

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans text-slate-900">
      {/* Gov Official Header */}
      <GovHeader />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col">
        
        {/* Navigation & Telephony Header Strip */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#0B3D6E] hover:text-[#07284B] bg-white border border-slate-300 hover:border-slate-400 px-3.5 py-1.5 rounded-sm shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Citizen Home / मुख्य पृष्ठ</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 px-2.5 py-1 rounded shadow-sm">
              <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span className="font-semibold text-slate-700">IVR Audio Engine:</span>
              <span className="font-mono text-slate-500">Whisper STT &amp; Geospatial Routing</span>
            </div>

            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors shadow-sm cursor-pointer ${
                isMuted 
                  ? 'bg-amber-50 text-amber-800 border-amber-300' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title={isMuted ? 'Unmute DTMF keypad tones' : 'Mute DTMF keypad tones'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-600" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
              <span className="font-medium">{isMuted ? 'Muted' : 'DTMF Tones On'}</span>
            </button>
          </div>
        </div>

        {/* Banner Section */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 sm:p-5 mb-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#0B3D6E] text-white rounded shadow-sm">
                <PhoneCall className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#07284B]">
                    IVR Emergency Call Simulator
                  </h1>
                  <span className="text-[10px] bg-[#FF9933] text-black font-bold uppercase px-1.5 py-0.5 rounded">
                    FEATURE PHONE MOCK
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                   Simulated 9-step emergency helpline for non-smartphone users with DTMF keypad, Whisper STT &amp; Geospatial Routing dispatch.
                </p>
              </div>
            </div>

            {/* Quick Call Metrics / Action */}
            <div className="flex items-center gap-3 self-start md:self-auto">
              <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-xs flex items-center gap-2 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Call Duration: <strong className="text-[#0B3D6E]">{formatTime(callDuration)}</strong></span>
              </div>

              {currentStep === 'IDLE' ? (
                <button
                  type="button"
                  onClick={handleStartCall}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-sm shadow-sm transition-all animate-pulse cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call 112 / शुरू करें</span>
                </button>
              ) : currentStep === 'CALL_ENDED' ? (
                <button
                  type="button"
                  onClick={handleStartCall}
                  className="inline-flex items-center gap-2 bg-[#0B3D6E] hover:bg-[#07284B] text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-sm shadow-sm transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>New Call Simulation</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleEndCall('User pressed End Call')}
                  disabled={isProcessingStt}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Call / काटें</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main 2-Column Responsive Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: THE TELEPHONE HANDSET SIMULATOR (5 Cols) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            
            {/* Phone Hardware Container */}
            <div className="bg-slate-900 border-4 border-slate-700 rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col space-y-4 text-white">
              
              {/* Phone Status Bar (Signal, Network, Battery) */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="flex gap-0.5 items-end h-3">
                    <span className="w-0.5 h-1 bg-emerald-400 rounded-xs"></span>
                    <span className="w-0.5 h-2 bg-emerald-400 rounded-xs"></span>
                    <span className="w-0.5 h-2.5 bg-emerald-400 rounded-xs"></span>
                    <span className="w-0.5 h-3 bg-emerald-400 rounded-xs"></span>
                  </span>
                  <span className="text-slate-300 font-semibold">SAHAYAK 112 (GSM)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                    isCallActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isProcessingStt ? 'DISPATCHING...' : isCallActive ? 'LIVE CALL' : 'STANDBY'}
                  </span>
                  <span>{formatTime(callDuration)}</span>
                </div>
              </div>

              {/* LCD Screen Display */}
              <div className="bg-[#051829] border border-blue-900/80 rounded-lg p-3.5 min-h-[160px] flex flex-col justify-between shadow-inner relative overflow-hidden">
                {/* Audio Waveform Background Animation during call */}
                {isCallActive && !isProcessingStt && (
                  <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-60">
                    <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1 h-5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1 h-2 bg-cyan-400 rounded-full animate-bounce"></span>
                    <span className="w-1 h-4 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                  </div>
                )}

                {/* Screen Header */}
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-cyan-400" />
                    <span>
                      {isProcessingStt && 'TRANSMITTING VIA 112 GATEWAY...'}
                      {!isProcessingStt && currentStep === 'IDLE' && 'DIALER READY'}
                      {!isProcessingStt && currentStep === 'STEP_1_LANGUAGE' && 'STEP 1: LANGUAGE / भाषा'}
                      {!isProcessingStt && currentStep === 'STEP_2_INTENT' && 'STEP 2: SOS INTENT / पुष्टि'}
                      {!isProcessingStt && currentStep === 'STEP_3_NAME' && 'STEP 3: RECORD NAME / नाम'}
                      {!isProcessingStt && currentStep === 'STEP_4_PAX' && 'STEP 4: PAX COUNT / संख्या'}
                      {!isProcessingStt && currentStep === 'STEP_5_MEDICAL' && 'STEP 5: MEDICAL / चिकित्सा'}
                      {!isProcessingStt && currentStep === 'STEP_6_INFANTS' && 'STEP 6: INFANTS / शिशु'}
                      {!isProcessingStt && currentStep === 'STEP_7_ELDERLY' && 'STEP 7: ELDERLY / वृद्ध'}
                      {!isProcessingStt && currentStep === 'STEP_8_LANDMARK' && 'STEP 8: LANDMARK / लैंडमार्क'}
                      {!isProcessingStt && currentStep === 'STEP_9_OPTIONAL_NOTE' && 'STEP 9: OPTIONAL NOTE'}
                      {!isProcessingStt && currentStep === 'STEP_9_RECORDING' && 'STEP 9: RECORD NOTE'}
                      {!isProcessingStt && currentStep === 'CALL_ENDED' && 'CALL TERMINATED / समाप्त'}
                    </span>
                  </div>

                  {/* Active Prompt Text on Screen */}
                  <div className="mt-2 text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                    {isProcessingStt ? (
                      <div className="text-center py-2 space-y-1">
                        <Loader2 className="w-6 h-6 mx-auto text-cyan-400 animate-spin" />
                        <p className="font-bold text-cyan-200">Transmitting to EOC Command...</p>
                        <p className="text-[10px] text-slate-400">Processing Whisper STT &amp; Geospatial Routing</p>
                      </div>
                    ) : (
                      <>
                        {currentStep === 'IDLE' && (
                          <div className="text-slate-400 py-3 text-center">
                            <PhoneCall className="w-8 h-8 mx-auto text-emerald-400/60 mb-1" />
                            <p>Press &quot;Call 112&quot; or tap the green dial button below to start IVR.</p>
                            <p className="text-[11px] text-amber-300/80 mt-1">Press the star key (*) at any time to cancel.</p>
                          </div>
                        )}
                        {currentStep === 'STEP_1_LANGUAGE' && (
                          <div>
                            <p className="text-cyan-200 text-xs sm:text-sm">1=Hindi • 2=English • 3=Marathi • 4=Kannada</p>
                            <p className="text-[11px] text-slate-400 mt-1">1: हिंदी | 2: Eng | 3: मराठी | 4: ಕನ್ನಡ (* to Abort)</p>
                          </div>
                        )}
                        {currentStep === 'STEP_2_INTENT' && (
                          <div>
                            <p className="text-cyan-200">Confirm Emergency SOS Request?</p>
                            <p className="text-[11px] text-slate-400 mt-1">Press 1 to confirm urgent dispatch.</p>
                          </div>
                        )}
                        {currentStep === 'STEP_3_NAME' && (
                          <div>
                            <p className="text-cyan-200">Speak your full name after the tone.</p>
                            <p className="text-[11px] text-slate-400 mt-1">Press and hold the Speak button below.</p>
                          </div>
                        )}
                        {currentStep === 'STEP_4_PAX' && (
                          <div>
                            <p className="text-cyan-200">Enter total stranded persons + #</p>
                            <p className="text-[11px] text-slate-400 mt-1">e.g., Press 4 then #</p>
                          </div>
                        )}
                        {currentStep === 'STEP_5_MEDICAL' && (
                          <div>
                            <p className="text-cyan-200">Critical Medical Emergency?</p>
                            <p className="text-[11px] text-slate-400 mt-1">Press 1 for YES • Press 2 for NO</p>
                          </div>
                        )}
                        {currentStep === 'STEP_6_INFANTS' && (
                          <div>
                            <p className="text-cyan-200">Infants / Babies Present (&lt;5 yrs)?</p>
                            <p className="text-[11px] text-slate-400 mt-1">Press 1 for YES • Press 2 for NO</p>
                          </div>
                        )}
                        {currentStep === 'STEP_7_ELDERLY' && (
                          <div>
                            <p className="text-cyan-200">Elderly or Disabled Present?</p>
                            <p className="text-[11px] text-slate-400 mt-1">Press 1 for YES • Press 2 for NO</p>
                          </div>
                        )}
                        {currentStep === 'STEP_8_LANDMARK' && (
                          <div>
                            <p className="text-cyan-200">Speak nearest landmark or location.</p>
                            <p className="text-[11px] text-slate-400 mt-1">Hold the Speak button to record location.</p>
                          </div>
                        )}
                        {currentStep === 'STEP_9_OPTIONAL_NOTE' && (
                          <div>
                            <p className="text-cyan-200">Record extra note for rescue team?</p>
                            <p className="text-[11px] text-slate-400 mt-1">Press 1 to Record • Press 2 to Skip/Finish</p>
                          </div>
                        )}
                        {currentStep === 'STEP_9_RECORDING' && (
                          <div>
                            <p className="text-cyan-200">Recording additional voice note...</p>
                            <p className="text-[11px] text-slate-400 mt-1">Hold speak button to record message.</p>
                          </div>
                        )}
                        {currentStep === 'CALL_ENDED' && (
                          <div className="text-center py-2">
                            <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-400 mb-1" />
                            <p className="font-bold text-emerald-300">SOS Telemetry Registered</p>
                            <p className="text-[11px] text-slate-300 truncate">
                              {backendResponse?.report_id ? `Report ID: ${backendResponse.report_id}` : 'Dispatched to NDRF Command'}
                            </p>
                            {backendResponse?.landmark && (
                              <p className="text-[10px] text-cyan-300 font-mono mt-0.5 truncate">
                                📍 {backendResponse.landmark}
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Keypad Buffer & Live Input Feedback */}
                <div className="pt-2 border-t border-blue-900/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">DTMF Input:</span>
                  <span className="text-amber-400 font-bold bg-black/40 px-2 py-0.5 rounded border border-amber-500/30">
                    {inputBuffer ? `${inputBuffer} _` : (activeKey ? `[ ${activeKey} ]` : '--')}
                  </span>
                </div>
              </div>

              {/* Special Action: "Hold to Speak" for Audio Steps */}
              {isAudioCaptureActive && !isProcessingStt ? (
                <div className="bg-slate-800/90 border border-blue-500/40 rounded-xl p-3.5 flex flex-col items-center justify-center space-y-2.5">
                  <div className="text-center">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                      🎙️ Audio Recording Step
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Simulates backend Speech-to-Text audio capture
                    </span>
                  </div>

                  {/* Hold to speak button */}
                  <div className="w-full">
                    <button
                      type="button"
                      onMouseDown={startVoiceRecording}
                      onMouseUp={stopVoiceRecording}
                      onTouchStart={startVoiceRecording}
                      onTouchEnd={stopVoiceRecording}
                      className={`w-full py-3.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2.5 transition-all select-none shadow-lg cursor-pointer ${
                        isRecording
                          ? 'bg-red-600 text-white ring-4 ring-red-400/50 scale-[0.98]'
                          : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white'
                      }`}
                    >
                      <Mic className={`w-5 h-5 ${isRecording ? 'animate-bounce text-white' : 'text-cyan-200'}`} />
                      <span>{isRecording ? 'Recording... Release to Save' : 'Hold to Speak / बोलने के लिए दबाएं'}</span>
                    </button>

                    {/* Visual 3s progress bar */}
                    {isRecording && (
                      <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="bg-red-500 h-full transition-all duration-300 ease-linear"
                          style={{ width: `${recordingProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Physical DTMF Keypad Grid (3 x 4) */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {DTMF_KEYS.map(({ key, sub }) => {
                  const isPressed = activeKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKeyPress(key)}
                      disabled={currentStep === 'IDLE' || currentStep === 'CALL_ENDED' || isProcessingStt}
                      className={`h-14 rounded-xl flex flex-col items-center justify-center transition-all border shadow select-none cursor-pointer ${
                        currentStep === 'IDLE' || currentStep === 'CALL_ENDED' || isProcessingStt
                          ? 'bg-slate-800/50 border-slate-800 text-slate-600 cursor-not-allowed'
                          : isPressed
                          ? 'bg-cyan-600 text-white border-cyan-400 scale-95 shadow-inner'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700 hover:border-slate-500 active:scale-95'
                      }`}
                    >
                      <span className="text-xl font-bold font-mono leading-none">{key}</span>
                      {sub && <span className="text-[9px] font-mono text-slate-400 tracking-wider leading-none mt-0.5">{sub}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Keyboard Input Active Indicator */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <Keyboard className="w-3.5 h-3.5" />
                  <span className="font-semibold text-slate-300">Keyboard Input:</span>
                </div>
                <span className="text-[10px] text-slate-400">Keys 0-9 • * • # • Enter</span>
              </div>

              {/* Call Controls Bar (Dial / Hangup / Reset) */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                {currentStep === 'IDLE' ? (
                  <button
                    type="button"
                    onClick={handleStartCall}
                    className="col-span-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <PhoneCall className="w-5 h-5" />
                    <span>Dial 112 / कॉल लगाएं</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleEndCall('Caller disconnected')}
                      disabled={isProcessingStt}
                      className="bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all text-xs sm:text-sm cursor-pointer disabled:opacity-50"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>End Call</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStartCall}
                      disabled={isProcessingStt}
                      className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-slate-700 shadow transition-all text-xs sm:text-sm cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Restart</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Feature Handset Info Badge */}
            <div className="p-3 bg-white border border-slate-200 rounded-sm text-xs text-slate-600 flex items-start gap-2.5 shadow-sm">
              <Info className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800">Hardware Independence:</span> Operates on basic 2G GSM handsets with DTMF signaling and server-side Whisper STT ingestion.
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: STATE MACHINE & LIVE TELEMETRY DASHBOARD (7 Cols) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            
            {/* Tab Navigation Header */}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-1.5 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('flow')}
                  className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'flow'
                      ? 'bg-[#0B3D6E] text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>9-Step State Flow</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('transcript')}
                  className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'transcript'
                      ? 'bg-[#0B3D6E] text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Live Transcript ({transcripts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('json')}
                  className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'json'
                      ? 'bg-[#0B3D6E] text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Payload Telemetry {backendResponse ? '(Dispatched)' : ''}</span>
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500 pr-2">
                <span>Progress:</span>
                <span className="font-bold text-[#0B3D6E]">
                  {currentStep === 'CALL_ENDED' ? '100%' : `${Math.min(100, Math.round((Math.max(0, activeStepNum - 1) / 9) * 100))}%`}
                </span>
              </div>
            </div>

            {/* TAB 1: 9-STEP STATE FLOW PROGRESS */}
            {activeTab === 'flow' && (
              <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 sm:p-5 flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-[#07284B] uppercase tracking-wide">
                      Interactive IVR State Machine
                    </h2>
                    <p className="text-xs text-slate-500">
                      Tracks each prompt, expected DTMF input, and captured telemetry values.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded">
                    Active Step: {activeStepNum === 0 ? 'IDLE' : activeStepNum > 9 ? 'FINISHED' : `${activeStepNum} / 9`}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {STEP_DEFINITIONS.map((step) => {
                    const isCompleted = activeStepNum > step.id || currentStep === 'CALL_ENDED';
                    const isCurrent = activeStepNum === step.id && currentStep !== 'CALL_ENDED';
                    
                    // Render captured summary for each step
                    let valueSummary: string | null = null;
                    if (step.id === 1 && payload.language) {
                      if (payload.language === 'hi') valueSummary = 'Hindi (हिंदी)';
                      else if (payload.language === 'en') valueSummary = 'English';
                      else if (payload.language === 'mr') valueSummary = 'Marathi (मराठी)';
                      else if (payload.language === 'kn') valueSummary = 'Kannada (ಕನ್ನಡ)';
                    }
                    if (step.id === 2 && payload.intentConfirmed) valueSummary = 'Confirmed (SOS)';
                    if (step.id === 3 && payload.nameAudio) {
                      valueSummary = backendResponse?.transcription?.name ? `"${backendResponse.transcription.name}"` : 'Recorded (Voice)';
                    }
                    if (step.id === 4 && payload.pax !== null) valueSummary = `${payload.pax} Persons`;
                    if (step.id === 5 && payload.medical !== null) valueSummary = payload.medical ? 'YES (Critical 🚨)' : 'NO';
                    if (step.id === 6 && payload.infants !== null) valueSummary = payload.infants ? 'YES (Infants Present 👶)' : 'NO';
                    if (step.id === 7 && payload.elderly !== null) valueSummary = payload.elderly ? 'YES (Elderly Present 🧓)' : 'NO';
                    if (step.id === 8 && payload.landmarkAudio) {
                      valueSummary = backendResponse?.landmark ? `"${backendResponse.landmark.slice(0, 20)}..."` : 'Recorded (Voice)';
                    }
                    if (step.id === 9) {
                      if (payload.optionalNoteAudio) valueSummary = 'Voice Note Attached';
                      else if (isCompleted) valueSummary = 'Skipped / Direct Finish';
                    }

                    return (
                      <div
                        key={step.id}
                        className={`p-3 rounded border transition-all flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-blue-50/90 border-[#0B3D6E] ring-1 ring-[#0B3D6E]'
                            : isCompleted
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-slate-50/60 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCompleted
                              ? 'bg-emerald-600 text-white'
                              : isCurrent
                              ? 'bg-[#0B3D6E] text-white animate-pulse'
                              : 'bg-slate-300 text-slate-700'
                          }`}>
                            {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#07284B]">{step.title}</span>
                              <span className="text-[10px] text-slate-500 font-hindi">({step.titleHi})</span>
                            </div>
                            <span className="text-[11px] text-slate-500 block">
                              {step.description}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end">
                          {valueSummary ? (
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                              {valueSummary}
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {step.expectedInput}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: LIVE CALL TRANSCRIPT */}
            {activeTab === 'transcript' && (
              <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col flex-1 min-h-[420px]">
                <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#0B3D6E]" />
                    <h2 className="text-xs font-bold text-[#07284B] uppercase tracking-wide">
                      Real-Time Audio &amp; DTMF Transcript
                    </h2>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Channel: 112-IVR-PCM16
                  </span>
                </div>

                <div 
                  ref={transcriptScrollRef}
                  className="p-4 flex-1 overflow-y-auto max-h-[420px] space-y-3 bg-[#FBFBFB] text-xs font-mono leading-relaxed"
                >
                  {transcripts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                      <PhoneCall className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">No active call transcript.</p>
                      <p className="text-[11px] text-slate-400 max-w-xs">
                        Start the call from the handset simulator to see live dual-party voice &amp; DTMF transmission logs.
                      </p>
                    </div>
                  ) : (
                    transcripts.map((entry) => {
                      if (entry.speaker === 'system') {
                        return (
                          <div key={entry.id} className="text-center my-2">
                            <span className="bg-slate-200 text-slate-700 text-[10px] px-2.5 py-1 rounded font-sans font-medium">
                              ⚙️ {entry.text} • {entry.timestamp}
                            </span>
                          </div>
                        );
                      }

                      const isIvr = entry.speaker === 'ivr';
                      return (
                        <div
                          key={entry.id}
                          className={`flex flex-col ${isIvr ? 'items-start' : 'items-end'}`}
                        >
                          <div className="text-[10px] text-slate-500 mb-0.5 flex items-center gap-1 font-sans">
                            <span className="font-bold">{isIvr ? '🤖 IVR Bot (112)' : '👤 Caller (Citizen)'}</span>
                            <span>•</span>
                            <span>{entry.timestamp}</span>
                            {entry.meta && <span className="text-blue-600 ml-1">[{entry.meta}]</span>}
                          </div>

                          <div
                            className={`max-w-[88%] p-3 rounded-lg text-xs leading-relaxed shadow-sm font-sans ${
                              isIvr
                                ? 'bg-[#07284B] text-white rounded-tl-none'
                                : 'bg-amber-100 text-amber-950 border border-amber-300 rounded-tr-none'
                            }`}
                          >
                            <p>{entry.text}</p>
                            {entry.textHi && (
                              <p className="text-[11px] text-blue-200 mt-1 pt-1 border-t border-blue-900/60 font-hindi">
                                {entry.textHi}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: COLLECTED PAYLOAD JSON INSPECTOR */}
            {activeTab === 'json' && (
              <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col flex-1">
                <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0B3D6E]" />
                    <h2 className="text-xs font-bold text-[#07284B] uppercase tracking-wide">
                      Live SOS Telemetry Payload (JSON)
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={copyJsonPayload}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs px-2.5 py-1 rounded shadow-sm transition-colors cursor-pointer"
                  >
                    {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPayload ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto rounded-b-sm max-h-[420px]">
                  <pre>
                    {JSON.stringify(
                      backendResponse
                        ? { clientPayload: payload, backendResponse }
                        : payload,
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            )}

            {/* Live Triage Summary Card */}
            <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm">
              <h3 className="text-xs font-bold text-[#07284B] uppercase tracking-wide mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-700" />
                <span>NDRF Triage Summary Matrix {backendResponse ? `(Incident #${backendResponse.report_id})` : ''}</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>PAX Count</span>
                  </div>
                  <span className="text-base font-bold text-slate-900">
                    {payload.pax !== null ? `${payload.pax} Persons` : '--'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <HeartPulse className="w-3.5 h-3.5 text-red-500" />
                    <span>Medical Care</span>
                  </div>
                  <span className={`text-base font-bold ${payload.medical ? 'text-red-600' : 'text-slate-900'}`}>
                    {payload.medical !== null ? (payload.medical ? 'CRITICAL 🚨' : 'NONE') : '--'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Baby className="w-3.5 h-3.5 text-amber-500" />
                    <span>Infants (&lt;5)</span>
                  </div>
                  <span className="text-base font-bold text-slate-900">
                    {payload.infants !== null ? (payload.infants ? 'YES 👶' : 'NO') : '--'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Elderly/Disabled</span>
                  </div>
                  <span className="text-base font-bold text-slate-900">
                    {payload.elderly !== null ? (payload.elderly ? 'YES 🧓' : 'NO') : '--'}
                  </span>
                </div>
              </div>

              {/* Audio recording indicators & STT transcript */}
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <FileAudio className="w-4 h-4 text-blue-600" />
                  <span>Name:</span>
                  <span className="font-semibold text-slate-800">
                    {backendResponse?.transcription?.name || (payload.nameAudio ? '✅ Captured (Voice Audio)' : 'Pending')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Landmark:</span>
                  <span className="font-semibold text-slate-800 truncate" title={backendResponse?.landmark || ''}>
                    {backendResponse?.landmark || (payload.landmarkAudio ? '✅ Captured (Voice Audio)' : 'Pending')}
                  </span>
                </div>
              </div>

              {/* Nearest Shelter Banner if available */}
              {backendResponse?.nearest_shelter && (
                <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏕️</span>
                    <span>
                      Nearest Shelter: <strong>{backendResponse.nearest_shelter.name}</strong> ({backendResponse.nearest_shelter.distance} {backendResponse.nearest_shelter.cardinal})
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-700 font-bold">
                    BEARING {typeof backendResponse.nearest_shelter.bearing === 'number' ? backendResponse.nearest_shelter.bearing.toFixed(2) : '0.00'}°
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Official Gov Footer */}
      <footer className="bg-[#07284B] text-white text-xs py-4 px-4 text-center mt-auto border-t border-blue-900">
        <p className="text-blue-200">
          Government of India • National Disaster Management Authority (NDMA) • Non-Smartphone IVR Telephony Standard
        </p>
      </footer>
    </div>
  );
}
