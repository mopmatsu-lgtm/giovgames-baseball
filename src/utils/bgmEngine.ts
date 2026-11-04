// Authentic Power Pro (パワプロ) Style Synthesizer BGM Engine
// Built using Web Audio API: 100% self-contained, no external audio files required.

type TrackName = 'menu' | 'result' | 'match';

// Standard Note Frequencies (Hz)
const N = {
  _: 0, // Rest
  // Octave 2
  E2: 82.41, F2: 87.31, Fs2: 92.50, G2: 98.00, A2: 110.00, As2: 116.54, B2: 123.47,
  // Octave 3
  C3: 130.81, Cs3: 138.59, D3: 146.83, Ds3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, Gs3: 207.65, A3: 220.00, As3: 233.08, B3: 246.94,
  // Octave 4
  C4: 261.63, Cs4: 277.18, D4: 293.66, Ds4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Gs4: 415.30, A4: 440.00, As4: 466.16, B4: 493.88,
  // Octave 5
  C5: 523.25, Cs5: 554.37, D5: 587.33, Ds5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.00, As5: 932.33, B5: 987.77,
  // Octave 6
  C6: 1046.50, D6: 1174.66, E6: 1318.51, G6: 1567.98,
};

interface StepData {
  lead?: { note: number; length: number }; // frequency & step duration
  chord?: number[]; // frequencies
  bass?: { note: number; length: number };
  kick?: boolean;
  snare?: boolean;
  hihat?: boolean;
}

