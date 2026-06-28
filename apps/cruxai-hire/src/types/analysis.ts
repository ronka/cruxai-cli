export type MessageFlag = 'exemplar' | 'red-flag' | 'teaching-moment';
export type MessageIntent = 'clarification' | 'requirement' | 'implementation' | 'debugging' | 'follow-up' | 'review' | 'other';
export type MessageQuality = 'strong' | 'adequate' | 'weak';
export type HireRecommendation = 'strong' | 'medium' | 'no_hire';

export interface MessageInsight {
  messageIndex: number;
  intent: MessageIntent;
  quality: MessageQuality;
  flags: MessageFlag[];
  reasoning: string;
}

export interface AnalysisResult {
  messageInsights: MessageInsight[];
}
