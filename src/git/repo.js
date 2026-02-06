import fs from "node:fs/promises";
import path from "node:path";

export const ensureRepo = async (git, logger) => {
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    logger.warn("📁 No git repo detected — initializing...");
    await git.init();
    return true;
  }
  return false;
};

export const ensureFirstRunWarning = async (cwd, logger) => {
  const markerPath = path.join(cwd, ".git", "autosnap.json");
  try {
    await fs.access(markerPath);
    return;
  } catch {
    logger.warn("⚠️  First run: review files before committing.");
    await fs.writeFile(
      markerPath,
      JSON.stringify({ firstRunSeenAt: new Date().toISOString() }, null, 2)
    );
  }
};