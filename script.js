/**
 * SynapseX Music Studio — script.js
 * Pure Vanilla JS + Web Audio API
 * Features: Multi-instrument synth, piano keyboard, recording/playback,
 *           song demo, reverb, visualizer, keyboard shortcuts
 */

'use strict';

/* ================================================================
   CONSTANTS & CONFIGURATION
   ================================================================ */

/** Chromatic notes in one octave */
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Note display names (enharmonics for sharps) */
const NOTE_DISPLAY = {
  'C': 'C', 'C#': 'C#', 'D': 'D', 'D#': 'D#', 'E': 'E',
  'F': 'F', 'F#': 'F#', 'G': 'G', 'G#': 'G#', 'A': 'A',
  'A#': 'A#', 'B': 'B'
};

/** Keyboard → note mapping (key: keyboard char → value: [noteName, octaveOffset]) */
const KEY_MAP = {
  // ── Octave 3 white keys (bottom row Z→M) ──
  'z': ['C', 3], 'x': ['D', 3], 'c': ['E', 3],
  'v': ['F', 3], 'b': ['G', 3], 'n': ['A', 3], 'm': ['B', 3],

  // ── Octave 4 white keys (home row A→J) ──
  'a': ['C', 4], 's': ['D', 4], 'd': ['E', 4],
  'f': ['F', 4], 'g': ['G', 4], 'h': ['A', 4], 'j': ['B', 4],

  // ── Octave 4 black keys (QWERTY row) ──
  'w': ['C#', 4], 'e': ['D#', 4],
  't': ['F#', 4], 'y': ['G#', 4], 'u': ['A#', 4],

  // ── Octave 5 white keys (upper Q, I, O, P, K, L, ;) ──
  'q': ['C', 5],  'i': ['D', 5],  'o': ['E', 5],
  'p': ['F', 5],  'k': ['G', 5],  'l': ['A', 5],  ';': ['B', 5],

  // ── Octave 5 black keys ──
  'r': ['C#', 5],
};

/** Piano keys data – all keys shown on screen (C3 → B5) */
const PIANO_RANGE = (() => {
  const keys = [];
  for (let oct = 3; oct <= 5; oct++) {
    for (const note of NOTES) {
      keys.push({ note, octave: oct });
    }
  }
  return keys;
})();

/** Instrument presets (waveform + ADSR + filter config) */
const INSTRUMENTS = {
  piano: {
    name: 'Piano',
    waveform: 'triangle',
    attack:  0.005,
    decay:   0.2,
    sustain: 0.15,
    release: 0.8,
    harmonics: [1, 0.5, 0.25, 0.1],
    filterType: 'lowpass',
    filterFreq: 5000,
    filterQ: 1,
  },
  guitar: {
    name: 'Guitar',
    waveform: 'sawtooth',
    attack:  0.005,
    decay:   0.08,
    sustain: 0.0,
    release: 0.5,
    harmonics: [1, 0.4, 0.15],
    filterType: 'bandpass',
    filterFreq: 2000,
    filterQ: 2,
  },
  harmonium: {
    name: 'Harmonium',
    waveform: 'sine',
    attack:  0.04,
    decay:   0.05,
    sustain: 0.9,
    release: 0.8,
    harmonics: [1, 0.6, 0.4, 0.2, 0.1],
    filterType: 'lowpass',
    filterFreq: 3500,
    filterQ: 0.8,
  },
  organ: {
    name: 'Organ',
    waveform: 'square',
    attack:  0.001,
    decay:   0.0,
    sustain: 1.0,
    release: 0.06,
    harmonics: [1, 0.3, 0.15, 0.07],
    filterType: 'lowpass',
    filterFreq: 2800,
    filterQ: 0.5,
  },
  flute: {
    name: 'Flute',
    waveform: 'sine',
    attack:  0.08,
    decay:   0.05,
    sustain: 0.85,
    release: 0.5,
    harmonics: [1, 0.12, 0.05],
    filterType: 'bandpass',
    filterFreq: 4000,
    filterQ: 3,
  },
  synth: {
    name: 'Synth',
    waveform: 'sawtooth',
    attack:  0.01,
    decay:   0.15,
    sustain: 0.6,
    release: 0.4,
    harmonics: [1, 0.8, 0.6, 0.4, 0.2, 0.1],
    filterType: 'lowpass',
    filterFreq: 2000,
    filterQ: 8,
  },
};

