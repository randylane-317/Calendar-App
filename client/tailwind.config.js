export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper:   '#FDFAF5',
        espresso: '#1C1612',
        warm: {
          50:  '#FAF5EE',
          100: '#F2EAE0',
          200: '#E6DDD4',
          300: '#C8B9AD',
          400: '#9A8C82',
          500: '#7A6E65',
        },
        copper: {
          DEFAULT: '#B87042',
          50:  '#FBF3EB',
          100: '#F0E4D4',
          200: '#DFC4A0',
          600: '#96592E',
        },
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
