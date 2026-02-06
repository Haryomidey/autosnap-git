import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { simpleGit } from "simple-git";

export const createTempRepo = async () => {
  const baseDir = await fs.mkdtemp(path.join(os.tmpdir(), "autosnap-"));
  const git = simpleGit({ baseDir });
  await git.init();
  return { git, baseDir };
};

export const writeFile = async (baseDir, name, content) => {
  const filePath = path.join(baseDir, name);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
  return filePath;
};