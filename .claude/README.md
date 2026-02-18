# Claude Code — Security & Code Quality Skills

Portable skills for Claude Code CLI. Copy to any project or deploy globally.

## Structure

```
.claude/
├── CLAUDE.md                        # Main instructions
└── skills/
    ├── software-security/           # Security skill (OWASP/CodeGuard)
    │   ├── SKILL.md
    │   └── rules/codeguard-*.md     # 24 security rule files
    └── code-quality/                # Code quality skill (SOLID/Clean Code)
        └── SKILL.md                 # Single lightweight file
```

## Skills

| Skill | Purpose | Invocation |
|-------|---------|------------|
| `software-security` | Secure code writing & review (OWASP, CodeGuard) | Activated on security reviews, code writing |
| `code-quality` | SOLID principles, dead code, code smells, clean code | Activated on code writing, PR reviews, refactoring |

## Deploy Globally (All Projects)

Global deployment makes these skills available in **every** project without copying per-repo.

### macOS / Linux

1. **Find your home directory:**
   ```bash
   echo $HOME
   # Typically: /Users/yourname (macOS) or /home/yourname (Linux)
   ```

2. **Check if `~/.claude` already exists:**
   ```bash
   ls -la ~/.claude
   ```

3. **Copy the skills folder:**
   ```bash
   # If ~/.claude does NOT exist yet
   cp -r .claude ~/

   # If ~/.claude already exists, merge skills into it
   cp -r .claude/skills ~/.claude/
   cp .claude/CLAUDE.md ~/.claude/CLAUDE.md
   ```

4. **Verify:**
   ```bash
   ls ~/.claude/skills/
   # Should show: software-security/  code-quality/
   ```

### Windows (PowerShell)

1. **Find your home directory:**
   ```powershell
   echo $env:USERPROFILE
   # Typically: C:\Users\yourname
   ```

2. **Check if `.claude` already exists:**
   ```powershell
   Test-Path "$env:USERPROFILE\.claude"
   ```

3. **Copy the skills folder:**
   ```powershell
   # If .claude does NOT exist yet
   Copy-Item -Recurse .claude "$env:USERPROFILE\.claude"

   # If .claude already exists, merge skills into it
   Copy-Item -Recurse .claude\skills "$env:USERPROFILE\.claude\skills" -Force
   Copy-Item .claude\CLAUDE.md "$env:USERPROFILE\.claude\CLAUDE.md" -Force
   ```

4. **Verify:**
   ```powershell
   Get-ChildItem "$env:USERPROFILE\.claude\skills"
   # Should show: software-security   code-quality
   ```

### Windows (CMD)

1. **Find your home directory:**
   ```cmd
   echo %USERPROFILE%
   ```

2. **Copy the skills folder:**
   ```cmd
   xcopy /E /I .claude "%USERPROFILE%\.claude"
   ```

3. **Verify:**
   ```cmd
   dir "%USERPROFILE%\.claude\skills"
   ```

> **Note:** Claude Code reads `~/.claude/` (or `%USERPROFILE%\.claude\`) globally, then merges with any project-level `.claude/`. Project-level settings take priority over global.

---

## Deploy Per-Project

Copy into any single repo to apply skills only there:

```bash
# macOS / Linux
cp -r .claude /path/to/your/project/

# Windows (PowerShell)
Copy-Item -Recurse .claude C:\path\to\your\project\.claude
```

## Behavior

- **Non-intrusive** — skills are suggestions, not mandates
- **User-driven** — Claude asks before applying recommendations
- **Context-aware** — flags critical issues proactively
- **Lightweight** — minimal context footprint, loaded on demand

---

Based on OWASP, CodeGuard, and SOLID design standards.