// ---------------------------------------------------------------------------
// TRACK 1: MENU BGM (パワプロ風 メインメニュー / 球団運営 / サクセス風BGM)
// Key: C Major / F Lydian, 128 BPM, 8 Bars (128 steps, 16 steps per bar)
// Bouncy, upbeat, hopeful brass melody with syncopated slap bass and upbeat chords
// ---------------------------------------------------------------------------
const createMenuTrack = (): StepData[] => {
  const steps: StepData[] = [];
  for (let i = 0; i < 128; i++) {
    steps.push({});
  }

  // Helper to place note
  const setLead = (bar: number, beat16: number, note: number, length16: number) => {
    const idx = (bar - 1) * 16 + beat16;
    if (idx < 128) steps[idx].lead = { note, length: length16 };
  };

  const setBass = (bar: number, beat16: number, note: number, length16: number) => {
    const idx = (bar - 1) * 16 + beat16;
    if (idx < 128) steps[idx].bass = { note, length: length16 };
  };

  const setChord = (bar: number, beat16: number, notes: number[]) => {
    const idx = (bar - 1) * 16 + beat16;
    if (idx < 128) steps[idx].chord = notes;
  };

  // Drum pattern across 8 bars: Four-on-the-floor kick with upbeat hats and snappy snare on 2 & 4
  for (let bar = 1; bar <= 8; bar++) {
    for (let s = 0; s < 16; s++) {
      const idx = (bar - 1) * 16 + s;
      // Kick on 0, 4, 8, 12
      if (s === 0 || s === 4 || s === 8 || s === 12) steps[idx].kick = true;
      // Snare on 4, 12
      if (s === 4 || s === 12) steps[idx].snare = true;
      // Hihat on every upbeat (2, 6, 10, 14) and 8th notes
      if (s % 2 === 0) steps[idx].hihat = true;
      if (s === 2 || s === 6 || s === 10 || s === 14) steps[idx].hihat = true;
    }
  }

  // --- BAR 1: Fmaj7 (IV) - Upbeat cheerful opening ---
  setLead(1, 0, N.C5, 2);
  setLead(1, 2, N.E5, 2);
  setLead(1, 4, N.G5, 2);
  setLead(1, 6, N.A5, 2);
  setLead(1, 8, N.C6, 3);
  setLead(1, 11, N.A5, 1);
  setLead(1, 12, N.G5, 4);

  setChord(1, 2, [N.A4, N.C5, N.E5]);
  setChord(1, 6, [N.A4, N.C5, N.E5]);
  setChord(1, 10, [N.A4, N.C5, N.E5]);
  setChord(1, 14, [N.A4, N.C5, N.E5]);

  setBass(1, 0, N.F3, 2);
  setBass(1, 4, N.F3, 2);
  setBass(1, 8, N.C3, 2);
  setBass(1, 12, N.F3, 2);
  setBass(1, 14, N.A3, 2);

  // --- BAR 2: G7 (V) - Rising anticipation ---
  setLead(2, 0, N.B5, 2);
  setLead(2, 2, N.G5, 2);
  setLead(2, 4, N.E5, 2);
  setLead(2, 6, N.D5, 2);
  setLead(2, 8, N.G5, 6);
  setLead(2, 14, N.A5, 2);

  setChord(2, 2, [N.B4, N.D5, N.F5]);
  setChord(2, 6, [N.B4, N.D5, N.F5]);
  setChord(2, 10, [N.B4, N.D5, N.F5]);
  setChord(2, 14, [N.B4, N.D5, N.F5]);

  setBass(2, 0, N.G3, 2);
  setBass(2, 4, N.D3, 2);
  setBass(2, 8, N.G3, 2);
  setBass(2, 12, N.B3, 2);

  // --- BAR 3: Em7 (iii) - Sweet retro harmony ---
  setLead(3, 0, N.G5, 2);
  setLead(3, 2, N.E5, 2);
  setLead(3, 4, N.B4, 2);
  setLead(3, 6, N.C5, 2);
  setLead(3, 8, N.D5, 2);
  setLead(3, 10, N.E5, 2);
  setLead(3, 12, N.G5, 4);

  setChord(3, 2, [N.G4, N.B4, N.E5]);
  setChord(3, 6, [N.G4, N.B4, N.E5]);
  setChord(3, 10, [N.G4, N.B4, N.E5]);
  setChord(3, 14, [N.G4, N.B4, N.E5]);

  setBass(3, 0, N.E3, 2);
  setBass(3, 4, N.B2, 2);
  setBass(3, 8, N.E3, 2);
  setBass(3, 12, N.G3, 2);

  // --- BAR 4: Am7 (vi) - Bouncy groove turnaround ---
  setLead(4, 0, N.A5, 2);
  setLead(4, 2, N.G5, 2);
  setLead(4, 4, N.E5, 2);
  setLead(4, 6, N.D5, 2);
  setLead(4, 8, N.C5, 4);
  setLead(4, 12, N.E5, 4);

  setChord(4, 2, [N.A4, N.C5, N.E5]);
  setChord(4, 6, [N.A4, N.C5, N.E5]);
  setChord(4, 10, [N.A4, N.C5, N.E5]);
  setChord(4, 14, [N.A4, N.C5, N.E5]);

  setBass(4, 0, N.A2, 2);
  setBass(4, 4, N.E3, 2);
  setBass(4, 8, N.A2, 2);
  setBass(4, 12, N.C3, 2);

  // --- BAR 5: Dm7 (ii) - Driving forward with energy ---
  setLead(5, 0, N.F4, 2);
  setLead(5, 2, N.A4, 2);
  setLead(5, 4, N.C5, 2);
  setLead(5, 6, N.D5, 3);
  setLead(5, 9, N.F5, 1);
  setLead(5, 10, N.E5, 2);
  setLead(5, 12, N.D5, 3);
  setLead(5, 15, N.C5, 1);

  setChord(5, 2, [N.F4, N.A4, N.C5]);
  setChord(5, 6, [N.F4, N.A4, N.C5]);
  setChord(5, 10, [N.F4, N.A4, N.C5]);
  setChord(5, 14, [N.F4, N.A4, N.C5]);

  setBass(5, 0, N.D3, 2);
  setBass(5, 4, N.A2, 2);
  setBass(5, 8, N.D3, 2);
  setBass(5, 12, N.F3, 2);

  // --- BAR 6: G7 (V) - Climactic brass fanfare buildup ---
  setLead(6, 0, N.E5, 2);
  setLead(6, 2, N.F5, 2);
  setLead(6, 4, N.G5, 2);
  setLead(6, 6, N.B5, 2);
  setLead(6, 8, N.D6, 3);
  setLead(6, 11, N.C6, 1);
  setLead(6, 12, N.B5, 4);

  setChord(6, 2, [N.G4, N.B4, N.D5]);
  setChord(6, 6, [N.G4, N.B4, N.D5]);
  setChord(6, 10, [N.G4, N.B4, N.D5]);
  setChord(6, 14, [N.G4, N.B4, N.D5]);

  setBass(6, 0, N.G3, 2);
  setBass(6, 4, N.D3, 2);
  setBass(6, 8, N.G3, 2);
  setBass(6, 12, N.B3, 2);

  // --- BAR 7: C (I) - Triumphant home-run landing ---
  setLead(7, 0, N.C6, 3);
  setLead(7, 3, N.G5, 3);
  setLead(7, 6, N.E5, 2);
  setLead(7, 8, N.G5, 2);
  setLead(7, 10, N.C6, 4);
  setLead(7, 14, N.B5, 2);

  setChord(7, 2, [N.G4, N.C5, N.E5]);
  setChord(7, 6, [N.G4, N.C5, N.E5]);
  setChord(7, 10, [N.G4, N.C5, N.E5]);
  setChord(7, 14, [N.G4, N.C5, N.E5]);

  setBass(7, 0, N.C3, 2);
  setBass(7, 4, N.G2, 2);
  setBass(7, 8, N.C3, 2);
  setBass(7, 12, N.E3, 2);

  // --- BAR 8: C7 / Turnaround - Seamless loop back to Bar 1 ---
  setLead(8, 0, N.A5, 2);
  setLead(8, 2, N.G5, 2);
  setLead(8, 4, N.F5, 2);
  setLead(8, 6, N.E5, 2);
  setLead(8, 8, N.D5, 2);
  setLead(8, 10, N.E5, 2);
  setLead(8, 12, N.F5, 2);
  setLead(8, 14, N.G5, 2);

  setChord(8, 2, [N.G4, N.As4, N.C5, N.E5]);
  setChord(8, 6, [N.G4, N.As4, N.C5, N.E5]);
  setChord(8, 10, [N.G4, N.B4, N.D5, N.F5]);
  setChord(8, 14, [N.G4, N.B4, N.D5, N.F5]);

  setBass(8, 0, N.C3, 2);
  setBass(8, 4, N.E3, 2);
  setBass(8, 8, N.G3, 2);
  setBass(8, 12, N.C3, 2);

  return steps;
};

