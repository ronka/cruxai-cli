// The shared tsconfig.base.json sets `types: ["node"]`, which suppresses
// Next.js's ambient declaration for side-effect CSS imports. Re-declare it here.
declare module '*.css';
