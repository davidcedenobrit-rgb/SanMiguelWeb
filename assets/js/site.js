const WA = '584120842757';
const wa = (msg) => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const svg = (id) => `<svg><use href="#i-${id}"/></svg>`;

/* ── habitaciones ── */
const AMEN = [['wifi','WiFi'],['tv','Smart TV'],['snow','Aire acondicionado'],['desk','Escritorio'],['drop','Agua caliente'],['safe','Caja fuerte'],['bell','Room Service'],['car','Estacionamiento']];
const ROOMS = {
  vip: {
    extra: 20,
    list: [
      {id:'sencilla', name:'Habitación Sencilla', cfg:'1 cama king · 1 baño', cap:'1 o 2 personas', rack:155.91, corp:140.32},
      {id:'doble', name:'Habitación Doble', cfg:'2 camas matrimoniales · 1 baño', cap:'2 personas', rack:177.18, corp:159.46},
      {id:'junior', name:'Suite Junior', cfg:'1 habitación con cama king · 1 baño · cocina · comedor · área de lavandería', cap:'2 personas', rack:240.98, corp:216.88},
      {id:'premier', name:'Suite Premier', cfg:'Habitación con cama king y baño · habitación con 2 camas individuales · sala · comedor · cocina · lavandería · baño secundario', cap:'4 personas', rack:361.45, corp:325.31},
      {id:'senior', name:'Suite Senior', cfg:'Habitación con cama king y baño · 2 habitaciones con 2 camas individuales · sala · comedor · cocina · lavandería', cap:'6 personas', rack:496.11, corp:446.50},
    ]
  },
  express: {
    extra: 10,
    list: [
      {id:'sencilla', name:'Habitación Sencilla', cfg:'1 cama matrimonial o queen · 1 baño', cap:'1 o 2 personas', rack:95.54, corp:85.99},
      {id:'doble', name:'Habitación Doble', cfg:'2 camas matrimoniales · 1 baño', cap:'2 personas', rack:109.19, corp:98.27},
      {id:'junior', name:'Suite Junior', cfg:'Habitación principal con 2 camas matrimoniales · 1 baño · cocina', cap:'2 personas', rack:150.14, corp:135.13},
      {id:'premier', name:'Suite Premier', cfg:'Habitación principal con 2 camas matrimoniales y baño · habitación con cama matrimonial o queen y baño · cocina', cap:'4 personas', rack:245.70, corp:221.13},
    ]
  }
};
let RATE = 'rack';
const money = (v) => { const [i, d] = v.toFixed(2).split('.'); return `$${i}<sup>,${d}</sup>`; };
const towerName = {vip:'Torre VIP', express:'Torre Express'};

document.querySelectorAll('[data-amen]').forEach(ul => ul.innerHTML = AMEN.map(([i,t]) => `<li>${svg(i)}${t}</li>`).join(''));

function renderRooms(){
  if (!document.querySelector('[data-rooms]')) return;
  document.querySelectorAll('[data-rooms]').forEach(grid => {
    const t = grid.dataset.rooms, pre = t === 'vip' ? 'vip' : 'exp';
    grid.innerHTML = ROOMS[t].list.map(r => {
      const imgs = [1,2,3].map(n => `/assets/img/${pre}-${r.id}-${n}.webp`);
      const msg = `Hola, quiero reservar una ${r.name} en la ${towerName[t]} del Hotel San Miguel (tarifa ${RATE === 'rack' ? 'Rack' : 'Corporativa'}).`;
      return `<article class="room">
        <div class="room-media"><img src="${imgs[0]}" alt="${esc(r.name)} — ${towerName[t]}" loading="lazy">
          <div class="room-thumbs">${imgs.map((s,k) => `<button class="${k?'':'on'}" data-src="${s}" aria-label="Ver foto ${k+1}"><img src="${s}" alt="" loading="lazy"></button>`).join('')}</div>
        </div>
        <div class="room-body">
          <h4>${esc(r.name)}</h4>
          <p class="room-cfg">${esc(r.cfg)}</p>
          <div class="room-cap">${svg('user')}Capacidad: ${esc(r.cap)}</div>
          <div class="room-foot">
            <div class="price"><small>Desde</small><b>${money(r[RATE])}</b> <span>/ noche</span></div>
            <a class="btn btn-gold" href="${wa(msg)}" target="_blank" rel="noopener">Reservar</a>
          </div>
        </div>
      </article>`;
    }).join('');
  });
  const t = document.querySelector('.tower.on').id === 't-vip' ? 'vip' : 'express';
  document.getElementById('roomsNote').textContent = `Tarifas ${RATE === 'rack' ? 'Rack' : 'Corporativas'} en USD por noche (${towerName[t]}). Persona adicional: $${ROOMS[t].extra}. Las tarifas no incluyen desayuno; puedes agregarlo por $15 por persona. Sujetas a disponibilidad.`;
}
renderRooms();

