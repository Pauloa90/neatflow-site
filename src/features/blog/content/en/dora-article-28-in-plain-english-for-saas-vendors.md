---
title: "DORA Article 28 in plain English for SaaS vendors selling to EU banks"
heroImage:
  url: "../../../../assets/blog/covers/dora-article-28-in-plain-english-for-saas-vendors.jpg"
  alt: "The European Central Bank tower in Frankfurt at sunset"
description: "A practical explainer of DORA Article 28 for SaaS vendors who just got asked by a bank client to demonstrate compliance. What the regulation actually requires from you, what it doesn't, and how to respond without panicking."
pubDate: 2026-05-11
author: "Paulo Albuquerque"
metaTitle: "DORA Article 28 Explained for SaaS Vendors: 2026 Practical Guide"
metaDescription: "What DORA Article 28 means for SaaS vendors selling to EU banks, insurers, or fintechs. Plain-English breakdown of obligations, common misconceptions, and how to respond to your bank client's compliance request."
intro: "If you're a SaaS vendor selling to EU banks and you just received an email asking you to demonstrate 'DORA Article 28 compliance,' your first move is probably to read the regulation, get lost in cross-references, and panic. This is the plain-English version, written for the engineer or founder who has to respond. What Article 28 actually requires from you, what it doesn't, and how to put together a credible response without hiring a boutique auditor."
tags: ["DORA", "compliance", "SaaS", "EU regulation"]
isDraft: false
faqs:
  - question: "Does DORA Article 28 apply to me if my SaaS isn't financial software?"
    answer: "Yes, if a financial entity is using your service to support a critical or important function. The regulation classifies you by what your customer does with the service, not by what category your product falls into. A generic SaaS for project management, ticketing, document storage, or analytics is in scope the moment a bank uses it to support, say, customer onboarding or transaction monitoring. Most B2B SaaS sold to financial entities ends up in scope."
  - question: "Do I need to be a 'critical ICT third-party provider' designated by the ESAs to comply with DORA?"
    answer: "No, and this is the most common confusion. The 'critical ICT third-party provider' (CTPP) designation under Articles 31-33 applies only to a tiny number of platform-scale providers (think the major cloud hyperscalers and similar). If you're a normal SaaS company, you are an 'ICT third-party service provider' under Article 28, not a CTPP. The obligations are different — Article 28 puts the compliance burden mostly on your bank customer, with you supporting their work. You don't apply for CTPP status; the ESAs designate it."
  - question: "What's the difference between Article 28 and Article 30 for a SaaS vendor?"
    answer: "Article 28 governs how the financial entity manages their ICT third-party risk in general — due diligence, risk assessment, register of information, policies. Article 30 lists the specific contractual provisions that must appear in the agreement between the financial entity and the ICT provider. As a vendor, you're affected by both: you provide evidence and answer questionnaires under Article 28, and you sign contract clauses under Article 30. The two articles work as a pair."
lang: "en"
---

If you're a SaaS vendor selling to EU banks and you just received an email asking you to demonstrate "DORA Article 28 compliance," your first move is probably to read the regulation, get lost in cross-references, and panic. This is the plain-English version, written for the engineer or founder who has to respond. What Article 28 actually requires from you, what it doesn't, and how to put together a credible response without hiring a boutique auditor.

I'm not a lawyer. This isn't legal advice. What follows is the practical operating model that's worked for me and for several other SaaS founders I've compared notes with, all of us selling to EU financial entities through 2025 and 2026.

## What DORA is, in two paragraphs

The Digital Operational Resilience Act (Regulation (EU) 2022/2554) is the EU's framework for managing ICT risk in the financial sector. It came into application on 17 January 2025 and applies to about 22,000 financial entities across the EU — banks, insurers, payment institutions, crypto-asset providers, investment firms, and more — plus, indirectly, every ICT service provider that supports them.

The framework has five pillars: ICT risk management (Articles 5-16), incident reporting (Articles 17-23), digital operational resilience testing (Articles 24-27), ICT third-party risk (Articles 28-44), and information sharing (Article 45). For a SaaS vendor, the relevant pillar is the third one. The two articles you need to know are Article 28 (general principles for ICT third-party risk) and Article 30 (mandatory contractual provisions).

## What Article 28 actually says

Article 28 puts obligations on the financial entity, not on you directly. The bank, insurer, or fintech that uses your service has to:

- Maintain a Register of Information listing every ICT third-party provider they use, with details on the service, criticality, location, and contractual status.
- Perform due diligence on ICT providers before contracting and on an ongoing basis.
- Document a policy on the use of ICT services supporting critical or important functions.
- Assess concentration risk — how dependent they are on any single provider.
- Plan for exit strategies for every provider supporting a critical or important function.
- Notify their competent authority before entering into a contract for a critical or important function.

The vendor's role under Article 28 is to support the financial entity in doing all of this. In practice that means answering due-diligence questionnaires, providing evidence, completing the Register of Information fields the bank needs, and agreeing to the Article 30 contract clauses (the next section).

What Article 28 does not require from you: an audit certificate, a "DORA badge", a specific accreditation, or anything else that resembles a vendor seal of compliance. There is no such thing as a "DORA-certified vendor." Anyone selling you one is selling you a marketing exercise.

## What "critical or important function" means

Most of the obligations in Article 28 scale by whether your service supports a "critical or important function" at the financial entity. This phrase carries a lot of weight, and DORA doesn't define it crisply.

