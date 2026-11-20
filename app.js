'use strict';
/* KalaSetu demo — fictional data, simulated payments, rule-based "extraction". All money = integer paise. */

/* ================= LOGIC (pure, no DOM) ================= */
const KEY = 'kalasetu.demo.v1';
const ROLES = ['organizer', 'artist', 'tourist'];
const EVENT_TYPES = ['Cultural festival', 'College fest', 'Wedding', 'Temple event', 'Community event'];
const EVENT_ARTWORK = {
  festival: { src: 'assets/events/cultural-festival.svg', alt: 'Illustration of a folk dance performance at an outdoor cultural festival', label: 'Cultural festival' },
  performance: { src: 'assets/events/cultural-festival.svg', alt: 'Illustration of a folk dance performance on a decorated stage', label: 'Folk performance' },
  college: { src: 'assets/events/college-fest.svg', alt: 'Illustration of a college cultural fest on an open-air campus stage', label: 'College fest' },
  wedding: { src: 'assets/events/wedding.svg', alt: 'Illustration of a wedding ceremony beneath a flower-decorated mandap', label: 'Wedding celebration' },
  temple: { src: 'assets/events/temple-event.svg', alt: 'Illustration of a cultural performance in a temple courtyard', label: 'Temple event' },
  community: { src: 'assets/events/community-event.svg', alt: 'Illustration of neighbors gathered for a community folk performance', label: 'Community gathering' },
};
function eventArtworkFor(details) {
  const type = String(details.eventType || '').toLowerCase();
  const text = `${type} ${details.event || ''} ${details.description || ''}`.toLowerCase();
  if (/wedding|marriage|engagement|reception/.test(text)) return 'wedding';
  if (type.includes('college')) return 'college';
  if (type.includes('temple')) return 'temple';
  if (type.includes('community')) return 'community';
  if (/dance|folk|temple|ritual|ceremony|bihu|karagattam|kalbelia|kajri/.test(text)) return 'performance';
  return 'festival';
}
const uid = (p) => p + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const nowIso = () => new Date().toISOString();
const pad = (n) => String(n).padStart(2, '0');
const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const plusDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return dateStr(d); };

function toPaise(v) {                       // "₹10,000.50" -> 1000050 ; null when invalid
  const s = String(v == null ? '' : v).replace(/[₹,\s]/g, '');
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(s)) return null;
  const [w, f = ''] = s.split('.');
  return Number(w) * 100 + Number((f + '00').slice(0, 2));
}
function inr(p) {
  const r = Math.floor(p / 100), f = p % 100;
  return '₹' + r.toLocaleString('en-IN') + (f ? '.' + pad(f) : '');
}

function seed() {
  const P = (id, name, form, place, region, languages, groupSize, fee, travel, summary, pal, skills, eventTypes) =>
    ({ id, name, form, place, region, languages, groupSize, feePaise: fee * 100, travelPaise: travel * 100, summary, pal, skills, eventTypes, media: [] });
  return {
    v: 1, role: 'organizer', view: 'home', authenticated: false, sel: null,
    profiles: [
      P('p1', 'Kaveri Karagattam Troupe', 'Karagattam', 'Thanjavur', 'Tamil Nadu', ['Tamil', 'Telugu', 'English'], 8, 10000, 1000,
        'Karagattam dancers balancing decorated pots, with live nadaswaram and thavil.', 0, ['Karagattam', 'Live folk music', 'Stage performance'], ['College fest', 'Cultural festival', 'Temple event']),
      P('p2', 'Banaras Kajri Sangeet Sabha', 'Kajri', 'Varanasi', 'Uttar Pradesh', ['Hindi', 'Bhojpuri'], 6, 15000, 1500,
        'Monsoon-season Kajri songs with harmonium, dholak and storytelling.', 1, ['Kajri vocals', 'Harmonium', 'Storytelling'], ['Cultural festival', 'College fest', 'Community event']),
      P('p3', 'Brahmaputra Bihu Dhuli Dol', 'Bihu', 'Jorhat', 'Assam', ['Assamese', 'English'], 12, 12000, 2000,
        'High-energy Bihu dance with dhol, pepa and gogona.', 2, ['Bihu dance', 'Dhol', 'Pepa'], ['College fest', 'Cultural festival', 'Community event']),
      P('p4', 'Thar Kalbelia Sangh', 'Kalbelia', 'Jaisalmer', 'Rajasthan', ['Hindi', 'Rajasthani'], 7, 18000, 2500,
        'Kalbelia dance and desert folk music with khartal and morchang.', 3, ['Kalbelia dance', 'Khartal', 'Morchang'], ['Wedding', 'Cultural festival', 'Community event']),
    ],
    studio: { intro: '', draft: null }, requests: [], payments: [], log: [], wishlist: [],
  };
}

const SAMPLE_INTRO = 'Namaste, we are the Kaveri Karagattam Troupe from Thanjavur, Tamil Nadu. We perform Karagattam, a folk dance with decorated pots balanced on the head, for colleges, temples and cultural events. We are eight artists and speak Tamil, Telugu and a little English. A 45-minute performance is ₹10,000 plus ₹1,000 for travel.';

/* Deterministic, rule-based extraction. Demo extraction—not live AI. */
function extract(text) {
  const t = String(text || '');
  const words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20 };
  const d = { name: '', form: '', region: '', groupSize: '', languages: [], fee: '', travel: '', summary: '' };
  const nm = t.match(/(?:[Ww]e are|[Tt]his is|[Ii] am)\s+(?:the\s+)?([A-Z][A-Za-z' -]+?)\s+from\s+([A-Za-z ]+?(?:,\s*[A-Za-z ]+?)?)\s*[.,;]/);
  let place = '';
  if (nm) { d.name = nm[1].trim(); place = nm[2].trim(); d.region = place.includes(',') ? place.split(',').pop().trim() : place; }
  const forms = ['Karagattam', 'Kajri', 'Bihu', 'Kalbelia', 'Lavani', 'Garba', 'Chhau', 'Bhangra', 'Yakshagana', 'Theyyam', 'Ghoomar', 'Kathputli'];
  d.form = forms.find((f) => new RegExp('\\b' + f + '\\b', 'i').test(t)) || '';
  const gs = t.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty)\s+(?:artists|members|performers|dancers|musicians)/i);
  if (gs) d.groupSize = String(words[gs[1].toLowerCase()] || gs[1]);
  d.languages = ['Tamil', 'Telugu', 'Hindi', 'Bhojpuri', 'Assamese', 'Rajasthani', 'Marathi', 'Bengali', 'Kannada', 'Malayalam', 'Punjabi', 'Gujarati', 'Odia', 'English']
    .filter((l) => new RegExp('\\b' + l + '\\b', 'i').test(t));
  const amt = '(?:₹|Rs\\.?|INR)\\s*([\\d,]+(?:\\.\\d{1,2})?)';
  const tr = t.match(new RegExp(amt + '\\s*(?:for|towards|as)?\\s*travel', 'i')) || t.match(new RegExp('travel[^₹\\d]*' + amt, 'i'));
  if (tr) d.travel = tr[1].replace(/,/g, '');
  for (const m of t.matchAll(new RegExp(amt, 'gi'))) {
    if (m[1].replace(/,/g, '') !== d.travel) { d.fee = m[1].replace(/,/g, ''); break; }
  }
  const dur = t.match(/(\d+)\s*-?\s*(?:minute|min)\b/i);
  d.summary = [d.form && `${d.form} performers`, place && `from ${place}`].filter(Boolean).join(' ') +
    (d.groupSize ? `. ${d.groupSize} artists` : '') + (d.languages.length ? `; ${d.languages.join(', ')}` : '') +
    (dur ? `. Typical set: ${dur[1]} minutes.` : '.');
  return d;
}

const cur = (r) => r.versions[r.versions.length - 1];
const profileOf = (S, r) => S.profiles.find((p) => p.id === r.profileId);
const totalOf = (r) => cur(r).perfPaise + cur(r).travelPaise;
const paidOf = (S, r) => S.payments.filter((p) => p.requestId === r.id).reduce((a, p) => a + p.amountPaise, 0);
const outstandingOf = (S, r) => totalOf(r) - paidOf(S, r);

function statusOf(r) {
  if (r.declined) return 'declined';
  const n = cur(r).n, a = r.approvals;
  if (a.organizer && a.organizer.version === n && a.artist && a.artist.version === n) return 'confirmed';
  return a.artist && a.artist.version === n ? 'awaiting_organizer' : 'awaiting_artist';
}
function flagsFor(S, r, v) {
  const p = profileOf(S, r), f = [];
  if (v.perfPaise < p.feePaise) f.push(`Performance fee ${inr(v.perfPaise)} is ${inr(p.feePaise - v.perfPaise)} below the artist's listed ${inr(p.feePaise)}.`);
  if (v.travelPaise < p.travelPaise) f.push(`Travel ${inr(v.travelPaise)} is ${inr(p.travelPaise - v.travelPaise)} below the artist's listed ${inr(p.travelPaise)}.`);
  if (r.groupSize > p.groupSize) f.push(`Requests ${r.groupSize} performers; this group has ${p.groupSize}.`);
  return f;
}
function addLog(S, r, role, text) { S.log.push({ id: uid('l'), requestId: r.id, at: nowIso(), role, text }); }
const fail = (error) => ({ ok: false, error });

