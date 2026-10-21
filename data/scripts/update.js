const path = require("path");
const { execFileSync } = require("child_process");

// Full data refresh: download -> preprocess -> build
const STEPS = ["download.js", "preprocess.js", "build.js"];

for (const step of STEPS) {
    console.log(`\n=== ${step} ===`);
    execFileSync(process.execPath, [path.join(__dirname, step)], { stdio: "inherit" });
}

console.log("\nupdate done");
