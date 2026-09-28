import { createHash } from 'node:crypto';
import { z } from 'zod';

const REQUIRED = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'IP_SALT'];
for (const k of [...REQUIRED, 'RESEND_API_KEY', 'NOTIFY_EMAIL', 'NOTIFY_FROM']) {
  if (process.env[k]) process.env[k] = process.env[k].replace(/^﻿/, '').trim();
}
const LIMIT = 5;
const WINDOW_MIN = 15;

const text = (min, max) => z.string().trim().min(min).max(max);
const optional = (max) => z.string().trim().max(max).optional().transform(v => v || null);

const Schema = z.object({
  empresa: text(2, 150),
  rif: text(5, 20).regex(/^[JGVEPC]-?\d{6,9}-?\d?$/i, 'RIF inválido'),
  sector: optional(80),
  ciudad: optional(80),
  contacto_nombre: text(3, 120),
  cargo: optional(80),
  email: z.string().trim().toLowerCase().email().max(160),
  telefono: text(7, 25).regex(/^[+\d\s()-]+$/, 'Teléfono inválido'),
  noches_mes: z.enum(['1-5', '6-15', '16-30', '31-60', '60+']).optional().nullable(),
  torre: z.enum(['vip', 'express', 'ambas']).optional().nullable(),
  necesita_salones: z.boolean().optional().default(false),
  comentarios: optional(2000),
  website: z.string().max(0).optional(),
}).strict();

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function sb(path, init = {}) {
  return fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

async function notify(d) {
  const { RESEND_API_KEY, NOTIFY_EMAIL, NOTIFY_FROM } = process.env;
  if (!RESEND_API_KEY || !NOTIFY_EMAIL) {
    console.warn('[postulacion] correo no configurado; postulación guardada sin aviso');
    return;
  }
  const rows = [
    ['Empresa', d.empresa], ['RIF', d.rif], ['Sector', d.sector], ['Ciudad', d.ciudad],
    ['Contacto', d.contacto_nombre], ['Cargo', d.cargo], ['Email', d.email], ['Teléfono', d.telefono],
    ['Noches al mes', d.noches_mes], ['Torre', d.torre], ['Necesita salones', d.necesita_salones ? 'Sí' : 'No'],
    ['Comentarios', d.comentarios],
  ].filter(([, v]) => v !== null && v !== undefined && v !== '');
  const html = `<h2 style="font-family:Arial">Nueva postulación a tarifa corporativa</h2>
<table style="font-family:Arial;font-size:14px;border-collapse:collapse">${rows.map(([k, v]) =>
    `<tr><td style="padding:6px 12px;color:#666">${esc(k)}</td><td style="padding:6px 12px"><b>${esc(v)}</b></td></tr>`).join('')}</table>
<p style="font-family:Arial;font-size:13px;color:#666">Gestiónala en el panel: /admin/</p>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: NOTIFY_FROM || 'San Miguel Web <onboarding@resend.dev>',
      to: NOTIFY_EMAIL.split(',').map(s => s.trim()).filter(Boolean),
      reply_to: d.email,
      subject: `Tarifa corporativa: ${d.empresa}`,
      html,
    }),
  });
  if (!r.ok) console.error('[postulacion] fallo envío de correo', r.status);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const missing = REQUIRED.filter(k => !process.env[k]);
  if (missing.length) {
    console.error('[postulacion] faltan variables de entorno:', missing.join(', '));
    return res.status(500).json({ error: 'Servicio no disponible. Intenta más tarde.' });
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  const ipHash = createHash('sha256').update(process.env.IP_SALT + ip).digest('hex');

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    console.warn('[postulacion] input rechazado:', parsed.error.issues.map(i => i.path.join('.')).join(','));
    return res.status(400).json({ error: 'Revisa los datos del formulario.', campos: parsed.error.issues.map(i => i.path[0]) });
  }
  const { website, ...data } = parsed.data;

  const since = new Date(Date.now() - WINDOW_MIN * 60 * 1000).toISOString();
  const count = await sb(`postulaciones_corporativas?select=id&ip_hash=eq.${ipHash}&created_at=gte.${encodeURIComponent(since)}`, {
    method: 'HEAD', headers: { Prefer: 'count=exact' },
  });
  const used = Number((count.headers.get('content-range') || '*/0').split('/')[1] || 0);
  if (used >= LIMIT) {
    console.warn('[postulacion] rate limit alcanzado');
    return res.status(429).json({ error: 'Demasiados envíos. Intenta de nuevo en unos minutos.' });
  }

  const ins = await sb('postulaciones_corporativas', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ ...data, ip_hash: ipHash }),
  });
  if (!ins.ok) {
    console.error('[postulacion] error al guardar', ins.status);
    return res.status(500).json({ error: 'No pudimos registrar tu solicitud. Intenta más tarde.' });
  }

  try { await notify(data); } catch { console.error('[postulacion] excepción enviando correo'); }
  return res.status(201).json({ ok: true });
}
