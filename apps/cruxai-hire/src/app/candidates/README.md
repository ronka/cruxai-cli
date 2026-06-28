# `src/app/candidates`

This directory contains the Next.js App Router route for the candidate dashboard at `/candidates`.
It renders the candidate-facing assessments screen, initializes candidate state, and displays active/completed assessments with summary stats.

## Files

- `page.tsx`: Client route entry for `/candidates`; wraps content in `Suspense`, initializes the candidate store with mock data, syncs the active tab with URL search params, shows a loading skeleton until hydration, and renders dashboard stats plus active/completed assessment lists.
- `README.md`: Documentation for this directory and its files.
