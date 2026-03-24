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

### 🎼 Song Sheets (3 included)
| Song | Keys to Press |
|---|---|
| **Tum Dil Ke Dharkan Me** | `T U M` · `D I L` · `K E` · `D H A R` · `K A N` · `M E` |
| **Twinkle Twinkle** | `A A K K L L K` · `J J I I Q Q A` |
| **Happy Birthday** | `A A S A F E` · `A A S A G F` |

- Click **▶ Play Demo** to hear any song played automatically
- Click individual key badges in the song sheet to hear each note
- Tempo slider controls demo playback speed

### 📊 Visualizers
- **Waveform oscilloscope** (left panel) — real-time time-domain display
- **Frequency spectrum** (top of piano) — FFT bar chart with colour mapping

---

## ⌨️ Keyboard Map

```
┌─────────────────────────────────────────────────────────────────────┐
│ Octave 4 Black Keys (QWERTY row):  W  E     T  Y  U     O  P       │
│ Octave 4 White Keys (Home row):    A  S  D  F  G  H  J             │
│ Octave 3 White Keys (Bottom row):  Z  X  C  V  B  N  M             │
│ Octave 5 White Keys:               Q  I  O  P     K  L  ;          │
│ Octave 5 Black Keys:               R (C#5)                          │
└─────────────────────────────────────────────────────────────────────┘
```

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

### Global Shortcuts
| Shortcut | Action |
|----------|--------|
| `F1` | Start recording |
| `F2` | Stop recording / demo |
| `F3` | Play back recording |
| `Arrow Up` | Octave up (+1) |
| `Arrow Down` | Octave down (−1) |
| `Space` | Toggle sustain pedal |

---

## 🏗️ Project Structure

```
SynapseX/
├── index.html   # Semantic HTML layout — header, piano, sidebars, song sheet
├── styles.css   # Dark premium theme, CSS variables, responsive Grid/Flexbox, piano styling
├── script.js    # Web Audio API engine, instruments, keyboard input, recording, demo
└── README.md    # This file
```

---

## 🖥️ Tech Stack

| Technology | Usage |
|-----------|-------|
| **HTML5** | Semantic markup, accessibility attributes |
| **CSS3** | CSS custom properties, Grid, Flexbox, animations, glassmorphism |
| **Vanilla JavaScript (ES6+)** | Modules, arrow functions, Promises, Maps, Sets |
| **Web Audio API** | Oscillators, gain nodes, convolver (reverb), analyser (visualizer), dynamics compressor |

No npm, no bundler, no external libraries — just open `index.html`.

---

## 🎨 UI / UX Design

- **Dark premium theme** with electric-blue (`#00d4ff`) and purple (`#7b2fff`) accents
- **CSS Grid** three-column layout (sidebars + center)
- **Responsive** — collapses to single column on tablet / mobile
- **Piano key animations** — press glow, active state, touch support
- **Smooth transitions** on all interactive elements
- **Real-time visualizers** — waveform + spectrum

---

## 🚀 Getting Started

1. Clone or download this repository
2. Open `index.html` in Chrome, Firefox, Edge, or Safari
3. Click anywhere or press any key to unlock the audio context
4. Select an instrument from the left panel
5. Start pressing keys on your keyboard to play music!
6. Click **▶ Play Demo** in any song sheet to hear a built-in melody

### Playing "Tum Dil Ke Dharkan Me"
Press these keys in order (with a slight pause between words):

```
T  U  M  —  D  I  L  —  K  E  —  D  H  A  R  —  K  A  N  —  M  E
```

Or just click **▶ Play Demo** on the "Tum Dil Ke Dharkan Me" tab!

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
