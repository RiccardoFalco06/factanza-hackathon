// Classifica: idee ordinate per numero di tick, a parità resta l'ordine di inserimento.
function rank(state) {
  const rows = state.ideas.map((idea, i) => ({
    idea,
    i,
    voters: state.names.filter(n => state.ticks[idea.id + '|' + n.id]),
  }));
  rows.sort((a, b) => b.voters.length - a.voters.length || a.i - b.i);
  // a parità di tick stesso posto (1, 1, 3)
  rows.forEach(r => { r.pos = 1 + rows.filter(o => o.voters.length > r.voters.length).length; });
  return rows;
}

const empty = () => ({ ideas: [], names: [], ticks: {} });
const clean = t => String(t ?? '').trim().slice(0, 200);
const ID = /^[a-z0-9]{1,24}$/;

// Applica un'operazione allo stato (stessa logica sul server e, in anticipo, sul telefono).
// Restituisce false se l'operazione non è valida.
function apply(state, op) {
  const lists = { idea: 'ideas', name: 'names' };
  if ((op.type === 'add' || op.type === 'del') && lists[op.kind] && ID.test(op.id)) {
    const list = lists[op.kind];
    if (op.type === 'add') {
      const text = clean(op.text);
      if (!text || state[list].length >= 200 || state[list].some(x => x.id === op.id)) return false;
      state[list].push({ id: op.id, text });
    } else {
      state[list] = state[list].filter(x => x.id !== op.id);
      for (const k in state.ticks) {
        const [i, n] = k.split('|');
        if ((op.kind === 'idea' ? i : n) === op.id) delete state.ticks[k];
      }
    }
    return true;
  }
  if (op.type === 'tick' && ID.test(op.idea) && ID.test(op.name)) {
    // valore esplicito, non toggle: due telefoni che toccano insieme non si annullano
    if (op.on) state.ticks[op.idea + '|' + op.name] = true;
    else delete state.ticks[op.idea + '|' + op.name];
    return true;
  }
  if (op.type === 'import' && op.state) {
    // unisce i dati salvati in locale prima della sincronizzazione; stesso testo = stessa voce
    const map = {};
    for (const [kind, list] of Object.entries(lists)) {
      for (const x of op.state[list] || []) {
        if (!ID.test(x.id)) continue;
        const same = state[list].find(y => y.text.toLowerCase() === clean(x.text).toLowerCase());
        if (same) map[x.id] = same.id;
        else if (apply(state, { type: 'add', kind, id: x.id, text: x.text })) map[x.id] = x.id;
      }
    }
    for (const k in op.state.ticks || {}) {
      const [i, n] = k.split('|');
      if (map[i] && map[n]) state.ticks[map[i] + '|' + map[n]] = true;
    }
    return true;
  }
  return false;
}

if (typeof module !== 'undefined') module.exports = { rank, apply, empty };

