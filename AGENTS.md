# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build & Test

```bash
pnpm run build        # Build with tsdown (outputs to dist/)
pnpm run test         # Run vitest tests
pnpm run typecheck    # TypeScript type checking
```

### Code Quality

```bash
pnpm run lint         # ESLint with auto-fix
pnpm run format       # Biome formatting
pnpm run format:check # Check formatting (CI mode)
```

### Package Management

```bash
pnpm run prepublishOnly  # Auto-runs before publishing (builds)
pnpm run pkg-pr-new      # Create preview package PR
```

## Architecture Overview

### Core Plugin Structure

- **Main entry**: `src/index.ts` - Creates unplugin instance using `createUnplugin`
- **Options handling**: `src/core/options.ts` - Type definitions and option resolution
- **Platform adapters**: `src/{vite,webpack,rollup,esbuild,rspack,farm,rolldown}.ts` - Platform-specific exports

### Plugin Functionality

The plugin processes files containing `import.meta` and transforms them:

- **Filter**: Only processes files with `import.meta` in code content
- **Include/Exclude**: Configurable file patterns (defaults to JS/TS files, excludes node_modules)
- **Transform**: Currently returns empty string (placeholder implementation)

### Build System

- **tsdown**: Modern TypeScript bundler for ESM-only output
- **Vitest**: Testing framework with typecheck enabled
- **Biome**: Formatting (ESLint disabled in biome.json)
- **ESLint**: Linting with custom rules for import access control

### Testing Strategy

Uses `@sxzz/test-utils` for fixture-based testing:

- Test files in `tests/*.test.ts`
- Fixtures in `tests/fixtures/*.js`
- Platform-specific build testing (rollup example provided)

## Key Configuration Files

### tsdown.config.ts

- ESM-only build with tree-shaking
- Multiple entry points for platform-specific exports
- Dead code elimination and publint validation

### Package Structure

Multi-platform plugin with separate entry points:

```
./                  -> dist/index.js (main)
./vite             -> dist/vite.js
./webpack          -> dist/webpack.js
./rollup           -> dist/rollup.js
# ... other platforms
```

## Development Notes

- Node.js >=20.19.0 required
- Uses pnpm for package management
- ESM-only codebase
- Follows unplugin conventions for universal bundler support
