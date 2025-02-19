/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./dist_electron/*/.{html,js,vue}",
    "./public/index.html",
    "./renderer/*/.{html,js,vue}",
    "./src/*/.{html,js,vue}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
