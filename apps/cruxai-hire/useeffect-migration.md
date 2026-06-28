# useEffect Refactor Tracker

Goal: encapsulate every `useEffect` usage into a custom hook under `src/hooks/[componentName]/`, give hooks meaningful names, and encapsulate related state within the hook.

## Inventory

### Non-code mentions (no refactor needed)
- [x] `src/lib/mockAnalysisData.ts` (string mentions of "useEffect")
- [x] `src/server/prompts.ts` (string mention of "useEffect")

### In custom hooks already
- [x] `src/hooks/question/useCheckpoints.ts`
- [x] `src/hooks/chat/useAutoScroll.ts`
- [x] `src/hooks/toast/useToast.ts`
- [x] `src/hooks/mobile/useIsMobile.ts`

### In pages/components (needs refactor)
- [x] `src/app/questions/page.tsx`
- [x] `src/app/questions/[id]/page.tsx`
- [x] `src/app/questions/[id]/analysis/page.tsx`
- [x] `src/components/question/preview/CodeEditor.tsx`
- [x] `src/components/question/preview/ViewModeTabs.tsx`
- [x] `src/components/question/Reasoning.tsx`
- [x] `src/app/recruiters/page.tsx`
- [x] `src/app/recruiters/roles/[roleId]/page.tsx`
- [x] `src/app/recruiters/roles/[roleId]/questions/[questionId]/page.tsx`
- [x] `src/components/ui/carousel.tsx`
- [x] `src/components/ui/sidebar.tsx`

## New hook files
- `src/hooks/questions/useCandidateQuestions.ts`
- `src/hooks/question-detail/useQuestionHydration.ts`
- `src/hooks/question-detail/useQuestionNotFoundRedirect.ts`
- `src/hooks/question-detail/useMessageTokenSync.ts`
- `src/hooks/question-detail/useToolCallFileSync.ts`
- `src/hooks/question-analysis/useQuestionAnalysisHydration.ts`
- `src/hooks/question-analysis/useQuestionAnalysisNotFoundRedirect.ts`
- `src/hooks/question-analysis/useTriggerQuestionAnalysis.ts`
- `src/hooks/code-editor/useCodeEditorState.ts`
- `src/hooks/view-mode-tabs/useViewModePathInput.ts`
- `src/hooks/reasoning/useReasoningState.ts`
- `src/hooks/recruiters-page/useInitializeRecruiterStores.ts`
- `src/hooks/recruiter-role-detail/useInitializeRoleQuestions.ts`
- `src/hooks/recruiter-question-editor/useInitializeRecruiterQuestions.ts`
- `src/hooks/recruiter-question-editor/useRecruiterQuestionForm.ts`
- `src/hooks/carousel/useCarouselControls.ts`
- `src/hooks/sidebar/useSidebarKeyboardShortcut.ts`
