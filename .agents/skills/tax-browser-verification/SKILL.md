---
name: tax-browser-verification
description: >-
  End-to-end browser automation, DevTools bridge setup, and live UI verification protocol using the Antigravity browser subagent and Chrome DevTools Protocol. Use this skill whenever visually and functionally verifying frontend changes, authentication flows, Persian RTL components, dropdowns, modals, popovers, or full-stack features in Google Chrome on Windows Server / developer environments.
---

# Browser Automation & Live UI Verification Skill

This skill governs the end-to-end protocol for launching Chrome with remote debugging, bridging Chrome DevTools to Antigravity's `browser` subagent, and executing automated UI verifications on the Tax Summary Employee App.

---

## 1. The Core Architecture & Environment Realities

Antigravity provides a specialized `browser` subagent powered by the Chrome DevTools Protocol (CDP). In enterprise Windows Server environments (such as RDP sessions), connecting CDP requires understanding three platform mechanisms:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                             Architecture Flow                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   1. scripts/start-browser-daemon.ps1                                      │
│      ├── Kills orphan background Chrome processes                          │
│      ├── Starts Chrome with --headless=new & --remote-debugging-port=0     │
│      └── Generates DevToolsProfile/DevToolsActivePort                      │
│                                │                                           │
│                                ▼                                           │
│   2. Port Bridge Synchronization                                           │
│      └── Copies DevToolsActivePort to:                                     │
│          %LOCALAPPDATA%\Google\Chrome\User Data\DevToolsActivePort         │
│                                │                                           │
│                                ▼                                           │
│   3. Antigravity MCP Server (chrome_devtools)                              │
│      └── Reads default User Data\DevToolsActivePort                        │
│      └── Establishes WebSocket connection to Chrome CDP                    │
│                                │                                           │
│                                ▼                                           │
│   4. Browser Subagent (TypeName: "browser", Role: "Browser Verifier")      │
│      └── Navigates, logs in, asserts elements, clicks, screenshots, videos │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Why the Daemon Bridge Is Required
1. **Security Restriction on Default Profile**: Recent Chromium/Google Chrome releases forbid attaching remote debugging to the default profile (`DevTools remote debugging requires a non-default data directory. Specify this using --user-data-dir`).
2. **MCP Port Discovery Expectation**: Antigravity's `chrome_devtools` MCP server looks strictly at `%LOCALAPPDATA%\Google\Chrome\User Data\DevToolsActivePort`.
3. **Background Process Interception**: Standard Chrome processes running in the background (e.g. `--no-startup-window`) intercept subsequent Chrome invocations and swallow the `--remote-debugging-port` flag.
4. **Dynamic Port Allocation**: Using `--remote-debugging-port=0` assigns a free ephemeral port, preventing port conflicts on shared multi-user servers.

---

## 2. Standard Verification Workflow

Follow these steps sequentially whenever executing browser verification:

### Step 1: Pre-Flight Service Health Check
Verify that both Backend (port 5000) and Frontend (port 3000) are running and healthy:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\manage-app.ps1 health
```

Both endpoints must return `[HEALTHY]` before proceeding.

### Step 2: Launch the Chrome DevTools Daemon
Launch the bridge script using `run_command` with `IsDaemon: true` and `WaitMsBeforeAsync: 4000`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-browser-daemon.ps1
```

> [!IMPORTANT]
> Always set `IsDaemon: true` when launching `start-browser-daemon.ps1`. The script enters a synchronization loop that keeps the `DevToolsActivePort` file fresh and Chrome active in the background.

Check the command output:
```
DevTools port successfully synchronized to: 65149
Chrome DevTools Protocol ready: Chrome/157.0.8103.79
WebSocket Debugger URL: ws://127.0.0.1:65149/devtools/browser/...
```

### Step 3: Invoke or Message the `browser` Subagent

#### When Launching a New Session:
Use `invoke_subagent`:
- `TypeName`: `"browser"`
- `Role`: `"Browser Verifier"`
- `Prompt`: Specific instructions detailing routes, credentials, UI assertions, and actions.

#### When Reconnecting an Idle Subagent:
If a previous browser subagent went idle (e.g., due to an initial connection pause):
- Use `send_message` with the existing `conversationId` rather than creating a duplicate subagent.
- Provide the exact instructions to resume in the active browser tab.

---

## 3. Standard Authentication & Credentials

Use the default administrative credentials for verification:

