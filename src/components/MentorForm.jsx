import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import ImageUploadField from "./ImageUploadField.jsx";
import AvailabilityManager from "./AvailabilityManager.jsx";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function MentorForm({ mentor, onClose, onSaved, onDelete }) {
  const isNew = !mentor.id;
  const [form, setForm] = useState({
    slug: mentor.slug || "",
    name: mentor.name || "",
    role: (mentor.role || []).join(", "),
    bio: mentor.bio || "",
    linkedin: mentor.linkedin || "",
    tags: (mentor.tags || []).join(", "),
    enabled: mentor.enabled ?? false,
    photo_card_url: mentor.photo_card_url || "",
    photo_modal_url: mentor.photo_modal_url || "",
    photo_mobile_url: mentor.photo_mobile_url || "",
  });
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDeleteClick() {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  }

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleNameChange(value) {
    update("name", value);
    if (!slugTouched) update("slug", slugify(value));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      slug: form.slug || slugify(form.name),
      name: form.name.trim(),
      role: form.role
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      bio: form.bio.trim(),
      linkedin: form.linkedin.trim(),
      tags: form.tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      enabled: form.enabled,
      photo_card_url: form.photo_card_url || null,
      photo_modal_url: form.photo_modal_url || null,
      photo_mobile_url: form.photo_mobile_url || null,
    };

    let result;
    if (isNew) {
      const { data: maxRow } = await supabase.from("mentors").select("sort_order").order("sort_order", { ascending: false }).limit(1).single();
      payload.sort_order = (maxRow?.sort_order ?? 0) + 1;
      result = await supabase.from("mentors").insert(payload);
    } else {
      result = await supabase.from("mentors").update(payload).eq("id", mentor.id);
    }

    setSaving(false);
    if (result.error) setError(result.error.message);
    else onSaved();
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        <div className="modal-header">
          <h2>{isNew ? "Add mentor" : `Edit ${mentor.name}`}</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mentor-form">
          <div className="form-row">
            <label>
              Full name
              <input value={form.name} onChange={(e) => handleNameChange(e.target.value)} required />
            </label>
            <label>
              Slug (used as internal ID)
              <input
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  update("slug", e.target.value);
                }}
                required
              />
            </label>
          </div>

          <label>
            Role / title
            <span className="field-hint">Comma-separated — shown as "Manager · Sterilization · Packaging Facility"</span>
            <input value={form.role} onChange={(e) => update("role", e.target.value)} placeholder="Manager, Sterilization, Packaging Facility" />
          </label>

          <label>
            Bio
            <textarea rows={5} value={form.bio} onChange={(e) => update("bio", e.target.value)} />
          </label>

          <div className="form-row">
            <label>
              LinkedIn URL
              <input value={form.linkedin} onChange={(e) => update("linkedin", e.target.value)} placeholder="https://linkedin.com/in/…" />
            </label>
            <label>
              Tags
              <span className="field-hint">Comma-separated</span>
              <input value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="Sterilization, Packaging, QA" />
            </label>
          </div>

          <label className="checkbox-row">
            <input type="checkbox" checked={form.enabled} onChange={(e) => update("enabled", e.target.checked)} />
            Live (bookable) — unchecked shows "Coming soon" and hides the booking flow
          </label>

          <h3 className="section-title">Photos</h3>
          <ImageUploadField
            label="Card photo"
            hint="Used in the carousel grid — portrait, ~1723×1986"
            slug={form.slug}
            fieldKey="card"
            value={form.photo_card_url}
            onChange={(url) => update("photo_card_url", url)}
          />
          <ImageUploadField
            label="Desktop modal background"
            hint="Wide banner shown behind the booking popup on desktop"
            slug={form.slug}
            fieldKey="modal"
            value={form.photo_modal_url}
            onChange={(url) => update("photo_modal_url", url)}
          />
          <ImageUploadField
            label="Mobile photo"
            hint="Plain portrait photo used full-bleed on the mobile profile screen"
            slug={form.slug}
            fieldKey="mobile"
            value={form.photo_mobile_url}
            onChange={(url) => update("photo_mobile_url", url)}
          />

          {!isNew && (
            <>
              <h3 className="section-title">Available dates</h3>
              <AvailabilityManager mentorId={mentor.id} />
            </>
          )}

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            {!isNew ? (
              <button type="button" className="btn btn-danger" onClick={handleDeleteClick} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete mentor"}
              </button>
            ) : (
              <span />
            )}
            <div className="modal-actions-right">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : isNew ? "Add mentor" : "Save changes"}
              </button>
            </div>
          </div>
          {isNew && <p className="muted small">You can add available dates once the mentor is created.</p>}
        </form>
      </div>
    </div>
  );
}
