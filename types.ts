export interface Vocabulary {
  id: string;
  term: string;
  definition: string; // In native language
  pronunciation: string;
  contextSentence: string;
}

export interface Article {
  id: string;
  title: string;
  content: string; // The full article text
  vocabulary: Vocabulary[];
  language: string; // The target language of this article
  status: 'new' | 'reading' | 'completed'; // 'completed' means quiz passed with 10/10
  createdAt: number;
}

export interface UserConfig {
  learningLanguages: string[]; // List of languages user is learning
  nativeLanguage: string;
  totalWordsLearned: number;
  theme: 'light' | 'dark';
}

export enum AppState {
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  GENERATING = 'GENERATING',
  READING = 'READING',
  QUIZ = 'QUIZ',
}

export const SUPPORTED_LANGUAGES = [
  "Spanish", "French", "German", "Italian", "Portuguese",
  "Japanese", "Chinese (Simplified)", "Korean", "Russian",
  "Arabic", "Hindi", "Turkish", "Dutch", "Swedish",
  "Polish", "Indonesian", "Vietnamese", "Thai", "English"
];