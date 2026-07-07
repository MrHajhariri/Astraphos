# Astraphos

**Version:** `v0.4.0 - Organization And Node Types`

Astraphos is an open-source, AI-ready knowledge workspace for people who want to own their notes, documents, and project knowledge.

The MVP focuses on the core Notion-like foundation: authenticated workspaces, nested pages, rich-text editing, wiki links, backlinks, an interactive knowledge graph, a Markdown Vault, tags, folders, custom node types, configurable uploads, PostgreSQL storage, and simple self-hosting.

## Preview

![Astraphos workspace preview](public/screenshots/astraphos-mvp.png)

## Status

Astraphos `v0.4.0 - Organization And Node Types` is currently an MVP. It is usable for local/self-hosted personal workspaces, but it is not yet a polished production SaaS.

Current priorities:

- Stabilize the document model and editing experience
- Polish graph navigation, animation, and large-workspace performance
- Improve metadata workflows for tags, folders, and node types
- Prepare the app for future collaboration and AI features

## What's New In v0.4.0

- Tags for notes and Vault files
- Vault folders for organizing `.md` files
- Custom node types with workspace-level defaults and creation
- Graph filters by tag, folder, node type, content source, connectivity, and title search
- Markdown import into the Vault
- Single-file Markdown export from the Vault
- Direct delete button for normal notes

## Features

- Email/password authentication with secure HTTP-only session cookies
- Automatic personal workspace creation on signup
- Nested pages with a persistent sidebar tree
- Sidebar drag-and-drop page reordering
- Page archive, restore, and permanent deletion
- Markdown Vault for database-backed `.md` files
- Vault folders and Markdown import/export
- Wiki-style `[[Page Name]]` links across notes and Vault files
- Automatic backlinks
- Tags for notes and Vault files
- Custom graph node types
- Interactive knowledge graph with tag, folder, node type, source, and connectivity filters
- Most-connected pages/files view
- Rich-text editing powered by TipTap
- Slash-command menu for common editor blocks
- Markdown shortcuts for common editor actions
- Headings, paragraphs, lists, quotes, code blocks, links, and images
- Search across page titles and extracted document text
- Local or S3-compatible image uploads with server-side validation
- Page favorites
- Page templates with workspace-level management
- Workspace settings for owner-managed name and slug updates
- Manual relationships between pages
- Dark mode toggle
- PostgreSQL database with Prisma ORM
- Docker Compose setup for local self-hosting
- Vercel-compatible deployment path

## Tech Stack

- Framework: Next.js App Router
- UI: React, Tailwind CSS
- Editor: TipTap
- Database: PostgreSQL
- ORM: Prisma
- Auth: Email/password, bcrypt, JWT session cookie via `jose`
- Runtime: Node.js
- Deployment: Docker Compose, Vercel-compatible

## Project Structure

```text
astraphos/
  prisma/                 Prisma schema
  public/                 Static assets and local uploads
  src/app/                Next.js routes
  src/components/         UI and editor components
  src/lib/                Auth, database, actions, editor utilities
  Dockerfile              Production Docker image
  docker-compose.yml      App + PostgreSQL self-hosting setup
```

## Requirements

- Node.js 22+
- npm
- Docker and Docker Compose
- PostgreSQL, either local, Dockerized, or hosted

## Local Development

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Start PostgreSQL with Docker:

```bash
docker compose up db -d
```

Push the Prisma schema to the database:

```bash
npm run db:push
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` and create your first account.

## Docker Self-Hosting

Start the full stack:

```bash
docker compose up --build
```

The Compose setup includes:

- A PostgreSQL 17 container
- An Astraphos web container
- Persistent database storage through the `astraphos-db` volume
- Persistent local uploads through the `astraphos-uploads` volume
- A database healthcheck so the web container waits for PostgreSQL before starting

For production self-hosting, replace these values before exposing the app publicly:

- `AUTH_SECRET`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`

## Vercel Deployment

Astraphos can be deployed to Vercel with an external PostgreSQL database.

Recommended hosted database options:

- Vercel Postgres
- Neon
- Supabase Postgres
- Railway Postgres
- Render Postgres

Deployment steps:

1. Create a PostgreSQL database.
2. Set `DATABASE_URL` in Vercel.
3. Set `AUTH_SECRET` in Vercel to a long random string.
4. Deploy the `astraphos` project directory.
5. Run `npm run db:push` once against the production database, or switch to Prisma migrations when the schema is stable.

Important: local file uploads use `public/uploads`, which is not persistent on Vercel. For production Vercel deployments, set `STORAGE_PROVIDER="s3"` and configure an S3-compatible provider such as S3, R2, MinIO, or Supabase Storage.

## Environment Variables

```env
DATABASE_URL="postgresql://astraphos:astraphos@localhost:5432/astraphos?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
STORAGE_PROVIDER="local"
UPLOAD_MAX_BYTES="5242880"
S3_ENDPOINT=""
S3_REGION="auto"
S3_BUCKET=""
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_PUBLIC_URL=""
```

`AUTH_SECRET` should be a long, random value in every non-local environment.
`STORAGE_PROVIDER` defaults to `local`. Use `s3` for S3-compatible object storage.
`UPLOAD_MAX_BYTES` controls the server-side upload size limit.

## Scripts

```bash
npm run dev          # Start the development server
npm run build        # Build for production
npm run start        # Start the production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema changes to the database
npm run db:migrate   # Create and apply a Prisma migration
npm run db:studio    # Open Prisma Studio
```

## Verification

The MVP has been checked with:

```bash
npm run lint
npx tsc --noEmit
docker compose up --build -d
```

The Docker build completes successfully and the app responds at `http://localhost:3000`.

Note: a local non-Docker `npm run build` currently fails in this environment with a low-level `Bus error`, while TypeScript and ESLint pass locally. Docker remains the recommended production verification path for this environment.

## Roadmap

Near-term:

- Full drag-to-reparent support in the sidebar
- Template body editing with the rich-text editor
- Better tag/folder/node-type management screens
- Stronger storage management, including asset deletion and signed/private URLs
- More complete workspace administration and member management

Later:

- Realtime collaboration
- Comments
- Database/table views
- Lore-specific entities, timelines, and graph views

## License

MIT
