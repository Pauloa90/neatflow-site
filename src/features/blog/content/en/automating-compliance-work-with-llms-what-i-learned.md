---
title: "Automating compliance work with LLMs: what I learned after six months"
heroImage:
  url: "../../../../assets/blog/covers/automating-compliance-work-with-llms-what-i-learned.jpg"
  alt: "AI-assisted code on a screen, debugging session in progress"
description: "An honest retrospective on using large language models to automate parts of EU regulatory compliance work — DORA, GDPR, ISO mapping. Where the LLM saved real time, where it failed, and what got packaged into a tool versus what stayed manual."
pubDate: 2026-05-23
author: "Paulo Albuquerque"
metaTitle: "Automating Compliance Work with LLMs: 6-Month Honest Retrospective"
metaDescription: "Six months of using LLMs to automate EU compliance work — DORA, GDPR, framework mapping. What worked, what failed, and the build-in-public path to a tool."
intro: "Over the last six months I've tried to automate as much of my regulatory compliance work as possible using LLMs — mostly Claude, some open-weights experiments. This is the retrospective. What an LLM can actually do in compliance, where it fails in ways that matter, the workflow that survived, and the parts that turned into a product because doing them by hand stopped scaling."
tags: ["compliance", "Claude", "LLMs", "build-in-public", "DORA"]
isDraft: false
faqs:
  - question: "What's the realistic time saving from using an LLM for compliance work?"
    answer: "Across six months of logs, roughly 50-70% on first-draft work (questionnaires, policies, contract clauses, framework mappings) and roughly 0% on review work. The LLM accelerates the part where you move from blank page to coherent draft. It doesn't accelerate the part where a compliance officer signs off, because that part is the actual job. If a vendor pitches you 90%+ time savings, they're including the review time in the 'before' baseline without including it in the 'after.'"
  - question: "Is it safe to put confidential client compliance documents through an LLM API?"
    answer: "It depends on which API, which contract, and which data. Anthropic's API has explicit zero-data-retention options and no training on customer data by default. The same is true of the major hyperscaler-hosted offerings. The actual risk is not the API contract; it's the operational risk of accidentally including a client's data in a prompt that gets logged to your own system, your terminal history, or a debug dump. Build the pipeline as if the prompt itself is sensitive, because it is."
  - question: "Should compliance teams build their own LLM tooling or buy a platform?"
    answer: "Build the prompts, the data structures, and the validation logic yourself. They are your competitive advantage and they will outlive any vendor. Buy the infrastructure — the model API, the storage, the audit trail. The trap most teams fall into is buying a platform that hides the prompts, which means you can't tune them and you can't audit them. That's a worse position than starting from scratch."
lang: "en"
---

Over the last six months I've tried to automate as much of my regulatory compliance work as possible using LLMs — mostly Claude, some open-weights experiments. This is the retrospective. What an LLM can actually do in compliance, where it fails in ways that matter, the workflow that survived, and the parts that turned into a product because doing them by hand stopped scaling.

Context: I'm a SaaS founder in Dublin selling to EU financial entities. The work in question is mostly DORA assessments, Article 30 contract negotiations, ISO 27001 ↔ DORA ↔ SOC 2 mapping, and the occasional GDPR Article 28 DPA review. None of it is exotic. All of it is repetitive across customers and easy to imagine a model doing. The question was whether the imagined version held up under real use.

## What an LLM does genuinely well

Five categories of work where the time saving was real and reproducible.

### Extracting questions from bank questionnaires