function createRequest(S, i) {
  const p = S.profiles.find((x) => x.id === i.profileId);
  if (!p) return fail('Choose an artist group.');
  const org = String(i.org || '').trim(), event = String(i.event || '').trim();
  if (!org || !event) return fail('Enter the organizer and event name.');
  if (org.length > 80 || event.length > 80) return fail('Names must be 80 characters or fewer.');
  if (!EVENT_TYPES.includes(i.eventType)) return fail('Choose an event type.');
  const location = String(i.location || '').trim(), budget = toPaise(i.budget);
  if (!location || location.length > 80) return fail('Enter an event location (80 characters or fewer).');
  if (budget === null || budget <= 0) return fail('Enter a total event budget in rupees.');
  const description = String(i.description || '').trim();
  if (description.length > 500) return fail('Event description must be 500 characters or fewer.');
  const customRequest = String(i.customRequest || '').trim();
  if (customRequest.length > 500) return fail('Performance notes must be 500 characters or fewer.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(i.date || '') || i.date < dateStr(new Date())) return fail('Choose an event date that is today or later.');
  const dur = Number(i.durationMin), gs = Number(i.groupSize);
  if (!Number.isInteger(dur) || dur < 15 || dur > 240) return fail('Duration must be 15–240 minutes.');
  if (!Number.isInteger(gs) || gs < 1 || gs > 50) return fail('Group size must be 1–50 performers.');
  const perf = toPaise(i.perf), travel = toPaise(i.travel);
  if (perf === null || perf <= 0) return fail('Enter a performance fee in rupees (e.g. 8000).');
  if (travel === null) return fail('Enter travel in rupees (0 if none).');
  if (perf + travel > budget) return fail(`The selected artist's total ${inr(perf + travel)} exceeds the event budget ${inr(budget)}.`);
  const r = { id: uid('r'), profileId: p.id, org, event, eventType: i.eventType, location, description,
    artwork: eventArtworkFor({ eventType: i.eventType, event, description }), budgetPaise: budget, date: i.date, durationMin: dur, groupSize: gs, customRequest,
    versions: [{ n: 1, by: 'organizer', perfPaise: perf, travelPaise: travel, note: 'Initial request', at: nowIso() }],
    approvals: { organizer: { version: 1 }, artist: null }, declined: null, createdAt: nowIso() };
  S.requests.push(r);
  const fl = flagsFor(S, r, cur(r));
  addLog(S, r, 'organizer', `Request sent: ${inr(perf)} fee + ${inr(travel)} travel (v1).`);
  if (fl.length) addLog(S, r, 'system', `Flagged for artist review: ${fl.join(' ')} Nothing is confirmed.`);
  return { ok: true, request: r, flags: fl };
}

function proposeVersion(S, r, role, i) {
  if (!ROLES.includes(role)) return fail('Unknown role.');
  if (r.declined) return fail('This request was declined.');
  const perf = toPaise(i.perf), travel = toPaise(i.travel), c = cur(r);
  if (perf === null || perf <= 0) return fail('Enter a performance fee in rupees.');
  if (travel === null) return fail('Enter travel in rupees (0 if none).');
  if (perf === c.perfPaise && travel === c.travelPaise) return fail('Change the fee or travel to create a new version.');
  if (perf + travel < paidOf(S, r)) return fail(`New total cannot be below the ${inr(paidOf(S, r))} already recorded.`);
  const note = String(i.note || '').trim().slice(0, 200);
  const was = statusOf(r);
  const v = { n: c.n + 1, by: role, perfPaise: perf, travelPaise: travel, note: note || (was === 'confirmed' ? 'Changed terms' : 'Counteroffer'), at: nowIso() };
  r.versions.push(v);
  const fl = role === 'artist' ? flagsFor(S, r, v) : [];
  r.approvals = { organizer: null, artist: null };
  r.approvals[role] = { version: v.n, exception: fl.length > 0 };
  addLog(S, r, role, `${was === 'confirmed' ? 'Changed terms' : 'Counteroffer'} v${v.n}: ${inr(perf)} fee + ${inr(travel)} travel. Fresh approval needed from ${role === 'artist' ? 'organizer' : 'artist'}.`);
  return { ok: true, version: v };
}

function approve(S, r, role, o = {}) {
  if (!ROLES.includes(role)) return fail('Unknown role.');
  if (r.declined) return fail('This request was declined.');
  const c = cur(r);
  if (r.approvals[role] && r.approvals[role].version === c.n) return fail('You already approved this version.');
  const fl = role === 'artist' ? flagsFor(S, r, c) : [];
  if (fl.length && !o.exception) return fail('Tick the box to explicitly accept the flagged exception, or send a counteroffer.');
  r.approvals[role] = { version: c.n, exception: fl.length > 0 };
  addLog(S, r, role, `Approved v${c.n}${fl.length ? ' and explicitly accepted exception: ' + fl.join(' ') : ''}`);
  if (statusOf(r) === 'confirmed') addLog(S, r, 'system', `Booking confirmed — both roles approved v${c.n}.`);
  return { ok: true };
}
function decline(S, r, role, reason) {
  if (r.declined) return fail('Already declined.');
  r.declined = { by: role, at: nowIso(), reason: String(reason || '').slice(0, 200) };
  addLog(S, r, role, 'Declined the request.');
  return { ok: true };
}
function recordPayment(S, r, role, i) {
  if (role !== 'organizer') return fail('Only the organizer role can simulate a payment.');
  if (statusOf(r) !== 'confirmed') return fail('Payments open once both roles approve the current version.');
  if (!i.key) return fail('Missing payment key.');
  if (S.payments.some((p) => p.key === i.key)) return { ok: false, duplicate: true, error: 'That payment was already recorded.' };
  const amt = toPaise(i.amount);
  if (amt === null || amt <= 0) return fail('Enter an amount in rupees.');
  if (amt > outstandingOf(S, r)) return fail(`Amount exceeds the outstanding ${inr(outstandingOf(S, r))}.`);
  S.payments.push({ id: uid('pay'), key: i.key, requestId: r.id, amountPaise: amt, note: String(i.note || '').trim().slice(0, 60), at: nowIso() });
  addLog(S, r, 'organizer', `Simulated payment ${inr(amt)} recorded. Outstanding ${inr(outstandingOf(S, r))}.`);
  return { ok: true };
}
function publishProfile(S, d) {
  const fee = toPaise(d.fee), travel = toPaise(d.travel), gs = Number(d.groupSize);
  if (!String(d.name || '').trim() || !String(d.form || '').trim()) return fail('Name and art form are required.');
  if (!String(d.region || '').trim()) return fail('Region is required.');
  if (fee === null || fee <= 0) return fail('Enter a listed performance fee in rupees.');
  if (travel === null) return fail('Enter listed travel in rupees (0 if none).');
  if (!Number.isInteger(gs) || gs < 1 || gs > 50) return fail('Group size must be 1–50.');
  const p = S.profiles[0];
  Object.assign(p, { name: d.name.trim().slice(0, 80), form: d.form.trim().slice(0, 40), region: d.region.trim().slice(0, 40),
    place: p.place, groupSize: gs, feePaise: fee, travelPaise: travel,
    languages: String(d.languages || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 8),
    skills: String(d.skills || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 12),
    media: d.media === undefined ? (p.media || []) : String(d.media || '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 12),
    summary: String(d.summary || '').trim().slice(0, 240) });
  return { ok: true };
}
function rankProfiles(S, event) {
  const budget = toPaise(event.budget);
  const location = String(event.location || '').trim().toLowerCase();
  return S.profiles.map((p) => {
    const total = p.feePaise + p.travelPaise;
    const withinBudget = budget !== null && total <= budget;
    const eventMatch = (p.eventTypes || []).includes(event.eventType);
    const localMatch = location && [p.place, p.region].some((place) => location.includes(place.toLowerCase()) || place.toLowerCase().includes(location));
    const groupFit = Number(event.groupSize || 0) <= p.groupSize;
    const score = (withinBudget ? 40 : 0) + (eventMatch ? 30 : 0) + (localMatch ? 15 : 5) + (groupFit ? 15 : 0);
    const reasons = [withinBudget ? 'Budget fit' : 'Over budget', eventMatch ? 'Event fit' : 'Different specialty',
      localMatch ? 'Nearby' : 'Travel needed', groupFit ? 'Capacity fits' : 'Capacity short'];
    return { profile: p, score, withinBudget, reasons };
  }).sort((a, b) => Number(b.withinBudget) - Number(a.withinBudget) || b.score - a.score || a.profile.name.localeCompare(b.profile.name));
}
function nextStep(S, role) {
  const r = S.requests.find((x) => x.id === S.sel) || S.requests[S.requests.length - 1];
  if (!r) return role === 'organizer'
    ? 'Open “Event & matches” to add event details, compare ranked artists, and send a booking request.'
    : 'Complete your group profile in “Artist registration” so organizers can find you in ranked matches.';
  const st = statusOf(r);
  if (st === 'declined') return 'This request was declined. Start a new one from “Event & matches”.';
  if (st === 'awaiting_artist') return role === 'artist' ? 'Review the request in “Requests”: accept the exception explicitly, counter, or decline.' : 'Waiting for artist review — nothing is confirmed. Return to Home, choose Artist, then open “Requests”.';
  if (st === 'awaiting_organizer') return role === 'organizer' ? 'The artist sent new terms. Approve the current version (or counter) in “Requests”.' : 'Waiting for the organizer to approve. Return to Home and choose Organizer.';
  const o = outstandingOf(S, r);
  if (o > 0) return role === 'organizer' ? `Booking confirmed. Next: simulate a payment in “Bookings” — ${inr(o)} outstanding.` : `Booking confirmed. ${inr(o)} outstanding; switch to Organizer to simulate payments.`;
  return 'Fully paid (simulated). Nothing outstanding.';
}

/* ================= UI ================= */
if (typeof document !== 'undefined') {
  let S, persist = true;
  const ui = { reqProfile: 'p1', accessRole: 'organizer', accountMode: 'login', mediaNames: [], history: [], visitor: false, eventDetail: null, bookingDraft: null, confirmationRequestId: null, f: { region: '', form: '', fee: '', size: '', query: '' } };
  const $ = (id) => document.getElementById(id);

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.v === 1 && Array.isArray(s.profiles) && Array.isArray(s.requests)) {
        s.authenticated = false;
        s.view = 'access';
        delete s.demoActive;
        if (!Array.isArray(s.wishlist)) s.wishlist = [];
        return s;
      }
    } catch (e) { /* fall through */ }
    return seed();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { persist = false; } }

  function h(tag, props, ...kids) {           // safe DOM builder: user text only ever becomes text nodes
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (['value', 'checked', 'disabled'].includes(k)) e[k] = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    kids.flat(Infinity).forEach((c) => { if (c != null && c !== false) e.append(c); });
    return e;
  }
  function svg(str) { const t = document.createElement('template'); t.innerHTML = str.trim(); return t.content.firstChild; } // own constants only
  function art(pal) {
    const C = [['#A65F43', '#AF9058', '#F5EBDD'], ['#34483D', '#AF9058', '#F5EBDD'], ['#30251F', '#A65F43', '#AF9058'], ['#AF9058', '#34483D', '#30251F']][pal % 4];
    let petals = '';
    for (let i = 0; i < 12; i++) petals += `<ellipse cx="100" cy="34" rx="7" ry="20" fill="${C[1]}" opacity="${i % 2 ? .95 : .6}" transform="rotate(${i * 30} 100 66)"/>`;
    return svg(`<svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Decorative folk motif"><rect width="200" height="120" fill="${C[0]}"/>
      <path d="M0 120V96q25-14 50 0t50 0 50 0 50 0v24z" fill="${C[2]}" opacity=".25"/>${petals}
      <circle cx="100" cy="66" r="19" fill="${C[2]}"/><circle cx="100" cy="66" r="11" fill="${C[0]}"/><circle cx="100" cy="66" r="4" fill="${C[1]}"/>
      <path d="M12 108h176M24 108V98a9 9 0 0 1 18 0v10M158 108V98a9 9 0 0 1 18 0v10" fill="none" stroke="${C[2]}" stroke-width="2" opacity=".7"/></svg>`);
  }

  const fmt = (iso) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  const fmtDate = (d) => new Date(d + 'T00:00').toLocaleDateString('en-IN', { dateStyle: 'medium' });
  const label = (r) => statusOf(r) === 'confirmed' && outstandingOf(S, r) === 0 ? 'Completed' : ({ confirmed: 'Confirmed', awaiting_artist: 'Awaiting artist', awaiting_organizer: 'Awaiting organizer', declined: 'Declined' }[statusOf(r)]);
  const badge = (r) => h('span', { class: 'badge ' + statusOf(r) }, label(r));
  const roleName = (x) => ({ organizer: 'Organizer', artist: 'Artist', tourist: 'Tourist', system: 'System' }[x]);

  const protectedViews = new Set(['home', 'discover', 'tourist', 'event-detail', 'checkout', 'booking-confirmation', 'wishlist', 'studio', 'request', 'inbox', 'booking']);

  let tt;
  function toast(msg, bad) {
    const t = $('toast'); t.textContent = msg; t.className = 'show' + (bad ? ' bad' : '');
    clearTimeout(tt); tt = setTimeout(() => { t.className = ''; }, 3800);
  }
  const go = (view) => {
    if (!S.authenticated && view !== 'access') {
      ui.history = [];
      S.view = 'access';
      save();
      render();
      window.scrollTo(0, 0);
      return;
    }
    if (S.view !== view) {
      ui.history.push(S.view);
      if (ui.history.length > 24) ui.history.shift();
    }
    S.view = view; save(); render(); window.scrollTo(0, 0);
  };
  function goBack() {
    const previous = ui.history.pop();
    if (!previous) return;
    S.view = previous; save(); render(); window.scrollTo(0, 0);
  }
  function done(res, okMsg) { if (!res.ok) { toast(res.error, true); return false; } save(); toast(okMsg); render(); return true; }

  function money(val, id) { return h('input', { type: 'text', inputmode: 'decimal', value: val == null ? '' : String(val / 100), 'aria-label': id, autocomplete: 'off' }); }
  function field(text, el, hint, wide) { return h('label', { class: wide ? 'wide' : '' }, text, el, hint && h('small', {}, hint)); }
  function gate(role, title) {
    return h('div', { class: 'empty' }, h('h2', {}, title), h('p', {}, `This screen is used by the ${roleName(role)} role. Demo switching only — it is not authentication.`),
      h('button', { class: 'btn', type: 'button', onclick: () => go('home') }, 'Go to Home to switch demo role'));
  }

  function home() {
    const joinAsArtist = () => { ui.accessRole = 'artist'; ui.accountMode = 'signup'; go('access'); };
    const joinAsTourist = () => { ui.accessRole = 'tourist'; ui.accountMode = 'signup'; go('access'); };
    const homeImages = [
      { src: 'images/home-performance.png', alt: 'A Kathakali performer in costume on stage', label: 'Performance' },
      { src: 'images/home-celebration.png', alt: 'Traditional stone sculptures dressed for a celebration', label: 'Celebration' },
      { src: 'images/home-community.png', alt: 'A colorful temple tower at sunset', label: 'Community' },
    ];
    return h('section', { class: 'home' },
      h('section', { class: 'home-hero' },
        h('div', { class: 'home-copy' }, h('p', { class: 'eyebrow' }, 'A stage for living traditions'),
          h('h2', { class: 'home-title' }, 'Folk art belongs on every stage.'),
          h('p', { class: 'home-intro' }, 'Discover folk performers, share a profile rooted in your practice, and agree on booking terms directly.'),
          h('div', { class: 'row home-actions' },
            h('button', { class: 'btn', type: 'button', onclick: () => go('access') }, 'Find artists'),
            h('button', { class: 'btn ghost', type: 'button', onclick: joinAsArtist }, 'Join as an artist'),
            h('button', { class: 'btn ghost', type: 'button', onclick: joinAsTourist }, 'Tourist')),
          h('p', { class: 'muted home-note' }, 'Four fictional artist groups · Booking and payments are simulated.')),
        h('div', { class: 'home-artwork' }, homeImages.map((image, index) => h('figure', { class: 'home-art ' + (index === 0 ? 'home-art-main' : '') },
          h('img', { src: image.src, alt: image.alt, loading: index === 0 ? 'eager' : 'lazy' }),
          h('figcaption', {}, h('b', {}, image.label)))))),
      h('section', { class: 'home-steps' }, h('h2', {}, 'A clear path from discovery to performance'),
        h('div', { class: 'home-step-grid' },
          h('article', {}, h('span', { class: 'home-step-number' }, '01'), h('h3', {}, 'Describe your event'), h('p', {}, 'Set a date, location and budget to find suitable groups.')),
          h('article', {}, h('span', { class: 'home-step-number' }, '02'), h('h3', {}, 'Agree on the terms'), h('p', {}, 'Artists can accept, counter or decline each request.')),
          h('article', {}, h('span', { class: 'home-step-number' }, '03'), h('h3', {}, 'Track the booking'), h('p', {}, 'Follow approvals and simulated payments in one workspace.')))));
  }

  function access() {
    const mode = (value) => h('button', { type: 'button', class: 'btn ghost', 'aria-pressed': String(ui.accountMode === value), onclick: () => { ui.accountMode = value; render(); } }, value === 'login' ? 'Log in' : 'Sign up');
    const role = (value) => h('button', { type: 'button', class: 'role-choice', 'aria-pressed': String(ui.accessRole === value), onclick: () => { ui.accessRole = value; render(); } },
      h('b', {}, roleName(value)), h('span', {}, value === 'artist' ? 'Register your art and performance profile' : value === 'organizer' ? 'Plan an event and find performers' : 'Explore events and artist offerings'));
    return h('section', { class: 'access' }, h('p', { class: 'eyebrow' }, 'A fairer stage for folk artists'), h('h2', {}, 'Login / Sign up'),
      h('p', { class: 'muted' }, 'Choose a demo role to enter KalaSetu. This prototype does not create accounts or collect credentials.'),
      h('div', { class: 'row mode-switch', role: 'group', 'aria-label': 'Account action' }, mode('login'), mode('signup')),
      h('div', { class: 'role-choices', role: 'group', 'aria-label': 'Choose your role' }, role('artist'), role('organizer'), role('tourist')),
      h('button', { class: 'btn', type: 'button', onclick: () => {
        ui.visitor = false;
        S.role = ui.accessRole;
        S.authenticated = true;
        ui.history = [];
        const destination = S.role === 'artist' ? 'studio' : S.role === 'tourist' ? 'tourist' : 'request';
        go(destination);
      } }, `${ui.accountMode === 'login' ? 'Log in' : 'Sign up'} as ${roleName(ui.accessRole)}`),
      h('p', { class: 'muted' }, 'Demo access only · No password, real account, or authentication service.'));
  }

  function toggleWishlist(profileId) {
    const saved = S.wishlist.includes(profileId);
    S.wishlist = saved ? S.wishlist.filter((id) => id !== profileId) : [...S.wishlist, profileId];
    save(); toast(saved ? 'Removed from wishlist.' : 'Added to wishlist.'); render();
  }
  function artistCard(p) {
    const saved = S.wishlist.includes(p.id);
    return h('article', { class: 'card art' }, art(p.pal),
      h('div', { class: 'body' }, h('div', { class: 'artist-card-heading' }, h('span', { class: 'tag' }, 'Fictional demo profile'),
        h('button', { class: 'wishlist-toggle', type: 'button', 'aria-label': saved ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`,
          'aria-pressed': String(saved), title: saved ? 'Remove from wishlist' : 'Add to wishlist', onclick: () => toggleWishlist(p.id) }, saved ? '♥' : '♡')),
        h('h3', {}, p.name), h('div', { class: 'muted' }, `${p.form} · ${p.place}, ${p.region}`), h('p', { style: 'margin:0' }, p.summary),
        h('div', { class: 'chips' }, [...p.languages, ...(p.skills || [])].map((l) => h('span', { class: 'chip' }, l))),
        (p.media || []).length > 0 && h('p', { class: 'muted media-note' }, `${p.media.length} portfolio file name${p.media.length === 1 ? '' : 's'} on profile`),
        h('div', { class: 'stats' }, h('span', {}, h('b', {}, inr(p.feePaise)), 'listed fee'), h('span', {}, h('b', {}, inr(p.travelPaise)), 'travel'), h('span', {}, h('b', {}, p.groupSize), 'artists')),
        h('button', { class: 'btn', type: 'button', onclick: () => {
          ui.reqProfile = p.id;
          if (ui.visitor || S.role !== 'organizer') {
            ui.accessRole = 'organizer';
            go('access');
            return;
          }
          go('request');
        } }, ui.visitor ? 'Continue to booking demo' : 'Request booking')));
  }

  /* ---- 1. Discover ---- */
  function discover() {
    const f = ui.f, uniq = (k) => [...new Set(S.profiles.map((p) => p[k]))].sort();
    const sel = (key, name, opts) => field(name, h('select', { onchange: (e) => { f[key] = e.target.value; render(); } },
      h('option', { value: '' }, 'Any'), opts.map(([v, t]) => h('option', { value: v, selected: String(f[key]) === String(v) }, t))));
    const search = h('input', { type: 'search', value: f.query, placeholder: 'Name, art form, place or skill', 'aria-label': 'Search artists' });
    const count = h('span', {}), results = h('div', { class: 'grid' });
    const filtered = () => {
      const query = f.query.trim().toLowerCase();
      return S.profiles.filter((p) => (!f.region || p.region === f.region) && (!f.form || p.form === f.form) &&
        (!f.fee || p.feePaise <= Number(f.fee) * 100) && (!f.size || p.groupSize >= Number(f.size)) &&
        (!query || [p.name, p.form, p.place, p.region, p.summary, ...(p.languages || []), ...(p.skills || [])].join(' ').toLowerCase().includes(query)));
    };
    const updateResults = () => {
      const list = filtered();
      count.textContent = `${list.length} of ${S.profiles.length} groups shown`;
      results.replaceChildren(...(list.length ? list.map(artistCard) : [h('div', { class: 'empty' }, h('h3', {}, 'No groups match these filters'), h('p', {}, 'Try a different search or widen your filters.'))]));
    };
    search.addEventListener('input', () => { f.query = search.value; updateResults(); });
    const clear = () => { ui.f = { region: '', form: '', fee: '', size: '', query: '' }; render(); };
    updateResults();
    return h('section', {}, h('div', { class: 'directory-heading' }, h('div', {}, h('h2', {}, ui.visitor ? 'Explore folk art' : 'Discover folk groups'), h('p', { class: 'muted' }, ui.visitor ? 'Browse fictional artist profiles, search by tradition, and save groups to your wishlist.' : 'Explore fictional artist profiles, compare listed fees, and save groups for later.')),
        h('a', { class: 'directory-wishlist', href: '#wishlist', onclick: (event) => { event.preventDefault(); go('wishlist'); } }, `Wishlist (${S.wishlist.length})`)),
      h('div', { class: 'filters' }, field('Search artists', search),
        sel('region', 'Region', uniq('region').map((x) => [x, x])), sel('form', 'Art form', uniq('form').map((x) => [x, x])),
        sel('fee', 'Max performance fee', [[10000, 'Up to ₹10,000'], [15000, 'Up to ₹15,000'], [20000, 'Up to ₹20,000']]),
        sel('size', 'Group size at least', [[6, '6+'], [8, '8+'], [10, '10+']]),
        h('button', { class: 'btn ghost', type: 'button', onclick: clear }, 'Clear filters')),
      h('p', { class: 'muted result-count' }, count), results);
  }

  function tourist() {
    const q = ui.f.touristQuery || '';
    const search = h('input', { type: 'search', value: q, placeholder: 'Search events, traditions, or locations', 'aria-label': 'Search public events and artists' });
    const query = () => search.value.trim().toLowerCase();
    const eventRows = () => [...S.requests].reverse().filter((r) =>
      [r.event, r.eventType, r.location, r.org, r.description, profileOf(S, r).name].filter(Boolean).join(' ').toLowerCase().includes(query()));
    const offerRows = () => S.profiles.flatMap((p) => (p.eventTypes || []).map((type) => ({ profile: p, type })))
      .filter(({ profile, type }) => [profile.name, profile.form, profile.place, profile.region, profile.summary, type].join(' ').toLowerCase().includes(query()));
    const eventList = h('div', { class: 'grid tourist-grid' }), offerList = h('div', { class: 'grid tourist-grid' });
    const eventCount = h('p', { class: 'muted result-count' }), offerCount = h('p', { class: 'muted result-count' });
    const update = () => {
      const events = eventRows(), offers = offerRows();
      eventCount.textContent = `${events.length} organizer event${events.length === 1 ? '' : 's'}`;
      offerCount.textContent = `${offers.length} artist offering${offers.length === 1 ? '' : 's'}`;
      eventList.replaceChildren(...(events.length ? events.map((r) => {
        const artwork = EVENT_ARTWORK[r.artwork] || EVENT_ARTWORK[eventArtworkFor(r)];
        const open = () => { ui.eventDetail = { kind: 'event', id: r.id }; go('event-detail'); };
        return h('article', { class: 'card tourist-event', role: 'link', tabindex: '0', 'aria-label': `View details for ${r.event}`, onclick: open,
          onkeydown: (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } } }, h('img', { src: artwork.src, alt: artwork.alt, loading: 'lazy' }),
          h('div', { class: 'tourist-event-body' }, h('span', { class: 'tag' }, `Organizer event · ${r.eventType || 'Cultural event'}`),
            h('h3', {}, r.event), h('p', { class: 'muted' }, `${r.location} · ${fmtDate(r.date)} · Hosted by ${r.org}`),
            r.description && h('p', {}, r.description),
            h('p', { class: 'muted' }, `Artist group: ${profileOf(S, r).name}`),
            h('span', { class: 'tourist-event-link', 'aria-hidden': 'true' }, 'View full event details →')));
      }) : [h('div', { class: 'empty' }, h('h3', {}, 'No organizer events listed yet'), h('p', {}, 'Organizer events will appear here after a demo booking request is sent.'))]));
      offerList.replaceChildren(...(offers.length ? offers.map(({ profile, type }) => {
        const artwork = EVENT_ARTWORK[eventArtworkFor({ eventType: type, event: profile.form, description: profile.summary })];
        const open = () => { ui.eventDetail = { kind: 'offering', profileId: profile.id, type }; go('event-detail'); };
        return h('article', { class: 'card tourist-event', role: 'link', tabindex: '0', 'aria-label': `View ${type} offering from ${profile.name}`, onclick: open,
          onkeydown: (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } } }, h('img', { src: artwork.src, alt: artwork.alt, loading: 'lazy' }),
          h('div', { class: 'tourist-event-body' }, h('span', { class: 'tag' }, `Artist offering · ${type}`),
            h('h3', {}, profile.name), h('p', { class: 'muted' }, `${profile.place}, ${profile.region} · ${profile.groupSize} artists`),
            h('p', {}, profile.summary),
            h('p', { class: 'muted' }, `Listed from ${inr(profile.feePaise + profile.travelPaise)} including travel`),
            h('span', { class: 'tourist-event-link', 'aria-hidden': 'true' }, 'View full offering details →')));
      }) : [h('div', { class: 'empty' }, h('h3', {}, 'No artist offerings match'), h('p', {}, 'Try a different search term.'))]));
    };
    search.addEventListener('input', () => { ui.f.touristQuery = search.value; update(); });
    update();
    return h('section', { class: 'tourist-page' },
      h('div', { class: 'directory-heading' }, h('div', {}, h('p', { class: 'eyebrow' }, 'Visitor view'), h('h2', {}, 'Events & artist offerings'),
        h('p', { class: 'muted' }, 'Explore public event details shared in the demo and occasions artists are available for.')),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => go('home') }, 'Home')),
      field('Search events, traditions, or locations', search),
      h('section', { class: 'tourist-section' }, h('div', { class: 'tourist-section-heading' }, h('h3', {}, 'Organizer events'), eventCount), eventList),
      h('section', { class: 'tourist-section' }, h('div', { class: 'tourist-section-heading' }, h('h3', {}, 'Artist event offerings'), offerCount), offerList));
  }

  function eventDetail() {
    const detail = ui.eventDetail;
    const back = h('button', { class: 'btn ghost', type: 'button', onclick: () => goBack() }, 'Back to Events & offerings');
    if (!detail) return h('section', { class: 'event-detail' }, back, h('div', { class: 'empty' }, h('h2', {}, 'Event details unavailable'), h('p', {}, 'Return to Events & offerings and choose an event.')));

    if (detail.kind === 'event') {
      const r = S.requests.find((item) => item.id === detail.id);
      if (!r) return h('section', { class: 'event-detail' }, back, h('div', { class: 'empty' }, h('h2', {}, 'Event details unavailable'), h('p', {}, 'This event may have been removed. Return to the listing to choose another event.')));
      const p = profileOf(S, r), c = cur(r), artwork = EVENT_ARTWORK[r.artwork] || EVENT_ARTWORK[eventArtworkFor(r)];
      if (!p) return h('section', { class: 'event-detail' }, back, h('div', { class: 'empty' }, h('h2', {}, 'Artist details unavailable'), h('p', {}, 'The artist profile for this event could not be found.')));
      return h('section', { class: 'event-detail' }, back,
        h('article', { class: 'event-detail-card' },
          h('img', { class: 'event-detail-image', src: artwork.src, alt: artwork.alt }),
          h('div', { class: 'event-detail-content' },
            h('p', { class: 'eyebrow' }, `Organizer event · ${r.eventType || 'Cultural event'}`),
            h('h2', {}, r.event), h('p', { class: 'muted' }, `Hosted by ${r.org}`),
            r.description && h('p', { class: 'event-detail-description' }, r.description),
            h('div', { class: 'event-detail-grid' },
              detailItem('Date', fmtDate(r.date)), detailItem('Location', r.location),
              detailItem('Performance duration', `${r.durationMin} minutes`), detailItem('Performers requested', r.groupSize),
              detailItem('Event budget', inr(r.budgetPaise)), detailItem('Booking status', label(r))),
            r.customRequest && h('div', { class: 'custom-note' }, h('b', {}, 'Performance request: '), r.customRequest),
            h('section', { class: 'event-detail-subsection' }, h('h3', {}, 'Artist group'),
              h('p', {}, h('b', {}, p.name), ` · ${p.form} · ${p.place}, ${p.region}`),
              h('p', { class: 'muted' }, p.summary),
              p.languages && p.languages.length ? h('p', {}, h('b', {}, 'Languages: '), p.languages.join(', ')) : null),
            h('section', { class: 'event-detail-subsection' }, h('h3', {}, 'Current offer'),
              h('p', {}, `${inr(c.perfPaise)} performance fee + ${inr(c.travelPaise)} travel = ${inr(c.perfPaise + c.travelPaise)}`),
              c.note && h('p', { class: 'muted' }, c.note)),
            h('button', { class: 'btn', type: 'button', onclick: () => startBooking(r.profileId, r.eventType || 'Cultural festival', r) }, 'Book artist demo'))));
    }

    if (detail.kind === 'offering') {
      const p = S.profiles.find((profile) => profile.id === detail.profileId);
      if (!p || !(p.eventTypes || []).includes(detail.type)) return h('section', { class: 'event-detail' }, back, h('div', { class: 'empty' }, h('h2', {}, 'Offering details unavailable'), h('p', {}, 'This artist offering may have changed. Return to the listing to choose another offering.')));
      const artwork = EVENT_ARTWORK[eventArtworkFor({ eventType: detail.type, event: p.form, description: p.summary })];
      return h('section', { class: 'event-detail' }, back,
        h('article', { class: 'event-detail-card' },
          h('img', { class: 'event-detail-image', src: artwork.src, alt: artwork.alt }),
          h('div', { class: 'event-detail-content' },
            h('p', { class: 'eyebrow' }, `Artist event offering · ${detail.type}`),
            h('h2', {}, p.name), h('p', { class: 'muted' }, `${p.form} · ${p.place}, ${p.region}`),
            h('p', { class: 'event-detail-description' }, p.summary),
            h('div', { class: 'event-detail-grid' },
              detailItem('Group size', `${p.groupSize} artists`),
              detailItem('Languages', p.languages && p.languages.length ? p.languages.join(', ') : 'Not specified'),
              detailItem('Performance fee', inr(p.feePaise)),
              detailItem('Travel fee', inr(p.travelPaise)),
              detailItem('Total including travel', inr(p.feePaise + p.travelPaise)),
              detailItem('Available for', (p.eventTypes || []).join(', '))),
            p.skills && p.skills.length ? h('section', { class: 'event-detail-subsection' }, h('h3', {}, 'Skills and specialties'),
              h('div', { class: 'chips' }, p.skills.map((skill) => h('span', { class: 'chip' }, skill)))) : null,
            h('div', { class: 'row' },
              h('button', { class: 'btn', type: 'button', onclick: () => startBooking(p.id, detail.type) }, 'Book artist demo'),
              h('button', { class: 'btn ghost', type: 'button', style: 'color:var(--espresso)', onclick: () => { ui.visitor = true; ui.f.query = p.form; go('discover'); } }, 'View artist profile')))));
    }

    return h('section', { class: 'event-detail' }, back, h('div', { class: 'empty' }, h('h2', {}, 'Event details unavailable'), h('p', {}, 'Return to Events & offerings and choose an event.')));
  }

  function detailItem(name, value) {
    return h('div', { class: 'event-detail-item' }, h('span', { class: 'muted' }, name), h('b', {}, String(value)));
  }

  function startBooking(profileId, eventType, event = null) {
    const profile = S.profiles.find((item) => item.id === profileId);
    if (!profile) { toast('This artist profile is no longer available.', true); return; }
    const today = dateStr(new Date());
    ui.reqProfile = profileId;
    ui.bookingDraft = {
      profileId,
      eventType,
      event: event && event.event || `${eventType} performance`,
      org: event && event.org || 'Demo Organizer',
      location: event && event.location || [profile.place, profile.region].filter(Boolean).join(', '),
      date: event && event.date >= today ? event.date : plusDays(30),
      description: event && event.description || '',
      customRequest: event && event.customRequest || '',
    };
    go('checkout');
  }

  function checkout() {
    const draft = ui.bookingDraft, profile = draft && S.profiles.find((item) => item.id === draft.profileId);
    if (!draft || !profile || !(profile.eventTypes || []).includes(draft.eventType)) {
      return h('section', { class: 'event-detail' }, h('div', { class: 'empty' },
        h('h2', {}, 'Booking details unavailable'), h('p', {}, 'Return to the artist listing and choose an available artist offering.'),
        h('button', { class: 'btn', type: 'button', onclick: () => go('tourist') }, 'Back to Events & offerings')));
    }

    const eventName = h('input', { value: draft.event, maxlength: 80, required: true });
    const organizer = h('input', { value: draft.org, maxlength: 80, required: true });
    const location = h('input', { value: draft.location, maxlength: 80, required: true });
    const date = h('input', { type: 'date', value: draft.date, min: dateStr(new Date()), required: true });
    const description = h('textarea', { value: draft.description, maxlength: 500, placeholder: 'Add any details about the occasion.' });
    const customRequest = h('textarea', { value: draft.customRequest, maxlength: 500, placeholder: 'Optional performance or staging requests.' });
    const error = h('p', { class: 'err', role: 'alert' });
    const totalPaise = profile.feePaise + profile.travelPaise;
    const pay = h('button', { class: 'btn', type: 'button', onclick: () => {
      error.textContent = '';
      const request = createRequest(S, {
        profileId: profile.id, org: organizer.value, event: eventName.value, eventType: draft.eventType,
        location: location.value, date: date.value, description: description.value, customRequest: customRequest.value,
        budget: String(totalPaise / 100), durationMin: 45, groupSize: profile.groupSize,
        perf: String(profile.feePaise / 100), travel: String(profile.travelPaise / 100),
      });
      if (!request.ok) { error.textContent = request.error; return; }

      const approved = approve(S, request.request, 'artist');
      if (!approved.ok) { error.textContent = approved.error; return; }
      const payment = recordPayment(S, request.request, 'organizer', {
        amount: String(totalPaise / 100), note: 'Demo booking payment', key: uid('pay'),
      });
      if (!payment.ok) { error.textContent = payment.error; return; }

      S.sel = request.request.id;
      ui.confirmationRequestId = request.request.id;
      ui.bookingDraft = null;
      go('booking-confirmation');
    } }, `Pay ${inr(totalPaise)} and confirm booking`);

    return h('section', { class: 'checkout-page' },
      h('p', { class: 'eyebrow' }, 'Demo checkout · No real payment is collected'),
      h('h2', {}, 'Complete your booking'),
      h('p', { class: 'muted' }, 'Confirm the occasion details, then make the simulated payment to confirm this booking.'),
      h('div', { class: 'checkout-layout' },
        h('div', { class: 'card' }, h('h3', {}, 'Occasion details'),
          h('div', { class: 'form' },
            field('Organizer name', organizer), field('Occasion', eventName),
            field('Event type', h('input', { value: draft.eventType, disabled: true })),
            field('Location', location), field('Date', date),
            field('Event description', description, null, true),
            field('Performance requests (optional)', customRequest, null, true))),
        h('aside', { class: 'card checkout-summary' }, h('h3', {}, 'Booking summary'),
          h('p', {}, h('b', {}, profile.name)),
          h('p', { class: 'muted' }, `${profile.form} · ${profile.place}, ${profile.region}`),
          h('div', { class: 'checkout-price-row' }, h('span', {}, 'Performance fee'), h('b', {}, inr(profile.feePaise))),
          h('div', { class: 'checkout-price-row' }, h('span', {}, 'Travel'), h('b', {}, inr(profile.travelPaise))),
          h('div', { class: 'checkout-price-row checkout-total' }, h('span', {}, 'Total due now'), h('b', {}, inr(totalPaise))),
          h('p', { class: 'muted checkout-note' }, 'This demo confirms instantly after simulated payment at the listed fee. It does not collect card details, charge real money, or contact the artist.'),
          error, pay,
          h('button', { class: 'btn ghost checkout-back', type: 'button', onclick: () => goBack() }, 'Back to event details'))));
  }

  function bookingConfirmation() {
    const id = ui.confirmationRequestId || S.sel;
    const request = S.requests.find((item) => item.id === id);
    if (!request || statusOf(request) !== 'confirmed' || outstandingOf(S, request) > 0) {
      return h('section', { class: 'event-detail' }, h('div', { class: 'empty' },
        h('h2', {}, 'Booking confirmation unavailable'),
        h('p', {}, 'The booking has not been fully confirmed and paid. Return to the artist listing to try again.'),
        h('button', { class: 'btn', type: 'button', onclick: () => go('tourist') }, 'Back to Events & offerings')));
    }
    const profile = profileOf(S, request);
    const totalPaid = S.payments.filter((payment) => payment.requestId === request.id).reduce((sum, payment) => sum + payment.amountPaise, 0);
    return h('section', { class: 'confirmation-page' },
      h('div', { class: 'confirmation-mark', 'aria-hidden': 'true' }, '✓'),
      h('p', { class: 'eyebrow' }, 'Payment successful · Demo only'),
      h('h2', {}, 'Booking confirmed!'),
      h('p', { class: 'confirmation-message' }, `Your ${request.eventType.toLowerCase()} booking for “${request.event}” with ${profile.name} is confirmed. We look forward to seeing this performance come to life!`),
      h('div', { class: 'card confirmation-details' },
        h('div', { class: 'event-detail-grid' },
          detailItem('Booking reference', request.id.slice(-8).toUpperCase()),
          detailItem('Artist', profile.name),
          detailItem('Occasion', request.event),
          detailItem('Date', fmtDate(request.date)),
          detailItem('Location', request.location),
          detailItem('Amount paid', inr(totalPaid))),
        h('p', { class: 'muted' }, 'This confirmation is for the KalaSetu demo. No real payment was processed and the artist was not contacted.')),
      h('div', { class: 'row confirmation-actions' },
        h('button', { class: 'btn', type: 'button', onclick: () => go('tourist') }, 'Browse more artists'),
        h('button', { class: 'btn ghost', type: 'button', style: 'color:var(--espresso)', onclick: () => go('booking') }, 'View booking details')));
  }

  function wishlist() {
    const saved = S.profiles.filter((p) => S.wishlist.includes(p.id));
    return h('section', {}, h('div', { class: 'directory-heading' }, h('div', {}, h('h2', {}, 'Your wishlist'), h('p', { class: 'muted' }, 'Saved artist groups stay in this browser demo.')),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => go('discover') }, 'Browse artists')),
      saved.length ? h('div', { class: 'grid' }, saved.map(artistCard))
        : h('div', { class: 'empty' }, h('h3', {}, 'No saved groups yet'), h('p', {}, 'Save an artist group from the directory to keep it here.'),
          h('button', { class: 'btn', type: 'button', onclick: () => go('discover') }, 'Explore artist groups')));
  }

  /* ---- 2. Profile studio ---- */
  function studio() {
    if (S.role !== 'artist') return gate('artist', 'Profile studio');
    const mine = S.profiles[0], d = S.studio.draft || { name: mine.name, form: mine.form, region: mine.region, groupSize: mine.groupSize,
      languages: mine.languages, skills: mine.skills || [], fee: mine.feePaise / 100, travel: mine.travelPaise / 100, summary: mine.summary };
    const intro = h('textarea', { maxlength: 1200, placeholder: 'Introduce your group in your own words…', 'aria-label': 'Introduction' }); intro.value = S.studio.intro;
    const err = h('p', { class: 'err', role: 'alert' });
    const gen = () => {
      S.studio.intro = intro.value;
      if (!intro.value.trim()) { err.textContent = 'Type an introduction first, or use the sample.'; return; }
      S.studio.draft = extract(intro.value); save(); toast('Draft generated (demo extraction). Review every field, then approve.'); render();
    };
    const F = {
      name: h('input', { value: d.name, maxlength: 80 }), form: h('input', { value: d.form, maxlength: 40 }), region: h('input', { value: d.region, maxlength: 40 }),
      groupSize: h('input', { type: 'number', min: 1, max: 50, value: d.groupSize }), languages: h('input', { value: (d.languages || []).join(', ') }),
      skills: h('input', { value: (d.skills || mine.skills || []).join(', '), placeholder: 'e.g. live folk music, stage performance' }),
      fee: h('input', { inputmode: 'decimal', value: d.fee }), travel: h('input', { inputmode: 'decimal', value: d.travel }),
      summary: h('textarea', { maxlength: 240, style: 'min-height:70px' }),
    };
    F.summary.value = d.summary || '';
    const media = h('input', { type: 'file', accept: 'image/*,video/*', multiple: true, 'aria-label': 'Choose photos or videos' });
    const mediaList = h('p', { class: 'muted' }, (mine.media || []).length ? `Selected profile media: ${mine.media.join(', ')}` : 'No media selected.');
    media.addEventListener('change', () => {
      ui.mediaNames = [...media.files].map((file) => file.name).slice(0, 12);
      mediaList.textContent = ui.mediaNames.length ? `Selected: ${ui.mediaNames.join(', ')}` : 'No media selected.';
    });
    const approveBtn = h('button', { class: 'btn alt', type: 'button', onclick: () => {
      const vals = Object.fromEntries(Object.entries(F).map(([k, el]) => [k, el.value]));
      if (ui.mediaNames.length) vals.media = ui.mediaNames.join('\n');
      const res = publishProfile(S, vals);
      if (!res.ok) { err.textContent = res.error; return; }
      S.studio.draft = null; done(res, 'Profile approved and published. Existing requests keep their agreed terms.');
    } }, 'Approve & publish profile');
    return h('section', {}, h('h2', {}, 'Artist registration'), h('p', { class: 'muted' }, 'Introduction → structured draft → your approval. Nothing is published until you approve.'),
      h('div', { class: 'cols' },
        h('div', { class: 'card' }, h('h3', {}, '1 · Introduce your group'), intro,
          h('div', { class: 'row', style: 'margin-top:.6rem' },
            h('button', { class: 'btn ghost', type: 'button', onclick: () => { intro.value = SAMPLE_INTRO; } }, 'Use sample introduction'),
            h('button', { class: 'btn', type: 'button', onclick: gen }, 'Generate profile draft')),
          h('p', { class: 'muted' }, h('b', {}, 'Demo extraction—not live AI.'), ' Rule-based parsing of typed text; typing always works and speech is not included.')),
        h('div', { class: 'card' }, h('h3', {}, '2 · Complete artist registration'),
          h('div', { class: 'form' }, field('Group name', F.name), field('Art form', F.form), field('Region', F.region), field('Group size', F.groupSize),
            field('Listed performance fee (₹)', F.fee, 'Only changes when you approve here'), field('Listed travel (₹)', F.travel),
            field('Languages', F.languages, 'Comma separated', true), field('Skills', F.skills, 'Comma separated', true), field('Summary', F.summary, '', true),
            field('Photos and videos', media, 'Selected filenames are saved in this browser demo; files are not uploaded.', true), mediaList),
          err, h('div', { class: 'row', style: 'margin-top:.6rem' }, approveBtn),
          h('p', { class: 'muted' }, `Currently published: ${mine.name} — ${inr(mine.feePaise)} + ${inr(mine.travelPaise)} travel.`))));
  }

  /* ---- 3. Organizer request ---- */
  function request() {
    if (S.role !== 'organizer') return gate('organizer', 'Organizer request');
    const I = { org: h('input', { value: 'Sunrise College (fictional)', maxlength: 80 }), event: h('input', { value: 'Annual Cultural Fest', maxlength: 80 }),
      eventType: h('select', {}, EVENT_TYPES.map((type) => h('option', { value: type, selected: type === 'College fest' }, type))),
      location: h('input', { value: 'Thanjavur, Tamil Nadu', maxlength: 80 }), date: h('input', { type: 'date', value: plusDays(30), min: dateStr(new Date()) }),
      budget: money(1500000, 'Total event budget'), dur: h('input', { type: 'number', min: 15, max: 240, value: 45 }),
      description: h('textarea', { maxlength: 500, placeholder: 'Describe the occasion, atmosphere, or tradition you want to feature…' }),
      gs: h('input', { type: 'number', min: 1, max: 50, value: 8 }), custom: h('textarea', { maxlength: 500, placeholder: 'Set length, repertoire, accessibility, or staging preferences…' }),
      perf: money(800000, 'Offered fee'), travel: money(100000, 'Travel') };
    const err = h('p', { class: 'err', role: 'alert' }), prev = h('div', { 'aria-live': 'polite' });
    const matches = h('div', { class: 'grid match-grid', 'aria-live': 'polite' });
    const eventPhoto = h('img', { loading: 'lazy' });
    const eventPhotoLabel = h('span', {});
    const eventPhotoCaption = h('figcaption', {}, eventPhotoLabel);
    const eventPhotoFigure = h('figure', { class: 'event-photo' }, eventPhoto, eventPhotoCaption);
    const read = () => ({ profileId: ui.reqProfile, org: I.org.value, event: I.event.value, eventType: I.eventType.value, location: I.location.value,
      description: I.description.value, budget: I.budget.value, date: I.date.value, durationMin: I.dur.value, groupSize: I.gs.value,
      customRequest: I.custom.value, perf: I.perf.value, travel: I.travel.value });
    const updateEventPhoto = () => {
      const artwork = EVENT_ARTWORK[eventArtworkFor(read())];
      eventPhoto.src = artwork.src;
      eventPhoto.alt = artwork.alt;
      eventPhotoLabel.textContent = artwork.label;
    };
    const preview = () => {
      const v = read(), budget = toPaise(v.budget), ranked = rankProfiles(S, v);
      updateEventPhoto();
      prev.replaceChildren();
      matches.replaceChildren();
      if (budget === null || budget <= 0) { prev.append(h('div', { class: 'flag' }, 'Enter a total event budget to see eligible artists.')); return; }
      const selected = S.profiles.find((p) => p.id === v.profileId);
      if (selected) {
        const perf = toPaise(v.perf), tr = toPaise(v.travel);
        if (perf !== null && tr !== null) {
          const flags = flagsFor(S, { profileId: selected.id, groupSize: Number(v.groupSize) || 0 }, { perfPaise: perf, travelPaise: tr });
          prev.append(...(flags.length ? flags.map((text) => h('div', { class: 'flag' }, 'Offer review: ', text, ' Artist approval is required.'))
            : [h('p', { class: 'ok' }, 'Your offer matches the selected artist’s listed terms.') ]));
        }
      }
      ranked.forEach((match, index) => {
        const p = match.profile, selectedMatch = p.id === ui.reqProfile;
        matches.append(h('article', { class: 'card match-card' }, h('div', { class: 'match-top' }, h('span', { class: 'tag' }, `#${index + 1} · ${match.score}% match`),
          h('span', { class: match.withinBudget ? 'ok' : 'muted' }, match.withinBudget ? 'Within budget' : 'Over budget')),





          h('h3', {}, p.name), h('p', { class: 'muted' }, `${p.form} · ${p.place}, ${ p.region}`),
          h('div', { class: 'match-reasons' }, match.reasons.map((reason) => h('span', { class: 'chip' }, reason))),
          h('div', { class: 'stats' }, h('span', {}, h('b', {}, inr(p.feePaise + p.travelPaise)), 'total'), h('span', {}, h('b', {}, p.groupSize), 'artists')),
          h('button', { class: selectedMatch ? 'btn alt' : 'btn ghost', type: 'button', 'aria-pressed': String(selectedMatch), disabled: !match.withinBudget,
            onclick: () => { ui.reqProfile = p.id; I.perf.value = p.feePaise / 100; I.travel.value = p.travelPaise / 100; preview(); } },
          selectedMatch ? 'Selected artist' : match.withinBudget ? 'Select artist' : 'Over budget')));
      });
    };
    Object.values(I).forEach((el) => { el.addEventListener('input', preview); el.addEventListener('change', preview); });
    preview();
    return h('section', {}, h('h2', {}, 'Organizer dashboard'), h('p', { class: 'muted' }, 'Describe your event, compare ranked artist matches, then send a booking request. Suggestions use transparent demo rules, not live AI.'),
      h('div', { class: 'card' }, h('h3', {}, 'Event details'), h('div', { class: 'form' },
        field('Organizer', I.org), field('Event name', I.event), field('Event type', I.eventType), field('Event location', I.location), field('Event date', I.date),
        field('Total artist budget (₹)', I.budget), field('Performance duration (minutes)', I.dur), field('Performers requested', I.gs),
        field('Event description', I.description, 'This description selects a relevant preview image and is shared with the artist.', true)),
        eventPhotoFigure,
        h('h3', { style: 'margin-top:1rem' }, 'Ranked artist matches'), matches,
        h('div', { class: 'form request-notes' }, field('Custom performance request (optional)', I.custom, 'Share repertoire, staging, accessibility, or timing preferences with the artist.', true)),
        h('h3', { style: 'margin-top:1rem' }, 'Booking offer'), h('div', { class: 'form' }, field('Offered performance fee (₹)', I.perf), field('Travel offered (₹)', I.travel)),
        prev, err, h('div', { class: 'row', style: 'margin-top:.6rem' }, h('button', { class: 'btn', type: 'button', onclick: (ev) => {
          const res = createRequest(S, read());
          if (!res.ok) { err.textContent = res.error; return; }
          ev.target.disabled = true; S.sel = res.request.id; go('inbox');
          toast(res.flags.length ? 'Request sent and flagged — waiting for artist review.' : 'Request sent.');
        } }, 'Send booking request'))));
  }

  /* ---- shared request pieces ---- */
  function termsLine(r, v) { return `${inr(v.perfPaise)} fee + ${inr(v.travelPaise)} travel = ${inr(v.perfPaise + v.travelPaise)}`; }
  function summary(r) {
    const p = profileOf(S, r), c = cur(r), fl = flagsFor(S, r, c);
    const artwork = EVENT_ARTWORK[r.artwork] || EVENT_ARTWORK[eventArtworkFor(r)];
    return h('div', {}, h('div', { class: 'row' }, h('h3', { style: 'margin:0' }, `${r.event} — ${r.org}`), badge(r)),
      h('figure', { class: 'event-photo event-photo-summary' }, h('img', { src: artwork.src, alt: artwork.alt, loading: 'lazy' }),
        h('figcaption', {}, h('b', {}, artwork.label), r.description && h('span', {}, r.description))),
      h('p', { class: 'muted', style: 'margin:.2rem 0' }, [r.eventType || 'Event', r.location || p.region, r.budgetPaise != null && `budget ${inr(r.budgetPaise)}`,
        fmtDate(r.date), `${r.durationMin} min`, `${r.groupSize} performers`].filter(Boolean).join(' · ')),
      r.customRequest && h('p', { class: 'custom-note' }, h('b', {}, 'Performance request: '), r.customRequest),
      h('p', { style: 'margin:.2rem 0' }, h('b', {}, `v${c.n} by ${roleName(c.by)}: `), termsLine(r, c)),
      fl.map((t) => h('div', { class: 'flag' }, '⚑ ', t)));
  }
  function actions(r) {
    const role = S.role, other = role === 'artist' ? 'organizer' : 'artist', c = cur(r), st = statusOf(r), box = h('div', { class: 'actions' });
    if (st === 'declined') { box.append(h('p', { class: 'muted' }, `Declined by ${roleName(r.declined.by)} on ${fmt(r.declined.at)}.`)); return box; }
    const fl = role === 'artist' ? flagsFor(S, r, c) : [], mine = r.approvals[role] && r.approvals[role].version === c.n;
    if (!mine) {
      const ack = fl.length ? h('input', { type: 'checkbox' }) : null;
      box.append(...[ack && h('label', { style: 'flex-direction:row;align-items:flex-start;font-weight:500' }, ack, 'I knowingly accept these terms below my listed fee. My profile fee will not change.'),
        h('div', { class: 'row' }, h('button', { class: 'btn alt', type: 'button', onclick: () => done(approve(S, r, role, { exception: ack && ack.checked }), `Approved v${c.n}.`) },
          role === 'artist' ? (fl.length ? 'Accept exception' : 'Accept offer') : `Approve v${c.n}`))].filter(Boolean));
    } else box.append(h('p', { class: st === 'confirmed' ? 'ok' : 'muted' }, st === 'confirmed' ? `Both roles approved v${c.n}. Booking confirmed.` : `You approved v${c.n}. Waiting for ${roleName(other)}.`));
    const pf = money(c.perfPaise, 'Fee'), tf = money(c.travelPaise, 'Travel'), note = h('input', { maxlength: 200, placeholder: 'Optional note' }), e = h('p', { class: 'err', role: 'alert' });
    box.append(h('details', {}, h('summary', {}, st === 'confirmed' ? 'Propose changed terms (needs fresh approval)' : 'Counter / change terms (creates a new version)'),
      h('div', { class: 'form', style: 'margin-top:.6rem' }, field('Performance fee (₹)', pf), field('Travel (₹)', tf), field('Note', note, '', true)), e,
      h('button', { class: 'btn', type: 'button', style: 'margin-top:.5rem', onclick: () => { const res = proposeVersion(S, r, role, { perf: pf.value, travel: tf.value, note: note.value }); if (!res.ok) e.textContent = res.error; else done(res, `Sent as v${res.version.n}. Fresh approval required.`); } }, 'Send as new version')));
    box.append(h('div', { class: 'row' }, h('button', { class: 'btn danger', type: 'button', onclick: () => { if (confirm('Decline this request? This cannot be undone in the demo.')) done(decline(S, r, role, ''), 'Request declined.'); } }, 'Decline request')));
    return box;
  }

  /* ---- 4. Artist inbox ---- */
  function inbox() {
    const list = [...S.requests].reverse();
    return h('section', {}, h('h2', {}, 'Artist inbox'),
      h('p', { class: 'muted' }, S.role === 'artist' ? 'Review each request: accept, counter, or decline. Flagged terms are never accepted automatically.' : 'Viewing as Organizer: these are your sent requests. Go to Home, choose Artist, then return here to respond as the artist.'),
      list.length ? h('div', { class: 'list' }, list.map((r) => h('div', { class: 'card' }, summary(r), actions(r),
        h('div', { class: 'row', style: 'margin-top:.6rem' }, h('button', { class: 'btn ghost', type: 'button', style: 'color:var(--espresso)', onclick: () => { S.sel = r.id; go('booking'); } }, 'Open booking workspace')))))
        : h('div', { class: 'empty' }, h('h3', {}, 'No requests yet'), h('p', {}, 'Requests appear here after an organizer sends one.'),
          h('button', { class: 'btn', type: 'button', onclick: () => go('home') }, 'Go to Home to switch demo role')));
  }

  /* ---- 5. Booking workspace ---- */
  function booking() {
    if (!S.requests.length) return h('div', { class: 'empty' }, h('h2', {}, 'Booking workspace'), h('p', {}, 'No bookings yet. Send a request to start one.'),
      h('button', { class: 'btn', type: 'button', onclick: () => go('home') }, 'Go to Home to switch demo role'));
    const r = S.requests.find((x) => x.id === S.sel) || S.requests[S.requests.length - 1], c = cur(r), st = statusOf(r), confirmed = st === 'confirmed';
    const paid = paidOf(S, r), out = outstandingOf(S, r), pays = S.payments.filter((p) => p.requestId === r.id), logs = S.log.filter((l) => l.requestId === r.id);
    const key = uid('k'), amt = h('input', { inputmode: 'decimal', value: out > 0 ? out / 100 : '' }), note = h('input', { maxlength: 60, placeholder: 'e.g. Advance' }), pe = h('p', { class: 'err', role: 'alert' });
    const pay = h('button', { class: 'btn alt', type: 'button', onclick: (ev) => {
      ev.target.disabled = true;
      const res = recordPayment(S, r, S.role, { amount: amt.value, note: note.value, key });
      if (!res.ok) { ev.target.disabled = false; if (res.duplicate) { toast(res.error, true); render(); } else pe.textContent = res.error; return; }
      done(res, 'Simulated payment recorded.');
    } }, 'Simulate payment');
    const ap = (role) => { const a = r.approvals[role]; return a && a.version === c.n ? `✓ approved v${c.n}${a.exception ? ' (exception accepted)' : ''}` : 'pending'; };
    const diff = (v, i) => { const p = r.versions[i - 1]; return p ? [v.perfPaise !== p.perfPaise && `fee ${inr(p.perfPaise)} → ${inr(v.perfPaise)}`, v.travelPaise !== p.travelPaise && `travel ${inr(p.travelPaise)} → ${inr(v.travelPaise)}`].filter(Boolean).join('; ') : ''; };
    return h('section', {}, h('h2', {}, out === 0 && confirmed ? 'Booking completed' : 'Booking workspace'),
      S.requests.length > 1 && h('div', { class: 'row', style: 'margin:.5rem 0' }, h('label', {}, 'Request', h('select', { onchange: (e) => { S.sel = e.target.value; save(); render(); } },
        S.requests.map((x) => h('option', { value: x.id, selected: x.id === r.id }, `${x.event} — ${x.org} (${label(x)})`))))),
      h('div', { class: 'card' }, summary(r)),
      h('div', { class: 'cols', style: 'margin-top:1rem' },
        h('div', { class: 'list' },
          h('div', { class: 'card' }, h('h3', {}, confirmed ? 'Agreed terms' : 'Current proposal (not yet agreed)'),
            h('table', {}, h('tbody', {}, h('tr', {}, h('td', {}, 'Performance fee'), h('td', { class: 'n' }, inr(c.perfPaise))), h('tr', {}, h('td', {}, 'Travel'), h('td', { class: 'n' }, inr(c.travelPaise)))),
              h('tfoot', {}, h('tr', {}, h('td', {}, 'Total'), h('td', { class: 'n' }, inr(totalOf(r)))))),
            h('p', { class: 'muted' }, `Organizer: ${ap('organizer')} · Artist: ${ap('artist')}`), actions(r)),
          h('div', { class: 'card' }, h('h3', {}, 'Offer history'), h('ol', { class: 'hist' }, r.versions.map((v, i) => h('li', {}, h('b', {}, `v${v.n} · ${roleName(v.by)}`), ` — ${termsLine(r, v)}`,
            h('div', { class: 'muted' }, [fmt(v.at), v.note, diff(v, i)].filter(Boolean).join(' · '))))))),
        h('div', { class: 'list' },
          h('div', { class: 'card' }, h('h3', {}, 'Payment ledger (simulated)'),
            pays.length ? h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'When'), h('th', {}, 'Note'), h('th', { class: 'n' }, 'Amount'))),
              h('tbody', {}, pays.map((p) => h('tr', {}, h('td', {}, fmt(p.at)), h('td', {}, p.note || '—'), h('td', { class: 'n' }, inr(p.amountPaise)))))) : h('p', { class: 'muted' }, 'No payments recorded yet.'),
            h('table', {}, h('tfoot', {}, h('tr', {}, h('td', {}, 'Total due'), h('td', { class: 'n' }, inr(totalOf(r)))), h('tr', {}, h('td', {}, 'Recorded'), h('td', { class: 'n' }, inr(paid))), h('tr', {}, h('td', {}, 'Outstanding'), h('td', { class: 'n' }, inr(out))))),
            confirmed && S.role === 'organizer' && out > 0 ? h('div', {}, h('div', { class: 'form', style: 'margin-top:.6rem' }, field('Amount (₹)', amt), field('Note', note)), pe, h('div', { class: 'row', style: 'margin-top:.5rem' }, pay),
              h('p', { class: 'muted' }, 'Simulation only — no real checkout, escrow or payment guarantee.'))
              : h('p', { class: 'muted' }, !confirmed ? 'Payments open once both roles approve the current version.' : out <= 0 ? 'Fully paid (simulated).' : 'Use the Organizer demo to simulate a payment.')),
          h('div', { class: 'card' }, h('h3', {}, 'Activity log'), h('ul', { class: 'log' }, [...logs].reverse().map((l) => h('li', {}, h('b', {}, roleName(l.role)), ` — ${l.text}`, h('div', { class: 'muted' }, fmt(l.at)))))))));
  }

  /* ---- shell ---- */
  const VIEWS = { home: ['Home', home], access: ['Login / Sign up', access], discover: ['Artist directory', discover], tourist: ['Events & offerings', tourist], 'event-detail': ['Event details', eventDetail], checkout: ['Checkout', checkout], 'booking-confirmation': ['Booking confirmed', bookingConfirmation], wishlist: ['Wishlist', wishlist], studio: ['Artist registration', studio], request: ['Event & matches', request], inbox: ['Requests', inbox], booking: ['Bookings', booking] };
  function render() {
    if (!S.authenticated) {
      S.view = 'access';
    } else if (protectedViews.has(S.view)) {
      const allowed = S.role === 'artist'
        ? new Set(['home', 'discover', 'wishlist', 'studio', 'inbox', 'booking', 'event-detail'])
        : S.role === 'organizer'
          ? new Set(['home', 'discover', 'wishlist', 'request', 'inbox', 'booking', 'event-detail', 'checkout', 'booking-confirmation'])
          : new Set(['tourist', 'discover', 'wishlist', 'event-detail', 'checkout', 'booking-confirmation']);
      if (!allowed.has(S.view)) S.view = S.role === 'artist' ? 'studio' : S.role === 'organizer' ? 'request' : 'tourist';
    }
    const visitorMode = S.role === 'tourist' && S.authenticated;
    $('nav').hidden = !S.authenticated || visitorMode;
    $('banner').hidden = !S.authenticated || visitorMode;
    $('reset').hidden = !S.authenticated || visitorMode;
    $('back').hidden = ui.history.length === 0;
    const roleViews = S.role === 'artist'
      ? new Set(['home', 'discover', 'wishlist', 'studio', 'inbox', 'booking'])
      : S.role === 'organizer'
        ? new Set(['home', 'discover', 'wishlist', 'request', 'inbox', 'booking'])
        : new Set(['tourist', 'discover', 'wishlist']);
    $('nav').replaceChildren(...Object.entries(VIEWS)
      .filter(([k]) => roleViews.has(k))
      .map(([k, [t]]) => h('button', { type: 'button', 'aria-current': S.view === k ? 'page' : null, onclick: () => go(k) }, t)));
    $('banner').replaceChildren(h('b', {}, 'Next step'), h('span', {}, nextStep(S, S.role), persist ? '' : ' (Browser storage is unavailable, so changes will not survive a refresh.)'));
    $('app').replaceChildren(VIEWS[S.view][1]());
  }
  $('reset').addEventListener('click', () => {
    if (!confirm('Reset the demo? This erases all requests, payments and profile edits in this browser and restores the seeded fictional data.')) return;
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    S = seed(); ui.history = []; save(); toast('Demo reset to seeded data.'); render();
  });
  $('back').addEventListener('click', goBack);
  S = load();
  const requestedView = new URLSearchParams(window.location.search).get('view');
  if (!S.authenticated) {
    S.view = 'access';
  } else if (requestedView && VIEWS[requestedView]) {
    S.view = requestedView;
  } else {
    S.view = S.role === 'artist' ? 'studio' : S.role === 'tourist' ? 'tourist' : 'request';
  }
  save();
  render();
}

if (typeof module !== 'undefined') module.exports = { toPaise, inr, seed, extract, SAMPLE_INTRO, createRequest, proposeVersion, approve, decline, recordPayment, publishProfile, statusOf, flagsFor, totalOf, paidOf, outstandingOf, cur, nextStep };
