"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

const CSV_COLUMNS = [
  { col: "First Name", required: true, example: "Mohamed" },
  { col: "Last Name", required: true, example: "Elsayed" },
  { col: "Middle Name", required: false, example: "Essam" },
  { col: "Date of Birth", required: false, example: "1990-05-04" },
  { col: "National ID", required: false, example: "12345678901234" },
  { col: "Phone", required: false, example: "+201234567890" },
  { col: "Address", required: false, example: "15 Ezz El-Din St - Cairo" },
  { col: "Position Applied For", required: false, example: "Driver" },
];

export function NewBatchClient({ session }: { session: SessionUser }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    source: "direct",
    priority: "standard",
    notes: "",
    webhookUrl: "",
  });

  function parsePreview(text: string) {
    const lines = text.split(/\r?\n/).filter(l => l.trim()).slice(0, 6);
    return lines.map(l => l.split(",").map(v => v.replace(/^"|"$/g, "").trim()));
  }

  async function handleFile(f: File) {
    if (!f.name.endsWith(".csv")) {
      setError("Only .csv files are accepted");
      return;
    }
    setFile(f);
    setError("");
    const text = await f.text();
    setPreview(parsePreview(text));
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) await handleFile(f);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Please select a CSV file"); return; }
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("source", form.source);
      fd.append("priority", form.priority);
      fd.append("notes", form.notes);
      fd.append("webhookUrl", form.webhookUrl);
      const res = await fetch("/api/batches", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to import batch"); }
      else { router.push(`/batches/${data.batch.id}`); }
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <>
      <Header userName={session.name} userRole={session.role} />
      <div className="p-8 max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-sm mb-6 transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back to Batches
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Import Verification Batch</h1>
            <p className="text-sm text-on-surface-variant mt-1">Upload a CSV file to create a new batch of candidates for screening</p>
          </div>
          <a
            href="/api/batches/template"
            download
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-low border border-outline-variant/40 rounded text-[11px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
            Download Template
          </a>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CSV Upload */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 bg-surface-container-low border-b border-outline-variant/20">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>upload_file</span>
              <h2 className="text-[11px] uppercase tracking-widest font-bold text-on-surface">Candidate List (CSV)</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                className={cn(
                  "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all",
                  isDragging
                    ? "border-primary bg-primary-fixed/20"
                    : file
                    ? "border-secondary bg-secondary-container/20"
                    : "border-outline-variant/40 hover:border-primary hover:bg-primary-fixed/10"
                )}
              >
                {file ? (
                  <div className="space-y-2">
                    <span className="material-symbols-outlined text-secondary" style={{ fontSize: 40 }}>task_alt</span>
                    <p className="font-bold text-on-surface">{file.name}</p>
                    <p className="text-sm text-on-surface-variant">
                      {(file.size / 1024).toFixed(1)} KB · {preview.length > 1 ? preview.length - 1 : 0} rows detected
                    </p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); setPreview([]); }}
                      className="text-xs text-error hover:underline"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 48 }}>cloud_upload</span>
                    <div>
                      <p className="font-bold text-on-surface">Drop CSV file here or click to browse</p>
                      <p className="text-sm text-on-surface-variant mt-1">Only .csv files accepted</p>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />

              {/* CSV Preview */}
              {preview.length > 0 && (
                <div className="rounded-lg overflow-hidden border border-outline-variant/20">
                  <div className="px-4 py-2 bg-surface-container-low flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Preview (first 5 rows)</p>
                    <p className="text-[10px] text-on-surface-variant">{preview.length - 1} candidates</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-surface-container/50">
                          {(preview[0] || []).map((h, i) => (
                            <th key={i} className="px-3 py-2 text-left font-bold text-on-surface-variant whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {preview.slice(1).map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-2 text-on-surface whitespace-nowrap">{cell || "—"}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Expected format */}
              <details className="group">
                <summary className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant cursor-pointer flex items-center gap-1 hover:text-primary">
                  <span className="material-symbols-outlined group-open:rotate-90 transition-transform" style={{ fontSize: 16 }}>chevron_right</span>
                  Expected CSV Format
                </summary>
                <div className="mt-3 rounded-lg border border-outline-variant/20 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface-container-low">
                        <th className="px-3 py-2 text-left font-bold text-on-surface-variant">Column</th>
                        <th className="px-3 py-2 text-left font-bold text-on-surface-variant">Required</th>
                        <th className="px-3 py-2 text-left font-bold text-on-surface-variant">Example</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {CSV_COLUMNS.map((col) => (
                        <tr key={col.col}>
                          <td className="px-3 py-2 font-mono font-bold">{col.col}</td>
                          <td className="px-3 py-2">
                            {col.required ? (
                              <span className="text-error font-bold">Required</span>
                            ) : (
                              <span className="text-on-surface-variant">Optional</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-on-surface-variant">{col.example}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          </div>

          {/* Batch Settings */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 bg-surface-container-low border-b border-outline-variant/20">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>settings</span>
              <h2 className="text-[11px] uppercase tracking-widest font-bold text-on-surface">Batch Settings</h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-on-surface-variant mb-1.5">Client Source</label>
                <select
                  value={form.source}
                  onChange={(e) => setForm(p => ({ ...p, source: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none rounded-lg px-4 py-2.5 text-sm"
                >
                  <option value="abtalna">Abtalna</option>
                  <option value="wuzzuf">Wuzzuf</option>
                  <option value="direct">Direct / Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-on-surface-variant mb-1.5">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm(p => ({ ...p, priority: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none rounded-lg px-4 py-2.5 text-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] uppercase tracking-wider font-bold text-on-surface-variant mb-1.5">
                  Webhook URL (optional)
                </label>
                <input
                  type="url"
                  value={form.webhookUrl}
                  onChange={(e) => setForm(p => ({ ...p, webhookUrl: e.target.value }))}
                  placeholder="https://api.abtalna.com/webhooks/screening-complete"
                  className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none rounded-lg px-4 py-2.5 text-sm"
                />
                <p className="text-[10px] text-on-surface-variant mt-1">
                  When all candidates are scored, we will POST the results to this URL automatically.
                </p>
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] uppercase tracking-wider font-bold text-on-surface-variant mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="Any special instructions for this batch..."
                  className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none rounded-lg px-4 py-2.5 text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !file}
              className="precision-gradient text-white px-8 py-3 text-[11px] font-bold uppercase tracking-widest rounded flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>progress_activity</span>Importing...</>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload_file</span>Import Batch</>
              )}
            </button>
            <button type="button" onClick={() => router.back()} className="bg-surface-container-high px-6 py-3 text-[11px] font-bold uppercase tracking-widest rounded">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
