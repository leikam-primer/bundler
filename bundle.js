const { copyFileSync } = require("fs");

copyFileSync("src/index.js", "dist/index.js");

console.log("bundler finished");