if (typeof document !== 'undefined') {
  const OLD_KEY = 'factanza-voti-v1';
  const $ = s => document.querySelector(s);
  const uid = () => Math.random().toString(36).slice(2, 10);
  let state = empty();
  let loaded = false;
  let pending = 0;
  let editing = false;

  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function status(msg) {
    $('#status').textContent = msg || '';
    $('#status').hidden = !msg;
  }

  async function call(path, body) {
    const r = await fetch('/api/' + path, body
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }

  async function pull() {
    if (pending) return; // non sovrascrivere un tick appena fatto e non ancora confermato
    try {
      const s = await call('state');
      if (pending) return;
      state = s;
      loaded = true;
      status('');
      render();
    } catch {
      status('Server non raggiungibile: riprovo tra poco.');
    }
  }

  // modifica subito lo schermo, poi la manda al PC; se fallisce ricarica lo stato vero
  async function send(op) {
    apply(state, op);
    render();
    pending++;
    try {
      const s = await call('op', op);
      if (--pending === 0) state = s;
      status('');
    } catch {
      pending--;
      status('Modifica non salvata: controlla la connessione e riprova.');
      await pull();
    }
    render();
  }

  // dati inseriti prima della sincronizzazione: caricati sul server una volta, poi tolti dal telefono
  async function migrate() {
    const old = JSON.parse(localStorage.getItem(OLD_KEY) || 'null');
    if (!old || (!old.ideas?.length && !old.names?.length)) return;
    state = await call('op', { type: 'import', state: old });
    localStorage.removeItem(OLD_KEY);
  }

  function render() {
    document.body.classList.toggle('editing', editing);
    $('#edit').textContent = editing ? 'Fatto' : 'Modifica';
    $('#edit').setAttribute('aria-pressed', editing);

    const { ideas, names, ticks } = state;
    const grid = $('#grid');
    if (!loaded) {
      grid.innerHTML = '<p class="empty">Caricamento…</p>';
    } else if (!ideas.length && !names.length) {
      grid.innerHTML = '<p class="empty">Aggiungi qui sotto le idee (righe) e i nomi delle persone (colonne). Poi tocca le caselle per mettere un tick.</p>';
    } else {
      let h = '<table><thead><tr><th class="corner" scope="col">Idee</th>';
      for (const n of names) {
        h += `<th scope="col"><span class="name">${esc(n.text)}</span>` +
          `<button class="del" data-del-name="${n.id}" aria-label="Elimina ${esc(n.text)}"><i class="ph-bold ph-x"></i></button></th>`;
      }
      h += '</tr></thead><tbody>';
      for (const idea of ideas) {
        h += `<tr><th scope="row"><span class="idea">${esc(idea.text)}</span>` +
          `<button class="del" data-del-idea="${idea.id}" aria-label="Elimina ${esc(idea.text)}"><i class="ph-bold ph-x"></i></button></th>`;
        for (const n of names) {
          const on = !!ticks[idea.id + '|' + n.id];
          h += `<td><button class="cell" data-idea="${idea.id}" data-name="${n.id}" aria-pressed="${on}" ` +
            `aria-label="${esc(n.text)} su ${esc(idea.text)}"><i class="ph-bold ph-check"></i></button></td>`;
        }
        h += '</tr>';
      }
      if (!ideas.length) h += `<tr><td class="hint" colspan="${names.length + 1}">Nessuna idea ancora.</td></tr>`;
      grid.innerHTML = h + '</tbody></table>' +
        (!names.length ? '<p class="hint">Aggiungi un nome per iniziare a tickare.</p>' : '');
    }

    const rows = rank(state);
    const anyTick = rows.some(r => r.voters.length);
    $('#ranking').innerHTML = !anyTick
      ? '<p class="empty">La classifica appare dal primo tick.</p>'
      : '<ol>' + rows.map(r => `<li class="${r.pos === 1 ? 'top' : ''}">
          <span class="pos">${r.pos}</span>
          <span class="txt"><strong>${esc(r.idea.text)}</strong>
            <small>${r.voters.length ? esc(r.voters.map(v => v.text).join(', ')) : 'Nessun tick'}</small></span>
          <span class="count">${r.voters.length}<small>/${names.length}</small></span>
        </li>`).join('') + '</ol>';
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.idea) {
      navigator.vibrate?.(8);
      send({ type: 'tick', idea: b.dataset.idea, name: b.dataset.name, on: b.getAttribute('aria-pressed') !== 'true' });
    } else if (b.dataset.delName) {
      send({ type: 'del', kind: 'name', id: b.dataset.delName });
    } else if (b.dataset.delIdea) {
      send({ type: 'del', kind: 'idea', id: b.dataset.delIdea });
    } else if (b.id === 'edit') {
      editing = !editing;
      render();
    }
  });

  for (const [form, kind] of [['#add-idea', 'idea'], ['#add-name', 'name']]) {
    $(form).addEventListener('submit', e => {
      e.preventDefault();
      const input = e.target.querySelector('input');
      const text = input.value.trim();
      if (!text || !loaded) return;
      input.value = '';
      send({ type: 'add', kind, id: uid(), text });
    });
  }

  render();
  migrate().catch(() => status('Server non raggiungibile: i dati salvati sul telefono restano lì finché non torna.'))
    .finally(pull);
  setInterval(pull, 3000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pull(); });
}
