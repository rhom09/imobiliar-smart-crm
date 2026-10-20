<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- CRM data (leads, properties, simulated viewer) lives in a client-side React context (`src/lib/crm/store.tsx`) persisted to localStorage and loaded after mount — dates are relative to "now" and storage is browser-only, so loading during SSR would cause hydration mismatches. Move to Lovable Cloud when real multi-user persistence is needed.
- Permission and matching logic (`visibleLeads`, `smartMatch`, WhatsApp links, urgency) stays pure in `src/lib/crm/rules.ts` with tests in `rules.test.ts`; components never re-implement these rules.
- Property photos are stored as `asset:<key>` references (or data URLs for uploads) and resolved through `img()` in `src/lib/crm/images.ts`, so bundled asset hashes never end up persisted.