document.addEventListener('click', e => {
  const th = e.target.closest('.room-thumbs button');
  if (th) {
    const media = th.closest('.room-media');
    media.querySelector(':scope > img').src = th.dataset.src;
    media.querySelectorAll('.room-thumbs button').forEach(b => b.classList.toggle('on', b === th));
  }
});
document.querySelectorAll('[data-tower]').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('[data-tower]').forEach(x => x.setAttribute('aria-selected', x === b));
  document.querySelectorAll('.tower').forEach(p => p.classList.toggle('on', p.id === 't-' + b.dataset.tower));
  renderRooms();
}));
document.querySelectorAll('[data-rate]').forEach(b => b.addEventListener('click', () => {
  RATE = b.dataset.rate;
  document.querySelectorAll('[data-rate]').forEach(x => x.setAttribute('aria-selected', x === b));
  renderRooms();
}));

/* ── salones ── */
const SALONES = [
  {n:'Salón Río Aragua', pax:'500', img:'salon-rio-aragua', d:'Conferencias corporativas y médicas, bodas, quince años, bautizos y eventos sociales.', f:['WiFi','A/A','Coffee break']},
  {n:'Salón Morichal', pax:'50', img:'salon-morichal', d:'Perfecto para conferencias, talleres y reuniones empresariales.', f:['WiFi','Audiovisuales','A/A','Coffee break']},
  {n:'Salón Guarapiche', pax:'30–40', img:'salon-guarapiche', d:'Montaje estilo teatro y escuela para talleres, conferencias y reuniones.', f:['WiFi','Audiovisuales','A/A','Coffee break']},
  {n:'Salón El Guamo', pax:'30', img:'salon-el-guamo', d:'Talleres, reuniones corporativas y videoconferencias.', f:['WiFi','Audiovisuales','A/A','Coffee break']},
  {n:'Salón Río Chiquito', pax:'10–15', img:'salon-rio-chiquito', d:'Reuniones empresariales privadas y videoconferencias.', f:['WiFi','Audiovisuales','A/A','Coffee break']},
];
const salEl = document.getElementById('salones');
if (salEl) salEl.innerHTML = SALONES.map((s,i) => `<article class="salon rv d${i%3}">
  <img src="/assets/img/${s.img}.webp" alt="${esc(s.n)}" loading="lazy">
  <div class="salon-b"><div class="salon-pax">${s.pax}<small>PAX</small></div><h4>${esc(s.n)}</h4><p>${esc(s.d)}</p><ul>${s.f.map(x=>`<li>${x}</li>`).join('')}</ul></div>
</article>`).join('');

