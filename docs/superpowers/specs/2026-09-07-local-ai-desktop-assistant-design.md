# Local AI Desktop Assistant — Product and Architecture Design

**Status:** Proposed MVP design  
**Platforms:** Windows 10/11 and macOS 13+  
**Primary promise:** A private AI assistant that runs locally without per-token fees and remains useful without an internet connection.

## 1. Product Summary

The product is an installable desktop application with a conversational interface similar to ChatGPT or Claude. On first launch, it evaluates the user's computer, recommends a compatible open-source model, downloads and verifies it, and configures a local inference runtime automatically.

Local inference is always the default. The application works offline after initial setup. When internet access is available, users may enable web-assisted features or configure optional cloud AI providers in Settings. Cloud services must never be required for core chat functionality.

## 2. MVP Goals

- Provide signed installers for Windows and macOS.
- Detect CPU, system memory, GPU, GPU memory, operating-system architecture, free disk space, and supported acceleration.
- Select a safe model/runtime configuration for the detected hardware.
- Clearly disclose download size, storage use, and expected performance before installation.
- Download, verify, install, start, stop, update, and remove local models from inside the application.
- Offer a polished streaming chat experience with conversation history.
- Collect a small, optional user profile and store it only on the device.
- Work fully offline after the model has been installed.
- Allow advanced users to override the recommended model.
- Reserve Settings entries for optional online tools and cloud AI providers.

## 3. Non-Goals for the First Release

- Training or fine-tuning models.
- Synchronizing conversations between devices.
- Mobile or browser-only editions.
- Multi-user server hosting.
- Autonomous computer control.
- A public model marketplace.
- Voice, image generation, and document retrieval beyond basic text attachment extraction.
- Guaranteed support for every GPU or every open-source model.

These may be added after the local chat foundation is stable.

## 4. Recommended Architecture

### 4.1 Desktop shell

Use **Electron** for the native desktop shell, **React** and **TypeScript** for the interface, and **Node.js** for privileged native operations. This provides one JavaScript/TypeScript toolchain across the interface and desktop services while supporting signed Windows and macOS installers.

The Electron main process owns permissions, filesystem access, hardware discovery, downloads, process supervision, and secure configuration. The renderer is treated as an unprivileged presentation layer with Node integration disabled, context isolation enabled, and a sandboxed preload bridge exposing narrowly scoped IPC commands.

### 4.2 Local inference

Use **llama.cpp** as the managed inference runtime and **GGUF** as the initial model format. Ship platform-specific, signed runtime binaries with the application or its signed runtime package. The app starts the runtime on loopback only, chooses the correct acceleration backend, monitors its health, and stops it when appropriate.

Initial acceleration targets:

- macOS Apple Silicon: Metal.
- Windows NVIDIA: CUDA-compatible build when supported.
- Windows AMD/Intel GPU: Vulkan where validated.
- All supported systems: CPU fallback.

The runtime binds only to `127.0.0.1`, uses an ephemeral port, and requires a random per-session authorization secret. It must not be reachable from the local network.

### 4.3 Why this approach

Compared with a browser plus separately installed Ollama service, Electron plus a managed llama.cpp runtime gives the product direct control over installation, privacy, compatibility, upgrades, and recovery. It also avoids requiring users to understand runtimes, terminal commands, model formats, or ports. Electron has a larger installed and runtime footprint than Tauri, but it removes the Rust toolchain and allows the product to use Node.js end to end.

## 5. Major Components

### Desktop UI

- First-run onboarding wizard.
- Chat and streaming response view.
- Conversation list and search.
- Model manager.
- Settings, privacy controls, and diagnostics.
- Optional provider configuration.

### Device Profiler

Produces a normalized `DeviceProfile` containing:

- OS name, version, and architecture.
- CPU model, architecture, core count, and supported instruction sets.
- Total and currently available system memory.
- GPU vendor, model, acceleration backend, and dedicated/unified memory.
- Free disk space in the application data location.
- Power context when reliably available.

