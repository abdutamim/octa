# Octa Assistant

Octa is a voice-first desktop assistant for Windows that turns a conversation into a researched plan and finished work: website reviews, website builds, marketing for any project, decision memos, invoices, and client operations. It runs a library of 87 skills through a planner debate (Claude Fable + GPT Astra), a 100-source multilingual research engine (GPT Luna), a native build pipeline, and a reviewer (GPT Sol), with every outward action gated by the owner.

- Full handover and user guide: [docs/HANDOVER.md](docs/HANDOVER.md) (Arabic + English)
- Setup on a new machine: [SETUP.md](SETUP.md)
- Design docs: [docs/00-OCTA-ASSISTANT.md](docs/00-OCTA-ASSISTANT.md) through [docs/07-DECISIONS.md](docs/07-DECISIONS.md)
- Skills library: [skills-library/REVIEW.md](skills-library/REVIEW.md)

## Run from source

```powershell
npm install
npm run rebuild:electron   # native modules for Electron
npm run build
npx electron-vite preview  # or: npm run dev
```

Before running the test suite after an Electron rebuild:

```powershell
npm rebuild better-sqlite3
npm test
```

Installer: `npm run dist` → `release/`.

## License

MIT for Octa's own code. The build pipeline design follows Auto-Claude (AGPL-3.0), credited in [NOTICE.md](NOTICE.md); no Auto-Claude code is included.
