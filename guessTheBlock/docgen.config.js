const path = require("path");

module.exports = {
  componentsRoot: "src/modules/",
  components: "**/**/*.vue",
  outDir: "docs/components",
  apiOptions: {
    alias: { "@": path.resolve(__dirname, "src") },
    jsx: true,
  },
  watch: false,
};
