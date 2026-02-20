interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`card bg-neutral shadow-xl border border-white/5 ${className}`}>
      <div className="card-body p-5">
        {children}
      </div>
    </div>
  );
}