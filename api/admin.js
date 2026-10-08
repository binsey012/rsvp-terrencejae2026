const { redis, send, readBody, clean, safeEqual, issueToken, verifyToken, listHash, storageConfigured } = require('./_lib');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/*
 * POST   -> login with { user, password }, returns a signed token (8h)
 * GET    -> full RSVP details (requires Bearer token)
 * DELETE -> ?id=<rsvpId> removes an RSVP (requires Bearer token)
 */
module.exports = async (req, res) => {
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) {
    return send(res, 503, { error: 'admin_not_configured' });
  }

  try {
    if (req.method === 'POST') {
      const b = await readBody(req);
      const okUser = safeEqual(clean(b.user, 100), process.env.ADMIN_USER);
      const okPass = safeEqual(String(b.password || '').slice(0, 200), process.env.ADMIN_PASSWORD);
      if (!(okUser && okPass)) {
        await wait(800); // slow down brute-force attempts
        return send(res, 401, { error: 'Invalid username or password.' });
      }
      return send(res, 200, { token: issueToken() });
    }

    if (!verifyToken(req)) return send(res, 401, { error: 'Unauthorized' });
    if (!storageConfigured()) return send(res, 503, { error: 'storage_not_configured' });

    if (req.method === 'GET') {
      return send(res, 200, { rsvps: await listHash('rsvps') });
    }

    if (req.method === 'DELETE') {
      const id = clean(new URL(req.url, 'http://x').searchParams.get('id'), 40);
      if (!id) return send(res, 400, { error: 'Missing id' });
      await redis(['HDEL', 'rsvps', id]);
      return send(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    return send(res, 500, { error: 'Server error' });
  }
};