| Field | Value | Notes |
| :--- | :--- | :--- |
| **Login URL** | `http://localhost:3000/login` | Redirects to `/` on success |
| **Username** | `admin` | Full administrative RBAC role |
| **Password** | `Admin@123` | Default seed credential |

---

## 4. Subagent Prompting Best Practices

When crafting verification instructions for the `browser` subagent:

### 1. Give Explicit Step-by-Step Directives
```markdown
1. Navigate to http://localhost:3000/login
2. Sign in with:
   - Username: admin
   - Password: Admin@123
3. Navigate to http://localhost:3000/admin/menu-settings
   - Locate the Reports module card (key: module_reporting).
   - Verify the button '+ افزودن گزارش به منو' is visible and clickable.
   - Click '+ افزودن گزارش به منو'.
   - Verify modal opens with 'تخصیص گزارش سازمانی' active.
   - Select a report (e.g. REP_2) and verify auto-population of title, route, and icon.
   - Close modal.
4. Navigate to http://localhost:3000/reporting/standard
   - Verify that report cards show assignment badges or '+ افزودن به منو' buttons.
5. In the top navbar, toggle the sidebar to collapsed mode.
   - Click the Reports icon (BarChart3).
   - Verify floating flyout popover menu opens with all sub-routes.
6. Summarize results and confirm each step.
```

### 2. Instruct on Dynamic & Responsive UI Elements
- **Modals**: Assert backdrop visibility, form fields, and close/cancel buttons.
- **RTL Flyout Popovers**: In collapsed sidebar mode, verify that hovering or clicking the icon triggers the floating flyout popover adjacent to the icon rail (`dir="rtl"`).
- **Persian Text Rendering**: Verify Jalali date labels, currency strings (ریال), and badge texts render without mojibake (`Ø§Ù...`).

---

## 5. Capturing Artifacts & Recordings

The browser subagent automatically captures screenshots and session recordings:

1. **Screenshots**:
   - Subagent saves visual snapshots to its internal steps directory:
     `C:\Users\Administrator\.gemini\antigravity\brain\<subagentId>\.system_generated\steps\<stepId>\media_0.png`
   - Copy this image to the conversation artifact directory to link or display in walkthroughs:
     ```powershell
     Copy-Item "C:\Users\Administrator\.gemini\antigravity\brain\<subagentId>\.system_generated\steps\<stepId>\media_0.png" "C:\Users\Administrator\.gemini\antigravity\brain\<conversationId>\verified_screenshot.png"
     ```

2. **Session Video Recording**:
   - A complete video of the browsing session is generated at:
     `C:\Users\Administrator\.gemini\antigravity\brain\<subagentId>\recording.mp4`
   - Copy to the artifact directory for reference:
     ```powershell
     Copy-Item "C:\Users\Administrator\.gemini\antigravity\brain\<subagentId>\recording.mp4" "C:\Users\Administrator\.gemini\antigravity\brain\<conversationId>\verification_recording.mp4"
     ```

---

## 6. Teardown & Post-Verification Cleanup

After verification completes:
1. **Kill Daemon Background Task**:
   Call `manage_task` with `Action: "kill"` on the task ID returned by `run_command` (e.g. `task-584`).
2. **Clean Port Files**:
   Execute:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\start-browser-daemon.ps1 -Action stop
   ```
3. **Leave Browser Subagent Idle**:
   Per Antigravity guidelines, do not force-kill the idle browser subagent; idle subagents consume zero tokens and can be resumed if follow-up checks are needed.

---

## 7. Troubleshooting Matrix

| Symptom | Root Cause | Resolution |
| :--- | :--- | :--- |
| `ENOENT: DevToolsActivePort not found` | Chrome not running or missing port bridge file. | Run `.\scripts\start-browser-daemon.ps1` as a daemon process. |
| `Could not connect to Chrome (timeout)` | Existing Chrome processes running without `--remote-debugging-port`. | Run `.\scripts\start-browser-daemon.ps1 -Action stop` then restart daemon. |
| `DevTools remote debugging requires a non-default data directory` | Chrome attempted to debug on default `User Data` folder directly. | Use the daemon script which automatically routes via `DevToolsProfile`. |
| Browser subagent reports `BLOCKED` | Target host/port unreachable. | Run `.\scripts\manage-app.ps1 health` to verify frontend (port 3000) is up. |
| Empty or stale screenshots | Page elements still loading or client hydration pending. | Instruct subagent to wait for specific selectors before capturing. |
