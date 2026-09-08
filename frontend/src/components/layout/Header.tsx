interface HeaderProps {
  userName: string;
  title?: string;
  subtitle?: string;
}

export function Header({ userName, title = 'Dashboard', subtitle }: HeaderProps) {
  return (
    <header className="app-header" id="app-header">
      <div>
        <p className="app-header-greeting">
          {subtitle ?? `Olá, ${userName}`}
        </p>

        <h1 className="app-header-title">
          {title}
        </h1>
      </div>
    </header>
  );
}