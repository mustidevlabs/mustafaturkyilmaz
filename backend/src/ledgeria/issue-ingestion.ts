import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';

const ISSUE_UID = 'api::ledgeria-issue.ledgeria-issue' as const;

const MAX_SCREENSHOT_B64 = 600_000;
const MAX_LOGS = 120_000;

/** Must match `docs/ledgeria-issues-api-v1-contract.md` / `@ledgeria/shared`. */
const ISSUE_SCREENSHOT_PIN_LIMIT = 12;
const ISSUE_SCREENSHOT_PIN_MESSAGE_MAX_CHARS = 400;

export type IssueScreenshotPin = { x: number; y: number; message: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CATEGORIES = new Set(['bug', 'feature', 'improvement']);
const PRIORITIES = new Set(['low', 'normal', 'high']);

export type IssuePayloadInput = Record<string, unknown>;

function jsonError(status: number, message: string) {
  const err: Error & { status?: number; body?: { message: string } } = new Error(message);
  err.status = status;
  err.body = { message };
  return err;
}

function trimStr(v: unknown, field: string): string {
  if (typeof v !== 'string') throw jsonError(400, `Invalid or missing field: ${field}`);
  const t = v.trim();
  if (!t) throw jsonError(400, `Invalid or missing field: ${field}`);
  return t;
}

function optionalString(v: unknown, maxLen: number): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') throw jsonError(400, 'Optional string fields must be strings');
  const t = v.trim();
  if (!t) return undefined;
  if (t.length > maxLen) throw jsonError(413, `Field exceeds maximum length`);
  return t;
}

function parsePayload(body: unknown): IssuePayloadInput {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw jsonError(400, 'Request body must be a JSON object');
  }
  return body as IssuePayloadInput;
}

function isUniqueConstraint(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  if (e?.code === 'SQLITE_CONSTRAINT_UNIQUE') return true;
  const m = typeof e?.message === 'string' ? e.message.toLowerCase() : '';
  return m.includes('unique') && m.includes('constraint');
}

function validateAndNormalize(body: unknown) {
  const p = parsePayload(body);

  const id = trimStr(p.id, 'id');
  if (!UUID_RE.test(id)) {
    throw jsonError(400, 'Field id must be a non-empty UUID v4');
  }

  const title = trimStr(p.title, 'title');

  if (typeof p.description !== 'string') {
    throw jsonError(400, 'Invalid or missing field: description');
  }
  const description = p.description;

  const category = trimStr(p.category, 'category');
  if (!CATEGORIES.has(category)) {
    throw jsonError(400, 'category must be one of: bug, feature, improvement');
  }

  const appVersion = trimStr(p.appVersion, 'appVersion');
  const os = trimStr(p.os, 'os');
  const createdAt = trimStr(p.createdAt, 'createdAt');
  if (Number.isNaN(Date.parse(createdAt))) {
    throw jsonError(400, 'createdAt must be a valid ISO 8601 timestamp');
  }

  let priority: 'low' | 'normal' | 'high' = 'normal';
  if (p.priority !== undefined && p.priority !== null) {
    if (typeof p.priority !== 'string' || !PRIORITIES.has(p.priority)) {
      throw jsonError(400, 'priority must be one of: low, normal, high');
    }
    priority = p.priority as 'low' | 'normal' | 'high';
  }

  const logsRaw = p.logs;
  let logs: string | undefined;
  if (logsRaw !== undefined && logsRaw !== null) {
    if (typeof logsRaw !== 'string') throw jsonError(400, 'logs must be a string');
    if (logsRaw.length > MAX_LOGS) {
      throw jsonError(413, `logs exceeds maximum length (${MAX_LOGS})`);
    }
    logs = logsRaw;
  }

  const screenshotRaw = p.screenshotPngBase64;
  let screenshotPngBase64: string | undefined;
  if (screenshotRaw !== undefined && screenshotRaw !== null) {
    if (typeof screenshotRaw !== 'string') {
      throw jsonError(400, 'screenshotPngBase64 must be a string');
    }
    if (screenshotRaw.length > MAX_SCREENSHOT_B64) {
      throw jsonError(
        413,
        `screenshotPngBase64 exceeds maximum length (${MAX_SCREENSHOT_B64})`
      );
    }
    screenshotPngBase64 = screenshotRaw;
  }

  const screenshotPins = parseScreenshotPins(p, screenshotPngBase64);

  return {
    id,
    title,
    description,
    category: category as 'bug' | 'feature' | 'improvement',
    appVersion,
    os,
    createdAt,
    priority,
    locale: optionalString(p.locale, 64),
    lastScreen: optionalString(p.lastScreen, 2048),
    logs,
    screenshotPath: optionalString(p.screenshotPath, 2048),
    screenshotPngBase64,
    screenshotPins,
  };
}

