export type RootTab = 'home' | 'schedule' | 'service-guide' | 'profile';

interface BottomNavigationProps {
  current: RootTab;
  onSelect: (tab: RootTab) => void;
}

const tabs: Array<{
  id: RootTab;
  label: string;
}> = [
  { id: 'home', label: '홈' },
  { id: 'schedule', label: '일정' },
  { id: 'service-guide', label: '이용 안내' },
  { id: 'profile', label: '내 정보' },
];

function NavigationIcon({ tab }: { tab: RootTab }) {
  if (tab === 'home') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M3.5 10.5 12 3.8l8.5 6.7v9H15v-5h-6v5H3.5z" />
      </svg>
    );
  }

  if (tab === 'schedule') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect height="16" rx="2" width="17" x="3.5" y="5" />
        <path d="M7.5 3v4M16.5 3v4M3.5 9h17M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2" />
      </svg>
    );
  }

  if (tab === 'service-guide') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8.5" />
        <path d="m9.5 14.5 2-5 5-2-2 5z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6" />
    </svg>
  );
}

export function BottomNavigation({
  current,
  onSelect,
}: BottomNavigationProps) {
  return (
    <nav className="bottom-navigation" aria-label="주요 메뉴">
      {tabs.map((tab) => (
        <button
          aria-current={current === tab.id ? 'page' : undefined}
          className="bottom-navigation__item"
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          type="button"
        >
          <span>
            <NavigationIcon tab={tab.id} />
          </span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
