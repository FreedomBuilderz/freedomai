# Local AI Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a desktop-ready vertical slice with a tested local chat domain, streaming UI, persistent conversations, and a native-runtime boundary that can later supervise llama.cpp.

**Architecture:** A React/TypeScript interface is organized around framework-independent domain services. Electron supplies the Windows/macOS native shell and Node.js main-process services; during browser development, an explicit fake backend exercises the same typed streaming contract. SQLite and llama.cpp are introduced only after their boundaries are proven through tests.

**Tech Stack:** Node.js 24+, Electron, React 19, TypeScript 5, Vite, Vitest, Testing Library, SQLite, llama.cpp HTTP server

**Spec:** `docs/superpowers/specs/2026-09-07-local-ai-desktop-assistant-design.md`

## Global Constraints

- Target Windows 10/11 and macOS 13+.
- Local inference is the default; cloud fallback is never automatic.
- The runtime binds to `127.0.0.1` and requires a random per-session secret.
- No account or telemetry is required for local use.
- Profiles, prompts, responses, and conversations remain local unless the user explicitly invokes an online provider.
- Cloud secrets use Windows Credential Manager or macOS Keychain, never SQLite or logs.
- User-visible output identifies whether it was produced locally or by a cloud provider.
- Development may proceed without Git commits until the user initializes the repository.

## File Map

- `package.json`: frontend scripts and dependencies.
- `vite.config.ts`, `tsconfig*.json`, `index.html`: Vite and TypeScript configuration.
- `src/main.tsx`: browser entry point.
- `src/app/App.tsx`: top-level composition and view routing.
- `src/app/App.test.tsx`: user-facing shell tests.
- `src/styles/app.css`: responsive visual system.
- `src/chat/types.ts`: shared chat entities and backend contract.
- `src/chat/fake-local-backend.ts`: deterministic development streaming backend.
- `src/chat/fake-local-backend.test.ts`: contract and cancellation tests.
- `src/chat/conversation-store.ts`: local conversation persistence boundary.
- `src/chat/conversation-store.test.ts`: persistence behavior tests.
- `src/chat/use-chat.ts`: chat state and streaming orchestration.
- `src/chat/ChatWorkspace.tsx`: conversation list, transcript, and composer.
- `src/onboarding/types.ts`: device and setup state contracts.
- `src/onboarding/recommendation.ts`: conservative model selection logic.
- `src/onboarding/recommendation.test.ts`: recommendation tests.
- `src/onboarding/Onboarding.tsx`: assessment and recommended-install UI.
- `src/settings/Settings.tsx`: local-model and optional-provider settings shell.
- `electron/main.ts`: Electron main process and secure window creation.
- `electron/preload.ts`: narrow context-isolated renderer bridge.
- `electron/window-options.ts`: independently tested BrowserWindow security policy.
- `electron/device.ts`: normalized Node.js device assessment.
- `electron/runtime.ts`: llama.cpp process boundary and loopback configuration.
- `electron/storage.ts`: application-data paths and SQLite initialization.
- `electron/*.test.ts`: main-process policy and service tests.

---

