export type TabId = 'calendar' | 'register' | 'list' | 'confirmed' | 'members';

interface TabItem {
  id: TabId;
  label: string;
  /** 短いラベル（下ナビ用） */
  shortLabel: string;
}

const defaultTabs: TabItem[] = [
  { id: 'calendar', label: 'カレンダー', shortLabel: 'カレンダー' },
  { id: 'register', label: '提出', shortLabel: '提出' },
  { id: 'list', label: 'マイシフト', shortLabel: 'マイ' },
  { id: 'confirmed', label: '確定シフト', shortLabel: '確定' },
  { id: 'members', label: 'メンバー', shortLabel: 'メンバー' },
];

interface TabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <nav className="tabs tabs--bottom" aria-label="メイン">
      {defaultTabs.map(({ id, label, shortLabel }) => (
        <button
          key={id}
          type="button"
          className={`tab ${activeTab === id ? 'active' : ''}`}
          onClick={() => onTabChange(id)}
          aria-current={activeTab === id ? 'page' : undefined}
          aria-label={label}
        >
          <span className="tab-label">{shortLabel}</span>
        </button>
      ))}
    </nav>
  );
}
