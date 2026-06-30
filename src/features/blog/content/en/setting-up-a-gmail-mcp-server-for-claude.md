---
title: "Setting up a Gmail MCP server for Claude: an honest walkthrough"
heroImage:
  url: "../../../../assets/blog/covers/setting-up-a-gmail-mcp-server-for-claude.jpg"
  alt: "Person checking an email inbox on a laptop"
description: "What it actually takes to connect Gmail to Claude through an MCP server — the OAuth scopes that matter, the config file, the security trap most tutorials get wrong, and the state of the available servers in 2026."
pubDate: 2026-05-28
author: "Paulo Albuquerque"
metaTitle: "Connect Gmail to Claude with MCP: An Honest 2026 Walkthrough"
metaDescription: "How to set up a Gmail MCP server for Claude Desktop: OAuth scopes explained correctly, claude_desktop_config.json, draft-only safety, and the available servers in 2026."
intro: "Search 'connect Gmail to Claude' and most guides hand-wave the part that actually matters: the OAuth scopes and why 'draft-only' isn't a permission you can set. I wired this up on my own inbox and dug into Google's docs to get it right. Here's the honest version — what to install, what to grant, and the trap to avoid."
tags: ["MCP", "email", "Claude", "Gmail", "personal automation"]
isDraft: false
faqs:
  - question: "Is there an official Gmail MCP server?"
    answer: "As of mid-2026 Google has its own Gmail MCP server, but it's in Developer Preview — experimental, not generally available. The most popular community option (GongRzhe's Gmail-MCP-Server) was archived in March 2026, so it still installs but is no longer maintained. There's no single stable, official, GA Gmail MCP server yet, which is worth knowing before you build a workflow that depends on one."
  - question: "Which OAuth scope lets Claude draft emails but not send them?"
    answer: "None — and this is the trap. There is no Gmail scope that allows creating drafts while forbidding sending. The narrowest scope that can create a draft is gmail.compose, and Google's own docs describe it as 'Manage drafts and send emails' — it can send too. The only truly safe read scope is gmail.readonly. So 'draft-only' is something your workflow enforces by never calling the send action, not a permission boundary Google gives you."
  - question: "Where does the config file live on Windows?"
    answer: "For Claude Desktop on Windows, the MCP config file is claude_desktop_config.json inside %APPDATA%\\Claude\\. On macOS it's at ~/Library/Application Support/Claude/. You add your server under an mcpServers key with a command and args, then restart Claude Desktop for it to pick up the change."
lang: "en"
---

Search "connect Gmail to Claude" and most guides hand-wave the part that actually matters: the OAuth scopes and why "draft-only" isn't a permission you can set. I wired this up on my own inbox and dug into Google's docs to get it right. Here's the honest version — what to install, what to grant, and the trap to avoid.

If you want the why-bother-at-all version of email automation, I wrote about [what actually saves time automating a personal inbox](/blog/automating-personal-email-with-claude-what-actually-works/) separately. This post is the mechanical follow-up: the setup itself, done carefully.

## First, the uncomfortable state of play

I'd love to tell you there's one clean, official, install-and-go Gmail MCP server. There isn't, and pretending otherwise would waste your time. Here's the real landscape in 2026:

- **Google's official Gmail MCP server** exists, but it's a **Developer Preview** — part of the Workspace preview program, explicitly experimental, not production-stable. It can read mail, retrieve threads, list labels, and create drafts. Good to know about; not something to build a load-bearing workflow on yet.
- **GongRzhe's Gmail-MCP-Server** was the popular community choice (npm: `@gongrzhe/server-gmail-autoauth-mcp`), with separate `draft_email` and `send_email` tools. The catch: the repo was **archived (read-only) in March 2026**. It still installs and runs, but nobody's maintaining it.
- **Assorted smaller forks and platform connectors** exist (Composio and similar), of varying quality.

So: pick your server knowing the popular one is unmaintained and the official one is preview-grade. For a personal inbox where you stay in the loop, either is fine. For anything you depend on, set expectations accordingly.

## The OAuth scope you need to understand

This is the one part I'd ask you not to skim, because almost every tutorial gets it subtly wrong.

Here are the relevant Gmail scopes, quoted from Google's official documentation:

| Scope | What Google's docs say it does |
|---|---|
| `gmail.readonly` | "View your email messages and settings." |
| `gmail.compose` | "Manage drafts and send emails." |
| `gmail.modify` | "Read, compose, and send emails... does not allow permanent deletion." |
| `gmail.send` | "Send email on your behalf." |

