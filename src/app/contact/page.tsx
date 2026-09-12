import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ContactSection } from "@/components/contact/ContactSection";
import { getHiddenLinks } from "@/components/layout/navVisibility";

export const metadata: Metadata = {
  title: "Contact Us | aiKart AI Agent Marketplace",
  description: "Get in touch with the aiKart team for seller inquiries, enterprise AI solutions, or platform support.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar hiddenLinks={getHiddenLinks("/contact")} />

      {/* Spacer to push content below the fixed floating navbar */}
      <div style={{ height: "110px", flexShrink: 0 }} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
