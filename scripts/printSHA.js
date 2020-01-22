const sha = require('child_process').execSync('git rev-parse HEAD').toString().trim()

const newFileContents = `// This file is auto-generated in printSHA.js
export const sha = "${sha}"`
require('fs').writeFileSync("src/sha.ts", newFileContents)
console.log("Updated src/sha.ts with current sha")
