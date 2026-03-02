"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
      {/* Left brand panel */}
      <div
        className="hidden lg:flex w-[460px] flex-shrink-0 flex-col items-center justify-center relative"
        style={{
          background: "linear-gradient(165deg, #1A1915 0%, #2A2720 40%, #1E1D18 100%)",
        }}
      >
        <div className="flex flex-col items-center gap-5">
          <div
            className="w-20 h-20 flex items-center justify-center"
            style={{
              borderRadius: 22,
              background: "linear-gradient(135deg, #B09049, #CCAA5C)",
              boxShadow: "0 8px 32px rgba(176,144,73,0.19)",
            }}
          >
            <span
              className="text-4xl font-extrabold"
              style={{ color: "#FFFDF5", fontFamily: "var(--font-heading)" }}
            >
              P
            </span>
          </div>
          <span
            className="text-xl font-semibold tracking-[0.18em] uppercase"
            style={{ color: "#B09049" }}
          >
            PocketPilot
          </span>
        </div>
        <div className="absolute bottom-10 text-xs" style={{ color: "#5C5A54" }}>
          Secured by Clerk · Hosted on Railway
        </div>
      </div>

      {/* Right sign-in panel */}
      <div
        className="flex-1 flex items-center justify-center p-10"
        style={{ backgroundColor: "#F8F7F4" }}
      >
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full max-w-[380px]",
              card: "shadow-none border-0 bg-transparent",
              headerTitle: "text-2xl font-bold",
              headerSubtitle: "text-sm",
              formButtonPrimary:
                "bg-gradient-to-br from-[#B09049] to-[#CCAA5C] hover:from-[#9E8040] hover:to-[#B89A50] text-white rounded-xl h-12 text-sm font-semibold",
              formFieldInput:
                "rounded-xl border border-[rgba(0,0,0,0.055)] bg-white h-11 text-sm focus:border-[rgba(176,144,73,0.31)]",
              socialButtonsBlockButton:
                "rounded-xl border border-[rgba(0,0,0,0.055)] bg-white h-11 text-sm font-medium",
              footerActionLink: "text-[#B09049] font-medium",
              dividerLine: "bg-[rgba(0,0,0,0.055)]",
              dividerText: "text-[#C4C1B9] text-xs",
            },
            variables: {
              colorPrimary: "#B09049",
              colorBackground: "#F8F7F4",
              colorText: "#1A1915",
              colorTextSecondary: "#6B6960",
              borderRadius: "0.75rem",
            },
          }}
        />
      </div>
    </div>
  );
}
