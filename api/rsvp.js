const { redis, send, readBody, clean, listHash, newId, storageConfigured } = require('./_lib');

/* Public endpoint: GET returns names + status only. POST stores a full RSVP. */
module.exports = async (req, res) => {
  if (!storageConfigured()) return send(res, 503, { error: 'storage_not_configured' });

  try {
    if (req.method === 'GET') {
      const all = await listHash('rsvps');
      let adults = 0;
      let kids = 0;
      let declined = 0;
      all.forEach((r) => {
        if (r.status === 'yes') {
          adults += Number(r.adults) || 0;
          kids += Number(r.kids) || 0;
        } else {
          declined += 1;
        }
      });
      return send(res, 200, {
        guests: all.map((r) => ({ name: r.name, status: r.status })),
        totals: { adults, kids, explorers: adults + kids, declined }
      });
    }

    if (req.method === 'POST') {
      const b = await readBody(req);
      if (b.website) return send(res, 200, { ok: true }); // honeypot for bots

      const status = b.status === 'no' ? 'no' : 'yes';
      const name = clean(b.name, 80);
      const contact = clean(b.contact, 80);
      if (!name || !contact) return send(res, 400, { error: 'Name and contact are required.' });

      const num = (v, max) => Math.min(Math.max(parseInt(v, 10) || 0, 0), max);
      const entry = {
        id: newId(),
        name,
        contact,
        status,
        adults: status === 'yes' ? Math.max(num(b.adults, 10), 1) : 0,
        kids: status === 'yes' ? num(b.kids, 10) : 0,
        diet: clean(b.diet, 120) || 'None',
        note: clean(b.note, 400),
        createdAt: Date.now()
      };
      await redis(['HSET', 'rsvps', entry.id, JSON.stringify(entry)]);
      return send(res, 201, { ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    return send(res, 500, { error: 'Server error' });
  }
};
