---
title: "What is the Model Context Protocol (MCP), and why I started using it"
heroImage:
  url: "../../../../assets/blog/covers/what-is-the-model-context-protocol-and-why-i-started-using-it.jpg"
  alt: "USB-C cables and connectors on a desk"
description: "A plain-English explainer of the Model Context Protocol — what MCP actually is, how the host/client/server pieces fit together, who adopted it, and why I stopped writing one-off integrations for every tool."
pubDate: 2026-05-22
author: "Paulo Albuquerque"
metaTitle: "What is the Model Context Protocol (MCP)? A Plain-English Guide"
metaDescription: "An engineer's plain-English explainer of MCP: what it is, the host/client/server architecture, tools vs resources vs prompts, who adopted it, and the security caveats."
intro: "I kept seeing 'MCP' in release notes and config files and nodded along without really knowing what it was. So I spent a weekend reading the spec and wiring up a few servers. Here's the version I wish someone had handed me first — what the Model Context Protocol actually is, in plain English, and why it changed how I connect tools to AI."
tags: ["MCP", "AI workflows", "Claude", "developer tools"]
isDraft: false
faqs:
  - question: "What does MCP stand for, and who made it?"
    answer: "MCP stands for Model Context Protocol. Anthropic announced and open-sourced it on 25 November 2024 as an open standard for connecting AI assistants to external data and tools. It is not Anthropic-only — OpenAI, Google, and Microsoft have all since adopted it, which is the main reason it's worth learning rather than treating as one vendor's quirk."
  - question: "What's the difference between an MCP tool, resource, and prompt?"
    answer: "An MCP server can expose three kinds of capability. Tools are actions the model can invoke (run a search, call an API, write a file). Resources are data the app can read for context (a file's contents, a database row, an API response). Prompts are reusable, parameterised templates a user can pull up. In practice most people start by writing Tools, because that's the part that lets the model actually do something."
  - question: "Do I need to be a developer to use MCP?"
    answer: "To install an existing server, not really — Claude Desktop and similar apps let you add servers through a config file or, increasingly, a one-click connector. To write your own server you need to be comfortable with a bit of TypeScript or Python and the official SDK. The interesting middle ground is that once one good server exists for a tool, everyone can reuse it, which is the whole point of a shared standard."
lang: "en"
---

I kept seeing "MCP" in release notes and config files and nodded along without really knowing what it was. So I spent a weekend reading the spec and wiring up a few servers. Here's the version I wish someone had handed me first — what the Model Context Protocol actually is, in plain English, and why it changed how I connect tools to AI.

This is written from the perspective of someone who automates their own work, not a platform team. I'm not going to pretend MCP is magic. It's plumbing. But it's the kind of plumbing that quietly removes a category of busywork, and that's usually the stuff worth understanding.

## The problem MCP solves

Before MCP, if you wanted an AI assistant to read your files, query a database, or hit some API, you wrote a custom integration for that specific assistant talking to that specific tool. Do that across a few assistants and a few tools and you get the classic M×N problem: every new combination is another bespoke connector to build and maintain.

Anthropic's framing when they introduced MCP on 25 November 2024 was that it's "a new standard for connecting AI assistants to the systems where data lives, including content repositories, business tools, and development environments." The analogy they use in their own docs is the one that finally made it click for me:

> "Think of MCP like a USB-C port for AI applications. Just as USB-C provides a standardized way to connect electronic devices, MCP provides a standardized way to connect AI applications to external systems."

That's it. Instead of M×N custom cables, you have one port shape. Write a server once, and any MCP-capable client can plug into it.

## The three pieces: host, client, server

MCP has a deliberately small vocabulary. Once you have these three words straight, the rest reads easily.

- **Host** — the AI application you're actually using. Claude Desktop, an IDE assistant, an agent framework. The host is what the human interacts with.
- **Client** — a connector that lives inside the host and maintains a one-to-one connection to a server. A host can run several clients at once.
- **Server** — a small program that exposes some capability: your filesystem, a GitHub repo, a Postgres database, a Slack workspace. Servers are the reusable parts.

So when you "add an MCP server" to Claude Desktop, what's really happening is the host spins up a client that connects to that server and asks it "what can you do?" The server answers with a list of capabilities, and from then on the model can use them.

## What a server actually exposes: tools, resources, prompts

A server can offer three kinds of thing — these are the MCP "primitives," and getting them straight saves a lot of confusion:

