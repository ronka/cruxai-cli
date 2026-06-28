# Data Directory (`src/data`)

## Purpose
This directory contains typed, in-memory mock data used by candidate and recruiter flows.  
It centralizes seed datasets (questions, roles, submissions, candidates, users) plus simple query helpers so UI/store initialization can stay deterministic during local development and POC flows.

## Implementation Notes
- Data is exported as static arrays/objects with shared TypeScript types from `src/types`.
- Lookup/filter helpers are pure synchronous functions over those in-memory arrays.
- Some files re-export types for backward compatibility with older import paths.

## File Inventory
| File | Function | Short implementation details |
| --- | --- | --- |
| `questions.ts` | Candidate-side coding question seed data. | Exports a typed `questions: CandidateQuestion[]` array (currently one full question definition with repository/test config metadata) and re-exports shared question types for compatibility. |
| `candidates.ts` | Candidate dashboard mock users and assessment records. | Exports `mockUsers`, `defaultMockUser`, and `mockCandidateAssessments`; includes helper selectors (`getAssessmentsByStatus`, `getActiveAssessments`, `getCompletedAssessments`) plus `getAverageScore()` computed from reviewed assessments. |
| `recruiters.ts` | Recruiter-side reference data and pipeline fixtures. | Exports model/framework/test-framework option lists, default evaluation metrics, and large mock datasets (`mockJobRoles`, `mockRoleQuestions`, `mockSubmissions`, `mockCandidates`); provides ID/role/candidate-based lookup helpers used by recruiter pages and stores. |
| `mock-analysis.ts` | Hardcoded submission analysis results for recruiter review UI. | Exports `AnalysisResult` interface, `mockAnalysisResults` array (scores, skill breakdowns, timeline, code quality metrics, level assessment per submission), and `getAnalysisBySubmissionId()` lookup helper. Placeholder until API/database persistence is implemented. |
