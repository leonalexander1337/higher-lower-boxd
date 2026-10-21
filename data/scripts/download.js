const fs = require("fs");
const path = require("path");
const https = require("https");
const zlib = require("zlib");
const { pipeline } = require("stream/promises");

const RAW_DIR = path.join(__dirname, "..", "raw");
const BASE_URL = "https://datasets.imdbws.com";

const FILES = [
    "title.basics.tsv",
    "title.ratings.tsv"
];

// =====================
// HTTP
// =====================
function get(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            if (res.statusCode !== 200) {
                res.resume();
                reject(new Error(`${url} -> HTTP ${res.statusCode}`));
                return;
            }
            resolve(res);
        }).on("error", reject);
    });
}

// =====================
// REPLACE
// =====================
// On Windows a file that is open in another program (editor, IDE)
// can't be replaced, so retry a few times before giving up.
async function replace(tmp, target) {
    for (let attempt = 1; attempt <= 5; attempt++) {
        try {
            fs.renameSync(tmp, target);
            return;
        } catch (e) {
            if (!["EPERM", "EBUSY", "EACCES"].includes(e.code)) throw e;
            if (attempt === 5) {
                throw new Error(`${path.basename(target)} is locked - close it in your editor and run again`);
            }
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

// =====================
// DOWNLOAD + UNZIP
// =====================
// Writes to a .tmp file first and only replaces the existing file
// once the download is complete, so a failed run never leaves a
// half-written dataset behind.
async function download(name) {
    const url = `${BASE_URL}/${name}.gz`;
    const target = path.join(RAW_DIR, name);
    const tmp = `${target}.tmp`;

    console.log(`downloading ${url}`);

    const res = await get(url);
    const total = parseInt(res.headers["content-length"]) || 0;
    let received = 0;
    let lastLogged = 0;

    res.on("data", chunk => {
        received += chunk.length;
        if (received - lastLogged >= 25 * 1024 * 1024) {
            lastLogged = received;
            const mb = (received / 1024 / 1024).toFixed(0);
            const pct = total ? ` (${Math.round(received / total * 100)}%)` : "";
            console.log(`  ${name}: ${mb} MB${pct}`);
        }
    });

    try {
        await pipeline(res, zlib.createGunzip(), fs.createWriteStream(tmp));
        await replace(tmp, target);
    } catch (e) {
        fs.rmSync(tmp, { force: true });
        throw e;
    }

    console.log(`  ${name}: done`);
}

// =====================
// RUN
// =====================
(async () => {
    fs.mkdirSync(RAW_DIR, { recursive: true });

    for (const name of FILES) {
        await download(name);
    }

    console.log("download done");
})().catch(e => {
    console.error("download failed:", e.message);
    process.exit(1);
});
