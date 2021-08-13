const output = (s) => {
  if (typeof window === "undefined") {
    console.log(s);
  } else {
    window.bundled = s;
  }
};

output("hello world");
