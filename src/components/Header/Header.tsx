interface HeaderProps {
  userName: string;
}

export function Header({ userName }: HeaderProps) {
  return (
    <header className="header">
      <h1>シフト管理</h1>
      <div className="user">{userName || '--'}</div>
    </header>
  );
}
