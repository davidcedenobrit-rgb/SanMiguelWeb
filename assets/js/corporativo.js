(function () {
  const form = document.getElementById('corpForm');
  if (!form) return;
  const status = document.getElementById('corpStatus');
  const btn = form.querySelector('button[type=submit]');
  const LABELS = { empresa: 'Empresa', rif: 'RIF', contacto_nombre: 'Nombre de contacto', email: 'Correo', telefono: 'Teléfono', sector: 'Sector', ciudad: 'Ciudad', cargo: 'Cargo', comentarios: 'Comentarios' };

  const show = (msg, ok) => { status.textContent = msg; status.className = 'form-status ' + (ok ? 'ok' : 'err'); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    form.querySelectorAll('.bad').forEach(el => el.classList.remove('bad'));
    if (!form.checkValidity()) {
      const first = form.querySelector(':invalid');
      form.querySelectorAll(':invalid').forEach(el => el.classList.add('bad'));
      show('Completa los campos marcados.', false);
      first && first.focus();
      return;
    }
    const f = new FormData(form);
    const val = (k) => (f.get(k) || '').toString().trim();
    const payload = {
      empresa: val('empresa'), rif: val('rif').toUpperCase(), sector: val('sector'), ciudad: val('ciudad'),
      contacto_nombre: val('contacto_nombre'), cargo: val('cargo'), email: val('email'), telefono: val('telefono'),
      noches_mes: val('noches_mes') || null, torre: val('torre') || null,
      necesita_salones: f.get('necesita_salones') === 'on', comentarios: val('comentarios'), website: val('website'),
    };
    btn.disabled = true; btn.dataset.label = btn.dataset.label || btn.innerHTML; btn.textContent = 'Enviando…';
    try {
      const r = await fetch('/api/postulacion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        form.reset();
        form.hidden = true;
        document.getElementById('corpDone').hidden = false;
        document.getElementById('corpDone').scrollIntoView({ block: 'center' });
        return;
      }
      if (r.status === 400 && Array.isArray(data.campos)) {
        data.campos.forEach(c => { const el = form.elements[c]; el && el.classList.add('bad'); });
        const names = [...new Set(data.campos.map(c => LABELS[c] || c))].join(', ');
        show(`Revisa: ${names}.`, false);
      } else {
        show(data.error || 'No pudimos enviar tu solicitud. Intenta de nuevo.', false);
      }
    } catch {
      show('Sin conexión. Verifica tu internet e intenta de nuevo.', false);
    } finally {
      btn.disabled = false; btn.innerHTML = btn.dataset.label;
    }
  });
})();
