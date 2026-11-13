import { useEffect, useState } from "react";
import api, { errorText } from "../api";
import EventFilters, { CATEGORIES, filterEvents, isPast, seatsLeft, formatDate } from "../components/EventFilters";

const emptyForm = {
  name: "",
  category: "Technical",
  description: "",
  date: "",
  venue: "",
  organizer: "",
  capacity: 0
};

export default function CoordinatorDashboard() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, upcomingEvents: 0, totalRegistrations: 0 });
  const [message, setMessage] = useState("Loading events...");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [openEvent, setOpenEvent] = useState(null);   // event whose registrations are shown
  const [registrations, setRegistrations] = useState([]);

  const fetchEvents = async () => {
    try {
      const [ev, st] = await Promise.all([api.get("/events"), api.get("/events/stats/summary")]);
      setEvents(ev.data);
      setStats(st.data);
      setMessage("");
    } catch (err) {
      setMessage(errorText(err));
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const payload = { ...formData, capacity: Number(formData.capacity) || 0 };

    try {
      if (editingId) {
        await api.put(`/events/${editingId}`, payload);
        setSuccess("Event updated successfully!");
      } else {
        await api.post("/events", payload);
        setSuccess("Event added successfully!");
      }
      setFormData(emptyForm);
      setEditingId(null);
      await fetchEvents();
    } catch (err) {
      setError(errorText(err, "Operation failed."));
    }
  };

  const handleEdit = (event) => {
    setEditingId(event._id);
    setFormData({
      name: event.name,
      category: event.category,
      description: event.description,
      date: new Date(event.date).toISOString().split("T")[0],
      venue: event.venue,
      organizer: event.organizer,
      capacity: event.capacity || 0
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setError("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event? All its registrations will be removed too.")) return;
    try {
      await api.delete(`/events/${id}`);
      if (openEvent?._id === id) setOpenEvent(null);
      setSuccess("Event deleted successfully!");
      await fetchEvents();
    } catch (err) {
      setError(errorText(err, "Unable to delete event."));
    }
  };

  // Show / hide the list of registered students
  const toggleRegistrations = async (event) => {
    if (openEvent?._id === event._id) return setOpenEvent(null);
    try {
      const res = await api.get(`/events/${event._id}/registrations`);
      setRegistrations(res.data);
      setOpenEvent(event);
    } catch (err) {
      setError(errorText(err));
    }
  };

  const toggleAttendance = async (reg) => {
    try {
      await api.patch(`/events/${openEvent._id}/registrations/${reg._id}/attendance`, { attended: !reg.attended });
      setRegistrations(registrations.map((r) => (r._id === reg._id ? { ...r, attended: !r.attended } : r)));
    } catch (err) {
      setError(errorText(err));
    }
  };

  // Download the registration list as a CSV file (opens in Excel)
  const downloadCsv = () => {
    const quote = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["Name", "Email", "Department", "Attended"]].concat(
      registrations.map((r) => [r.student.name, r.student.email, r.student.department, r.attended ? "Yes" : "No"])
    );
    const csv = rows.map((r) => r.map(quote).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${openEvent.name.replace(/\W+/g, "_")}_registrations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const visible = filterEvents(events, search, category);

  return (
    <main className="container">
      <div className="stats">
        <div className="stat"><strong>{stats.totalEvents}</strong><span>Total Events</span></div>
        <div className="stat"><strong>{stats.upcomingEvents}</strong><span>Upcoming</span></div>
        <div className="stat"><strong>{stats.totalRegistrations}</strong><span>Registrations</span></div>
      </div>

      <section className="form-section">
        <h2>{editingId ? "Edit Event" : "Add New Event"}</h2>

        <form onSubmit={handleSubmit}>
          <input type="text" name="name" placeholder="Event Name" value={formData.name} onChange={handleChange} required />

          <select name="category" value={formData.category} onChange={handleChange} required>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <textarea name="description" placeholder="Event Description" value={formData.description} onChange={handleChange} required />

          <input type="date" name="date" value={formData.date} onChange={handleChange} required />
          <input type="text" name="venue" placeholder="Event Venue" value={formData.venue} onChange={handleChange} required />
          <input type="text" name="organizer" placeholder="Organizer" value={formData.organizer} onChange={handleChange} required />

          <label className="field-label">
            Seat limit (0 = unlimited)
            <input type="number" min="0" name="capacity" value={formData.capacity} onChange={handleChange} />
          </label>

          <button type="submit">{editingId ? "Update Event" : "Add Event"}</button>

          {editingId && (
            <button type="button" className="cancel-button" onClick={handleCancel}>Cancel Editing</button>
          )}
        </form>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </section>

      <section className="events-section">
        <h2>Manage Events</h2>
        <EventFilters search={search} setSearch={setSearch} category={category} setCategory={setCategory} />

        {message && <p>{message}</p>}
        {!message && visible.length === 0 && <p>No events found. Add your first event!</p>}

        <div className="events">
          {visible.map((event) => {
            const left = seatsLeft(event);
            return (
              <div className="event-card" key={event._id}>
                <span className={`badge ${isPast(event) ? "past" : "upcoming"}`}>
                  {isPast(event) ? "Completed" : "Upcoming"}
                </span>
                <h3>{event.name}</h3>
                <p><strong>Category:</strong> {event.category}</p>
                <p><strong>Description:</strong> {event.description}</p>
                <p><strong>Date:</strong> {formatDate(event.date)}</p>
                <p><strong>Venue:</strong> {event.venue}</p>
                <p><strong>Organizer:</strong> {event.organizer}</p>
                <p>
                  <strong>Registered:</strong> {event.registeredCount}
                  {left !== null && ` / ${event.capacity}`}
                </p>

                <button className="view-button" onClick={() => toggleRegistrations(event)}>
                  {openEvent?._id === event._id ? "Hide Registrations" : "View Registrations"}
                </button>

                {event.canManage ? (
                  <>
                    <button className="edit-button" onClick={() => handleEdit(event)}>Edit Event</button>
                    <button className="delete-button" onClick={() => handleDelete(event._id)}>Delete Event</button>
                  </>
                ) : (
                  <p className="muted">Created by another coordinator</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {openEvent && (
        <section className="events-section">
          <div className="section-head">
            <h2>Registrations: {openEvent.name}</h2>
            {registrations.length > 0 && (
              <button className="small-button" onClick={downloadCsv}>Download CSV</button>
            )}
          </div>

          {registrations.length === 0 ? (
            <p>No students have registered yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Department</th><th>Attended</th></tr>
                </thead>
                <tbody>
                  {registrations.map((r) => (
                    <tr key={r._id}>
                      <td>{r.student.name}</td>
                      <td>{r.student.email}</td>
                      <td>{r.student.department || "-"}</td>
                      <td>
                        <input type="checkbox" checked={r.attended} onChange={() => toggleAttendance(r)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
