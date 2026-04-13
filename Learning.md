# Learning Log

## 2026-04-13 — Hydration Error from Browser Extension (Text Blaze)

### Issue
A `Recoverable Error` appeared in the Next.js dev overlay:
> "Hydration failed because the server rendered HTML didn't match the client."

The error pointed to `src/components/table/filter-panel.tsx (73:7) @ FilterPanel`.

### Root Cause
The **Text Blaze** browser extension injects a `<text-blaze-app-reference style={{display:"contents"}} role="none">` element into the DOM before React hydrates on the client. Since the server-rendered HTML doesn't include this element, React detects a mismatch between server and client DOM trees and throws the hydration error.

This is not a code bug — it's caused by browser extensions modifying the DOM between initial HTML load and React hydration.

### Proposed Fix
Added `suppressHydrationWarning` to:
1. The `<body>` tag in `src/app/layout.tsx`
2. The `<div role="dialog">` in `src/components/table/filter-panel.tsx`

### Result: Did NOT work
`suppressHydrationWarning` only suppresses **text content** mismatches on the element it's applied to. It does **not**:
- Cascade to child elements
- Suppress mismatches caused by **extra DOM nodes** injected by extensions

The hydration error persisted because the extension injects an entirely new element, not just different text content.

### Approaches Still To Try
- **Dynamic import with `ssr: false`**: Use `next/dynamic` to skip server-rendering the FilterPanel entirely, so there's no server HTML to mismatch against.
- **Client-only wrapper component**: Create a component that renders `null` on the server and only mounts children after `useEffect`, avoiding any SSR comparison.
- **Disable the extension on localhost**: Simplest workaround — configure Text Blaze to not run on `localhost`/`127.0.0.1`.
- **Move to a portal**: Render the dialog via `createPortal` into a dynamically created container, which may avoid the extension's injection point.

### Key Takeaway
`suppressHydrationWarning` is narrowly scoped — it only handles text-content differences on the exact element, not structural DOM changes from injected nodes. For extension-caused hydration errors involving extra elements, a different strategy (client-only rendering or portals) is needed.
