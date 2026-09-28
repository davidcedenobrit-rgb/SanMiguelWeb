(function () {
  const { supabaseUrl, supabaseKey } = window.SM_CONFIG;
  const grid = document.getElementById('agendaGrid');
  const teaser = document.getElementById('agendaTeaser');
  if (!grid && !teaser) return;

  const CAT = { concierto: 'Concierto', fiesta: 'Fiesta', deportivo: 'Deportivo', gastronomico: 'Gastronómico', cultural: 'Cultural', familiar: 'Familiar', corporativo: 'Corporativo', otro: 'Evento' };
  const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const svg = (id) => `<svg><use href="#i-${id}"/></svg>`;
  const parseDate = (d) => { const [y, m, dd] = d.split('-').map(Number); return new Date(y, m - 1, dd); };
  const longDate = (d) => { const x = parseDate(d); return `${DIAS[x.getDay()]} ${x.getDate()} de ${['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][x.getMonth()]}`; };
  const money = (n) => Number(n) === 0 ? 'Gratis' : `$${Number(n).toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  const safeUrl = (u) => (typeof u === 'string' && u.startsWith('https://')) ? u : '';
  const waLink = (e, tier) => {
    const msg = `Hola, quiero comprar entradas para "${e.titulo}" (${longDate(e.fecha)}${e.hora ? ', ' + e.hora : ''})${tier ? ` — ${tier.nombre} (${money(tier.precio)})` : ''}. ¿Me indican disponibilidad y formas de pago?`;
    return `https://wa.me/${e.whatsapp}?text=${encodeURIComponent(msg)}`;
  };
  const minPrice = (e) => {
    const p = (e.precios || []).map(t => Number(t.precio)).filter(n => !isNaN(n));
    return p.length ? Math.min(...p) : null;
  };

  function card(e) {
    const d = parseDate(e.fecha);
    const mp = minPrice(e);
    const flyer = safeUrl(e.flyer_url);
    return `<article class="ev-card${e.agotado ? ' sold' : ''}" data-id="${esc(e.id)}">
      <button class="ev-flyer" data-open="${esc(e.id)}" aria-label="Ver detalles de ${esc(e.titulo)}">
        ${flyer ? `<img src="${esc(flyer)}" alt="Flyer de ${esc(e.titulo)}" loading="lazy">` : `<div class="ev-noflyer">${esc(CAT[e.categoria] || 'Evento')}</div>`}
        <div class="ev-date"><b>${d.getDate()}</b><span>${MESES[d.getMonth()]}</span></div>
        ${e.agotado ? '<div class="ev-sold">Agotado</div>' : e.destacado ? '<div class="ev-hot">Destacado</div>' : ''}
      </button>
      <div class="ev-body">
        <div class="venue-type">${esc(CAT[e.categoria] || 'Evento')}</div>
        <h3>${esc(e.titulo)}</h3>
        <ul class="meta">
          <li>${svg('cal')}<span>${esc(longDate(e.fecha))}${e.hora ? ' · ' + esc(e.hora) : ''}</span></li>
          <li>${svg('pin')}<span>${esc(e.lugar)}</span></li>
        </ul>
        ${e.resumen ? `<p class="venue-desc">${esc(e.resumen)}</p>` : ''}
        <div class="ev-foot">
          <div class="price"><small>${mp === null ? 'Entradas' : 'Desde'}</small><b>${mp === null ? 'Consultar' : esc(money(mp))}</b></div>
          <div class="ev-actions">
            <button class="btn btn-line" data-open="${esc(e.id)}">Detalles</button>
            ${e.agotado ? '' : `<a class="btn btn-gold" href="${waLink(e)}" target="_blank" rel="noopener">${svg('wa')}Comprar</a>`}
          </div>
        </div>
      </div>
    </article>`;
  }

  let EVENTS = [];
  const modal = document.getElementById('evModal');

  function openModal(id) {
    const e = EVENTS.find(x => x.id === id);
    if (!e || !modal) return;
    const flyer = safeUrl(e.flyer_url);
    const tiers = (e.precios || []).filter(t => t && t.nombre);
    modal.querySelector('.evm-card').classList.toggle('noflyer', !flyer);
    modal.querySelector('.evm-body').innerHTML = `
      ${flyer ? `<img class="evm-flyer" src="${esc(flyer)}" alt="Flyer de ${esc(e.titulo)}">` : ''}
      <div class="evm-info">
        <div class="venue-type">${esc(CAT[e.categoria] || 'Evento')}${e.agotado ? ' · <span style="color:#e57373">Agotado</span>' : ''}</div>
        <h2 id="evmTitle">${esc(e.titulo)}</h2>
        <ul class="meta">
          <li>${svg('cal')}<span>${esc(longDate(e.fecha))}${e.hora ? ' · ' + esc(e.hora) : ''}</span></li>
          <li>${svg('pin')}<span>${esc(e.lugar)} · Hotel San Miguel Golf &amp; Club</span></li>
        </ul>
        ${e.descripcion ? `<div class="evm-desc">${esc(e.descripcion).replace(/\n/g, '<br>')}</div>` : (e.resumen ? `<div class="evm-desc">${esc(e.resumen)}</div>` : '')}
        ${tiers.length ? `<h4>Entradas</h4><div class="tiers">${tiers.map(t => `
          <div class="tier"><div><b>${esc(t.nombre)}</b>${t.detalle ? `<span>${esc(t.detalle)}</span>` : ''}</div>
          <div class="tier-r"><strong>${esc(money(t.precio))}</strong>${e.agotado ? '' : `<a class="btn btn-gold" href="${waLink(e, t)}" target="_blank" rel="noopener">${svg('wa')}Comprar</a>`}</div></div>`).join('')}</div>` : ''}
        ${e.agotado ? '<p class="evm-note">Este evento está agotado. Escríbenos para lista de espera.</p>' : `<a class="btn btn-gold evm-cta" href="${waLink(e)}" target="_blank" rel="noopener">${svg('wa')}Comprar por WhatsApp</a>`}
        <p class="evm-note">La venta y el pago se coordinan por WhatsApp con el equipo del hotel.</p>
      </div>`;
    modal.classList.add('on');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.evm-x').focus();
    history.replaceState(null, '', `?evento=${encodeURIComponent(id)}`);
  }
  function closeModal() {
    modal.classList.remove('on');
    document.body.style.overflow = '';
    history.replaceState(null, '', location.pathname);
  }
  if (modal) {
    modal.querySelector('.evm-x').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('on')) closeModal(); });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-open]');
    if (b) { e.preventDefault(); openModal(b.dataset.open); }
  });

  function renderGrid(filter) {
    const list = filter && filter !== 'all' ? EVENTS.filter(e => e.categoria === filter) : EVENTS;
    grid.innerHTML = list.length ? list.map(card).join('') : `<div class="ev-empty">
      <h3>Próximamente nuevos eventos</h3>
      <p>Estamos preparando la próxima agenda. Escríbenos para recibir la programación antes que nadie.</p>
      <a class="btn btn-gold" href="https://wa.me/${window.SM_CONFIG.whatsapp}?text=${encodeURIComponent('Hola, quiero recibir la agenda de eventos del Hotel San Miguel.')}" target="_blank" rel="noopener">${svg('wa')}Quiero la agenda</a></div>`;
  }

  function renderFilters() {
    const box = document.getElementById('agendaFilters');
    if (!box) return;
    const cats = [...new Set(EVENTS.map(e => e.categoria))];
    if (cats.length < 2) { box.innerHTML = ''; return; }
    box.innerHTML = [['all', 'Todos'], ...cats.map(c => [c, CAT[c] || c])].map(([v, l], i) =>
      `<button class="tab" role="tab" aria-selected="${i === 0}" data-cat="${esc(v)}">${esc(l)}</button>`).join('');
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-cat]'); if (!b) return;
      box.querySelectorAll('[data-cat]').forEach(x => x.setAttribute('aria-selected', x === b));
      renderGrid(b.dataset.cat);
    });
  }

  async function load() {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    const q = `eventos?select=id,titulo,categoria,fecha,hora,lugar,resumen,descripcion,flyer_url,precios,whatsapp,destacado,agotado&publicado=eq.true&fecha=gte.${today}&order=destacado.desc,fecha.asc&limit=60`;
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/${q}`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } });
      if (!r.ok) throw new Error(r.status);
      EVENTS = await r.json();
      EVENTS.sort((a, b) => a.fecha.localeCompare(b.fecha));
    } catch {
      EVENTS = [];
    }
    if (grid) {
      renderFilters();
      renderGrid('all');
      const id = new URLSearchParams(location.search).get('evento');
      if (id) openModal(id);
    }
    if (teaser) {
      const sec = teaser.closest('section');
      if (!EVENTS.length) { sec.hidden = true; return; }
      const top = [...EVENTS].sort((a, b) => (b.destacado - a.destacado) || a.fecha.localeCompare(b.fecha)).slice(0, 3)
        .sort((a, b) => a.fecha.localeCompare(b.fecha));
      teaser.innerHTML = top.map(card).join('');
      teaser.querySelectorAll('[data-open]').forEach(b => {
        b.removeAttribute('data-open');
        const a = document.createElement('a');
        a.href = `/agenda/?evento=${encodeURIComponent(b.closest('.ev-card').dataset.id)}`;
        a.className = b.className; a.innerHTML = b.innerHTML; a.setAttribute('aria-label', b.getAttribute('aria-label') || 'Ver detalles');
        b.replaceWith(a);
      });
      sec.hidden = false;
    }
  }
  load();
})();