Hardware assessment is local. Raw hardware data is not transmitted unless the user explicitly exports a diagnostic report.

### Compatibility and Recommendation Engine

Reads a signed model catalog bundled with the application and optionally refreshes it online. It filters incompatible entries, estimates memory requirements, ranks viable configurations, and returns one recommended option plus advanced alternatives.

### Download and Model Manager

- Supports resumable downloads.
- Displays exact download and installed sizes.
- Verifies a cryptographic checksum before activation.
- Downloads to a temporary partial file and activates atomically.
- Detects insufficient storage before downloading.
- Removes incomplete downloads safely.
- Supports model update and uninstall.

### Runtime Supervisor

- Selects the proper llama.cpp executable/backend.
- Starts inference with bounded context and memory settings.
- Performs readiness and health checks.
- Streams tokens to the UI.
- Cancels generation promptly.
- Captures sanitized diagnostic logs.
- Restarts after a crash with a strict retry limit.
- Falls back to a safer configuration when acceleration fails.

### Local Data Store

Use SQLite for profiles, settings, conversations, and messages. Store downloaded models as files under the platform application-data directory. Use operating-system credential storage for cloud provider API keys: Windows Credential Manager and macOS Keychain.

## 6. First-Launch Experience

1. Show the product's local-first promise and explain that setup requires a model download.
2. Run device assessment and display progress without exposing unnecessary technical detail.
3. Select the recommended model configuration.
4. Present model name, approximate capability, download size, required free space, expected speed tier, and privacy statement.
5. Offer **Install recommended model** as the primary action and **Advanced options** as a secondary action.
6. Download with pause, resume, retry, and cancellation support.
7. Verify the model checksum and run a short local health check.
8. Ask for optional profile information.
9. Create a starter system profile and open a new chat.

If no supported model can run safely, the app explains the limiting resource and offers smaller compatible models when available. It must not silently install a configuration likely to make the device unusable.

## 7. User Profile and Personalization

All onboarding fields are optional:

- Preferred name.
- Pronouns.
- Occupation or primary use.
- Preferred response style.
- Interests or recurring topics.
- Custom instructions.

The profile is stored locally and injected into the local system prompt. The user can view, edit, disable, or delete it at any time. Profile data is not automatically sent to optional cloud providers; each provider connection must explain what context will be shared.

## 8. Hardware Tiers and Model Selection

The recommendation engine must use explicit catalog metadata rather than guessing from a model filename. Each catalog entry includes model identity, license, source URL, checksum, file size, quantization, estimated working memory by context size, supported runtime version, and minimum backend requirements.

Initial conservative tiers:

| Tier | Usable memory guideline | Default class | Intended result |
|---|---:|---|---|
| Limited | 8 GB system RAM | 1B–3B, efficient quantization | Basic chat with a modest context |
| Standard | 16 GB RAM or equivalent usable unified memory | 7B–8B, efficient quantization | General-purpose local assistant |
| Performance | 24–32 GB usable memory/VRAM | 12B–14B class | Better reasoning and writing |
| High-end | 48 GB+ usable memory/VRAM | Larger validated model | Higher quality at lower speed |

These are catalog policy defaults, not hard-coded model names. The catalog can evolve without an application release.

Selection must reserve memory for the OS and application. The engine considers model weights, key/value cache at the selected context length, runtime overhead, and a safety margin. It chooses CPU/GPU layer placement based on validated backend capabilities. When uncertain, it selects the smaller configuration.

## 9. Chat Experience

The MVP chat interface includes:

- New, rename, delete, and search conversations.
- Markdown and code rendering.
- Streaming tokens and a visible generation state.
- Stop and regenerate controls.
- Copy message and edit-and-resubmit.
- Model and context indicator.
- Clear disclosure of whether a response is local or cloud-generated.
- Basic text-file attachment support with explicit context-size feedback.

