import { useState } from "react";
import { supabase, MENTOR_PHOTOS_BUCKET } from "../lib/supabaseClient";

export default function ImageUploadField({ label, hint, slug, fieldKey, value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${slug || "mentor"}/${fieldKey}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(MENTOR_PHOTOS_BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(MENTOR_PHOTOS_BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="image-field">
      <label className="image-field-label">
        {label}
        {hint && <span className="field-hint">{hint}</span>}
      </label>
      <div className="image-field-row">
        <div className="image-preview">
          {value ? <img src={value} alt="" /> : <span className="muted">No image</span>}
        </div>
        <div className="image-field-controls">
          <input type="file" accept="image/*" onChange={handleFile} disabled={busy} />
          {value && (
            <button type="button" className="btn btn-small btn-ghost" onClick={() => onChange("")}>
              Remove
            </button>
          )}
          {busy && <span className="muted">Uploading…</span>}
          {error && <span className="form-error">{error}</span>}
        </div>
      </div>
    </div>
  );
}
