# Autosnap Git

Autosnap Git is a production-ready CLI that automates Git snapshots and gives a clean, friendly view of your commit history.

## Features

- Automatic snapshots only when changes exist
- Initializes Git repositories automatically
- Safety checks for secrets and `.env`
- Human-readable history, diff, and status
- Watch mode with debounce and recursion protection
- Ready for `npm link` or global installs

## Install

```bash
npm install -g autosnap-git
```

For local development:

```bash
npm link
```

## Usage

```bash
autosnap-git
```

Snapshots only if there are changes. If nothing changed, Autosnap exits cleanly.

### CLI Reference

```bash
autosnap-git                 # auto snapshot
autosnap-git --dry-run        # preview without committing
autosnap-git --push           # commit + push
autosnap-git --watch          # watch for file changes (5s debounce)
autosnap-git --watch --interval 300  # commit after 300s of inactivity
autosnap-git --watch --every 300     # alias for --interval
autosnap-git --prefix dev     # prefix commit messages

autosnap-git log              # recent commits
autosnap-git log -n 10         # last 10 commits
autosnap-git log --full        # detailed commit info
autosnap-git last             # show last commit
autosnap-git diff             # diff vs last commit
autosnap-git diff --stat      # summary diff
autosnap-git status           # git status summary
```

## Commit Message Rules

- First commit: `Initial snapshot`
- Later commits: `Auto snapshot: YYYY-MM-DD HH:mm`
- Optional file hints are appended for context
- `--prefix` adds a prefix such as `dev:`

## Watch Mode

`--watch` uses `chokidar` to track changes:

- Debounce of 5 seconds
- Ignores `.git`, `node_modules`, `dist`, and `coverage`
- Prevents recursive commits
- Shows live activity events

## Safety

Autosnap respects `.gitignore` and refuses to commit:

- `.env` files
- private keys (`*.pem`, `*.key`, `id_rsa`)
- filenames containing `secret` or `credentials`

On first run, Autosnap prints a warning so you can double-check changes.

## Examples

```bash
autosnap-git
autosnap-git --prefix dev
autosnap-git log -n 3
autosnap-git diff --stat
autosnap-git --watch --dry-run
```

## FAQ

**Why didn't Autosnap create a commit?**

No changes were detected, or sensitive files were found and blocked.

**Does Autosnap respect `.gitignore`?**

Yes. It uses `git add .` and Git's ignore rules.

**How do I stop watch mode?**

Press `Ctrl+C`.

## Development

```bash
npm install
npm test
```
