---
title: "Using Claude to draft DORA Article 30 contract annexes: what worked and where it broke"
heroImage:
  url: "../../../../assets/blog/covers/using-claude-to-draft-dora-article-30-contracts.jpg"
  alt: "Close-up of business hands reviewing and signing a contract document with a pen"
description: "An honest look at using Claude to draft DORA Article 30 contract clauses for ICT vendors selling to EU banks. What an LLM can do well in compliance drafting, what it gets dangerously wrong, and the workflow that actually held up."
pubDate: 2026-05-17
author: "Paulo Albuquerque"
metaTitle: "Drafting DORA Article 30 Contracts with Claude: Honest 2026 Notes"
metaDescription: "Using Claude to draft DORA Article 30 annexes for SaaS vendors selling to EU banks. What works in compliance drafting, what fails, and the workflow that holds up."
intro: "Article 30 of DORA spells out the contractual provisions an ICT third-party provider must agree to before a bank can sign with it. I spent a few weeks using Claude to draft those clauses from existing evidence packs, and these are the honest notes — where the LLM saves real work, where it hallucinates, and the workflow that survives a compliance officer's review."
tags: ["DORA", "Claude", "compliance", "AI workflows", "contracts"]
isDraft: false
faqs:
  - question: "Can Claude write DORA Article 30 clauses that are good enough to sign?"
    answer: "No, and you shouldn't try. Claude can produce a first draft of every Article 30 clause from a structured brief in a few minutes, but every draft I generated needed a compliance reviewer to correct cross-references, tighten ambiguous wording, and remove subtle overreach. The right framing is: Claude moves you from a blank page to a 70% draft. The remaining 30% is where the legal liability lives, and that's a human job."
  - question: "What's the safest way to feed Claude your existing ISO 27001 or SOC 2 evidence?"
    answer: "Treat the evidence pack as context, not as ground truth that Claude can paraphrase freely. The workflow that worked: extract the exact clauses, controls, and policy excerpts as quoted text in the prompt, then ask Claude to map them to specific DORA articles. Forbid the model from paraphrasing source text without flagging the change. This dropped my rate of subtle factual drift to near zero on a sample of 200 clauses."
  - question: "Which Article 30 clauses does Claude handle best, and which should you draft yourself?"
    answer: "Claude is strong on exit strategy language (Art. 30(3)), right-of-audit clauses (Art. 30(2)), and sub-outsourcing chain disclosures. It is weak on incident notification timelines (Art. 30(2)(c)) where the SLA needs to match your actual incident response capability, and on data location commitments where the wording must match your real infrastructure. Draft the SLA-bound and infra-bound clauses yourself and let Claude handle the structural ones."
lang: "en"
---

Article 30 of DORA spells out the contractual provisions an ICT third-party provider must agree to before a bank can sign with it. I spent a few weeks using Claude to draft those clauses from existing evidence packs, and these are the honest notes — where the LLM saves real work, where it hallucinates, and the workflow that survives a compliance officer's review.

Context: I'm a SaaS founder selling to EU financial entities. My clients started forwarding their DORA vendor questionnaires in late 2025, and every one of them included a request for Article 30-compliant contract annexes. The first one took me a weekend. The second one I tried to do faster with Claude. This is what I learned across the next ten.

## What Article 30 actually asks for

Before the Claude part, a quick orientation, because most posts about DORA gloss over what Article 30 contains.

Article 30(2) is the list of mandatory contractual provisions for any ICT service used by a financial entity. It covers: a clear description of the function, locations of service and data, security and data protection requirements, incident notification obligations, cooperation with competent authorities, termination rights, exit strategies, and audit rights. Article 30(3) adds extra obligations when the function is "critical or important" — which in practice is most B2B SaaS that touches operational, customer, or financial data.

The full text is in Regulation (EU) 2022/2554. The ESAs (the three European Supervisory Authorities) published RTS in 2024 that specify the policy content and sub-outsourcing rules in more detail. If you're drafting these clauses, read the regulation text first — Claude is going to mirror whatever you feed it, and you cannot tell whether a draft is correct if you don't know what the source actually requires.

## What Claude does well

Three categories of work where the LLM saved me real hours.

### Structural clauses with stable patterns

Right-of-audit language, sub-outsourcing notification timelines, exit strategy frameworks — these have a fixed shape. The bank wants the right to audit, with notice, at the vendor's premises and remotely, with the right to delegate to a third party. The wording is conventional and Claude has clearly seen enough of it to produce a clean first draft.

The workflow that worked: I gave Claude the relevant Article 30 sub-paragraph as quoted text, a short brief about my product (data flows, sub-processors, hosting region), and asked for a draft clause in plain English first, then a contract-grade version. Reviewing the plain-English version takes a minute. Reviewing the contract-grade version takes ten. Doing both catches drift faster than reviewing only the contract-grade output, because the plain version exposes assumptions that hide in legal language.

### Cross-mapping evidence to DORA articles

This was the unexpected win. If you already have an ISO 27001 SoA or a SOC 2 report, most of the security content DORA wants is in there — it just doesn't speak the same dialect. Claude is good at building a side-by-side table: "Your ISO 27001 control A.8.16 (Monitoring activities) maps to DORA Article 9(2) on detection," and so on.