### Task 1: Frontend Foundation and Local Chat Contract

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/chat/types.ts`
- Create: `src/chat/fake-local-backend.test.ts`
- Create: `src/chat/fake-local-backend.ts`

**Interfaces:**
- Produces: `ChatBackend.stream(request, signal): AsyncIterable<ChatChunk>`
- Produces: `ChatMessage`, `ChatRequest`, `ChatChunk`, and `BackendIdentity` types.

- [x] **Step 1: Add project and test configuration**

Define scripts `dev`, `build`, `test`, and `test:watch`. Configure Vitest with `jsdom`, globals, and a test setup file. Install React, TypeScript, Vite, Vitest, Testing Library, and jsdom.

- [x] **Step 2: Write the failing backend contract tests**

Test that the fake local backend yields ordered chunks with `{ provenance: "local" }`, combines to the expected response, and throws an `AbortError` after cancellation.

- [x] **Step 3: Run the targeted test and verify RED**

Run: `npm test -- src/chat/fake-local-backend.test.ts --run`  
Expected: FAIL because `FakeLocalBackend` does not exist.

- [x] **Step 4: Implement the minimal chat types and fake backend**

Implement an async generator that tokenizes a deterministic response, checks `AbortSignal` before each yield, and exposes a local backend identity.

- [x] **Step 5: Run tests and verify GREEN**

Run: `npm test -- src/chat/fake-local-backend.test.ts --run`  
Expected: all contract tests PASS with no warnings.

### Task 2: Conversation Persistence

**Files:**
- Create: `src/chat/conversation-store.test.ts`
- Create: `src/chat/conversation-store.ts`

**Interfaces:**
- Consumes: `ChatMessage` from `src/chat/types.ts`.
- Produces: `Conversation`, `ConversationStore`, and `LocalConversationStore` with `list`, `get`, `create`, `append`, `rename`, and `delete` methods.

- [x] **Step 1: Write failing persistence tests**

Test creation, chronological listing, append persistence after store reconstruction, rename, deletion, and recovery from malformed stored JSON using a real in-memory `Storage` implementation.

- [x] **Step 2: Verify RED**

Run: `npm test -- src/chat/conversation-store.test.ts --run`  
Expected: FAIL because the store module does not exist.

- [x] **Step 3: Implement the storage boundary**

Serialize a versioned envelope under `freedombuild.conversations.v1`. Validate parsed records, return an empty collection for malformed input, and write after every mutation.

- [x] **Step 4: Verify GREEN**

Run: `npm test -- src/chat/conversation-store.test.ts --run`  
Expected: all persistence tests PASS.

### Task 3: Streaming Chat Interface

**Files:**
- Create: `src/test/setup.ts`
- Create: `src/app/App.test.tsx`
- Create: `src/app/App.tsx`
- Create: `src/chat/use-chat.ts`
- Create: `src/chat/ChatWorkspace.tsx`
- Create: `src/styles/app.css`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `ChatBackend` and `ConversationStore`.
- Produces: a responsive chat shell supporting send, stream, stop, new conversation, selection, and local provenance.

- [ ] **Step 1: Write failing UI tests**

Render `App` with the fake backend and memory storage. Assert the empty state, send a prompt, observe streamed local output, stop an active response, create a conversation, and restore a saved conversation after remount.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/app/App.test.tsx --run`  
Expected: FAIL because `App` and chat UI modules do not exist.

- [ ] **Step 3: Implement chat orchestration and UI**

Implement one streaming request at a time, immutable message updates, cancellation via `AbortController`, disabled empty submission, accessible controls, and persistent updates after each completed response.

- [ ] **Step 4: Add the visual system**

Create a desktop-first three-region layout with a compact sidebar, readable transcript column, anchored composer, dark/light system theme, responsive mobile collapse, visible focus states, and reduced-motion support.

- [ ] **Step 5: Verify GREEN and build**

Run: `npm test -- --run`  
Expected: all frontend tests PASS.  
Run: `npm run build`  
Expected: TypeScript and Vite build complete without errors.

### Task 4: Hardware Recommendation Domain

**Files:**
- Create: `src/onboarding/types.ts`
- Create: `src/onboarding/recommendation.test.ts`
- Create: `src/onboarding/recommendation.ts`
- Create: `src/onboarding/Onboarding.tsx`

**Interfaces:**
- Produces: `DeviceProfile`, `ModelCatalogEntry`, `Recommendation`, and `recommendModel(profile, catalog)`.
- Produces: onboarding states `welcome`, `assessing`, `recommendation`, `installing`, `profile`, `ready`, and `error`.

- [ ] **Step 1: Write failing recommendation tests**

