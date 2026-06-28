import { useEffect, useState } from "react";

export function useViewModePathInput(currentPath: string) {
  const [inputPath, setInputPath] = useState(currentPath);

  useEffect(() => {
    setInputPath(currentPath);
  }, [currentPath]);

  return { inputPath, setInputPath };
}
