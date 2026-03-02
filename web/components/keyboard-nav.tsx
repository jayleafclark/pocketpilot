"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const routes = ["/", "/business", "/bills", "/accounts", "/analytics", "/settings"];

export default function KeyboardNav() {
  const router = useRouter();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= 6) {
        e.preventDefault();
        router.push(routes[num - 1]);
      }

      if (e.key === "/" && document.querySelector<HTMLInputElement>("[data-search]")) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>("[data-search]")?.focus();
      }

      if (e.key === "Escape") {
        const search = document.querySelector<HTMLInputElement>("[data-search]");
        if (search && document.activeElement === search) {
          search.value = "";
          search.blur();
          search.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router]);

  return null;
}
