import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import MentorForm from "../components/MentorForm.jsx";

export default function Mentors() {
  const [mentors, setMentors] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...row} = edit

  async function load() {
    setError("");
    const { data, error } = await supabase.from("mentors").select("*").order("sort_order", { ascending: true });
    if (error) setError(error.message);
    else setMentors(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(mentor) {
    if (!confirm(`Delete ${mentor.name}? This also removes their available dates. This can't be undone.`)) return false;
    const { error } = await supabase.from("mentors").delete().eq("id", mentor.id);
    if (error) {
      alert(error.message);
      return false;
    }
    load();
    return true;
  }

  async function handleToggleEnabled(mentor) {
    const { error } = await supabase.from("mentors").update({ enabled: !mentor.enabled }).eq("id", mentor.id);
    if (error) alert(error.message);
    else load();
  }

  return (
    <div>
      <div className="page-header">
        <h1>Mentors</h1>
        <button className="btn btn-primary" onClick={() => setEditing({})}>
          + Add mentor
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}
      {mentors === null && !error && <p className="muted">Loading…</p>}
      {mentors && mentors.length === 0 && <p className="muted">No mentors yet. Add your first one.</p>}

      <div className="mentor-grid">
        {mentors?.map((m) => (
          <div className="mentor-card" key={m.id}>
            <div className="mentor-card-photo">
              {m.photo_mobile_url || m.photo_card_url ? (
                <img src={m.photo_mobile_url || m.photo_card_url} alt={m.name} />
              ) : (
                <div className="photo-placeholder">No photo</div>
              )}
              <span className={"status-badge " + (m.enabled ? "is-enabled" : "is-disabled")}>
                {m.enabled ? "Live" : "Coming soon"}
              </span>
            </div>
            <div className="mentor-card-body">
              <h3>{m.name}</h3>
              <p className="muted">{(m.role || []).join(" · ") || "—"}</p>
              <div className="mentor-card-toprow">
                <button className="btn btn-small" onClick={() => handleToggleEnabled(m)}>
                  {m.enabled ? "Hide" : "Show"}
                </button>
                <button className="btn btn-small" onClick={() => setEditing(m)}>
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing !== null && (
        <MentorForm
          mentor={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          onDelete={async () => {
            const deleted = await handleDelete(editing);
            if (deleted) setEditing(null);
          }}
        />
      )}
    </div>
  );
}
