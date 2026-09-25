import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.jsx";

export default function Layout() {
  const { signOut } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">BFI Mentors</div>
        <nav>
          <NavLink to="/mentors" className={({ isActive }) => (isActive ? "nav-link is-active" : "nav-link")}>
            Mentors
          </NavLink>
          <NavLink to="/bookings" className={({ isActive }) => (isActive ? "nav-link is-active" : "nav-link")}>
            Bookings
          </NavLink>
        </nav>
        <button className="btn btn-ghost signout-btn" onClick={() => signOut()}>
          Sign out
        </button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