/** Song sheets */
const SONGS = {
  dharkan: {
    title: '🎵 Tum Dil Ke Dharkan Me',
    hint: 'Press keys in order (space = short pause)',
    lines: [
      {
        words: [
          { syllable: 'Tum',  keys: ['T','U','M'] },
          { syllable: 'Dil',  keys: ['D','I','L'] },
          { syllable: 'Ke',   keys: ['K','E'] },
          { syllable: 'Dhar', keys: ['D','H','A','R'] },
          { syllable: 'Kan',  keys: ['K','A','N'] },
          { syllable: 'Me',   keys: ['M','E'] },
        ],
      },
    ],
    // Sequence: [noteName, octave, durationMs]
    sequence: [
      ['F#', 4, 300], ['G#', 4, 300], ['A#', 3, 300], [null, 0, 150],
      ['E',  4, 300], ['D',  5, 300], ['A',  5, 300], [null, 0, 150],
      ['G',  5, 300], ['D#', 4, 300], [null, 0, 150],
      ['E',  4, 300], ['A',  4, 300], ['C',  4, 300], ['C#', 5, 300],
      ['G',  5, 300], ['C',  4, 300], ['A',  3, 300], [null, 0, 150],
      ['B',  3, 300], ['D#', 4, 400],
    ],
  },
  twinkle: {
    title: '⭐ Twinkle Twinkle Little Star',
    hint: 'A classic nursery rhyme',
    lines: [
      {
        words: [
          { syllable: 'Twin-kle', keys: ['A','A','K','K','L','L','K'] },
          { syllable: 'twin-kle', keys: ['J','J','I','I','Q','Q','A'] },
        ],
      },
    ],
    sequence: [
      ['C',4,300],['C',4,300],['G',4,300],['G',4,300],['A',4,300],['A',4,300],['G',4,500],
      ['F',4,300],['F',4,300],['E',4,300],['E',4,300],['D',4,300],['D',4,300],['C',4,500],
      ['G',4,300],['G',4,300],['F',4,300],['F',4,300],['E',4,300],['E',4,300],['D',4,500],
      ['G',4,300],['G',4,300],['F',4,300],['F',4,300],['E',4,300],['E',4,300],['D',4,500],
      ['C',4,300],['C',4,300],['G',4,300],['G',4,300],['A',4,300],['A',4,300],['G',4,500],
      ['F',4,300],['F',4,300],['E',4,300],['E',4,300],['D',4,300],['D',4,300],['C',4,600],
    ],
  },
  happy: {
    title: '🎂 Happy Birthday',
    hint: 'Everybody knows this one!',
    lines: [
      {
        words: [
          { syllable: 'Hap-py Birth-day', keys: ['A','A','S','A','F','E'] },
          { syllable: 'to you!',          keys: ['A','A','S','A','G','F'] },
        ],
      },
    ],
    sequence: [
      ['C',4,200],['C',4,100],['D',4,350],['C',4,350],['F',4,350],['E',4,500],
      ['C',4,200],['C',4,100],['D',4,350],['C',4,350],['G',4,350],['F',4,500],
      ['C',4,200],['C',4,100],['C',5,350],['A',4,350],['F',4,350],['E',4,350],['D',4,350],
      ['A#',4,200],['A#',4,100],['A',4,350],['F',4,350],['G',4,350],['F',4,600],
    ],
  },
};

/* ================================================================
   AUDIO ENGINE
   ================================================================ */

