import Table from "cli-table3";
import { timeAgo } from "../utils/time.js";

const hasHead = async (git) => {
  try {
    await git.raw(["rev-parse", "--verify", "HEAD"]);
    return true;
  } catch {
    return false;
  }
};

const ensureRepo = async (git, logger) => {
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    logger.warn("📁 Not a git repository yet.");
  }
  return isRepo;
};

export const showLog = async (git, logger, { limit = 5, full = false } = {}) => {
  if (!(await ensureRepo(git, logger))) return;
  if (!(await hasHead(git))) {
    logger.warn("📜 No commits yet.");
    return;
  }

  if (full) {
    const output = await git.raw([
      "log",
      `-n`,
      String(limit),
      "--stat",
      "--pretty=fuller",
    ]);
    logger.raw(output.trimEnd());
    return;
  }

  const log = await git.log({ maxCount: limit });
  logger.info(`📜 Showing last ${log.all.length} commits`);

  const table = new Table({
    head: ["Hash", "When", "Author", "Message"],
    colWidths: [10, 16, 20, 60],
    wordWrap: true,
  });

  log.all.forEach((entry) => {
    const date = new Date(entry.date);
    table.push([
      entry.hash.slice(0, 7),
      timeAgo(date),
      entry.author_name,
      entry.message,
    ]);
  });

  logger.raw(table.toString());
};

export const showLast = async (git, logger) => {
  if (!(await ensureRepo(git, logger))) return;
  if (!(await hasHead(git))) {
    logger.warn("📜 No commits yet.");
    return;
  }
  const output = await git.raw(["log", "-1", "--pretty=fuller"]);
  logger.raw(output.trimEnd());
};

export const showDiff = async (git, logger, { stat = false } = {}) => {
  if (!(await ensureRepo(git, logger))) return;
  if (!(await hasHead(git))) {
    logger.warn("📜 No commits yet.");
    return;
  }
  const args = stat ? ["--stat", "HEAD"] : ["HEAD"];
  const output = await git.diff(args);
  if (!output.trim()) {
    logger.info("✅ No diff against last commit.");
    return;
  }
  logger.raw(output.trimEnd());
};

export const showStatus = async (git, logger) => {
  if (!(await ensureRepo(git, logger))) return;
  const status = await git.status();
  logger.info("📌 Git status summary");
  logger.subtle(`Branch: ${status.current || "unknown"}`);
  logger.subtle(`Modified: ${status.modified.length}`);
  logger.subtle(`Created: ${status.created.length}`);
  logger.subtle(`Deleted: ${status.deleted.length}`);
  logger.subtle(`Untracked: ${status.not_added.length}`);
};