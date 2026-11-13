// Password hashing + JSON Web Token helpers.
// Built only on Node's core "crypto" module, so no extra npm packages are needed.
const crypto = require("crypto");

// ---------- Password hashing (scrypt + random salt) ----------
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
    const [salt, hash] = String(stored).split(":");
    if (!salt || !hash) return false;
    const attempt = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return attempt.length === expected.length && crypto.timingSafeEqual(attempt, expected);
}

// ---------- JWT (HS256) ----------
const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");

function sign(data, secret) {
    return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

function signToken(payload, expiresInSeconds = 2 * 60 * 60) {
    const secret = process.env.JWT_SECRET;
    const now = Math.floor(Date.now() / 1000);
    const head = b64({ alg: "HS256", typ: "JWT" });
    const body = b64({ ...payload, iat: now, exp: now + expiresInSeconds });
    return `${head}.${body}.${sign(`${head}.${body}`, secret)}`;
}

// Returns the payload if the token is valid and not expired, otherwise null.
function verifyToken(token) {
    try {
        const [head, body, signature] = String(token).split(".");
        if (!head || !body || !signature) return null;

        const expected = Buffer.from(sign(`${head}.${body}`, process.env.JWT_SECRET));
        const given = Buffer.from(signature);
        if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;

        const payload = JSON.parse(Buffer.from(body, "base64url").toString());
        if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch {
        return null;
    }
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken };
