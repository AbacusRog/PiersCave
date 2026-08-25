import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../lib/auth";

const LINKS = [
  { to: "/", label: "Due Dates", end: true },
  { to: "/companies", label: "Companies" },
  { to: "/people", label: "People" },
];

export default function Navbar() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div className="border-b" style={{ borderColor: "var(--rule)", background: "var(--card)" }}>
      <div className="max-w-6xl mx-auto px-5 md:px-8 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <span className="ddt-serif text-base font-semibold" style={{ color: "var(--accent)" }}>
            Piers Cave Group
          </span>
          <nav className="flex items-center gap-1">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  "text-sm px-3 py-1.5 rounded-md font-medium " + (isActive ? "" : "opacity-70 hover:opacity-100")
                }
                style={({ isActive }) => ({
                  background: isActive ? "var(--paper)" : "transparent",
                  color: "var(--ink)",
                })}
              >
                {l.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  "text-sm px-3 py-1.5 rounded-md font-medium " + (isActive ? "" : "opacity-70 hover:opacity-100")
                }
                style={({ isActive }) => ({
                  background: isActive ? "var(--paper)" : "transparent",
                  color: "var(--ink)",
                })}
              >
                Admin Access
              </NavLink>
            )}
          </nav>
        </div>
        <button
          onClick={signOut}
          className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-md border"
          style={{ borderColor: "var(--rule)", color: "var(--ink-muted)" }}
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </div>
  );
}