Banks ship their DORA assessments as PDFs, Excel files, or Word documents with inconsistent formatting — sometimes a clean table, sometimes 80 questions spread across narrative paragraphs. Claude is excellent at extracting these into a structured list with question text, category, and any context fields. The accuracy is high (I've spot-checked maybe 1,500 extracted questions across 15 documents and the error rate sat below 1%, mostly numbering glitches).

This sounds trivial. It saves about two hours per assessment, every time.

### Mapping between frameworks

ISO 27001 controls to DORA articles. DORA articles to SOC 2 trust criteria. GDPR Article 32 to ISO 27001. NIS2 to DORA. These mappings exist in scattered industry publications and never quite match your specific framing. An LLM with the control text on both sides as context produces a passable first-draft mapping in minutes, where doing it by hand is a week.

The catch is that the mapping has to be validated. Maybe 5-15% of the mappings I generated needed correction (one side too narrow, the other side too broad, or a mapping that's technically correct but operationally useless). Once corrected, the mapping is reusable across customers and the per-customer marginal cost is near zero.

### Drafting policies and procedures

ICT risk management framework, business continuity plan, incident response process, exit strategy template. The shape of these documents is conventional. An LLM with a structured brief (your product profile, your hosting setup, your team size) produces a first draft that is good enough to edit in an hour, where blank-page drafting is a day.

The risk is that the draft reads coherent and contains specific commitments you can't actually meet. I had one draft propose a 15-minute RTO for a service that runs on a single-region setup with a 4-hour realistic RTO. The model wasn't lying; it was producing a draft based on what "good" looks like in the documents it has seen. Always cross-check commitments against your actual capacity.

### Variant generation

Once a master clause, policy, or response exists, producing controlled variants for different customers, different jurisdictions, or different criticality levels is the most cleanly automatable step in compliance work. An LLM is good at "take this clause, change A, B, and C, leave everything else." Reviewing the variant takes a minute. Doing it by hand takes ten.

### Pre-flight reviews

The unexpected category. Before I send a draft to a customer or a compliance officer, I run it through Claude with a prompt like "review this Article 30 clause and flag anything that seems internally inconsistent, makes commitments not supported by the brief, or cites a regulation incorrectly." The model catches about a third of the issues a human reviewer would have caught, with zero effort.

It doesn't replace the human reviewer. It does reduce the number of times the human reviewer has to come back with "this clause contradicts paragraph two."

## What an LLM does badly

The failure modes I logged repeatedly, ordered by how dangerous they are.

### Confidently wrong regulatory references

I covered this in the [Article 30 post](/blog/using-claude-to-draft-dora-article-30-contracts/), but it applies across every framework. Citing the wrong sub-paragraph, inventing RTS that don't exist, mixing GDPR and DORA terminology, or applying NIS2 timelines to DORA. The wording around the wrong citation is always fluent. Pattern-matching detection is the only thing that catches it reliably — every output gets scanned for regulatory references and any unexpected one gets reviewed.

### Legal judgement calls

"Is this clause acceptable to sign?" "Does this control satisfy Article 9(2)?" "Is our exit strategy sufficient?" An LLM has opinions on these and the opinions are usually plausible. They are not legal judgement, they are stylistic mimicry of legal judgement. Use the model to produce options and arguments. Do not use it to make the call.

### Detecting absence

The model is good at evaluating what's in front of it and bad at noticing what's missing. A policy document that's missing a required section will get a positive review unless you specifically prompt for "what's missing under DORA Article 6." Even then, the model is more reliable at "is X present" than "is everything required actually present." Negative space is a human's job.

### Long, multi-document reasoning

Cross-referencing a contract annex against a DPA, an ISO statement of applicability, and a sub-processor list to find an inconsistency — this is the kind of task that LLMs are demoed doing brilliantly and that fails subtly in production. The failure mode is that the model finds three real inconsistencies and confidently invents a fourth that doesn't exist. You can't tell from the output which is which without going back to the sources.

### "Is this enough?"

The single most expensive question in compliance work. "Is this audit response enough?" "Is this evidence enough?" "Is this BCP enough?" The model will tell you yes more often than no, in language that sounds authoritative, because that's what the training data encourages. The model has no real-world feedback loop on rejection rates. Don't ask it. Ask someone who's been audited.

## The workflow that survived

After enough iteration, the operating pattern I run now:

1. **One structured product profile.** Data flows, sub-processors, hosting, team size, incident history, RTO/RPO, security framework status. Versioned. Every prompt loads it from cache.

2. **Per-customer brief.** A short document per bank/customer: their classification of my service, their specific questionnaire, their previous comments. Also versioned.

3. **Task-specific prompts, never generic ones.** "Draft an Article 30(2)(d) clause using the profile and brief" rather than "draft a DORA contract." The narrower the prompt, the less hallucination room.

4. **Quoted regulation text in every prompt.** Never trust the model's recall of an article. Paste the text. Even when it costs tokens.

5. **Citation whitelist post-generation.** Regex over the output for every "Article", "RTS", "Regulation", "GDPR" mention. Anything unexpected gets reviewed before a human reviewer sees it.

6. **Plain-English version alongside contract-grade version.** Always. The plain version exposes assumption drift faster than the contract version does.

7. **Compliance officer reviews the final pack.** Always. The LLM is a drafting accelerator, not a substitute for legal judgement.

The realistic time saving with this workflow versus blank-page: about 50-70% on first drafts, no change on final review. That's enough to make the difference between answering bank questionnaires being a weekend job and being a half-day job. It isn't enough to make compliance work disappear.

## What got packaged into a tool

After doing this manually across enough customers, the parts that were genuinely reusable — the product profile structure, the questionnaire extraction, the framework mappings, the variant generation, the citation checks — ended up wrapped into a tool called [DoraPilot](https://dorapilot.com) because I was rebuilding the same Notion pages and Python scripts for every assessment.

The honest framing: the tool isn't magic and doesn't replace a compliance officer. It encodes the workflow above. If you're a SaaS founder with one EU bank customer, you can probably run this manually using Claude and a few shared documents. If you have ten, the manual approach stops being a use of time and starts being a tax on every new client. That's the bet I made when I decided to ship it.

## What I'd skip if I were starting today

- Any "AI compliance copilot" that hides the prompts. You're paying for someone else's prompt engineering and you can't audit what the model is told.
- Trying to use an LLM for the audit-readiness call ("are we ready to be audited"). That's a human judgement informed by your own audit history, not a model output.
- Building elaborate agent loops that chain a dozen LLM calls. The reliability compounds in the wrong direction. A linear pipeline with explicit checkpoints beats an autonomous agent by a wide margin in any compliance setting I tried.
- Putting raw client data into a prompt without thinking about what your own logs capture. The risk isn't the API contract; it's your own observability stack.

## What I'd build into the workflow if I were starting today

- The product profile and per-customer brief, day one. Everything downstream gets faster.
- A citation whitelist and a post-generation regex check. Catches confidently wrong references with zero ongoing cost.
- A pre-flight review prompt before every human reviewer sees a draft. Takes seconds, catches a third of the issues.
- A clear policy on what the LLM never decides. Audit-readiness, regulatory interpretation, anything binding.

## Sources

- Regulation (EU) 2022/2554 (DORA) and the ESAs RTS published in 2024
- Anthropic documentation on prompt caching, tool use, and zero-data-retention options
- Personal logs from six months of compliance work across roughly fifteen EU bank assessments
- Comparison notes with three other SaaS founders running variations of the same setup
