const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    attended: { type: Boolean, default: false }
}, { timestamps: true });

// A student can register for a given event only once.
registrationSchema.index({ event: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Registration", registrationSchema);
