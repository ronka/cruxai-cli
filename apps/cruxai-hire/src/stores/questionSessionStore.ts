import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UIMessage } from '@ai-sdk/react';
import type { TestResultSummary } from '@/types/test-results';

interface QuestionSessionState {
  // State
  questionId: string | null;
  submissionId: string | null;
  tokensIn: number;
  tokensOut: number;
  messageCount: number;
  timeSpent: string;
  timeExceeded: boolean;
  testSummary: TestResultSummary | null;

  // Actions
  initSession: (questionId: string) => void;
  setSubmissionId: (submissionId: string) => void;
  updateFromMessages: (messages: UIMessage[]) => void;
  saveSession: (timeSpent: string, timeExceeded?: boolean, testSummary?: TestResultSummary | null) => void;
  setTestSummary: (summary: TestResultSummary | null) => void;
  reset: () => void;
}

export const useQuestionSessionStore = create<QuestionSessionState>()(
  persist(
    (set, get) => ({
      // Initial state
      questionId: null,
      submissionId: null,
      tokensIn: 0,
      tokensOut: 0,
      messageCount: 0,
      timeSpent: '00:00',
      timeExceeded: false,
      testSummary: null,

      // Actions
      initSession: (questionId) =>
        set({
          questionId,
          submissionId: null,
          tokensIn: 0,
          tokensOut: 0,
          messageCount: 0,
          timeSpent: '00:00',
          timeExceeded: false,
          testSummary: null,
        }),

      setSubmissionId: (submissionId) => set({ submissionId }),

      updateFromMessages: (messages) => {
        set({
          messageCount: messages.length,
        });
      },

      saveSession: (timeSpent, timeExceeded = false, testSummary = null) =>
        set({
          timeSpent,
          timeExceeded,
          testSummary,
        }),

      setTestSummary: (summary) => set({ testSummary: summary }),

      reset: () =>
        set({
          questionId: null,
          submissionId: null,
          tokensIn: 0,
          tokensOut: 0,
          messageCount: 0,
          timeSpent: '00:00',
          timeExceeded: false,
          testSummary: null,
        }),
    }),
    {
      name: 'question_session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        questionId: state.questionId,
        submissionId: state.submissionId,
        tokensIn: state.tokensIn,
        tokensOut: state.tokensOut,
        messageCount: state.messageCount,
        timeSpent: state.timeSpent,
        timeExceeded: state.timeExceeded,
        testSummary: state.testSummary,
      }),
    }
  )
);
