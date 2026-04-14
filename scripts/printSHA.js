const { execSync } = require('child_process')
const { writeFileSync } = require('fs')

const sha = execSync('git rev-parse HEAD').toString().trim()

const newFileContents = `// This file is auto-generated in printSHA.js
export const sha = "${sha}"`
writeFileSync("src/sha.ts", newFileContents)
console.log("Updated src/sha.ts with current sha")
