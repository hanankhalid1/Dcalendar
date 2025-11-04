## Repo snapshot for AI agents

- Project: React Native mobile app (TypeScript). Root files: `App.tsx`, `package.json`, `tsconfig.json`.
- Source: `src/` (components/, screens/, services/, abis/, stores/, hooks/, types/).
- Native folders: `android/` and `ios/` with native modules and frameworks (see `ios/MobileApps.xcframework`, `ios/WalletModule.*`).

## Quick developer workflows (what to run)

- Install and start Metro (JS):
  - yarn install
  - yarn start

- Android local build/install (Windows PowerShell):
  - cd android
  - .\gradlew.bat clean
  - .\gradlew.bat app:installDebug -PreactNativeDevServerPort=8081
  - If build fails, re-run with `--stacktrace` or `--info` for details.

- iOS (macOS):
  - cd ios
  - pod install
  - Open workspace `Dcalendar.xcworkspace` in Xcode and build.

- Tests: Jest is configured; run `yarn test` (see `jest.config.js`).

## Architecture and important boundaries

- UI layer: `src/components/` and `src/screens/` — reusable components and screen containers.
- Data & services: `src/services/` contains API/blockchain callers; `src/abis/` holds contract ABIs and generated wrappers used by blockchain services.
- State: `src/stores/` holds app state (pattern: centralized stores, not Redux). Look for usages in components.
- Native integration:
  - Android: native modules (autolinked) live under `node_modules/.../android` and are referenced in `android/settings.gradle` (e.g. `react-native-reanimated`).
  - iOS: native code in `ios/` including `WalletModule.m/.swift` and `MobileApps.xcframework`.

## Project-specific patterns and conventions

- TypeScript-first: many files are `.tsx`/`.ts` and `tsconfig.json` exists — prefer types when adding code.
- Native code and codegen: the project uses libraries that generate JNI/CMake artifacts (see `android/build/generated/autolinking/autolinking.json` and `android/app/.cxx`). When changing native modules, expect native rebuilds.
- Babel plugin: `babel.config.js` includes `react-native-reanimated/plugin` — keep this plugin as first in the plugin list when editing Babel config.
  - See: `babel.config.js` contains `'react-native-reanimated/plugin'`.
- ABI & blockchain artifacts: `src/abis/` contains JSON and helper JS wrappers — modify these only if you understand the smart contract schema used by `src/services/` and `config/blockchain.ts`.

## Integration points and external dependencies to watch

- react-native-reanimated (native): declared in `package.json` as `"react-native-reanimated": "^4.1.0"`. It is autolinked in `android/settings.gradle` and produces native CMake/JNI files (see `autolinking/autolinking.json`).
  - Symptom to watch: Android build errors mentioning tasks like `externalNativeBuildDebug` or missing tasks in `:react-native-reanimated` / `:react-native-worklets`. These normally indicate native build configuration or NDK/CMake mismatches.
  - Practical checks: ensure Android NDK is installed and compatible, and run Gradle with `--stacktrace` to get the failing module name. Example: `cd android; .\gradlew.bat app:installDebug --stacktrace`.

- Native frameworks on iOS: `ios/MobileApps.xcframework` is bundled; when updating iOS builds ensure the framework path and Swift bridging headers are intact (`Dcalendar-Bridging-Header.h`).

## Troubleshooting Android native build failures (concrete, repo-derived steps)

1. Confirm the native dependency is declared and autolinked:
   - Check `android/settings.gradle` includes `project(':react-native-reanimated')` and that the path points to `../node_modules/react-native-reanimated/android`.
2. Clean Gradle and rebuild with stacktrace:
   - `cd android; .\gradlew.bat clean; .\gradlew.bat app:installDebug --stacktrace`
3. If error mentions missing `externalNativeBuildDebug` for a module:
   - Open `android/build/generated/autolinking/autolinking.json` and confirm the `cmakeListsPath` or `sourceDir` entries exist for that module (this repo has entries for rn-reanimated codegen + CMakeLists).
   - Ensure an Android NDK is installed and referenced by your local SDK (NDK version can matter; check `android/app/.cxx` presence). If missing, install via Android SDK Manager.
4. As a quick workaround, try removing build caches and node modules, then reinstall:
   - From repo root: delete `node_modules`, `android/.gradle`, `android/app/build`, then `yarn install`, then rebuild.

## Files you will likely edit or inspect for major tasks

- `package.json` — dependency versions and scripts
- `babel.config.js` — confirm `react-native-reanimated/plugin` placement
- `android/settings.gradle` and `android/app/build.gradle` — native linking and Gradle config
- `android/build/generated/autolinking/autolinking.json` — verify autolinking metadata for native modules
- `src/abis/` and `src/services/` — blockchain integration points
- `ios/WalletModule.*` and `ios/MobileApps.xcframework` — iOS native integration

## Examples from this repo (copy-paste friendly)

- `package.json` snippet (dependency):
  - "react-native-reanimated": "^4.1.0"

- Babel plugin (in `babel.config.js`):
  - 'react-native-reanimated/plugin'

- Android settings include (in `android/settings.gradle`):
  - project(':react-native-reanimated').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-reanimated/android')

## What I should NOT do (rules for an AI agent)

