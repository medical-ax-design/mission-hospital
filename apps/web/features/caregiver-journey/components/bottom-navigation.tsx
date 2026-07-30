export type RootTab = 'home' | 'schedule' | 'service-guide';

interface BottomNavigationProps {
  current: RootTab;
  onSelect: (tab: RootTab) => void;
}

const tabs: Array<{
  id: RootTab;
  label: string;
  icon: string;
}> = [
  { id: 'home', label: '홈', icon: '⌂' },
  { id: 'schedule', label: '일정', icon: '□' },
  { id: 'service-guide', label: '이용 안내', icon: '↗' },
];

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
          <span aria-hidden="true">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