/* ── concesiones ── */
const waNum = (t) => { const d = t.replace(/[^\d]/g, ''); return d.startsWith('58') ? d : '58' + d.replace(/^0/, ''); };
const waBiz = (v) => `https://wa.me/${waNum(v.tel)}?text=${encodeURIComponent(`Hola, vi ${v.name} en la web del Hotel San Miguel y quiero información.`)}`;
function venueCard(v){
  const logo = v.logo ? `<div class="venue-logo"><img src="/assets/logos/${v.logo}.png" alt="Logo ${esc(v.name)}" loading="lazy"></div>` : '';
  const meta = [
    v.hours && `<li>${svg('clock')}<span>${esc(v.hours)}</span></li>`,
    v.loc && `<li>${svg('pin')}<span>${esc(v.loc)}</span></li>`,
  ].filter(Boolean).join('');
  const perk = v.perk ? `<div class="perk">${svg('gift')}${esc(v.perk)}</div>` : '';
  const ig = v.ig ? `<a href="https://instagram.com/${v.ig}" target="_blank" rel="noopener">${svg('ig')}@${esc(v.ig)}</a>` : '<span></span>';
  const tel = v.tel ? `<a href="${waBiz(v)}" target="_blank" rel="noopener" aria-label="WhatsApp de ${esc(v.name)}">${svg('wa')}${esc(v.tel)}</a>` : '';
  return `<article class="venue rv">
    <div class="venue-media"><img src="/assets/img/${v.img}.webp" alt="${esc(v.name)}" loading="lazy"${v.pos ? ` style="object-position:${v.pos}"` : ''}>${logo}</div>
    <div class="venue-body">
      <div class="venue-type">${esc(v.type)}</div>
      <h3>${esc(v.name)}</h3>
      <p class="venue-desc">${esc(v.desc)}</p>
      <ul class="meta">${meta}</ul>
      ${perk}
      <div class="venue-foot">${ig}${tel}</div>
    </div>
  </article>`;
}
const FOOD = [
  {name:'Mantuano', type:'Restaurante mediterráneo-tropical', img:'r-mantuano', logo:'mantuano', desc:'Una propuesta fresca que combina sabores mediterráneos con el carácter tropical del destino.', hours:'Todos los días · 7:00 a.m. – 10:00 p.m.', loc:'Lobby Torre Express', tel:'0414-0841304'},
  {name:'Gradas Sport Bar', type:'Gastrobar', img:'r-gradas', logo:'gradas', desc:'Un espacio casual para disfrutar buena comida, bebidas y ambiente deportivo. Desayunos, almuerzos, snacks y cenas.', hours:'Lun – Dom · 7:00 a.m. – 11:00 p.m.', loc:'Lobby Club · Ext. huéspedes 1036', ig:'gradas_bar', tel:'0412-1828232'},
  {name:'Saque Pádel Club', type:'Club de pádel · Restaurante', img:'r-saque', logo:'saque', desc:'Una experiencia que combina deporte, gastronomía y un ambiente social exclusivo, con restaurante y bar.', hours:'Dom – Jue 5:00 p.m. – 12:00 a.m. · Vie – Sáb 5:00 p.m. hasta el cierre', loc:'Junto a las canchas de tenis', ig:'saquepadelclub', tel:'0414-1925060'},
  {name:'El Chiringuito Bar', type:'Restaurante · Bar', img:'r-chiringuito', logo:'chiringuito', desc:'Ambiente relajado, buena música y sabores mar y tierra, hamburguesas, tapas y coctelería junto a la piscina.', hours:'Mié, Jue y Dom 11:00 a.m. – 11:00 p.m. · Vie – Sáb 11:00 a.m. – 3:00 a.m.', loc:'Junto a la piscina', ig:'elchiringuito.bar', tel:'0424-9092734'},
  {name:'Casa Nino', type:'Bodegón · Coffee time · Restaurante', img:'r-casanino', logo:'casanino', desc:'Market, bakery y restaurante: un lugar pensado para disfrutar café, buena comida y una experiencia cálida.', hours:'Lun – Mié y Dom 8:00 a.m. – 10:00 p.m. · Jue hasta 12:00 a.m. · Vie – Sáb hasta 2:00 a.m.', loc:'Entrada principal, junto a Saque Pádel Club', ig:'casaninove', tel:'0424-9296783'},
  {name:'La Tarima de la Carne en Vara', type:'Restaurante tradicional venezolano', img:'r-tarima', logo:'tarima', desc:'Tradición venezolana servida con autenticidad, sabor y el toque clásico de la carne en vara.', hours:'Mié – Dom · 7:00 a.m. – 11:00 p.m.', loc:'Lobby Club', ig:'latarimadelacarne', tel:'0412-1828232'},
  {name:'Órale', type:'Restaurante mexicano', img:'r-orale', logo:'orale', desc:'Sabores mexicanos auténticos — tacos, margaritas y cocina tradicional — en una experiencia cercana y colorida.', hours:'Mié 2:00 – 9:00 p.m. · Jue – Sáb 12:00 – 9:00 p.m. · Lun y Mar cerrado', loc:'Entrada de la piscina', ig:'orale.rest', tel:'+58 422-1407996'},
  {name:'El Árbol Café', type:'Restaurante · Café', img:'r-arbolcafe', logo:'arbolcafe', desc:'Un rincón acogedor donde el café y la buena comida se encuentran. Ideal para desayunos, almuerzos, cenas y reuniones.', hours:'Mar – Jue 7:00 a.m. – 10:00 p.m. · Vie – Sáb hasta 11:00 p.m. · Dom 8:00 a.m. – 8:00 p.m.', loc:'Junto al Centro de Entrenamiento Auyante', ig:'elarbolcafe', tel:'0424-9733938'},
  {name:'Barrokos', type:'Restaurante · Disco', img:'r-barrokos', logo:'barrokos', desc:'Buena comida, cocteles y entretenimiento en un espacio pensado para disfrutar la noche.', hours:'Restaurante: Vie – Sáb desde 6:00 p.m. · Dom desde 12:00 p.m. · Disco: Vie – Sáb desde 10:00 p.m.', loc:'Frente a la piscina', ig:'barrokos', tel:'0412-1016067'},
];
const SPORTS = [
  {name:'Campo de Golf', type:'Golf', img:'d-golfer', desc:'Un recorrido pensado para disfrutar cada golpe en un entorno privilegiado rodeado de naturaleza.', perk:'Green Fee gratuito para huéspedes', tel:'0424-9046017'},
  {name:'Saque Pádel Club', type:'Canchas de pádel', img:'d-padel', logo:'saque', desc:'Canchas profesionales y clases con coaches certificados. Reservas por Playtomic.', hours:'Dom – Jue 5:00 p.m. – 12:00 a.m. · Vie – Sáb hasta el cierre', ig:'saquepadelclub', tel:'0414-1925060'},
  {name:'Beach Tennis San Miguel', type:'Tenis de playa', img:'d-beach', desc:'Alquiler de canchas y clases para principiantes y jugadores avanzados.', hours:'Lun – Dom desde las 5:00 p.m.', perk:'1 hora de cancha gratis para huéspedes', ig:'beachtennissanmiguel', tel:'0412-9164552'},
  {name:'Auyante', type:'Centro de entrenamiento', img:'d-auyante', logo:'auyante', desc:'Functional fitness, CrossFit, musculación, natación, gimnasia, halterofilia y clases infantiles.', hours:'Lun – Vie 6:00 a.m. – 9:00 p.m. · Sáb 8:00 – 11:30 a.m.', perk:'Tarifas especiales para huéspedes', ig:'somosauyante', tel:'0412-8618350'},
  {name:'Conexión Fit', type:'Power Bike', img:'d-conexion', logo:'conexion', desc:'Sesiones de Power Bike para entrenar con energía y al ritmo de la música. No necesitas ser miembro del Club.', hours:'Lun – Vie · 7:30 a.m. y 5:30 p.m.', perk:'Primera clase gratuita', ig:'conexionfit', tel:'0414-8869404'},
  {name:'Alpha Tennis', type:'Tenis · Academia', img:'d-academias', pos:'85% 50%', desc:'Canchas de tenis y academia para niños y adolescentes.', hours:'Academia: Lun – Vie 3:00 – 7:30 p.m.', perk:'Canchas gratis en la mañana y desde 7:30 p.m.', ig:'alphasm_tenis', tel:'+58 424-7201775'},
  {name:'Auyante FC', type:'Academia de fútbol', img:'d-academias', logo:'auyante', pos:'15% 50%', desc:'Academia de formación de fútbol para niños y jóvenes.', ig:'auyantefc', tel:'+58 424-8727777'},
  {name:'Gimnasio del hotel', type:'Fitness', img:'gimnasio', desc:'Espacio equipado para mantener tu rutina de entrenamiento durante la estadía.'},
];
const BEAUTY = [
  {name:'Verónica Scarso Spa', type:'Spa y estética', img:'b-vscarso', logo:'vscarso', desc:'Clínica estética y spa: faciales, corporales, maquillaje, peluquería, barbería, uñas, depilación, pestañas y cámara hiperbárica.', hours:'Depilación: Lun – Sáb 9:00 a.m. – 5:00 p.m.', loc:'Torre Express · Ext. huéspedes 2003', ig:'vscarso.spa', tel:'0416-4857629'},
  {name:'Bahía Salón', type:'Belleza', img:'b-bahia', logo:'bahia', desc:'Centro de belleza especializado en cuidado personal, imagen y relajación: manicura, pedicura y peluquería.', hours:'Solo con cita previa', loc:'Lobby Club', ig:'bahiasalon.ve', tel:'0412-4883290'},
  {name:'Fresa', type:'Boutique', img:'b-fresa', logo:'fresa', desc:'Moda femenina y trajes de baño con propuestas frescas y exclusivas para cada ocasión.', loc:'Torre Express', ig:'fresa.vs', tel:'0416-4857629'},
];
if (document.getElementById('venues')) document.getElementById('venues').innerHTML = FOOD.map(venueCard).join('');
if (document.getElementById('sports')) document.getElementById('sports').innerHTML = SPORTS.map(venueCard).join('');
if (document.getElementById('beauty')) document.getElementById('beauty').innerHTML = BEAUTY.map(venueCard).join('');

