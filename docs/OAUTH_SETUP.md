# GitPulse OAuth Setup

## 1. What Stage 2.6 Adds

Stage 2.6 adds a normal GitHub login flow while keeping the frontend on GitHub Pages.

```text
GitHub Pages frontend
+ Cloudflare Worker OAuth broker
```

The browser never receives the GitHub OAuth client secret. The Cloudflare Worker exchanges the returned OAuth `code` for an access token and sends the token back to the frontend for session-scoped GraphQL contribution calendar requests.

Manual token entry remains available as an advanced development fallback.

---

## 2. Important Configuration Model

GitPulse uses **one Worker codebase** and different configuration for local development and production.

Do not create a second copy of the `worker/` folder for production.

Use this model:

```text
worker/ codebase
  ├─ local development config: worker/.dev.vars
  └─ production config: Cloudflare Worker variables/secrets
```

Simple rule:

```text
.dev.vars = local development secrets/config
Cloudflare secrets = production secrets
wrangler.toml = Worker shape/config, not a secrets file
```

Recommended OAuth apps:

```text
GitPulse Local Dev
  Callback: http://localhost:5173/GitPulse/

GitPulse Production
  Callback: https://plumbjam.github.io/GitPulse/
```

Creating two OAuth Apps avoids constantly editing callback URLs when switching between local and production.

---

## 3. GitHub OAuth Apps

Create OAuth Apps from:

```text
GitHub -> Settings -> Developer settings -> OAuth Apps -> New OAuth App
```

### 3.1 Local development OAuth App

Use this app while running GitPulse and the Worker locally.

```text
Application name: GitPulse Local Dev
Homepage URL: http://localhost:5173/GitPulse/
Authorization callback URL: http://localhost:5173/GitPulse/
```

Important:

- use `localhost` consistently;
- do not mix `localhost` and `127.0.0.1`;
- GitHub treats them as different callback hosts.

### 3.2 Production OAuth App

Use this app for the deployed GitHub Pages site.

```text
Application name: GitPulse
Homepage URL: https://plumbjam.github.io/GitPulse/
Authorization callback URL: https://plumbjam.github.io/GitPulse/
```

GitPulse is a single-page app, so the callback URL can point at the app root. The app reads `code`, `state`, and `error` query params, then removes them from the URL after processing.

---

## 4. OAuth Scope

Stage 2.6 uses:

```text
read:user
```

Do not request `repo` scope for this stage. Contribution calendar GraphQL access should work with authenticated user context without broad repository access. If future GitHub API behavior requires a different scope, document the reason before changing it.

---

## 5. Local Development Setup

Complete local OAuth first before attempting production deployment.

You need two terminals:

1. one for the Cloudflare Worker;
2. one for the Vite frontend.

### 5.1 Frontend local environment

From the repository root:

```cmd
cd /d D:\Projects\GitPulse
copy .env.example .env.local
notepad .env.local
```

Set:

```text
VITE_GITHUB_OAUTH_CLIENT_ID=your-local-oauth-client-id
VITE_GITHUB_OAUTH_BROKER_URL=http://localhost:8787/oauth/github/exchange
```

These frontend values are public config, not secrets.

Restart the Vite dev server after changing `.env.local`.

### 5.2 Worker local config

From the Worker folder:

```cmd
cd /d D:\Projects\GitPulse\worker
npm install
copy .dev.vars.example .dev.vars
notepad .dev.vars
```

Set local values:

```text
GITHUB_CLIENT_ID=your-local-oauth-client-id
GITHUB_CLIENT_SECRET=your-local-oauth-client-secret
ALLOWED_ORIGIN=http://localhost:5173
ALLOWED_REDIRECT_URIS=http://localhost:5173/GitPulse/
```

Do not commit `.dev.vars`.

### 5.3 Worker config file

Wrangler needs a Worker config file.

If `worker/wrangler.toml` does not exist yet:

