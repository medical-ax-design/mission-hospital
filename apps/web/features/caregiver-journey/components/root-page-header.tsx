import type { ReactNode } from 'react';

interface RootPageHeaderProps {
  accessory?: ReactNode;
  description?: string;
  eyebrow: string;
  title: string;
}

export function RootPageHeader({
  accessory,
  description,
  eyebrow,
  title,
}: RootPageHeaderProps) {
  return (
    <header className="root-page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {accessory}
    </header>
  );
}
