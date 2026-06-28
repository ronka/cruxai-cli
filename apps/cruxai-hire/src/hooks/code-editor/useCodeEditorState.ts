import { useEffect, useState } from "react";

type UseCodeEditorStateParams = {
  filePath: string | null;
  content: string;
  onSave: (content: string) => Promise<void>;
};

export function useCodeEditorState({ filePath, content, onSave }: UseCodeEditorStateParams) {
  const [localContent, setLocalContent] = useState(content);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalContent(content);
    setHasChanges(false);
  }, [filePath, content]);

  const handleChange = (value: string | undefined) => {
    const newContent = value || "";
    setLocalContent(newContent);
    setHasChanges(newContent !== content);
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    await onSave(localContent);
    setHasChanges(false);
  };

  return {
    localContent,
    hasChanges,
    handleChange,
    handleSave,
  };
}