```cmd
cd /d D:\Projects\GitPulse\worker
copy wrangler.toml.example wrangler.toml
notepad wrangler.toml
```

Make sure it contains at least:

```toml
name = "gitpulse-oauth-worker"
main = "src/index.ts"
compatibility_date = "2026-05-01"
```

Do not put `GITHUB_CLIENT_SECRET` in `wrangler.toml`.

`wrangler.toml` should describe the Worker shape and safe non-secret config only.

### 5.4 Run the Worker locally

Terminal 1:

```cmd
cd /d D:\Projects\GitPulse\worker
npm run dev
```

You want the Worker running at something like:

```text
http://localhost:8787
```

If Wrangler reports a missing entry point, confirm `wrangler.toml` exists and contains:

```toml
main = "src/index.ts"
```

### 5.5 Run the frontend locally

Terminal 2:

```cmd
cd /d D:\Projects\GitPulse
npm run dev
```

Open:

```text
http://localhost:5173/GitPulse/
```

Use `localhost`, not `127.0.0.1`, unless your GitHub OAuth App callback and Worker allowed redirect values also use `127.0.0.1`.

---

## 6. Local Runtime Test

1. Start the Worker locally.
2. Start the Vite frontend locally.
3. Open `http://localhost:5173/GitPulse/`.
4. Click `Log in with GitHub`.
5. Approve the local GitPulse OAuth App.
6. GitHub redirects back with `code` and `state`.
7. GitPulse validates `state`.
8. GitPulse posts `code` and `redirectUri` to the local Worker.
9. Worker exchanges the code with GitHub.
10. Frontend stores the returned token in `sessionStorage`.
11. Contribution calendars refresh through the existing GraphQL pipeline.
12. GitPulse removes callback params from the URL.

Do not move to production deployment until this local flow works end-to-end.

---

## 7. Production Deployment Model

Production uses the same `worker/` codebase.

The difference is where values live:

```text
Local:
  worker/.dev.vars

Production:
  Cloudflare Worker secrets and variables
```

Production should use:

```text
ALLOWED_ORIGIN=https://plumbjam.github.io
ALLOWED_REDIRECT_URIS=https://plumbjam.github.io/GitPulse/
```

The production GitHub OAuth App should use:

```text
Authorization callback URL: https://plumbjam.github.io/GitPulse/
```

---

## 8. Cloudflare Worker Production Deployment

From the Worker folder:

```cmd
cd /d D:\Projects\GitPulse\worker
```

If you have not already logged in to Cloudflare:

```cmd
npx wrangler login
```

Create or review `wrangler.toml`:

```cmd
copy wrangler.toml.example wrangler.toml
notepad wrangler.toml
```

Set safe non-secret production values in `wrangler.toml` or the Cloudflare dashboard:

```text
GITHUB_CLIENT_ID=your-production-oauth-client-id
ALLOWED_ORIGIN=https://plumbjam.github.io
ALLOWED_REDIRECT_URIS=https://plumbjam.github.io/GitPulse/
```

Set the production client secret as a Cloudflare secret:

```cmd
npx wrangler secret put GITHUB_CLIENT_SECRET
```

Then deploy:

```cmd
npm run deploy
```

After deployment, Cloudflare will provide a Worker URL similar to:

```text
https://your-worker.your-subdomain.workers.dev
```

The production broker URL is:

```text
https://your-worker.your-subdomain.workers.dev/oauth/github/exchange
```

---

## 9. Production Frontend Configuration

For the GitHub Pages frontend, set these build-time values:

```text
VITE_GITHUB_OAUTH_CLIENT_ID=your-production-oauth-client-id
VITE_GITHUB_OAUTH_BROKER_URL=https://your-worker.your-subdomain.workers.dev/oauth/github/exchange
```

These values are public config, not secrets.

How you set them depends on how GitHub Pages is deployed:

### If building locally

Use a production env file, for example:

```text
.env.production
```

Then rebuild and deploy the site.