- Do not change blockchain ABI files or smart-contract-related code without a corresponding contract version note — those are tightly coupled to on-chain contracts.
- Avoid modifying native Gradle or Xcode project settings unless the change is small and validated; these are brittle and platform-specific.

## Quick asks for the developer (if you need more clarity)

- Confirm the intended React Native version and target Android NDK version for CI reproducibility.
- Point out any additional developer scripts (custom yarn scripts or CI steps) you want surfaced here.

If you'd like, I can iterate the file to add CI-specific instructions or expand the Android/iOS troubleshooting with exact failing logs you paste here.
<!-- Copied guidance for AI code agents tailored to the Dcalendar React Native app -->
# Copilot instructions for the Dcalendar mobile repo

This file gives focused, actionable information for AI code agents working on this repository. Keep guidance concise and reference concrete files.

1) Big-picture architecture (what to know first)
- Entry point: `App.tsx` — sets up navigation (`src/navigations/AppNavigation`), `ToastProvider` (`src/hooks/useToast`) and safe-area wrappers.
- UI: `src/components/` contains reusable pieces (e.g. `CalendarHeader.tsx`, `EventCard.tsx`, `CreateEventModal.tsx`). Screens live under `src/screens/`.
- Navigation: Drawer + stack configured in `src/navigations/` (see `DrawerNavigation.tsx`, `CustomDrawer.tsx`).
- State & persistence: lightweight local state with `zustand` (dependency) and local storage via `@react-native-async-storage/async-storage`, `react-native-encrypted-storage`, and `dexie` for indexed storage.
- Blockchain integrations: smart contract ABIs and helpers live in `src/abis/` and config in `src/config/blockchain.ts` — use these for on-chain interactions (see `necjs`, `ethers` in `package.json`).

2) Build, run, test (concrete commands)
- Use yarn (project expects Yarn v1). Key npm scripts in `package.json`:
  - `yarn android` -> `react-native run-android`
  - `yarn ios` -> `react-native run-ios` (macOS only)
  - `yarn start` -> Metro bundler
  - `yarn test` -> `jest`
  - `yarn lint` -> `eslint .`
  - `yarn pod` -> `cd ios && pod install && cd ..` (run after changing native iOS deps)
  - `yarn clean` -> cleans Android build via gradle

3) Project-specific patterns & gotchas
- Babel / Reanimated: `babel.config.js` includes `'react-native-reanimated/plugin'`. That plugin must be last in the plugin list and Reanimated requires the plugin enabled when using worklets. If adding other babel plugins, keep `react-native-reanimated/plugin` last.
- TypeScript: config extends `@react-native/typescript-config` in `tsconfig.json`. Files use `.ts/.tsx` and JSX is `react-jsx`.
- Native modules & iOS bridging: there are iOS native files (`ios/WalletModule.m`, `WalletModule.swift`) and an `xcframework` in `MobileApps.xcframework` — be careful to run `pod install` after changing native iOS code.
- ABI / blockchain pattern: Contract ABIs are under `src/abis/` (e.g., `CalendarsAbi.json`, `UserContractAbi.json`) and JS wrappers exist (`src/abis/*.js`). Match ABI changes to any adapted helper code in `src/abis/index.ts`.
- State: project uses `zustand` for cross-component state. Search for `create` imports from `zustand` when changing global state.

4) Integrations & external dependencies
- Wallet / blockchain: `ethers`, `necjs` and local ABI files. Changes to on-chain calls often need both JS and ABI updates.
- File & native features: `react-native-fs`, `react-native-blob-util`, and `react-native-share` are used — tests or code edits that touch file I/O should consider platform file paths and permissions.
- Calendar UI: multiple calendar packages are used (`react-native-calendars`, `react-native-big-calendar`, `react-native-week-view`) — when changing calendar UI, check which component is used by the specific screen (`MonthlyCalendar.tsx`, `WeekHeader.tsx`, etc.).

5) Editing guidelines for agents (how to make safe changes)
- Small, focused PRs. When changing a cross-cutting area (navigation, app entry, native integrations), list required manual steps (e.g., `pod install`, Android rebuild).
- Update `package.json` scripts only when necessary and keep `node` engine >=20 alignment.
- When adding native deps (iOS pods / Android gradle): include exact install steps in PR description and mark builds to run on both platforms.
- Keep `react-native-reanimated/plugin` last in `babel.config.js` after edits.

6) Quick file references (examples to open)
- App entry: `App.tsx`
- Navigation: `src/navigations/AppNavigation.tsx`, `src/navigations/DrawerNavigation.tsx`
- Key components: `src/components/CreateEventModal.tsx`, `src/components/EventCard.tsx`, `src/components/CalendarComponent.tsx`
- Blockchain & ABIs: `src/abis/`, `src/config/blockchain.ts`
- Hooks / providers: `src/hooks/useToast.tsx`, `src/hooks/*`

7) Tests & linting
- Unit tests: `__tests__/` (Jest). Run `yarn test`.
- Linting: `yarn lint` (eslint). Follow existing code style and TypeScript typings in `types/`.

8) When you are unsure
- Prefer small changes and point to the file(s) you edited in the PR. If native changes are included, request a manual verification on both platforms.

If anything here is unclear or some repository-specific pattern is missing, tell me which area you want expanded (navigation, blockchain ABI flow, native build steps, or calendar UI internals) and I will refine this file.
