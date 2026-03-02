import { ClerkProvider } from "@clerk/nextjs";
import Sidebar from "@/components/sidebar";
import ChatPanel from "@/components/chat-panel";
import KeyboardNav from "@/components/keyboard-nav";
import OnboardingGate from "@/components/onboarding-gate";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <OnboardingGate>
        <div className="flex min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-bg" style={{ padding: "32px 40px", minWidth: 800, maxHeight: "100vh" }}>
            {children}
          </main>
          <ChatPanel />
          <KeyboardNav />
        </div>
      </OnboardingGate>
    </ClerkProvider>
  );
}
