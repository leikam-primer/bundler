const { readFileSync, writeFileSync } = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const makeSlug = (sourceFilename, variable) => {
  return "module_" + sourceFilename.replace(/[^\w]+/, "_") + "_" + variable;
};

const getSourceFilename = (dependency) => dependency[2];

const getImportStatement = (dependency) => dependency[0];

const getImports = (dependency) =>
  dependency[1].split(",").map((i) => i.trim());

// returns any "requires" lines in the given filename
const getRequires = (filename) => {
  const importsCommand = `grep 'require' ${filename.replace(".js", "")}.js`;
  let content = "";
  try {
    content = execSync(importsCommand, { encoding: "utf-8" });
  } catch (err) {
    return "";
  }
  return content;
};

const getDependencies = (filename, all = []) => {
  const content = getRequires(filename);
  const regexp = new RegExp(
    /const {([\w\s,]+)} = require\("([\w./]+)"\);/,
    "g"
  );
  const dependencies = [...content.matchAll(regexp)];
  // return dependencies;
  const allPlus = [...all, ...dependencies];
  if (dependencies.length > 0) {
    const items = dependencies
      .map((item) => {
        const fn = path.resolve(filename, "../", getSourceFilename(item));
        return getDependencies(fn, []);
      })
      .flat();
    return [...allPlus, ...items];
  }
  return allPlus;
};

// extract the code
const importCode = (dependency) => {
  const imports = getImports(dependency);
  const fn = path.resolve("src/", getSourceFilename(dependency));
  const exported = require(fn);
  const code = imports.reduce((acc, k) => {
    const value =
      typeof exported[k] === "string"
        ? `'${exported[k]}'`
        : exported[k].toString();
    return {
      ...acc,
      [k]: value,
    };
  }, {});
  return code;
};

// rewrite all of the import lines with code snippets
const replaceImports = (dependency, bundle) => {
  const code = importCode(dependency);
  const importStatement = getImportStatement(dependency);
  const imports = getImports(dependency);
  const sourceFilename = getSourceFilename(dependency);
  const compiledImports = imports.reduce((output, variable) => {
    const slug = makeSlug(sourceFilename, variable);
    const snippet = `\n/* imported ${variable} from ${sourceFilename} */\nconst ${slug} = ${code[variable]};\n\n`;
    return output + snippet;
  }, "");
  if (bundle.indexOf(importStatement) > -1) {
    return bundle.replace(importStatement, compiledImports);
  } else {
    return compiledImports + bundle;
  }
};

// update code references for this dependency
const replaceReferences = (dependency, bundle) => {
  const sourceFilename = getSourceFilename(dependency);
  const imports = getImports(dependency);
  imports.forEach((variable) => {
    // only replace it when the variable is not preceeded by _
    const varRegex = new RegExp(`(?<!_)${variable}`, "g");
    const slug = makeSlug(sourceFilename, variable);
    bundle = bundle.replace(varRegex, slug);
  });
  return bundle;
};

const main = (entryFilename = "src/index.js") => {
  // read the file
  const content = readFileSync(entryFilename).toString();
  let bundle = content;

  // collect the code
  const dependencies = getDependencies(entryFilename);
  for (const dependency of dependencies) {
    try {
      bundle = replaceImports(dependency, bundle);
      bundle = replaceReferences(dependency, bundle);
    } catch (err) {
      throw new Error(
        "unresolvable dependency found: " + getSourceFilename(dependency)
      );
    }
  }
  // write the file
  writeFileSync("dist/index.js", bundle);
};

main(process.argv[2]);
console.log("bundler finished");