/* ── concesiones (portada) ── */
const concGrid = document.getElementById('concGrid');
if (concGrid) {
  const ALL = [];
  [[FOOD, 'food', '/gastronomia/'], [SPORTS.filter(v => v.img !== 'gimnasio'), 'sport', '/bienestar/'], [BEAUTY, 'beauty', '/bienestar/']].forEach(([arr, g, href]) => arr.forEach(v => {
    const dup = ALL.find(x => x.name === v.name);
    if (dup) dup.g += ' ' + g; else ALL.push({...v, g, href});
  }));
  const tile = v => `<article class="conc" data-g="${v.g}"><a class="conc-link" href="${v.href}">
    <div class="conc-media"><img class="conc-photo" src="/assets/img/${v.img}.webp" alt="${esc(v.name)}" loading="lazy"${v.pos ? ` style="object-position:${v.pos}"` : ''}>
      <div class="conc-logo">${v.logo ? `<img src="/assets/logos/${v.logo}.png" alt="Logo ${esc(v.name)}" loading="lazy">` : `<span>${esc(v.name)}</span>`}</div></div>
    <div class="conc-b"><small>${esc(v.type)}</small><h3>${esc(v.name)}</h3>${v.hours ? `<p>${svg('clock')}${esc(v.hours)}</p>` : ''}${v.perk ? `<em>${svg('gift')}${esc(v.perk)}</em>` : ''}</div></a>
    <div class="conc-foot">${v.tel ? `<a class="c-wa" href="${waBiz(v)}" target="_blank" rel="noopener" aria-label="WhatsApp de ${esc(v.name)}">${svg('wa')}${esc(v.tel)}</a>` : '<span></span>'}${v.ig ? `<a class="c-ig" href="https://instagram.com/${esc(v.ig)}" target="_blank" rel="noopener" aria-label="Instagram de ${esc(v.name)}">${svg('ig')}@${esc(v.ig)}</a>` : ''}</div>
  </article>`;
  concGrid.innerHTML = ALL.map(tile).join('');
  document.querySelectorAll('[data-conc]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('[data-conc]').forEach(x => x.setAttribute('aria-selected', x === b));
    concGrid.querySelectorAll('.conc').forEach(c => { c.hidden = b.dataset.conc !== 'all' && !c.dataset.g.split(' ').includes(b.dataset.conc); });
  }));
}