// ---------------------------------------------------------------------------
// TRACK 2: MATCH RESULT BGM (パワプロ風 試合結果・勝利ハイライトテーマ)
// Key: G Major / C Lydian, 106 BPM, 8 Bars (128 steps, 16 steps per bar)
// Celebratory, heroic brass fanfare, broadcast recap feel with warm electric piano chords
// ---------------------------------------------------------------------------
const createResultTrack = (): StepData[] => {
  const steps: StepData[] = [];
  for (let i = 0; i < 128; i++) {
    steps.push({});
  }

  const setLead = (bar: number, beat16: number, note: number, length16: number) => {
    const idx = (bar - 1) * 16 + beat16;
    if (idx < 128) steps[idx].lead = { note, length: length16 };
  };

  const setBass = (bar: number, beat16: number, note: number, length16: number) => {
    const idx = (bar - 1) * 16 + beat16;
    if (idx < 128) steps[idx].bass = { note, length: length16 };
  };

  const setChord = (bar: number, beat16: number, notes: number[]) => {
    const idx = (bar - 1) * 16 + beat16;
    if (idx < 128) steps[idx].chord = notes;
  };

  // Drum pattern: Mid-tempo confident stadium groove
  for (let bar = 1; bar <= 8; bar++) {
    for (let s = 0; s < 16; s++) {
      const idx = (bar - 1) * 16 + s;
      // Kick on 0, 8, 10
      if (s === 0 || s === 8 || s === 10) steps[idx].kick = true;
      // Snare on 4, 12
      if (s === 4 || s === 12) steps[idx].snare = true;
      // Swing Hi-hat
      if (s % 2 === 0 || s === 7 || s === 15) steps[idx].hihat = true;
    }
  }

  // --- BAR 1: Cmaj7 - Proud, expansive stadium opening ---
  setLead(1, 0, N.E5, 3);
  setLead(1, 3, N.G5, 3);
  setLead(1, 6, N.B5, 4);
  setLead(1, 10, N.A5, 4);
  setLead(1, 14, N.G5, 2);

  setChord(1, 2, [N.G4, N.B4, N.D5, N.E5]);
  setChord(1, 8, [N.G4, N.B4, N.D5, N.E5]);
  setChord(1, 12, [N.G4, N.B4, N.D5, N.E5]);

  setBass(1, 0, N.C3, 4);
  setBass(1, 4, N.G2, 4);
  setBass(1, 8, N.C3, 4);
  setBass(1, 12, N.E3, 4);

  // --- BAR 2: D7 - Triumphant broadcast flourish ---
  setLead(2, 0, N.Fs5, 4);
  setLead(2, 4, N.A5, 3);
  setLead(2, 7, N.C6, 3);
  setLead(2, 10, N.B5, 4);
  setLead(2, 14, N.A5, 2);

  setChord(2, 2, [N.Fs4, N.A4, N.C5]);
  setChord(2, 8, [N.Fs4, N.A4, N.C5]);
  setChord(2, 12, [N.Fs4, N.A4, N.C5]);

  setBass(2, 0, N.D3, 4);
  setBass(2, 4, N.A2, 4);
  setBass(2, 8, N.D3, 4);
  setBass(2, 12, N.Fs3, 4);

  // --- BAR 3: Bm7 - Emotional heroic sports drama ---
  setLead(3, 0, N.D5, 3);
  setLead(3, 3, N.Fs5, 3);
  setLead(3, 6, N.A5, 4);
  setLead(3, 10, N.G5, 4);
  setLead(3, 14, N.Fs5, 2);

  setChord(3, 2, [N.Fs4, N.A4, N.D5]);
  setChord(3, 8, [N.Fs4, N.A4, N.D5]);
  setChord(3, 12, [N.Fs4, N.A4, N.D5]);

  setBass(3, 0, N.B2, 4);
  setBass(3, 4, N.Fs2, 4);
  setBass(3, 8, N.B2, 4);
  setBass(3, 12, N.D3, 4);

  // --- BAR 4: Em7 - Deep team camaraderie ---
  setLead(4, 0, N.B4, 4);
  setLead(4, 4, N.E5, 4);
  setLead(4, 8, N.G5, 4);
  setLead(4, 12, N.Fs5, 4);

  setChord(4, 2, [N.G4, N.B4, N.E5]);
  setChord(4, 8, [N.G4, N.B4, N.E5]);
  setChord(4, 12, [N.G4, N.B4, N.E5]);

  setBass(4, 0, N.E3, 4);
  setBass(4, 4, N.B2, 4);
  setBass(4, 8, N.E3, 4);
  setBass(4, 12, N.G3, 4);

  // --- BAR 5: Am7 - Highlight reel groove ---
  setLead(5, 0, N.C5, 2);
  setLead(5, 2, N.D5, 2);
  setLead(5, 4, N.E5, 4);
  setLead(5, 8, N.A5, 4);
  setLead(5, 12, N.G5, 4);

  setChord(5, 2, [N.A4, N.C5, N.E5, N.G5]);
  setChord(5, 8, [N.A4, N.C5, N.E5, N.G5]);
  setChord(5, 12, [N.A4, N.C5, N.E5, N.G5]);

  setBass(5, 0, N.A2, 4);
  setBass(5, 4, N.E3, 4);
  setBass(5, 8, N.A2, 4);
  setBass(5, 12, N.C3, 4);

  // --- BAR 6: D7 - Heroic lift to peak ---
  setLead(6, 0, N.Fs5, 2);
  setLead(6, 2, N.G5, 2);
  setLead(6, 4, N.A5, 4);
  setLead(6, 8, N.D6, 4);
  setLead(6, 12, N.C6, 4);

  setChord(6, 2, [N.C5, N.D5, N.Fs5]);
  setChord(6, 8, [N.C5, N.D5, N.Fs5]);
  setChord(6, 12, [N.C5, N.D5, N.Fs5]);

  setBass(6, 0, N.D3, 4);
  setBass(6, 4, N.A2, 4);
  setBass(6, 8, N.D3, 4);
  setBass(6, 12, N.Fs3, 4);

  // --- BAR 7: Gmaj7 - Glorious win feeling ---
  setLead(7, 0, N.B5, 6);
  setLead(7, 6, N.G5, 4);
  setLead(7, 10, N.D5, 4);
  setLead(7, 14, N.E5, 2);

  setChord(7, 2, [N.B4, N.D5, N.Fs5, N.G5]);
  setChord(7, 8, [N.B4, N.D5, N.Fs5, N.G5]);
  setChord(7, 12, [N.B4, N.D5, N.Fs5, N.G5]);

  setBass(7, 0, N.G2, 4);
  setBass(7, 4, N.D3, 4);
  setBass(7, 8, N.G2, 4);
  setBass(7, 12, N.B2, 4);

  // --- BAR 8: D7sus4 -> D7 turnaround ---
  setLead(8, 0, N.E5, 2);
  setLead(8, 2, N.Fs5, 2);
  setLead(8, 4, N.G5, 2);
  setLead(8, 6, N.A5, 2);
  setLead(8, 8, N.B5, 4);
  setLead(8, 12, N.A5, 4);

  setChord(8, 2, [N.G4, N.A4, N.D5]);
  setChord(8, 6, [N.G4, N.A4, N.D5]);
  setChord(8, 10, [N.Fs4, N.A4, N.D5]);
  setChord(8, 14, [N.Fs4, N.A4, N.D5]);

  setBass(8, 0, N.D3, 4);
  setBass(8, 4, N.A2, 4);
  setBass(8, 8, N.D3, 4);
  setBass(8, 12, N.Fs3, 4);

  return steps;
};

