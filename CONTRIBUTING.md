# Contributions

Thanks for considering a contribution to Screenshot Factory.

This project is a local developer tool, so changes should keep the workflow predictable,
transparent, and safe to run on a developer machine.

## Good First Areas

- Improve documentation, examples, or troubleshooting notes.
- Add tests around config parsing, template resolution, capture jobs, and preview URL generation.
- Improve the public example templates.
- Make the UI clearer without coupling it to a specific app.
- Harden local file, command, and network boundaries.

## Local Setup

```bash
npm install
npm test
npm run lint
npm run build
npm run build:frontend
```

Start the local UI/API server:

```bash
npm run dev
```

Open [http://localhost:8000](http://localhost:8000).

## Before Opening a Pull Request

Please run:

```bash
npm test
npm run lint
npm run build
npm run build:frontend
```

Also check that you did not commit local app assets or private templates. In this repo:

- private app configs in `apps/` are ignored by default
- generated screenshots in `screenshots/` are ignored
- custom templates matching `templates/*custom*.html` are ignored
- custom template sidecars matching `templates/custom_*.meta.json` are ignored

## Project Conventions

- Keep app configs in `apps/*.json`.
- Keep app-owned files such as APKs and service-account keys outside this repo, referenced by
  `apkPath` or `uploadKeyPath`.
- Keep public templates generic and reusable.
- Use the `custom_` naming convention for private/app-specific templates.
- Prefer focused changes over broad refactors.
- Add or update tests when behavior changes.

## Security Notes

Screenshot Factory is intended to run locally. Please avoid changes that make it easy to expose the
dev server, local config files, service-account paths, or command execution to an untrusted network.

When touching code that runs system commands, prefer argument-based APIs such as `execFile` or
`spawn` over shell-interpolated command strings.

## Reporting Issues

When reporting a bug, include:

- your OS
- Node.js version
- Android SDK / adb availability
- the command or UI flow that failed
- relevant logs from the UI job panel or terminal

Avoid sharing real package names, service-account paths, upload keys, or app screenshots unless
you are comfortable making them public.
