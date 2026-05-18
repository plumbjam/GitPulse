var __defProp = Object.defineProperty
var __name = (target, value) => __defProp(target, 'name', { value, configurable: true })

// src/index.ts
var EXCHANGE_PATH = '/oauth/github/exchange'
var GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
var src_default = {
  async fetch(request, env) {
    const origin = request.headers.get('Origin')
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(env, origin),
      })
    }
    const url = new URL(request.url)
    if (url.pathname !== EXCHANGE_PATH) {
      return jsonResponse({ error: 'Not found.' }, 404, env, origin)
    }
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Use POST for GitHub OAuth token exchange.' }, 405, env, origin)
    }
    if (!isOriginAllowed(env, origin)) {
      return jsonResponse({ error: 'This origin is not allowed.' }, 403, env, origin)
    }
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      return jsonResponse({ error: 'GitHub OAuth broker is not configured.' }, 500, env, origin)
    }
    const body = await readExchangeRequestBody(request)
    if (!body.code || !body.redirectUri) {
      return jsonResponse({ error: 'Missing OAuth code or redirect URI.' }, 400, env, origin)
    }
    if (!isRedirectUriAllowed(env, body.redirectUri)) {
      return jsonResponse({ error: 'This redirect URI is not allowed.' }, 400, env, origin)
    }
    const tokenResponse = await exchangeCodeWithGitHub(env, body.code, body.redirectUri)
    if (tokenResponse.error || !tokenResponse.access_token) {
      return jsonResponse(
        {
          error:
            tokenResponse.error_description ||
            'GitHub did not return a usable access token. Please try again.',
        },
        400,
        env,
        origin,
      )
    }
    return jsonResponse(
      {
        accessToken: tokenResponse.access_token,
        tokenType: tokenResponse.token_type || 'bearer',
        scope: tokenResponse.scope || '',
      },
      200,
      env,
      origin,
    )
  },
}
async function readExchangeRequestBody(request) {
  try {
    const body = await request.json()
    return {
      code: body.code?.trim() ?? '',
      redirectUri: body.redirectUri?.trim() ?? '',
    }
  } catch {
    return {
      code: '',
      redirectUri: '',
    }
  }
}
__name(readExchangeRequestBody, 'readExchangeRequestBody')
async function exchangeCodeWithGitHub(env, code, redirectUri) {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  })
  try {
    return await response.json()
  } catch {
    return {
      error: 'invalid_response',
      error_description: 'GitHub returned an unreadable OAuth response.',
    }
  }
}
__name(exchangeCodeWithGitHub, 'exchangeCodeWithGitHub')
function isOriginAllowed(env, origin) {
  if (!env.ALLOWED_ORIGIN || !origin) {
    return true
  }
  return origin === env.ALLOWED_ORIGIN
}
__name(isOriginAllowed, 'isOriginAllowed')
function isRedirectUriAllowed(env, redirectUri) {
  const allowedRedirectUris = parseCommaSeparatedList(env.ALLOWED_REDIRECT_URIS)
  if (allowedRedirectUris.length) {
    return allowedRedirectUris.includes(redirectUri)
  }
  if (!env.ALLOWED_ORIGIN) {
    return true
  }
  try {
    return new URL(redirectUri).origin === env.ALLOWED_ORIGIN
  } catch {
    return false
  }
}
__name(isRedirectUriAllowed, 'isRedirectUriAllowed')
function buildCorsHeaders(env, origin) {
  const allowOrigin = isOriginAllowed(env, origin)
    ? origin || env.ALLOWED_ORIGIN || '*'
    : env.ALLOWED_ORIGIN || 'null'
  return {
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Origin': allowOrigin,
    Vary: 'Origin',
  }
}
__name(buildCorsHeaders, 'buildCorsHeaders')
function jsonResponse(body, status, env, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...buildCorsHeaders(env, origin),
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}
__name(jsonResponse, 'jsonResponse')
function parseCommaSeparatedList(value) {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}
__name(parseCommaSeparatedList, 'parseCommaSeparatedList')

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env)
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader()
        while (!(await reader.read()).done) {}
      }
    } catch (e) {
      console.error('Failed to drain the unused request body.', e)
    }
  }
}, 'drainBody')
var middleware_ensure_req_body_drained_default = drainBody

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause),
  }
}
__name(reduceError, 'reduceError')
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env)
  } catch (e) {
    const error = reduceError(e)
    return Response.json(error, {
      status: 500,
      headers: { 'MF-Experimental-Error-Stack': 'true' },
    })
  }
}, 'jsonError')
var middleware_miniflare3_json_error_default = jsonError

// .wrangler/tmp/bundle-ZIqEmT/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default,
]
var middleware_insertion_facade_default = src_default

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = []
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat())
}
__name(__facade_register__, '__facade_register__')
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail)
    },
  }
  return head(request, env, ctx, middlewareCtx)
}
__name(__facade_invokeChain__, '__facade_invokeChain__')
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware,
  ])
}
__name(__facade_invoke__, '__facade_invoke__')

// .wrangler/tmp/bundle-ZIqEmT/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime
    this.cron = cron
    this.#noRetry = noRetry
  }
  static {
    __name(this, '__Facade_ScheduledController__')
  }
  #noRetry
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError('Illegal invocation')
    }
    this.#noRetry()
  }
}
function wrapExportedHandler(worker) {
  if (
    __INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 ||
    __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0
  ) {
    return worker
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware)
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function (request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error('Handler does not export a fetch() function.')
    }
    return worker.fetch(request, env, ctx)
  }, 'fetchDispatcher')
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function (type, init) {
        if (type === 'scheduled' && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? '',
            () => {},
          )
          return worker.scheduled(controller, env, ctx)
        }
      }, 'dispatcher')
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher)
    },
  }
}
__name(wrapExportedHandler, 'wrapExportedHandler')
function wrapWorkerEntrypoint(klass) {
  if (
    __INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 ||
    __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0
  ) {
    return klass
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware)
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env
      this.ctx = ctx
      if (super.fetch === void 0) {
        throw new Error('Entrypoint class does not define a fetch() function.')
      }
      return super.fetch(request)
    }, '#fetchDispatcher')
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === 'scheduled' && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(Date.now(), init.cron ?? '', () => {})
        return super.scheduled(controller)
      }
    }, '#dispatcher')
    fetch(request) {
      return __facade_invoke__(request, this.env, this.ctx, this.#dispatcher, this.#fetchDispatcher)
    }
  }
}
__name(wrapWorkerEntrypoint, 'wrapWorkerEntrypoint')
var WRAPPED_ENTRY
if (typeof middleware_insertion_facade_default === 'object') {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default)
} else if (typeof middleware_insertion_facade_default === 'function') {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default)
}
var middleware_loader_entry_default = WRAPPED_ENTRY
export { __INTERNAL_WRANGLER_MIDDLEWARE__, middleware_loader_entry_default as default }
//# sourceMappingURL=index.js.map
