const { readFileSync, writeFileSync } = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const makeSlug = (sourceFilename, variable) => {
  const slug = sourceFilename.replace(/[^\w]+/g, "_");
  return "module_" + slug + "_" + variable;
};

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

// maps regex match fields to dependency object
const matchToObject = (filename) => (match) => {
  return {
    importPath: match[2],
    path: path.resolve(filename, "../", match[2]),
    importStatement: match[0],
    imports: match[1].split(",").map((i) => i.trim()),
  };
};

const getDependencies = (filename, all = []) => {
  const content = getRequires(filename);
  const regexp = new RegExp(
    /const {([\w\s,]+)} = require\("([\w./]+)"\);/,
    "g"
  );
  const dependencies = [...content.matchAll(regexp)].map(
    matchToObject(filename)
  );
  // return dependencies;
  const allPlus = [...all, ...dependencies];
  if (dependencies.length > 0) {
    const items = dependencies
      .map((item) => {
        const fn = path.resolve(filename, "../", item.importPath);
        return getDependencies(fn, []);
      })
      .flat();
    return [...allPlus, ...items];
  }
  return allPlus;
};

// extract the code
const importCode = (dependency) => {
  const exported = require(dependency.path);
  const code = dependency.imports.reduce((acc, k) => {
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
  const compiledImports = dependency.imports.reduce((output, variable) => {
    const slug = makeSlug(dependency.importPath, variable);
    const snippet = `\n/* imported _${variable} from ${dependency.importPath} */\nconst ${slug} = ${code[variable]};\n\n`;
    return output + snippet;
  }, "");
  if (bundle.indexOf(dependency.importStatement) > -1) {
    return bundle.replace(dependency.importStatement, compiledImports);
  } else {
    return compiledImports + bundle;
  }
};

// update code references for this dependency
const replaceReferences = (dependency, bundle) => {
  const sourceFilename = dependency.importPath;
  dependency.imports.forEach((variable) => {
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
      console.error(err);
      throw new Error(
        "unresolvable dependency found: " + dependency.importPath
      );
    }
  }
  // write the file
  writeFileSync("dist/index.js", bundle);
};

main(process.argv[2]);
console.log("bundler finished");