const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;
  let reverbGain = null;
  let dryGain = null;
  let convolver = null;
  let analyser = null;
  let compressor = null;

  /** Active oscillator nodes (key → {oscs[], gainNode, filter}) */
  const activeNodes = new Map();

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Compressor → master out
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 10;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;

    masterGain = ctx.createGain();
    masterGain.gain.value = 0.8;

    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.85;

    // Reverb chain
    dryGain = ctx.createGain();
    dryGain.gain.value = 0.8;

    reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.2;

    convolver = ctx.createConvolver();
    convolver.buffer = _buildImpulseResponse(ctx, 2.5, 3.0);

    // Connect: masterGain → analyser → compressor → destination
    masterGain.connect(dryGain);
    masterGain.connect(reverbGain);
    dryGain.connect(analyser);
    reverbGain.connect(convolver);
    convolver.connect(analyser);
    analyser.connect(compressor);
    compressor.connect(ctx.destination);
  }

  /** Build synthetic impulse response for reverb */
  function _buildImpulseResponse(audioCtx, duration, decay) {
    const sr = audioCtx.sampleRate;
    const length = sr * duration;
    const buf = audioCtx.createBuffer(2, length, sr);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return buf;
  }

  /** Get frequency for a note + octave */
  function noteFrequency(noteName, octave) {
    const semitone = NOTES.indexOf(noteName);
    if (semitone < 0) return null;
    // MIDI note number: C4 = 60, A4 = 69 → freq = 440 × 2^((midi-69)/12)
    const midi = (octave + 1) * 12 + semitone;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /** Play a note (note-on) */
  function noteOn(noteName, octave, instrument, volume = 0.8) {
    init();
    if (ctx.state === 'suspended') ctx.resume();

    const freq = noteFrequency(noteName, octave);
    if (!freq) return;

    const key = `${noteName}${octave}`;
    noteOff(key, true); // stop any already-playing instance

    const preset = INSTRUMENTS[instrument] || INSTRUMENTS.piano;
    const now = ctx.currentTime;

    // Per-note gain (amplitude envelope)
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(preset.sustain === 1 ? volume * 0.9 : volume, now + preset.attack);
    if (preset.decay > 0) {
      noteGain.gain.exponentialRampToValueAtTime(
        Math.max(0.001, volume * preset.sustain),
        now + preset.attack + preset.decay
      );
    }

    // Filter
    const filter = ctx.createBiquadFilter();
    filter.type = preset.filterType;
    filter.frequency.value = preset.filterFreq;
    filter.Q.value = preset.filterQ;

    // Oscillators (harmonics)
    const oscs = preset.harmonics.map((amp, i) => {
      const osc = ctx.createOscillator();
      osc.type = preset.waveform;
      osc.frequency.value = freq * (i + 1);

      const harmGain = ctx.createGain();
      harmGain.gain.value = amp / preset.harmonics.length;

      osc.connect(harmGain);
      harmGain.connect(filter);
      osc.start(now);
      return osc;
    });

    filter.connect(noteGain);
    noteGain.connect(masterGain);

    activeNodes.set(key, { oscs, noteGain, filter, preset, volume, startTime: now });
  }

  /** Stop a note (note-off) */
  function noteOff(key, immediate = false) {
    if (!ctx) return;
    const node = activeNodes.get(key);
    if (!node) return;

    const now = ctx.currentTime;
    const { oscs, noteGain, preset } = node;
    const release = immediate ? 0.01 : (preset.release || 0.3);

    noteGain.gain.cancelScheduledValues(now);
    noteGain.gain.setValueAtTime(noteGain.gain.value, now);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + release);

    oscs.forEach(osc => {
      try { osc.stop(now + release + 0.05); } catch (_) { /* already stopped */ }
    });

    activeNodes.delete(key);
  }

  /** Stop all active notes */
  function allNotesOff() {
    for (const key of activeNodes.keys()) {
      noteOff(key, false);
    }
  }

  function setVolume(v) {
    if (!ctx) return;
    masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
  }

  function setReverb(v) {
    if (!ctx) return;
    dryGain.gain.setTargetAtTime(1 - v * 0.9, ctx.currentTime, 0.05);
    reverbGain.gain.setTargetAtTime(v * 0.9, ctx.currentTime, 0.05);
  }

  function getAnalyser() { return analyser; }
  function getContext()  { return ctx; }

  return { init, noteOn, noteOff, allNotesOff, setVolume, setReverb, getAnalyser, getContext, noteFrequency };
})();

/* ================================================================
   STATE
   ================================================================ */

