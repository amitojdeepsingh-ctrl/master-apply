/**
 * app.js
 * Main application logic — step navigation, matching, validation, submission.
 * Replace N8N_WEBHOOK_URL with your actual n8n webhook.
 */

const N8N_WEBHOOK_URL = 'https://YOUR-N8N-URL/webhook/apply-portal';

// ── State ─────────────────────────────────────────────────────────────
let activeTest      = 'ielts';
let selectedPrograms = [];
let studentProfile  = {};
let ieltsEquiv      = 0;

// ── Init ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadPrograms();
  initTestTabs();
  initLiveCalc();
  initUploads();
  document.getElementById('btn-find').addEventListener('click', runStep1);
  document.getElementById('btn-select').addEventListener('click', () => {
    if (selectedPrograms.length === 0) return;
    goStep(3);
  });
});

// ── Step navigation ───────────────────────────────────────────────────
function goStep(n) {
  document.querySelectorAll('.step-section').forEach(s => s.classList.remove('active'));
  document.getElementById('step-' + (n === 'success' ? 'success' : n)).classList.add('active');

  // Update hero nav
  document.querySelectorAll('.hero-step').forEach((el, i) => {
    el.classList.remove('active','done');
    if (i + 1 === n)      el.classList.add('active');
    else if (i + 1 < n)   el.classList.add('done');
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Test tabs ─────────────────────────────────────────────────────────
function initTestTabs() {
  document.querySelectorAll('.test-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      activeTest = this.dataset.test;
      document.querySelectorAll('.test-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      document.querySelectorAll('.test-section').forEach(s => s.classList.remove('visible'));
      document.getElementById('section-' + activeTest).classList.add('visible');
    });
  });
}

// ── Score conversion helpers ──────────────────────────────────────────
function calcIeltsOverall(l, r, w, s) {
  const avg  = (l + r + w + s) / 4;
  const frac = avg % 1;
  if (frac < 0.25) return Math.floor(avg);
  if (frac < 0.75) return Math.floor(avg) + 0.5;
  return Math.ceil(avg);
}
function celpipToIelts(avg) {
  if (avg >= 11.5) return 8.0; if (avg >= 10.5) return 7.5;
  if (avg >= 9.5)  return 7.0; if (avg >= 8.5)  return 6.5;
  if (avg >= 7.5)  return 6.0; return 5.5;
}
function duolingoToIelts(s) {
  if (s >= 135) return 8.0; if (s >= 125) return 7.5; if (s >= 120) return 7.0;
  if (s >= 110) return 6.5; if (s >= 105) return 6.0; return 5.5;
}
function pteToIelts(s) {
  if (s >= 83) return 8.0; if (s >= 79) return 7.5; if (s >= 71) return 7.0;
  if (s >= 64) return 6.5; if (s >= 58) return 6.0; return 5.5;
}

function getIeltsEquiv() {
  if (activeTest === 'ielts') {
    const l = +document.getElementById('ielts-l').value;
    const r = +document.getElementById('ielts-r').value;
    const w = +document.getElementById('ielts-w').value;
    const s = +document.getElementById('ielts-s').value;
    if ([l,r,w,s].some(isNaN)) return null;
    return calcIeltsOverall(l, r, w, s);
  }
  if (activeTest === 'celpip') {
    const v = ['cel-l','cel-r','cel-w','cel-s'].map(id => +document.getElementById(id).value);
    if (v.some(isNaN)) return null;
    return celpipToIelts(v.reduce((a,b)=>a+b,0)/4);
  }
  if (activeTest === 'duolingo') {
    const s = +document.getElementById('duo-score').value;
    return isNaN(s) ? null : duolingoToIelts(s);
  }
  if (activeTest === 'pte') {
    const s = +document.getElementById('pte-score').value;
    return isNaN(s) ? null : pteToIelts(s);
  }
  return null;
}

// ── Live score calculator display ────────────────────────────────────
function initLiveCalc() {
  // IELTS
  ['ielts-l','ielts-r','ielts-w','ielts-s'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      const vals = ['ielts-l','ielts-r','ielts-w','ielts-s'].map(i => +document.getElementById(i).value);
      if (vals.every(v => !isNaN(v) && v >= 0 && v <= 9)) {
        const ov = calcIeltsOverall(...vals);
        document.getElementById('ielts-overall-val').textContent = ov.toFixed(1);
        document.getElementById('ielts-overall-display').style.display = 'block';
      } else {
        document.getElementById('ielts-overall-display').style.display = 'none';
      }
    });
  });
  // CELPIP
  ['cel-l','cel-r','cel-w','cel-s'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      const vals = ['cel-l','cel-r','cel-w','cel-s'].map(i => +document.getElementById(i).value);
      if (vals.every(v => !isNaN(v) && v >= 1 && v <= 12)) {
        const eq = celpipToIelts(vals.reduce((a,b)=>a+b,0)/4);
        document.getElementById('celpip-equiv-val').textContent = 'IELTS ' + eq.toFixed(1);
        document.getElementById('celpip-equiv-display').style.display = 'block';
      }
    });
  });
  // Duolingo
  document.getElementById('duo-score').addEventListener('input', function() {
    const v = +this.value;
    if (!isNaN(v) && v >= 10 && v <= 160) {
      document.getElementById('duo-equiv-val').textContent = 'IELTS ' + duolingoToIelts(v).toFixed(1);
      document.getElementById('duo-equiv-display').style.display = 'block';
    }
  });
  // PTE
  document.getElementById('pte-score').addEventListener('input', function() {
    const v = +this.value;
    if (!isNaN(v) && v >= 10 && v <= 90) {
      document.getElementById('pte-equiv-val').textContent = 'IELTS ' + pteToIelts(v).toFixed(1);
      document.getElementById('pte-equiv-display').style.display = 'block';
    }
  });
}

