const fs = require("fs");

// Helper: convert a string in base b to decimal (BigInt-safe)
function baseToDec(str, base) {
  const digits = "0123456789abcdefghijklmnopqrstuvwxyz";
  let val = 0n;
  for (const c of str.toLowerCase()) {
    const digit = BigInt(digits.indexOf(c));
    val = val * BigInt(base) + digit;
  }
  return val;
}

// Lagrange interpolation at x=0
function lagrangeSecret(points, k) {
  let secret = 0n;

  for (let i = 0; i < k; i++) {
    let xi = BigInt(points[i][0]);
    let yi = points[i][1];
    let termNum = yi;
    let termDen = 1n;

    for (let j = 0; j < k; j++) {
      if (i !== j) {
        let xj = BigInt(points[j][0]);
        termNum *= (0n - xj);
        termDen *= (xi - xj);
      }
    }
    secret += termNum / termDen;
  }
  return secret;
}

// Verify all shares
function verifyShares(points, polyPoints, k) {
  const bad = [];
  const f = (x) => {
    let res = 0n;
    for (let i = 0; i < k; i++) {
      let xi = BigInt(polyPoints[i][0]);
      let yi = polyPoints[i][1];
      let termNum = yi;
      let termDen = 1n;

      for (let j = 0; j < k; j++) {
        if (i !== j) {
          let xj = BigInt(polyPoints[j][0]);
          termNum *= (BigInt(x) - xj);
          termDen *= (xi - xj);
        }
      }
      res += termNum / termDen;
    }
    return res;
  };

  for (const [x, y] of points) {
    if (f(x) !== y) {
      bad.push([x, y]);
    }
  }
  return bad;
}

// ---------- MAIN ----------

// Read JSON from file (first CLI argument)
if (process.argv.length < 3) {
  console.error("Usage: node app.js <input.json>");
  process.exit(1);
}

const raw = fs.readFileSync(process.argv[2], "utf-8");
const input = JSON.parse(raw);

// Step 1: convert JSON -> (x,y) points
let points = [];
for (const key in input) {
  if (key !== "keys") {
    const x = parseInt(key, 10);
    const base = parseInt(input[key].base, 10);
    const y = baseToDec(input[key].value, base);
    points.push([x, y]);
  }
}

const k = input.keys.k;

// Step 2: compute secret from first k points
const secret = lagrangeSecret(points.slice(0, k), k);
console.log("Secret (f(0)):", secret.toString());

// Step 3: check for incorrect shares
const badShares = verifyShares(points, points.slice(0, k), k);
console.log("Incorrect shares:", badShares);
