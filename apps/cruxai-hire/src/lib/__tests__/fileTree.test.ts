import { describe, it, expect } from 'vitest';
import { buildFileTree } from '@/lib/fileTree';

describe('buildFileTree', () => {
  it('returns a root node for empty input', () => {
    const tree = buildFileTree({});
    expect(tree.name).toBe('root');
    expect(tree.type).toBe('folder');
    expect(tree.children).toEqual([]);
  });

  it('handles a single file at root level', () => {
    const tree = buildFileTree({ '/index.ts': 'content' });
    expect(tree.children).toHaveLength(1);
    expect(tree.children![0].name).toBe('index.ts');
    expect(tree.children![0].type).toBe('file');
  });

  it('produces correct nested structure from flat paths', () => {
    const files = {
      '/src/components/Button.tsx': '',
      '/src/index.ts': '',
    };
    const tree = buildFileTree(files);

    const srcFolder = tree.children!.find((c) => c.name === 'src');
    expect(srcFolder).toBeDefined();
    expect(srcFolder!.type).toBe('folder');

    const componentsFolder = srcFolder!.children!.find((c) => c.name === 'components');
    expect(componentsFolder).toBeDefined();
    expect(componentsFolder!.type).toBe('folder');

    const button = componentsFolder!.children!.find((c) => c.name === 'Button.tsx');
    expect(button).toBeDefined();
    expect(button!.type).toBe('file');
    expect(button!.path).toBe('/src/components/Button.tsx');

    const indexFile = srcFolder!.children!.find((c) => c.name === 'index.ts');
    expect(indexFile).toBeDefined();
  });

  it('sorts folders before files at each level', () => {
    const files = {
      '/zoo.ts': '',
      '/alpha/file.ts': '',
      '/beta/file.ts': '',
      '/aardvark.ts': '',
    };
    const tree = buildFileTree(files);
    const children = tree.children!;

    const folders = children.filter((c) => c.type === 'folder');
    const fileNodes = children.filter((c) => c.type === 'file');

    // All folders appear before all files
    const lastFolderIdx = children.lastIndexOf(children.find((c) => c.type === 'folder')!);
    const firstFileIdx = children.indexOf(children.find((c) => c.type === 'file')!);
    expect(lastFolderIdx).toBeLessThan(firstFileIdx);

    // Folders are alphabetically sorted
    expect(folders.map((f) => f.name)).toEqual(['alpha', 'beta']);

    // Files are alphabetically sorted
    expect(fileNodes.map((f) => f.name)).toEqual(['aardvark.ts', 'zoo.ts']);
  });

  it('sorts folders alphabetically', () => {
    const files = {
      '/z-folder/file.ts': '',
      '/a-folder/file.ts': '',
      '/m-folder/file.ts': '',
    };
    const tree = buildFileTree(files);
    const folderNames = tree.children!.map((c) => c.name);
    expect(folderNames).toEqual(['a-folder', 'm-folder', 'z-folder']);
  });

  it('sorts files alphabetically when no folders', () => {
    const files = {
      '/z.ts': '',
      '/a.ts': '',
      '/m.ts': '',
    };
    const tree = buildFileTree(files);
    const fileNames = tree.children!.map((c) => c.name);
    expect(fileNames).toEqual(['a.ts', 'm.ts', 'z.ts']);
  });

  it('correctly sets path for nested files', () => {
    const files = { '/a/b/c.ts': 'x' };
    const tree = buildFileTree(files);
    const aFolder = tree.children![0];
    const bFolder = aFolder.children![0];
    const cFile = bFolder.children![0];
    expect(cFile.path).toBe('/a/b/c.ts');
  });

  it('reuses existing folder nodes for shared prefixes', () => {
    const files = {
      '/src/a.ts': '',
      '/src/b.ts': '',
    };
    const tree = buildFileTree(files);
    const srcFolder = tree.children!.find((c) => c.name === 'src');
    expect(srcFolder!.children).toHaveLength(2);
  });
});
