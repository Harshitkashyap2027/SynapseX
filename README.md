# 🎹 SynapseX Music Studio

A **full-featured, browser-based music maker** built with pure HTML5, CSS3, and Vanilla JavaScript — no frameworks, no dependencies. Inspired by Casio-style keyboards, SynapseX lets you compose, record, and play back music right in your browser using your computer keyboard.

---

## 🎬 Live Demo

Open `index.html` in any modern browser and start playing. No installation, no server needed.

---

## ✨ Features

### 🎵 Instruments (6 presets)
| Instrument | Waveform | Character |
|---|---|---|
| **Piano** | Triangle | Quick decay, realistic strike |
| **Guitar** | Sawtooth | Plucked string, fast decay |
| **Harmonium** | Sine (harmonics) | Warm, sustained drone |
| **Organ** | Square | Full sustain, immediate attack |
| **Flute** | Sine | Breathy, medium attack |
| **Synth** | Sawtooth + filter | Resonant, electronic |

### 🥁 Drum Pads (NEW)
Press number keys **1–9** and **0** to trigger synthesised drum sounds:

| Key | Sound | Type |
|-----|-------|------|
| `1` | 🥁 Kick | Sub sine + transient click |
| `2` | 🪘 Snare | Filtered noise + body tone |
| `3` | 🎩 Hi-Hat (closed) | Short hi-frequency noise burst |
| `4` | 🎪 Open Hi-Hat | Longer hi-frequency noise |
| `5` | 👏 Clap | Triple layered noise bursts |
| `6` | 🎯 Tom Lo | Pitched sine with drop (~80 Hz) |
| `7` | 🎲 Tom Mid | Pitched sine with drop (~120 Hz) |
| `8` | 🎮 Tom Hi | Pitched sine with drop (~200 Hz) |
| `9` | 💥 Crash | Long filtered noise fade |
| `0` | ⭕ Rim Shot | Short click + noise |

Drum pads are also clickable on screen. Each pad has a unique colour glow and ripple animation on hit.

### 🎛️ Controls
- **Volume** slider (0–100%)
- **Reverb** slider (0–100%) — convolution reverb using generated impulse response
- **Tempo / BPM** slider (40–240 BPM) — affects demo playback speed
- **Octave Shift** (↑/↓ buttons or `Arrow Up` / `Arrow Down`) — shift all keys ±2 octaves
- **Sustain Pedal** toggle (or press `Space`)

### 🎙️ Recording & Playback
- Press **REC** (or `F1`) to start recording
- Press **STOP** (or `F2`) to end recording
- Press **PLAY** (or `F3`) to play back your recording with original timing
- Press **CLEAR** to wipe the session

### 🎵 Music Upload & Tune Detection (NEW)
Upload any audio file (MP3, WAV, OGG, M4A) and SynapseX will:

1. Decode the audio using the Web Audio API
2. Analyse pitch over time using a 4096-point FFT (Cooley-Tukey) with a 100ms hop
3. Map dominant frequencies to the nearest musical note
4. Display the detected melody as clickable keyboard-key badges
5. Allow playback of the detected tune using the selected instrument
6. Save the detected tune as a new Song Sheet tab for further modification

> **Tip:** Works best with simple single-instrument melodies or whistled/hummed recordings. Complex polyphonic music will detect the dominant harmonic.

### 🎼 Song Sheets (3 built-in)
| Song | Keys to Press |
|---|---|
| **Tum Dil Ke Dharkan Me** | `T U M` · `D I L` · `K E` · `D H A R` · `K A N` · `M E` |
| **Twinkle Twinkle** | `A A K K L L K` · `J J I I Q Q A` |
| **Happy Birthday** | `A A S A F E` · `A A S A G F` |

- Click **▶ Play Demo** to hear any song played automatically
- Click individual key badges in the song sheet to hear each note
- Tempo slider controls demo playback speed
- Upload audio → **Save as Song Sheet** to add custom detected songs

### 📊 Visualizers
- **Waveform oscilloscope** (left panel) — real-time time-domain display
- **Frequency spectrum** (top of piano) — FFT bar chart with colour mapping

---

## ⌨️ Keyboard Map

