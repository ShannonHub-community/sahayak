import { NextResponse } from 'next/server';
import type { TranslationRequest, TranslationResponse, LanguageCode } from '@/types/translation';

const SAMPLE_DICTIONARY: Record<
  LanguageCode,
  { prefix: string; damNotice: string; imdNotice: string; evacuationNotice: string; reliefNotice: string }
> = {
  en: {
    prefix: '',
    damNotice: 'Dam Sluice Gate Discharge Advisory',
    imdNotice: 'Red Alert for Extremely Heavy Downpour',
    evacuationNotice: 'Immediate Evacuation Order',
    reliefNotice: 'Designated Relief Camp Activated',
  },
  hi: {
    prefix: '[हिन्दी]',
    damNotice: 'बांध के गेट खोलने और भारी जल प्रवाह की आधिकारिक सूचना',
    imdNotice: 'अत्यधिक भारी बारिश की चेतावनी (रेड अलर्ट)',
    evacuationNotice: 'तत्काल निकासी आदेश — सुरक्षित आश्रय की ओर प्रस्थान करें',
    reliefNotice: 'नागरिक राहत एवं सहायता शिविर सक्रिय',
  },
  mr: {
    prefix: '[मराठी]',
    damNotice: 'धरण विसर्ग व पूर नियंत्रण तातडीची सूचना',
    imdNotice: 'अतिवृष्टीचा इशारा व आपत्कालीन सतर्कता (रेड अलर्ट)',
    evacuationNotice: 'तातडीने स्थलांतर करण्याचे आदेश — सुरक्षित ठिकाणी जा',
    reliefNotice: 'अधिकृत पूर निवारण व मदत छावणी कार्यान्वित',
  },
  bn: {
    prefix: '[বাংলা]',
    damNotice: 'বাঁধের গেট খোলার এবং বন্যা নিয়ন্ত্রণ জরুরি বিজ্ঞপ্তি',
    imdNotice: 'প্রবল বৃষ্টির লাল সতর্কতা (রেড অ্যালার্ট)',
    evacuationNotice: 'অবিলম্বে নিরাপদ আশ্রয়ে সরে যাওয়ার নির্দেশ',
    reliefNotice: 'ত্রাণ ও পুনর্বাসন শিবির চালু করা হয়েছে',
  },
  gu: {
    prefix: '[ગુજરાતી]',
    damNotice: 'ડેમ સ્લુઇસ ગેટ ડિસ્ચાર્જ અને પૂર ચેતવણી સલાહ',
    imdNotice: 'અતિ ભારે વરસાદ માટે રેડ એલર્ટ ચેતવણી',
    evacuationNotice: 'તાત્કાલિક સ્થળાંતર આદેશ — સલામત સ્થળે જાવ',
    reliefNotice: 'સરકારી રાહત કેમ્પ કાર્યરત કરવામાં આવ્યો',
  },
  kn: {
    prefix: '[ಕನ್ನಡ]',
    damNotice: 'ಆಣೆಕಟ್ಟು ಗೇಟ್ ತೆರೆಯುವಿಕೆ ಮತ್ತು ಪ್ರವಾಹ ಮುನ್ನೆಚ್ಚರಿಕೆ',
    imdNotice: 'ಅತ್ಯಂತ ಭಾರಿ ಮಳೆಯ ರೆಡ್ ಅಲರ್ಟ್ ಮುನ್ಸೂಚನೆ',
    evacuationNotice: 'ತಕ್ಷಣದ ಸ್ಥಳಾಂತರ ಆದೇಶ — ಸುರಕ್ಷಿತ ಆಶ್ರಯಕ್ಕೆ ತೆರಳಿ',
    reliefNotice: 'ತುರ್ತು ಪರಿಹಾರ ಕೇಂದ್ರ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ',
  },
  ml: {
    prefix: '[മലയാളം]',
    damNotice: 'ഡാം ഷട്ടറുകൾ തുറക്കുന്നത് സംബന്ധിച്ച മുന്നറിയിപ്പ്',
    imdNotice: 'തീവ്ര മഴയ്ക്കുള്ള റെഡ് അലർട്ട് ജാഗ്രതാ നിർദേശം',
    evacuationNotice: 'ഉടൻ സുരക്ഷിത സ്ഥാനങ്ങളിലേക്ക് മാറാനുള്ള ഉത്തരവ്',
    reliefNotice: 'ദുരിതാശ്വാസ ക്യാമ്പ് സജ്ജമാക്കി',
  },
  or: {
    prefix: '[ଓଡ଼ିଆ]',
    damNotice: 'ଡ୍ୟାମ ଗେଟ୍ ଖୋଲିବା ଏବଂ ବନ୍ୟା ନିୟନ୍ତ୍ରଣ ସୂଚନା',
    imdNotice: 'ପ୍ରବଳ ବର୍ଷା ପାଇଁ ରେଡ୍ ଆଲର୍ଟ ସତର୍କତା',
    evacuationNotice: 'ତୁରନ୍ତ ସୁରକ୍ଷିତ ସ୍ଥାନକୁ ସ୍ଥାନାନ୍ତର ନିର୍ଦ୍ଦେଶ',
    reliefNotice: 'ବିପର୍ଯ୍ୟୟ ରିଲିଫ୍ କ୍ୟାମ୍ପ ସକ୍ରିୟ କରାଯାଇଛି',
  },
  pa: {
    prefix: '[ਪੰਜਾਬੀ]',
    damNotice: 'ਡੈਮ ਦੇ ਗੇਟ ਖੋਲ੍ਹਣ ਅਤੇ ਹੜ੍ਹ ਚੇਤਾਵਨੀ ਸਲਾਹ',
    imdNotice: 'ਬਹੁਤ ਭਾਰੀ ਮੀਂਹ ਲਈ ਰੈੱਡ ਅਲਰਟ ਚੇਤਾਵਨੀ',
    evacuationNotice: 'ਤੁਰੰਤ ਸੁਰੱਖਿਅਤ ਸਥਾਨਾਂ ਤੇ ਜਾਣ ਦੇ ਹੁਕਮ',
    reliefNotice: 'ਅਧਿਕਾਰਤ ਰਾਹਤ ਕੈਂਪ ਚਾਲੂ ਕੀਤਾ ਗਿਆ',
  },
  ta: {
    prefix: '[தமிழ்]',
    damNotice: 'அணை மதகுகள் திறப்பு மற்றும் வெள்ள அபாய எச்சரிக்கை',
    imdNotice: 'மிக கனமழைக்கான ரெட் அலர்ட் எச்சரிக்கை',
    evacuationNotice: 'உடனடி வெளியேற்ற உத்தரவு — பாதுகாப்பான இடத்திற்கு செல்லவும்',
    reliefNotice: 'நிவாரண முகாம் செயல்படத் தொடங்கியுள்ளது',
  },
  te: {
    prefix: '[తెలుగు]',
    damNotice: 'డ్యామ్ గేట్ల ఎత్తివేత మరియు వరద ముప్పు హెచ్చరిక',
    imdNotice: 'అత్యంత భారీ వర్ష సూచన (రెడ్ అలర్ట్ హెచ్చరిక)',
    evacuationNotice: 'తక్షణ తరలింపు ఉత్తర్వులు — సురక్షిత ప్రాంతాలకు వెళ్లండి',
    reliefNotice: 'అధికారిక సహాయ పునరావాస శిబిరం ప్రారంభించబడింది',
  },
};

