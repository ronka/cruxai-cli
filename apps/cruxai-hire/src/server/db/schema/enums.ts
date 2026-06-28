import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['recruiter', 'candidate']);
export const roleStatusEnum = pgEnum('role_status', ['draft', 'open', 'paused', 'closed']);
export const questionRoleEnum = pgEnum('question_role', ['frontend', 'backend', 'fullstack']);
export const questionDifficultyEnum = pgEnum('question_difficulty', ['easy', 'medium', 'hard']);
export const questionStatusEnum = pgEnum('question_status', ['draft', 'published', 'archived']);
export const submissionStatusEnum = pgEnum('submission_status', ['in_progress', 'submitted', 'analyzing', 'analysis_failed', 'reviewed']);
export const timeUnitEnum = pgEnum('time_unit', ['minutes', 'hours']);
export const hireRecommendationEnum = pgEnum('hire_recommendation', ['strong', 'medium', 'no_hire']);
