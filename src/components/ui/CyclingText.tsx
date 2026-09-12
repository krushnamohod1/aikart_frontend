"use client";

import { useEffect, useState } from "react";

const WORDS = [
  "Intelligence",
  "Speed",
  "Accuracy",
  "AI",
  "Automation",
  "Accountable AI",
  "Generative AI",
  "Legal AI",
  "Healthcare AI",
  "E-commerce AI",
];

export function CyclingText() {
  const [index, setIndex]   = useState(0);
  const [phase, setPhase]   = useState<"visible" | "exit" | "enter">("visible");

  useEffect(() => {
    // stay visible for 2s, then exit, then enter next word
    const visible = setTimeout(() => setPhase("exit"), 2000);
    return () => clearTimeout(visible);
  }, [index]);

  useEffect(() => {
    if (phase === "exit") {
      const t = setTimeout(() => {
        setIndex((i) => (i + 1) % WORDS.length);
        setPhase("enter");
      }, 320);
      return () => clearTimeout(t);
    }
    if (phase === "enter") {
      const t = setTimeout(() => setPhase("visible"), 320);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const style: React.CSSProperties = {
    display: "inline-block",
    opacity:   phase === "visible" ? 1 : 0,
    transform: phase === "exit"    ? "translateY(-10px)"
             : phase === "enter"   ? "translateY(10px)"
             : "translateY(0)",
    transition: "opacity 0.3s ease, transform 0.3s ease",
  };

  return (
    <span
      className="gradient-heading animated-gradient-text font-inherit"
      style={{
        ...style,
        fontWeight: "inherit",
        fontFamily: "inherit",
        fontSize: "inherit",
        letterSpacing: "inherit",
      }}
    >
      {WORDS[index]}
    </span>
  );
}
