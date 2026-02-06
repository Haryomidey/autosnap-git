import { formatTimestamp } from "../utils/time.js";
import { findSensitiveFiles, getStatus, hasChanges, listChangedFiles } from "./status.js";

const summarizeFiles = (files, limit = 3) => {
  if (!files.length) return "";
  const shown = files.slice(0, limit).join(", ");
  const more = files.length > limit ? ` +${files.length - limit} more` : "";
  return `${shown}${more}`;
};

export const isFirstCommit = async (git) => {
  try {
    await git.raw(["rev-parse", "--verify", "HEAD"]);
    return false;
  } catch {
    return true;
  }
};

export const buildCommitMessage = ({ firstCommit, prefix, files }) => {
  const base = firstCommit ? "Initial snapshot" : `Auto snapshot: ${formatTimestamp()}`;
  const withFiles = firstCommit || files.length === 0 ? base : `${base} (${summarizeFiles(files)})`;
  return prefix ? `${prefix}: ${withFiles}` : withFiles;
};

export const runAutoSnapshot = async ({
  git,
  logger,
  dryRun = false,
  push = false,
  prefix = "",
}) => {
  const status = await getStatus(git);
  const changedFiles = listChangedFiles(status);

  if (!hasChanges(status)) {
    logger.info("✅ No changes detected. Nothing to snapshot.");
    return { committed: false };
  }

  logger.info("📸 Changes detected");

  const sensitiveFiles = findSensitiveFiles(changedFiles);
  if (sensitiveFiles.length) {
    logger.error("🛡️  Sensitive files detected. Autosnap will not commit them.");
    logger.subtle(`Blocked files: ${sensitiveFiles.join(", ")}`);
    return { committed: false, blocked: true };
  }

  const firstCommit = await isFirstCommit(git);
  const message = buildCommitMessage({
    firstCommit,
    prefix,
    files: changedFiles,
  });

  if (dryRun) {
    logger.warn("🧪 Dry run: skipping git add/commit.");
    logger.subtle(`Commit message would be: ${message}`);
    return { committed: false, dryRun: true };
  }

  await git.add(".");
  await git.commit(message);
  logger.success("✅ Snapshot saved");
  logger.subtle(`Message: ${message}`);

  if (push) {
    try {
      await git.push();
      logger.success("🚀 Pushed to remote.");
    } catch (error) {
      logger.warn("⚠️  Unable to push. Check your remote configuration.");
      logger.subtle(error.message);
    }
  }

  return { committed: true };
};