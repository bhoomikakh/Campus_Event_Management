const User = require("../models/User");
const { verifyToken } = require("../utils/auth");

// protect: user must send a valid "Authorization: Bearer <token>" header.
async function protect(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    const payload = token && verifyToken(token);
    if (!payload) {
        return res.status(401).json({ message: "Please log in to continue." });
    }

    const user = await User.findById(payload.id).select("-passwordHash");
    if (!user) {
        return res.status(401).json({ message: "Account no longer exists." });
    }

    req.user = user;
    next();
}

// allowRoles("coordinator") -> only users with that role may pass.
function allowRoles(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "You are not allowed to do this." });
        }
        next();
    };
}

module.exports = { protect, allowRoles };
