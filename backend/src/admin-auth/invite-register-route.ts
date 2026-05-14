import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import { timingSafeEqual } from 'node:crypto';

function timingSafeEqualStr(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'utf8');
    const bb = Buffer.from(b, 'utf8');
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

async function resolveDefaultRole(strapi: Core.Strapi) {
  const advanced = (await strapi
    .store({ type: 'plugin', name: 'users-permissions', key: 'advanced' })
    .get()) as { default_role?: string } | null | undefined;

  const roleType =
    typeof advanced?.default_role === 'string' && advanced.default_role.trim()
      ? advanced.default_role.trim()
      : 'authenticated';

  let role = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: roleType },
  });
  if (!role) {
    role = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' },
    });
  }
  return role;
}

/**
 * Invite-only application user creation. Keep **Users & Permissions → Settings →
 * "Allow register" OFF** so `/api/auth/local/register` stays closed; only this
 * route (with `ADMIN_WEB_INVITE_SECRET` on Strapi + matching header from admin-web)
 * can create users.
 */
export function registerAdminInviteRoute(strapi: Core.Strapi) {
  strapi.server.routes([
    {
      method: 'POST',
      path: '/api/admin-auth/register',
      handler: async (ctx: Context) => {
        const expected = process.env.ADMIN_WEB_INVITE_SECRET?.trim();
        const raw = ctx.request.headers['x-admin-invite-secret'];
        const got = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
        if (!expected || !timingSafeEqualStr(expected, got)) {
          ctx.status = 401;
          ctx.body = { error: { message: 'Unauthorized' } };
          return;
        }

        const body = (ctx.request as { body?: Record<string, unknown> }).body ?? {};
        const username = typeof body.username === 'string' ? body.username.trim() : '';
        const emailRaw = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';

        if (!username || !emailRaw || !password) {
          ctx.status = 400;
          ctx.body = { error: { message: 'Missing username, email, or password' } };
          return;
        }
        if (username.length < 3) {
          ctx.status = 400;
          ctx.body = {
            error: {
              message: 'Username must be at least 3 characters (Strapi requirement).',
            },
          };
          return;
        }
        if (password.length < 8) {
          ctx.status = 400;
          ctx.body = { error: { message: 'Password must be at least 8 characters' } };
          return;
        }

        try {
          const role = await resolveDefaultRole(strapi);
          if (!role?.id) {
            ctx.status = 500;
            ctx.body = { error: { message: 'Default role not found' } };
            return;
          }

          const provider = 'local';
          const identifierFilter = {
            $or: [
              { email: emailRaw },
              { username: emailRaw },
              { username },
              { email: username },
            ],
          };

          const conflicting = await strapi.db.query('plugin::users-permissions.user').count({
            where: { ...identifierFilter, provider },
          });
          if (conflicting > 0) {
            ctx.status = 400;
            ctx.body = { error: { message: 'Email or username already taken' } };
            return;
          }

          await strapi.plugin('users-permissions').service('user').add({
            username,
            email: emailRaw,
            password,
            provider,
            role: role.id,
            confirmed: true,
          });

          ctx.status = 201;
          ctx.body = { ok: true };
        } catch (e) {
          strapi.log.error(e);
          const msg = e instanceof Error ? e.message : 'Registration failed';
          ctx.status = 400;
          ctx.body = { error: { message: msg } };
        }
      },
      config: { auth: false as const },
    },
  ]);
}
