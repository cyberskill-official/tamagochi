# Vercel and Supabase Deployment

This repo is deployment-ready for a Vercel static web build plus Vercel Functions and two Supabase projects:

- `tamagochi-standard`: 13+ / standard SKU
- `tamagochi-kids`: dedicated kids SKU, kept separate for COPPA and PDPL data minimisation

## Vercel

The Vercel project is linked as `cyberskill-official/tamagochi`.

Useful commands:

```sh
npm run deploy:ready
vercel build --yes --scope cyberskill-official
vercel deploy --prebuilt --scope cyberskill-official
vercel deploy --prebuilt --prod --scope cyberskill-official
```

The web build copies the game to `dist/vercel-static` and the QA surface to `dist/vercel-static/qa`.

Production health checks:

```sh
curl -fsS https://tamagochi-amber.vercel.app/api/health
curl -i https://tamagochi-amber.vercel.app/api/supabase/health
```

`/api/supabase/health` returns `503 missing_supabase_env` until Supabase public env vars are attached to the Vercel project.

## Supabase Marketplace Install

Install Supabase through the Vercel Marketplace before adding production values:

```sh
vercel integration add supabase --scope cyberskill-official
```

If the CLI returns `integration_terms_acceptance_required`, open the provided Vercel URL, review the linked Supabase/Vercel terms, accept them as the account owner, then retry the command. Do not bypass this gate from automation.

After the integration is installed, pull env values:

```sh
vercel env pull .env.local --yes --scope cyberskill-official
vercel env ls --scope cyberskill-official
```

Required Vercel env vars:

```sh
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Supabase Migrations and Edge Functions

Deploy the standard project:

```sh
SUPABASE_ACCESS_TOKEN=... \
SUPABASE_PROJECT_REF=... \
SUPABASE_DB_PASSWORD=... \
npm run supabase:deploy:standard
```

Deploy the kids project:

```sh
SUPABASE_ACCESS_TOKEN=... \
SUPABASE_KIDS_PROJECT_REF=... \
SUPABASE_DB_PASSWORD=... \
npm run supabase:deploy:kids
```

The deploy script stages `infra/supabase/<target>` into `.supabase-deploy/<target>`, runs `supabase link`, runs `supabase db push`, deploys the target Edge Functions, and removes the staging directory afterward.

Required Supabase function secrets:

```sh
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PARENTAL_CONSENT_WEBHOOK_SECRET=
BREACH_DRAFT_WEBHOOK_SECRET=
SAFE_HARBOR_WEBHOOK_SECRET=
ALLOWED_ORIGINS=https://tamagochi-amber.vercel.app
```

## CI

GitHub Actions are prepared for:

- `.github/workflows/vercel-deploy.yml`: Vercel preview/production deploys.
- `.github/workflows/supabase-migrate.yml`: manual Supabase deploy for `standard` or `kids`.

Configure these GitHub secrets before enabling the workflows:

```sh
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
SUPABASE_ACCESS_TOKEN=
SUPABASE_PROJECT_REF=
SUPABASE_KIDS_PROJECT_REF=
SUPABASE_DB_PASSWORD=
```
