import { useEffect, useState } from "react";
import type {
  AIPermissions,
  TestConfig,
  TimeConstraints,
  QuestionDifficulty,
  QuestionRole,
  QuestionStatus,
  Question,
} from "@/types/question-shared";

export function useRecruiterQuestionForm(existingQuestion: Question | null) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questionRole, setQuestionRole] = useState<QuestionRole>("frontend");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>("medium");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [startingBranch, setStartingBranch] = useState("main");
  const [targetBranch, setTargetBranch] = useState("solution");
  const [status, setStatus] = useState<QuestionStatus>("draft");

  const [testConfig, setTestConfig] = useState<TestConfig>({
    command: "npm test",
    framework: "jest",
    timeout: 30000,
  });

  const [timeConstraints, setTimeConstraints] = useState<TimeConstraints>({
    limit: 60,
    unit: "minutes",
    hardStop: false,
  });

  const [aiPermissions, setAIPermissions] = useState<AIPermissions>({
    allowedModels: [],
  });

  useEffect(() => {
    if (existingQuestion) {
      setTitle(existingQuestion.title);
      setDescription(existingQuestion.description);
      setQuestionRole(existingQuestion.role);
      setDifficulty(existingQuestion.difficulty);
      setRepositoryUrl(existingQuestion.repository?.url ?? "");
      setStartingBranch(existingQuestion.repository?.startingBranch ?? "main");
      setTargetBranch(existingQuestion.repository?.targetBranch ?? "solution");
      setStatus(existingQuestion.status);
      if (existingQuestion.timeConstraints) {
        setTimeConstraints({ ...existingQuestion.timeConstraints });
      }
      setAIPermissions({
        ...existingQuestion.aiPermissions,
        allowedModels: existingQuestion.aiPermissions?.allowedModels ?? [],
      });
    }
  }, [existingQuestion]);

  return {
    title,
    setTitle,
    description,
    setDescription,
    questionRole,
    setQuestionRole,
    difficulty,
    setDifficulty,
    repositoryUrl,
    setRepositoryUrl,
    startingBranch,
    setStartingBranch,
    targetBranch,
    setTargetBranch,
    status,
    setStatus,
    testConfig,
    setTestConfig,
    timeConstraints,
    setTimeConstraints,
    aiPermissions,
    setAIPermissions,
  };
}
