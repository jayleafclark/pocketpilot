import { ClerkProvider } from "@clerk/nextjs";
import Sidebar from "@/components/sidebar";
import ChatPanel from "@/components/chat-panel";
import KeyboardNav from "@/components/keyboard-nav";
import OnboardingGate from "@/components/onboarding-gate";
import { HouseholdProvider } from "@/lib/household-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <OnboardingGate>
        <HouseholdProvider>
          <div className="flex min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-bg" style={{ padding: "36px 48px", minWidth: 860, maxHeight: "100vh" }}>
              {children}
            </main>
            <ChatPanel />
            <KeyboardNav />
          </div>
        </HouseholdProvider>
      </OnboardingGate>
    </ClerkProvider>
  );
}
