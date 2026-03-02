import Sidebar from "@/components/sidebar";
import ChatPanel from "@/components/chat-panel";
import KeyboardNav from "@/components/keyboard-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 bg-bg">
        {children}
      </main>
      <ChatPanel />
      <KeyboardNav />
    </div>
  );
}
