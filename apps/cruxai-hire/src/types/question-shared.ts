// Shared types for the question system

export type QuestionRole = 'frontend' | 'backend' | 'fullstack';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionStatus = 'draft' | 'published' | 'archived';

export const QUESTION_ROLES = ['frontend', 'backend', 'fullstack'] as const satisfies readonly QuestionRole[];
export const QUESTION_DIFFICULTIES = ['easy', 'medium', 'hard'] as const satisfies readonly QuestionDifficulty[];
export const QUESTION_STATUSES = ['draft', 'published', 'archived'] as const satisfies readonly QuestionStatus[];

// GitHub integration
export interface GitHubRepository {
  url: string;
  startingBranch: string;
  targetBranch: string;
}

// Test configuration
export type TestFrameworkType = 'jest' | 'vitest' | 'mocha' | 'pytest';

export interface TestConfig {
  command: string; // e.g., "npm test", "pytest"
  framework: TestFrameworkType;
  timeout?: number; // Test execution timeout in ms
}

// AI Model configuration
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'meta';

export interface AIModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  description?: string;
}

// Time constraints
export interface TimeConstraints {
  limit: number;
  unit: 'minutes' | 'hours';
  hardStop: boolean; // Auto-lock when time expires
}

// AI Permissions
export interface AIPermissions {
  allowedModels: string[]; // Model IDs that can be used
}

// Base question interface with common fields
export interface BaseQuestion {
  id: string;
  title: string;
  description: string;
  role: QuestionRole;
  difficulty: QuestionDifficulty;
  createdAt: string;
  updatedAt: string;
}

// Unified question type — used for both candidate-facing and recruiter-managed questions
export interface Question extends BaseQuestion {
  // Always required
  repository: GitHubRepository;
  status: QuestionStatus;
  aiPermissions: AIPermissions;
  ownerId: string | null;
  isPublic: boolean;

  // Optional
  timeConstraints?: TimeConstraints;
}
