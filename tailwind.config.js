/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark developer-interface palette: near-black canvas, hairline borders,
        // color reserved for real signal (git status), never decoration.
        canvas: {
          DEFAULT: '#0b0e14',
          subtle: '#11151c',
          inset: '#080a0f',
          overlay: '#161b22',
        },
        ink: {
          DEFAULT: '#e6edf3',
          muted: '#8b949e',
          subtle: '#6e7681',
        },
        line: {
          DEFAULT: '#262c36',
          muted: '#1b212b',
          strong: '#3d4551',
        },
        signal: {
          link: '#4493f8',
          success: '#3fb950',
          attention: '#d29922',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Noto Sans"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          '"SF Mono"',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          '"Liberation Mono"',
          'monospace',
        ],
      },
      maxWidth: {
        measure: '72ch',
      },
    },
  },
  plugins: [],
}