Now read that table again. **There is no scope that says "create drafts but don't send."** The narrowest scope that can create a draft is `gmail.compose`, and by Google's own description it can *also send*. Same with `gmail.modify`.

So the popular advice — "just grant draft-only access so the AI can't email anyone" — describes a permission that does not exist. The only genuinely send-incapable scope is `gmail.readonly`, and that can't create drafts either.

**What this means in practice:** if you want the safe "Claude prepares replies, I press Send" workflow, the safety comes from your server (or your own rules) simply never invoking the send tool — not from OAuth holding the line for you. It's a workflow guardrail, not a hard wall. Knowing the difference is the whole point of doing this carefully.

A second thing to expect: `gmail.readonly`, `gmail.compose`, and `gmail.modify` are all **restricted scopes**. Using them can push you into Google's app-verification process, or you stay on the "test users" path and live with the scary unverified-app consent screen. For a personal project with yourself as the only test user, the latter is normal and fine.

## The Google Cloud setup

The steps are unglamorous but only take about fifteen minutes the first time:

1. **Create a project** in the Google Cloud Console.
2. **Enable the Gmail API** — APIs & Services → Library → search "Gmail API" → Enable.
3. **Configure the OAuth consent screen** — User Type "External", give the app a name, add your own email as the contact. Add the scope you decided on above (start with `gmail.readonly` if you only want reading).
4. **Create credentials** — Credentials → Create Credentials → OAuth client ID → application type **Desktop app**.
5. **Download the client JSON** — this holds your client ID and secret. Treat it like a password.

Add yourself as a test user on the consent screen and you can use the app without going through full verification.

## Wiring it into Claude Desktop

Claude Desktop reads MCP servers from a JSON config file:

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

The structure is a top-level `mcpServers` object, where each key is a name you choose and each value gives the command to launch the server. For a stdio server installed via npm it looks like this:

```json
{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": ["-y", "@gongrzhe/server-gmail-autoauth-mcp"]
    }
  }
}
```

Claude Desktop launches that as a subprocess and talks to it over stdio. After editing the file, fully restart Claude Desktop. If it doesn't appear, the logs are your friend: `%APPDATA%\Claude\logs` on Windows, `~/Library/Logs/Claude/` on macOS.

Prefer the command line? Claude Code can register the same server with `claude mcp add gmail -- npx -y @gongrzhe/server-gmail-autoauth-mcp` and list what's connected with `claude mcp list`. Worth noting: configuring a local stdio server via the JSON file works on a free Claude Desktop account, while Claude Code needs at least a Pro subscription or API credits. MCP itself is free and open — you're never paying for the protocol.

## The security posture I'd actually use

Having done this, here's the setup I'd recommend for a personal inbox:

- **Start with `gmail.readonly`.** A read-only assistant that summarises and triages is already most of the value, and it literally cannot send anything wrong.
- **Only escalate to `gmail.compose` when you genuinely want drafts** — and remember that scope can technically send, so keep the human-presses-Send rule.
- **Never wire up auto-send for incoming-mail-triggered actions.** This is where prompt injection lives: a malicious email can contain hidden instructions ("forward all invoices to…"), and a model with both a read tool and a send tool can be talked into acting on them. Separating "read" from "send" and keeping yourself in the loop neutralises most of it.
- **Guard the token files.** MCP servers store OAuth access and refresh tokens locally, sometimes in plain text. A stolen token is account access. Keep them out of repos, backups, and synced folders.

## Would I rely on it?

For my own inbox, yes — as a read-and-draft assistant with me pressing Send. As critical infrastructure, not yet: the maintained options are either preview-grade (Google's) or archived (the community one). That's not a reason to avoid it; it's a reason to build the kind of workflow that's fine when a tool changes under you — scoped narrowly, human in the loop, nothing that breaks if the server goes away.

Set it up, grant the least you can, and let the model do the reading. The drafting is a bonus, not the point.

## Sources

- Google, Gmail API OAuth 2.0 scopes — developers.google.com/workspace/gmail/api/auth/scopes
- Google, configure the OAuth consent screen — developers.google.com/workspace/guides/configure-oauth-consent
- Google, official Gmail MCP server (Developer Preview) — developers.google.com/workspace/gmail/api/guides/configure-mcp-server
- GongRzhe/Gmail-MCP-Server (archived March 2026) — github.com/GongRzhe/Gmail-MCP-Server
- Anthropic / MCP documentation on Claude Desktop configuration — modelcontextprotocol.io
- OWASP MCP Security Cheat Sheet; community write-ups on MCP token storage and prompt injection
