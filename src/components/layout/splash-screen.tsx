

function EstuClubLogo() {
  return (
    <div className="flex animate-pulse items-center justify-center gap-3">
        <h1 className="flex items-baseline text-center text-5xl font-bold text-primary-foreground">
            <span className="font-sans text-[3.5rem] font-black tracking-tighter">Estu</span>
            <span className="font-logo-script text-[4rem]">Club</span>
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
