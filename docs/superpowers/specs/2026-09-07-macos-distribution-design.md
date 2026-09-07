# FreedomBuild macOS Distribution Design

## Goal

Publish installable FreedomBuild desktop builds for both current Mac processor families and expose the correct choices on the public landing page.

## Release artifacts

Each tagged application version publishes four macOS artifacts:

- `FreedomBuild-Local-AI-<version>-arm64.dmg` for Apple Silicon.
- `FreedomBuild-Local-AI-<version>-arm64.zip` for Apple Silicon.
- `FreedomBuild-Local-AI-<version>-x64.dmg` for Intel Macs.
- `FreedomBuild-Local-AI-<version>-x64.zip` for Intel Macs.

Separate architectures are required because FreedomBuild includes native local-inference dependencies. A universal bundle would add merging complexity and increase download size.

## Build pipeline

A GitHub Actions matrix builds on native macOS runners:

- Apple Silicon runs on the standard ARM64 `macos-15` runner.
- Intel runs on the standard `macos-15-intel` runner.

Both jobs install locked dependencies, run the full test suite, build the matching architecture with electron-builder, and upload their artifacts to the GitHub Release for the pushed semantic-version tag. A final job publishes the release after both architectures succeed.

The workflow receives only repository-scoped `GITHUB_TOKEN` content-write access. It does not receive model files, user memory, conversations, or local application data.

## Landing-page behavior

Windows visitors continue to see only **Download for Windows**. Mac visitors see two explicit actions: **Download for Apple Silicon** and **Download for Intel Mac**. The page includes a short instruction for finding the processor under Apple menu → About This Mac. Unsupported platforms link to the release page.

Download URLs use the latest public release and exact versioned artifact names. Tests verify that Windows and Mac choices never leak into each other.

## Signing and first launch

The initial macOS artifacts are unsigned because no Apple Developer credentials are configured. The page and release notes must say this plainly. macOS users may need to Control-click the app, choose **Open**, and confirm. This is suitable for development distribution, not a polished public launch.

Production distribution requires a Developer ID Application certificate and Apple notarization. Later, repository secrets can provide the certificate, certificate password, Apple ID, app-specific password, and team ID without changing the artifact contract.

## Failure handling

- Either architecture failure prevents automatic release publication.
- Build logs identify the failed architecture.
- Existing Windows artifacts remain available if a Mac build fails.
- Re-running the tagged workflow replaces matching artifacts rather than creating ambiguous duplicates.

## Verification

Before declaring the Mac release available:

1. All repository tests pass locally and in both Mac jobs.
2. Both architecture jobs succeed.
3. The GitHub Release is public, not a draft.
4. Both DMG download URLs return successful responses with non-zero content lengths.
5. The landing page exposes only the two Mac choices when rendered as macOS.

Native launch verification on physical Intel and Apple Silicon Macs remains necessary before calling the unsigned builds production-ready.
