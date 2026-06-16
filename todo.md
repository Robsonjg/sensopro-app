# TODO

- [x] Inspect and update `client/tsconfig.json` to prevent `tsc` from compiling server-only workspace files.
- [x] Add missing client dependencies to `client/package.json` (`streamdown`, Radix UI packages, `next-themes`, `@types/google.maps`).

- [x] Re-run `npm run build --workspace=client`.

- [ ] If server-only type errors persist, locate which `shared`/client file imports `drizzle-orm`/`express`/`zod` and fix the import boundaries.