The UI must remain responsive while inference runs. Closing a chat cancels active generation only when the user chooses to do so; navigating between conversations does not corrupt the stream or message state.

## 10. Offline and Online Behavior

### Offline

After setup, local chat, profile management, conversation history, model switching, and diagnostics work without internet. The app detects connectivity but does not block local actions while offline.

### Online

Internet access is used only for user-initiated or clearly disclosed functions:

- Downloading models and signed catalog updates.
- Checking for application/runtime updates.
- Optional web features added in a later phase.
- Optional cloud providers configured by the user.

Provider integrations are adapters behind a common chat interface. A provider is disabled until the user supplies credentials and enables it. The composer and message header visibly identify the active provider. Falling back from local to cloud must never happen automatically.

## 11. Privacy and Security Requirements

- No account is required for local use.
- No telemetry is enabled by default.
- Prompts, responses, profiles, and conversation metadata remain local unless the user deliberately invokes an online feature.
- Cloud API keys are stored in the OS credential vault, never in SQLite or logs.
- Models and runtime packages require checksum verification; catalogs and update metadata require signature verification.
- Runtime endpoints bind to loopback and require a session secret.
- The renderer cannot access Node.js directly, execute arbitrary shell commands, or access arbitrary filesystem paths.
- Logs redact prompts, profile data, API keys, authorization headers, and file contents.
- Users can delete one conversation, all conversations, their profile, a model, or all application data.
- Imported text is treated as untrusted content, not as system instructions.

## 12. Data Model

Core records:

- `AppSettings`: theme, language, active model, context preference, update policy, and online-feature toggles.
- `UserProfile`: optional identity and response preferences.
- `DeviceProfile`: latest local assessment and assessment timestamp.
- `ModelInstallation`: catalog ID, local path, checksum, runtime compatibility, state, and timestamps.
- `Conversation`: ID, title, selected backend, created time, and updated time.
- `Message`: conversation ID, role, content, status, backend provenance, token estimate, and timestamps.
- `ProviderConnection`: provider type, non-secret configuration, enabled state, and credential-vault reference.

Database migrations are versioned and transactional. Conversation deletion removes associated messages. Full data deletion stops the runtime first and requires explicit confirmation.

## 13. Failure Handling and Recovery

- **Assessment failure:** retain the diagnostic reason and offer conservative CPU mode.
- **Insufficient disk:** show required and available space before any download.
- **Interrupted download:** keep a verified partial file and resume later.
- **Checksum mismatch:** quarantine and remove the invalid artifact, then offer retry.
- **Runtime startup failure:** retry once, then fall back to a safer backend or reduced context.
- **Out of memory:** cancel generation, preserve the conversation, lower context/GPU allocation, and explain the adjustment.
- **Model removed externally:** mark the installation missing and offer repair.
- **Database migration failure:** preserve the original database and open recovery guidance rather than overwriting data.
- **Offline provider request:** keep the draft, explain connectivity is unavailable, and offer local execution.

Errors shown to users include a concise explanation and a concrete recovery action. Detailed diagnostics remain locally exportable.

## 14. Updates

Application, runtime, model catalog, and model files have independent versions. Updates never replace a working model until the new artifact is fully downloaded and verified. Application updates use signed platform packages. Automatic model replacement is disabled by default because downloads are large and behavior may change.

## 15. Packaging and Platform Considerations

### Windows

- Signed x64 installer initially; ARM64 may follow after runtime validation.
- Detect NVIDIA, AMD, and Intel adapters and validated backends.
- Store application data under the standard per-user application-data location.
- Avoid requiring administrator privileges for normal installation where feasible.

### macOS

- Signed and notarized universal application where practical.
- Prioritize Apple Silicon with Metal acceleration.
- Provide a CPU-compatible path for supported Intel Macs only if performance validation passes.
- Store application data under the standard Application Support directory.

The build pipeline must produce runtime manifests and checksums per operating system and architecture.

## 16. Internal Interfaces

Keep components independently testable through narrow interfaces:

