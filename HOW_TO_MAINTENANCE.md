# Bot WhatsApp Maintenance Guide

## Tech Stack

This WhatsApp bot is built with the following technologies:

- **Baileys**: WhatsApp Web API library from [naruyaizumi/baileys](https://github.com/naruyaizumi/baileys)
- **Bun**: Fast JavaScript/TypeScript runtime
- **TypeScript**: All code is written in TypeScript (`.ts` files)
- **Multi-file Auth**: Baileys `useMultiFileAuthState` for session management
- **Pino Logger**: Used by Baileys internally

---

## Project Structure

```
botwa/
├── index.ts                    # Startup entry point (initialization only)
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── .gitignore                  # Git ignore rules
│
├── src/
│   ├── bot.ts                  # Main bot logic (connection, handlers, events)
│   ├── config/
│   │   └── config.ts           # Bot configuration (number, prefix, settings)
│   ├── library/
│   │   ├── index.ts            # Library exports
│   │   ├── logger.ts           # Console + file logger
│   │   ├── file-logger.ts      # Log rotation with .tar.gz compression
│   │   ├── converter.ts        # String/utility converters
│   │   ├── functions.ts        # Helper functions (isOwner, isGroup, etc.)
│   │   └── database.ts         # Simple JSON-based database
│   ├── modules/
│   │   ├── index.ts            # Module exports
│   │   ├── plugin-loader.ts    # Dynamic plugin loading system
│   │   ├── message-handler.ts  # Message processing with typing indicator
│   │   └── lid-resolver.ts     # LID-to-PN resolver (native, no patch)
│   ├── plugins/                # Command plugins (add .ts files here)
│   │   ├── ping.ts             # Ping command with reactions
│   │   ├── menu.ts             # Bot menu display
│   │   ├── say.ts              # Echo/repeat command
│   │   ├── uppercase.ts        # Text converter
│   │   └── status.ts           # Bot status (owner only)
│   └── types/
│       └── index.ts            # Shared TypeScript types
│
├── logs/                       # Auto-rotating logs
│   ├── latest.log              # Current active log
│   └── log-YYYY-MM-DD.tar.gz  # Compressed old logs
│
├── auth_session/               # Baileys multi-file auth (auto-created)
│   └── ...
│
└── HOW_TO_MAINTENANCE.md       # This file
```

---

## Entry Point Architecture

**`index.ts`** is ONLY for startup:
- Initialize file logger
- Load plugins
- Call `startBot()` from `src/bot.ts`

**`src/bot.ts`** handles ALL bot logic:
- Socket creation
- Connection management (pairing code, reconnect)
- Message handler setup
- Auto-read messages
- Message logging

---

## Configuration

Edit `src/config/config.ts` to configure:

| Setting | Description | Default |
|---------|-------------|---------|
| `botNumber` | Bot phone number for pairing | `""` |
| `ownerNumber` | Array of owner numbers | `["6281234567890"]` |
| `prefix` | Command prefixes | `[".", "!", "#", "/"]` |
| `botName` | Bot display name | `"WhatsApp Bot"` |
| `sessionName` | Auth session directory | `"./auth_session"` |
| `cooldown` | Command cooldown (ms) | `3000` |
| `usePairingCode` | Use pairing code instead of QR | `true` |
| `baileysLogLevel` | Baileys internal log level | `"silent"` |

---

## Authentication

### Pairing Code Mode

1. Set `botNumber` in `src/config/config.ts`
2. Set `usePairingCode: true`
3. Run `bun run index.ts`
4. Copy the 8-character code from terminal
5. Open WhatsApp > Linked Devices > Link with Pairing Code > enter code

### Session Storage

Uses Baileys `useMultiFileAuthState` — auth files stored in `auth_session/` directory.
**Never commit** this directory to version control.

---

## Plugin System

### Adding New Plugins

Create a new `.ts` file in `src/plugins/`:

```typescript
import type { PluginCommand, MessageData } from "../types/index.js";
import type { WASocket } from "baileys";

async function execute(
  sock: WASocket,
  m: MessageData,
  args: string[]
): Promise<void> {
  // Your command logic here
  await sock.sendMessage(m.from, { text: "Hello!" });
}

export const command: PluginCommand = {
  name: "mycommand",
  alias: ["alias1", "alias2"],
  category: "general",
  description: "My command description",
  usage: ".mycommand",
  isOwner: false,    // true for owner-only commands
  isGroup: false,    // true for group-only commands
  execute,
};
```

Plugins are **auto-loaded** on startup. No registration needed.

### Plugin Execution Flow

1. Message received
2. Auto-read after 500ms delay
3. Parse command from message body
4. If valid plugin found:
   - Show typing indicator (500ms)
   - Stop typing indicator
   - Small gap (200ms)
   - Run validation (owner/group check, cooldown)
   - Execute plugin

---

## Message Logging

### Console Format

```
[GROUP] GroupName User@6281234567890 >> hello
[PRIVATE] User@6281234567890 >> hi
```

### File Logging

- `logs/latest.log` — active log file
- Auto-rotates when file reaches 5MB
- Old logs compressed to `.tar.gz`
- Max 10 archived files kept

---

## LID-to-PN Resolution

Bot uses **native LID-to-PN resolver** (`src/modules/lid-resolver.ts`) that:
- Intercepts message events
- Resolves LID (`@lid`) to phone number (`@s.whatsapp.net`)
- No modifications to node_modules
- Survives `bun install` and dependency updates

---

## Development Guidelines

### 1. TypeScript Only

All code **MUST** be written in TypeScript (`.ts` files). JavaScript (`.js`) files are **NOT allowed** in the source code.

### 2. NO `any` Type Policy

**Strict TypeScript Rule**: The use of `any` type is **STRICTLY PROHIBITED**.

Using `any` violates TypeScript best practices and type safety. Always define proper types, interfaces, or use generics.

#### ❌ Bad (DO NOT DO THIS):
```typescript
function processData(data: any) {
  return data.value;
}

const result: any = {};
```

#### ✅ Good (DO THIS):
```typescript
interface ProcessData {
  value: string;
  id: number;
}

function processData(data: ProcessData): string {
  return data.value;
}

const result: Record<string, unknown> = {};
```

### 3. Allowed Alternatives to `any`

| Use Case              | Instead of `any` | Use                          |
|-----------------------|------------------|------------------------------|
| Unknown data          | `any`            | `unknown`                    |
| Empty object          | `any`            | `Record<string, unknown>`    |
| Function parameters   | `any`            | Define proper interfaces     |
| Dynamic values        | `any`            | Use generics `<T>`           |
| Nullable values       | `any`            | `type \| null` or `type \| undefined` |

### 4. MAX 200 Lines Per File Policy

**Strict Rule**: Every `.ts` file **MUST NOT exceed 200 lines**.

This ensures code is readable, maintainable, and modular. When a file approaches 200 lines, split it into smaller focused modules.

#### How to stay under 200 lines:
- Extract helper functions into separate files
- Group related logic into dedicated modules
- Use barrel exports (`index.ts`) to organize exports
- Split large types into `types/` directory
- Break complex functions into smaller, composable ones

#### ❌ Bad (DO NOT DO THIS):
```
src/library/functions.ts  ← 450 lines of mixed utilities
```

#### ✅ Good (DO THIS):
```
src/library/
├── functions.ts          ← 80 lines (message parsing)
├── converter.ts          ← 70 lines (string utilities)
├── validator.ts          ← 60 lines (input validation)
└── index.ts              ← barrel exports
```

---

## Running the Bot

### Prerequisites

- [Bun](https://bun.sh/) installed on your system

### Commands

```bash
# Install dependencies
bun install

# Format code before running
bun run format

# Run the bot
bun run start
```

---

## Updating Baileys

To update the Baileys library to the latest version:

```bash
# Reinstall from GitHub
bun add github:naruyaizumi/baileys

# Or trust postinstall scripts if blocked
bun pm trust baileys
```

Always test thoroughly after updating dependencies.

---

## Code Quality Checklist

When making changes, ensure:

- [ ] All files are `.ts` (TypeScript)
- [ ] NO `any` type is used anywhere in the codebase
- [ ] Proper interfaces/types are defined for all data structures
- [ ] Code compiles without TypeScript errors
- [ ] All imports are properly typed
- [ ] Return types are explicitly defined (no implicit `any`)
- [ ] No modifications to `node_modules` (use native runtime solutions)
- [ ] Plugins exported as `command` with proper `PluginCommand` type
- [ ] **NO file exceeds 200 lines** (split into modules if needed)

---

## Troubleshooting

### TypeScript Errors with `any`

If you encounter TypeScript errors suggesting the use of `any`, instead:

1. Define a proper interface for the data structure
2. Use `unknown` if the type is truly unknown
3. Use type guards to narrow `unknown` to specific types
4. Use generics for reusable type patterns

### Baileys Type Issues

If Baileys types are missing or incomplete:

1. Check if types are exported properly
2. Create local type definitions that extend Baileys types
3. Contribute type improvements back to the Baileys repository

### Pairing Code Not Appearing

1. Ensure `botNumber` is set in `src/config/config.ts`
2. Ensure `usePairingCode: true`
3. Delete `auth_session/` directory and restart bot
4. Wait for QR to trigger pairing code request

### Session Not Persisting

1. Check `auth_session/` directory exists and is writable
2. Verify `sessionName` config matches actual directory
3. Check `creds.update` event is properly wired

---

## Contributing

When contributing to this project:

1. Follow all TypeScript guidelines above
2. Ensure your code is fully typed
3. Test your changes before submitting
4. Update this document if new patterns or conventions are introduced
5. **Never modify node_modules** — all solutions must be native/runtime-based
ting
4. Update this document if new patterns or conventions are introduced
5. **Never modify node_modules** — all solutions must be native/runtime-based
d

---

## Contributing

When contributing to this project:

1. Follow all TypeScript guidelines above
2. Ensure your code is fully typed
3. Test your changes before submitting
4. Update this document if new patterns or conventions are introduced
5. **Never modify node_modules** — all solutions must be native/runtime-based
ig matches actual directory
3. Check `creds.update` event is properly wired

---

## Contributing

When contributing to this project:

1. Follow all TypeScript guidelines above
2. Ensure your code is fully typed
3. Test your changes before submitting
4. Update this document if new patterns or conventions are introduced
5. **Never modify node_modules** — all solutions must be native/runtime-based
