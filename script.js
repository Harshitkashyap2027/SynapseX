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

/* ================================================================
   DRUM MAP — Number keys 1–0
   ================================================================ */

/** Maps number keys 0-9 → drum preset */
const DRUM_MAP = {
  '1': { name: 'Kick',    emoji: '🥁', color: '#ff3b3b', colorRgb: '255,59,59'   },
  '2': { name: 'Snare',   emoji: '🪘', color: '#ff9900', colorRgb: '255,153,0'   },
  '3': { name: 'Hi-Hat',  emoji: '🎩', color: '#ffcc00', colorRgb: '255,204,0'   },
  '4': { name: 'Open HH', emoji: '🎪', color: '#00ff88', colorRgb: '0,255,136'   },
  '5': { name: 'Clap',    emoji: '👏', color: '#00d4ff', colorRgb: '0,212,255'   },
  '6': { name: 'Tom Lo',  emoji: '🎯', color: '#ff2fff', colorRgb: '255,47,255'  },
  '7': { name: 'Tom Mid', emoji: '🎲', color: '#7b2fff', colorRgb: '123,47,255'  },
  '8': { name: 'Tom Hi',  emoji: '🎮', color: '#00b4ff', colorRgb: '0,180,255'   },
  '9': { name: 'Crash',   emoji: '💥', color: '#ffb800', colorRgb: '255,184,0'   },
  '0': { name: 'Rim',     emoji: '⭕', color: '#e8e8ff', colorRgb: '232,232,255' },
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

  /* ── Drum synthesis helpers ── */

  function _noiseBuffer(duration) {
    const len = Math.round(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function _drumKick(vol) {
    const now = ctx.currentTime;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.exponentialRampToValueAtTime(0.001, now + 0.5);
    gain.gain.setValueAtTime(vol * 2.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain); gain.connect(masterGain);
    osc.start(now); osc.stop(now + 0.5);

    // Transient click
    const src  = ctx.createBufferSource();
    src.buffer = _noiseBuffer(0.02);
    const cg   = ctx.createGain();
    cg.gain.setValueAtTime(vol * 0.7, now);
    cg.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    src.connect(cg); cg.connect(masterGain);
    src.start(now);
  }

  function _drumSnare(vol) {
    const now = ctx.currentTime;

    // Noise
    const nSrc = ctx.createBufferSource();
    nSrc.buffer = _noiseBuffer(0.25);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass'; filter.frequency.value = 2000;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(vol, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    nSrc.connect(filter); filter.connect(ng); ng.connect(masterGain);
    nSrc.start(now);

    // Body tone
    const osc  = ctx.createOscillator();
    const og   = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);
    og.gain.setValueAtTime(vol * 0.8, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(og); og.connect(masterGain);
    osc.start(now); osc.stop(now + 0.12);
  }

  function _drumHiHat(vol, duration) {
    const now  = ctx.currentTime;
    const src  = ctx.createBufferSource();
    src.buffer = _noiseBuffer(duration);
    const f1   = ctx.createBiquadFilter();
    f1.type = 'highpass'; f1.frequency.value = 7000;
    const f2   = ctx.createBiquadFilter();
    f2.type = 'peaking'; f2.frequency.value = 10000; f2.gain.value = 6;
    const ng   = ctx.createGain();
    ng.gain.setValueAtTime(vol * 0.5, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + duration);
    src.connect(f1); f1.connect(f2); f2.connect(ng); ng.connect(masterGain);
    src.start(now);
  }

  function _drumClap(vol) {
    const now = ctx.currentTime;
    [0, 0.01, 0.022].forEach(offset => {
      const src  = ctx.createBufferSource();
      src.buffer = _noiseBuffer(0.15);
      const f    = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 0.8;
      const g    = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.8, now + offset);
      g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
      src.connect(f); f.connect(g); g.connect(masterGain);
      src.start(now + offset);
    });
  }

  function _drumTom(vol, startFreq) {
    const now  = ctx.currentTime;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.3, now + 0.35);
    gain.gain.setValueAtTime(vol * 1.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain); gain.connect(masterGain);
    osc.start(now); osc.stop(now + 0.4);
  }

  function _drumCrash(vol) {
    const now  = ctx.currentTime;
    const src  = ctx.createBufferSource();
    src.buffer = _noiseBuffer(2.0);
    const f    = ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 5000;
    const g    = ctx.createGain();
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    src.connect(f); f.connect(g); g.connect(masterGain);
    src.start(now);
  }

  function _drumRim(vol) {
    const now  = ctx.currentTime;
    const osc  = ctx.createOscillator();
    const og   = ctx.createGain();
    osc.type = 'triangle'; osc.frequency.value = 400;
    og.gain.setValueAtTime(vol, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(og); og.connect(masterGain);
    osc.start(now); osc.stop(now + 0.06);

    const src  = ctx.createBufferSource();
    src.buffer = _noiseBuffer(0.04);
    const ng   = ctx.createGain();
    ng.gain.setValueAtTime(vol * 0.5, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    src.connect(ng); ng.connect(masterGain);
    src.start(now);
  }

  /** Play a synthesized drum sound by type key ('1'–'9', '0') */
  function playDrum(type, volume = 0.8) {
    init();
    if (ctx.state === 'suspended') ctx.resume();
    switch (type) {
      case '1': _drumKick(volume);          break;
      case '2': _drumSnare(volume);         break;
      case '3': _drumHiHat(volume, 0.05);   break;
      case '4': _drumHiHat(volume, 0.35);   break;
      case '5': _drumClap(volume);          break;
      case '6': _drumTom(volume, 80);       break;
      case '7': _drumTom(volume, 120);      break;
      case '8': _drumTom(volume, 200);      break;
      case '9': _drumCrash(volume);         break;
      case '0': _drumRim(volume);           break;
    }
  }

  return { init, noteOn, noteOff, allNotesOff, setVolume, setReverb, getAnalyser, getContext, noteFrequency, playDrum };
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

  // ── Numeric keys → drum pads ──
  if (/^[0-9]$/.test(e.key)) {
    State.pressedKeys.add(e.key);
    AudioEngine.playDrum(e.key, State.volume);
    flashDrumPad(e.key);
    const drumInfo = DRUM_MAP[e.key];
    if (drumInfo) {
      document.getElementById('note-display').textContent = drumInfo.emoji;
      document.getElementById('status-display').textContent =
        `🥁 ${drumInfo.name} — Drum Pad [${e.key}]`;
    }
    return;
  }

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

  // Release numeric key
  if (/^[0-9]$/.test(e.key)) {
    State.pressedKeys.delete(e.key);
    return;
  }

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
   DRUM PADS UI
   ================================================================ */

/** Render drum pad grid from DRUM_MAP */
function renderDrumPads() {
  const grid = document.getElementById('drum-pads-grid');
  if (!grid) return;
  grid.innerHTML = '';

  // Order: 1 2 3 4 5 / 6 7 8 9 0
  const order = ['1','2','3','4','5','6','7','8','9','0'];
  order.forEach(num => {
    const info = DRUM_MAP[num];
    const pad  = document.createElement('button');
    pad.className   = 'drum-pad';
    pad.id          = `drum-pad-${num}`;
    pad.title       = `${info.name} [${num}]`;
    pad.style.setProperty('--pad-color',     info.color);
    pad.style.setProperty('--pad-color-rgb', info.colorRgb);
    pad.innerHTML = `
      <span class="pad-num">${num}</span>
      <span class="pad-emoji">${info.emoji}</span>
      <span class="pad-name">${info.name}</span>
    `;
    pad.addEventListener('mousedown', (e) => {
      e.preventDefault();
      AudioEngine.playDrum(num, State.volume);
      flashDrumPad(num);
      document.getElementById('note-display').textContent = info.emoji;
      document.getElementById('status-display').textContent =
        `🥁 ${info.name} — Drum Pad [${num}]`;
    });
    pad.addEventListener('touchstart', (e) => {
      e.preventDefault();
      AudioEngine.playDrum(num, State.volume);
      flashDrumPad(num);
    }, { passive: false });
    grid.appendChild(pad);
  });
}

/** Flash a drum pad element (visual hit feedback) */
function flashDrumPad(num) {
  const pad = document.getElementById(`drum-pad-${num}`);
  if (!pad) return;
  pad.classList.add('hitting');

  // Ripple effect
  const ripple = document.createElement('span');
  ripple.className = 'pad-ripple';
  ripple.style.setProperty('--pad-color', DRUM_MAP[num]?.color || '#fff');
  pad.appendChild(ripple);
  setTimeout(() => { ripple.remove(); }, 420);

  setTimeout(() => pad.classList.remove('hitting'), 150);
}

/* ================================================================
   MUSIC ANALYZER — FFT-based pitch detection
   ================================================================ */

const MusicAnalyzer = (() => {
  let isAnalyzing  = false;
  let detectedSeq  = [];
  let playTimers   = [];

  /* ── Minimal in-place Cooley-Tukey FFT ── */
  function _fft(re, im) {
    const n = re.length;
    // Bit-reversal permutation
    let j = 0;
    for (let i = 1; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        let t = re[i]; re[i] = re[j]; re[j] = t;
        t = im[i]; im[i] = im[j]; im[j] = t;
      }
    }
    // Butterfly stages
    for (let len = 2; len <= n; len <<= 1) {
      const ang = -2 * Math.PI / len;
      const wr  = Math.cos(ang);
      const wi  = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let uRe = 1, uIm = 0;
        for (let k = 0; k < (len >> 1); k++) {
          const idx  = i + k + (len >> 1);
          const tRe  = uRe * re[idx] - uIm * im[idx];
          const tIm  = uRe * im[idx] + uIm * re[idx];
          const eRe  = re[i + k], eIm = im[i + k];
          re[i + k]  = eRe + tRe;  im[i + k]  = eIm + tIm;
          re[idx]    = eRe - tRe;  im[idx]    = eIm - tIm;
          const nwRe = uRe * wr - uIm * wi;
          uIm        = uRe * wi + uIm * wr;
          uRe        = nwRe;
        }
      }
    }
  }

  /** Convert frequency (Hz) to nearest note {name, octave} or null */
  function _freqToNote(freq) {
    if (freq < 27.5 || freq > 4186) return null;
    const midi     = Math.round(12 * Math.log2(freq / 440) + 69);
    const octave   = Math.floor(midi / 12) - 1;
    const noteIdx  = ((midi % 12) + 12) % 12;
    if (octave < 2 || octave > 7) return null;
    return { name: NOTES[noteIdx], octave };
  }

  /** Find keyboard char for a given note/octave (or '?' if unmapped) */
  function _noteToKey(noteName, octave) {
    for (const [ch, [n, o]] of Object.entries(KEY_MAP)) {
      if (n === noteName && o === octave) return ch.toUpperCase();
    }
    return null;
  }

  /** Core analysis: returns array of {name, octave, duration} */
  async function _extractNotes(channelData, sampleRate, onProgress) {
    const FFT_SIZE          = 4096;
    const HOP               = Math.round(sampleRate * 0.1);  // 100 ms hop
    const MIN_MELODY_FREQ   = 50;    // Hz – lowest note to detect
    const MAX_MELODY_FREQ   = 2000;  // Hz – highest note to detect
    const MIN_RMS_THRESHOLD = 0.006; // silence gate – skip windows below this energy
    const MIN_NOTE_DURATION = 120;   // ms – discard notes shorter than this (likely noise)
    const totalWin  = Math.floor((channelData.length - FFT_SIZE) / HOP);

    const re = new Float32Array(FFT_SIZE);
    const im = new Float32Array(FFT_SIZE);

    const minBin = Math.ceil(MIN_MELODY_FREQ  * FFT_SIZE / sampleRate);
    const maxBin = Math.floor(MAX_MELODY_FREQ * FFT_SIZE / sampleRate);

    const notes    = [];
    let lastKey    = null;
    let lastNote   = null;

    for (let w = 0; w < totalWin; w++) {
      const start = w * HOP;

      // RMS energy gate — skip silent frames
      let rms = 0;
      for (let i = 0; i < FFT_SIZE; i++) rms += channelData[start + i] ** 2;
      rms = Math.sqrt(rms / FFT_SIZE);

      if (rms < MIN_RMS_THRESHOLD) {
        if (lastNote) { notes.push(lastNote); lastNote = null; lastKey = null; }
        if (w % 20 === 0) {
          onProgress((w / totalWin) * 100);
          await new Promise(r => setTimeout(r, 0));
        }
        continue;
      }

      // Fill FFT buffers with Hanning window
      for (let i = 0; i < FFT_SIZE; i++) {
        const win = 0.5 * (1 - Math.cos(2 * Math.PI * i / (FFT_SIZE - 1)));
        re[i] = channelData[start + i] * win;
        im[i] = 0;
      }

      _fft(re, im);

      // Find peak magnitude bin in musical range
      let peakMag = 0, peakBin = minBin;
      for (let b = minBin; b <= maxBin && b < FFT_SIZE / 2; b++) {
        const mag = re[b] * re[b] + im[b] * im[b];
        if (mag > peakMag) { peakMag = mag; peakBin = b; }
      }

      const freq     = peakBin * sampleRate / FFT_SIZE;
      const noteInfo = _freqToNote(freq);

      if (noteInfo) {
        const nKey = `${noteInfo.name}${noteInfo.octave}`;
        if (nKey !== lastKey) {
          if (lastNote) notes.push(lastNote);
          lastNote = { name: noteInfo.name, octave: noteInfo.octave, duration: 100 };
          lastKey  = nKey;
        } else if (lastNote) {
          lastNote.duration += 100;
        }
      } else {
        if (lastNote) { notes.push(lastNote); lastNote = null; lastKey = null; }
      }

      if (w % 10 === 0) {
        onProgress((w / totalWin) * 100);
        await new Promise(r => setTimeout(r, 0));
      }
    }
    if (lastNote) notes.push(lastNote);

    // Remove notes shorter than minimum duration — likely noise
    return notes.filter(n => n.duration >= MIN_NOTE_DURATION);
  }

  /** Public: analyse a File object and update the UI */
  async function analyzeFile(file) {
    if (isAnalyzing) return;
    isAnalyzing = true;
    detectedSeq = [];

    const progressEl   = document.getElementById('analysis-progress');
    const fillEl       = document.getElementById('progress-bar-fill');
    const labelEl      = document.getElementById('progress-label');
    const tuneEl       = document.getElementById('detected-tune');
    const notesRowEl   = document.getElementById('detected-notes-row');
    const fileNameEl   = document.getElementById('detected-filename');
    const playBtn      = document.getElementById('play-detected-btn');
    const saveBtn      = document.getElementById('save-detected-btn');

    progressEl.style.display = 'block';
    tuneEl.style.display     = 'none';
    fillEl.style.width       = '0%';
    labelEl.textContent      = `Analysing "${file.name}"…`;
    document.getElementById('status-display').textContent = `Analysing: ${file.name}`;

    try {
      const arrayBuf  = await file.arrayBuffer();
      const tmpCtx    = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuf  = await tmpCtx.decodeAudioData(arrayBuf);
      await tmpCtx.close();

      const notes = await _extractNotes(
        audioBuf.getChannelData(0),
        audioBuf.sampleRate,
        pct => { fillEl.style.width = `${pct.toFixed(0)}%`; }
      );

      detectedSeq = notes;

      progressEl.style.display = 'none';
      notesRowEl.innerHTML     = '';

      if (notes.length === 0) {
        notesRowEl.innerHTML =
          '<p style="color:var(--clr-text-muted);font-size:0.78rem;padding:4px 0;">' +
          'No clear melody detected. Try a simpler melody or a solo-instrument recording.</p>';
      } else {
        notes.forEach(note => {
          const keyChar = _noteToKey(note.name, note.octave);
          const badge   = document.createElement('div');
          badge.className = 'detected-note-badge';
          badge.title     = `${note.name}${note.octave} — click to preview`;
          badge.innerHTML = `
            <span class="detected-note-key">${keyChar || '?'}</span>
            <span class="detected-note-name">${note.name}${note.octave}</span>
          `;
          badge.addEventListener('click', () => {
            AudioEngine.noteOn(note.name, note.octave, State.currentInstrument, State.volume);
            setTimeout(() => AudioEngine.noteOff(`${note.name}${note.octave}`, false), 300);
          });
          notesRowEl.appendChild(badge);
        });
      }

      fileNameEl.textContent = `Source: ${file.name} · ${notes.length} note(s) detected`;
      tuneEl.style.display   = 'block';
      playBtn.disabled       = notes.length === 0;
      saveBtn.disabled       = notes.length === 0;

      document.getElementById('status-display').textContent =
        `✓ Detected ${notes.length} note(s) from "${file.name}"`;

    } catch (err) {
      progressEl.style.display = 'none';
      document.getElementById('status-display').textContent =
        `⚠ Error: ${err.message}`;
    } finally {
      isAnalyzing = false;
    }
  }

  /** Playback the detected sequence */
  function playDetected() {
    if (detectedSeq.length === 0) return;
    playTimers.forEach(clearTimeout);
    playTimers = [];
    AudioEngine.allNotesOff();

    const playBtn = document.getElementById('play-detected-btn');
    playBtn.disabled    = true;
    playBtn.textContent = '⏹ Stop';

    document.getElementById('status-display').textContent = 'Playing detected tune…';

    let cursor = 0;
    detectedSeq.forEach(note => {
      const t = setTimeout(() => {
        AudioEngine.noteOn(note.name, note.octave, State.currentInstrument, State.volume);
        const keyEl = document.getElementById(`key-${note.name}${note.octave}`);
        if (keyEl) {
          keyEl.classList.add('active', 'playing');
          setTimeout(() => {
            keyEl.classList.remove('active', 'playing');
            AudioEngine.noteOff(`${note.name}${note.octave}`, false);
          }, note.duration * 0.8);
        }
        updateNoteDisplay(note.name, note.octave);
      }, cursor);
      playTimers.push(t);
      cursor += note.duration;
    });

    const endT = setTimeout(() => {
      playBtn.disabled    = false;
      playBtn.textContent = '▶ Play Detected Tune';
      document.getElementById('status-display').textContent =
        'Detected tune playback finished';
    }, cursor + 500);
    playTimers.push(endT);
  }

  /** Save detected sequence as a new Song Sheet tab */
  function saveAsSongSheet() {
    if (detectedSeq.length === 0) return;
    /** Maximum notes shown in the Song Sheet lyric view */
    const MAX_DETECTED_NOTES_DISPLAY = 30;
    const songKey = `detected_${Date.now()}`;
    const fileName = document.getElementById('detected-filename').textContent
      .replace('Source:', '').split('·')[0].trim();

    SONGS[songKey] = {
      title: `🎵 ${fileName || 'Detected Song'}`,
      hint:  'Detected from uploaded audio · Click ▶ Play Demo to hear it',
      lines: [{
        words: detectedSeq.slice(0, MAX_DETECTED_NOTES_DISPLAY).map(note => ({
          syllable: `${note.name}${note.octave}`,
          keys: [_noteToKey(note.name, note.octave) || '?'],
        })),
      }],
      sequence: detectedSeq.map(note => [note.name, note.octave, note.duration]),
    };

    const tabsEl  = document.getElementById('song-tabs');
    const newTab  = document.createElement('button');
    newTab.className    = 'song-tab';
    newTab.dataset.song = songKey;
    newTab.textContent  = `🎵 ${fileName.split('.')[0] || 'Detected'}`;
    tabsEl.appendChild(newTab);

    document.querySelectorAll('.song-tab').forEach(t => t.classList.remove('active'));
    newTab.classList.add('active');
    renderSongSheetClean(songKey);

    document.getElementById('status-display').textContent =
      '✓ Detected tune saved as Song Sheet!';
  }

  /** Stop any in-progress detected-tune playback */
  function stopPlayback() {
    playTimers.forEach(clearTimeout);
    playTimers = [];
    AudioEngine.allNotesOff();
    const playBtn = document.getElementById('play-detected-btn');
    if (playBtn) {
      playBtn.textContent = '▶ Play Detected Tune';
      playBtn.disabled    = detectedSeq.length === 0;
    }
  }

  return { analyzeFile, playDetected, stopPlayback, saveAsSongSheet };
})();

/* ================================================================
   MUSIC UPLOAD EVENT HANDLERS
   ================================================================ */

(function setupUpload() {
  const zone   = document.getElementById('upload-zone');
  const input  = document.getElementById('music-upload');
  const playBtn = document.getElementById('play-detected-btn');
  const saveBtn = document.getElementById('save-detected-btn');

  // Click on zone triggers file picker
  zone.addEventListener('click', (e) => {
    if (e.target !== input) input.click();
  });

  input.addEventListener('change', () => {
    if (input.files && input.files[0]) {
      MusicAnalyzer.analyzeFile(input.files[0]);
      input.value = ''; // reset so same file can be re-selected
    }
  });

  // Drag-and-drop
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragging');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      MusicAnalyzer.analyzeFile(file);
    }
  });

  // Play / save buttons
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (playBtn.textContent.includes('Stop')) {
        MusicAnalyzer.stopPlayback();
      } else {
        MusicAnalyzer.playDetected();
      }
    });
  }
  if (saveBtn) saveBtn.addEventListener('click', () => MusicAnalyzer.saveAsSongSheet());
})();



function init() {
  renderPiano();
  renderDrumPads();
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
