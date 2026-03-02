/**
 * Google スプレッドシートへシフトを出力
 * Google Identity Services (GSI) でトークン取得 → Sheets API で新規スプレッドシート作成・書き込み
 */

import type { Shift } from '@/types/shift';
import { env } from '@/config/env';

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const GSI_SCRIPT = 'https://accounts.google.com/gsi/client';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (res: { access_token: string }) => void;
          }) => { requestAccessToken: (options?: { prompt?: string }) => void };
        };
      };
    };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      if (window.google) return resolve();
      const check = setInterval(() => {
        if (window.google) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google script'));
    document.head.appendChild(script);
  });
}

function getAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!env.googleClientId) {
      reject(new Error('Google Client ID が設定されていません'));
      return;
    }
    loadScript(GSI_SCRIPT)
      .then(() => {
        if (!window.google?.accounts?.oauth2) {
          reject(new Error('Google サインインの読み込みに失敗しました'));
          return;
        }
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: env.googleClientId,
          scope: SCOPES,
          callback: (res) => {
            if (res.access_token) resolve(res.access_token);
            else reject(new Error('トークンを取得できませんでした'));
          },
        });
        client.requestAccessToken({ prompt: '' });
      })
      .catch(reject);
  });
}

/** シフトをヘッダー行 + データ行の二次元配列に */
function shiftsToSheetValues(shifts: Shift[]): string[][] {
  const header = ['日付', '開始', '終了', 'メモ'];
  const rows = shifts.map((s) => [s.date, s.start, s.end, s.memo ?? '']);
  return [header, ...rows];
}

/**
 * シフト一覧を新規 Google スプレッドシートに出力する。
 * 成功時は作成したスプレッドシートの URL を返す。
 */
export async function exportShiftsToGoogleSheet(shifts: Shift[]): Promise<string> {
  const token = await getAccessToken();
  const title = `シフト一覧_${new Date().toISOString().slice(0, 10)}`;

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [{ properties: { title: 'シフト' } }],
    }),
  });
  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`スプレッドシートの作成に失敗しました: ${err}`);
  }
  const createData = (await createRes.json()) as {
    spreadsheetId: string;
    sheets?: { properties?: { title?: string } }[];
  };
  const spreadsheetId = createData.spreadsheetId;
  const sheetTitle = createData.sheets?.[0]?.properties?.title ?? 'シフト';

  const values = shiftsToSheetValues(shifts);
  const range = `${sheetTitle}!A1:D${values.length}`;
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ values }),
    }
  );
  if (!updateRes.ok) {
    const err = await updateRes.text();
    throw new Error(`データの書き込みに失敗しました: ${err}`);
  }

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}
