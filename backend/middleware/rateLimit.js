// Very small in-memory limiter to slow down password guessing on /login.
const attempts = new Map(); // key -> { count, resetAt }

function loginLimiter(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    return {
        check(key) {
            const entry = attempts.get(key);
            if (!entry || entry.resetAt < Date.now()) return true;
            return entry.count < maxAttempts;
        },
        fail(key) {
            const entry = attempts.get(key);
            if (!entry || entry.resetAt < Date.now()) {
                attempts.set(key, { count: 1, resetAt: Date.now() + windowMs });
            } else {
                entry.count++;
            }
        },
        reset(key) {
            attempts.delete(key);
        }
    };
}

module.exports = loginLimiter;
