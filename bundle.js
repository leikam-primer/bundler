const { readFileSync, writeFileSync } = require("fs");
const path = require("path");

const makeSlug = (sourceFilename, variable) => {
  return "module_" + sourceFilename.replace(/[^\w]+/, "_") + "_" + variable;
};

const getDependencies = (file) => {
  const regexp = new RegExp(
    /const {([\w\s,]+)} = require\("([\w./]+)"\);/,
    "g"
  );
  const dependencies = [...file.matchAll(regexp)];
  return dependencies;
};

const getSourceFilename = (dependency) => dependency[2];

const getImportStatement = (dependency) => dependency[0];

const getImports = (dependency) =>
  dependency[1].split(",").map((i) => i.trim());

// extract the code
const importCode = (dependency) => {
  const imports = getImports(dependency);
  const fn = path.resolve("src/", getSourceFilename(dependency));
  const x = require(fn);
  const code = imports.reduce((acc, k) => {
    const value = typeof x[k] === "string" ? `'${x[k]}'` : x[k].toString();
    return {
      ...acc,
      [k]: value,
    };
  }, {});
  return code;
};

const getStartOfCode = (bundle) => {
  const lastRequire = bundle.lastIndexOf("require");
  const startOfCode = bundle.indexOf(";", lastRequire);
  return startOfCode;
};

// rewrite all of the import lines with code snippets
const replaceImports = (dependency, bundle) => {
  const code = importCode(dependency);
  const importStatement = getImportStatement(dependency);
  const startOfCode = getStartOfCode(bundle);
  let head = bundle.slice(0, startOfCode + 1);
  const imports = getImports(dependency);
  const sourceFilename = getSourceFilename(dependency);
  const headLines = imports.reduce((output, variable) => {
    const slug = makeSlug(sourceFilename, variable);
    const snippet = `\n/* imported ${variable} from ${sourceFilename} */\nconst ${slug} = ${code[variable]};\n\n`;
    return output + snippet;
  }, "");

  head = head.replace(importStatement, headLines);
  return head;
};

// look into the body of the code
const replaceReferences = (dependency, bundle) => {
  const startOfCode = getStartOfCode(bundle);
  const sourceFilename = getSourceFilename(dependency);
  const imports = getImports(dependency);
  let tail = bundle.slice(startOfCode + 1);
  imports.forEach((variable) => {
    const varRegex = new RegExp(variable, "g");
    const slug = makeSlug(sourceFilename, variable);
    tail = tail.replace(varRegex, slug);
  });
  return tail;
};

const main = () => {
  // read the file
  const file = readFileSync("src/index.js").toString();
  let bundle = file;

  // collect the code
  const dependencies = getDependencies(file);
  for (const dependency of dependencies) {
    try {
      const head = replaceImports(dependency, bundle);
      const tail = replaceReferences(dependency, bundle);
      bundle = head + tail;
    } catch (err) {
      console.log(err.message);
      // remove the import
      const importStatement = getImportStatement(dependency);
      bundle = bundle.replace(
        importStatement,
        `/* unresolvable import: "${importStatement}" */\n`
      );
    }
  }

  // write the file
  writeFileSync("dist/index.js", bundle);
};

main();
console.log("bundler finished");
