"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface Member {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string | null; email: string };
}

interface HouseholdContextType {
  householdId: string | null;
  role: string | null;
  members: Member[];
  loading: boolean;
  reload: () => void;
}

const HouseholdContext = createContext<HouseholdContextType>({
  householdId: null,
  role: null,
  members: [],
  loading: true,
  reload: () => {},
});

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/household/members")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setMembers(d.members || []);
          // Find current user's role from the members list
          // The API returns members with their roles
          if (d.householdId) setHouseholdId(d.householdId);
          if (d.role) setRole(d.role);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <HouseholdContext.Provider value={{ householdId, role, members, loading, reload: load }}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  return useContext(HouseholdContext);
}
