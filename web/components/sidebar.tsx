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
      style={{ width: 260, padding: "20px 0" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3" style={{ padding: "0 20px 20px" }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))",
          }}
        >
          <span className="font-extrabold text-[#FFFDF5]" style={{ fontSize: 14, fontFamily: "var(--font-heading)" }}>
            P
          </span>
        </div>
        <span className="font-semibold text-t1" style={{ fontSize: 14, letterSpacing: "0.06em" }}>
          PocketPilot
        </span>
      </div>

      {/* Budget Arc Card */}
      <Link href="/" className="block no-underline" style={{ margin: "0 14px 20px" }}>
        <div
          className="bg-bg border border-border cursor-pointer hover:border-[rgba(0,0,0,0.09)] transition-all"
          style={{ padding: "20px 16px", borderRadius: 16 }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: 100, height: 100 }}>
              <Arc pct={b.pct} size={100} sw={5} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="font-bold"
                  style={{
                    fontSize: 26,
                    fontFamily: "var(--font-heading)",
                    color: isOver ? "var(--color-red)" : "var(--color-t1)",
                  }}
                >
                  {isOver ? `-$${Math.abs(Math.round(b.remaining))}` : `$${Math.round(b.remaining)}`}
                </span>
                <span className="text-t3 uppercase" style={{ fontSize: 9, letterSpacing: "0.06em", marginTop: 2 }}>
                  {isOver ? "over" : "left"}
                </span>
              </div>
            </div>
            <span className="text-t3" style={{ fontSize: 12 }}>
              of ${Math.round(b.dailyBudget)} daily budget
            </span>
          </div>

          {/* Progress bar */}
          <div className="bg-bg3" style={{ height: 4, borderRadius: 2, marginTop: 12 }}>
            <div
              className="transition-all duration-600"
              style={{
                height: 4,
                borderRadius: 2,
                width: `${Math.min(b.pct, 1) * 100}%`,
                backgroundColor: isOver ? "var(--color-red)" : "var(--color-ch)",
              }}
            />
          </div>

          {/* Spent / Pool */}
          <div className="flex justify-between" style={{ marginTop: 8 }}>
            <span className="text-t3" style={{ fontSize: 11 }}>
              Spent:{" "}
              <span className="text-t1 font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                ${Math.round(b.spentToday)}
              </span>
            </span>
            <span className="text-t3" style={{ fontSize: 11 }}>
              Pool:{" "}
              <span className="text-ch font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                ${Math.round(b.monthPool)}
              </span>
            </span>
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <div className="flex-1 flex flex-col" style={{ padding: "0 10px", gap: 2 }}>
        {nav.map((n) => {
          const active = pathname === n.id || (n.id !== "/" && pathname.startsWith(n.id));
          return (
            <Link
              key={n.id}
              href={n.id}
              className="flex items-center no-underline transition-all"
              style={{
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 14,
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
      <div className="text-t4" style={{ padding: "0 14px 8px", fontSize: 11 }}>Press 1-6 to navigate</div>

      {/* Profile + Logout */}
      <div className="flex justify-between items-center" style={{ padding: "12px 14px", borderTop: "1px solid var(--color-border)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="rounded-full flex items-center justify-center font-semibold"
            style={{
              width: 30,
              height: 30,
              fontSize: 13,
              border: "1.5px solid rgba(176,144,73,0.19)",
              color: "var(--color-ch)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {initial}
          </div>
          <span className="text-t2" style={{ fontSize: 13 }}>{displayName}</span>
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
