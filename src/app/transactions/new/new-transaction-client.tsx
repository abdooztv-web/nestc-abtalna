"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import type { SessionUser } from "@/lib/auth";

const EGYPT_CITIES = ["Cairo", "Alexandria", "Giza", "Shubra El-Kheima", "Port Said", "Suez", "Luxor", "Asyut", "Ismailia", "Faiyum", "Zagazig", "Aswan", "Damietta", "Damietta", "Mansoura", "El-Mahalla El-Kubra", "Tanta", "Hurghada", "Beni Suef", "Qena", "Sohag", "Shibin El-Kom", "Banha", "6th of October City", "Other"];

export function NewTransactionClient({ session }: { session: SessionUser }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    subjectType: "individual",
    inquiryType: "employment_screening",
    firstName: "",
    lastName: "",
    middleName: "",
    maidenName: "",
    otherNames: "",
    birthDate: "",
    gender: "",
    title: "",
    country: "Egypt",
    addressLine1: "",
    addressLine2: "",
    residencyStart: "",
    residencyEnd: "",
    clientId: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create request");
      } else {
        router.push(`/transactions/${data.transaction.id}`);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header userName={session.name} userRole={session.role} />
      <div className="p-8 max-w-4xl mx-auto">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-sm mb-6 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">New Verification Request</h1>
            <p className="text-sm text-on-surface-variant mt-1">Criminal Background Screening — Criminal History Egypt</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-fixed text-primary rounded-full text-[11px] font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified_user</span>
            NESTC × Abtalna
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Information */}
          <Section title="General Information" icon="person">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Subject Type">
                <select name="subjectType" value={form.subjectType} onChange={handleChange} className={inputClass}>
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                </select>
              </FormField>
              <FormField label="Type of Inquiry">
                <select name="inquiryType" value={form.inquiryType} onChange={handleChange} className={inputClass}>
                  <option value="employment_screening">Employment Screening</option>
                  <option value="criminal_check">Criminal Background Check</option>
                </select>
              </FormField>
              <FormField label="First Name *">
                <input name="firstName" value={form.firstName} onChange={handleChange} required placeholder="Mohamed" className={inputClass} />
              </FormField>
              <FormField label="Last Name *">
                <input name="lastName" value={form.lastName} onChange={handleChange} required placeholder="Elsayed" className={inputClass} />
              </FormField>
              <FormField label="Middle Name">
                <input name="middleName" value={form.middleName} onChange={handleChange} placeholder="Optional" className={inputClass} />
              </FormField>
              <FormField label="Maiden Name / Spouse">
                <input name="maidenName" value={form.maidenName} onChange={handleChange} placeholder="Optional" className={inputClass} />
              </FormField>
              <FormField label="Date of Birth">
                <input type="date" name="birthDate" value={form.birthDate} onChange={handleChange} className={inputClass} />
              </FormField>
              <FormField label="Gender">
                <select name="gender" value={form.gender} onChange={handleChange} className={inputClass}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </FormField>
              <FormField label="Title">
                <select name="title" value={form.title} onChange={handleChange} className={inputClass}>
                  <option value="">Select</option>
                  <option value="mr">Mr.</option>
                  <option value="mrs">Mrs.</option>
                  <option value="ms">Ms.</option>
                  <option value="dr">Dr.</option>
                  <option value="eng">Eng.</option>
                </select>
              </FormField>
              <FormField label="Other Names">
                <input name="otherNames" value={form.otherNames} onChange={handleChange} placeholder="Aliases, previous names" className={inputClass} />
              </FormField>
              <FormField label="Client ID">
                <input name="clientId" value={form.clientId} onChange={handleChange} placeholder="Abtalna worker ID" className={inputClass} />
              </FormField>
            </div>
          </Section>

          {/* Address */}
          <Section title="Most Recent Address" icon="location_on">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Current Country of Residence">
                <input name="country" value={form.country} onChange={handleChange} placeholder="Egypt" className={inputClass} />
              </FormField>
              <FormField label="City">
                <select name="addressLine2" value={form.addressLine2} onChange={handleChange} className={inputClass}>
                  <option value="">Select city</option>
                  {EGYPT_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Start Date of Residency">
                <input type="date" name="residencyStart" value={form.residencyStart} onChange={handleChange} className={inputClass} />
              </FormField>
              <FormField label="End Date of Residency">
                <input type="date" name="residencyEnd" value={form.residencyEnd} onChange={handleChange} className={inputClass} />
              </FormField>
              <div className="col-span-2">
                <FormField label="Address Line 1">
                  <input name="addressLine1" value={form.addressLine1} onChange={handleChange} placeholder="Street, Building, Floor, Apartment" className={inputClass} />
                </FormField>
              </div>
            </div>
          </Section>

          {/* Components */}
          <Section title="Verification Component" icon="verified_user">
            <div className="flex items-center gap-4 p-4 bg-surface-container rounded-lg border border-outline-variant/30">
              <div className="w-10 h-10 precision-gradient rounded flex items-center justify-center text-white flex-shrink-0">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>policy</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-on-surface">Criminal History Egypt</p>
                <p className="text-xs text-on-surface-variant">Court records + investigation databases. TAT: 8 business days.</p>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 bg-primary-fixed text-primary rounded-full text-[10px] font-bold uppercase">
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check</span>
                Selected
              </div>
            </div>

            <div className="mt-4 p-4 bg-surface-container-low rounded-lg text-xs text-on-surface-variant space-y-1">
              <p className="font-bold text-on-surface">PRADO Sample Documents Required:</p>
              <p>• Passport copy (Ordinary / Diplomatic / Service)</p>
              <p>• National ID copy</p>
              <p className="text-tertiary font-medium mt-2">Documents can be uploaded after submission on the transaction detail page.</p>
            </div>
          </Section>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="precision-gradient text-white px-8 py-3 text-[11px] font-bold uppercase tracking-widest rounded flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>progress_activity</span>
                  Submitting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span>
                  Submit Request
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-surface-container-high px-6 py-3 text-[11px] font-bold uppercase tracking-widest rounded hover:bg-surface-container-highest transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

const inputClass = "w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none rounded-lg px-4 py-2.5 text-sm";

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-surface-container-low border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>{icon}</span>
          <h2 className="text-[11px] uppercase tracking-widest font-bold text-on-surface">{title}</h2>
        </div>
        <span className="text-xs text-on-surface-variant">Editable</span>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider font-bold text-on-surface-variant mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
