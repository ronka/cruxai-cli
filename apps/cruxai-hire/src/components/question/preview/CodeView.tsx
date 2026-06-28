'use client';

import { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { FileTree } from './FileTree';
import { CodeEditor } from './CodeEditor';
import { useSandboxStore } from '@/stores/sandboxStore';
import { useSandbox } from '@/hooks/useSandbox';
import { useQuestionStateStore } from '@/stores/questionStateStore';

export function CodeView() {
  const files = useSandboxStore((state) => state.files);

  const addSnapshot = useQuestionStateStore((state) => state.addSnapshot);
  const setCurrentSnapshotId = useQuestionStateStore((state) => state.setCurrentSnapshotId);

  const { writeFile, isWriting } = useSandbox();

  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const handleSave = async (content: string) => {
    if (!selectedPath) return;

    // Create a standalone snapshot for manual edits
    const snapshotId = addSnapshot('snapshot-manual', files);
    setCurrentSnapshotId(snapshotId);

    await writeFile(selectedPath, content);
  };

  const selectedContent = selectedPath ? files[selectedPath] || '' : '';

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
        <FileTree
          files={files}
          selectedPath={selectedPath}
          onFileSelect={setSelectedPath}
        />
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={75}>
        <CodeEditor
          filePath={selectedPath}
          content={selectedContent}
          onSave={handleSave}
          isSaving={isWriting}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
