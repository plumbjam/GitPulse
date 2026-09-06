# GitPulse OAuth Worker

This Cloudflare Worker exchanges a GitHub OAuth `code` for an access token. It keeps the GitHub OAuth client secret outside the GitHub Pages frontend.

## Endpoint

```text
POST /oauth/github/exchange
```

Request:

```json
{
  "code": "github_returned_code",
  "redirectUri": "https://plumbjam.github.io/GitPulse/"
}
```

Success:

```json
{
  "accessToken": "...",
  "tokenType": "bearer",
  "scope": "read:user"
}
```

Failure:

```json
{
  "error": "Friendly error message"
}
```

## Local Setup

```bash
cd worker
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

Set these values in `.dev.vars`:

```text
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
ALLOWED_ORIGIN=http://localhost:5173
ALLOWED_REDIRECT_URIS=http://localhost:5173/GitPulse/,https://plumbjam.github.io/GitPulse/
```

## Validation

From the repository root, with existing root and Worker dependencies installed:

```bash
npm --prefix worker run typecheck
npm run test -- worker/test/index.test.ts
```

The broker tests mock all upstream requests and use synthetic credentials. They run in the root
test suite and CI. Upstream network/HTTP failures return a CORS-enabled JSON error with status 502.

## Deploy

```bash
cd worker
cp wrangler.toml.example wrangler.toml
npx wrangler secret put GITHUB_CLIENT_SECRET
npm run deploy
```

`GITHUB_CLIENT_ID`, `ALLOWED_ORIGIN`, and `ALLOWED_REDIRECT_URIS` can be plain Worker vars. `GITHUB_CLIENT_SECRET` must be a secret.

Do not log or commit access tokens, client secrets, or `.dev.vars`.
