import { useAuth } from "../AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-inner">
        <div>
          <h1>Campus Event Management System</h1>
          <p>Discover and participate in college events!</p>
        </div>
        {user && (
          <div className="user-box">
            <span>
              {user.name} <em className={`role-badge ${user.role}`}>{user.role}</em>
            </span>
            <button className="logout-button" onClick={logout}>Logout</button>
          </div>
        )}
      </div>
    </header>
  );
}
