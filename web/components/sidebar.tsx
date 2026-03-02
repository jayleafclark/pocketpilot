"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Arc from "./arc";
import { Icons } from "./icons";

const nav = [
  { id: "/", icon: Icons.home, label: "Dashboard", key: "1" },
  { id: "/business", icon: Icons.biz, label: "Business", key: "2" },
  { id: "/bills", icon: Icons.bill, label: "Bills", key: "3" },
  { id: "/accounts", icon: Icons.bank, label: "Accounts", key: "4" },
  { id: "/analytics", icon: Icons.chart, label: "Analytics", key: "5" },
  { id: "/settings", icon: Icons.gear, label: "Settings", key: "6" },
];

interface BudgetData {
  dailyBudget: number;
  spentToday: number;
  remaining: number;
  pct: number;
  monthPool: number;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [budget, setBudget] = useState<BudgetData | null>(null);

  useEffect(() => {
    fetch("/api/budget")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setBudget(d); })
      .catch(() => {});
  }, [pathname]);

  const b = budget || { dailyBudget: 0, spentToday: 0, remaining: 0, pct: 0, monthPool: 0 };
  const isOver = b.spentToday > b.dailyBudget;

  const initial = user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "U";
  const displayName = user?.firstName || "User";

  return (
    <div
      className="flex-shrink-0 bg-card border-r border-border flex flex-col"
      style={{ width: 200, padding: "20px 0", position: "relative" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5" style={{ padding: "0 20px", marginBottom: 24 }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))",
          }}
        >
          <span className="font-extrabold text-[#FFFDF5]" style={{ fontSize: 12, fontFamily: "var(--font-heading)" }}>
            P
          </span>
        </div>
        <span style={{ fontSize: 16, fontFamily: "var(--font-body)", fontWeight: 600, color: "var(--color-t1)" }}>
          PocketPilot
        </span>
      </div>

      {/* Budget Arc Card */}
      <Link href="/" className="block no-underline" style={{ margin: "0 14px 20px" }}>
        <div
          className="bg-bg border border-border cursor-pointer hover:border-[rgba(0,0,0,0.09)] transition-all"
          style={{ padding: "16px 12px", borderRadius: 14 }}
        >
          <div className="flex flex-col items-center">
            <div className="relative" style={{ width: 100, height: 100, margin: "0 auto" }}>
              <Arc pct={b.pct} size={100} sw={5} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  style={{
                    fontSize: 28,
                    fontFamily: "var(--font-heading)",
                    fontWeight: 700,
                    color: isOver ? "var(--color-red)" : "var(--color-t1)",
                  }}
                >
                  {isOver ? `-$${Math.abs(Math.round(b.remaining))}` : `$${Math.round(b.remaining)}`}
                </span>
                <span style={{ fontSize: 11, fontFamily: "var(--font-body)", fontWeight: 600, textTransform: "uppercase", color: "#9C9A95", letterSpacing: "0.05em", marginTop: 2 }}>
                  {isOver ? "over" : "left"}
                </span>
              </div>
            </div>
            <span style={{ fontSize: 13, fontFamily: "var(--font-body)", color: "#9C9A95", textAlign: "center", marginTop: 4 }}>
              of ${Math.round(b.dailyBudget)} daily budget
            </span>
          </div>

          {/* Spent / Pool row */}
          <div className="flex justify-between" style={{ marginTop: 12, padding: "0 4px", fontSize: 13, fontFamily: "var(--font-body)" }}>
            <span style={{ color: "#9C9A95" }}>
              Spent{" "}
              <span style={{ color: "var(--color-t1)", fontWeight: 500, fontFamily: "var(--font-mono)" }}>
                ${Math.round(b.spentToday)}
              </span>
            </span>
            <span style={{ color: "#9C9A95" }}>
              Pool{" "}
              <span style={{ color: "var(--color-ch)", fontWeight: 500, fontFamily: "var(--font-mono)" }}>
                ${Math.round(b.monthPool)}
              </span>
            </span>
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <div className="flex-1 flex flex-col" style={{ padding: "0 10px", marginTop: 32, gap: 2 }}>
        {nav.map((n) => {
          const active = pathname === n.id || (n.id !== "/" && pathname.startsWith(n.id));
          return (
            <Link
              key={n.id}
              href={n.id}
              className="flex items-center no-underline transition-all"
              style={{
                gap: 12,
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 14,
                fontFamily: "var(--font-body)",
                backgroundColor: active ? "#F5F0E6" : "transparent",
                color: active ? "var(--color-ch)" : "#6B6963",
                fontWeight: active ? 600 : 400,
              }}
            >
              <span className="flex" style={{ width: 20, height: 20, opacity: active ? 1 : 0.5 }}>
                {n.icon}
              </span>
              {n.label}
            </Link>
          );
        })}
      </div>

      {/* Profile + Logout */}
      <div className="flex justify-between items-center" style={{ padding: 20, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="rounded-full flex items-center justify-center font-semibold"
            style={{
              width: 28,
              height: 28,
              fontSize: 12,
              border: "1.5px solid rgba(176,144,73,0.19)",
              color: "var(--color-ch)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {initial}
          </div>
          <span style={{ fontSize: 13, fontFamily: "var(--font-body)", fontWeight: 500, color: "#1A1915" }}>{displayName}</span>
        </div>
        <button
          onClick={() => signOut({ redirectUrl: "/sign-in" })}
          title="Sign out"
          className="bg-transparent border-none cursor-pointer flex p-1 transition-colors"
          style={{ color: "#9C9A95" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