```
┌─────────────────────────────────────────────────────────────────────┐
│ Drum Pads (Number row):            1  2  3  4  5  6  7  8  9  0    │
│ Octave 4 Black Keys (QWERTY row):  W  E     T  Y  U     O  P       │
│ Octave 4 White Keys (Home row):    A  S  D  F  G  H  J             │
│ Octave 3 White Keys (Bottom row):  Z  X  C  V  B  N  M             │
│ Octave 5 White Keys:               Q  I  O  P     K  L  ;          │
│ Octave 5 Black Keys:               R (C#5)                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Global Shortcuts
| Shortcut | Action |
|----------|--------|
| `1`–`9`, `0` | Drum pads |
| `F1` | Start recording |
| `F2` | Stop recording / demo |
| `F3` | Play back recording |
| `Arrow Up` | Octave up (+1) |
| `Arrow Down` | Octave down (−1) |
| `Space` | Toggle sustain pedal |

### Note Reference
| Key | Note | Octave |
|-----|------|--------|
| `A` | C    | 4      |
| `W` | C#   | 4      |
| `S` | D    | 4      |
| `E` | D#   | 4      |
| `D` | E    | 4      |
| `F` | F    | 4      |
| `T` | F#   | 4      |
| `G` | G    | 4      |
| `Y` | G#   | 4      |
| `H` | A    | 4      |
| `U` | A#   | 4      |
| `J` | B    | 4      |
| `Z` | C    | 3      |
| `X` | D    | 3      |
| `C` | E    | 3      |
| `V` | F    | 3      |
| `B` | G    | 3      |
| `N` | A    | 3      |
| `M` | B    | 3      |
| `K` | G    | 5      |
| `L` | A    | 5      |
| `I` | D    | 5      |

---

## 🏗️ Project Structure

```
SynapseX/
├── index.html   # Semantic HTML layout — header, piano, drum pads, upload section, sidebars, song sheet
├── styles.css   # Dark premium theme, CSS variables, responsive Grid/Flexbox, piano & drum pad styling, animations
├── script.js    # Web Audio API engine, instruments, drum synthesis, keyboard input, music analyzer, recording, demo
└── README.md    # This file
```

---

## 🖥️ Tech Stack

| Technology | Usage |
|-----------|-------|
| **HTML5** | Semantic markup, accessibility attributes |
| **CSS3** | CSS custom properties, Grid, Flexbox, animations, glassmorphism, per-pad colour variables |
| **Vanilla JavaScript (ES6+)** | Modules, arrow functions, Promises, Maps, Sets, async/await |
| **Web Audio API** | Oscillators, gain nodes, convolver (reverb), analyser (visualizer), dynamics compressor, drum synthesis |
| **FFT (Cooley-Tukey)** | Custom in-place FFT for pitch detection in uploaded audio |

No npm, no bundler, no external libraries — just open `index.html`.

---

## 🎨 UI / UX Design

- **Dark premium theme** with electric-blue (`#00d4ff`) and purple (`#7b2fff`) accents
- **Animated background** — subtle radial gradient breathing animation
- **CSS Grid** three-column layout (sidebars + center)
- **Drum pads** — 10 individually coloured glowing pads with ripple animation on hit
- **Piano key animations** — press glow, active state, touch support
- **Upload zone** — drag-and-drop with glow effect, animated bouncing icon
- **Progress bar** — glowing gradient fill during audio analysis
- **Detected note badges** — hover-glow, click-to-preview
- **Responsive** — collapses to single column on tablet / mobile
- **Real-time visualizers** — waveform + spectrum

---

## 🚀 Getting Started

1. Clone or download this repository
2. Open `index.html` in Chrome, Firefox, Edge, or Safari
3. Click anywhere or press any key to unlock the audio context
4. Select an instrument from the left panel
5. Press letter keys to play melody notes, or number keys `1`–`0` for drum beats!
6. Upload an MP3/WAV to detect and replay its melody

---

## 🔧 Extending / Customising

### Add a new instrument
In `script.js`, add an entry to the `INSTRUMENTS` object:
```js
myInstrument: {
  name: 'My Instrument',
  waveform: 'sine',       // 'sine' | 'square' | 'sawtooth' | 'triangle'
  attack:  0.02,
  decay:   0.1,
  sustain: 0.7,
  release: 0.5,
  harmonics: [1, 0.5, 0.25],  // amplitude of each harmonic partial
  filterType: 'lowpass',
  filterFreq: 3000,
  filterQ: 1,
},
```
Then add the button in `index.html` inside `#instrument-grid`.

### Add a new song
In `script.js`, add an entry to the `SONGS` object:
```js
mySong: {
  title: '🎵 My Song',
  hint: 'Description',
  lines: [
    { words: [
      { syllable: 'Sa',  keys: ['A'] },
      { syllable: 'Re',  keys: ['S'] },
    ]},
  ],
  sequence: [
    ['C', 4, 300],   // [noteName, octave, durationMs]
    ['D', 4, 300],
    [null, 0, 200],  // rest (null note)
  ],
},
```
Then add a `<button class="song-tab" data-song="mySong">` in `index.html`.

---

## 📄 License

MIT — free to use, modify, and distribute.

---

*Built with ❤️ by [Harshitkashyap2027](https://github.com/Harshitkashyap2027)*
