const { isNode } = require("./utils/index");

const conditionalOutput = (s) => {
  if (isNode()) {
    console.log(s);
  } else {
    window.bundled = s;
  }
};

const honeypot = () => {};

module.exports = { conditionalOutput, honeypot };
