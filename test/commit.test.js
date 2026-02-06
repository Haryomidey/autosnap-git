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
      files: ["a.js"],
    });
    expect(message).toBe("Initial snapshot");
  });

  it("adds prefix and filenames for later commits", () => {
    const message = buildCommitMessage({
      firstCommit: false,
      prefix: "dev",
      files: ["a.js", "b.js"],
    });
    expect(message.startsWith("dev: Auto snapshot:")).toBe(true);
    expect(message.includes("a.js")).toBe(true);
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