// コマンドをここに追加すると /名前 で使える
import type { Command } from "./types.ts";
import { testCommand } from "./test.ts";
import { createHelpCommand } from "./help.ts";
import { listCommand } from "./list.ts";
import { registerCommand } from "./register.ts";
import { deleteCommand } from "./delete.ts";
import { adminCommand } from "./admin.ts";
import { memberCommand } from "./member.ts";

function getHelpLines(): string[] {
  return commands
    .filter((c) => c.description)
    .map((c) => `・/${c.names[0]} … ${c.description}`);
}

export const commands: Command[] = [
  testCommand,
  createHelpCommand(getHelpLines),
  listCommand,
  registerCommand,
  deleteCommand,
  adminCommand,
  memberCommand,
];

const nameToCommand = new Map<string, Command>();
for (const cmd of commands) {
  for (const name of cmd.names) {
    nameToCommand.set(name.toLowerCase(), cmd);
  }
}

export function findCommand(name: string): Command | undefined {
  return nameToCommand.get(name.trim().toLowerCase());
}
