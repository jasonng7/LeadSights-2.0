# LeadSights 2.0

AI-powered local lead intelligence for finding, filtering, scoring, and preparing outreach to businesses discovered through Google Maps.

## Features

- Google Maps lead discovery by business type and location
- Lead filters for distance, rating range, review count, missing website, and business status
- Real lead scoring based on opportunity and contactability signals
- OpenAI-generated sales battle cards from business details, reviews, and your company profile
- Supabase-backed company profile management
- Lead table, map view, reviews dialog, and CSV/JSON export

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Supabase
- OpenAI API
- Google Maps / Places API
- Vercel Analytics

## Environment Variables

Create `.env.local` for local development:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is used only in server actions. Do not expose it in client code.

## Supabase Setup

Run the SQL in `scripts/001-create-profiles-table.sql` in your Supabase SQL editor.

## Development

```bash
corepack pnpm install
corepack pnpm dev
```

## Quality Checks

```bash
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
```
