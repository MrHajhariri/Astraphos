# Astraphos

**Version:** `v0.1.0 - Initial Public Preview`

Astraphos is an open-source, AI-ready knowledge workspace for people who want to own their notes, documents, and project knowledge.

The MVP focuses on the core Notion-like foundation: authenticated workspaces, nested pages, rich-text editing, search, templates, relationships between pages, local uploads, PostgreSQL storage, and simple self-hosting.

## Preview

![Astraphos MVP workspace preview](public/screenshots/astraphos-mvp.png)

## Status

Astraphos `v0.1.0 - Initial Public Preview` is currently an MVP. It is usable for local/self-hosted personal workspaces, but it is not yet a polished production SaaS.

Current priorities:

- Stabilize the document model and editing experience
- Improve page management with deletion, reordering, and drag-and-drop
- Add a real slash-command menu
- Prepare the app for future collaboration and AI features

## Features

- Email/password authentication with secure HTTP-only session cookies
- Automatic personal workspace creation on signup
- Nested pages with a persistent sidebar tree
- Rich-text editing powered by TipTap
- Markdown shortcuts for common editor actions
- Headings, paragraphs, lists, quotes, code blocks, links, and images
- Search across page titles and extracted document text
- Local file/image uploads stored under `public/uploads`
- Page favorites
- Page templates for faster document creation
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

Important: local file uploads use `public/uploads`, which is not persistent on Vercel. For production Vercel deployments, replace local uploads with object storage such as S3, R2, or Supabase Storage.

## Environment Variables

```env
DATABASE_URL="postgresql://astraphos:astraphos@localhost:5432/astraphos?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
```

`AUTH_SECRET` should be a long, random value in every non-local environment.

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

Note: a local non-Docker `npm run build` previously failed in this environment with a low-level `Bus error`, while the Docker build completed successfully. TypeScript and ESLint both pass locally.

## Roadmap

Near-term:

- Page deletion and archive/restore
- Sidebar drag-and-drop reordering
- Real slash-command menu
- Better template management
- Better upload handling and object storage support
- Workspace settings

Later:

- Realtime collaboration
- Comments
- Public share links
- Database/table views
- AI writing assistant
- Workspace-aware AI search and Q&A
- Lore-specific entities, timelines, and graph views

## License

No license has been selected yet. Add a license before accepting external contributions or publishing packages.
