export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Aquí no incluyes Header, Sidebar ni nada global
  return <>{children}</>;
}
