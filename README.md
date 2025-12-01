# Ear Trainer

A modern, interactive ear training application built for musicians of all levels. This tool helps you improve your aural skills through customizable exercises, starting with Chord Progressions.

![Ear Trainer](/src/app/icon.png)

## Features

### 🎵 Chord Progression Trainer
Master the ability to identify chord progressions by ear.
- **Customizable Length**: Practice with progressions of 2 to 6 chords.
- **Key & Octave Control**: Train in random keys or focus on specific keys and octaves.
- **Diatonic Chords**: Includes all diatonic triads and 7th chords (I, ii, iii, IV, V, vi, vii°).
- **Interactive Gameplay**:
    - **Play/Replay**: Listen to the progression as many times as needed.
    - **Edit Answers**: Click any slot to change your answer.
    - **Instant Feedback**: See exactly where you went wrong and what the correct progression was.
    - **Score Tracking**: Keep track of your streak and accuracy.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Audio**: [Tone.js](https://tonejs.github.io/) for real-time in-browser audio synthesis.
- **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/KevinGage/EarTraining.git
    cd EarTraining
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Open your browser:**
    Navigate to [http://localhost:3000](http://localhost:3000) to start training.

## License

[MIT](LICENSE)
