interface HeaderProps {
  userName: string;
}

export function Header({ userName }: HeaderProps) {
  return (
    <header className="app-header">
      <div>
        <p className="app-header-greeting">
          Olá, {userName}
        </p>

        <h1 className="app-header-title">
          Dashboard
        </h1>
      </div>
    </header>
  );
}