const State = {
  currentInstrument: 'piano',
  currentOctave:     4,      // base octave offset (affects octave 3/4/5 keys proportionally)
  octaveShift:       0,      // -2 to +2 shift applied to all keys
  volume:            0.8,
  reverbAmount:      0.2,
  tempo:             120,
  sustain:           false,
  isRecording:       false,
  recordingStart:    null,
  recordedNotes:     [],
  playbackTimers:    [],
  notesPlayed:       0,
  isPlayingDemo:     false,
  demoTimers:        [],
  currentSong:       'dharkan',
  pressedKeys:       new Set(),
};

/* ================================================================
   PIANO KEYBOARD RENDERING
   ================================================================ */

function renderPiano() {
  const container = document.getElementById('piano');
  container.innerHTML = '';

  // Build reverse lookup: "note+octave" → keyboard char(s)
  const noteToKey = {};
  for (const [char, [note, oct]] of Object.entries(KEY_MAP)) {
    const k = `${note}${oct}`;
    if (!noteToKey[k]) noteToKey[k] = [];
    noteToKey[k].push(char.toUpperCase());
  }

  // Layout white keys first, then position black keys on top
  const whiteKeys = PIANO_RANGE.filter(({ note }) => !note.includes('#'));
  const whiteWidth = 36; // px per white key (incl margin)

  PIANO_RANGE.forEach(({ note, octave }) => {
    const isBlack = note.includes('#');
    const keyEl = document.createElement('button');
    const keyId = `${note}${octave}`;

    keyEl.classList.add('key', isBlack ? 'black' : 'white');
    keyEl.dataset.note = note;
    keyEl.dataset.octave = octave;
    keyEl.id = `key-${keyId}`;
    keyEl.setAttribute('aria-label', `${note} ${octave}`);

    // Shortcut label
    const shortcut = noteToKey[keyId] ? noteToKey[keyId].join('/') : '';
    const noteName = document.createElement('span');
    noteName.className = 'key-note-name';
    noteName.textContent = note + octave;

    const label = document.createElement('span');
    label.className = 'key-label';
    label.textContent = shortcut;

    keyEl.appendChild(noteName);
    keyEl.appendChild(label);

    // Position black keys absolutely between white keys
    if (isBlack) {
      // Map note → how many white-key slots to the left
      const blackOffsets = { 'C#': 0.55, 'D#': 1.55, 'F#': 3.55, 'G#': 4.55, 'A#': 5.55 };
      const octaveStart = (octave - 3) * 7; // white keys per octave = 7
      const offset = octaveStart + (blackOffsets[note] || 0);
      keyEl.style.left = `${offset * whiteWidth + 4}px`;
    }

    // Mouse events
    keyEl.addEventListener('mousedown', (e) => {
      e.preventDefault();
      triggerNote(note, parseInt(octave), 'mouse');
    });
    keyEl.addEventListener('mouseup',   () => releaseNote(note, parseInt(octave)));
    keyEl.addEventListener('mouseleave', () => releaseNote(note, parseInt(octave)));
    keyEl.addEventListener('touchstart', (e) => {
      e.preventDefault();
      triggerNote(note, parseInt(octave), 'mouse');
    }, { passive: false });
    keyEl.addEventListener('touchend', () => releaseNote(note, parseInt(octave)));

    container.appendChild(keyEl);
  });

  // Set container width based on white key count
  const totalWhite = whiteKeys.length;
  container.style.width = `${totalWhite * whiteWidth + 10}px`;
}

/* ================================================================
   NOTE TRIGGERING
   ================================================================ */

function triggerNote(noteName, octave, source = 'keyboard') {
  AudioEngine.noteOn(noteName, octave, State.currentInstrument, State.volume);

  const keyEl = document.getElementById(`key-${noteName}${octave}`);
  if (keyEl) {
    keyEl.classList.add('active', 'playing');
    setTimeout(() => keyEl.classList.remove('playing'), 400);
  }

  updateNoteDisplay(noteName, octave);

  if (State.isRecording) {
    const elapsed = (Date.now() - State.recordingStart) / 1000;
    State.recordedNotes.push({ noteName, octave, time: elapsed, instrument: State.currentInstrument });
    addRecordedNoteToList(noteName, octave, elapsed);
  }

  State.notesPlayed++;
  document.getElementById('stat-notes').textContent = State.notesPlayed;
}

