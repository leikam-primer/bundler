# Bundler POC

## Concept

Code as written is optimized for developer experience. In this context, we care about sane file sizes, human-readable labels, comments, folder structures, etc.

Code as deployed is optimized for client execution. In this context, we care about small file sizes, network and execution speed, referential integrity, etc.

The bundler is what transforms the former to the latter.

## Test

Run the bundler and then launch a browser pointed to the compiled location.

```
node bundle.js && /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome ./dist/index.html
```
