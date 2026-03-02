import { ClerkProvider } from "@clerk/nextjs";
import Sidebar from "@/components/sidebar";
import ChatPanel from "@/components/chat-panel";
import KeyboardNav from "@/components/keyboard-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <div className="flex min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-bg" style={{ padding: "28px 36px", minWidth: 800, maxHeight: "100vh" }}>
          {children}
        </main>
        <ChatPanel />
        <KeyboardNav />
      </div>
    </ClerkProvider>
  );
}