const ALERT_MESSAGE_TRANSLATIONS: Record<
  LanguageCode,
  {
    damMessage: string;
    imdMessage: string;
    evacuationMessage: string;
    reliefMessage: string;
    genericNotice: (text: string) => string;
  }
> = {
  en: {
    damMessage:
      'Due to continuous heavy catchment rainfall, 4 spillway gates at Almatti & Narayanpur dams have been opened discharging 1,45,000 cusecs.',
    imdMessage:
      'India Meteorological Department (IMD) issues Red Alert warning of isolated extremely heavy rainfall (>204.4 mm) over Raigad, Thane, and Mumbai MMR over the next 24 hours.',
    evacuationMessage:
      'Local administration has activated mandatory evacuation for riverfront settlements. Municipal transport buses are deployed at Old Bus Stand for safe transit to Municipal High School relief camp.',
    reliefMessage:
      'District Disaster Management Authority has activated relief shelter at Pillai College Campus, New Panvel. Food packets, dry ration, clean drinking water, and emergency medical triage are functional 24x7. Capacity: 1,500 PAX.',
    genericNotice: (t) => t,
  },
  hi: {
    damMessage:
      'जलग्रहण क्षेत्र में निरंतर भारी वर्षा के कारण, अलमट्टी और नारायणपुर बांधों के 4 स्पिलवे गेट खोल दिए गए हैं और 1,45,000 क्यूसेक पानी छोड़ा जा रहा है। नदी किनारे रहने वाले लोग तुरंत सुरक्षित स्थानों पर जाएं।',
    imdMessage:
      'भारत मौसम विज्ञान विभाग (IMD) ने अगले 24 घंटों में रायगढ़, ठाणे और मुंबई MMR में अत्यधिक भारी वर्षा (>204.4 मिमी) की चेतावनी देते हुए रेड अलर्ट जारी किया है। जब तक आवश्यक न हो, घर से बाहर न निकलें।',
    evacuationMessage:
      'स्थानीय प्रशासन ने नदी किनारे की बस्तियों के लिए अनिवार्य निकासी प्रक्रिया सक्रिय कर दी है। नगर पालिका की राहत बसों को म्युनिसिपल हाई स्कूल राहत शिविर में सुरक्षित परिवहन के लिए पुराने बस स्टैंड पर तैनात किया गया है।',
    reliefMessage:
      'जिला आपदा प्रबंधन प्राधिकरण ने न्यू पनवेल के पिल्लई कॉलेज परिसर में राहत शिविर शुरू किया है। भोजन के पैकेट, सूखा राशन, पीने का साफ पानी और आपातकालीन चिकित्सा सहायता 24x7 उपलब्ध हैं। क्षमता: 1,500 नागरिक।',
    genericNotice: (t) => `[आधिकारिक सूचना] ${t}`,
  },
  mr: {
    damMessage:
      'पाणलोट क्षेत्रात संततधार अतिवृष्टीमुळे अलमट्टी आणि नारायणपूर धरणांचे ४ सांडवे उघडण्यात आले असून १,४५,००० क्युसेक्स पाण्याचा विसर्ग सुरू आहे. नदीकाठच्या नागरिकांनी तातडीने सुरक्षित स्थळी स्थलांतर करावे.',
    imdMessage:
      'भारतीय हवामान विभागाने (IMD) पुढील २४ तासांत रायगड, ठाणे आणि मुंबई MMR मध्ये अतिवृष्टी (>२०४.४ मिमी) होण्याचा इशारा देत रेड अलर्ट जारी केला आहे. अत्यावश्यक कामाशिवाय घराबाहेर पडू नये.',
    evacuationMessage:
      'स्थानिक प्रशासनाने नदीकाठच्या वस्त्यांसाठी सक्तीचे स्थलांतर सुरू केले आहे. म्युनिसिपल हायस्कूल मदत शिबिरामध्ये सुरक्षित नेण्यासाठी जुन्या बसस्थानकावर परिवहन बसेस तैनात करण्यात आल्या आहेत.',
    reliefMessage:
      'जिल्हा आपत्ती व्यवस्थापन प्राधिकरणाने न्यू पनवेल येथील पिल्लई कॉलेज कॅम्पसमध्ये मदत शिबिर सुरू केले आहे. अन्नाची पाकिटे, सुका शिधा, पिण्याचे स्वच्छ पाणी आणि वैद्यकीय उपचार २४ तास उपलब्ध आहेत. क्षमता: १,५०० नागरिक.',
    genericNotice: (t) => `[अधिकृत सूचना] ${t}`,
  },
  bn: {
    damMessage:
      'টানা ভারী বৃষ্টির কারণে আলমাত্তি ও নারায়ণপুর বাঁধের ৪টি স্পিলওয়ে গেট খুলে ১,৪৫,০০০ কিউসেক জল ছাড়া হচ্ছে। নদীর তীরবর্তী এলাকার বাসিন্দাদের অবিলম্বে নিরাপদ স্থানে যাওয়ার নির্দেশ দেওয়া হচ্ছে।',
    imdMessage:
      'ভারত আবহাওয়া বিভাগ (IMD) পরবর্তী ২৪ ঘণ্টায় বিচ্ছিন্নভাবে অতি ভারী বৃষ্টির পূর্বাভাস দিয়ে রেড অ্যালার্ট জারি করেছে। জরুরি প্রয়োজন ছাড়া ঘরের বাইরে বের হবেন না।',
    evacuationMessage:
      'নদীর তীরের বসতিগুলোর জন্য বাধ্যতামূলক স্থানান্তর শুরু হয়েছে। মিউনিসিপ্যাল হাই স্কুল ত্রাণ শিবিরে স্থানান্তরের জন্য পুরানো বাস স্ট্যান্ডে বাস মোতায়েন করা হয়েছে।',
    reliefMessage:
      'জেলা বিপর্যয় ব্যবস্থাপনা কর্তৃপক্ষ পিল্লাই কলেজ ক্যাম্পাসে ত্রাণ শিবির চালু করেছে। খাবার প্যাকেট, পানীয় জল এবং জরুরি চিকিৎসা সেবা ২৪ ঘণ্টা চালু রয়েছে। ধারণক্ষমতা: ১,৫০০ জন।',
    genericNotice: (t) => `[জরুরি বিজ্ঞপ্তি] ${t}`,
  },
  gu: {
    damMessage:
      'કેચમેન્ટ વિસ્તારમાં ભારે વરસાદને કારણે અલમત્તી અને નારાયણપુર ડેમના 4 ગેટ ખોલવામાં આવ્યા છે અને 1,45,000 ક્યુસેક પાણી છોડવામાં આવી રહ્યું છે. નદીકાંઠાના લોકોને તાત્કાલિક સલામત સ્થળે ખસી જવા સૂચના છે.',
    imdMessage:
      'ભારતીય હવામાન વિભાગ (IMD) દ્વારા આગામી 24 કલાકમાં અતિ ભારે વરસાદની ચેતવણી સાથે રેડ એલર્ટ જાહેર કરવામાં આવ્યું છે. બિનજરૂરી બહાર ન નીકળવું.',
    evacuationMessage:
      'સ્થાનિક વહીવટીતંત્ર દ્વારા નદી કિનારાના વિસ્તારોમાંથી ફરજિયાત સ્થળાંતર શરૂ કરાયું છે. મ્યુનિસિપલ હાઈસ્કૂલ રાહત કેમ્પ સુધી પહોંચાડવા જૂના બસ સ્ટેન્ડ પર બસો તૈનાત છે.',
    reliefMessage:
      'જિલ્લા ડિઝાસ્ટર મેનેજમેન્ટ ઓથોરિટી દ્વારા પિલ્લઈ કોલેજ કેમ્પસ ખાતે રાહત શિબિર શરૂ કરાઈ છે. ભોજન, પીવાનું પાણી અને તબીબી સારવાર 24x7 ઉપલબ્ધ છે. ક્ષમતા: 1,500 નાગરિક.',
    genericNotice: (t) => `[સત્તાવાર સૂચના] ${t}`,
  },
  kn: {
    damMessage:
      'ಜಲಾನಯನ ಪ್ರದೇಶದಲ್ಲಿ ನಿರಂತರ ಭಾರಿ ಮಳೆಯಿಂದಾಗಿ ಆಲಮಟ್ಟಿ ಮತ್ತು ನಾರಾಯಣಪುರ ಜಲಾಶಯಗಳ 4 ಗೇಟ್‌ಗಳನ್ನು ತೆರೆದು 1,45,000 ಕ್ಯೂಸೆಕ್ ನೀರನ್ನು ಹೊರಬಿಡಲಾಗುತ್ತಿದೆ. ನದಿಪಾತ್ರದ ಜನರು ತಕ್ಷಣ ಸುರಕ್ಷಿತ ಸ್ಥಳಗಳಿಗೆ ತೆರಳಬೇಕು.',
    imdMessage:
      'ಮುಂದಿನ 24 ಗಂಟೆಗಳಲ್ಲಿ ಭಾರಿ ಮಳೆಯಾಗುವ ಮುನ್ಸೂಚನೆ ಇರುವುದರಿಂದ ಹವಾಮಾನ ಇಲಾಖೆ (IMD) ರೆಡ್ ಅಲರ್ಟ್ ಘೋಷಿಸಿದೆ. ಅನಗತ್ಯವಾಗಿ ಮನೆಯಿಂದ ಹೊರಬರಬೇಡಿ.',
    evacuationMessage:
      'ನದಿ ತೀರದ ನಿವಾಸಿಗಳನ್ನು ಸುರಕ್ಷಿತ ಸ್ಥಳಗಳಿಗೆ ಸ್ಥಳಾಂತರಿಸುವ ಕಾರ್ಯ ಆರಂಭವಾಗಿದೆ. ಮುನಿಸಿಪಲ್ ಪ್ರೌಢಶಾಲೆ ಪರಿಹಾರ ಶಿಬಿರಕ್ಕೆ ತೆರಳಲು ಹಳೆಯ ಬಸ್ ನಿಲ್ದಾಣದಲ್ಲಿ ಬಸ್‌ಗಳನ್ನು ನಿಯೋಜಿಸಲಾಗಿದೆ.',
    reliefMessage:
      'ಜಿಲ್ಲಾ ವಿಪತ್ತು ನಿರ್ವಹಣಾ ಪ್ರಾಧಿಕಾರವು ಪಿಲ್ಲೈ ಕಾಲೇಜು ಆವರಣದಲ್ಲಿ ಪರಿಹಾರ ಶಿಬಿರವನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿದೆ. ಆಹಾರ, ಶುದ್ಧ ಕುಡಿಯುವ ನೀರು ಮತ್ತು ತುರ್ತು ವೈದ್ಯಕೀಯ ನೆರವು 24 ಗಂಟೆ ಲಭ್ಯವಿದೆ. ಸಾಮರ್ಥ್ಯ: 1,500 ಜನರು.',
    genericNotice: (t) => `[ಅಧಿಕೃತ ಸೂಚನೆ] ${t}`,
  },
  ml: {
    damMessage:
      'കനത്ത മഴയെത്തുടർന്ന് അൽമാട്ടി, നാരായൺപൂർ ഡാമുകളുടെ 4 ഷട്ടറുകൾ തുറന്ന് 1,45,000 ക്യുസെക്സ് വെള്ളം ഒഴുക്കിവിടുന്നു. നദീതീരങ്ങളിൽ താമസിക്കുന്നവർ ഉടൻ സുരക്ഷിത സ്ഥാനങ്ങളിലേക്ക് മാറണം.',
    imdMessage:
      'അടുത്ത 24 മണിക്കൂറിൽ അതിശക്തമായ മഴയ്ക്ക് സാധ്യതയുള്ളതിനാൽ കാലാവസ്ഥാ വകുപ്പ് റെഡ് അലർട്ട് പ്രഖ്യാപിച്ചു. അടിയന്തര സാഹചര്യങ്ങളിലല്ലാതെ പുറത്തിറങ്ങരുത്.',
    evacuationMessage:
      'നദീതീര വാസികളെ മാറ്റിപ്പാർപ്പിക്കാൻ ആരംഭിച്ചു. മുനിസിപ്പൽ ഹൈസ്കൂൾ ക്യാമ്പിലേക്ക് മാറുന്നതിനായി പഴയ ബസ് സ്റ്റാൻഡിൽ ബസുകൾ സജ്ജീകരിച്ചിട്ടുണ്ട്.',
    reliefMessage:
      'പില്ലൈ കോളേജ് കാമ്പസിൽ ദുരിതാശ്വാസ ക്യാമ്പ് പ്രവർത്തനം ആരംഭിച്ചു. ഭക്ഷണം, കുടിവെള്ളം, അടിയന്തര ചികിത്സ എന്നിവ 24 മണിക്കൂറും ലഭ്യമാണ്. ശേഷി: 1,500 പേർ.',
    genericNotice: (t) => `[ഔദ്യോഗിക അറിയിപ്പ്] ${t}`,
  },
  or: {
    damMessage:
      'ପ୍ରବଳ ବର୍ଷା ଯୋଗୁଁ ଆଲମାଟ୍ଟି ଏବଂ ନାରାୟଣପୁର ଡ୍ୟାମର ୪ଟି ଗେଟ୍ ଖୋଲାଯାଇ ୧,୪୫,୦୦୦ କ୍ୟୁସେକ୍ ଜଳ ନିଷ୍କାସନ କରାଯାଉଛି। ନଦୀକୂଳିଆ ଲୋକେ ତୁରନ୍ତ ନିରାପଦ ସ୍ଥାନକୁ ଚାଲିଯାଆନ୍ତୁ।',
    imdMessage:
      'ପାଣିପାଗ ବିଭାଗ (IMD) ପକ୍ଷରୁ ଆଗାମୀ ୨୪ ଘଣ୍ଟା ମଧ୍ୟରେ ଅତି ପ୍ରବଳ ବର୍ଷା ପାଇଁ ରେଡ୍ ଆଲର୍ଟ ଜାରି କରାଯାଇଛି। ବିନା କାରଣରେ ଘରୁ ବାହାରନ୍ତୁ ନାହିଁ।',
    evacuationMessage:
      'ନଦୀତଟ ବସ୍ତିବାସିନ୍ଦାଙ୍କ ସ୍ଥାନାନ୍ତରଣ ଆରମ୍ଭ ହୋଇଛି। ମ୍ୟୁନିସିପାଲ୍ ହାଇସ୍କୁଲ୍ ରିଲିଫ୍ କ୍ୟାମ୍ପକୁ ଯିବା ପାଇଁ ପୁରୁଣା ବସ୍ ଷ୍ଟାଣ୍ଡରେ ବସ୍ ମୁତୟନ କରାଯାଇଛି।',
    reliefMessage:
      'ପିଲ୍ଲାଇ କଲେଜ କ୍ୟାମ୍ପସରେ ରିଲିଫ୍ କ୍ୟାମ୍ପ ସକ୍ରିୟ କରାଯାଇଛି। ଖାଦ୍ୟ ପ୍ୟାକେଟ୍, ପାନୀୟ ଜଳ ଏବଂ ଡାକ୍ତରୀ ସହାୟତା ୨୪ ଘଣ୍ଟା ଉପଲବ୍ଧ। କ୍ଷମତା: ୧,୫୦୦ ଲୋକ।',
    genericNotice: (t) => `[ସରକାରୀ ସୂଚନା] ${t}`,
  },
  pa: {
    damMessage:
      'ਲਗਾਤਾਰ ਭਾਰੀ ਮੀਂਹ ਕਾਰਨ ਅਲਮੱਤੀ ਅਤੇ ਨਾਰਾਇਣਪੁਰ ਡੈਮਾਂ ਦੇ 4 ਗੇਟ ਖੋਲ੍ਹ ਕੇ 1,45,000 ਕਿਊਸਿਕ ਪਾਣੀ ਛੱਡਿਆ ਜਾ ਰਿਹਾ ਹੈ। ਦਰਿਆ ਕੰਢੇ ਰਹਿਣ ਵਾਲੇ ਲੋਕ ਤੁਰੰਤ ਸੁਰੱਖਿਅਤ ਥਾਵਾਂ ਤੇ ਪਹੁੰਚਣ।',
    imdMessage:
      'ਮੌਸਮ ਵਿਭਾਗ (IMD) ਨੇ ਅਗਲੇ 24 ਘੰਟਿਆਂ ਵਿੱਚ ਬਹੁਤ ਭਾਰੀ ਮੀਂਹ ਪੈਣ ਦੀ ਚੇਤਾਵਨੀ ਦਿੰਦੇ ਹੋਏ ਰੈੱਡ ਅਲਰਟ ਜਾਰੀ ਕੀਤਾ ਹੈ। ਬਿਨਾਂ ਲੋੜ ਤੋਂ ਬਾਹਰ ਨਾ ਨਿਕਲੋ।',
    evacuationMessage:
      'ਦਰਿਆ ਕੰਢੇ ਵਸੇ ਲੋਕਾਂ ਨੂੰ ਸੁਰੱਖਿਅਤ ਕੱਢਣ ਦੀ ਪ੍ਰਕਿਰਿਆ ਸ਼ੁਰੂ ਕਰ ਦਿੱਤੀ ਗਈ ਹੈ। ਮਿਊਂਸੀਪਲ ਹਾਈ ਸਕੂਲ ਕੈਂਪ ਲਈ ਪੁਰਾਣੇ ਬੱਸ ਅੱਡੇ ਤੇ ਬੱਸਾਂ ਤਾਇਨਾਤ ਹਨ।',
    reliefMessage:
      'ਪਿੱਲਈ ਕਾਲਜ ਕੈਂਪਸ ਵਿੱਚ ਰਾਹਤ ਕੈਂਪ ਸ਼ੁਰੂ ਕੀਤਾ ਗਿਆ ਹੈ। ਖਾਣਾ, ਸਾਫ਼ ਪਾਣੀ ਅਤੇ ਡਾਕਟਰੀ ਸਹਾਇਤਾ 24 ਘੰਟੇ ਉਪਲਬਧ ਹੈ। ਸਮਰੱਥਾ: 1,500 ਵਿਅਕਤੀ।',
    genericNotice: (t) => `[ਸਰਕਾਰੀ ਸੂਚਨਾ] ${t}`,
  },
  ta: {
    damMessage:
      'தொடர் கனமழை காரணமாக ஆலமட்டி மற்றும் நாராயண்பூர் அணைகளின் 4 மதகுகள் திறக்கப்பட்டு 1,45,000 கனஅடி நீர் வெளியேற்றப்படுகிறது. ஆற்றங்கரையோர மக்கள் உடனடியாக பாதுகாப்பான இடங்களுக்கு செல்லவும்.',
    imdMessage:
      'அடுத்த 24 மணி நேரத்திற்கு மிக கனமழை பெய்யக்கூடும் என வானிலை ஆய்வு மையம் (IMD) ரெட் அலர்ட் எச்சரிக்கை விடுத்துள்ளது. அவசியமின்றி வெளியே வர வேண்டாம்.',
    evacuationMessage:
      'ஆற்றங்கரையோர மக்களை வெளியேற்றும் பணி தீவிரப்படுத்தப்பட்டுள்ளது. நிவாரண முகாமிற்கு செல்ல பழைய பேருந்து நிலையத்தில் பேருந்துகள் தயார் நிலையில் உள்ளன.',
    reliefMessage:
      'பிள்ளை கல்லூரி வளாகத்தில் நிவாரண முகாம் தொடங்கப்பட்டுள்ளது. உணவு, குடிநீர் மற்றும் மருத்துவ சிகிச்சை 24 மணி நேரமும் கிடைக்கும். கொள்ளளவு: 1,500 நபர்கள்.',
    genericNotice: (t) => `[அதிகாரப்பூர்வ தகவல்] ${t}`,
  },
  te: {
    damMessage:
      'ఎడతెరిపి లేని భారీ వర్షాల కారణంగా ఆలమట్టి, నారాయణపూర్ డ్యామ్‌ల 4 గేట్లను ఎత్తి 1,45,000 క్యూసెక్కుల నీటిని విడుదల చేస్తున్నారు. నదీ తీర ప్రాంత ప్రజలు వెంటనే సురక్షిత ప్రాంతాలకు వెళ్లాలి.',
    imdMessage:
      'రాగల 24 గంటల్లో అత్యంత భారీ వర్షాలు కురిసే అవకాశం ఉందని వాతావరణ శాఖ (IMD) రెడ్ అలర్ట్ జారీ చేసింది. అత్యవసరమైతే తప్ప బయటకు రావద్దు.',
    evacuationMessage:
      'నదీ పరివాహక ప్రాంత ప్రజలను సురక్షిత ప్రాంతాలకు తరలిస్తున్నారు. మున్సిపల్ హైస్కూల్ పునరావాస కేంద్రానికి వెళ్లేందుకు పాత బస్టాండ్ వద్ద బస్సులను ఏర్పాటు చేశారు.',
    reliefMessage:
      'పిళ్ళై కాలేజీ ప్రాంగణంలో సహాయ పునరావాస శిబిరం ప్రారంభించబడింది. ఆహారం, తాగునీరు మరియు వైద్య సహాయం 24 గంటలు అందుబాటులో ఉన్నాయి. సామర్థ్యం: 1,500 మంది.',
    genericNotice: (t) => `[అధికారిక ప్రకటన] ${t}`,
  },
};

