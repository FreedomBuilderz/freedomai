# FreedomBuild macOS Distribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish separate FreedomBuild DMG and ZIP downloads for Apple Silicon and Intel Macs alongside the Windows installer.

**Architecture:** A tag-triggered GitHub Actions workflow creates one draft release, runs Windows and native Mac architecture jobs, uploads versioned artifacts, and publishes only after all builds succeed. The web landing page detects macOS but presents both Mac processor choices because browser user-agent data cannot reliably distinguish Apple Silicon from Intel.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Electron 44, electron-builder 26, GitHub Actions, GitHub CLI

**Spec:** `docs/superpowers/specs/2026-09-07-macos-distribution-design.md`

## Global Constraints

- Publish distinct `arm64` and `x64` macOS artifacts; do not create a universal bundle.
- Use native standard runners: `macos-15` for ARM64 and `macos-15-intel` for x64.
- Initial Mac builds are unsigned and must be labeled as development distributions.
- Windows visitors see only the Windows download; Mac visitors see both Mac architecture choices.
- A failed required architecture build must prevent public release publication.
- Never package user models, memory files, or conversations.

---

### Task 1: Architecture-specific Mac download controls

**Files:**
- Modify: `src/app/DesktopLanding.tsx`
- Modify: `src/app/DesktopLanding.test.tsx`
- Modify: `src/styles/app.css`

**Interfaces:**
- Consumes: `BrowserPlatform = "windows" | "mac" | "other"`
- Produces: exported `MAC_ARM64_DOWNLOAD_URL` and `MAC_X64_DOWNLOAD_URL` constants and Mac-only architecture buttons

- [ ] **Step 1: Write the failing Mac-button test**

```tsx
render(<DesktopLanding platform="mac" />);
expect(screen.getAllByRole("link", { name: "Download for Apple Silicon" })[0])
  .toHaveAttribute("href", MAC_ARM64_DOWNLOAD_URL);
expect(screen.getAllByRole("link", { name: "Download for Intel Mac" })[0])
  .toHaveAttribute("href", MAC_X64_DOWNLOAD_URL);
expect(screen.queryByText("Download for Windows")).not.toBeInTheDocument();
expect(screen.getByText(/Apple menu.*About This Mac/i)).toBeInTheDocument();
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run src/app/DesktopLanding.test.tsx`

Expected: FAIL because the two exported URLs and architecture buttons do not exist.

- [ ] **Step 3: Implement the Mac controls**

Set the URLs to the versioned latest-release assets:

```ts
export const MAC_ARM64_DOWNLOAD_URL =
  "https://github.com/FreedomBuilderz/freedomai/releases/latest/download/FreedomBuild-Local-AI-0.1.2-arm64.dmg";
export const MAC_X64_DOWNLOAD_URL =
  "https://github.com/FreedomBuilderz/freedomai/releases/latest/download/FreedomBuild-Local-AI-0.1.2-x64.dmg";
```

Render both buttons only for `platform === "mac"`, add the processor-help copy, and style the pair responsively using `.mac-download-options`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npx vitest run src/app/DesktopLanding.test.tsx`

Expected: both landing-page tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/DesktopLanding.tsx src/app/DesktopLanding.test.tsx src/styles/app.css
git commit -m "feat: add Mac architecture downloads"
```

### Task 2: Atomic multi-platform release workflow

**Files:**
- Modify: `.github/workflows/release-windows.yml`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `docs/DISTRIBUTION.md`

**Interfaces:**
- Consumes: tag `v0.1.2`, npm scripts `test` and `desktop:package`, electron-builder artifact naming
- Produces: public GitHub Release with Windows x64, Mac ARM64, and Mac x64 installers

- [ ] **Step 1: Record the expected release structure in documentation before configuration**

Document the exact runner/architecture mapping, artifact names, unsigned warning, and tag command in `docs/DISTRIBUTION.md`.

- [ ] **Step 2: Bump the application version**

