import { describe, expect, it } from "vitest";
import { findSensitiveFiles, hasChanges, listChangedFiles } from "../src/git/status.js";

describe("status helpers", () => {
  it("detects changes", () => {
    const status = {
      files: [],
      created: ["a.js"],
      modified: [],
      deleted: [],
      not_added: [],
      renamed: [],
    };
    expect(hasChanges(status)).toBe(true);
  });

  it("lists changed files uniquely", () => {
    const status = {
      files: [],
      created: ["a.js"],
      modified: ["b.js"],
      deleted: ["c.js"],
      not_added: ["a.js"],
      renamed: [{ from: "x.js", to: "y.js" }],
    };
    expect(listChangedFiles(status)).toEqual(["b.js", "a.js", "c.js", "y.js"]);
  });

  it("flags sensitive files", () => {
    const files = [".env", "notes.txt", "keys/id_rsa", "config.json"];
    expect(findSensitiveFiles(files)).toEqual([".env", "keys/id_rsa"]);
  });
});