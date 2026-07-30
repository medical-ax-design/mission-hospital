import type { ReactNode } from 'react';

interface MobileShellProps {
  children: ReactNode;
  compactHeader?: boolean;
}

export function MobileShell({
  children,
  compactHeader = false,
}: MobileShellProps) {
  return (
    <div className="app-viewport">
      <div className="mobile-shell">
        <header className={compactHeader ? 'brand brand--compact' : 'brand'}>
          <div className="brand__mark" aria-hidden="true">
            W
          </div>
          <div>
            <strong>Wait:ON</strong>
            {!compactHeader && <span>보호자 동행 안내</span>}
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