Change the root `version` in `package.json` and both root-package version entries in `package-lock.json` from `0.1.1` to `0.1.2`.

- [ ] **Step 3: Restructure the workflow into release stages**

Implement these tag-only jobs in `.github/workflows/release-windows.yml`:

```yaml
create-release:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: gh release create "$GITHUB_REF_NAME" --draft --title "FreedomBuild Local AI $GITHUB_REF_NAME" --generate-notes

release-windows:
  needs: create-release
  runs-on: windows-latest
  # checkout, setup-node, npm ci, npm test, package --win --publish never
  # gh release upload "$env:GITHUB_REF_NAME" release/*.exe release/latest.yml --clobber

release-macos:
  needs: create-release
  strategy:
    matrix:
      include:
        - runner: macos-15
          arch: arm64
        - runner: macos-15-intel
          arch: x64
  runs-on: ${{ matrix.runner }}
  # checkout, setup-node, npm ci, npm test
  # npm run desktop:package -- --mac --${{ matrix.arch }} --publish never
  # gh release upload "$GITHUB_REF_NAME" release/*.dmg release/*.zip --clobber

publish-release:
  needs: [release-windows, release-macos]
  runs-on: ubuntu-latest
  steps:
    - run: gh release edit "$GITHUB_REF_NAME" --draft=false
```

Every `gh` step receives `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` and the workflow keeps `permissions: contents: write`. Package steps receive `CSC_IDENTITY_AUTO_DISCOVERY: "false"` until signing credentials exist.

- [ ] **Step 4: Run local regression and build verification**

Run: `npm test -- --run`

Expected: all tests pass.

Run: `npm run desktop:build`

Expected: TypeScript, Vite, Electron main process, and preload builds exit successfully; `dist/index.html` keeps `./assets/` paths.

- [ ] **Step 5: Commit and push**

```bash
git add .github/workflows/release-windows.yml package.json package-lock.json docs/DISTRIBUTION.md
git commit -m "ci: publish native Mac installers"
git push origin main
```

### Task 3: Trigger and verify release 0.1.2

**Files:**
- Verify only: GitHub Actions and GitHub Releases

**Interfaces:**
- Consumes: commit containing version `0.1.2` and the multi-platform workflow
- Produces: tag `v0.1.2` and publicly downloadable installer assets

- [ ] **Step 1: Confirm the tag is unused**

Run: `git ls-remote --tags origin refs/tags/v0.1.2`

Expected: no output.

- [ ] **Step 2: Push the release tag**

```bash
git tag -a v0.1.2 -m "FreedomBuild Local AI v0.1.2"
git push origin v0.1.2
```

- [ ] **Step 3: Monitor all jobs**

Query `https://api.github.com/repos/FreedomBuilderz/freedomai/actions/runs` until the `v0.1.2` workflow completes. Expected: create, Windows, both Mac matrix entries, and publish jobs conclude successfully.

- [ ] **Step 4: Verify the public release assets**

Query `https://api.github.com/repos/FreedomBuilderz/freedomai/releases/latest` and require `tag_name` to equal `v0.1.2`, `draft` to be false, and these assets to have non-zero sizes:

```text
FreedomBuild-Local-AI-0.1.2-x64.exe
FreedomBuild-Local-AI-0.1.2-arm64.dmg
FreedomBuild-Local-AI-0.1.2-arm64.zip
FreedomBuild-Local-AI-0.1.2-x64.dmg
FreedomBuild-Local-AI-0.1.2-x64.zip
```

- [ ] **Step 5: Verify both DMG URLs**

Run header-only requests against both latest-release DMG URLs and require a final `200 OK`, `Content-Disposition: attachment`, and non-zero `Content-Length`.

- [ ] **Step 6: Report signing limitation accurately**

State that both processor builds are downloadable and CI-verified, but unsigned artifacts still require macOS override steps and physical-Mac launch verification before production readiness.
