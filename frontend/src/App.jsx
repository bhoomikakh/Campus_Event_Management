
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5000/api/events";

const emptyForm = {
  name: "",
  category: "Technical",
  description: "",
  date: "",
  venue: "",
  organizer: ""
};

function App() {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("Loading events...");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  // Get all events
  const fetchEvents = async () => {
    try {
      const response = await axios.get(API_URL);
      setEvents(response.data);
      setMessage("");
    } catch (err) {
      setMessage("Unable to connect to backend.");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Add or update event
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, formData);
        alert("Event updated successfully!");
      } else {
        await axios.post(API_URL, formData);
        alert("Event added successfully!");
      }

      setFormData(emptyForm);
      setEditingId(null);
      await fetchEvents();

    } catch (err) {
      setError(err.response?.data?.message || "Operation failed.");
    }
  };

  // Load event details into form
  const handleEdit = (event) => {
    setEditingId(event._id);

    setFormData({
      name: event.name,
      category: event.category,
      description: event.description,
      date: new Date(event.date).toISOString().split("T")[0],
      venue: event.venue,
      organizer: event.organizer
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setError("");
  };

  // Delete event
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/${id}`);
      await fetchEvents();
      alert("Event deleted successfully!");
    } catch (err) {
      setError("Unable to delete event.");
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Campus Event Management System</h1>
        <p>Discover and participate in college events!</p>
      </header>

      <main className="container">

        <section className="form-section">
          <h2>{editingId ? "Edit Event" : "Add New Event"}</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Event Name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="Technical">Technical</option>
              <option value="Cultural">Cultural</option>
              <option value="Sports">Sports</option>
              <option value="Academic">Academic</option>
            </select>

            <textarea
              name="description"
              placeholder="Event Description"
              value={formData.description}
              onChange={handleChange}
              required
            />

            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="venue"
              placeholder="Event Venue"
              value={formData.venue}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="organizer"
              placeholder="Organizer"
              value={formData.organizer}
              onChange={handleChange}
              required
            />

            <button type="submit">
              {editingId ? "Update Event" : "Add Event"}
            </button>

            {editingId && (
              <button
                type="button"
                className="cancel-button"
                onClick={handleCancel}
              >
                Cancel Editing
              </button>
            )}
          </form>

          {error && <p className="error">{error}</p>}
        </section>

        <section className="events-section">
          <h2>Upcoming Events</h2>

          {message && <p>{message}</p>}

          {!message && events.length === 0 && (
            <p>No events available. Add your first event!</p>
          )}

          <div className="events">
            {events.map((event) => (
              <div className="event-card" key={event._id}>
                <h3>{event.name}</h3>
                <p><strong>Category:</strong> {event.category}</p>
                <p><strong>Description:</strong> {event.description}</p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(event.date).toLocaleDateString("en-IN")}
                </p>
                <p><strong>Venue:</strong> {event.venue}</p>
                <p><strong>Organizer:</strong> {event.organizer}</p>

                <button
                  className="edit-button"
                  onClick={() => handleEdit(event)}
                >
                  Edit Event
                </button>

                <button
                  className="delete-button"
                  onClick={() => handleDelete(event._id)}
                >
                  Delete Event
                </button>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;
