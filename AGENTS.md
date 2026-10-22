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
- CRM data lives in Lovable Cloud tables (profiles, user_roles, properties, leads, interactions); `src/lib/crm/store.tsx` loads it client-side under the `_authenticated` layout (ssr: false) and writes optimistically — the session lives in browser storage, so SSR cannot read it.
- Lead visibility is enforced by database RLS (owner or admin role via `has_role`); the admin "Simular como" switcher only narrows the client view and never widens what a corretor can read.
- Public sign-up is disabled; accounts are created only by an admin through the `createTeamMember` server function (role re-checked server-side). The first account ever created becomes admin via the `handle_new_user` trigger.
- Permission and matching logic (`visibleLeads`, `smartMatch`, WhatsApp links, urgency) stays pure in `src/lib/crm/rules.ts` with tests in `rules.test.ts`; components never re-implement these rules.
- Property photos are stored as `asset:<key>` references (or data URLs for uploads) and resolved through `img()` in `src/lib/crm/images.ts`, so bundled asset hashes never end up persisted.