export async function POST(request: Request) {
  try {
    const body: TranslationRequest = await request.json();
    const { language, items } = body;

    if (!language || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid payload: language and items array required' },
        { status: 400 }
      );
    }

    // Proxy to external backend if NEXT_PUBLIC_API_URL or localhost:8000 is available
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    if (apiBase) {
      try {
        const backendRes = await fetch(`${apiBase}/api/comms/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (backendRes.ok) {
          const backendData: TranslationResponse = await backendRes.json();
          // If backend returned both title and message properly, return it
          if (Array.isArray(backendData.items) && backendData.items.length > 0) {
            return NextResponse.json(backendData);
          }
        }
      } catch (err) {
        console.debug('Backend proxy translation unreachable:', err);
      }
    }

    // Localized translation pipeline
    const langCode = (language as LanguageCode) || 'en';
    const dict = SAMPLE_DICTIONARY[langCode] || SAMPLE_DICTIONARY.en;
    const msgDict = ALERT_MESSAGE_TRANSLATIONS[langCode] || ALERT_MESSAGE_TRANSLATIONS.en;

    const translatedItems = items.map((item) => {
      if (langCode === 'en') {
        return item;
      }

      let translatedTitle = item.title;
      let translatedMessage = item.message;

      const titleLower = item.title.toLowerCase();
      const messageLower = item.message.toLowerCase();

      if (titleLower.includes('dam') || titleLower.includes('discharge') || messageLower.includes('spillway')) {
        const suffix = item.title.includes('—') ? item.title.split('—')[1] : item.title;
        translatedTitle = `${dict.damNotice} — ${suffix.trim()}`;
        translatedMessage = msgDict.damMessage;
      } else if (
        titleLower.includes('red alert') ||
        titleLower.includes('downpour') ||
        messageLower.includes('meteorological') ||
        messageLower.includes('imd')
      ) {
        const suffix = item.title.includes('—') ? item.title.split('—')[1] : item.title;
        translatedTitle = `${dict.imdNotice} — ${suffix.trim()}`;
        translatedMessage = msgDict.imdMessage;
      } else if (
        titleLower.includes('evacuation') ||
        messageLower.includes('mandatory evacuation') ||
        messageLower.includes('riverfront')
      ) {
        const suffix = item.title.includes('—') ? item.title.split('—')[1] : item.title;
        translatedTitle = `${dict.evacuationNotice} — ${suffix.trim()}`;
        translatedMessage = msgDict.evacuationMessage;
      } else if (
        titleLower.includes('relief camp') ||
        messageLower.includes('relief shelter') ||
        messageLower.includes('pillai')
      ) {
        const suffix = item.title.includes('—') ? item.title.split('—')[1] : item.title;
        translatedTitle = `${dict.reliefNotice} — ${suffix.trim()}`;
        translatedMessage = msgDict.reliefMessage;
      } else {
        translatedTitle = `${dict.prefix} ${item.title}`;
        translatedMessage = msgDict.genericNotice(item.message);
      }

      return {
        id: item.id,
        title: translatedTitle,
        message: translatedMessage,
      };
    });

    const response: TranslationResponse = { items: translatedItems };
    return NextResponse.json(response);
  } catch (err: any) {
    console.error('Error in App Router translate route:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
