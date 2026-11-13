import { useState } from "react";
import { useAuth } from "../AuthContext";
import { errorText } from "../api";

const empty = { name: "", email: "", password: "", confirm: "", department: "", coordinatorCode: "" };

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");      // login | signup
  const [role, setRole] = useState("student");    // student | coordinator
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const switchMode = (m) => {
    setMode(m);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      if (form.password.length < 6) return setError("Password must be at least 6 characters.");
      if (form.password !== form.confirm) return setError("Passwords do not match.");
    }

    setBusy(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          department: form.department,
          role,
          coordinatorCode: role === "coordinator" ? form.coordinatorCode : undefined
        });
      }
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="tabs">
        <button className={mode === "login" ? "tab active" : "tab"} onClick={() => switchMode("login")}>
          Login
        </button>
        <button className={mode === "signup" ? "tab active" : "tab"} onClick={() => switchMode("signup")}>
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === "signup" && (
          <>
            <div className="role-switch">
              <label className={role === "student" ? "selected" : ""}>
                <input type="radio" checked={role === "student"} onChange={() => setRole("student")} />
                Student
              </label>
              <label className={role === "coordinator" ? "selected" : ""}>
                <input type="radio" checked={role === "coordinator"} onChange={() => setRole("coordinator")} />
                Coordinator
              </label>
            </div>

            <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
            <input name="department" placeholder="Department (e.g. CSE)" value={form.department} onChange={handleChange} />
          </>
        )}

        <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />

        {mode === "signup" && (
          <>
            <input type="password" name="confirm" placeholder="Confirm Password" value={form.confirm} onChange={handleChange} required />
            {role === "coordinator" && (
              <input
                type="password"
                name="coordinatorCode"
                placeholder="Coordinator Access Code"
                value={form.coordinatorCode}
                onChange={handleChange}
                required
              />
            )}
          </>
        )}

        <button type="submit" disabled={busy}>
          {busy ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
