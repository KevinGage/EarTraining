import Link from "next/link";
import { Music, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>

      <main className="container mx-auto px-6 py-24 md:py-32">
        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-300 backdrop-blur-sm">
            <span className="mr-2 flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
            </span>
            v1.0 Beta
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-7xl">
            Train your ear. <br />
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Master the music.
            </span>
          </h1>
          <p className="mb-10 text-lg text-neutral-400 sm:text-xl">
            Stop guessing. Start recognizing.
          </p>
        </div>

        {/* Exercises Grid */}
        <div className="mx-auto mt-20 max-w-5xl">
          <h2 className="mb-8 text-2xl font-semibold text-white">Available Exercises</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Chord Progressions Card */}
            <Link
              href="/exercises/chord-progressions"
              className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 transition-all hover:border-indigo-500/50 hover:bg-neutral-900/80 hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300">
                <Music className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Chord Progressions</h3>
              <p className="mb-6 text-sm text-neutral-400">
                Listen to a series of chords and identify the progression. Customize key, length, and complexity.
              </p>
              <div className="flex items-center text-sm font-medium text-indigo-400 group-hover:text-indigo-300">
                Start Exercise <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* Placeholder for future exercises */}
            <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/30 p-6 opacity-50 grayscale">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-800 text-neutral-500">
                <Music className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-neutral-500">Interval Training</h3>
              <p className="mb-6 text-sm text-neutral-600">
                Coming soon. Identify intervals between two notes.
              </p>
              <div className="flex items-center text-sm font-medium text-neutral-600 cursor-not-allowed">
                Coming Soon
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