function releaseNote(noteName, octave) {
  if (!State.sustain) {
    const key = `${noteName}${octave}`;
    AudioEngine.noteOff(key, false);
  }
  const keyEl = document.getElementById(`key-${noteName}${octave}`);
  if (keyEl) keyEl.classList.remove('active');
}

function updateNoteDisplay(noteName, octave) {
  const disp = document.getElementById('note-display');
  const stat = document.getElementById('status-display');
  const octaveDisp = document.getElementById('octave-display');

  disp.textContent = `${NOTE_DISPLAY[noteName]}${octave}`;
  stat.textContent = `♪ Playing ${NOTE_DISPLAY[noteName]}${octave} — ${INSTRUMENTS[State.currentInstrument].name}`;
  octaveDisp.textContent = octave;
}

/* ================================================================
   KEYBOARD INPUT
   ================================================================ */

document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.target.tagName === 'INPUT') return;

  const key = e.key.toLowerCase();

  // Function key shortcuts
  if (e.key === 'F1') { e.preventDefault(); document.getElementById('btn-record').click(); return; }
  if (e.key === 'F2') { e.preventDefault(); document.getElementById('btn-stop').click(); return; }
  if (e.key === 'F3') { e.preventDefault(); document.getElementById('btn-play').click(); return; }

  // Octave shift
  if (e.key === 'ArrowUp')   { e.preventDefault(); shiftOctave(1); return; }
  if (e.key === 'ArrowDown') { e.preventDefault(); shiftOctave(-1); return; }

  // Sustain on Space
  if (e.key === ' ') {
    e.preventDefault();
    const toggle = document.getElementById('sustain-toggle');
    toggle.checked = !toggle.checked;
    State.sustain = toggle.checked;
    document.getElementById('status-display').textContent = `Sustain ${State.sustain ? 'ON' : 'OFF'}`;
    return;
  }

  if (State.pressedKeys.has(key)) return;

  const mapping = KEY_MAP[key];
  if (!mapping) return;

  State.pressedKeys.add(key);
  const [noteName, baseOctave] = mapping;
  const octave = baseOctave + State.octaveShift;
  if (octave < 0 || octave > 8) return;

  triggerNote(noteName, octave, 'keyboard');
});

document.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  State.pressedKeys.delete(key);

  const mapping = KEY_MAP[key];
  if (!mapping) return;

  const [noteName, baseOctave] = mapping;
  const octave = baseOctave + State.octaveShift;
  releaseNote(noteName, octave);
});

/* ================================================================
   OCTAVE SHIFT
   ================================================================ */

function shiftOctave(delta) {
  const newShift = State.octaveShift + delta;
  if (newShift < -2 || newShift > 2) return;
  State.octaveShift = newShift;
  const baseLabel = 4 + State.octaveShift;
  document.getElementById('octave-display').textContent = baseLabel;
  document.getElementById('status-display').textContent = `Octave shifted to ${baseLabel}`;
}

document.getElementById('octave-up').addEventListener('click', () => shiftOctave(1));
document.getElementById('octave-down').addEventListener('click', () => shiftOctave(-1));

/* ================================================================
   INSTRUMENT SELECTION
   ================================================================ */

