import { Command } from "commander";
import chokidar from "chokidar";
import { simpleGit } from "simple-git";
import { ensureRepo, ensureFirstRunWarning } from "../git/repo.js";
import { runAutoSnapshot } from "../git/commit.js";
import { showDiff, showLast, showLog, showStatus } from "../git/history.js";
import { logger } from "../utils/logger.js";

const createGit = () => simpleGit({ baseDir: process.cwd() });

const startWatch = async (git, options) => {
  await ensureRepo(git, logger);
  await ensureFirstRunWarning(process.cwd(), logger);

  const intervalSeconds = Number(options.interval) || 5;
  const debounceMs = Math.max(1, intervalSeconds) * 1000;

  logger.headline(`👀 Watch mode enabled (debounce ${intervalSeconds}s)`);

  let debounceTimer = null;
  let isProcessing = false;
  let cooldownUntil = 0;

  const scheduleSnapshot = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      if (Date.now() < cooldownUntil) return;
      if (isProcessing) return;
      isProcessing = true;
      await runAutoSnapshot({
        git,
        logger,
        dryRun: options.dryRun,
        push: options.push,
        prefix: options.prefix,
      });
      cooldownUntil = Date.now() + 2000;
      isProcessing = false;
    }, debounceMs);
  };

  const watcher = chokidar.watch(process.cwd(), {
    ignored: [
      /(^|[\/\\])\.git/,
      /node_modules/,
      /dist/,
      /coverage/,
    ],
    ignoreInitial: true,
    persistent: true,
  });

  watcher.on("all", (event, filePath) => {
    if (Date.now() < cooldownUntil) return;
    logger.subtle(`🧭 ${event}: ${filePath}`);
    scheduleSnapshot();
  });

  process.on("SIGINT", async () => {
    logger.warn("👋 Watch mode stopped.");
    await watcher.close();
    process.exit(0);
  });
};

const handleSnapshot = async (options) => {
  const git = createGit();
  await ensureRepo(git, logger);
  await ensureFirstRunWarning(process.cwd(), logger);
  await runAutoSnapshot({
    git,
    logger,
    dryRun: options.dryRun,
    push: options.push,
    prefix: options.prefix,
  });
};

export const runCli = async () => {
  const program = new Command();

  program
    .name("autosnap-git")
    .description("Automatic Git snapshots with friendly history views.")
    .option("--dry-run", "Preview without committing")
    .option("--push", "Push after committing")
    .option("--watch", "Watch for changes and auto-snapshot")
    .option("--interval <seconds>", "Watch debounce interval in seconds", "5")
    .option("--every <seconds>", "Alias for --interval", "5")
    .option("--prefix <value>", "Commit tag (e.g., FIX, CHORE, FEAT)");

  program
    .command("log")
    .description("Show recent commits")
    .option("-n, --number <count>", "Number of commits", "5")
    .option("--full", "Show full commit details")
    .action(async (cmd) => {
      const git = createGit();
      await showLog(git, logger, {
        limit: Number(cmd.number) || 5,
        full: Boolean(cmd.full),
      });
    });

  program
    .command("last")
    .description("Show last commit")
    .action(async () => {
      const git = createGit();
      await showLast(git, logger);
    });

  program
    .command("diff")
    .description("Show diff vs last commit")
    .option("--stat", "Show diff summary")
    .action(async (cmd) => {
      const git = createGit();
      await showDiff(git, logger, { stat: Boolean(cmd.stat) });
    });

  program
    .command("status")
    .description("Show git status summary")
    .action(async () => {
      const git = createGit();
      await showStatus(git, logger);
    });

  program.action(async (options) => {
    if (options.watch) {
      if (options.every && options.every !== "5") {
        options.interval = options.every;
      }
      await startWatch(createGit(), options);
      return;
    }
    await handleSnapshot(options);
  });

  await program.parseAsync(process.argv);
};
