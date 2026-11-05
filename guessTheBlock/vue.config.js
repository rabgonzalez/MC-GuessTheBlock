const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
  // Relative paths so the same build works on GitHub Pages
  // (served from /<repo>/) and inside Electron (app://).
  publicPath: "./",
});
