"use client";

import { useState } from "react";
import Image from "next/image";

// Falls back to the aiKart "ai" mark whenever the seller hasn't uploaded a
// logo, or their logo URL fails to load (broken link, deleted file, etc.) —
// without this, a failed <Image> shows its raw alt text instead of an icon.
export default function AgentLogo({ logoUrl, title }: { logoUrl: string | null; title: string }) {
  const [error, setError] = useState(false);

  if (logoUrl && !error) {
    return (
      <div className="w-full h-full p-2 flex items-center justify-center bg-white rounded-2xl">
        <Image
          src={logoUrl}
          alt={`${title} logo`}
          width={112}
          height={112}
          unoptimized
          style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "12px" }}
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <Image
      src="/logo/aikart-ai-mark.png"
      alt="aiKart"
      width={64}
      height={64}
      style={{ width: "60%", height: "60%", objectFit: "contain" }}
    />
  );
}