The ESAs' guidance is that a function is critical or important if its disruption would materially impair the financial entity's ability to comply with its regulatory obligations, continue providing services, or maintain financial soundness. In practice, banks classify functions internally using their own framework. A SaaS that supports customer onboarding, transaction monitoring, payment processing, core operational reporting, or material data hosting is almost always classified as supporting a critical or important function. A SaaS for marketing analytics or internal HR is usually not.

You don't decide this classification. Your bank customer does. But you should ask, because the answer determines how much evidence they'll need from you and how strict the Article 30 contract clauses will be.

## What you actually need to produce as a vendor

Across ten or so DORA assessments I've answered, the artefacts banks consistently ask for:

**A completed due-diligence questionnaire.** Usually 30-80 questions covering security controls, sub-outsourcing, data location, incident response, business continuity, and exit support. Many banks reuse the ECB's TIBER-EU or the Bank of Italy's templates with minor modifications.

**Evidence of an information security framework.** ISO 27001 certification, SOC 2 Type II report, or equivalent. If you have neither, you'll need to produce control descriptions and evidence that match the substance of those frameworks. DORA doesn't mandate ISO/SOC specifically, but their absence makes the conversation significantly longer.

**A Register of Information row.** The bank populates their register with your details: legal entity, service description, hosting location, sub-processors, function criticality. You provide the source data; they format it for their submission. Expect to provide your sub-processor list, your data residency commitments, and your hosting region in a structured way.

**An Article 30-compliant contract annex.** The contract between you and the bank must include the provisions listed in Article 30(2) and, for critical or important functions, also Article 30(3). Right-of-audit, exit strategy, sub-outsourcing notification, incident reporting timelines, cooperation with authorities, data location, termination rights. Most banks have a template; some accept yours.

**Business continuity and incident response documentation.** A BCP/DR plan and an incident response process. These don't need to be elaborate — they need to exist, be tested at some interval, and be visible to the bank's reviewer.

**Sub-outsourcing chain disclosure.** A list of every sub-processor in the chain, what they do, where they're located, and which DORA-relevant functions they touch. The ESAs' RTS on sub-outsourcing (JC 2024/54) clarified that this chain has to be visible end-to-end for critical or important functions.

## What you don't need to produce

A list of common asks that aren't actually DORA requirements, and that you can push back on politely:

**A DORA-specific audit report.** No such thing exists. Banks sometimes ask for one because their procurement template was written before they understood the regulation. Your ISO 27001 or SOC 2 report plus the Article 30 contract annex is the equivalent.

**A separate DORA security questionnaire.** The questions a bank should ask under DORA overlap heavily with the questions they should ask under their existing third-party risk management policy. If you've answered their TPRM questionnaire, most of the work is done. The Article 28 framing is mostly additive (sub-outsourcing chain depth, exit strategy specifics).

**A "DORA compliance attestation" signed by your CEO.** Some banks ask for this; it's not in the regulation. A short letter confirming your awareness of DORA and your support for the bank's compliance obligations under it is usually enough, if pushed.

**Liability for the bank's own DORA fines.** Article 28 puts the regulatory obligation on the financial entity. Some procurement teams try to push fine pass-through into contracts. This is negotiable and you should negotiate it.

## How to respond without panicking

The pattern that has worked, across multiple bank clients:

1. **Ask for the questionnaire upfront, before agreeing to any timeline.** Different banks have wildly different templates. A 30-question Spanish bank questionnaire is a week of work. An 80-question German bank questionnaire is a month.

2. **Reuse aggressively.** Maintain one master DORA response pack with your security controls, sub-processors, hosting commitments, exit strategy, and incident response process. Variant per bank, don't rewrite per bank.

3. **Be clear about the critical/important function question.** Ask your bank customer how they've classified the service. If they haven't, ask why and use that conversation to set expectations on evidence depth.

4. **Sign a sensible Article 30 annex once, reuse it.** Your first Article 30 contract negotiation is the hard one. The clauses you settle on become your template. Push back on bank-specific clauses that go beyond what Article 30 requires.

5. **Update once a year, or when something material changes.** A new sub-processor, a new hosting region, a change in your incident response process. Your bank customers will appreciate the proactive update and it costs you almost nothing.

The first DORA assessment took me three weeks. The tenth took an afternoon. Most of that compression came from having reusable artefacts, not from any tool.

## What I'd skip

- Hiring a boutique compliance consultant to "make you DORA-ready" before you have a bank client asking for it. The work is shaped by what your specific bank customers ask, and you can't pre-build the answers without knowing the questions.
- Buying a "DORA platform" before you understand which artefacts you actually need. Most of the platforms are bundling generic GRC features with a DORA skin. You can get further with a shared drive and a good questionnaire template.
- Treating Article 28 as a one-time project. It's a recurring obligation for your bank customers, which means it's a recurring conversation for you. Build the artefacts to maintain, not to ship once.

## Sources

- Regulation (EU) 2022/2554 (DORA), full text on EUR-Lex
- ESAs Joint Final Report on RTS on ICT third-party policy (JC 2024/53)
- ESAs Joint Final Report on RTS on sub-outsourcing (JC 2024/54)
- EBA Guidelines on outsourcing arrangements (EBA/GL/2019/02), still operative for clarifications
- Anecdotal pattern data from SaaS founders selling to EU financial entities through 2025-2026
