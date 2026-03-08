/**
 * script.js — Invitation experience controller
 *
 * State machine (simple):
 *   CLOSED  → (envelope click) → OPENING  → (animationend) → OPEN
 *
 * In the OPEN state the user can flip the card and toggle music.
 *
 * ── To allow replay of the opening animation ──────────────────────────
 * Add a "Replay" button (hidden by default) that calls resetExperience().
 * That function removes .is-open from the scene, re-shows the envelope
 * wrapper, and hides the card-scene again. Uncomment the replay section
 * at the bottom of this file for a ready-made example.
 * ─────────────────────────────────────────────────────────────────────
 */

'use strict';

/* ─── Element references ───────────────────────────────────────────── */
const scene           = document.getElementById('scene');
const envelopeWrapper = document.getElementById('envelope-wrapper');
const envelopeFlap    = document.getElementById('envelope-flap');
const cardScene       = document.getElementById('card-scene');
const card            = document.getElementById('card');
const flipBtn         = document.getElementById('flip-btn');
const muteBtn         = document.getElementById('mute-btn');
const audio           = document.getElementById('bg-music');

/* ─── Application state ────────────────────────────────────────────── */
let appState       = 'CLOSED';   // 'CLOSED' | 'OPENING' | 'OPEN'
let musicDeferred  = false;       // true when autoplay was blocked; play on next interaction

/* ─── Timing constants (keep in sync with CSS --dur-open) ──────────── */
// Total time before we reveal the card after the envelope click.
// Should be >= CSS --dur-open value (1000ms) so animations don't overlap.
const OPEN_ANIM_MS = 1000;


/* =================================================================
   ENVELOPE CLICK → open sequence
================================================================= */
envelopeWrapper.addEventListener('click', openInvitation);

function openInvitation() {
  if (appState !== 'CLOSED') return;   // guard: run once
  appState = 'OPENING';

  /* 1. Trigger the flap rotation immediately */
  envelopeFlap.classList.add('is-opening');

  /* 2. Add .is-open to the scene after a short pause (let the flap
        lift slightly before the full open transition fires). */
  setTimeout(() => {
    scene.classList.add('is-open');
  }, 80);   // tiny delay makes the sequence feel sequential, not instant

  /* 3. After the opening animation completes, reveal the card */
  setTimeout(revealCard, OPEN_ANIM_MS + 80);
}


/* =================================================================
   REVEAL CARD
================================================================= */
function revealCard() {
  appState = 'OPEN';

  /* Show the card-scene element (was HTML hidden) */
  cardScene.removeAttribute('hidden');

  /* requestAnimationFrame ensures the browser paints the element
     before we add the class that drives the CSS entrance transition.
     Without this double-rAF trick the transition may not fire. */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      cardScene.classList.add('card-visible');
    });
  });

  /* Show the mute button now that music is relevant */
  muteBtn.classList.add('visible');

  /* Attempt to start music (browsers may block autoplay) */
  attemptPlay();
}


/* =================================================================
   MUSIC / AUDIO
================================================================= */

/**
 * Attempt to auto-play. If the browser rejects it (common on mobile
 * and in some desktop Chrome policies), we flag musicDeferred = true
 * and attach a one-time listener to play on the very next user
 * interaction with any element.
 */
function attemptPlay() {
  const playPromise = audio.play();

  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Autoplay blocked — queue music for the next user interaction
      musicDeferred = true;
      document.addEventListener('click',  playDeferredMusic, { once: true });
      document.addEventListener('touchend', playDeferredMusic, { once: true });
    });
  }
}

function playDeferredMusic() {
  if (!musicDeferred) return;
  musicDeferred = false;
  // Only play if the user hasn't actively muted
  if (!audio.muted) {
    audio.play().catch(() => {
      // Still blocked — silently ignore
    });
  }
}

/* ── Mute toggle ──────────────────────────────────────────────────── */
muteBtn.addEventListener('click', toggleMute);

function toggleMute() {
  audio.muted = !audio.muted;
  syncMuteButton();

  /* If music was deferred and the user unmutes, try starting it now */
  if (!audio.muted && musicDeferred) {
    musicDeferred = false;
    audio.play().catch(() => {});
  }
}

/**
 * Keep the button icon in sync with the actual audio.muted state.
 * This is also safe to call proactively (e.g., if the system mutes).
 */
function syncMuteButton() {
  if (audio.muted) {
    muteBtn.classList.add('is-muted');
    muteBtn.setAttribute('aria-label', 'Unmute music');
    muteBtn.setAttribute('title', 'Unmute music');
  } else {
    muteBtn.classList.remove('is-muted');
    muteBtn.setAttribute('aria-label', 'Mute music');
    muteBtn.setAttribute('title', 'Mute music');
  }
}

/* Sync on page load in case the browser or OS starts in a muted state */
audio.addEventListener('volumechange', syncMuteButton);


/* =================================================================
   CARD FLIP
================================================================= */

/* Flip when the button is clicked */
flipBtn.addEventListener('click', flipCard);

/* Also flip when the card itself is tapped/clicked (mobile-friendly) */
card.addEventListener('click', flipCard);

/* Track which face is showing so we can update aria labels */
let isFlipped = false;

function flipCard() {
  isFlipped = !isFlipped;
  card.classList.toggle('is-flipped', isFlipped);

  /* Update button label for accessibility */
  flipBtn.setAttribute(
    'aria-label',
    isFlipped ? 'Flip to front of invitation' : 'Flip to back of invitation'
  );
  flipBtn.querySelector('span').textContent =
    isFlipped ? 'See front' : 'Flip card';
}


/* =================================================================
   KEYBOARD ACCESSIBILITY
================================================================= */
envelopeWrapper.setAttribute('tabindex', '0');
envelopeWrapper.setAttribute('role', 'button');
envelopeWrapper.setAttribute('aria-label', 'Open your invitation');

envelopeWrapper.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openInvitation();
  }
});

card.setAttribute('tabindex', '0');
card.setAttribute('role', 'button');
card.setAttribute('aria-label', 'Flip invitation card');

card.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    flipCard();
  }
});


/* =================================================================
   OPTIONAL REPLAY
   ─────────────────────────────────────────────────────────────────
   To enable replay, add this button to your HTML inside .scene:
     <button id="replay-btn" class="replay-btn" hidden>
       Watch again
     </button>
   Then uncomment the block below.
================================================================= */

/*
const replayBtn = document.getElementById('replay-btn');

function resetExperience() {
  appState = 'CLOSED';
  isFlipped = false;

  // Reset card flip
  card.classList.remove('is-flipped');

  // Hide card scene
  cardScene.classList.remove('card-visible');
  setTimeout(() => {
    cardScene.setAttribute('hidden', '');
  }, 600); // wait for fade-out

  // Reset envelope
  envelopeFlap.classList.remove('is-opening');
  scene.classList.remove('is-open');

  // Hide mute button and stop music
  muteBtn.classList.remove('visible');
  audio.pause();
  audio.currentTime = 0;

  // Hide replay button
  replayBtn.setAttribute('hidden', '');
}

if (replayBtn) {
  replayBtn.addEventListener('click', resetExperience);
}
*/
