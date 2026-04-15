"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { formatDate, formatDateTime, formatFileSize, STATUS_LABELS, STATUS_COLORS, getRunningTAT, cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

const PROCESS_TYPES = [
  "Additional fee",
  "Additional Information Received",
  "Additional Information Still Required",
  "Candidate Response",
  "Contact made - Candidate",
  "Extended ETA",
  "Extended ETA due to physical visit required",
  "Information Provided/Received",
  "New ETA",
  "Contact made",
  "Free Text",
  "Return to Processor PIS",
  "Escalation PIS",
];

const STATUSES = [
  { value: "submitted", label: "Application Submitted" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending_review", label: "Pending Review" },
  { value: "additional_info", label: "Additional Info Required" },
  { value: "completed", label: "Completed" },
  { value: "closed", label: "Closed" },
];

type Transaction = {
  id: string;
  transId: string;
  subjectType: string;
  inquiryType: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  maidenName: string | null;
  otherNames: string | null;
  birthDate: string | null;
  gender: string | null;
  title: string | null;
  country: string;
  addressLine1: string | null;
  addressLine2: string | null;
  residencyStart: string | null;
  residencyEnd: string | null;
  clientId: string | null;
  source: boolean;
  status: string;
  tat: number;
  dateOfOrder: string;
  createdAt: string;
  createdBy: { name: string; company: string | null };
  assignedTo: { name: string } | null;
  components: {
    id: string;
    type: string;
    serviceId: string;
    status: string;
    allocationStatus: string;
    la: string | null;
    dla: string | null;
    dfa: string | null;
  }[];
  actionHistory: {
    id: string;
    actionType: string;
    actionNote: string | null;
    actionTypeId: number | null;
    visibility: string;
    createdAt: string;
    user: { name: string };
  }[];
  documents: {
    id: string;
    name: string;
    fileType: string;
    fileSize: number;
    filePath: string;
    createdAt: string;
    uploadedBy: { name: string };
    componentId: string | null;
  }[];
};

export function TransactionDetailClient({
  session,
  transaction: initialTx,
}: {
  session: SessionUser;
  transaction: Transaction;
}) {
  const [activeTab, setActiveTab] = useState("information");
  const [tx, setTx] = useState(initialTx);
  const [runningTAT, setRunningTAT] = useState(getRunningTAT(initialTx.dateOfOrder));
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Update running TAT every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setRunningTAT(getRunningTAT(tx.dateOfOrder));
    }, 60000);
    return () => clearInterval(interval);
  }, [tx.dateOfOrder]);

  async function updateStatus(status: string) {
    setUpdatingStatus(true);
    const res = await fetch(`/api/transactions/${tx.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok) setTx((prev) => ({ ...prev, status }));
    setUpdatingStatus(false);
  }

  async function refreshData() {
    const res = await fetch(`/api/transactions/${tx.id}`);
    const data = await res.json();
    if (res.ok) setTx(data.transaction);
  }

  return (
    <>
      <Header userName={session.name} userRole={session.role} />
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-sm transition-colors">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
              Back
            </Link>
            <div className="h-4 w-px bg-outline-variant" />
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">Transaction ID</p>
              <p className="text-lg font-black text-on-surface">{tx.transId.split("-")[0]}</p>
            </div>
            <span className={cn(
              "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
              STATUS_COLORS[tx.status] || "bg-surface-container text-on-surface-variant"
            )}>
              {STATUS_LABELS[tx.status] || tx.status}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Running TAT</p>
              <p className="text-sm font-bold font-mono text-primary">{runningTAT}</p>
            </div>
            {(session.role === "admin" || session.role === "nestc_agent") && (
              <div className="flex items-center gap-2">
                <select
                  value={tx.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  disabled={updatingStatus}
                  className="text-[11px] uppercase tracking-wider font-bold bg-surface-container-low border border-outline-variant/40 rounded px-3 py-1.5 focus:border-primary focus:outline-none"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main content — tabs */}
          <div className="xl:col-span-2 space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-outline-variant/30">
              {[
                { key: "information", label: "Information", icon: "info" },
                { key: "action_history", label: "Action History", icon: "history" },
                { key: "soi_notes", label: "SOI Notes", icon: "sticky_note_2" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors",
                    activeTab === t.key
                      ? "border-primary text-primary"
                      : "border-transparent text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Information Tab */}
            {activeTab === "information" && (
              <div className="space-y-4">
                <InfoSection title="General Information" icon="person">
                  <InfoGrid>
                    <InfoItem label="Transaction ID" value={tx.transId.split("-")[0]} />
                    <InfoItem label="Service ID" value={tx.components[0]?.serviceId.slice(0, 8) || "—"} />
                    <InfoItem label="Subject Type" value={tx.subjectType === "individual" ? "Individual" : "Company"} />
                    <InfoItem label="Inquiry Type" value={tx.inquiryType === "employment_screening" ? "Employment Screening" : "Criminal Check"} />
                    <InfoItem label="First Name" value={tx.firstName} />
                    <InfoItem label="Last Name" value={tx.lastName} />
                    {tx.middleName && <InfoItem label="Middle Name" value={tx.middleName} />}
                    {tx.maidenName && <InfoItem label="Maiden Name" value={tx.maidenName} />}
                    {tx.birthDate && <InfoItem label="Date of Birth" value={tx.birthDate} />}
                    {tx.gender && <InfoItem label="Gender" value={tx.gender} />}
                    {tx.clientId && <InfoItem label="Client ID" value={tx.clientId} />}
                  </InfoGrid>
                </InfoSection>

                <InfoSection title="Address" icon="location_on">
                  <InfoGrid>
                    <InfoItem label="Country" value={tx.country} />
                    {tx.addressLine1 && <InfoItem label="Address" value={tx.addressLine1} />}
                    {tx.addressLine2 && <InfoItem label="City" value={tx.addressLine2} />}
                    {tx.residencyStart && <InfoItem label="Residency Start" value={tx.residencyStart} />}
                    {tx.residencyEnd && <InfoItem label="Residency End" value={tx.residencyEnd} />}
                  </InfoGrid>
                </InfoSection>

                <InfoSection title="Component Status" icon="verified_user">
                  {tx.components.map((comp) => (
                    <div key={comp.id} className="grid grid-cols-3 gap-4">
                      <InfoItem label="Service Type" value="Criminal History Egypt" />
                      <InfoItem label="Status" value={comp.status === "in_progress" ? "In Progress" : comp.status} />
                      <InfoItem label="Allocation" value={comp.allocationStatus} />
                      {comp.la && <InfoItem label="LA" value={comp.la} />}
                      {comp.dla && <InfoItem label="DLA" value={comp.dla} />}
                      {comp.dfa && <InfoItem label="DFA" value={comp.dfa} />}
                    </div>
                  ))}
                </InfoSection>
              </div>
            )}

            {/* Action History Tab */}
            {activeTab === "action_history" && (
              <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-surface-container-low border-b border-outline-variant/20">
                  <h3 className="text-[11px] uppercase tracking-widest font-bold text-on-surface">Action History</h3>
                  {(session.role === "admin" || session.role === "nestc_agent") && (
                    <button
                      onClick={() => setShowActionModal(true)}
                      className="precision-gradient text-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
                      Add Action
                    </button>
                  )}
                </div>
                {tx.actionHistory.length === 0 ? (
                  <div className="p-8 text-center text-on-surface-variant text-sm">No actions recorded yet.</div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-outline-variant/10">
                        {["Date", "User", "Action Type", "Action Note", "ID", "Visibility"].map((h) => (
                          <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {tx.actionHistory.map((action) => (
                        <tr key={action.id} className="hover:bg-surface-container-low/50">
                          <td className="px-4 py-3 text-xs whitespace-nowrap">{formatDateTime(action.createdAt)}</td>
                          <td className="px-4 py-3 text-xs font-medium">{action.user.name}</td>
                          <td className="px-4 py-3 text-xs font-medium">{action.actionType}</td>
                          <td className="px-4 py-3 text-xs text-on-surface-variant max-w-xs truncate" title={action.actionNote || ""}>
                            {action.actionNote || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono">{action.actionTypeId || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                              action.visibility === "internal"
                                ? "bg-tertiary-fixed text-tertiary"
                                : "bg-primary-fixed text-primary"
                            )}>
                              {action.visibility}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* SOI Notes Tab */}
            {activeTab === "soi_notes" && (
              <div className="bg-surface-container-lowest rounded-xl p-6">
                <h3 className="text-[11px] uppercase tracking-widest font-bold text-on-surface mb-4">SOI Notes</h3>
                {tx.actionHistory.filter(a => a.visibility === "internal").length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No internal notes recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {tx.actionHistory.filter(a => a.visibility === "internal").map((action) => (
                      <div key={action.id} className="p-3 bg-surface-container rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-on-surface">{action.user.name}</span>
                          <span className="text-[10px] text-on-surface-variant">{formatDateTime(action.createdAt)}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant">{action.actionNote}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel — Summary + Documents */}
          <div className="space-y-4">
            {/* Transaction Summary */}
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
              <div className="px-5 py-4 bg-surface-container-low border-b border-outline-variant/20">
                <h3 className="text-[11px] uppercase tracking-widest font-bold text-on-surface">Transaction Summary</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-primary-fixed/30 rounded-lg">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>policy</span>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Criminal History Egypt</p>
                    <p className="text-[10px] text-on-surface-variant">TAT: {tx.tat} business days</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-2">PRADO Sample Documents</p>
                  <div className="space-y-1 text-xs">
                    {["Passport (Ordinary)", "Passport (Diplomatic)", "Passport (Service / Official)", "Visa (Ordinary)"].map((doc) => (
                      <a key={doc} href="#" className="flex items-center gap-1 text-primary hover:underline">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
                        {doc}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="text-xs space-y-2 border-t border-outline-variant/20 pt-3">
                  <InfoRow label="Date of Order" value={formatDate(tx.dateOfOrder)} />
                  <InfoRow label="Partner" value={tx.createdBy.company || tx.createdBy.name} />
                  {tx.assignedTo && <InfoRow label="Assigned To" value={tx.assignedTo.name} />}
                  <InfoRow label="Source" value={tx.source ? "Yes" : "No"} />
                </div>
              </div>
            </div>

            {/* Documents / Attachments */}
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 bg-surface-container-low border-b border-outline-variant/20">
                <h3 className="text-[11px] uppercase tracking-widest font-bold text-on-surface">Attachments</h3>
                <button
                  onClick={() => setShowDocModal(true)}
                  className="precision-gradient text-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded flex items-center gap-1"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>upload</span>
                  Add
                </button>
              </div>
              <div className="p-5">
                {tx.documents.length === 0 ? (
                  <div className="text-center py-6 text-on-surface-variant">
                    <span className="material-symbols-outlined" style={{ fontSize: 28 }}>attach_file</span>
                    <p className="text-xs mt-2">No documents uploaded</p>
                    <button
                      onClick={() => setShowDocModal(true)}
                      className="mt-3 text-xs text-primary font-bold hover:underline"
                    >
                      Upload Document
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tx.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 bg-surface-container rounded-lg">
                        <div className="w-8 h-8 bg-error-container text-on-error-container rounded flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>picture_as_pdf</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-on-surface truncate">{doc.name}</p>
                          <p className="text-[10px] text-on-surface-variant">
                            {doc.fileType} · {formatFileSize(doc.fileSize)} · {formatDate(doc.createdAt)}
                          </p>
                        </div>
                        <button className="text-[10px] font-bold text-primary hover:underline whitespace-nowrap">
                          View File
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Action Modal */}
      {showActionModal && (
        <ActionModal
          transactionId={tx.id}
          componentId={tx.components[0]?.id}
          onClose={() => setShowActionModal(false)}
          onSuccess={async () => {
            setShowActionModal(false);
            await refreshData();
          }}
        />
      )}

      {/* Upload Document Modal */}
      {showDocModal && (
        <DocUploadModal
          transactionId={tx.id}
          componentId={tx.components[0]?.id}
          onClose={() => setShowDocModal(false)}
          onSuccess={async () => {
            setShowDocModal(false);
            await refreshData();
          }}
        />
      )}
    </>
  );
}

function ActionModal({
  transactionId,
  componentId,
  onClose,
  onSuccess,
}: {
  transactionId: string;
  componentId?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [actionType, setActionType] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [visibility, setVisibility] = useState("external");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actionType) { setError("Please select a process type"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, componentId, actionType, actionNote, visibility }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add action");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Add External Process" onClose={onClose}>
      <div className="flex border-b border-outline-variant/20 mb-4">
        {["external", "internal"].map((v) => (
          <button
            key={v}
            onClick={() => setVisibility(v)}
            className={cn(
              "px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors",
              visibility === v ? "border-primary text-primary" : "border-transparent text-on-surface-variant"
            )}
          >
            {v}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-error">{error}</p>}
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-bold text-on-surface-variant mb-1.5">
            Process Area *
          </label>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none rounded-lg px-4 py-2.5 text-sm"
          >
            <option value="">Select process type...</option>
            {PROCESS_TYPES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-bold text-on-surface-variant mb-1.5">
            Notes
          </label>
          <textarea
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
            rows={3}
            placeholder="Add action notes..."
            className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none rounded-lg px-4 py-2.5 text-sm resize-none"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="precision-gradient text-white px-6 py-2 text-[11px] font-bold uppercase tracking-widest rounded disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add Action"}
          </button>
          <button type="button" onClick={onClose} className="bg-surface-container-high px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DocUploadModal({
  transactionId,
  componentId,
  onClose,
  onSuccess,
}: {
  transactionId: string;
  componentId?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !name) { setError("File and document name required"); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("transactionId", transactionId);
      formData.append("name", name);
      if (componentId) formData.append("componentId", componentId);
      const res = await fetch("/api/documents", { method: "POST", body: formData });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Add Document" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-error">{error}</p>}
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-bold text-on-surface-variant mb-1.5">
            Document Name *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Passport Copy, National ID"
            className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none rounded-lg px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-bold text-on-surface-variant mb-1.5">
            File (PDF or Image, max 10MB) *
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-outline-variant/40 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
          >
            {file ? (
              <div className="flex items-center gap-2 justify-center">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>attach_file</span>
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-on-surface-variant">({formatFileSize(file.size)})</span>
              </div>
            ) : (
              <div>
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 32 }}>cloud_upload</span>
                <p className="text-sm text-on-surface-variant mt-2">Click to upload or drag and drop</p>
                <p className="text-xs text-outline mt-1">PDF, JPG, PNG</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !file}
            className="precision-gradient text-white px-6 py-2 text-[11px] font-bold uppercase tracking-widest rounded disabled:opacity-60"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
          <button type="button" onClick={onClose} className="bg-surface-container-high px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-lowest rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <h3 className="text-[11px] uppercase tracking-widest font-bold text-on-surface">{title}</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function InfoSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-surface-container-low border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>{icon}</span>
          <h3 className="text-[11px] uppercase tracking-widest font-bold text-on-surface">{title}</h3>
        </div>
        <span className="text-xs text-on-surface-variant">Editable</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-0.5">{label}</p>
      <p className="text-sm text-on-surface">{value || "—"}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-medium text-on-surface">{value}</span>
    </div>
  );
}
