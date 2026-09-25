import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const STATUS_OPTIONS = ["pending", "confirmed", "declined"];

export default function Bookings() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");
  const [mentorFilter, setMentorFilter] = useState("all");

  async function load() {
    setError("");
    const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setBookings(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id, status) {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) alert(error.message);
    else load();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this booking submission? This can't be undone.")) return;
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) alert(error.message);
    else load();
  }

  const mentorNames = useMemo(() => {
    if (!bookings) return [];
    return [...new Set(bookings.map((b) => b.mentor_name))];
  }, [bookings]);

  const filtered = useMemo(() => {
    if (!bookings) return [];
    if (mentorFilter === "all") return bookings;
    return bookings.filter((b) => b.mentor_name === mentorFilter);
  }, [bookings, mentorFilter]);

  function csvCell(value) {
    const s = value === null || value === undefined ? "" : String(value);
    return '"' + s.replace(/"/g, '""') + '"';
  }

  function exportCsv() {
    const columns = ["created_at", "mentor_name", "requested_date", "name", "email", "phone", "designation", "organisation", "message", "status"];
    const header = columns.map(csvCell).join(",");
    const rows = filtered.map((b) => columns.map((c) => csvCell(b[c])).join(","));
    const csv = [header, ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bfi-bookings-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Bookings</h1>
        <div className="page-header-actions">
          {bookings && bookings.length > 0 && (
            <select value={mentorFilter} onChange={(e) => setMentorFilter(e.target.value)} className="mentor-filter">
              <option value="all">All mentors</option>
              {mentorNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          )}
          {filtered.length > 0 && (
            <button className="btn btn-primary" onClick={exportCsv}>
              Export CSV
            </button>
          )}
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}
      {bookings === null && !error && <p className="muted">Loading…</p>}
      {bookings && bookings.length === 0 && <p className="muted">No booking requests yet.</p>}

      {filtered.length > 0 && (
        <div className="table-wrap">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Mentor</th>
                <th>Requested date</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Designation</th>
                <th>Organisation</th>
                <th>Reason</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td className="nowrap">{new Date(b.created_at).toLocaleString()}</td>
                  <td className="nowrap">{b.mentor_name}</td>
                  <td className="nowrap">{new Date(b.requested_date + "T00:00:00").toLocaleDateString()}</td>
                  <td>{b.name}</td>
                  <td>{b.email}</td>
                  <td className="nowrap">{b.phone}</td>
                  <td>{b.designation || "—"}</td>
                  <td>{b.organisation || "—"}</td>
                  <td className="wrap-cell">{b.message || "—"}</td>
                  <td>
                    <select value={b.status} onChange={(e) => updateStatus(b.id, e.target.value)} className={"status-select status-" + b.status}>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-small btn-danger" onClick={() => handleDelete(b.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