function parseScreenshotPins(
  p: IssuePayloadInput,
  screenshotPngBase64: string | undefined
): IssueScreenshotPin[] | undefined {
  const raw = p.screenshotPins;
  if (raw === undefined || raw === null) return undefined;
  if (Array.isArray(raw) && raw.length === 0) return undefined;
  if (!Array.isArray(raw)) {
    throw jsonError(400, 'screenshotPins must be an array');
  }
  if (raw.length > ISSUE_SCREENSHOT_PIN_LIMIT) {
    throw jsonError(
      400,
      `screenshotPins must contain at most ${ISSUE_SCREENSHOT_PIN_LIMIT} items`
    );
  }

  const ss = screenshotPngBase64?.trim();
  const ssMeaningful = Boolean(ss && ss.length >= 32);
  if (raw.length > 0 && !ssMeaningful) {
    throw jsonError(
      400,
      'screenshotPngBase64 is required when screenshotPins is non-empty'
    );
  }

  const out: IssueScreenshotPin[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const el = raw[i];
    if (el === null || typeof el !== 'object' || Array.isArray(el)) {
      throw jsonError(400, `screenshotPins[${i}] must be an object`);
    }
    const o = el as Record<string, unknown>;
    if (typeof o.x !== 'number' || typeof o.y !== 'number') {
      throw jsonError(400, `screenshotPins[${i}].x and .y must be numbers`);
    }
    if (!Number.isFinite(o.x) || !Number.isFinite(o.y)) {
      throw jsonError(400, `screenshotPins[${i}] has non-finite coordinates`);
    }
    if (o.x < 0 || o.x > 1 || o.y < 0 || o.y > 1) {
      throw jsonError(
        400,
        `screenshotPins[${i}] coordinates must be between 0 and 1 inclusive`
      );
    }
    if (typeof o.message !== 'string') {
      throw jsonError(400, `screenshotPins[${i}].message must be a string`);
    }
    const msg = o.message.trim();
    if (!msg) {
      throw jsonError(400, `screenshotPins[${i}].message must not be empty`);
    }
    if (msg.length > ISSUE_SCREENSHOT_PIN_MESSAGE_MAX_CHARS) {
      throw jsonError(
        400,
        `screenshotPins[${i}].message exceeds maximum length (${ISSUE_SCREENSHOT_PIN_MESSAGE_MAX_CHARS})`
      );
    }
    out.push({ x: o.x, y: o.y, message: msg });
  }
  return out.length > 0 ? out : undefined;
}

function checkApiKey(ctx: Context) {
  const required = process.env.LEDGERIA_ISSUES_API_KEY?.trim();
  if (!required) return;

  const bearer = ctx.get('authorization');
  const xKey = ctx.get('x-api-key');
  let token: string | undefined;
  if (bearer?.toLowerCase().startsWith('bearer ')) {
    token = bearer.slice(7).trim();
  } else if (xKey) {
    token = xKey.trim();
  }
  if (!token || token !== required) {
    throw jsonError(401, 'Invalid or missing API key');
  }
}

function createLedgeriaIssuesHandler(strapi: Core.Strapi) {
  return async (ctx: Context) => {
    ctx.set('Content-Type', 'application/json');
    try {
      checkApiKey(ctx);

      const idempotencyKey = ctx.get('idempotency-key');
      const rawBody = (ctx.request as { body?: unknown }).body;
      const normalized = validateAndNormalize(rawBody);

      if (idempotencyKey && idempotencyKey.trim() !== normalized.id) {
        throw jsonError(400, 'Idempotency-Key must match body.id');
      }

      const docs = strapi.documents(ISSUE_UID);
      const existing = await docs.findFirst({
        filters: { clientId: normalized.id },
      });

      if (existing && 'documentId' in existing && existing.documentId) {
        ctx.status = 200;
        ctx.body = { id: String(existing.documentId) };
        return;
      }

      let remoteId: string;

      try {
        const created = await docs.create({
          data: {
            clientId: normalized.id,
            title: normalized.title,
            description: normalized.description,
            category: normalized.category,
            appVersion: normalized.appVersion,
            os: normalized.os,
            clientCreatedAt: normalized.createdAt,
            locale: normalized.locale,
            lastScreen: normalized.lastScreen,
            logs: normalized.logs,
            screenshotPath: normalized.screenshotPath,
            screenshotPngBase64: normalized.screenshotPngBase64,
            screenshotPins: normalized.screenshotPins ?? null,
            priority: normalized.priority,
            status: 'open',
          },
        });
        remoteId =
          created && typeof created === 'object' && 'documentId' in created && created.documentId
            ? String(created.documentId)
            : normalized.id;
      } catch (createErr) {
        if (!isUniqueConstraint(createErr)) {
          throw createErr;
        }
        const again = await docs.findFirst({
          filters: { clientId: normalized.id },
        });
        if (!again || !('documentId' in again) || !again.documentId) {
          throw createErr;
        }
        remoteId = String(again.documentId);
        ctx.status = 200;
        ctx.body = { id: remoteId };
        return;
      }

      ctx.status = 201;
      ctx.body = { id: remoteId };
    } catch (e: unknown) {
      const err = e as Error & { status?: number; body?: { message: string } };
      const status = typeof err.status === 'number' ? err.status : 500;
      const message =
        status === 500
          ? 'Internal server error'
          : err.message || 'Request failed';
      ctx.status = status;
      ctx.body = { message };
      if (status === 500) {
        strapi.log.error(err);
      }
    }
  };
}

const routeConfig = { auth: false as const };

/**
 * Canonical: POST /ledgeria/v1/issues. Alias: POST /api/ledgeria/v1/issues (for clients that wrongly prefix /api).
 */
export function registerLedgeriaIssueIngestion(strapi: Core.Strapi) {
  const handler = createLedgeriaIssuesHandler(strapi);
  strapi.server.routes([
    {
      method: 'POST',
      path: '/ledgeria/v1/issues',
      handler,
      config: routeConfig,
    },
    {
      method: 'POST',
      path: '/api/ledgeria/v1/issues',
      handler,
      config: routeConfig,
    },
  ]);
}