Cover limited, standard, performance, and high-end memory profiles; insufficient disk; unsupported acceleration with CPU fallback; and preference for the smallest capable model when scores tie.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/onboarding/recommendation.test.ts --run`  
Expected: FAIL because `recommendModel` does not exist.

- [ ] **Step 3: Implement conservative recommendation rules**

Reject models whose file plus reserve exceeds free disk, or whose estimated working memory exceeds usable memory after the OS safety reserve. Rank remaining entries by capability tier, validated acceleration, and smaller footprint.

- [ ] **Step 4: Build the onboarding state UI**

Show the local-first promise, assessment progress, one recommended model with size/performance disclosure, primary install action, advanced-options action, and actionable error states. Keep actual native assessment and download behind injected commands.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- --run`  
Expected: all frontend tests PASS.

### Task 5: Electron Native Shell and Secure Runtime Boundary

**Files:**
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `electron/window-options.ts`
- Create: `electron/window-options.test.ts`
- Create: `electron/device.ts`
- Create: `electron/device.test.ts`
- Create: `electron/runtime.ts`
- Create: `electron/runtime.test.ts`
- Create: `electron/storage.ts`

**Interfaces:**
- Produces preload API `desktop.assessDevice() -> Promise<DeviceProfile>`.
- Produces preload APIs `desktop.startRuntime(config)`, `desktop.runtimeHealth(sessionId)`, and `desktop.stopRuntime(sessionId)`.
- Produces application-data resolution and SQLite initialization.

- [ ] **Step 1: Install Electron dependencies**

Install Electron, electron-builder, tsx, concurrently, and wait-on. Add `desktop:dev`, `desktop:build`, and packaging scripts and verify `npx electron --version`.

- [ ] **Step 2: Write failing Node.js desktop tests**

Test that BrowserWindow preferences disable Node integration, enable context isolation and sandboxing, and reject unexpected navigation. Test that runtime configuration rejects non-loopback hosts, missing secrets, invalid ports, and executable paths outside the managed runtime directory.

- [ ] **Step 3: Verify RED**

Run: `npm test -- electron --run`  
Expected: FAIL because desktop modules are not implemented.

- [ ] **Step 4: Implement the minimal Electron shell**

Create a sandboxed BrowserWindow, context-isolated preload bridge, allowlisted IPC handlers, and serializable domain types. Implement host-level CPU/RAM/OS assessment and secure runtime configuration validation. Keep GPU discovery behind a platform adapter so Windows and macOS implementations can be expanded independently.

- [ ] **Step 5: Add process supervision boundary**

Generate a random session secret, force loopback binding, spawn only a managed executable, capture sanitized logs, perform a bounded readiness check, and kill the child process on explicit stop or application exit.

- [ ] **Step 6: Verify GREEN and package checks**

Run: `npm test -- electron --run`  
Expected: all desktop tests PASS.  
Run: `npm run desktop:build`  
Expected: Electron main, preload, and renderer bundles compile without errors.

### Task 6: Vertical-Slice Verification

**Files:**
- Create: `docs/testing/hardware-matrix.md`
- Create: `docs/testing/manual-smoke-test.md`

**Interfaces:**
- Consumes all prior tasks.
- Produces a reproducible release-candidate verification checklist.

- [ ] **Step 1: Run automated verification**

Run `npm test -- --run`, `npm run build`, and `npm run desktop:build`. Record exact tool versions and results.

- [ ] **Step 2: Execute the smoke test**

Verify launch, new chat, streaming response, cancellation, conversation restoration, offline relaunch, runtime loopback binding, and clean application shutdown.

- [ ] **Step 3: Document the initial matrix**

Record OS version, architecture, CPU, RAM, GPU, acceleration backend, runtime result, approximate first-token latency, and known limitations for every tested machine.

- [ ] **Step 4: Confirm Phase 1 exit criteria**

Phase 1 exits only when one Windows configuration and one macOS configuration have produced a local streamed response through the same frontend contract, and all automated checks pass.
