interface LoadingProps {
  message?: string;
}

export function Loading({ message = '読み込み中...' }: LoadingProps) {
  return <div id="loading">{message}</div>;
}