// ── Step 1: validate + show results ──────────────────────────────────
function setErr(fieldId, errId, show) {
  document.getElementById(fieldId)?.classList.toggle('has-error', show);
  const err = document.getElementById(errId);
  if (err) err.style.display = show ? 'block' : 'none';
}

function runStep1() {
  let ok = true;
  const fname = document.getElementById('fname').value.trim();
  const lname = document.getElementById('lname').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const gpa   = parseFloat(document.getElementById('gpa').value);

  if (!fname) { setErr('field-fname','err-fname',true); ok=false; } else setErr('field-fname','err-fname',false);
  if (!lname) { setErr('field-lname','err-lname',true); ok=false; } else setErr('field-lname','err-lname',false);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('field-email','err-email',true); ok=false; } else setErr('field-email','err-email',false);
  if (!phone || !/^\+?[\d\s\-().]{7,20}$/.test(phone)) { setErr('field-phone','err-phone',true); ok=false; } else setErr('field-phone','err-phone',false);
  if (isNaN(gpa) || gpa < 0 || gpa > 4.0) { setErr('field-gpa','err-gpa',true); ok=false; } else setErr('field-gpa','err-gpa',false);

  // Validate active test
  const equiv = getIeltsEquiv();
  if (!equiv) {
    if (activeTest === 'ielts') {
      document.getElementById('err-ielts').style.display = 'block';
      ['mod-listening','mod-reading','mod-writing','mod-speaking'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('has-error');
      });
    } else if (activeTest === 'celpip') {
      document.getElementById('err-celpip').style.display = 'block';
    } else if (activeTest === 'duolingo') {
      setErr('field-duolingo','err-duolingo',true);
    } else if (activeTest === 'pte') {
      setErr('field-pte','err-pte',true);
    }
    ok = false;
  }

  if (!ok) return;

  ieltsEquiv = equiv;

  // Save profile basics
  studentProfile = {
    firstName: fname, lastName: lname, email, phone, gpa,
    testType: activeTest, ieltsEquiv,
    ieltsScores: getTestScores(),
  };

  // Run matching
  const { strong, good, possible } = matchPrograms(gpa, ieltsEquiv);
  const total = strong.length + good.length + possible.length;

  document.getElementById('results-summary').textContent =
    `${total} programs matched for GPA ${gpa.toFixed(2)} · IELTS equiv ${ieltsEquiv.toFixed(1)} · Select up to 5`;

  renderResults(strong, good, possible, gpa, ieltsEquiv);
  goStep(2);
}

