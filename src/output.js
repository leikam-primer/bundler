const { NODE_WINDOW_TYPE } = require("./constants");

const conditionalOutput = (s) => {
  if (typeof window === NODE_WINDOW_TYPE) {
    console.log(s);
  } else {
    window.bundled = s;
  }
};

const honeypot = () => {};

module.exports = { conditionalOutput, honeypot };
