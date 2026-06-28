'use client';

import Editor, { BeforeMount } from '@monaco-editor/react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCodeEditorState } from '@/hooks/code-editor/useCodeEditorState';

interface CodeEditorProps {
  filePath: string | null;
  content: string;
  onSave: (content: string) => Promise<void>;
  isSaving?: boolean;
}

const handleBeforeMount: BeforeMount = (monaco) => {
  // Configure TypeScript compiler options for React/JSX support
  const compilerOptions = {
    target: monaco.languages.typescript.ScriptTarget.Latest,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    allowJs: true,
    allowSyntheticDefaultImports: true,
    skipLibCheck: true,
  };

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions);
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions);

  // Suppress diagnostics that don't apply in a sandbox editing context
  const diagnosticsOptions = {
    noSemanticValidation: false,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: true,
  };
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(diagnosticsOptions);
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(diagnosticsOptions);

  // Add React type stubs so JSX types resolve without errors
  const reactTypes = `
declare module 'react' {
  export type ReactNode = ReactChild | ReactFragment | ReactPortal | boolean | null | undefined;
  export type ReactChild = ReactElement | string | number;
  export type ReactFragment = {} | ReactNodeArray;
  export interface ReactNodeArray extends Array<ReactNode> {}
  export type ReactPortal = { key: string | null; children: ReactNode };
  export interface ReactElement<P = any> {
    type: any;
    props: P;
    key: string | null;
  }
  export type FC<P = {}> = FunctionComponent<P>;
  export interface FunctionComponent<P = {}> {
    (props: P & { children?: ReactNode }): ReactElement | null;
  }
  export type ComponentType<P = {}> = FunctionComponent<P>;
  export function useState<S>(initialState: S | (() => S)): [S, (value: S | ((prev: S) => S)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
  export function useMemo<T>(factory: () => T, deps: readonly any[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function useRef<T = undefined>(): { current: T | undefined };
  export function useContext<T>(context: Context<T>): T;
  export function useReducer<R extends (state: any, action: any) => any>(
    reducer: R,
    initialState: Parameters<R>[0]
  ): [Parameters<R>[0], (action: Parameters<R>[1]) => void];
  export interface Context<T> { Provider: ComponentType<{ value: T; children?: ReactNode }> }
  export function createContext<T>(defaultValue: T): Context<T>;
  export function forwardRef<T, P = {}>(render: (props: P, ref: any) => ReactElement | null): ComponentType<P & { ref?: any }>;
  export function memo<T extends ComponentType<any>>(component: T): T;
  export const Fragment: ComponentType<{ children?: ReactNode }>;
  export type CSSProperties = Partial<CSSStyleDeclaration>;
  export type ChangeEvent<T> = { target: T & EventTarget };
  export type MouseEvent<T = Element> = globalThis.MouseEvent & { currentTarget: T };
  export type KeyboardEvent<T = Element> = globalThis.KeyboardEvent & { currentTarget: T };
  export type FormEvent<T = Element> = globalThis.Event & { currentTarget: T };
  export type HTMLAttributes<T> = {
    className?: string;
    style?: CSSProperties;
    id?: string;
    onClick?: (event: MouseEvent<T>) => void;
    onChange?: (event: ChangeEvent<T>) => void;
    onSubmit?: (event: FormEvent<T>) => void;
    onKeyDown?: (event: KeyboardEvent<T>) => void;
    children?: ReactNode;
    [key: string]: any;
  };
  export type ButtonHTMLAttributes<T> = HTMLAttributes<T> & { type?: string; disabled?: boolean };
  export type InputHTMLAttributes<T> = HTMLAttributes<T> & { type?: string; value?: any; placeholder?: string; disabled?: boolean };
  export type TextareaHTMLAttributes<T> = HTMLAttributes<T> & { value?: any; placeholder?: string; rows?: number };
  export type AnchorHTMLAttributes<T> = HTMLAttributes<T> & { href?: string; target?: string };
  export type ImgHTMLAttributes<T> = HTMLAttributes<T> & { src?: string; alt?: string; width?: number; height?: number };
}
declare module 'react-dom' {
  export function render(element: any, container: Element | null): void;
  export function createRoot(container: Element | null): { render(element: any): void; unmount(): void };
}
declare namespace JSX {
  interface Element {}
  interface IntrinsicElements { [elemName: string]: any }
  interface ElementAttributesProperty { props: {} }
  interface ElementChildrenAttribute { children: {} }
}
`;
  monaco.languages.typescript.typescriptDefaults.addExtraLib(reactTypes, 'file:///node_modules/@types/react/index.d.ts');
  monaco.languages.typescript.javascriptDefaults.addExtraLib(reactTypes, 'file:///node_modules/@types/react/index.d.ts');
};

export function CodeEditor({ filePath, content, onSave, isSaving }: CodeEditorProps) {
  const { localContent, hasChanges, handleChange, handleSave } = useCodeEditorState({
    filePath,
    content,
    onSave,
  });

  const language = getLanguage(filePath);

  return (
    <div className="h-full flex flex-col">
      {/* File header */}
      <div className="flex items-center justify-between h-10 px-4 border-b border-border bg-muted/30">
        <span className="text-xs font-medium truncate">
          {filePath || 'No file selected'}
        </span>
        {filePath && (
          <div className="flex items-center gap-2">
            {isSaving && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </div>
            )}
            <Button
              size="sm"
              variant={hasChanges ? "default" : "ghost"}
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="h-7 px-2.5 text-xs"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1">
        {filePath ? (
          <Editor
            language={language}
            value={localContent}
            onChange={handleChange}
            theme="vs-dark"
            beforeMount={handleBeforeMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Select a file to edit
          </div>
        )}
      </div>
    </div>
  );
}

function getLanguage(filePath: string | null) {
  if (!filePath) return 'typescript';
  if (filePath.endsWith('.tsx')) return 'typescript';
  if (filePath.endsWith('.ts')) return 'typescript';
  if (filePath.endsWith('.jsx')) return 'javascript';
  if (filePath.endsWith('.js')) return 'javascript';
  if (filePath.endsWith('.css')) return 'css';
  if (filePath.endsWith('.json')) return 'json';
  if (filePath.endsWith('.html')) return 'html';
  return 'typescript';
}
