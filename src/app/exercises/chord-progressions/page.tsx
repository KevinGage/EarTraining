"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Settings, Check, X, Volume2, ChevronDown, ChevronUp, ArrowRight, RotateCcw } from "lucide-react";
import { playProgression, playChord, getNotesForRomanNumeral, stopAudio } from "@/utils/audio";

// Game Constants
const ALL_CHORDS = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
const NOTES = ["C", "G", "D", "A", "E", "B", "F", "Bb", "Eb", "Ab", "Db", "Gb"];
const NOTE_NAMES: Record<string, string> = {
  "C": "C Major", "G": "G Major", "D": "D Major", "A": "A Major", "E": "E Major", "B": "B Major",
  "F": "F Major", "Bb": "Bb Major", "Eb": "Eb Major", "Ab": "Ab Major", "Db": "Db Major", "Gb": "Gb Major"
};
const ALL_OCTAVES = [2, 3, 4, 5];

export default function ChordProgressionPage() {
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [progressionLength, setProgressionLength] = useState(4);
  const [startOnRoot, setStartOnRoot] = useState(true);
  const [allowedChords, setAllowedChords] = useState<string[]>(ALL_CHORDS);
  const [selectedKey, setSelectedKey] = useState<string>("Random"); // "Random" or specific note (e.g. "C")
  const [availableOctaves, setAvailableOctaves] = useState<number[]>([3, 4]);
  const [fixedOctave, setFixedOctave] = useState<number>(4);
  const [use7ths, setUse7ths] = useState(false);
  const [playOnClick, setPlayOnClick] = useState(false);
  
  // Game State
  const [currentProgression, setCurrentProgression] = useState<string[]>([]);
  const [currentKey, setCurrentKey] = useState("C4"); // Full key string with octave
  const [userAnswer, setUserAnswer] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameState, setGameState] = useState<"idle" | "playing" | "guessing" | "revealed">("idle");
  const [feedback, setFeedback] = useState<("correct" | "incorrect" | null)[]>([]);
  
  // Score State
  const [score, setScore] = useState({ correct: 0, total: 0, streak: 0 });

  // Reset game when settings change
  useEffect(() => {
    setScore({ correct: 0, total: 0, streak: 0 });
    setCurrentProgression([]);
    setUserAnswer([]);
    setFeedback([]);
    setGameState("idle");
    setEditingIndex(null);
  }, [progressionLength, startOnRoot, allowedChords, selectedKey, availableOctaves, fixedOctave, use7ths, playOnClick]);

  // Refs for audio to avoid stale closures
  const audioRef = useRef({ currentProgression, currentKey, use7ths });
  useEffect(() => {
    audioRef.current = { currentProgression, currentKey, use7ths };
  }, [currentProgression, currentKey, use7ths]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  // Generate a new progression
  const generateProgression = () => {
    const newProgression = [];
    const pool = allowedChords.length > 0 ? allowedChords : ALL_CHORDS;
    
    const length = progressionLength;
    for (let i = 0; i < length; i++) {
      if (i === 0 && startOnRoot) {
        newProgression.push("I");
      } else {
        const randomIndex = Math.floor(Math.random() * pool.length);
        newProgression.push(pool[randomIndex]);
      }
    }

    // Determine Key and Octave
    let note = selectedKey;
    let octave = fixedOctave;

    if (selectedKey === "Random") {
      const randomNoteIndex = Math.floor(Math.random() * NOTES.length);
      note = NOTES[randomNoteIndex];
      
      // Pick random octave from available
      const octs = availableOctaves.length > 0 ? availableOctaves : [4];
      const randomOctaveIndex = Math.floor(Math.random() * octs.length);
      octave = octs[randomOctaveIndex];
    }

    const newKey = `${note}${octave}`;

    setCurrentProgression(newProgression);
    setCurrentKey(newKey);
    
    // Reset Answer
    const initialAnswer = startOnRoot ? ["I"] : [];
    setUserAnswer(initialAnswer);
    
    setFeedback([]);
    setGameState("idle");
    setEditingIndex(null);
    setIsSettingsOpen(false);
    
    return { newProgression, newKey };
  };

  const handlePlay = async (progressionToPlay?: string[], keyToPlay?: string) => {
    const prog = progressionToPlay || audioRef.current.currentProgression;
    const key = keyToPlay || audioRef.current.currentKey;
    
    if (prog.length === 0) return;
    
    setIsPlaying(true);
    setGameState("playing");
    await playProgression(prog, key, use7ths);
    setIsPlaying(false);
    setGameState("guessing");
  };

  const handleChordClick = (chord: string) => {
    if (gameState !== "guessing" && gameState !== "idle") return;
    
    // Play the chord for feedback if enabled
    if (playOnClick) {
      playChord(getNotesForRomanNumeral(chord, currentKey, use7ths), "8n");
    }

    if (editingIndex !== null) {
      // Replace existing answer
      const newAnswer = [...userAnswer];
      newAnswer[editingIndex] = chord;
      setUserAnswer(newAnswer);
      setEditingIndex(null); // Stop editing after selection
      
      // Auto-check if full
      if (newAnswer.length === currentProgression.length && !newAnswer.includes(undefined as any)) {
        checkAnswer(newAnswer);
      }
    } else if (userAnswer.length < currentProgression.length) {
      // Append new answer
      const newAnswer = [...userAnswer, chord];
      setUserAnswer(newAnswer);
      
      // Auto-check if full
      if (newAnswer.length === currentProgression.length) {
        checkAnswer(newAnswer);
      }
    }
  };

  const handleSlotClick = (index: number) => {
    if (gameState !== "guessing" && gameState !== "idle") return;
    
    // Don't allow editing the fixed root if enabled
    if (startOnRoot && index === 0) return;
    
    // Only allow editing if the slot is filled or it's the next available slot
    if (index < userAnswer.length) {
      setEditingIndex(index);
    }
  };

  const checkAnswer = (answer: string[]) => {
    const newFeedback = answer.map((chord, index) => 
      chord === currentProgression[index] ? "correct" : "incorrect"
    );
    setFeedback(newFeedback);
    setGameState("revealed");
    setEditingIndex(null);

    const isAllCorrect = newFeedback.every(f => f === "correct");
    if (isAllCorrect) {
      setScore(prev => ({
        correct: prev.correct + 1,
        total: prev.total + 1,
        streak: prev.streak + 1
      }));
    } else {
      setScore(prev => ({
        ...prev,
        total: prev.total + 1,
        streak: 0
      }));
    }
  };

  const clearAnswer = () => {
    if (gameState !== "guessing" && gameState !== "idle") return;
    const initialAnswer = startOnRoot ? ["I"] : [];
    setUserAnswer(initialAnswer);
    setEditingIndex(null);
  };

  const nextExercise = async () => {
    const { newProgression, newKey } = generateProgression();
    await handlePlay(newProgression, newKey);
  };

  const toggleAllowedChord = (chord: string) => {
    if (allowedChords.includes(chord)) {
      setAllowedChords(prev => prev.filter(c => c !== chord));
    } else {
      setAllowedChords(prev => [...prev, chord]);
    }
  };

  const toggleAvailableOctave = (octave: number) => {
    if (availableOctaves.includes(octave)) {
      // Don't allow unchecking the last octave
      if (availableOctaves.length > 1) {
        setAvailableOctaves(prev => prev.filter(o => o !== octave));
      }
    } else {
      setAvailableOctaves(prev => [...prev, octave].sort());
    }
  };

  // Helper to get display name for key
  const getKeyDisplayName = (keyStr: string) => {
    // keyStr is like "C4" or "F#3"
    // Extract note part
    const note = keyStr.slice(0, -1);
    return NOTE_NAMES[note] || keyStr;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center text-neutral-400 transition-colors hover:text-white">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Home
          </Link>
          <div className="text-lg font-semibold text-white">Chord Progressions</div>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-6 py-8">
        
        {/* Settings Panel */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/50 transition-all">
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="flex w-full items-center justify-between bg-neutral-800/50 px-6 py-4 text-left font-medium text-white hover:bg-neutral-800"
          >
            <div className="flex items-center">
              <Settings className="mr-2 h-5 w-5 text-indigo-400" />
              Exercise Settings
            </div>
            {isSettingsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {isSettingsOpen && (
            <div className="p-6">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-400">Progression Length</label>
                    <div className="flex gap-2">
                      {[2, 3, 4, 5, 6].map(len => (
                        <button
                          key={len}
                          onClick={() => setProgressionLength(len)}
                          className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                            progressionLength === len 
                              ? "border-indigo-500 bg-indigo-500/20 text-indigo-300" 
                              : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600"
                          }`}
                        >
                          {len}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-400">Key</label>
                      <select
                        value={selectedKey}
                        onChange={(e) => setSelectedKey(e.target.value)}
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="Random">Random</option>
                        {NOTES.map(note => (
                          <option key={note} value={note}>{NOTE_NAMES[note]}</option>
                        ))}
                      </select>
                    </div>
                    
                    {selectedKey !== "Random" ? (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-400">Octave</label>
                        <select
                          value={fixedOctave}
                          onChange={(e) => setFixedOctave(Number(e.target.value))}
                          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                        >
                          {ALL_OCTAVES.map(oct => (
                            <option key={oct} value={oct}>{oct}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                       <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-400">Allowed Octaves</label>
                        <div className="flex gap-2">
                          {ALL_OCTAVES.map(oct => (
                            <button
                              key={oct}
                              onClick={() => toggleAvailableOctave(oct)}
                              className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                                availableOctaves.includes(oct)
                                  ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                                  : "border-neutral-700 bg-neutral-800 text-neutral-500 hover:border-neutral-600"
                              }`}
                            >
                              {oct}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 text-neutral-300">
                      <input 
                        type="checkbox" 
                        checked={startOnRoot} 
                        onChange={(e) => setStartOnRoot(e.target.checked)}
                        className="h-5 w-5 rounded border-neutral-700 bg-neutral-800 text-indigo-600 focus:ring-indigo-500"
                      />
                      Always Start on Root (I)
                    </label>
                    <label className="flex items-center gap-3 text-neutral-300">
                      <input 
                        type="checkbox" 
                        checked={use7ths} 
                        onChange={(e) => setUse7ths(e.target.checked)}
                        className="h-5 w-5 rounded border-neutral-700 bg-neutral-800 text-indigo-600 focus:ring-indigo-500"
                      />
                      Include 7th Chords
                    </label>
                    <label className="flex items-center gap-3 text-neutral-300">
                      <input 
                        type="checkbox" 
                        checked={playOnClick} 
                        onChange={(e) => setPlayOnClick(e.target.checked)}
                        className="h-5 w-5 rounded border-neutral-700 bg-neutral-800 text-indigo-600 focus:ring-indigo-500"
                      />
                      Play Sound on Click
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-400">Allowed Chords</label>
                  <div className="grid grid-cols-4 gap-2">
                    {ALL_CHORDS.map(chord => (
                      <button
                        key={chord}
                        onClick={() => toggleAllowedChord(chord)}
                        className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                          allowedChords.includes(chord)
                            ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                            : "border-neutral-700 bg-neutral-800 text-neutral-500 hover:border-neutral-600"
                        }`}
                      >
                        {chord}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    const { newProgression, newKey } = generateProgression();
                    handlePlay(newProgression, newKey);
                  }}
                  className="rounded-full bg-indigo-600 px-6 py-2 font-medium text-white transition-colors hover:bg-indigo-500"
                >
                  Begin Exercise
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="flex flex-col items-center">
          
          {/* Info Bar */}
          <div className="mb-8 flex w-full items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/30 px-6 py-3">
             <div className="text-sm font-medium text-neutral-400">
               Key: <span className="text-indigo-400">{getKeyDisplayName(currentKey)}</span>
             </div>
             <div className="flex gap-6 text-sm font-medium text-neutral-400">
                <div className="flex gap-2">
                  <span className="uppercase tracking-wider">Streak</span>
                  <span className="text-white">{score.streak}</span>
                </div>
                <div className="flex gap-2">
                  <span className="uppercase tracking-wider">Score</span>
                  <span className="text-white">{score.correct}/{score.total}</span>
                </div>
             </div>
          </div>

          {/* Play Button */}
          <button
            onClick={() => handlePlay()}
            disabled={currentProgression.length === 0}
            className={`mb-12 flex h-24 w-24 items-center justify-center rounded-full border-4 transition-all ${
              isPlaying 
                ? "scale-95 border-indigo-500/50 bg-indigo-500/10 text-indigo-400" 
                : "border-indigo-500 bg-indigo-600 text-white shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:scale-105 hover:shadow-[0_0_50px_rgba(79,70,229,0.5)]"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Play className={`h-10 w-10 ${isPlaying ? "animate-pulse" : "ml-1"}`} />
          </button>

          {/* Answer Slots */}
          <div className="mb-12 flex flex-col gap-4">
            <div className="flex flex-wrap justify-center gap-4">
              {Array.from({ length: progressionLength }).map((_, i) => {
                const isFixedRoot = startOnRoot && i === 0;
                const isEditing = editingIndex === i;
                const isFilled = i < userAnswer.length;
                
                return (
                  <button 
                    key={i}
                    onClick={() => handleSlotClick(i)}
                    disabled={gameState !== "guessing" && gameState !== "idle"}
                    className={`flex h-16 w-16 items-center justify-center rounded-xl border-2 text-xl font-bold transition-all ${
                      gameState === "revealed"
                        ? feedback[i] === "correct"
                          ? "border-green-500 bg-green-500/10 text-green-400"
                          : "border-red-500 bg-red-500/10 text-red-400"
                        : isEditing
                          ? "border-indigo-400 bg-indigo-500/20 text-indigo-300 ring-2 ring-indigo-500/50"
                          : isFilled
                            ? isFixedRoot 
                              ? "border-neutral-700 bg-neutral-800 text-neutral-500 cursor-not-allowed" 
                              : "border-indigo-500 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
                            : "border-neutral-800 bg-neutral-900 text-neutral-600"
                    }`}
                  >
                    {gameState === "revealed" ? userAnswer[i] || "?" : userAnswer[i] || "?"}
                  </button>
                );
              })}
            </div>

            {/* Correct Answer Display (on failure) */}
            {gameState === "revealed" && feedback.some(f => f === "incorrect") && (
              <div className="flex flex-col items-center animate-in fade-in slide-in-from-top-2">
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Correct Answer</div>
                <div className="flex flex-wrap justify-center gap-4">
                  {currentProgression.map((chord, i) => (
                    <div 
                      key={i}
                      className="flex h-12 w-12 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-lg font-bold text-neutral-400"
                    >
                      {chord}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Controls / Input */}
          {gameState === "revealed" ? (
            <div className="flex gap-4">
              <button
                onClick={nextExercise}
                className="flex items-center rounded-full bg-indigo-600 px-8 py-3 font-bold text-white transition-transform hover:scale-105 hover:bg-indigo-500"
              >
                Next Progression <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button
                onClick={() => handlePlay()}
                className="flex items-center rounded-full border border-neutral-700 bg-neutral-800 px-6 py-3 font-medium text-neutral-300 hover:bg-neutral-700"
              >
                <Volume2 className="mr-2 h-5 w-5" /> Replay
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className="grid grid-cols-4 gap-3 sm:flex sm:gap-4">
                {ALL_CHORDS.map((chord) => (
                  <button
                    key={chord}
                    onClick={() => handleChordClick(chord)}
                    disabled={gameState === "idle" || (!editingIndex && userAnswer.length >= progressionLength) || !allowedChords.includes(chord)}
                    className={`flex h-14 w-14 items-center justify-center rounded-xl border text-lg font-bold transition-all sm:h-16 sm:w-16 ${
                      allowedChords.includes(chord)
                        ? "border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-indigo-500 hover:bg-neutral-700 hover:text-white"
                        : "cursor-not-allowed border-neutral-800 bg-neutral-900 text-neutral-700 opacity-50"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {chord}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setUserAnswer(prev => {
                    if (startOnRoot && prev.length <= 1) return prev; // Don't remove fixed root
                    return prev.slice(0, -1);
                  })}
                  disabled={userAnswer.length === 0 || (startOnRoot && userAnswer.length === 1)}
                  className="flex h-12 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 px-6 text-neutral-400 transition-all hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="mr-2 h-4 w-4" /> Backspace
                </button>
                <button
                  onClick={clearAnswer}
                  disabled={userAnswer.length === 0 || (startOnRoot && userAnswer.length === 1)}
                  className="flex h-12 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 px-6 text-neutral-400 transition-all hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Clear All
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
