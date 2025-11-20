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

let synth: Tone.PolySynth | null = null;

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
        release: 1,
      },
    }).toDestination();
    synth.volume.value = -10;
  }
};

export const playChord = (notes: string[], duration: string = "1n", time?: number) => {
  if (!synth) return;
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
  Tone.Transport.cancel();
  Tone.Transport.stop();
};

export const playProgression = async (
  progression: string[], 
  keyRoot: string = "C4",
  use7ths: boolean = false,
  tempo: number = 120
): Promise<void> => {
  await initAudio();
  
  // Stop any previous playback
  stopAudio();

  return new Promise((resolve) => {
    const duration = "2n";
    const timePerChord = Tone.Time(duration).toSeconds();
    
    // Set tempo (though we are using absolute seconds for spacing, Transport handles the clock)
    Tone.Transport.bpm.value = tempo;

    progression.forEach((roman, index) => {
      const notes = getNotesForRomanNumeral(roman, keyRoot, use7ths);
      Tone.Transport.schedule((time) => {
        playChord(notes, duration, time);
      }, index * timePerChord);
    });

    // Schedule completion
    Tone.Transport.schedule((time) => {
      Tone.Transport.stop();
      resolve();
    }, progression.length * timePerChord);

    Tone.Transport.start();
  });
};
