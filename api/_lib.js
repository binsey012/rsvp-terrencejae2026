/*
 * Shared helpers for the Vercel serverless functions.
 *
 * Required environment variables (Vercel > Project > Settings > Environment Variables):
 *   ADMIN_USER, ADMIN_PASSWORD   -> host login credentials
 *   ADMIN_SECRET                 -> long random string used to sign login tokens
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 *     (or KV_REST_API_URL / KV_REST_API_TOKEN) -> added automatically by the
 *     Upstash Redis integration in the Vercel Marketplace (free tier is plenty).
 */
const crypto = require('crypto');

const REDIS_URL = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

function storageConfigured() {
  return Boolean(REDIS_URL() && REDIS_TOKEN());
}

async function redis(command) {
  const res = await fetch(REDIS_URL(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command)
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || 'Storage error');
  return data.result;
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch (e) { return {}; }
}

const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function secret() {
  return process.env.ADMIN_SECRET || `${process.env.ADMIN_USER}:${process.env.ADMIN_PASSWORD}`;
}

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex');
}

function issueToken(ttlMs = 1000 * 60 * 60 * 8) {
  const exp = String(Date.now() + ttlMs);
  return `${exp}.${sign(exp)}`;
}

function verifyToken(req) {
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) return false;
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(exp));
}

async function listHash(key) {
  const flat = (await redis(['HGETALL', key])) || [];
  const items = [];
  for (let i = 1; i < flat.length; i += 2) {
    try { items.push(JSON.parse(flat[i])); } catch (e) { /* skip corrupt entry */ }
  }
  return items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

const newId = () => crypto.randomBytes(8).toString('hex');

module.exports = {
  redis, send, readBody, clean, safeEqual, issueToken, verifyToken,
  listHash, newId, storageConfigured
};
