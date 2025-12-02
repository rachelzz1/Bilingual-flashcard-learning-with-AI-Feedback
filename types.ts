export interface FlashcardData {
  id: string;
  chinese: string;
  english: string;
}

export interface UserResult {
  cardId: string;
  chinese: string;
  correctEnglish: string;
  userInput: string;
  isSkipped: boolean;
  isBookmarked: boolean;
}

export enum ErrorType {
  CORRECT = "正确/完美",
  COMPLETELY_INCORRECT = "完全错误",
  EXPRESSION_ISSUE = "表达不当",
  VOCABULARY_ISSUE = "词汇不当",
  SPELLING_ISSUE = "拼写错误",
  INCOMPLETE = "不够完整",
  OVER_EXPRESSED = "过度表达",
  PARTIALLY_CORRECT = "部分正确"
}

export interface CardAnalysis {
  cardId: string;
  chinese: string;
  userInput: string;
  status: 'Passed' | 'Not Passed';
  errorType: ErrorType;
  feedback: string;
  improvedVersion: string;
  isBookmarked?: boolean;
}

export interface AIAnalysisReport {
  overallScore: number;
  totalCards: number;
  accuracyRate: number;
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  errorDistribution: Array<{ type: string; count: number }>;
  commonIssues: string[];
  suggestions: string[];
  positiveFeedback: string;
  cardAnalyses: CardAnalysis[];
}

export type AppStep = 'upload' | 'study' | 'summary';