// ---------------------------------------------------------------------------
// TRACK 3: MATCH BGM (白熱の公式戦・実況生中継・緊迫のスタジアムBGM)
// Key: D minor / F Major, 136 BPM, 4 Bars (64 steps)
// Energetic, driving bass, crisp syncopation, sports stadium battle theme
// ---------------------------------------------------------------------------
const createMatchTrack = (): StepData[] => {
  const steps: StepData[] = [];
  for (let i = 0; i < 64; i++) {
    steps.push({});
  }

  const setLead = (bar: number, beat16: number, note: number, length16: number) => {
    const idx = (bar - 1) * 16 + beat16;
    if (idx < 64) steps[idx].lead = { note, length: length16 };
  };

  const setBass = (bar: number, beat16: number, note: number, length16: number) => {
    const idx = (bar - 1) * 16 + beat16;
    if (idx < 64) steps[idx].bass = { note, length: length16 };
  };

  const setChord = (bar: number, beat16: number, notes: number[]) => {
    const idx = (bar - 1) * 16 + beat16;
    if (idx < 64) steps[idx].chord = notes;
  };

  // Drum pattern across 4 bars: driving sports beat
  for (let bar = 1; bar <= 4; bar++) {
    for (let s = 0; s < 16; s++) {
      const idx = (bar - 1) * 16 + s;
      if (s === 0 || s === 6 || s === 8 || s === 14) steps[idx].kick = true;
      if (s === 4 || s === 12) steps[idx].snare = true;
      if (s % 2 === 0) steps[idx].hihat = true;
      if (s === 2 || s === 10) steps[idx].hihat = true;
    }
  }

  // --- BAR 1: Dm (Clutch duel) ---
  setLead(1, 0, N.D5, 2);
  setLead(1, 2, N.F5, 2);
  setLead(1, 4, N.A5, 3);
  setLead(1, 8, N.G5, 2);
  setLead(1, 10, N.F5, 2);
  setLead(1, 12, N.E5, 3);

  setChord(1, 2, [N.F4, N.A4, N.D5]);
  setChord(1, 8, [N.F4, N.A4, N.D5]);

  setBass(1, 0, N.D3, 2);
  setBass(1, 2, N.D3, 2);
  setBass(1, 4, N.F3, 2);
  setBass(1, 6, N.A2, 2);
  setBass(1, 8, N.D3, 2);
  setBass(1, 12, N.C3, 2);

  // --- BAR 2: Bb -> C ---
  setLead(2, 0, N.D5, 2);
  setLead(2, 2, N.E5, 2);
  setLead(2, 4, N.F5, 4);
  setLead(2, 8, N.G5, 2);
  setLead(2, 10, N.A5, 2);
  setLead(2, 12, N.C6, 4);

  setChord(2, 2, [N.D4, N.F4, N.As4]);
  setChord(2, 10, [N.E4, N.G4, N.C5]);

  setBass(2, 0, N.As2, 2);
  setBass(2, 4, N.As2, 2);
  setBass(2, 8, N.C3, 2);
  setBass(2, 12, N.C3, 2);

  // --- BAR 3: F -> G ---
  setLead(3, 0, N.A5, 3);
  setLead(3, 4, N.C6, 3);
  setLead(3, 8, N.D6, 4);
  setLead(3, 12, N.C6, 2);
  setLead(3, 14, N.A5, 2);

  setChord(3, 2, [N.A4, N.C5, N.F5]);
  setChord(3, 8, [N.G4, N.B4, N.D5]);

  setBass(3, 0, N.F3, 2);
  setBass(3, 4, N.C3, 2);
  setBass(3, 8, N.G3, 2);
  setBass(3, 12, N.D3, 2);

  // --- BAR 4: A7sus4 -> A7 ---
  setLead(4, 0, N.G5, 2);
  setLead(4, 2, N.F5, 2);
  setLead(4, 4, N.E5, 4);
  setLead(4, 8, N.Cs5, 4);
  setLead(4, 12, N.D5, 4);

  setChord(4, 2, [N.G4, N.A4, N.D5]);
  setChord(4, 8, [N.G4, N.A4, N.Cs5]);

  setBass(4, 0, N.A2, 4);
  setBass(4, 4, N.E3, 2);
  setBass(4, 8, N.A2, 4);
  setBass(4, 12, N.Cs3, 2);

  return steps;
};

