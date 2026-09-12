// Scopes the revamped blue "aikart" theme to the admin section without
// touching the shared global tokens (see `.theme-aikart` in globals.css).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-aikart">{children}</div>;
}