### If building with GitHub Actions

Add repository variables or secrets and pass them into the build job as environment variables.

Do not add the GitHub OAuth client secret to Vite env vars.

---

## 10. Token Storage

OAuth token storage:

```text
sessionStorage key: gitpulse.oauth.token
```

Reason:

- survives refresh during one browser session;
- clears when the browser session ends;
- avoids a backend session database for this open-source static app.

Manual token storage remains memory-only and is intended for development fallback.

---

## 11. Security Notes

- Never commit `GITHUB_CLIENT_SECRET`.
- Never expose `GITHUB_CLIENT_SECRET` through Vite env vars.
- Never put `GITHUB_CLIENT_SECRET` in `.env.local`, `.env.production`, or any frontend file.
- Do not log OAuth access tokens.
- Do not log GitHub client secrets.
- Validate OAuth `state` before broker exchange.
- Keep OAuth callback params out of the URL after processing.
- Treat private contribution counts as anonymous count data only.
- Keep `.dev.vars`, `.env.local`, and deployment-specific config out of source control when they contain local or private values.

---

## 12. Troubleshooting

### `Log in with GitHub` is disabled or shows configuration errors

Check:

- `VITE_GITHUB_OAUTH_CLIENT_ID`;
- `VITE_GITHUB_OAUTH_BROKER_URL`;
- restart the Vite dev server after changing `.env.local`.

### GitHub shows `redirect_uri is not associated with this application`

The OAuth App callback URL does not exactly match the redirect URI used by the frontend.

Common local mismatch:

```text
OAuth App callback: http://localhost:5173/GitPulse/
Login URL redirect_uri: http://127.0.0.1:5173/GitPulse/
```

Fix by using `localhost` everywhere, or update all values consistently to `127.0.0.1`.

Recommended local values:

```text
Browser URL: http://localhost:5173/GitPulse/
OAuth callback: http://localhost:5173/GitPulse/
ALLOWED_ORIGIN=http://localhost:5173
ALLOWED_REDIRECT_URIS=http://localhost:5173/GitPulse/
```

### GitHub redirects back but login fails

Confirm:

- the OAuth App callback URL exactly matches the frontend redirect URI;
- the Worker has the same `GITHUB_CLIENT_ID`;
- `GITHUB_CLIENT_SECRET` is set correctly;
- `ALLOWED_REDIRECT_URIS` includes the callback URL;
- the OAuth `code` has not already been used.

OAuth codes are single-use. Retry from the login button if needed.

### Browser CORS error

Confirm:

```text
ALLOWED_ORIGIN=http://localhost:5173
```

for local, or:

```text
ALLOWED_ORIGIN=https://plumbjam.github.io
```

for production.

Also confirm the frontend broker URL includes:

```text
/oauth/github/exchange
```

### Contribution calendar still uses approximate data

- refresh contribution calendars after login;
- confirm at least one fetched identity has `success` status;
- check for friendly GraphQL errors in the connection panel;
- confirm the OAuth token exists in `sessionStorage`.

### Wrangler reports `Missing entry-point to Worker script`

Create `worker/wrangler.toml` from the example and make sure it includes:

```toml
main = "src/index.ts"
```

---

## 13. Fallback Behaviour

Without OAuth or a manual token, GitPulse still works:

- public REST profile/repo/language data can be fetched;
- demo data can be loaded;
- approximate contribution activity is used for grid/audio fallback;
- Stage 3.2 playback remains available from normalized data.

---

## 14. Recommended Rollout Order

Use this order:

```text
1. Local OAuth App
2. Local Worker .dev.vars
3. Local frontend .env.local
4. Local end-to-end OAuth test
5. Production OAuth App
6. Cloudflare Worker production secrets/vars
7. Deploy Worker
8. Configure GitHub Pages build env vars
9. Production end-to-end OAuth test
```

Avoid configuring local and production at the same time until the local flow works. This keeps OAuth debugging manageable.
