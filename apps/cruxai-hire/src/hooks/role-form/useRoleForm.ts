import { useEffect, useState, useCallback } from "react";
import type { JobRole, RoleStatus, RoleFormData } from "@/types/recruiter";

export function useRoleForm(initialData?: Partial<JobRole>) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [status, setStatus] = useState<RoleStatus>(initialData?.status || "draft");
  const [questionIds, setQuestionIds] = useState<string[]>(initialData?.questionIds || []);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setStatus(initialData.status || "draft");
      setQuestionIds(initialData.questionIds || []);
    }
  }, [initialData]);

  const isValid = title.trim() !== "";

  const getFormData = useCallback((): RoleFormData => ({
    title: title.trim(),
    description: description.trim(),
    status,
  }), [title, description, status]);

  const reset = useCallback(() => {
    setTitle(initialData?.title || "");
    setDescription(initialData?.description || "");
    setStatus(initialData?.status || "draft");
    setQuestionIds(initialData?.questionIds || []);
  }, [initialData]);

  return {
    title,
    setTitle,
    description,
    setDescription,
    status,
    setStatus,
    questionIds,
    setQuestionIds,
    isValid,
    getFormData,
    reset,
  };
}
