# Autosnap

Autosnap is a production-ready CLI that automates Git snapshots and gives a clean, friendly view of your commit history.

## Features

- Automatic snapshots only when changes exist
- Initializes Git repositories automatically
- Safety checks for secrets and `.env`
- Human-readable history, diff, and status
- Watch mode with debounce and recursion protection
- Ready for `npm link` or global installs

## Install

```bash
npm install -g autosnap
```

For local development:

```bash
npm link
```

## Usage

```bash
autosnap
```

Snapshots only if there are changes. If nothing changed, Autosnap exits cleanly.

### CLI Reference

```bash
autosnap                 # auto snapshot
autosnap --dry-run        # preview without committing
autosnap --push           # commit + push
autosnap --watch          # watch for file changes (5s debounce)
autosnap --watch --interval 300  # commit after 300s of inactivity
autosnap --watch --every 300     # alias for --interval
autosnap --prefix dev     # prefix commit messages

autosnap log              # recent commits
autosnap log -n 10         # last 10 commits
autosnap log --full        # detailed commit info
autosnap last             # show last commit
autosnap diff             # diff vs last commit
autosnap diff --stat      # summary diff
autosnap status           # git status summary
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
autosnap
autosnap --prefix dev
autosnap log -n 3
autosnap diff --stat
autosnap --watch --dry-run
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