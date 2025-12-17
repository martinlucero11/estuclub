
export default function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto flex h-16 items-center justify-center px-4">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} EstuClub. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