- `DeviceProfiler.assess() -> Promise<DeviceProfile>`
- `RecommendationEngine.recommend(profile, catalog) -> RecommendationResult`
- `ModelManager.install(modelId, progress, cancellation) -> ModelInstallation`
- `RuntimeSupervisor.start(configuration) -> RuntimeSession`
- `ChatBackend.stream(request, cancellation) -> token stream`
- `ProfileStore.get/update/delete()`
- `ConversationStore.create/append/list/search/delete()`
- `CredentialStore.set/get/delete(providerId)`

Both `LocalChatBackend` and future `CloudChatBackend` implementations conform to `ChatBackend`. The UI does not communicate directly with llama.cpp or cloud APIs.

## 17. Testing Strategy

### Automated tests

- Unit tests for hardware normalization, memory estimation, recommendation ranking, catalog validation, and error mapping.
- Contract tests for backend adapters and data repositories.
- Integration tests using a tiny test model for runtime startup, streaming, cancellation, and recovery.
- Download tests for resume, cancellation, checksum failure, and insufficient disk.
- Database migration and deletion tests.
- UI tests for onboarding, chat, settings, and offline transitions.
- Security tests confirming loopback binding, command allowlists, secret redaction, and credential-vault usage.

### Platform verification

Maintain a hardware matrix covering representative Windows CPU-only, Windows NVIDIA, Windows AMD/Intel, Apple Silicon, and supported Intel Mac systems. Release candidates must complete installation, first response, cancellation, restart, offline launch, and uninstall checks on the applicable matrix.

## 18. Delivery Phases

### Phase 1 — Vertical local-chat foundation

Build the Electron shell, one bundled runtime target per platform, manual installation of one tiny development model, streaming chat, and local conversation storage. This proves end-to-end inference before building automation.

### Phase 2 — Device-aware onboarding

Add device profiling, the signed catalog schema, recommendation rules, resumable downloads, verification, model management, and runtime fallback.

### Phase 3 — Product hardening

Add profile onboarding, advanced model choices, diagnostics, recovery flows, security controls, signed Windows/macOS packaging, and the hardware test matrix.

### Phase 4 — Optional online capabilities

Add provider adapters and later web-assisted tools. Each integration requires explicit activation, secure credentials, visible provenance, and no automatic local-to-cloud fallback.

## 19. MVP Acceptance Criteria

The MVP is ready when:

1. A new user can install the signed app on supported Windows and macOS systems without using a terminal.
2. First launch assesses the device and recommends a compatible configuration.
3. The user can see download/storage implications before accepting installation.
4. A canceled or interrupted model download can resume safely.
5. A verified model starts and produces a streamed response locally.
6. The app relaunches and supports local chat with networking disabled.
7. Conversations and optional profile information persist locally and can be deleted.
8. Unsupported or memory-constrained devices receive a useful explanation instead of a crash.
9. The runtime is inaccessible from other devices on the network.
10. Cloud services are absent from the critical path and cannot activate without explicit configuration.

## 20. Decisions and Assumptions

- The product is a desktop application with a web-technology interface, not a website capable of silently installing native software.
- Windows and macOS are equal product targets, but the first engineering slice may validate one runtime configuration on each before expanding the hardware matrix.
- Initial model support is restricted to curated GGUF models compatible with the shipped llama.cpp version.
- Local inference is the default and never incurs token fees; internet and electricity costs remain outside the product's control.
- The initial setup normally requires internet access to download a model. A later offline-import workflow may support pre-downloaded verified model packages.
- Model licenses and redistribution terms must be reviewed before any model is included in the catalog.
- User profile fields are optional and local-only by default.
- No automatic cloud fallback is permitted.

## 21. Immediate Next Step

Create a separate implementation plan for **Phase 1 — Vertical local-chat foundation**. Keeping the first implementation slice narrow will validate packaging, local inference, streaming, cancellation, and persistence before the more variable hardware-detection and automatic-installation work begins.
