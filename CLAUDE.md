# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Family tree app: Go (Fiber v2) API + PostgreSQL backend, React 18 + Vite + TypeScript frontend that renders trees with React Flow (`@xyflow/react`) and ELK.js. Long-form architecture docs (in Turkish) live in `PROJECT_STRUCTURE.md` and `SISTEM_VE_VERI_MIMARISI.md`. Log messages and API error strings are in Turkmen (no Turkish anywhere in the app); UI default language is Turkmen.

## Commands

Copy `.env.example` to `.env` first (docker-compose's backend uses `env_file: .env`).

```bash
# Full stack in Docker (postgres :5432, api :8080, web :5173)
make up / make down / make logs

# Local dev without Docker for app code
make dev-db          # postgres only
make dev-backend     # go run ./cmd/api (needs DB_HOST=localhost when run outside Docker)
make dev-frontend    # vite on :5173, proxies /api and /uploads to localhost:8080

# Backend
make build           # go build -o bin/api ./cmd/api
make test            # go test ./... -v  (tests marked t.Skip("MÄLIM ÝALŇYŞLYK…") document known bugs)
cd backend && go test ./internal/service -run TestName -v   # single test
make lint            # golangci-lint run

# Frontend (from frontend/)
npm run build        # tsc && vite build -> dist/
npm run type-check
npm run lint         # note: no eslint config file is checked in
```

**Frontend Docker image does not build the app.** `frontend/Dockerfile` just runs `server.mjs`, which serves `frontend/dist` (bind-mounted from the host) and reverse-proxies `/api` and `/uploads` to `BACKEND_URL` (default `http://backend:8080`). Run `npm run build` on the host before/after frontend changes for the Docker web container to reflect them.

## Backend architecture (`backend/`, module `familytree`)

Layered: `domain` (models + repository interfaces) → `repository` (impls) → `service` → `handler` (Fiber routes under `/api/v1`). Wiring is all in `cmd/api/main.go`, which also defines a few inline routes (`/trees`, `/search`, `/seed`, `/health`).

- **Dual storage mode:** on startup `main.go` tries PostgreSQL; if the connection fails it silently falls back to in-memory repos (`repository/mem_*_repo.go`) and `treeRepo` stays `nil`. `TreeMetaService` handles a nil `treeRepo` by using hardcoded default trees. `/api/v1/health` reports which `mode` is active. Any new repository method must be implemented in both the postgres and in-memory versions.
- **Migrations:** `postgres.RunMigrations` executes every `migrations/*.up.sql` in sorted order on *every* startup (not golang-migrate state tracking), so up-migrations must be idempotent (`IF NOT EXISTS` etc.). `make migrate` uses golang-migrate separately. `seed_turkmen_trees.sql` is not auto-run.
- **Auto-seed:** if the person table is empty at startup, `SeedService.SeedDemoData()` loads demo Turkmen family trees. `POST /api/v1/seed` re-seeds (clears in-memory repos via the `clearable` interface).
- **Multi-tree:** persons and relationships carry a string `tree_id` (default `"my-tree"`). Trees have `is_owner`; non-owned trees are read-only in the UI. There is no real auth — `JWT_SECRET` is loaded but unused.
- **Relationships** are directed rows (`person_id` → `related_person_id`) typed `parent | child | spouse | former_spouse | adoptive_parent | adoptive_child`. `TreeService.BuildTree` converts them into React Flow nodes/edges: parent/adoptive_parent → `bloodEdge`, spouse/former_spouse → `spouseEdge`; other types are dropped, and edges to persons outside the tree are skipped. Edges carry `relationship_type` and only the user's own `label` (notes). Node positions are left at 0,0 — layout is done client-side.
- **Gender is binary:** only `male` / `female`. Enforced by `GenderType.Valid()` in person validation and the `persons_gender_binary` CHECK constraint (migration 000004); the Postgres enum still lists the old labels because enum values can't be dropped.
- **API responses carry no display text.** Edge labels default to empty and search results return `match_field` / `birth_year` / `is_living` instead of formatted strings, so the frontend renders every label in the UI language. Keep it that way when adding fields.
- Uploaded photos are written to `./uploads` and served statically at `/uploads` (bind-mounted to `backend/uploads` in Docker).

## Frontend architecture (`frontend/src`, alias `@` → `src`)

- `services/*` wrap an axios instance with `baseURL: '/api/v1'`; `hooks/useTree.ts` / `usePerson.ts` fetch and orchestrate data.
- `features/tree/layoutEngine.ts` groups spouses (union-find over spouse edges) into one "family block" per couple, runs ELK `layered` (DOWN) over blocks + parent→child edges so spouses share a generation row, then expands blocks into side-by-side cards. A child of a couple gets one `bloodEdge` with `data.partnerId`; `BloodEdge` reads both parents live via `useInternalNode` to start the line mid-marriage. Spouse lines use the `spouse-left`/`spouse-right` handles at `SPOUSE_ANCHOR_Y`. Card sizes are constants there and must match `.person-node` in `tree.css`. User-dragged positions are saved in `localStorage` under `familytree_positions_<treeId>` and override the layout.
- `features/tree/TreeEventsContext.tsx`: node action callbacks (add parent/spouse/child, view profile) are provided via context rather than stored in node `data` — this was done to fix React Flow infinite re-render/flicker. Keep callbacks out of node data.
- `PersonNode` / `FamilyEdge` are the custom React Flow node/edge types matching backend `personNode` / `bloodEdge` / `spouseEdge`.
- i18n (`i18n/locales/{tk,en,ru}.ts`): the UI supports exactly Turkmen, English and Russian (`supportedLngs`; regional browser locales map to the base language); Turkmen is the fallback. Never hardcode UI text — add keys to all three locales, using i18next plural suffixes for counts (Russian needs `_one/_few/_many/_other`). `i18n/format.ts` has the shared lifespan formatter. `<Toaster>` is rendered inside App's themed root so toasts get theme colors.
- Styling: Tailwind plus `styles/globals.css` and `styles/tree.css`; dark glassmorphic theme. Canvas theme persists in `localStorage` key `familytree_canvas_theme`.
