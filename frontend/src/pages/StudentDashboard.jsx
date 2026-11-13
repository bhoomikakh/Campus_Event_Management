import { useEffect, useState } from "react";
import api, { errorText } from "../api";
import EventFilters, { filterEvents, isPast, seatsLeft, formatDate } from "../components/EventFilters";

export default function StudentDashboard() {
  const [events, setEvents] = useState([]);
  const [myRegs, setMyRegs] = useState([]);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState("Loading events...");
  const [notice, setNotice] = useState({ type: "", text: "" });

  const load = async () => {
    try {
      const [ev, regs] = await Promise.all([api.get("/events"), api.get("/events/my/registrations")]);
      setEvents(ev.data);
      setMyRegs(regs.data);
      setMessage("");
    } catch (err) {
      setMessage(errorText(err));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (fn, okText) => {
    try {
      await fn();
      setNotice({ type: "success", text: okText });
      await load();
    } catch (err) {
      setNotice({ type: "error", text: errorText(err) });
    }
  };

  const register = (id) => act(() => api.post(`/events/${id}/register`), "Registered successfully!");

  const cancel = (id) => {
    if (!window.confirm("Cancel your registration for this event?")) return;
    act(() => api.delete(`/events/${id}/register`), "Registration cancelled.");
  };

  const visible = filterEvents(events, search, category);
  const upcomingCount = myRegs.filter((r) => !isPast(r.event)).length;

  return (
    <main className="container">
      <div className="stats">
        <div className="stat"><strong>{events.length}</strong><span>Total Events</span></div>
        <div className="stat"><strong>{myRegs.length}</strong><span>My Registrations</span></div>
        <div className="stat"><strong>{upcomingCount}</strong><span>My Upcoming</span></div>
      </div>

      <div className="tabs page-tabs">
        <button className={tab === "all" ? "tab active" : "tab"} onClick={() => setTab("all")}>All Events</button>
        <button className={tab === "mine" ? "tab active" : "tab"} onClick={() => setTab("mine")}>My Registrations</button>
      </div>

      {notice.text && <p className={notice.type === "error" ? "error" : "success"}>{notice.text}</p>}
      {message && <p>{message}</p>}

      {tab === "all" && (
        <section className="events-section">
          <h2>Browse Events</h2>
          <EventFilters search={search} setSearch={setSearch} category={category} setCategory={setCategory} />

          {!message && visible.length === 0 && <p>No events found.</p>}

          <div className="events">
            {visible.map((event) => {
              const left = seatsLeft(event);
              const past = isPast(event);
              const full = left !== null && left <= 0;

              return (
                <div className="event-card" key={event._id}>
                  <span className={`badge ${past ? "past" : "upcoming"}`}>{past ? "Completed" : "Upcoming"}</span>
                  <h3>{event.name}</h3>
                  <p><strong>Category:</strong> {event.category}</p>
                  <p>{event.description}</p>
                  <p><strong>Date:</strong> {formatDate(event.date)}</p>
                  <p><strong>Venue:</strong> {event.venue}</p>
                  <p><strong>Organizer:</strong> {event.organizer}</p>
                  <p>
                    <strong>Seats:</strong>{" "}
                    {left === null ? "Open to all" : full ? "Full" : `${left} of ${event.capacity} left`}
                  </p>

                  {event.isRegistered ? (
                    <button className="delete-button" disabled={past} onClick={() => cancel(event._id)}>
                      Cancel Registration
                    </button>
                  ) : (
                    <button className="edit-button" disabled={past || full} onClick={() => register(event._id)}>
                      {past ? "Event Over" : full ? "Event Full" : "Register"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === "mine" && (
        <section className="events-section">
          <h2>My Registrations</h2>
          {!message && myRegs.length === 0 && <p>You have not registered for any events yet.</p>}

          <div className="events">
            {myRegs.map((r) => (
              <div className="event-card" key={r._id}>
                <span className={`badge ${r.attended ? "present" : isPast(r.event) ? "past" : "upcoming"}`}>
                  {r.attended ? "Attended" : isPast(r.event) ? "Completed" : "Registered"}
                </span>
                <h3>{r.event.name}</h3>
                <p><strong>Date:</strong> {formatDate(r.event.date)}</p>
                <p><strong>Venue:</strong> {r.event.venue}</p>
                <p><strong>Registered on:</strong> {formatDate(r.registeredOn)}</p>
                {!isPast(r.event) && (
                  <button className="delete-button" onClick={() => cancel(r.event._id)}>Cancel Registration</button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
