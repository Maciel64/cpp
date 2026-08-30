---
name: cpp-frontend
description: MANDATORY for any code in the CPP project frontend (front/). Use when editing/creating files under front/ (Next.js 16 App Router, Tailwind v4). Enforce the stack: axios for HTTP, @tanstack/react-query for server state, nuqs for URL state, @t3-oss/env-nextjs + zod for env vars. Reject manual fetch() in components, useState for URL parameters, and direct process.env reads. Triggers: "frontend", "front/", "axios", "react-query", "tanstack", "nuqs", "t3-env", "env var", "API call", "URL filter".
---

# CPP Frontend — Mandatory Stack & Patterns

Fixed frontend stack, in `front/`. No new library without approval. No pattern outside this list.

## Stack

| Layer          | Library                  | Purpose        |
| -------------- | ------------------------ | -------------- |
| Framework      | Next.js 16 (App Router)  | UI + API routes |
| Styling        | Tailwind v4              | CSS             |
| HTTP           | axios                    | requests       |
| Server state   | @tanstack/react-query    | queries/mutations |
| URL state      | nuqs                     | query string   |
| Env validation | @t3-oss/env-nextjs + zod | env vars       |

## Rules (non-negotiable)

### 1. HTTP — always axios
- Never manual `fetch()` for API calls. Always axios.
- Single typed instance in `src/lib/api.ts`, with an interceptor injecting the Supabase token.
- Request/response types per feature, no `any`.

```ts
// src/lib/api.ts
export const api = axios.create({ baseURL: "/api" });
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  if (data.session) config.headers.Authorization = `Bearer ${data.session.access_token}`;
  return config;
});
```

### 2. Server state — always React Query
- No `useState` + `useEffect` for data fetching. Typed `useQuery` / `useMutation`.
- Cache/queries live in `src/lib/queries.ts` (or `features/*/queries.ts`).
- Global `QueryClient` in Provider; consistent `queryKey`/`mutationKey`.

```ts
const { data, isLoading, error } = useQuery({
  queryKey: ["expenses", status, page],
  queryFn: () => api.getExpenses({ status, page }),
});
```

### 3. URL state — always nuqs
- URL parameters (filters, search, pagination) with `useQueryState` / `useQueryStates`. NEVER `useState` for state that belongs in the URL.
- PWA: enables sharing/deep-linking filter state.

```ts
const [status, setStatus] = useQueryState("status", { defaultValue: "all" });
```

### 4. Env vars — always t3-env + zod
- Never read `process.env.` directly in code.
- Single schema in `src/lib/env.ts` via `createEnv` from `@t3-oss/env-nextjs`. Client vars prefixed `NEXT_PUBLIC_`.

```ts
// src/lib/env.ts
export const env = createEnv({
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
});
```

### 5. Next.js API routes
- REST under `src/app/api/**/route.ts`. Input validation with zod inside the handler.
- Standard JSON responses: `{ ... }` on success, `{ error: string }` with correct HTTP status.

## Structure (front/src)

```
src/
  app/                     # routes + page.tsx SPA-ish (client components)
    api/                   # REST: auth, expenses, upload, ocr
  components/              # reusable UI
  features/<feature>/      # queries, mutations, components per feature (e.g., expenses, auth)
  lib/
    api.ts                 # axios instance
    env.ts                 # t3-env schema
    supabase.ts            # supabase-js client
  types/                   # shared DTOs
```

## Do not use (unless approved)

- Manual `fetch()`, raw axios without typed instance
- `useState`/`useEffect` for server data
- `useState` for URL state (use nuqs)
- `process.env` outside `src/lib/env.ts`
- New library without prior approval
- CSS modules/sass over Tailwind (rare exception only)