The reason this matters: most banks' DORA questionnaires ask the same security questions you've already answered for ISO/SOC. If you can hand them a mapping document, you've collapsed two days of copy-paste into a 30-minute review. The mapping I built with Claude has been reused across every assessment since.

### Variant generation for different bank clients

Once the master Article 30 annex existed, each new bank wanted small variations — different notice periods, different data residency commitments, different sub-outsourcing thresholds. Claude is excellent at producing a controlled variant of an existing clause when you tell it exactly which knobs to turn. "Change the audit notice period from 30 days to 60 days. Change the data residency clause to allow processing in Ireland and France only. Do not change anything else." That's a five-second prompt and a two-minute review.

## What Claude gets wrong

Three categories of error I logged repeatedly. Anyone using an LLM for compliance drafting should expect to hit all three.

### Confidently wrong cross-references

This was the most dangerous failure. Claude would cite "Article 30(4)" when it meant Article 30(3), or refer to "the RTS on sub-outsourcing under Article 30(5)" when the relevant RTS is under Article 28. The wording around the citation looked fluent, so the error was hard to spot on a fast read.

The mitigation that worked: I built a small lookup table of every Article and RTS reference I expected the drafts to cite, and after each generation I ran a regex over the draft to flag every "Article" or "RTS" mention. Anything not on the whitelist got reviewed before the clause went anywhere. About one in eight drafts had a wrong citation. None reached a client.

### GDPR and DORA bleeding into each other

Both regulations cover overlapping ground — data subject rights, breach notifications, processor obligations. Claude tended to draft clauses that mixed the two, sometimes applying GDPR's 72-hour breach notification to DORA's incident reporting, or citing GDPR Article 28 sub-processor wording inside a DORA Article 30 clause. The result reads correct in isolation and is wrong in context.

The mitigation: explicit framing in the prompt. "This clause is for DORA Article 30 only. GDPR is covered separately in our DPA. Do not introduce GDPR-derived language unless I ask for it." That cut the bleed-through significantly but didn't eliminate it. Final review still has to catch the residual.

### Inventing clauses that sound official

The model would occasionally produce clauses that don't correspond to any Article 30 requirement — a "Cybersecurity Innovation Clause" or a "Continuous Compliance Attestation" — and frame them as if the regulation required them. Always plausible, occasionally even useful, but not actually mandated.

This isn't unique to compliance drafting; it's the same hallucination failure mode that shows up everywhere with LLMs. The compliance-specific risk is that a non-expert reviewer can't tell the difference between a real DORA obligation and a fabricated one without checking the source. Anchor the prompt to specific Article sub-paragraphs and reject any clause whose obligation isn't traceable to a citation.

## The workflow that held up

After enough cycles, the pattern that survived contact with a real compliance reviewer:

1. **Brief Claude once with a structured product profile.** Data flows, sub-processors, hosting region, incident response SLAs, current ISO/SOC posture. Cache this aggressively so every drafting session pays the input cost once.

2. **Draft clause by clause, against quoted regulation text.** Never ask Claude to "draft an Article 30 annex." Always: "Here is the text of Article 30(2)(d). Draft the corresponding contractual clause for my product."

3. **Generate a plain-English version alongside every contract-grade clause.** Review the plain version first to catch assumption drift, then read the contract version.

4. **Run citation checks before any human reviewer sees the draft.** Whitelist of expected Articles and RTS, regex over the output, manual eyes on anything unexpected.

5. **Compliance officer reviews the final pack.** Always. The LLM is a drafting accelerator, not a substitute for legal judgement. Anyone telling you their AI-generated DORA pack is "ready to sign" is selling something.

The realistic time saving on a full Article 30 annex with this workflow: about 60-70% versus blank-page drafting, with the same final-review burden. That isn't the "AI does compliance for you" pitch the market wants, but it's the honest number after fifteen assessments.

## What I'd skip if I were starting today

- Letting Claude draft the entire annex in one prompt. The errors compound across clauses and you can't tell which assumption broke which paragraph.
- Trusting any chained agent that "researches DORA" without grounding it in the actual regulation text you paste in. The model will happily summarise the wrong version of an article it half-remembers.
- Using a generic "compliance copilot" SaaS that hides the prompt. You're paying for someone else's prompt engineering and getting locked out of the actual leverage.

## Where this ended up

The Claude-assisted Article 30 drafting workflow turned into a tool I built for myself called [DoraPilot](https://dorapilot.com), because answering bank questionnaires by hand for every new client wasn't scaling. The blog post isn't a pitch — the workflow above runs the same whether you use any tool or none. But if you're a SaaS founder hitting the same wall, you might recognise the problem.

## Sources

- Regulation (EU) 2022/2554 (the DORA Regulation), Articles 28 and 30
- ESAs Joint Final Report on RTS on ICT third-party policy (JC 2024/53)
- ESAs Joint Final Report on RTS on sub-outsourcing (JC 2024/54)
- Anthropic documentation on prompt caching and Claude tool use
- Personal logs from drafting Article 30 annexes for ten different EU bank clients across a SaaS vendor's portfolio
