export const CATEGORIES = ["Technical", "Cultural", "Sports", "Academic"];

export const isPast = (event) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(event.date) < today;
};

export const seatsLeft = (event) =>
  event.capacity > 0 ? event.capacity - (event.registeredCount || 0) : null;

export const formatDate = (d) => new Date(d).toLocaleDateString("en-IN");

export function filterEvents(events, search, category) {
  const q = search.trim().toLowerCase();
  return events.filter(
    (e) =>
      (category === "All" || e.category === category) &&
      (!q ||
        e.name.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.organizer.toLowerCase().includes(q))
  );
}

export default function EventFilters({ search, setSearch, category, setCategory }) {
  return (
    <div className="filters">
      <input
        type="text"
        placeholder="Search by name, venue or organizer..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="All">All Categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );
}
