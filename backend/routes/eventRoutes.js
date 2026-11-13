
const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const { protect, allowRoles } = require("../middleware/auth");

// Every event route needs a logged-in user.
router.use(protect);

// Only these fields may be set from the request body (prevents mass-assignment).
const pickEventFields = (body = {}) => {
    const { name, category, description, date, venue, organizer, capacity } = body;
    return { name, category, description, date, venue, organizer, capacity };
};

// A coordinator can manage events they created (and old events that had no owner).
const canManage = (event, user) => !event.createdBy || String(event.createdBy) === String(user._id);

const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

// GET: all events (with seat counts, and whether the logged-in student has registered)
router.get("/", async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 }).lean();
        const regs = await Registration.find({ event: { $in: events.map((e) => e._id) } }).lean();

        const counts = {};
        const mine = new Set();
        regs.forEach((r) => {
            counts[r.event] = (counts[r.event] || 0) + 1;
            if (String(r.student) === String(req.user._id)) mine.add(String(r.event));
        });

        res.json(events.map((e) => ({
            ...e,
            registeredCount: counts[e._id] || 0,
            isRegistered: mine.has(String(e._id)),
            canManage: req.user.role === "coordinator" && canManage(e, req.user)
        })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET: events the logged-in student has registered for
router.get("/my/registrations", allowRoles("student"), async (req, res) => {
    try {
        const regs = await Registration.find({ student: req.user._id }).populate("event").lean();
        res.json(regs.filter((r) => r.event).map((r) => ({
            _id: r._id,
            attended: r.attended,
            registeredOn: r.createdAt,
            event: r.event
        })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET: summary numbers for the coordinator dashboard
router.get("/stats/summary", allowRoles("coordinator"), async (req, res) => {
    try {
        const events = await Event.find().lean();
        const totalRegistrations = await Registration.countDocuments();
        const today = startOfToday();
        res.json({
            totalEvents: events.length,
            upcomingEvents: events.filter((e) => new Date(e.date) >= today).length,
            totalRegistrations
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST: add a new event (coordinator only)
router.post("/", allowRoles("coordinator"), async (req, res) => {
    try {
        const newEvent = new Event({ ...pickEventFields(req.body), createdBy: req.user._id });
        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT: update an event (coordinator who owns it)
router.put("/:id", allowRoles("coordinator"), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });
        if (!canManage(event, req.user)) {
            return res.status(403).json({ message: "You can only edit events you created." });
        }

        const fields = pickEventFields(req.body);
        Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k]);
        event.set(fields);
        if (!event.createdBy) event.createdBy = req.user._id;

        res.json(await event.save());
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE: remove an event and its registrations (coordinator who owns it)
router.delete("/:id", allowRoles("coordinator"), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });
        if (!canManage(event, req.user)) {
            return res.status(403).json({ message: "You can only delete events you created." });
        }

        await Registration.deleteMany({ event: event._id });
        await event.deleteOne();
        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// POST: student registers for an event
router.post("/:id/register", allowRoles("student"), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (new Date(event.date) < startOfToday()) {
            return res.status(400).json({ message: "This event has already taken place." });
        }

        const already = await Registration.findOne({ event: event._id, student: req.user._id });
        if (already) {
            return res.status(409).json({ message: "You are already registered for this event." });
        }

        if (event.capacity > 0) {
            const taken = await Registration.countDocuments({ event: event._id });
            if (taken >= event.capacity) {
                return res.status(400).json({ message: "Sorry, this event is full." });
            }
        }

        const reg = await Registration.create({ event: event._id, student: req.user._id });
        res.status(201).json(reg);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "You are already registered for this event." });
        }
        res.status(400).json({ message: error.message });
    }
});

// DELETE: student cancels their registration
router.delete("/:id/register", allowRoles("student"), async (req, res) => {
    try {
        const removed = await Registration.findOneAndDelete({ event: req.params.id, student: req.user._id });
        if (!removed) return res.status(404).json({ message: "You are not registered for this event." });
        res.json({ message: "Registration cancelled." });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// GET: list of students registered for an event (coordinator who owns it)
router.get("/:id/registrations", allowRoles("coordinator"), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });
        if (!canManage(event, req.user)) {
            return res.status(403).json({ message: "You can only view registrations for your events." });
        }

        const regs = await Registration.find({ event: event._id }).populate("student", "name email department").lean();
        res.json(regs.filter((r) => r.student));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PATCH: coordinator marks a student present / absent
router.patch("/:id/registrations/:regId/attendance", allowRoles("coordinator"), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });
        if (!canManage(event, req.user)) {
            return res.status(403).json({ message: "You can only manage your own events." });
        }

        const reg = await Registration.findOneAndUpdate(
            { _id: req.params.regId, event: event._id },
            { attended: Boolean(req.body && req.body.attended) },
            { new: true }
        );
        if (!reg) return res.status(404).json({ message: "Registration not found" });
        res.json(reg);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
