(function () {
  const { supabaseUrl, supabaseKey } = window.SM_CONFIG;
  const sb = window.supabase.createClient(supabaseUrl, supabaseKey, {
    auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true },
  });
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CAT = { concierto: 'Concierto', fiesta: 'Fiesta', deportivo: 'Deportivo', gastronomico: 'Gastronómico', cultural: 'Cultural', familiar: 'Familiar', corporativo: 'Corporativo', otro: 'Otro' };
  const ESTADOS = { nueva: 'Nueva', contactada: 'Contactada', aprobada: 'Aprobada', rechazada: 'Rechazada' };
  const NOCHES = { '1-5': '1 a 5', '6-15': '6 a 15', '16-30': '16 a 30', '31-60': '31 a 60', '60+': 'Más de 60' };
  const TORRES = { vip: 'Torre VIP', express: 'Torre Express', ambas: 'Ambas' };
  const fmtDate = (d) => { const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; };
  const fmtTs = (t) => new Date(t).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
  const status = (el, msg, ok) => { el.textContent = msg; el.className = 'form-status ' + (ok ? 'ok' : 'err'); };

  /* ── sesión ── */
  async function boot() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return showLogin();
    const { data, error } = await sb.from('admin_emails').select('email').limit(1);
    if (error || !data.length) {
      await sb.auth.signOut();
      showLogin('Tu usuario no tiene permisos de administración.');
      return;
    }
    $('#userEmail').textContent = session.user.email;
    $('#login').hidden = true;
    $('#app').hidden = false;
    loadEvents();
    loadPosts();
  }
  function showLogin(msg) {
    $('#app').hidden = true;
    $('#login').hidden = false;
    if (msg) status($('#loginStatus'), msg, false);
  }
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    if (!f.checkValidity()) return status($('#loginStatus'), 'Ingresa tu correo y contraseña.', false);
    const btn = f.querySelector('button'); btn.disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value });
    btn.disabled = false;
    f.password.value = '';
    if (error) return status($('#loginStatus'), error.status === 429 ? 'Demasiados intentos. Espera unos minutos.' : 'Correo o contraseña incorrectos.', false);
    status($('#loginStatus'), '', true);
    boot();
  });
  $('#logout').addEventListener('click', async () => { await sb.auth.signOut(); location.reload(); });
  sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') showLogin(); });

  /* ── vistas ── */
  $$('[data-view]').forEach(b => b.addEventListener('click', () => {
    $$('[data-view]').forEach(x => x.setAttribute('aria-selected', x === b));
    $$('.adm-view').forEach(v => { v.hidden = v.id !== 'v-' + b.dataset.view; });
  }));

  /* ── eventos ── */
  let EVENTS = [];
  async function loadEvents() {
    const { data, error } = await sb.from('eventos').select('*').order('fecha', { ascending: false });
    if (error) { $('#eventList').innerHTML = `<p class="adm-empty">No se pudieron cargar los eventos.</p>`; return; }
    EVENTS = data;
    const today = new Date().toISOString().slice(0, 10);
    $('#eventList').innerHTML = data.length ? data.map(e => {
      const past = e.fecha < today;
      const flyer = e.flyer_url && e.flyer_url.startsWith('https://') ? e.flyer_url : '';
      return `<article class="adm-row">
        <div class="adm-thumb">${flyer ? `<img src="${esc(flyer)}" alt="">` : '—'}</div>
        <div class="adm-main">
          <h3>${esc(e.titulo)}</h3>
          <p>${esc(fmtDate(e.fecha))}${e.hora ? ' · ' + esc(e.hora) : ''} · ${esc(e.lugar)} · ${esc(CAT[e.categoria])}</p>
          <div class="chips">
            ${past ? '<span class="st st-past">Finalizado</span>' : e.publicado ? '<span class="st st-on">Publicado</span>' : '<span class="st st-off">Borrador</span>'}
            ${e.destacado ? '<span class="st st-hot">Destacado</span>' : ''}${e.agotado ? '<span class="st st-sold">Agotado</span>' : ''}
            <span class="st">${(e.precios || []).length} tipo(s) de entrada</span>
          </div>
        </div>
        <div class="adm-row-act">
          ${e.publicado && !past ? `<a class="btn btn-line" href="/agenda/?evento=${esc(e.id)}" target="_blank" rel="noopener">Ver</a>` : ''}
          <button class="btn btn-gold" data-edit="${esc(e.id)}">Editar</button>
        </div>
      </article>`;
    }).join('') : `<p class="adm-empty">Aún no hay eventos. Crea el primero con “Nuevo evento”.</p>`;
  }
  $('#eventList').addEventListener('click', e => { const b = e.target.closest('[data-edit]'); if (b) openEditor(EVENTS.find(x => x.id === b.dataset.edit)); });
  $('#newEvent').addEventListener('click', () => openEditor(null));

  const ed = $('#editor'), form = $('#eventForm');
  let editing = null, flyerUrl = null, flyerFile = null;

  function tierRow(t = {}) {
    const d = document.createElement('div');
    d.className = 'tier-row';
    d.innerHTML = `<input placeholder="Nombre (ej: General)" maxlength="60" data-k="nombre" value="${esc(t.nombre || '')}">
      <input type="number" min="0" max="100000" step="0.01" placeholder="Precio $" data-k="precio" value="${t.precio ?? ''}">
      <input placeholder="Detalle (opcional)" maxlength="120" data-k="detalle" value="${esc(t.detalle || '')}">
      <button type="button" class="btn btn-line" aria-label="Quitar entrada">×</button>`;
    d.querySelector('button').onclick = () => d.remove();
    $('#tiers').appendChild(d);
  }
  $('#addTier').addEventListener('click', () => tierRow());

  function setPreview(url) {
    $('#flyerPrev').innerHTML = url ? `<img src="${esc(url)}" alt="Vista previa del flyer">` : 'Sin flyer';
    $('#removeFlyer').hidden = !url;
  }
  form.flyer.addEventListener('change', () => {
    const f = form.flyer.files[0];
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) { status($('#edStatus'), 'El flyer debe ser JPG, PNG o WebP.', false); form.flyer.value = ''; return; }
    if (f.size > 5 * 1024 * 1024) { status($('#edStatus'), 'El flyer supera 5 MB.', false); form.flyer.value = ''; return; }
    flyerFile = f;
    setPreview(URL.createObjectURL(f));
  });
  $('#removeFlyer').addEventListener('click', () => { flyerFile = null; flyerUrl = null; form.flyer.value = ''; setPreview(null); });

  $$('[data-count]').forEach(s => {
    const ta = form.elements[s.dataset.count];
    const max = ta.maxLength;
    const upd = () => { s.textContent = `${ta.value.length}/${max}`; };
    ta.addEventListener('input', upd); ta._upd = upd;
  });

  function openEditor(e) {
    editing = e; flyerFile = null; flyerUrl = e?.flyer_url || null;
    form.reset();
    $('#edTitle').textContent = e ? 'Editar evento' : 'Nuevo evento';
    $('#edStatus').textContent = '';
    $('#tiers').innerHTML = '';
    if (e) {
      ['titulo', 'categoria', 'fecha', 'hora', 'lugar', 'resumen', 'descripcion', 'whatsapp'].forEach(k => { form.elements[k].value = e[k] ?? ''; });
      ['publicado', 'destacado', 'agotado'].forEach(k => { form.elements[k].checked = !!e[k]; });
      (e.precios || []).forEach(tierRow);
    } else {
      form.lugar.value = 'Gran Salón de Eventos';
      form.whatsapp.value = window.SM_CONFIG.whatsapp;
      tierRow({ nombre: 'General' });
    }
    $$('[data-count]').forEach(s => form.elements[s.dataset.count]._upd());
    setPreview(flyerUrl);
    $('#deleteEvent').hidden = !e;
    ed.classList.add('on');
    form.titulo.focus();
  }
  const closeEditor = () => ed.classList.remove('on');
  $$('.ed-x').forEach(b => b.addEventListener('click', closeEditor));

  async function uploadFlyer(file) {
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await sb.storage.from('flyers').upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
    if (error) throw new Error('No se pudo subir el flyer.');
    return sb.storage.from('flyers').getPublicUrl(path).data.publicUrl;
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const st = $('#edStatus');
    if (!form.checkValidity()) {
      const bad = form.querySelector(':invalid');
      status(st, bad && bad.name === 'whatsapp' ? 'El WhatsApp debe tener solo números con código de país (ej: 584120842757).' : 'Completa título y fecha.', false);
      bad && bad.focus();
      return;
    }
    const precios = $$('.tier-row', $('#tiers')).map(r => {
      const g = (k) => r.querySelector(`[data-k=${k}]`).value.trim();
      return { nombre: g('nombre'), precio: g('precio') === '' ? null : Number(g('precio')), detalle: g('detalle') || undefined };
    }).filter(t => t.nombre);
    if (precios.some(t => t.precio === null || isNaN(t.precio) || t.precio < 0)) return status(st, 'Cada tipo de entrada necesita un precio (0 si es gratis).', false);

    const btn = form.querySelector('button[type=submit]'); btn.disabled = true;
    status(st, 'Guardando…', true);
    try {
      if (flyerFile) flyerUrl = await uploadFlyer(flyerFile);
      const row = {
        titulo: form.titulo.value.trim(), categoria: form.categoria.value, fecha: form.fecha.value,
        hora: form.hora.value.trim() || null, lugar: form.lugar.value.trim() || 'Gran Salón de Eventos',
        resumen: form.resumen.value.trim() || null, descripcion: form.descripcion.value.trim() || null,
        flyer_url: flyerUrl, precios, whatsapp: form.whatsapp.value.trim(),
        publicado: form.publicado.checked, destacado: form.destacado.checked, agotado: form.agotado.checked,
      };
      const q = editing ? sb.from('eventos').update(row).eq('id', editing.id) : sb.from('eventos').insert(row);
      const { error } = await q;
      if (error) throw new Error(error.code === '23514' ? 'Algún campo excede el tamaño permitido.' : 'No se pudo guardar el evento.');
      closeEditor();
      loadEvents();
    } catch (err) {
      status(st, err.message, false);
    } finally {
      btn.disabled = false;
    }
  });

  $('#deleteEvent').addEventListener('click', async () => {
    if (!editing || !confirm(`¿Eliminar "${editing.titulo}"? Esta acción no se puede deshacer.`)) return;
    const { error } = await sb.from('eventos').delete().eq('id', editing.id);
    if (error) return status($('#edStatus'), 'No se pudo eliminar.', false);
    closeEditor();
    loadEvents();
  });

  /* ── postulaciones ── */
  let POSTS = [];
  async function loadPosts() {
    const { data, error } = await sb.from('postulaciones_corporativas')
      .select('id,empresa,rif,sector,ciudad,contacto_nombre,cargo,email,telefono,noches_mes,torre,necesita_salones,comentarios,estado,notas_internas,created_at')
      .order('created_at', { ascending: false }).limit(500);
    if (error) { $('#postList').innerHTML = '<p class="adm-empty">No se pudieron cargar las postulaciones.</p>'; return; }
    POSTS = data;
    const nuevas = data.filter(p => p.estado === 'nueva').length;
    $('#newCount').hidden = !nuevas; $('#newCount').textContent = nuevas;
    renderPosts();
  }
  function renderPosts() {
    const f = $('#estadoFilter').value;
    const list = f ? POSTS.filter(p => p.estado === f) : POSTS;
    $('#postList').innerHTML = list.length ? list.map(p => {
      const tel = p.telefono.replace(/[^\d]/g, '').replace(/^0/, '58');
      return `<article class="adm-post" data-id="${esc(p.id)}">
        <div class="post-head">
          <div><h3>${esc(p.empresa)}</h3><p>RIF ${esc(p.rif)}${p.sector ? ' · ' + esc(p.sector) : ''}${p.ciudad ? ' · ' + esc(p.ciudad) : ''}</p></div>
          <div class="post-meta"><span class="st st-${esc(p.estado)}">${esc(ESTADOS[p.estado])}</span><small>${esc(fmtTs(p.created_at))}</small></div>
        </div>
        <dl class="post-dl">
          <div><dt>Contacto</dt><dd>${esc(p.contacto_nombre)}${p.cargo ? ' — ' + esc(p.cargo) : ''}</dd></div>
          <div><dt>Correo</dt><dd><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></dd></div>
          <div><dt>Teléfono</dt><dd><a href="https://wa.me/${esc(tel)}" target="_blank" rel="noopener">${esc(p.telefono)}</a></dd></div>
          <div><dt>Noches / mes</dt><dd>${esc(NOCHES[p.noches_mes] || '—')}</dd></div>
          <div><dt>Torre</dt><dd>${esc(TORRES[p.torre] || '—')}</dd></div>
          <div><dt>Salones</dt><dd>${p.necesita_salones ? 'Sí' : 'No'}</dd></div>
          ${p.comentarios ? `<div class="full"><dt>Comentarios</dt><dd>${esc(p.comentarios)}</dd></div>` : ''}
        </dl>
        <div class="post-edit">
          <select data-f="estado" aria-label="Estado">${Object.entries(ESTADOS).map(([v, l]) => `<option value="${v}"${v === p.estado ? ' selected' : ''}>${l}</option>`).join('')}</select>
          <input data-f="notas" maxlength="2000" placeholder="Notas internas (tarifa asignada, seguimiento…)" value="${esc(p.notas_internas || '')}">
          <button class="btn btn-gold" data-save>Guardar</button>
        </div>
      </article>`;
    }).join('') : '<p class="adm-empty">No hay postulaciones en este estado.</p>';
  }
  $('#estadoFilter').addEventListener('change', renderPosts);
  $('#postList').addEventListener('click', async e => {
    const b = e.target.closest('[data-save]'); if (!b) return;
    const card = b.closest('.adm-post');
    b.disabled = true;
    const { error } = await sb.from('postulaciones_corporativas').update({
      estado: card.querySelector('[data-f=estado]').value,
      notas_internas: card.querySelector('[data-f=notas]').value.trim() || null,
    }).eq('id', card.dataset.id);
    b.disabled = false;
    b.textContent = error ? 'Error' : 'Guardado ✓';
    setTimeout(() => { b.textContent = 'Guardar'; }, 1800);
    if (!error) loadPosts();
  });
  $('#exportCsv').addEventListener('click', () => {
    const cols = ['created_at', 'empresa', 'rif', 'sector', 'ciudad', 'contacto_nombre', 'cargo', 'email', 'telefono', 'noches_mes', 'torre', 'necesita_salones', 'comentarios', 'estado', 'notas_internas'];
    const cell = (v) => { let s = String(v ?? ''); if (/^[=+\-@]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
    const csv = '﻿' + [cols.join(','), ...POSTS.map(p => cols.map(c => cell(p[c])).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `postulaciones-corporativas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  });

  boot();
})();
