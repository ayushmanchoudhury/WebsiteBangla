'use strict';

/* ═══════════════════════════════════════════════════════
   ELEMENT REFERENCES
═══════════════════════════════════════════════════════ */
const scene         = document.getElementById('scene');
const envStage      = document.getElementById('envelope-stage');
const env           = document.getElementById('env');
const envFlap       = document.getElementById('env-flap');
const envSeal       = document.getElementById('env-seal');
const envSealDisc   = document.getElementById('env-seal-disc');
const envLetter     = document.getElementById('env-letter');
const sparks        = document.getElementById('sparks');
const cardScene     = document.getElementById('card-scene');
const card          = document.getElementById('card');
const flipBtn       = document.getElementById('flip-btn');
const muteBtn       = document.getElementById('mute-btn');
const audio         = document.getElementById('bg-music');


/* ═══════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════ */
let appState      = 'CLOSED';   // 'CLOSED' | 'OPENING' | 'OPEN'
let musicDeferred = false;
let isFlipped     = false;


/* ═══════════════════════════════════════════════════════
   GRAND OPENING SEQUENCE
   ───────────────────────────────────────────────────────
   Timeline (ms):
     0       Click registered
     0       Phase 1 — seal cracks & pops + gold sparks
     350     Phase 2 — flap begins its 2-second rotation
     380     Phase 3 — golden inside lining fades in
     1 600   Phase 4 — letter rises out of the envelope
     2 400   Phase 5 — envelope stage fades out (.is-open)
     2 550   Phase 6 — card scene becomes visible
     2 650   Phase 7 — card animates in (.card-visible)
     2 900   Phase 8 — music starts, state = OPEN
═══════════════════════════════════════════════════════ */
envStage.addEventListener('click', openInvitation);
envStage.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openInvitation(); }
});

function openInvitation() {
  if (appState !== 'CLOSED') return;
  appState = 'OPENING';

  /* ── Phase 1 : Seal pop + gold sparks (t = 0) ──── */
  envSeal.classList.add('is-popping');
  sparks.classList.add('is-active');

  // After pop animation finishes, permanently hide the disc
  setTimeout(() => {
    envSeal.classList.remove('is-popping');
    envSeal.classList.add('is-popped');
  }, 450);

  /* ── Phase 2 : Flap lifts (t = 350 ms) ─────────── */
  setTimeout(() => {
    envFlap.classList.add('is-opening');
  }, 350);

  /* ── Phase 3 : Inside lining (t = 380 ms) ──────── */
  setTimeout(() => {
    env.classList.add('is-opening');
  }, 380);

  /* ── Phase 4 : Letter rises (t = 1 600 ms) ─────── */
  // The flap CSS transition is 2 000 ms. At ~80% of 2 000 = 1 600 ms
  // the flap has rotated ~90° and the inside is fully revealed.
  setTimeout(() => {
    envLetter.classList.add('is-rising');
  }, 1600);

  /* ── Phase 5 : Envelope exits (t = 2 400 ms) ───── */
  setTimeout(() => {
    scene.classList.add('is-open');
  }, 2400);

  /* ── Phase 6 : Card DOM visible (t = 2 550 ms) ─── */
  setTimeout(() => {
    cardScene.removeAttribute('hidden');
  }, 2550);

  /* ── Phase 7 : Card entrance animation (t = 2 650 ms) */
  setTimeout(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cardScene.classList.add('card-visible');
      });
    });
  }, 2650);

  /* ── Phase 8 : Finalise (t = 2 900 ms) ─────────── */
  setTimeout(() => {
    appState = 'OPEN';
    muteBtn.classList.add('visible');
    attemptPlay();
  }, 2900);
}


/* ═══════════════════════════════════════════════════════
   MUSIC
═══════════════════════════════════════════════════════ */
function attemptPlay() {
  const p = audio.play();
  if (p !== undefined) {
    p.catch(() => {
      musicDeferred = true;
      document.addEventListener('click',    playDeferred, { once: true });
      document.addEventListener('touchend', playDeferred, { once: true });
    });
  }
}

function playDeferred() {
  if (!musicDeferred) return;
  musicDeferred = false;
  if (!audio.muted) audio.play().catch(() => {});
}

muteBtn.addEventListener('click', () => {
  audio.muted = !audio.muted;
  syncMute();
  if (!audio.muted && musicDeferred) {
    musicDeferred = false;
    audio.play().catch(() => {});
  }
});

function syncMute() {
  const m = audio.muted;
  muteBtn.classList.toggle('is-muted', m);
  muteBtn.setAttribute('aria-label', m ? 'Unmute music' : 'Mute music');
  muteBtn.setAttribute('title',       m ? 'Unmute music' : 'Mute music');
}
audio.addEventListener('volumechange', syncMute);


/* ═══════════════════════════════════════════════════════
   CARD FLIP
═══════════════════════════════════════════════════════ */
flipBtn.addEventListener('click', flipCard);
card.addEventListener('click', flipCard);
card.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipCard(); }
});

function flipCard() {
  isFlipped = !isFlipped;
  card.classList.toggle('is-flipped', isFlipped);
  const label = isFlipped ? 'Flip to front' : 'Flip to back';
  flipBtn.setAttribute('aria-label', label);
  flipBtn.querySelector('span').textContent = isFlipped ? 'See front' : 'Flip card';
}