function getTestScores() {
  if (activeTest === 'ielts') return {
    listening: +document.getElementById('ielts-l').value,
    reading:   +document.getElementById('ielts-r').value,
    writing:   +document.getElementById('ielts-w').value,
    speaking:  +document.getElementById('ielts-s').value,
  };
  if (activeTest === 'celpip') return {
    listening: +document.getElementById('cel-l').value,
    reading:   +document.getElementById('cel-r').value,
    writing:   +document.getElementById('cel-w').value,
    speaking:  +document.getElementById('cel-s').value,
  };
  if (activeTest === 'duolingo') return { overall: +document.getElementById('duo-score').value };
  if (activeTest === 'pte')      return { overall: +document.getElementById('pte-score').value };
  return {};
}

// ── Render program results ────────────────────────────────────────────
function fmtCAD(n) { return n ? 'CAD $' + (+n).toLocaleString('en-CA') : '—'; }

function renderResults(strong, good, possible, gpa, ielts) {
  selectedPrograms = [];
  const container = document.getElementById('results-container');
  container.innerHTML = '';

  const tiers = [
    { label: '🏆 Strong Match', sublabel: 'You meet all requirements', list: strong },
    { label: '👍 Good Match',   sublabel: 'One score slightly below', list: good },
    { label: '🎯 Possible',     sublabel: 'Close — worth applying', list: possible },
  ];

  tiers.forEach(tier => {
    if (!tier.list.length) return;
    const section = document.createElement('div');
    section.className = 'tier-section';
    section.innerHTML = `
      <div class="tier-heading">
        ${tier.label}
        <span class="tier-count">${tier.list.length} programs</span>
        <span style="font-weight:400;font-size:0.75rem;color:#94A3B8;margin-left:4px">— ${tier.sublabel}</span>
      </div>`;

    tier.list.forEach(p => {
      const gpaOk   = gpa   >= p.Min_GPA;
      const ieltsOk = ielts >= p.Min_IELTS;
      const intakePills = (p.Intakes || '').split(',').map(i =>
        `<span class="intake-pill">${i.trim()}</span>`).join('');
      const card = document.createElement('div');
      card.className = 'program-card';
      card.dataset.id = p.Program_Name + '|' + p.University;
      card.innerHTML = `
        <div class="pc-select-row">
          <input type="checkbox" class="pc-checkbox" data-id="${card.dataset.id}">
          <div class="pc-content">
            <div class="pc-top">
              <div class="program-name">${p.Program_Name}</div>
              <span class="pc-type-badge">${p.Program_Type || 'Coursework'}</span>
            </div>
            <div class="university-loc"><strong>${p.University}</strong> &nbsp;·&nbsp; ${p.City}, ${p.Province}</div>
            <div class="intakes">
              <span class="intake-label">Intakes:</span>
              ${intakePills}
              ${p.Co_Op ? '<span class="intake-pill" style="background:#DBEAFE;color:#1D4ED8;border-color:#BFDBFE">Co-op</span>' : ''}
            </div>
            <div class="pc-details">
              <div class="pc-detail"><div class="pc-detail-label">Tuition</div><div class="pc-detail-value">${fmtCAD(p.Tuition_CAD)}</div></div>
              <div class="pc-detail"><div class="pc-detail-label">App Fee</div><div class="pc-detail-value">${fmtCAD(p.App_Fee_CAD)}</div></div>
              <div class="pc-detail"><div class="pc-detail-label">Duration</div><div class="pc-detail-value">${p.Duration || '2 years'}</div></div>
              <div class="pc-detail"><div class="pc-detail-label">Min Req</div><div class="pc-detail-value" style="font-size:0.75rem">GPA ${p.Min_GPA} · ${p.Min_IELTS}</div></div>
            </div>
            <div class="score-row">
              <span class="score-badge ${gpaOk?'badge-ok':'badge-warn'}">GPA ${gpa.toFixed(2)} / ${p.Min_GPA} ${gpaOk?'✓':'⚠'}</span>
              <span class="score-badge ${ieltsOk?'badge-ok':'badge-warn'}">IELTS ${ielts.toFixed(1)} / ${p.Min_IELTS} ${ieltsOk?'✓':'⚠'}</span>
            </div>
          </div>
        </div>`;

      // Checkbox handler
      card.querySelector('.pc-checkbox').addEventListener('change', function() {
        const key = this.dataset.id;
        if (this.checked) {
          if (selectedPrograms.length >= 5) { this.checked = false; return; }
          selectedPrograms.push(p);
          card.classList.add('selected');
        } else {
          selectedPrograms = selectedPrograms.filter(x => (x.Program_Name+'|'+x.University) !== key);
          card.classList.remove('selected');
        }
        const btn = document.getElementById('btn-select');
        btn.disabled = selectedPrograms.length === 0;
        btn.textContent = selectedPrograms.length > 0
          ? `Continue with ${selectedPrograms.length} Program${selectedPrograms.length>1?'s':''} →`
          : 'Continue with Selected Programs';
      });

      section.appendChild(card);
    });
    container.appendChild(section);
  });

  if (!strong.length && !good.length && !possible.length) {
    container.innerHTML = `
      <div style="padding:40px;text-align:center;color:#64748B">
        <div style="font-size:2rem;margin-bottom:12px">😔</div>
        <div style="font-weight:600;margin-bottom:8px">No matches found for your current scores</div>
        <div style="font-size:0.85rem">Our RCIC consultant can still help — <a href="tel:6043639350" style="color:#C41E3A">call us</a> to discuss options.</div>
      </div>`;
  }
}

