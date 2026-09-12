export function LoadingScreen() {
  return null;
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  logo: {
    height: 48,
    width: "auto",
    maxWidth: "180px",
    objectFit: "contain",
    userSelect: "none",
    pointerEvents: "none",
  },
};

const CSS = `
@keyframes ak-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.75;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.ak-logo-pulse {
  animation: ak-pulse 1.5s ease-in-out infinite;
  transform-origin: center center;
  will-change: transform, opacity;
  display: block;
}
`;
