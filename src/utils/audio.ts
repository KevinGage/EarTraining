import * as Tone from "tone";

// Define chord types and their intervals relative to the root
const CHORD_INTERVALS: Record<string, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  // 7ths
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
  dominant7: [0, 4, 7, 10],
  halfDiminished7: [0, 3, 6, 10],
  diminished7: [0, 3, 6, 9],
};

// Scale degrees mapped to semitones from the root (Major scale)
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

// Synth envelope release time in seconds
const SYNTH_RELEASE_TIME = 1;

let synth: Tone.PolySynth | null = null;
let activePlaybackReject: ((reason?: Error) => void) | null = null;

export const initAudio = async () => {
  if (Tone.context.state !== "running") {
    await Tone.start();
  }
  if (!synth) {
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "triangle",
      },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: SYNTH_RELEASE_TIME,
      },
    }).toDestination();
    synth.volume.value = -10;
  }
};

export const playChord = (notes: string[], duration: string | number = "1n", time?: number) => {
  if (!synth) {
    console.error("playChord called but synth is not initialized. Call initAudio() first.");
    return;
  }
  synth.triggerAttackRelease(notes, duration, time);
};

export const getNotesForRomanNumeral = (
  roman: string,
  keyRoot: string = "C4",
  use7ths: boolean = false
): string[] => {
  const rootNote = Tone.Frequency(keyRoot);
  const rootMidi = rootNote.toMidi();

  let degreeIndex = 0;
  let chordType = "major";

  const upper = roman.toUpperCase();

  if (upper.startsWith("VII")) degreeIndex = 6;
  else if (upper.startsWith("VI")) degreeIndex = 5;
  else if (upper.startsWith("IV")) degreeIndex = 3;
  else if (upper.startsWith("V")) degreeIndex = 4;
  else if (upper.startsWith("III")) degreeIndex = 2;
  else if (upper.startsWith("II")) degreeIndex = 1;
  else if (upper.startsWith("I")) degreeIndex = 0;

  // Determine chord quality based on major scale diatonic chords
  // I: Major, ii: Minor, iii: Minor, IV: Major, V: Major, vi: Minor, vii°: Diminished
  if (degreeIndex === 0 || degreeIndex === 3) {
    chordType = use7ths ? "major7" : "major";
  } else if (degreeIndex === 4) {
    chordType = use7ths ? "dominant7" : "major";
  } else if (degreeIndex === 1 || degreeIndex === 2 || degreeIndex === 5) {
    chordType = use7ths ? "minor7" : "minor";
  } else if (degreeIndex === 6) {
    chordType = use7ths ? "halfDiminished7" : "diminished"; // viiø7 in major
  }

  const rootPitch = Tone.Frequency(rootMidi + MAJOR_SCALE_INTERVALS[degreeIndex], "midi").toNote();
  
  const intervals = CHORD_INTERVALS[chordType];
  const notes = intervals.map((interval) => {
    return Tone.Frequency(rootPitch).transpose(interval).toNote();
  });

  return notes;
};

export const stopAudio = () => {
  // Reject any pending playback promise before cancelling
  if (activePlaybackReject) {
    activePlaybackReject(new Error('Playback cancelled'));
    activePlaybackReject = null;
  }
  Tone.Transport.cancel();
  Tone.Transport.stop();
  Tone.Transport.position = 0;
};

export const playProgression = async (
  progression: string[], 
  keyRoot: string = "C4",
  use7ths: boolean = false,
  chordDurationMs: number = 1000,
  chordDelayMs: number = 0
): Promise<void> => {
  await initAudio();
  
  // Stop any previous playback
  stopAudio();

  return new Promise((resolve, reject) => {
    // Track this promise so it can be rejected if cancelled
    activePlaybackReject = reject;
    
    // Convert ms to seconds for Tone.js
    const durationSeconds = chordDurationMs / 1000;
    const delaySeconds = chordDelayMs / 1000;
    const totalTimePerChord = durationSeconds + delaySeconds;
    
    progression.forEach((roman, index) => {
      const notes = getNotesForRomanNumeral(roman, keyRoot, use7ths);
      Tone.Transport.schedule((time) => {
        playChord(notes, durationSeconds, time);
      }, index * totalTimePerChord);
    });

    // Schedule completion after the last chord's release phase completes
    // We add a small buffer to ensure the last note has fully released
    // We subtract 1 from length because the last chord doesn't need a delay after it
    const completionTime = (progression.length - 1) * totalTimePerChord + durationSeconds + SYNTH_RELEASE_TIME;
    
    Tone.Transport.schedule((time) => {
      Tone.Transport.stop();
      activePlaybackReject = null;
      resolve();
    }, completionTime);

    Tone.Transport.start();
  });
};
