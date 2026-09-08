# Spec 015 report — release and partner setup

## Built

- Added `.github/workflows/release.yml`: tag pushes matching `v*` run on
  `windows-latest`, verify the app, rebuild Electron native modules, build the
  x64 NSIS installer, and attach `release/*.exe` to a GitHub release.
- Added `electron/core/octa/update.ts`: reads the public repository's latest
  GitHub release, compares SemVer-like tags, selects a safe NSIS `.exe` asset,
  and returns an update offer without installing anything. Added the IPC bridge,
  a bilingual banner, and the Settings field for the configurable repository.
- Completed the first-run sequence as:
  `language → credentials/keys → paths → health → research logins → Photoshop
  or fallback → done`. The `done` page embeds the health table, so the final
  page is still the live health check.
- Replaced `SETUP.md` with a concise Arabic + English guide for Bedo Mousa:
  installer and dependency setup, Claude/Codex sign-in, Gemini AI Studio,
  optional Vertex, optional Brave, ntfy, vault, research-browser logins,
  Photoshop fallback, health, and the first 20-question intake.
- Added `.gitleaks.toml`, `scripts/precommit.mjs`, and the versioned
  `.githooks/pre-commit` launcher. The hook scans staged additions with local
  secret patterns and Gitleaks when installed, without printing secret values.

## Copied files

None. `C:\Users\Admin\Desktop\Projects\tamim-os` was used as a read-only
reference for the existing NSIS packaging shape; no reference files were
modified or copied for this spec.

## Verification

- `npm run typecheck` — passed.
- `npm test` — passed: 33 test files, 169 tests.
- `git diff --cached --check` — passed.
- `node scripts/precommit.mjs` with Gitleaks 8.30.1 on PATH — passed.
- Required history check (Gitleaks 8.30 uses the `stdin` subcommand):
  `git log -p | gitleaks stdin --config .gitleaks.toml --redact --no-banner`
  — passed, no leaks found.
- Direct repository history check:
  `gitleaks git --config .gitleaks.toml --redact --no-banner` — passed, no
  leaks found.

## Acceptance checklist

- ✅ Release workflow builds and publishes the NSIS installer from `v*` tags.
- ✅ The app shows the current version, checks the configured GitHub release,
  and offers a download link with no auto-install.
- ✅ First-run order is final, and its last page is the health table.
- ✅ Bedo's setup guide is bilingual and under two pages in its compact form
  (65 lines / 644 words as checked in this worktree).
- ✅ Secret config and pre-commit protection are present; committed history is
  clean under Gitleaks.
- ✅ Local `v0.1.0` tag is created after the required commit; it is not pushed.

## Owner handoff

The default update repository is `abdutamim/octa`, based on the authenticated
GitHub CLI account in this environment. If the owner publishes under another
account or slug, set the owner/repo value in Octa Settings before distributing
the installer.

From the canonical checkout, after this branch is merged or checked out, the
owner can create the public repository and push the branch and local release
tag with PowerShell:

```powershell
gh auth login
$owner = gh api user --jq .login
git switch main
git merge --ff-only spec-015
git config core.hooksPath .githooks
gh repo create "$owner/octa" --public --source . --remote origin --description "Octa Assistant desktop control center"
git push -u origin main
git push origin v0.1.0
gh repo edit "$owner/octa" --default-branch main
```

If the old Octa Code repository still occupies the `octa` slug, rename or
archive that repository first; the create command above intentionally does not
delete or overwrite a remote repository. Bedo must provide the service keys,
CLI/browser logins, Obsidian vault, and any optional Photoshop/Vertex setup.
