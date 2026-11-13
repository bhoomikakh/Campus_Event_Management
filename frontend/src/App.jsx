import "./App.css";
import { AuthProvider, useAuth } from "./AuthContext";
import Navbar from "./components/Navbar";
import AuthPage from "./pages/AuthPage";
import StudentDashboard from "./pages/StudentDashboard";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";

// Shows the right screen depending on login state and role
function Screens() {
  const { user, loading } = useAuth();

  if (loading) return <p className="center-text">Loading...</p>;
  if (!user) return <AuthPage />;
  return user.role === "coordinator" ? <CoordinatorDashboard /> : <StudentDashboard />;
}

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Navbar />
        <Screens />
      </div>
    </AuthProvider>
  );
}

export default App;
