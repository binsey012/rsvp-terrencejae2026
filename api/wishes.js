const { redis, send, readBody, clean, listHash, newId, storageConfigured } = require('./_lib');

const AVATARS = ['🦁', '🦒', '🐘', '🐒', '🦓', '🦛'];

module.exports = async (req, res) => {
  if (!storageConfigured()) return send(res, 503, { error: 'storage_not_configured' });

  try {
    if (req.method === 'GET') {
      const all = await listHash('wishes');
      return send(res, 200, { wishes: all.slice(0, 100) });
    }

    if (req.method === 'POST') {
      const b = await readBody(req);
      const author = clean(b.author, 60);
      const text = clean(b.text, 400);
      if (!author || !text) return send(res, 400, { error: 'Name and message are required.' });

      const entry = {
        id: newId(),
        author,
        text,
        avatar: AVATARS.includes(b.avatar) ? b.avatar : AVATARS[0],
        createdAt: Date.now()
      };
      await redis(['HSET', 'wishes', entry.id, JSON.stringify(entry)]);
      return send(res, 201, { ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    return send(res, 500, { error: 'Server error' });
  }
};
