"use client";

import { useState } from "react";
import { Icons } from "./icons";

export default function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer border-none z-50 transition-all hover:scale-105"
        style={{
          background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))",
          boxShadow: "0 4px 20px rgba(176,144,73,0.3)",
          color: "#FFFDF5",
        }}
      >
        {open ? Icons.close : Icons.chat}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed top-0 right-0 h-full w-[360px] bg-card border-l border-border z-40 flex flex-col"
          style={{ boxShadow: "-4px 0 24px rgba(0,0,0,0.06)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-t1">Ask PocketPilot</h3>
              <p className="text-[11px] text-t3 mt-0.5">Powered by Claude — Sprint 2</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="bg-transparent border-none cursor-pointer text-t3 flex hover:text-t1"
            >
              {Icons.close}
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-t4 text-center px-6">
                  Ask about your budget, spending, bills, or tax deductions.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  m.role === "user" ? "self-end bg-ch text-[#FFFDF5]" : "self-start bg-bg2 text-t1"
                }`}
                style={m.role === "user" ? { background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))" } : {}}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="self-start bg-bg2 rounded-xl px-3.5 py-2.5 text-[13px] text-t3">
                Thinking...
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask anything..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-bg text-sm text-t1 outline-none"
                style={{ fontFamily: "var(--font-body)" }}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="px-4 py-2.5 rounded-xl border-none text-[13px] font-semibold cursor-pointer text-[#FFFDF5] disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))",
                  fontFamily: "var(--font-body)",
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
