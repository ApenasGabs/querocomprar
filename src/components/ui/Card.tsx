import type { ReactElement, ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
  testId?: string;
}

export const Card = ({
  children,
  className = "",
  testId,
}: CardProps): ReactElement => {
  return (
    <div
      className={`card rounded-xl border border-slate-800 bg-slate-900/80 shadow-lg ${className}`.trim()}
      data-testid={testId}
    >
      {children}
    </div>
  );
};

export interface CardBodyProps {
  children: ReactNode;
  centered?: boolean;
  className?: string;
}

export const CardBody = ({
  children,
  centered = false,
  className = "",
}: CardBodyProps): ReactElement => {
  const centerClass = centered
    ? "flex flex-col items-center justify-center text-center"
    : "";

  return (
    <div className={`card-body p-6 ${centerClass} ${className}`.trim()}>
      {children}
    </div>
  );
};

export interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export const CardTitle = ({
  children,
  className = "",
}: CardTitleProps): ReactElement => {
  return (
    <h2 className={`card-title text-xl font-bold ${className}`.trim()}>
      {children}
    </h2>
  );
};
