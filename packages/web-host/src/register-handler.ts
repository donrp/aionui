/**
 * Supernodes self-service registration — inserts into aioncore's SQLite users table.
 * Served at /api/supernodes/register (handled locally by web-host, not proxied).
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const MAX_USERNAME_LENGTH = 128;

type RegisterBody = {
  username?: string;
  password?: string;
  email?: string;
};

function dbPath(dataDir: string): string {
  return path.join(dataDir, 'aionui-backend.db');
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

function isRegistrationEnabled(): boolean {
  return process.env.SUPERNODES_REGISTRATION_ENABLED !== '0';
}

function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

function isValidUsername(username: string): boolean {
  if (username.length < 3 || username.length > MAX_USERNAME_LENGTH) return false;
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(username) || /^[a-z0-9._-]+$/i.test(username);
}

function resolveEmail(username: string, email?: string): string | null {
  const trimmedEmail = email?.trim().toLowerCase();
  if (trimmedEmail) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return null;
    return trimmedEmail;
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
    return username;
  }
  return null;
}

export function isRegisterRequest(url: string): boolean {
  const pathOnly = url.split('?')[0] ?? url;
  return pathOnly === '/api/supernodes/register';
}

export async function handleRegisterRequest(
  req: IncomingMessage,
  res: ServerResponse,
  dataDir: string
): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { success: false, error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!isRegistrationEnabled()) {
    sendJson(res, 403, { success: false, error: 'Registration is disabled', code: 'REGISTRATION_DISABLED' });
    return;
  }

  const databaseFile = dbPath(dataDir);
  if (!fs.existsSync(databaseFile)) {
    sendJson(res, 503, { success: false, error: 'Service unavailable', code: 'DB_NOT_READY' });
    return;
  }

  let body: RegisterBody;
  try {
    body = JSON.parse(await readBody(req)) as RegisterBody;
  } catch {
    sendJson(res, 400, { success: false, error: 'Invalid JSON body', code: 'BAD_REQUEST' });
    return;
  }

  const username = normalizeUsername(body.username ?? '');
  const password = body.password ?? '';

  if (!username || !password) {
    sendJson(res, 400, { success: false, error: 'Username and password are required', code: 'MISSING_FIELDS' });
    return;
  }

  if (!isValidUsername(username)) {
    sendJson(res, 400, {
      success: false,
      error: 'Use a valid email address or username (letters, numbers, . _ -)',
      code: 'INVALID_USERNAME',
    });
    return;
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    sendJson(res, 400, {
      success: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      code: 'WEAK_PASSWORD',
    });
    return;
  }

  const email = resolveEmail(username, body.email);
  if (body.email?.trim() && !email) {
    sendJson(res, 400, { success: false, error: 'Invalid email address', code: 'INVALID_EMAIL' });
    return;
  }

  const now = Date.now();
  const userId = crypto.randomUUID();
  const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  const jwtSecret = crypto.randomBytes(64).toString('base64');

  let db: Database.Database | undefined;
  try {
    db = new Database(databaseFile);
    const insert = db.prepare(`
      INSERT INTO users (id, username, email, password_hash, avatar_path, jwt_secret, created_at, updated_at, last_login)
      VALUES (@id, @username, @email, @password_hash, NULL, @jwt_secret, @created_at, @updated_at, NULL)
    `);

    insert.run({
      id: userId,
      username,
      email,
      password_hash: passwordHash,
      jwt_secret: jwtSecret,
      created_at: now,
      updated_at: now,
    });

    sendJson(res, 201, {
      success: true,
      user: { id: userId, username, email },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('UNIQUE constraint failed')) {
      sendJson(res, 409, {
        success: false,
        error: 'An account with this username or email already exists',
        code: 'USERNAME_TAKEN',
      });
      return;
    }
    console.error('[supernodes/register]', error);
    sendJson(res, 500, { success: false, error: 'Registration failed', code: 'SERVER_ERROR' });
  } finally {
    db?.close();
  }
}
