/** @type {import('tailwindcss').Config} */
module.exports = {
  separator: '_',

  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      backgroundColor: {
        'dark': 'rgb(0, 21, 41)'
      }
    },
  },
  corePlugins: {
    preflight: false
  },
  plugins: [],
}