1. **Tools** — executable actions the model can call. "Search the web," "create a calendar event," "run this SQL." This is the primitive people mean 90% of the time they say "MCP."
2. **Resources** — data the application can read for context. A file's contents, a record, an API response. Resources are read; tools are run.
3. **Prompts** — reusable, parameterised prompt templates that a user can invoke deliberately, like a saved workflow.

When I built my first server, I over-thought this and tried to model everything as resources. In hindsight the rule is simple: if the model should *do* something, it's a tool; if it just needs to *read* something, it's a resource.

## How servers connect: stdio and Streamable HTTP

There are two transports worth knowing, and a common source of confusion I want to clear up.

- **stdio** — for local servers. The host launches the server as a subprocess on your machine and they talk over standard input/output. This is what most personal setups use: a little program running on your laptop.
- **Streamable HTTP** — for remote servers reached over the network. This is the current standard for remote transport, introduced in the 2025-03-26 spec revision and refined since.

The confusion: older guides talk about an "HTTP+SSE" transport as if it's a third peer option. It isn't anymore — the standalone SSE transport from the original 2024 spec is deprecated, replaced by Streamable HTTP (which can still use server-sent events internally for streaming). So the honest mental model in 2026 is **stdio for local, Streamable HTTP for remote** — not three equal choices.

## Why I actually care: it's not Anthropic-only

I'd have filed MCP under "interesting vendor thing" if it had stayed inside Anthropic. It didn't, and that's the real reason to learn it:

- **OpenAI** adopted it. Sam Altman announced support on 26 March 2025, landing first in the OpenAI Agents SDK.
- **Google** said it would embrace MCP about two weeks later (Demis Hassabis, early April 2025), calling it an emerging open standard for the agentic era.
- **Microsoft** built it into Copilot Studio and added native MCP support in Windows.

When the three other biggest players in the space all adopt a competitor's standard within months, that's the market telling you the standard won. A server you write today isn't locked to one assistant.

## What I plugged in first

To make this concrete, here's the order I'd recommend if you're starting, using the official reference servers as a base. The currently maintained official reference servers include **Filesystem, Fetch, Git, Memory, Time, and Sequential Thinking** (several early launch examples like GitHub, Slack, and Postgres have since been moved to community or archived maintenance, so don't be surprised if a 2024 tutorial points at a repo that's now elsewhere).

1. **Filesystem** — let the assistant read and write files in one scoped directory. Immediately useful, easy to reason about, and a safe way to see how permissions feel.
2. **Fetch** — let it pull a URL into context. Turns "go read this page and summarise it" into one step.
3. **A database server** — once the first two feel natural, pointing the model at read-only Postgres is where it stopped feeling like a toy.

The pattern I landed on: start read-only, add write capability only once I trusted the workflow, and keep each server scoped to the narrowest thing it needs.

## The part the hype skips: security

MCP gives a model the ability to *act*, and that deserves caution. The concerns below are real and documented, not hypothetical:

- **Prompt injection.** If a server feeds the model untrusted content (a web page, an incoming email, a document), that content can contain hidden instructions the model may follow. Anything with both a "read untrusted data" tool and a "do something consequential" tool is where this bites.
- **Tool poisoning.** Malicious instructions can be hidden in a tool's *description* — text the model reads but you might not. Invariant Labs publicised this class of attack, and it's why installing random MCP servers is not risk-free.
- **Over-permissioning.** Servers often request more access than they need. The spec doesn't force clients to validate everything a server claims about itself, so the burden is on you to grant narrowly.

None of this makes MCP unsafe to use. It makes it something to use deliberately: install servers you trust, scope them tightly, and keep a human in the loop for anything that sends, deletes, or spends.

## Was it worth a weekend?

Yes — mostly because it changed a habit. I used to write a throwaway script every time I wanted an assistant to touch some tool. Now I look for an MCP server first, and increasingly there is one. The standard did the boring thing standards do: it made the integrations stop being the interesting part, so the actual work could be.

If you only take one thing from this: MCP is a USB-C port for AI apps, the three words are host / client / server, and the three primitives are tools / resources / prompts. Everything else is detail you can look up once you have that frame.

## Sources

- Anthropic, "Introducing the Model Context Protocol" (25 November 2024) — anthropic.com/news/model-context-protocol
- Official MCP documentation and architecture — modelcontextprotocol.io
- MCP transports specification (2025-03-26 revision) — modelcontextprotocol.io/specification
- Official reference servers — github.com/modelcontextprotocol/servers
- TechCrunch, "OpenAI adopts rival Anthropic's standard" (26 March 2025)
- TechCrunch, "Google says it'll embrace Anthropic's standard" (9 April 2025)
- Invariant Labs, MCP tool-poisoning write-up; OWASP MCP security guidance
