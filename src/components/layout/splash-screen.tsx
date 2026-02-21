

function EstuClubLogo() {
  return (
    <div className="flex animate-pulse items-center justify-center gap-3">
        <h1 className="flex items-baseline text-center text-5xl text-primary-foreground">
            <span className="font-logo-sans font-extrabold tracking-tighter">Estu</span>
            <span className="font-logo-display text-6xl">Club</span>
        </h1>
    </div>
  );
}

export default function SplashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary">
      <EstuClubLogo />
    </div>
  );
}
