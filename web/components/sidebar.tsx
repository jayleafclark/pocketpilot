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
      .then((r) => r.json())
      .then(setBudget)
      .catch(() => {});
  }, [pathname]);

  const b = budget || { dailyBudget: 0, spentToday: 0, remaining: 0, pct: 0, monthPool: 0 };
  const isOver = b.spentToday > b.dailyBudget;

  const initial = user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "U";
  const displayName = user?.firstName || "User";

  return (
    <div className="w-64 flex-shrink-0 bg-card border-r border-border flex flex-col" style={{ padding: "20px 0" }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pb-5">
        <div
          className="w-[30px] h-[30px] flex items-center justify-center"
          style={{
            borderRadius: 8,
            background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))",
          }}
        >
          <span className="text-[13px] font-extrabold text-[#FFFDF5]" style={{ fontFamily: "var(--font-heading)" }}>
            P
          </span>
        </div>
        <span className="text-[13px] font-semibold text-t1 tracking-[0.06em]">PocketPilot</span>
      </div>

      {/* Budget Arc Card */}
      <Link href="/" className="block mx-3.5 mb-5 no-underline">
        <div
          className="p-4 rounded-2xl bg-bg border border-border cursor-pointer hover:border-[rgba(0,0,0,0.09)] transition-all"
        >
          <div className="flex flex-col items-center gap-1.5">
            <div className="relative w-[100px] h-[100px]">
              <Arc pct={b.pct} size={100} sw={5} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-[26px] font-bold"
                  style={{
                    fontFamily: "var(--font-heading)",
                    color: isOver ? "var(--color-red)" : "var(--color-t1)",
                  }}
                >
                  {isOver ? `-$${Math.abs(Math.round(b.remaining))}` : `$${Math.round(b.remaining)}`}
                </span>
                <span className="text-[9px] text-t3 uppercase tracking-[0.06em] mt-0.5">
                  {isOver ? "over" : "left"}
                </span>
              </div>
            </div>
            <span className="text-xs text-t3">of ${Math.round(b.dailyBudget)} daily budget</span>
          </div>

          {/* Progress bar */}
          <div className="h-1 rounded-sm bg-bg3 mt-3">
            <div
              className="h-1 rounded-sm transition-all duration-600"
              style={{
                width: `${Math.min(b.pct, 1) * 100}%`,
                backgroundColor: isOver ? "var(--color-red)" : "var(--color-ch)",
              }}
            />
          </div>

          {/* Spent / Pool */}
          <div className="flex justify-between mt-2">
            <span className="text-[11px] text-t3">
              Spent:{" "}
              <span className="text-t1 font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                ${Math.round(b.spentToday)}
              </span>
            </span>
            <span className="text-[11px] text-t3">
              Pool:{" "}
              <span className="text-ch font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                ${Math.round(b.monthPool)}
              </span>
            </span>
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <div className="flex-1 px-2.5 flex flex-col gap-0.5">
        {nav.map((n) => {
          const active = pathname === n.id || (n.id !== "/" && pathname.startsWith(n.id));
          return (
            <Link
              key={n.id}
              href={n.id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg no-underline transition-all text-[13px]"
              style={{
                backgroundColor: active ? "rgba(176,144,73,0.07)" : "transparent",
                color: active ? "var(--color-ch)" : "var(--color-t2)",
                fontWeight: active ? 600 : 400,
              }}
            >
              <span className="flex" style={{ opacity: active ? 1 : 0.5 }}>
                {n.icon}
              </span>
              {n.label}
            </Link>
          );
        })}
      </div>

      {/* Keyboard hint */}
      <div className="px-3.5 pb-2 text-[10px] text-t4">Press 1-6 to navigate</div>

      {/* Profile + Logout */}
      <div className="px-3.5 pt-3 border-t border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{
              border: "1.5px solid rgba(176,144,73,0.19)",
              color: "var(--color-ch)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {initial}
          </div>
          <span className="text-xs text-t2">{displayName}</span>
        </div>
        <button
          onClick={() => signOut({ redirectUrl: "/sign-in" })}
          title="Sign out"
          className="bg-transparent border-none cursor-pointer text-t4 flex p-1 hover:text-t2 transition-colors"
        >
          {Icons.logout}
        </button>
      </div>
    </div>
  );
}
