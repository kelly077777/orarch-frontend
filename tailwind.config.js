/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:   '#2563EB',
        'primary-light': '#EFF6FF',
        'primary-dark':  '#1D4ED8',
        accent:    '#0EA5E9',
        success:   '#16A34A',
        warning:   '#D97706',
        danger:    '#DC2626',
        muted:     '#64748B',
      },
    },
  },
  plugins: [],
};