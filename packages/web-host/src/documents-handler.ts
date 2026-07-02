/**
 * Supernodes documents API — file-backed store for agent-generated documents.
 * Served by web-host at /api/supernodes/documents (not proxied to aioncore).
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

export type SupernodesDocument = {
  id: string;
  title: string;
  content: string;
  conversation_id: string;
  created_by_agent: string;
  created_at: number;
  updated_at: number;
};

type DocumentStore = {
  documents: SupernodesDocument[];
};

function storePath(dataDir: string): string {
  return path.join(dataDir, 'supernodes-documents.json');
}

function readStore(dataDir: string): DocumentStore {
  const file = storePath(dataDir);
  if (!fs.existsSync(file)) {
    return { documents: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as DocumentStore;
  } catch {
    return { documents: [] };
  }
}

function writeStore(dataDir: string, store: DocumentStore): void {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(storePath(dataDir), JSON.stringify(store, null, 2) + '\n', 'utf-8');
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

export function isDocumentsRequest(url: string): boolean {
  return url.startsWith('/api/supernodes/documents');
}

export async function handleDocumentsRequest(
  req: IncomingMessage,
  res: ServerResponse,
  dataDir: string
): Promise<void> {
  const url = req.url ?? '';
  const base = '/api/supernodes/documents';
  const suffix = url.slice(base.length);
  const idMatch = suffix.match(/^\/([^/?]+)/);
  const id = idMatch?.[1];

  if (req.method === 'GET' && (suffix === '' || suffix === '/')) {
    const store = readStore(dataDir);
    sendJson(res, 200, store.documents.sort((a, b) => b.updated_at - a.updated_at));
    return;
  }

  if (req.method === 'GET' && id) {
    const doc = readStore(dataDir).documents.find((d) => d.id === id);
    if (!doc) {
      sendJson(res, 404, { error: 'NOT_FOUND' });
      return;
    }
    sendJson(res, 200, doc);
    return;
  }

  if (req.method === 'POST' && (suffix === '' || suffix === '/')) {
    const raw = await readBody(req);
    const body = JSON.parse(raw) as Partial<SupernodesDocument>;
    const now = Date.now();
    const doc: SupernodesDocument = {
      id: crypto.randomUUID(),
      title: body.title ?? 'Untitled',
      content: body.content ?? '',
      conversation_id: body.conversation_id ?? '',
      created_by_agent: body.created_by_agent ?? '',
      created_at: now,
      updated_at: now,
    };
    const store = readStore(dataDir);
    store.documents.push(doc);
    writeStore(dataDir, store);
    sendJson(res, 200, { id: doc.id });
    return;
  }

  if (req.method === 'PUT' && id) {
    const raw = await readBody(req);
    const body = JSON.parse(raw) as { content?: string; title?: string };
    const store = readStore(dataDir);
    const idx = store.documents.findIndex((d) => d.id === id);
    if (idx === -1) {
      sendJson(res, 404, { error: 'NOT_FOUND' });
      return;
    }
    if (body.content !== undefined) store.documents[idx].content = body.content;
    if (body.title !== undefined) store.documents[idx].title = body.title;
    store.documents[idx].updated_at = Date.now();
    writeStore(dataDir, store);
    sendJson(res, 200, { success: true });
    return;
  }

  if (req.method === 'DELETE' && id) {
    const store = readStore(dataDir);
    store.documents = store.documents.filter((d) => d.id !== id);
    writeStore(dataDir, store);
    sendJson(res, 200, { success: true });
    return;
  }

  sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });
}
