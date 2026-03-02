export type TabId = 'calendar' | 'register' | 'list' | 'members';

interface TabItem {
  id: TabId;
  label: string;
}

const defaultTabs: TabItem[] = [
  { id: 'calendar', label: 'カレンダー' },
  { id: 'register', label: '登録' },
  { id: 'list', label: 'マイシフト' },
  { id: 'members', label: 'メンバー' },
];

interface TabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="tabs">
      {defaultTabs.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className={`tab ${activeTab === id ? 'active' : ''}`}
          onClick={() => onTabChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