document.getElementById('instrument-grid').addEventListener('click', (e) => {
  const btn = e.target.closest('.instrument-btn');
  if (!btn) return;

  document.querySelectorAll('.instrument-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  State.currentInstrument = btn.dataset.instrument;
  document.getElementById('stat-instrument').textContent =
    INSTRUMENTS[State.currentInstrument].name;
  document.getElementById('status-display').textContent =
    `Instrument: ${INSTRUMENTS[State.currentInstrument].name}`;
});

/* ================================================================
   CONTROLS (Volume, Reverb, Tempo)
   ================================================================ */

document.getElementById('volume-slider').addEventListener('input', (e) => {
  State.volume = e.target.value / 100;
  AudioEngine.setVolume(State.volume);
  document.getElementById('volume-value').textContent = `${e.target.value}%`;
});

document.getElementById('reverb-slider').addEventListener('input', (e) => {
  State.reverbAmount = e.target.value / 100;
  AudioEngine.setReverb(State.reverbAmount);
  document.getElementById('reverb-value').textContent = `${e.target.value}%`;
});

document.getElementById('tempo-slider').addEventListener('input', (e) => {
  State.tempo = parseInt(e.target.value, 10);
  document.getElementById('tempo-value').textContent = `${State.tempo} BPM`;
});

document.getElementById('sustain-toggle').addEventListener('change', (e) => {
  State.sustain = e.target.checked;
  if (!State.sustain) AudioEngine.allNotesOff();
});

/* ================================================================
   RECORDING
   ================================================================ */

document.getElementById('btn-record').addEventListener('click', () => {
  if (State.isRecording) return;
  AudioEngine.init();

  State.isRecording = true;
  State.recordingStart = Date.now();
  State.recordedNotes = [];

  document.getElementById('recording-list').innerHTML = '';
  document.getElementById('btn-record').classList.add('active-rec');
  document.getElementById('btn-stop').disabled = false;
  document.getElementById('btn-play').disabled = true;
  document.getElementById('rec-indicator').classList.add('visible');
  document.getElementById('status-display').textContent = 'Recording… Play your melody!';

  // Duration counter
  State._recInterval = setInterval(() => {
    const elapsed = ((Date.now() - State.recordingStart) / 1000).toFixed(1);
    document.getElementById('stat-duration').textContent = `${elapsed}s`;
  }, 100);
});

document.getElementById('btn-stop').addEventListener('click', () => {
  if (State.isRecording) {
    State.isRecording = false;
    clearInterval(State._recInterval);
    document.getElementById('btn-record').classList.remove('active-rec');
    document.getElementById('btn-stop').disabled = true;
    document.getElementById('btn-play').disabled = State.recordedNotes.length === 0;
    document.getElementById('rec-indicator').classList.remove('visible');
    document.getElementById('status-display').textContent =
      `Recording saved — ${State.recordedNotes.length} notes`;
    AudioEngine.allNotesOff();
  }
  // Stop demo
  if (State.isPlayingDemo) {
    stopDemo();
  }
});

document.getElementById('btn-play').addEventListener('click', () => {
  if (State.recordedNotes.length === 0) return;
  playRecording();
});

document.getElementById('btn-clear').addEventListener('click', () => {
  State.recordedNotes = [];
  State.isRecording = false;
  clearInterval(State._recInterval);
  document.getElementById('recording-list').innerHTML =
    '<p class="empty-msg">No notes recorded yet.<br/>Press REC and play!</p>';
  document.getElementById('btn-record').classList.remove('active-rec');
  document.getElementById('btn-stop').disabled = true;
  document.getElementById('btn-play').disabled = true;
  document.getElementById('rec-indicator').classList.remove('visible');
  document.getElementById('stat-duration').textContent = '0.0s';
  document.getElementById('status-display').textContent = 'Recording cleared';
  AudioEngine.allNotesOff();
  stopDemo();
});

function addRecordedNoteToList(noteName, octave, time) {
  const list = document.getElementById('recording-list');
  const emptyMsg = list.querySelector('.empty-msg');
  if (emptyMsg) emptyMsg.remove();

  const item = document.createElement('div');
  item.className = 'rec-note-item';
  item.innerHTML = `
    <span class="rec-note-badge">${noteName}${octave}</span>
    <span class="rec-note-time">${time.toFixed(2)}s</span>
  `;
  list.appendChild(item);
  list.scrollTop = list.scrollHeight;
}

function playRecording() {
  if (State.recordedNotes.length === 0) return;

  // Clear existing timers
  State.playbackTimers.forEach(clearTimeout);
  State.playbackTimers = [];
  AudioEngine.allNotesOff();

  document.getElementById('status-display').textContent = 'Playing recording…';
  document.getElementById('btn-play').disabled = true;

  State.recordedNotes.forEach((rec, idx) => {
    const t = setTimeout(() => {
      AudioEngine.noteOn(rec.noteName, rec.octave, rec.instrument, State.volume);

      const keyEl = document.getElementById(`key-${rec.noteName}${rec.octave}`);
      if (keyEl) {
        keyEl.classList.add('active', 'playing');
        setTimeout(() => {
          keyEl.classList.remove('active', 'playing');
          AudioEngine.noteOff(`${rec.noteName}${rec.octave}`, false);
        }, 400);
      }
    }, rec.time * 1000);
    State.playbackTimers.push(t);
  });

  const totalDuration = State.recordedNotes[State.recordedNotes.length - 1].time + 1;
  const endTimer = setTimeout(() => {
    document.getElementById('status-display').textContent = 'Playback finished';
    document.getElementById('btn-play').disabled = false;
  }, totalDuration * 1000);
  State.playbackTimers.push(endTimer);
}

/* ================================================================
   SONG DEMO
   ================================================================ */

function renderSongSheetClean(songKey) {
  const song = SONGS[songKey];
  if (!song) return;
  State.currentSong = songKey;

  const display = document.getElementById('song-display');
  display.innerHTML = '';

  const title = document.createElement('div');
  title.className = 'song-title';
  title.textContent = song.title;
  display.appendChild(title);

  const hint = document.createElement('p');
  hint.style.cssText = 'font-size:0.75rem;color:var(--clr-text-dim);margin-bottom:12px;';
  hint.textContent = song.hint;
  display.appendChild(hint);

  song.lines.forEach(line => {
    const lineEl = document.createElement('div');
    lineEl.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;';

    line.words.forEach((word, wi) => {
      if (wi > 0) {
        const sep = document.createElement('span');
        sep.style.cssText = 'color:var(--clr-text-dim);font-size:1.2rem;padding-bottom:6px;';
        sep.textContent = '·';
        lineEl.appendChild(sep);
      }

      const wordWrap = document.createElement('div');
      wordWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:3px;';

      const keysRow = document.createElement('div');
      keysRow.style.cssText = 'display:flex;gap:3px;';

      word.keys.forEach(k => {
        const badge = document.createElement('span');
        badge.className = 'song-key-badge';
        badge.textContent = k;
        badge.title = `Click to play ${k}`;

        badge.addEventListener('click', () => {
          const mapping = KEY_MAP[k.toLowerCase()];
          if (mapping) {
            const [noteName, baseOctave] = mapping;
            const oct = baseOctave + State.octaveShift;
            triggerNote(noteName, oct, 'song');
            setTimeout(() => releaseNote(noteName, oct), 350);
          }
        });

        keysRow.appendChild(badge);
      });

      const syllable = document.createElement('span');
      syllable.style.cssText = 'font-size:0.65rem;color:var(--clr-text-dim);font-style:italic;';
      syllable.textContent = word.syllable;

      wordWrap.appendChild(keysRow);
      wordWrap.appendChild(syllable);
      lineEl.appendChild(wordWrap);
    });

    display.appendChild(lineEl);
  });
}

// Song tabs
document.getElementById('song-tabs').addEventListener('click', (e) => {
  const tab = e.target.closest('.song-tab');
  if (!tab) return;
  document.querySelectorAll('.song-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  renderSongSheetClean(tab.dataset.song);
});

// Demo play button
document.getElementById('btn-demo').addEventListener('click', () => {
  if (State.isPlayingDemo) {
    stopDemo();
    return;
  }
  playDemo(State.currentSong);
});

function playDemo(songKey) {
  const song = SONGS[songKey];
  if (!song) return;

  AudioEngine.init();
  State.isPlayingDemo = true;
  State.demoTimers = [];

  const demoBtn = document.getElementById('btn-demo');
  demoBtn.textContent = '⏹ Stop Demo';

  document.getElementById('status-display').textContent = `Playing demo: ${song.title}`;

  // Calculate note speed based on tempo (BPM)
  const beatMs = (60 / State.tempo) * 1000;

  let cursor = 0;
  song.sequence.forEach((step) => {
    const [noteName, octave, rawDuration] = step;
    const duration = rawDuration * (120 / State.tempo);

    const t = setTimeout(() => {
      if (!noteName) return; // rest

      AudioEngine.noteOn(noteName, octave, State.currentInstrument, State.volume * 0.85);

      const keyEl = document.getElementById(`key-${noteName}${octave}`);
      if (keyEl) {
        keyEl.classList.add('active', 'playing');
      }
      updateNoteDisplay(noteName, octave);

      const offT = setTimeout(() => {
        AudioEngine.noteOff(`${noteName}${octave}`, false);
        if (keyEl) keyEl.classList.remove('active');
      }, duration * 0.85);
      State.demoTimers.push(offT);

    }, cursor);

    State.demoTimers.push(t);
    cursor += duration;
  });

  // End of demo
  const endT = setTimeout(() => {
    stopDemo();
    document.getElementById('status-display').textContent = 'Demo finished — Try it yourself!';
  }, cursor + 500);
  State.demoTimers.push(endT);
}

function stopDemo() {
  State.demoTimers.forEach(clearTimeout);
  State.demoTimers = [];
  State.isPlayingDemo = false;
  AudioEngine.allNotesOff();
  document.querySelectorAll('.key').forEach(k => k.classList.remove('active', 'playing'));
  const demoBtn = document.getElementById('btn-demo');
  if (demoBtn) demoBtn.textContent = '▶ Play Demo';
}

/* ================================================================
   VISUALIZERS
   ================================================================ */

function startVisualizers() {
  AudioEngine.init();
  const analyser = AudioEngine.getAnalyser();
  if (!analyser) return;

  const waveCanvas = document.getElementById('visualizer');
  const waveCtx = waveCanvas.getContext('2d');
  const specCanvas = document.getElementById('spectrum');
  const specCtx = specCanvas.getContext('2d');

  const bufLen = analyser.frequencyBinCount;
  const timeDomain = new Uint8Array(bufLen);
  const freqDomain = new Uint8Array(bufLen);

  function drawWaveform() {
    analyser.getByteTimeDomainData(timeDomain);

    const w = waveCanvas.width;
    const h = waveCanvas.height;
    waveCtx.clearRect(0, 0, w, h);

    waveCtx.fillStyle = '#09090f';
    waveCtx.fillRect(0, 0, w, h);

    waveCtx.lineWidth = 2;
    waveCtx.strokeStyle = '#00d4ff';
    waveCtx.shadowColor = '#00d4ff';
    waveCtx.shadowBlur = 6;
    waveCtx.beginPath();

    const sliceW = w / bufLen;
    let x = 0;
    for (let i = 0; i < bufLen; i++) {
      const v = timeDomain[i] / 128.0;
      const y = (v * h) / 2;
      if (i === 0) waveCtx.moveTo(x, y);
      else waveCtx.lineTo(x, y);
      x += sliceW;
    }
    waveCtx.lineTo(w, h / 2);
    waveCtx.stroke();
  }

  function drawSpectrum() {
    analyser.getByteFrequencyData(freqDomain);

    const w = specCanvas.width;
    const h = specCanvas.height;
    specCtx.clearRect(0, 0, w, h);

    specCtx.fillStyle = '#0a0a14';
    specCtx.fillRect(0, 0, w, h);

    const barWidth = (w / bufLen) * 2.5;
    let bx = 0;

    for (let i = 0; i < bufLen; i++) {
      const bh = (freqDomain[i] / 255) * h;
      const hue = 200 + (freqDomain[i] / 255) * 120;
      specCtx.fillStyle = `hsl(${hue}, 100%, ${40 + (freqDomain[i] / 255) * 30}%)`;
      specCtx.fillRect(bx, h - bh, barWidth, bh);
      bx += barWidth + 1;
      if (bx > w) break;
    }
  }

  function loop() {
    drawWaveform();
    drawSpectrum();
    requestAnimationFrame(loop);
  }
  loop();
}

/* ================================================================
   INIT
   ================================================================ */

function init() {
  renderPiano();
  renderSongSheetClean('dharkan');
  startVisualizers();

  // Initialize audio on first interaction
  document.addEventListener('click', () => AudioEngine.init(), { once: true });
  document.addEventListener('keydown', () => AudioEngine.init(), { once: true });

  // Set initial stats
  document.getElementById('stat-instrument').textContent = 'Piano';
  document.getElementById('stat-notes').textContent = '0';
  document.getElementById('stat-duration').textContent = '0.0s';

  // Init sliders
  AudioEngine.setVolume(State.volume);
  AudioEngine.setReverb(State.reverbAmount);
}

document.addEventListener('DOMContentLoaded', init);
