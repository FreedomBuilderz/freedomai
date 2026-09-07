# FreedomBuild Local AI Distribution

FreedomBuild is distributed as a native desktop application. End users never enter the development URL and do not need Node.js.

## Windows

Build on Windows:

```powershell
npm ci
npm run desktop:package -- --win
```

Publish the generated `FreedomBuild-Local-AI-<version>-x64.exe` from `release/` on the product download page. The assisted installer installs per user, allows the destination to be changed, creates a desktop shortcut, and adds a Start Menu shortcut.

Production releases must be Authenticode-signed before public distribution. Unsigned development installers can trigger Microsoft Defender SmartScreen warnings.

## macOS

Build on macOS:

```bash
npm ci
npm run desktop:package -- --mac
```

Publish the generated DMG from `release/`. Users open the DMG, drag FreedomBuild Local AI into Applications, and launch it from Applications, Spotlight, or the Dock.

Production releases must be signed with a Developer ID Application certificate and notarized with Apple. macOS packaging and notarization must run on macOS; it cannot be completed from this Windows build machine.

## First Launch

1. Electron opens the bundled React interface without launching a browser.
2. The application checks for an existing model installation.
3. If a model exists, it loads and opens chat.
4. Otherwise, setup assesses the computer and offers compatible local models.
5. The selected model downloads into the user's application-data directory.
6. Later launches reuse the installed model and work offline.

## Local Memory

The application creates a `memory` directory inside Electron's per-user application-data directory:

- `SOUL.md` stores explicit durable facts and preferences, such as “remember that…” and “my name is…”.
- `ACTIVITY.md` stores a timestamped, append-only local record of completed interactions.
- Full conversation state remains in the application's local conversation store.

`SOUL.md` is included as user-provided context in later local prompts. This is retrieval-based memory, not model-weight training. Secret-like statements are excluded from durable memory, and these files are never included in the application installer or source repository.

The `http://127.0.0.1:5173` address is used only by `npm run desktop:dev`. It is not used in packaged applications.