// ---------------------------------------------------------------------------
// BGM Synthesizer Engine
// ---------------------------------------------------------------------------
class PawapuroBgmEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private currentTrack: TrackName = 'menu';
  private isPlaying: boolean = false;
  private isBgmEnabled: boolean = true;
  private isMasterSoundEnabled: boolean = true;
  private volume: number = 0.22; // Pleasant background level

  private menuTrackData: StepData[];
  private resultTrackData: StepData[];
  private matchTrackData: StepData[];

  private timerId: number | null = null;
  private nextStepTime: number = 0;
  private currentStep: number = 0;

  constructor() {
    this.menuTrackData = createMenuTrack();
    this.resultTrackData = createResultTrack();
    this.matchTrackData = createMatchTrack();

    if (typeof window !== 'undefined') {
      const savedBgm = localStorage.getItem('gekipawa_bgm_enabled');
      if (savedBgm !== null) {
        this.isBgmEnabled = savedBgm === 'true';
      }
      const savedSound = localStorage.getItem('gekipawa_sound_enabled');
      if (savedSound !== null) {
        this.isMasterSoundEnabled = savedSound === 'true';
      }

      // Auto-unlock AudioContext on first user gesture
      const unlockAudio = () => {
        this.initAudioContext();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        if (this.isBgmEnabled && this.isMasterSoundEnabled && !this.isPlaying) {
          this.startScheduler();
        }
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };

      window.addEventListener('click', unlockAudio, { once: true });
      window.addEventListener('keydown', unlockAudio, { once: true });
      window.addEventListener('touchstart', unlockAudio, { once: true });
    }
  }

  private initAudioContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isBgmEnabled && this.isMasterSoundEnabled ? this.volume : 0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.buildNoiseBuffer();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private buildNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 1; // 1 second of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  // BPM & timing helpers
  private getStepDuration(): number {
    const bpm = this.currentTrack === 'menu' ? 128 : this.currentTrack === 'match' ? 136 : 106;
    return (60 / bpm) / 4; // 16th note in seconds
  }

  // Start or transition playback
  public setTrack(track: TrackName) {
    if (this.currentTrack === track && this.isPlaying) return;
    this.currentTrack = track;
    this.currentStep = 0; // restart at the beginning of the new track

    if (this.isBgmEnabled && this.isMasterSoundEnabled) {
      this.startScheduler();
    }
  }

  public getTrack(): TrackName {
    return this.currentTrack;
  }

  public isEnabled(): boolean {
    return this.isBgmEnabled;
  }

  public setEnabled(val: boolean) {
    this.isBgmEnabled = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('gekipawa_bgm_enabled', String(val));
    }

    if (val && this.isMasterSoundEnabled) {
      this.startScheduler();
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.08);
      }
    } else {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      }
      this.stopScheduler();
    }
  }

  public setMasterSoundEnabled(val: boolean) {
    this.isMasterSoundEnabled = val;
    if (val && this.isBgmEnabled) {
      this.startScheduler();
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.08);
      }
    } else {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      }
      this.stopScheduler();
    }
  }

  private startScheduler() {
    this.initAudioContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    this.isPlaying = true;
    this.nextStepTime = this.ctx.currentTime + 0.05;

    // Scheduler tick every 25ms
    this.timerId = window.setInterval(() => {
      this.schedulerTick();
    }, 25);
  }

  private stopScheduler() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private schedulerTick() {
    if (!this.ctx || !this.isPlaying) return;

    const lookahead = 0.12; // 120ms schedule ahead
    const stepDuration = this.getStepDuration();
    const trackData =
      this.currentTrack === 'menu'
        ? this.menuTrackData
        : this.currentTrack === 'match'
        ? this.matchTrackData
        : this.resultTrackData;

    while (this.nextStepTime < this.ctx.currentTime + lookahead) {
      const step = trackData[this.currentStep];
      if (step) {
        this.playStep(step, this.nextStepTime, stepDuration);
      }

      this.nextStepTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % trackData.length;
    }
  }

  // Synthesize single step instruments
  private playStep(step: StepData, time: number, stepDuration: number) {
    if (!this.ctx || !this.masterGain) return;

    // 1. Kick
    if (step.kick) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(36, time + 0.09);

      gain.gain.setValueAtTime(0.45, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.12);
    }

    // 2. Snare
    if (step.snare && this.noiseBuffer) {
      // Noise component
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1200;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.28, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(time);
      noise.stop(time + 0.15);

      // Body tone
      const body = this.ctx.createOscillator();
      const bodyGain = this.ctx.createGain();
      body.type = 'triangle';
      body.frequency.setValueAtTime(180, time);
      body.frequency.exponentialRampToValueAtTime(60, time + 0.08);

      bodyGain.gain.setValueAtTime(0.3, time);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

      body.connect(bodyGain);
      bodyGain.connect(this.masterGain);
      body.start(time);
      body.stop(time + 0.1);
    }

    // 3. Hi-Hat
    if (step.hihat && this.noiseBuffer) {
      const hihat = this.ctx.createBufferSource();
      hihat.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 9500;
      filter.Q.value = 3.0;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

      hihat.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      hihat.start(time);
      hihat.stop(time + 0.05);
    }

    // 4. Bass (Punchy arcade synth / slap bass)
    if (step.bass && step.bass.note > 0) {
      const dur = step.bass.length * stepDuration;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(step.bass.note, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, time);
      filter.frequency.exponentialRampToValueAtTime(180, time + Math.min(0.2, dur));

      gain.gain.setValueAtTime(0.38, time);
      gain.gain.setValueAtTime(0.35, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + dur);
    }

    // 5. Chords (Warm 80s/90s Electric Piano / FM synth stabs on upbeat)
    if (step.chord && step.chord.length > 0) {
      const dur = stepDuration * 1.5;
      step.chord.forEach(freq => {
        const osc = this.ctx!.createOscillator();
        const filter = this.ctx!.createBiquadFilter();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, time);
        filter.frequency.exponentialRampToValueAtTime(900, time + dur);

        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(time);
        osc.stop(time + dur + 0.02);
      });
    }

    // 6. Lead (Cheery Pawapuro Brass / Lead Trumpet Synth)
    if (step.lead && step.lead.note > 0) {
      const dur = step.lead.length * stepDuration;
      // Dual oscillator for rich brass chorus
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(step.lead.note, time);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(step.lead.note * 1.004, time); // detuned +7 cents

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600, time);
      filter.frequency.exponentialRampToValueAtTime(1600, time + dur);

      // Envelope: snappy attack, rich sustain, clean release
      gain.gain.setValueAtTime(0.01, time);
      gain.gain.linearRampToValueAtTime(0.32, time + 0.02);
      gain.gain.setValueAtTime(0.28, time + dur * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.98);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + dur + 0.05);
      osc2.stop(time + dur + 0.05);
    }
  }
}

export const bgm = new PawapuroBgmEngine();
