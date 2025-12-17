
import { GraduationCap } from 'lucide-react';

function EstuClubLogo() {
  return (
    <div className="flex animate-pulse items-center justify-center gap-3">
        <GraduationCap className="h-12 w-12 text-primary-foreground" />
        <h1 className="flex items-center text-center text-5xl font-bold text-primary-foreground font-headline">
            <span className="text-[3.5rem]">Estu</span>
            <span className="font-logo-script text-[3.5rem]">Club</span>
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
