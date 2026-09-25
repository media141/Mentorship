import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AvailabilityManager({ mentorId }) {
  const [dates, setDates] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const { data, error } = await supabase
      .from("mentor_availability")
      .select("*")
      .eq("mentor_id", mentorId)
      .order("available_date", { ascending: true });
    if (error) setError(error.message);
    else setDates(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentorId]);

  async function addDate() {
    if (!newDate) {
      setError("Pick a date first, then click Add date.");
      return;
    }
    setError("");
    const { error } = await supabase.from("mentor_availability").insert({ mentor_id: mentorId, available_date: newDate });
    if (error) {
      setError(error.code === "23505" ? "That date is already added." : error.message);
    } else {
      setNewDate("");
      load();
    }
  }

  async function removeDate(id) {
    const { error } = await supabase.from("mentor_availability").delete().eq("id", id);
    if (error) setError(error.message);
    else load();
  }

  return (
    <div className="availability">
      <div className="availability-add">
        <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
        <button type="button" className="btn btn-small btn-primary" disabled={!newDate} onClick={addDate}>
          Add date
        </button>
      </div>
      {error && <div className="form-error">{error}</div>}
      {dates === null ? (
        <p className="muted">Loading…</p>
      ) : dates.length === 0 ? (
        <p className="muted">No dates added yet — this mentor won't show any bookable slots.</p>
      ) : (
        <ul className="availability-list">
          {dates.map((d) => (
            <li key={d.id}>
              <span>
                {new Date(d.available_date + "T00:00:00").toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <button type="button" className="chip-remove" onClick={() => removeDate(d.id)} aria-label="Remove date">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
