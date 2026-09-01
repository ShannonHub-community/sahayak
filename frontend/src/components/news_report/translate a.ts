import type { NextApiRequest, NextApiResponse } from 'next';
import type { TranslationRequest, TranslationResponse, LanguageCode } from '@/types/translation';

// Localized disaster advisory templates for standalone / demo mock testing
const SAMPLE_DICTIONARY: Record<LanguageCode, { prefix: string; damNotice: string; imdNotice: string }> = {
  en: {
    prefix: '',
    damNotice: 'Dam Sluice Gate Discharge Advisory',
    imdNotice: 'Red Alert for Extremely Heavy Downpour',
  },
  hi: {
    prefix: '[हिन्दी अनुवाद]',
    damNotice: 'बांध के गेट खोलने और भारी जल प्रवाह की आधिकारिक सूचना',
    imdNotice: 'अत्यधिक भारी बारिश की चेतावनी (रेड अलर्ट)',
  },
  mr: {
    prefix: '[मराठी भाषांतर]',
    damNotice: 'धरण विसर्ग व पूर नियंत्रण तातडीची सूचना',
    imdNotice: 'अतिवृष्टीचा इशारा व आपत्कालीन सर्तकता (रेड अलर्ट)',
  },
  bn: {
    prefix: '[বাংলা অনুবাদ]',
    damNotice: 'বাঁধের গেট খোলার এবং বন্যা নিয়ন্ত্রণ জরুরি বিজ্ঞপ্তি',
    imdNotice: 'প্রবল বৃষ্টির লাল সতর্কতা (রেড অ্যালার্ট)',
  },
  gu: {
    prefix: '[ગુજરાતી અનુવાદ]',
    damNotice: 'ડેમ સ્લુઇસ ગેટ ડિસ્ચાર્જ અને પૂર ચેતવણી સલાહ',
    imdNotice: 'અતિ ભારે વરસાદ માટે રેડ એલર્ટ',
  },
  kn: {
    prefix: '[ಕನ್ನಡ ಅನುವಾದ]',
    damNotice: 'ಆಣೆಕಟ್ಟು ಗೇಟ್ ತೆರೆಯುವಿಕೆ ಮತ್ತು ಪ್ರವಾಹ ಮುನ್ನೆಚ್ಚರಿಕೆ',
    imdNotice: 'ಅತ್ಯಂತ ಭಾರಿ ಮಳೆಯ ರೆಡ್ ಅಲರ್ಟ್ ಮುನ್ಸೂಚನೆ',
  },
  ml: {
    prefix: '[മലയാളം പരിഭാഷ]',
    damNotice: 'ഡാം ഷട്ടറുകൾ തുറക്കുന്നത് സംബന്ധിച്ച മുന്നറിയിപ്പ്',
    imdNotice: 'തീവ്ര മഴയ്ക്കുള്ള റെഡ് അലർട്ട് ജാഗ്രതാ നിർദേശം',
  },
  or: {
    prefix: '[ଓଡ଼ିଆ ଅନୁବାଦ]',
    damNotice: 'ଡ୍ୟାମ ଗେଟ୍ ଖୋଲିବା ଏବଂ ବନ୍ୟା ନିୟନ୍ତ୍ରଣ ସୂଚନା',
    imdNotice: 'ପ୍ରବଳ ବର୍ଷା ପାଇଁ ରେଡ୍ ଆଲର୍ଟ ସତର୍କତା',
  },
  pa: {
    prefix: '[ਪੰਜਾਬੀ ਅਨੁਵਾਦ]',
    damNotice: 'ਡੈਮ ਦੇ ਗੇਟ ਖੋਲ੍ਹਣ ਅਤੇ ਹੜ੍ਹ ਚੇਤਾਵਨੀ ਸਲਾਹ',
    imdNotice: 'ਬਹੁਤ ਭਾਰੀ ਮੀਂਹ ਲਈ ਰੈੱਡ ਅਲਰਟ ਚੇਤਾਵਨੀ',
  },
  ta: {
    prefix: '[தமிழ் மொழிபெயர்ப்பு]',
    damNotice: 'அணை மதகுகள் திறப்பு மற்றும் வெள்ள அபாய எச்சரிக்கை',
    imdNotice: 'மிக கனமழைக்கான ரெட் அலர்ட் எச்சரிக்கை',
  },
  te: {
    prefix: '[తెలుగు అనువాదం]',
    damNotice: 'డ్యామ్ గేట్ల ఎత్తివేత మరియు వరద ముప్పు హెచ్చరిక',
    imdNotice: 'అత్యంత భారీ వర్ష సూచన (రెడ్ అలర్ట్ హెచ్చరిక)',
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TranslationResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { language, items } = req.body as TranslationRequest;

    if (!language || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid translation payload structure' });
    }

    const dict = SAMPLE_DICTIONARY[language] || SAMPLE_DICTIONARY.en;

    // Simulate backend Sarvam translation pipeline
    const translatedItems = items.map((item) => {
      let translatedTitle = item.title;
      let translatedMessage = item.message;

      if (language !== 'en') {
        if (item.title.toLowerCase().includes('dam')) {
          translatedTitle = `${dict.damNotice} — ${item.title.split('—')[1] || item.title}`;
        } else if (item.title.toLowerCase().includes('red alert') || item.title.toLowerCase().includes('downpour')) {
          translatedTitle = `${dict.imdNotice} — ${item.title.split('—')[1] || item.title}`;
        } else {
          translatedTitle = `${dict.prefix} ${item.title}`;
        }

        translatedMessage = `${dict.prefix} ${item.message}`;
      }

      return {
        id: item.id,
        title: translatedTitle,
        message: translatedMessage,
      };
    });

    return res.status(200).json({ items: translatedItems });
  } catch (err: any) {
    console.error('Error in translate API:', err);
    return res.status(500).json({ error: 'Internal Server Error during translation' });
  }
}
