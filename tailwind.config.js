/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: ["tailwindcss-scrollbar"],
  // 滚动条样式
  variants: {
    scrollbar: ['rounded']
  }
}