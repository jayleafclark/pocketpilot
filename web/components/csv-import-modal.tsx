"use client";

import { useState, useRef } from "react";

interface CsvImportModalProps {
  onClose: () => void;
  onImported: () => void;
}

export default function CsvImportModal({ onClose, onImported }: CsvImportModalProps) {
  const [step, setStep] = useState<"upload" | "map" | "importing">("upload");
  const [columns, setColumns] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [csvText, setCsvText] = useState("");
  const [mapping, setMapping] = useState({ date: "", merchant: "", amount: "", category: "" });
  const [result, setResult] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const text = await file.text();
    setCsvText(text);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/import/csv", { method: "POST", body: formData });
    if (!res.ok) return;
    const data = await res.json();

    setColumns(data.columns || []);
    setPreview(data.preview || []);
    setTotalRows(data.totalRows || 0);

    // Auto-detect common column names
    const cols = (data.columns || []) as string[];
    const lower = cols.map((c: string) => c.toLowerCase());
    setMapping({
      date: cols[lower.findIndex((c: string) => c.includes("date"))] || "",
      merchant: cols[lower.findIndex((c: string) => c.includes("description") || c.includes("merchant") || c.includes("name"))] || "",
      amount: cols[lower.findIndex((c: string) => c.includes("amount") || c.includes("total"))] || "",
      category: cols[lower.findIndex((c: string) => c.includes("category") || c.includes("type"))] || "",
    });

    setStep("map");
  };

  const handleImport = async () => {
    setStep("importing");
    try {
      const res = await fetch("/api/import/csv/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData: csvText, mapping }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data.imported || 0);
      onImported();
    } catch {
      setResult(-1);
    }
  };

  const selectStyle: React.CSSProperties = {
    width: "100%", height: 40, borderRadius: 10, border: "1px solid var(--color-border)",
    padding: "0 10px", fontSize: 14, fontFamily: "var(--font-body)", color: "var(--color-t1)",
    background: "var(--color-card)", outline: "none",
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[4px]" />
      <div onClick={(e) => e.stopPropagation()} className="relative bg-card w-[90%] max-w-[560px] max-h-[80vh] overflow-y-auto" style={{ borderRadius: 20, padding: "28px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-t1" style={{ fontSize: 18, fontFamily: "var(--font-heading)" }}>Import CSV</h3>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-t3 text-xl leading-none">×</button>
        </div>

        {step === "upload" && (
          <div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-[14px] cursor-pointer flex flex-col items-center justify-center gap-2 hover:border-ch transition-colors"
              style={{ height: 160, padding: 24 }}
            >
              <span className="text-t3 font-medium" style={{ fontSize: 14 }}>Click to upload a CSV file</span>
              <span className="text-t4" style={{ fontSize: 13 }}>Bank statements, credit card exports, etc.</span>
            </div>
          </div>
        )}

        {step === "map" && (
          <div>
            <p className="text-t3 mb-4" style={{ fontSize: 14 }}>
              {totalRows} rows found. Map your columns below:
            </p>

            <div className="space-y-3 mb-6">
              {[
                { key: "date", label: "Date Column", required: true },
                { key: "merchant", label: "Merchant / Description", required: true },
                { key: "amount", label: "Amount", required: true },
                { key: "category", label: "Category (optional)", required: false },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-[12px] font-semibold text-t3 uppercase tracking-[0.08em] mb-1.5 block">
                    {field.label} {field.required && <span className="text-red">*</span>}
                  </label>
                  <select
                    value={mapping[field.key as keyof typeof mapping]}
                    onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="">— Select —</option>
                    {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {/* Preview table */}
            {preview.length > 0 && mapping.date && mapping.merchant && mapping.amount && (
              <div className="border border-border rounded-[10px] overflow-hidden mb-6">
                <div className="bg-bg p-2 text-[11px] font-semibold text-t3 uppercase tracking-[0.08em]" style={{ padding: "8px 12px" }}>
                  Preview (first {preview.length} rows)
                </div>
                {preview.map((row, i) => (
                  <div key={i} className="flex justify-between items-center" style={{ padding: "8px 12px", borderTop: "1px solid var(--color-border)" }}>
                    <div>
                      <span className="text-t1 font-medium" style={{ fontSize: 13 }}>{row[mapping.merchant]}</span>
                      <span className="text-t3 block" style={{ fontSize: 12 }}>{row[mapping.date]}</span>
                    </div>
                    <span className="text-t1 font-medium" style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}>
                      {row[mapping.amount]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 rounded-[14px] text-[14px] font-medium text-t2 bg-transparent border border-border cursor-pointer" style={{ height: 44 }}>
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!mapping.date || !mapping.merchant || !mapping.amount}
                className="flex-1 rounded-[14px] text-[14px] font-semibold text-[#FFFDF5] border-none cursor-pointer disabled:opacity-50"
                style={{ height: 44, background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))" }}
              >
                Import {totalRows} Transactions
              </button>
            </div>
          </div>
        )}

        {step === "importing" && result === null && (
          <div className="py-10 text-center">
            <div className="text-t3" style={{ fontSize: 14 }}>Importing transactions...</div>
          </div>
        )}

        {step === "importing" && result !== null && (
          <div className="py-10 text-center">
            {result >= 0 ? (
              <>
                <div className="text-ok font-semibold mb-2" style={{ fontSize: 28, fontFamily: "var(--font-mono)" }}>{result}</div>
                <div className="text-t3" style={{ fontSize: 14 }}>transactions imported successfully</div>
                <button onClick={onClose} className="onb-btn mt-6" style={{ width: "auto", padding: "0 32px", margin: "24px auto 0", height: 44, borderRadius: 14, background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))", color: "#FFFDF5", fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer" }}>
                  Done
                </button>
              </>
            ) : (
              <>
                <div className="text-red font-semibold mb-2" style={{ fontSize: 16 }}>Import failed</div>
                <button onClick={() => setStep("map")} className="text-ch font-medium cursor-pointer bg-transparent border-none" style={{ fontSize: 14 }}>
                  Try again
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
