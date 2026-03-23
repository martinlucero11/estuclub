import { cn } from '@/lib/utils';

export function CincoDosLogo({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 160 90" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-white", className)}
    >
      <style>
        {`
          .cincodos-font {
            font-family: 'Montserrat', 'Inter', 'Segoe UI', sans-serif;
            font-weight: 800;
            letter-spacing: -0.06em;
          }
        `}
      </style>
      <text x="10" y="45" className="cincodos-font" fontSize="42" fill="currentColor">
        cinco.
      </text>
      <text x="63" y="80" className="cincodos-font" fontSize="42" fill="currentColor">
        dos
      </text>
    </svg>
  );
}
