import { describe, expect, it } from "vitest";
import { buildCommitMessage, runAutoSnapshot } from "../src/git/commit.js";
import { createTempRepo, writeFile } from "./helpers/repo.js";

const silentLogger = {
  info: () => {},
  success: () => {},
  warn: () => {},
  error: () => {},
  subtle: () => {},
  raw: () => {},
  headline: () => {},
};

describe("commit messaging", () => {
  it("builds initial snapshot message", () => {
    const message = buildCommitMessage({
      firstCommit: true,
      prefix: "",
      status: {
        created: ["a.js"],
        modified: [],
        deleted: [],
        not_added: [],
        renamed: [],
      },
      files: ["a.js"],
    });
    expect(message).toBe("[CHORE]: initialize project snapshot");
  });

  it("builds a readable message for later commits", () => {
    const message = buildCommitMessage({
      firstCommit: false,
      prefix: "dev",
      status: {
        created: [],
        modified: ["src/cli/index.js", "README.md"],
        deleted: [],
        not_added: [],
        renamed: [],
      },
      files: ["src/cli/index.js", "README.md"],
    });
    expect(message).toBe("[DEV]: update cli and docs");
  });

  it("chooses action words from the change type", () => {
    const message = buildCommitMessage({
      firstCommit: false,
      prefix: "feat",
      status: {
        created: ["src/utils/time.js"],
        modified: [],
        deleted: [],
        not_added: [],
        renamed: [],
      },
      files: ["src/utils/time.js"],
    });
    expect(message).toBe("[FEAT]: add utilities");
  });

  it("infers a small-change tag when no prefix is provided", () => {
    const message = buildCommitMessage({
      firstCommit: false,
      prefix: "",
      status: {
        created: [],
        modified: ["README.md"],
        deleted: [],
        not_added: [],
        renamed: [],
      },
      files: ["README.md"],
    });
    expect(message).toBe("[CHORE]: update docs");
  });

  it("infers a larger tag for broader watch-style edits", () => {
    const message = buildCommitMessage({
      firstCommit: false,
      prefix: "",
      status: {
        created: ["src/cli/index.js", "src/git/commit.js"],
        modified: ["README.md", "test/commit.test.js"],
        deleted: [],
        not_added: [],
        renamed: [],
      },
      files: [
        "src/cli/index.js",
        "src/git/commit.js",
        "README.md",
        "test/commit.test.js",
      ],
    });
    expect(message).toBe("[OVERHAUL]: update cli, git workflow, and docs");
  });
});

describe("auto snapshot safety", () => {
  it("blocks sensitive files", async () => {
    const { git, baseDir } = await createTempRepo();
    await writeFile(baseDir, ".env", "SECRET=1");
    const result = await runAutoSnapshot({
      git,
      logger: silentLogger,
      dryRun: true,
      push: false,
      prefix: "",
    });
    expect(result.blocked).toBe(true);
  });
});
