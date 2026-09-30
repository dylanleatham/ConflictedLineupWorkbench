# Frontend

React 19 + Vite UI for the Conflicted Lineup Workbench. See the [root README](../README.md) for setup and an overview.

```bash
npm install
npm run dev     # http://localhost:5173, proxies /api to the backend on :8000
npm run lint
npm run build
```

- `src/pages/`: route-level views. Image Eval lives at the top level; `web-search/` and `poster-search/` hold the other two workspaces.
- `src/hooks/`: `useExecution.js` and `useBatchExecution.js` wrap one generic single-run hook and one generic batch-polling hook for all three workspaces. There is also `useStickyState` for localStorage-backed state that stays in sync across tabs.
- `src/api/`: thin fetch wrappers. `executions.js` builds one client per workspace from a shared factory.
