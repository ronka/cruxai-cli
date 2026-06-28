# `src/app/settings`

This directory defines the App Router route for `/settings`.  
Its purpose is to render the user-facing settings screen where users add and manage their Vercel AI Gateway API key (stored locally via the settings Zustand store).

## Files

- `page.tsx`: Client-side settings page component. It reads/writes the API key through `useSettingsStore`, provides key visibility toggle and save feedback, shows setup instructions, and renders the shared `Header`/`Footer` layout.
- `README.md`: Documentation for this directory and the role of each file.
