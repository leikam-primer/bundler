const conditionalOutput = (s) => {
  if (typeof window === "undefined") {
    console.log(s);
  } else {
    window.bundled = s;
  }
};

const honeypot = () => {};

module.exports = { conditionalOutput, honeypot };