/* ── whatsapp buttons ── */
document.querySelectorAll('[data-wa]').forEach(a => { a.href = wa(a.dataset.wa); a.target = '_blank'; a.rel = 'noopener'; });

/* ── nav ── */
const nav = document.getElementById('nav'), burger = document.getElementById('burger');
const onScroll = () => nav.classList.toggle('solid', scrollY > 60);
addEventListener('scroll', onScroll, {passive:true}); onScroll();
burger.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  burger.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
});
document.querySelectorAll('#navLinks a').forEach(a => a.addEventListener('click', () => {
  document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', false); document.body.style.overflow = '';
}));
const page = document.body.dataset.page;
document.querySelectorAll('#navLinks a').forEach(l => l.classList.toggle('on', l.dataset.page === page));

/* ── reveal + counters ── */
const rvObs = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in'); rvObs.unobserve(e.target);
  const n = e.target.querySelector('[data-count]');
  if (n && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
    const end = +n.dataset.count, t0 = performance.now();
    const step = t => { const p = Math.min(1, (t - t0) / 1600); n.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
}), {threshold:.12});
document.querySelectorAll('.rv').forEach(el => rvObs.observe(el));

/* ── lightbox ── */
const lb = document.getElementById('lb'), lbImg = lb.querySelector('img');
let group = [], idx = 0;
const show = i => { idx = (i + group.length) % group.length; lbImg.src = group[idx].currentSrc || group[idx].src; lbImg.alt = group[idx].alt; };
document.querySelectorAll('[data-gallery]').forEach(g => g.addEventListener('click', e => {
  const img = e.target.closest('.fac') ? e.target.closest('.fac').querySelector('img') : (e.target.tagName === 'IMG' ? e.target : null);
  if (!img) return;
  group = [...g.querySelectorAll('img')]; show(group.indexOf(img));
  lb.classList.add('on'); document.body.style.overflow = 'hidden'; lb.querySelector('.x').focus();
}));
const closeLb = () => { lb.classList.remove('on'); document.body.style.overflow = ''; };
lb.querySelector('.x').onclick = closeLb;
lb.querySelector('.p').onclick = () => show(idx - 1);
lb.querySelector('.n').onclick = () => show(idx + 1);
lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
addEventListener('keydown', e => {
  if (!lb.classList.contains('on')) return;
  if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1);
});
