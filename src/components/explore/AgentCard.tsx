"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { trackEvent } from "@/lib/gtag";
import { CardBanner } from "./CardBanner";

export const CARD_GRADIENTS = [
  "linear-gradient(-45deg, #FF0080, #7928CA)",
  "linear-gradient(-45deg, #0070F3, #00DFD8)",
  "linear-gradient(-45deg, #FF4D4D, #F9CB28)",
  "linear-gradient(-45deg, #7928CA, #FF0080)",
  "linear-gradient(-45deg, #00B4D8, #0077B6)",
  "linear-gradient(-45deg, #F77F00, #D62828)",
  "linear-gradient(-45deg, #06D6A0, #118AB2)",
  "linear-gradient(-45deg, #9B5DE5, #F15BB5)",
];

export const CAT_GRAD: Record<string, string> = {
  marketing: CARD_GRADIENTS[0],
  sales: CARD_GRADIENTS[1],
  "customer service": CARD_GRADIENTS[3],
  "customer support": CARD_GRADIENTS[3],
  hr: CARD_GRADIENTS[2],
  finance: CARD_GRADIENTS[1],
  analytics: CARD_GRADIENTS[1],
  security: CARD_GRADIENTS[3],
  design: CARD_GRADIENTS[4],
  coding: CARD_GRADIENTS[1],
  productivity: CARD_GRADIENTS[3],
  other: CARD_GRADIENTS[0],
  default: CARD_GRADIENTS[0],
};

export interface AgentCardProps {
  id?: string | number;
  title: string;
  desc: string;
  category?: string | string[];
  tags?: string[];
  logoUrl?: string | null;
  bannerUrl?: string | null;
  grad?: string;
  price: React.ReactNode;
  rating?: number | string;
  href: string;
  className?: string;
  index?: number;
  source?: string;
}

export function AgentCard({
  id,
  title,
  desc,
  category,
  tags,
  logoUrl,
  bannerUrl,
  grad,
  price,
  href,
  className = "",
  index,
  source,
}: AgentCardProps) {
  const cardIndex =
    index !== undefined
      ? index
      : typeof id === "number"
        ? id
        : typeof id === "string" && !isNaN(Number(id))
          ? Number(id)
          : 0;

  const handleClick = () => {
    trackEvent("agent_card_click", {
      listing_id: id,
      listing_title: title,
      source: source || "explore_grid",
    });
  };

  const [logoError, setLogoError] = useState(false);
  const showLogo = Boolean(logoUrl) && !logoError;

  const rawCat = Array.isArray(category)
    ? category[0]
    : category || (tags && tags.length > 0 ? tags[0].replace(/^#/, "") : "");

  const displayCategory = rawCat
    ? rawCat.charAt(0).toUpperCase() + rawCat.slice(1)
    : "AI Solution";

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-full flex flex-col justify-between gap-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${className}`.trim()}
    >
      {/* Card banner: seller-uploaded cover image if provided (same image as the
          agent detail page), else the logo-derived gradient — also shared with
          the detail page's CardBanner so the two views always match. */}
      <div className="relative w-full">
        {bannerUrl ? (
          <div className="relative h-[104px] sm:h-[110px] rounded-xl overflow-hidden w-full">
            <Image
              src={bannerUrl}
              alt=""
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        ) : (
          <CardBanner
            logoUrl={logoUrl}
            fallbackGrad={grad}
            index={cardIndex}
            className="relative h-[104px] sm:h-[110px] rounded-xl overflow-hidden w-full"
          />
        )}

        {/* Logo overlapping slightly below the banner */}
        <div className="absolute bottom-[-16px] left-3 w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-white shadow-md overflow-hidden bg-white flex items-center justify-center z-10">
          {showLogo ? (
            <Image
              src={logoUrl!}
              alt={title}
              width={64}
              height={64}
              unoptimized
              className="w-full h-full object-cover"
              // Sizing is pinned inline as well as via classes.
              //
              // Seller logos arrive at wildly different aspect ratios (measured on
              // the live catalogue: 1.00 square, 1.22 wide, 0.56 tall). Only a
              // square one filled the tile; the rest were letterboxed with white
              // gaps. Inline styles outrank every stylesheet, so this holds
              // regardless of the global `img { height: auto }` compatibility rule,
              // Next/Image's own attributes, or utility-class ordering — object-fit
              // then crops the overflow instead of shrinking the image to fit.
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={() => setLogoError(true)}
            />
          ) : (
            <Image
              src="/logo/aikart-ai-mark.png"
              alt="aiKart"
              width={40}
              height={40}
              className="w-3/5 h-3/5 object-contain"
            />
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 mt-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-1">
            {title}
          </h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed min-h-[36px]">
            {desc}
          </p>
        </div>

        {/* Category / Tag Pill Row (Consistently positioned) */}
        <div className="flex items-center pt-2 sm:pt-3">
          {displayCategory && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              {displayCategory}
            </span>
          )}
        </div>

        {/* Bottom row (Price + View Solution button pinned to bottom) */}
        <div className="flex items-center justify-between pt-3 mt-auto gap-2">
          <span className="text-xs sm:text-sm font-bold text-gray-900 truncate min-w-0 flex-1">{price}</span>
          <Link href={href} onClick={handleClick} className="shrink-0">
            <button
              type="button"
              className="border border-blue-500 text-blue-600 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              View Solution
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
