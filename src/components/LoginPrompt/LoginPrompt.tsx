interface LoginPromptProps {
  onLogin: () => void;
}

export function LoginPrompt({ onLogin }: LoginPromptProps) {
  return (
    <div className="card login-prompt">
      <p>シフトを管理するにはLINEでログインしてください。</p>
      <button type="button" className="btn btn-primary" onClick={onLogin}>
        LINEでログイン
      </button>
    </div>
  );
}
