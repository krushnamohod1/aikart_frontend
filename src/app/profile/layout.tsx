// Scopes the revamped blue "aikart" theme to the profile route without
// touching the shared global tokens (see `.theme-aikart` in globals.css).
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-aikart">{children}</div>;
}
