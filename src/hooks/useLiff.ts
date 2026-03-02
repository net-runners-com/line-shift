/**
 * LIFF 初期化と状態管理
 */

import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { env } from '@/config/env';

export interface LiffState {
  isReady: boolean;
  isLoggedIn: boolean;
  isInClient: boolean;
  userName: string;
  userId: string;
  /** LINE グループ/トークルーム ID（グループ・ルームから開いた場合のみ） */
  groupId: string | null;
  error: string | null;
}

const initialState: LiffState = {
  isReady: false,
  isLoggedIn: false,
  isInClient: false,
  userName: '',
  userId: 'local',
  groupId: null,
  error: null,
};

export function useLiff(): LiffState & { login: () => void } {
  const [state, setState] = useState<LiffState>(initialState);

  useEffect(() => {
    if (!env.liffId) {
      setState((s) => ({ ...s, isReady: true, error: 'LIFF IDが設定されていません' }));
      return;
    }

    liff
      .init({ liffId: env.liffId })
      .then(() => {
        const isLoggedIn = liff.isLoggedIn();
        const isInClient = liff.isInClient();
        let userName = '';
        let userId = 'local';
        let groupId: string | null = null;

        if (isLoggedIn) {
          try {
            const idToken = liff.getDecodedIDToken?.();
            if (idToken) {
              userName = idToken.name ?? '';
              userId = idToken.sub ?? 'local';
            }
          } catch {
            // ignore
          }
        }

        try {
          // 公式: liff.getContext().groupId / roomId でグループID取得 → サーバーで GET /v2/bot/group/{groupId}/members/ids を叩く
          // 注意: 2023年2月より getContext() の groupId/roomId は廃止のため、多くの環境で null になります
          const ctx = liff.getContext?.();
          if (ctx?.type === 'group' && ctx.groupId) groupId = ctx.groupId;
          if (ctx?.type === 'room' && ctx.roomId) groupId = ctx.roomId;
        } catch {
          // ignore
        }

        setState({
          isReady: true,
          isLoggedIn,
          isInClient,
          userName,
          userId,
          groupId,
          error: null,
        });
      })
      .catch((err) => {
        console.error(err);
        const msg = err?.message ?? '';
        const isNotFound =
          msg.includes('was not found') ||
          msg.includes('channel not found') ||
          msg.includes('404');
        const errorText = isNotFound
          ? 'LIFF アプリが見つかりません。LINE Developers で正しい LIFF ID を確認し、.env の VITE_LIFF_ID を更新してビルドし直してください。'
          : '初期化に失敗しました。LIFF IDを確認してください。';
        setState((s) => ({
          ...s,
          isReady: true,
          error: errorText,
        }));
      });
  }, []);

  const login = () => {
    liff.login();
  };

  return { ...state, login };
}
