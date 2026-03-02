// /iamadmin … 自分を管理者に（グループに管理者がいないときのみ）
// /addadmin <LINEのユーザーID> … 既存管理者が別ユーザーを管理者に追加

import type { Command } from "./types.ts";

export const adminCommand: Command = {
  names: ["iamadmin", "管理者", "addadmin", "管理者追加"],
  description: "/iamadmin で自分を管理者に、/addadmin <ユーザーID> で管理者追加",
  async exec(ctx) {
    const { userId, groupId, args, supabase, isAdmin } = ctx;
    if (!groupId || !userId) {
      return ["グループトークで実行してください。"];
    }
    if (!supabase) {
      return ["サーバー設定のため、しばらくしてからお試しください。"];
    }

    const name = (ctx.rawText.slice(1).trim().split(/\s+/)[0] ?? "").toLowerCase();
    const isIamAdmin = ["iamadmin", "管理者"].includes(name);
    const isAddAdmin = ["addadmin", "管理者追加"].includes(name);

    if (isIamAdmin) {
      const { error } = await supabase.rpc("ensure_group_admin", {
        p_group_id: groupId,
        p_line_user_id: userId,
      });
      if (error) {
        if (error.message?.includes("ONLY_ADMIN_CAN_ADD")) {
          return ["このグループにはすでに管理者がいます。管理者のみ、/addadmin <ユーザーID> で追加できます。"];
        }
        return [`登録に失敗しました: ${error.message ?? error}`];
      }
      return ["あなたを管理者に登録しました。"];
    }

    if (isAddAdmin) {
      const newAdminId = args[0]?.trim();
      if (!newAdminId) {
        return ["使い方: /addadmin <LINEのユーザーID>\n（メンバー一覧で確認できる U で始まるID）"];
      }
      if (!isAdmin) {
        return ["管理者のみ実行できます。"];
      }
      const { error } = await supabase.rpc("add_group_admin", {
        p_group_id: groupId,
        p_requester_user_id: userId,
        p_new_admin_user_id: newAdminId,
      });
      if (error) {
        if (error.message?.includes("ONLY_ADMIN_CAN_ADD")) {
          return ["管理者のみ実行できます。"];
        }
        return [`追加に失敗しました: ${error.message ?? error}`];
      }
      return [`${newAdminId} を管理者に追加しました。`];
    }

    return [];
  },
};
