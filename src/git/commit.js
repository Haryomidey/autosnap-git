import { formatTimestamp } from "../utils/time.js";
import { findSensitiveFiles, getStatus, hasChanges, listChangedFiles } from "./status.js";

const FILE_SCOPE_RULES = [
  { match: (file) => file === "README.md" || file.endsWith(".md"), label: "docs" },
  { match: (file) => file.startsWith("src/cli/"), label: "cli" },
  { match: (file) => file.startsWith("src/git/"), label: "git workflow" },
  { match: (file) => file.startsWith("src/utils/"), label: "utilities" },
  { match: (file) => file.startsWith("test/"), label: "tests" },
  { match: (file) => file.startsWith("bin/"), label: "bin script" },
  { match: (file) => file === "package.json" || file.endsWith("lock.yaml"), label: "dependencies" },
];

const uniq = (items) => [...new Set(items.filter(Boolean))];

const pickVerb = (status) => {
  const hasCreated = status.created.length > 0;
  const hasDeleted = status.deleted.length > 0;
  const hasRenamed = status.renamed.length > 0;
  const hasModified = status.modified.length > 0 || status.not_added.length > 0;

  if (hasCreated && !hasDeleted && !hasRenamed && !hasModified) return "add";
  if (hasDeleted && !hasCreated && !hasRenamed && !hasModified) return "remove";
  if (hasRenamed && !hasCreated && !hasDeleted && !hasModified) return "rename";
  return "update";
};

export const isFirstCommit = async (git) => {
  try {
    await git.raw(["rev-parse", "--verify", "HEAD"]);
    return false;
  } catch {
    return true;
  }
};

const inferScopes = (files) => {
  const labels = uniq(files.map((file) => {
    const rule = FILE_SCOPE_RULES.find(({ match }) => match(file));
    if (rule) return rule.label;

    const [topLevel] = file.split(/[\\/]/);
    if (!topLevel) return "workspace";
    if (topLevel === "src") return "source";
    return topLevel.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
  }));

  return labels.slice(0, 3);
};

const joinScopes = (scopes) => {
  if (scopes.length === 0) return "workspace";
  if (scopes.length === 1) return scopes[0];
  if (scopes.length === 2) return `${scopes[0]} and ${scopes[1]}`;
  return `${scopes.slice(0, -1).join(", ")}, and ${scopes.at(-1)}`;
};

const inferTag = ({ firstCommit, prefix, status, files }) => {
  if (prefix?.toString().trim()) {
    return prefix.toString().trim().toUpperCase();
  }

  if (firstCommit) return "CHORE";

  const uniqueFiles = files.length;
  const impactScore =
    uniqueFiles +
    status.created.length +
    status.deleted.length +
    status.renamed.length;

  if (impactScore <= 2) return "CHORE";
  if (impactScore <= 5) return "UPDATE";
  return "OVERHAUL";
};

export const buildCommitMessage = ({ firstCommit, prefix, status, files }) => {
  const base = firstCommit
    ? "initialize project snapshot"
    : `${pickVerb(status)} ${joinScopes(inferScopes(files))}`;
  const tag = inferTag({ firstCommit, prefix, status, files });
  return `[${tag}]: ${base}`;
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
    status,
    files: changedFiles,
  });

  if (dryRun) {
    logger.warn("🧪 Dry run: skipping git add/commit.");
    logger.subtle(`Commit message would be: ${message}`);
    logger.subtle(`Snapshot captured at: ${formatTimestamp()}`);
    return { committed: false, dryRun: true };
  }

  await git.add(".");
  await git.commit(message);
  logger.success("✅ Snapshot saved");
  logger.subtle(`Message: ${message}`);
  logger.subtle(`Saved at: ${formatTimestamp()}`);

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
