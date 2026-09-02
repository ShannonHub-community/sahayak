export type LanguageCode =
  | 'en'
  | 'hi'
  | 'mr'
  | 'bn'
  | 'gu'
  | 'kn'
  | 'ml'
  | 'or'
  | 'pa'
  | 'ta'
  | 'te';

export interface SupportedLanguage {
  code: LanguageCode;
  label: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'mr', label: 'Marathi (मराठी)' },
  { code: 'bn', label: 'Bengali (বাংলা)' },
  { code: 'gu', label: 'Gujarati (ગુજરાતી)' },
  { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', label: 'Malayalam (മലയാളം)' },
  { code: 'or', label: 'Odia (ଓଡ଼ିଆ)' },
  { code: 'pa', label: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'te', label: 'Telugu (తెలుగు)' },
];

export interface TranslateItem {
  id: string;
  title: string;
  message: string;
}

export interface TranslationRequest {
  language: LanguageCode | string;
  items: TranslateItem[];
}

export interface TranslateResponseItem {
  id: string;
  title: string;
  message: string;
}

export interface TranslationResponse {
  items: TranslateResponseItem[];
}
