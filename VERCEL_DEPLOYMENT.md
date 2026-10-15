# Deploy the backend to Vercel

## Prerequisites

- Vercel project connected to this repository.
- A PostgreSQL database reachable from Vercel; use the provider's pooled connection URL for function traffic.
- Production and staging credentials for PostgreSQL, Cloudinary, and Resend.
- Node.js `24.x` and pnpm `10.28.0` (pinned in `package.json`).

## Create the Vercel project

1. Import the repository into Vercel.
2. Set **Root Directory** to `.` (the root of this repository) and leave framework detection, install command, build command, and output directory on **Auto / Default**. Vercel detects `src/main.ts` as the NestJS entrypoint and builds it as a single Vercel Function.
3. Add the environment variables below separately for Production, Preview, and Development. Use staging database and service credentials for Preview and Development.
4. Set the function region closest to the database and leave Fluid Compute enabled. The PDF renderer uses Chromium, so test PDF generation in a Preview deployment with the function memory available on your Vercel plan.
5. Deploy a Preview first, run the smoke checks below, then promote it to Production.

## Environment variables

Required in every environment:

- `DATABASE_URL`: PostgreSQL URL. Alternatively, provide all of `SUPABASE_DB_HOST`, `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD`, and `SUPABASE_DB_NAME` (or the equivalent `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` variables).
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`: distinct random secrets of at least 32 characters. Generate separately (for example, with `openssl rand -base64 48`).

Required in Production (recommended for Preview too):

- `FRONTEND_URL`: HTTPS origin used in email links and CORS.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: file storage.
- `RESEND_API_KEY`: email delivery.

Optional:

- `CORS_ALLOWED_ORIGINS`: comma-separated additional exact origins, with no wildcard. Configure each Preview frontend origin in the Preview environment.
- `JWT_ACCESS_EXPIRES` (`15m`) and `JWT_REFRESH_EXPIRES` (`7d`): token lifetimes.
- `NODE_ENV`: Vercel sets the deployment mode; production deployments must run with `production`.
- `DATABASE_SSL_REJECT_UNAUTHORIZED`: defaults to certificate verification. Set `false` only for a local database with a self-signed certificate.
- `PORT`: assigned by Vercel; locally defaults to `9998`.
- `PUPPETEER_EXECUTABLE_PATH`: local Chrome path for PDF generation outside Vercel.
- `SEED_ADMIN_PASSWORD`: only needed when running the seed command; never add it to normal deployments.
- `LEGACY_PARENT_DEFAULT_PASSWORD`: during cutover only, set this to the previous shared initial parent password. When a legacy parent uses it, the backend rotates that password and sends a one-time setup link. Remove it after legacy accounts have been reset.

Do not commit `.env` files. The app validates database and JWT settings at startup, and requires the email, storage, and frontend settings in production.

## Database migrations

Migrations are deliberately not run by application startup, because Vercel may initialize multiple function instances at once. Before deploying a schema change, run `pnpm run migration:run` once from a trusted release environment with the intended database credentials. Prefer a direct PostgreSQL connection for migrations if the provider's transaction pooler does not support migration locks. Deploy the app only after the migration succeeds.

## Deploy and verify

Push a branch to create a Preview deployment, or deploy with the Vercel CLI from the repository root (`vercel`). Use `vercel --prod` only when you intend to publish to Production.

Check `GET /` and `GET /api/health`; each returns `{ "status": "ok", "timestamp": "..." }`. Check the GraphQL endpoint at `/graphql`. Review the Vercel deployment Build Logs for compilation and Function Logs for startup or request errors.

## Runtime limits

- Vercel Functions have no persistent process, local disk, or always-running worker. This backend has no scheduled worker or WebSocket server; uploads are stored in Cloudinary and application state is in PostgreSQL.
- Vercel limits each Function request and response body to 4.5 MB. GraphQL multipart uploads currently allow up to 10 MB in Nest, but payloads over Vercel's platform limit will receive `413`; larger uploads need a direct-to-Cloudinary upload flow. Large generated PDFs can hit the response limit too. [Vercel documents this platform limit](https://vercel.com/docs/functions/limitations).
- PDF generation depends on the bundled `@sparticuz/chromium` binary and extra memory. Confirm the Vercel build includes the Chromium assets and test PDF generation in a Preview before Production.
- Use a pooled database URL and keep the pool small: each warm Nest instance can open up to five PostgreSQL connections. This reduces per-instance usage but cannot guarantee a global cap across autoscaled instances.
- Vercel CLI deployment and production integration were not exercised from this workspace; the Vercel project and external credentials must be configured in the dashboard.