// ── Step 3: profile validation ────────────────────────────────────────
function validateProfile() {
  let ok = true;
  const fields = [
    ['dob','err-dob', v => !!v],
    ['nationality','err-nationality', v => !!v],
    ['degree','err-degree', v => !!v],
    ['grad-year','err-grad-year', v => v >= 1990 && v <= 2026],
    ['institution','err-institution', v => v.length > 1],
    ['field-of-study','err-field-of-study', v => v.length > 1],
  ];
  fields.forEach(([id, errId, test]) => {
    const val = document.getElementById(id).value;
    const pass = test(val);
    document.getElementById('field-'+id)?.classList.toggle('has-error', !pass);
    const err = document.getElementById(errId);
    if (err) err.style.display = pass ? 'none' : 'block';
    if (!pass) ok = false;
  });
  if (ok) {
    // Save to profile
    Object.assign(studentProfile, {
      dob:          document.getElementById('dob').value,
      nationality:  document.getElementById('nationality').value,
      degree:       document.getElementById('degree').value,
      gradYear:     document.getElementById('grad-year').value,
      institution:  document.getElementById('institution').value,
      fieldOfStudy: document.getElementById('field-of-study').value,
      workExp:      document.getElementById('work-exp').value,
      notes:        document.getElementById('notes').value,
    });
    goStep(4);
  }
}

// ── Step 4: submit ────────────────────────────────────────────────────
async function submitApplication() {
  const consent = document.getElementById('consent').checked;
  const uploadLater = document.getElementById('upload-later').checked;

  if (!consent) {
    document.getElementById('err-consent').style.display = 'block';
    return;
  }

  const btn = document.getElementById('btn-submit');
  btn.disabled = true;
  document.getElementById('submit-text').textContent = 'Submitting...';

  const payload = {
    studentProfile: { ...studentProfile },
    selectedPrograms: selectedPrograms.map(p => ({
      Program_Name: p.Program_Name,
      University:   p.University,
      City:         p.City,
      Province:     p.Province,
      Tuition_CAD:  p.Tuition_CAD,
      App_Fee_CAD:  p.App_Fee_CAD,
      Intakes:      p.Intakes,
      Duration:     p.Duration,
    })),
    uploadedDocs:  getUploadedDocs(),
    uploadLater,
    submittedAt:   new Date().toISOString(),
    source:        'apply.adsimmigration.com',
  };

  try {
    await fetch(N8N_WEBHOOK_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
  } catch (e) {
    console.warn('Webhook error (non-blocking):', e);
    // Don't block the student — we'll still show success
  }

  // Show success screen
  document.getElementById('success-msg').textContent =
    `Thank you, ${studentProfile.firstName}! We've received your application for ${selectedPrograms.length} program${selectedPrograms.length>1?'s':''}. Our RCIC consultant will review your profile within 1 business day and contact you at ${studentProfile.email}.`;

  document.getElementById('success-details').innerHTML =
    selectedPrograms.map(p =>
      `<div style="margin-bottom:6px">✅ ${p.University} — ${p.Program_Name}</div>`
    ).join('');

  document.querySelectorAll('.hero-step').forEach(el => el.classList.add('done'));
  goStep('success');
}
