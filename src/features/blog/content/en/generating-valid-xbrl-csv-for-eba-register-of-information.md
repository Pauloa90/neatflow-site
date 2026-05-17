---
title: "Generating valid xBRL-CSV for the EBA Register of Information: what nobody documents"
heroImage:
  url: "../../../../assets/blog/covers/generating-valid-xbrl-csv-for-eba-register-of-information.jpg"
  alt: "Top-down view of analytical data sheets and a laptop on a desk"
description: "A technical walkthrough of generating a DORA Register of Information in xBRL-CSV format that actually passes EBA validation. Why Excel submissions get rejected, what the taxonomy expects, and how to validate locally with Arelle before you submit."
pubDate: 2026-05-14
author: "Paulo Albuquerque"
metaTitle: "Valid xBRL-CSV for the EBA Register of Information: A 2026 Guide"
metaDescription: "How to generate a DORA Register of Information in xBRL-CSV that passes EBA validation. Taxonomy structure, common rejection causes, and local Arelle validation."
intro: "The European Banking Authority's dry-run for the DORA Register of Information rejected the overwhelming majority of Excel-based submissions. The format the supervisors want is xBRL-CSV in the EBA taxonomy 4.0, which is documented in regulator language and nowhere else. This is the engineer's version: what xBRL-CSV actually is, why Excel files fail, and how to validate your own files locally before you submit."
tags: ["DORA", "xBRL", "EBA", "compliance", "engineering"]
isDraft: false
faqs:
  - question: "Why does the EBA reject Excel submissions for the Register of Information?"
    answer: "Excel templates can encode the same data fields as xBRL-CSV but lose almost everything the supervisors actually validate against — datatype constraints, enumerated value lists, dimensional context, and cross-table integrity rules. The EBA's central validation pipeline runs against the taxonomy, not against a spreadsheet shape, so an Excel that 'looks right' to a human almost always violates a rule the human can't see. The dry-run rejection rate was published in the high 90s for Excel submissions and significantly lower for xBRL-CSV submissions."
  - question: "What's the simplest stack to generate valid xBRL-CSV without buying a regtech platform?"
    answer: "A scripted pipeline using Arelle as the validator and a templating layer (Python, Node, or anything that can write CSV files) is enough for a small-to-medium register. The flow: model your register data in a normalised structure, transform it into the per-table CSVs the EBA taxonomy expects, generate the report.json index and metadata files, then run Arelle locally with the EBA taxonomy package loaded. Arelle will print every rule violation. Iterate until clean before submitting."
  - question: "Can I generate xBRL-CSV with an LLM?"
    answer: "Partly. An LLM is useful for mapping your source data to the EBA taxonomy columns and explaining what each dimension means in plain English. It is not reliable for producing the actual CSVs because the format is rigid (UTF-8, specific delimiters, exact column order, enumerated values) and one wrong character invalidates the file. Use the LLM to plan and explain; use scripted code to write."
lang: "en"
---

The European Banking Authority's dry-run for the DORA Register of Information rejected the overwhelming majority of Excel-based submissions. The format the supervisors want is xBRL-CSV in the EBA taxonomy 4.0, which is documented in regulator language and nowhere else. This is the engineer's version: what xBRL-CSV actually is, why Excel files fail, and how to validate your own files locally before you submit.

I spent a long week last quarter producing a valid Register of Information for a financial entity client. The official documentation gets you about 30% of the way there. The other 70% I had to piece together from EBA filing rules, Arelle GitHub issues, and a few Slack threads from people who'd already done it. This is the writeup I wish I'd had on day one.

## What xBRL-CSV actually is

xBRL is a financial reporting standard that's been around since the early 2000s, originally as an XML dialect, more recently as a CSV-based serialisation called xBRL-CSV. The thing to understand is that "xBRL-CSV" is not "CSV with a fancy name." It's a structured filing format where:

- The taxonomy defines the data model — which tables exist, what columns each has, what datatypes are valid, what dimensional metadata each row needs.
- The CSV files carry the data, one per table, with a strictly enforced shape.
- A `report.json` file at the root of the package indexes which CSV corresponds to which taxonomy table and pins the entry point.
- Validation runs taxonomy-aware: every value is checked against the datatype, every enumeration against the allowed list, every dimensional context against the table's required dimensions.

For DORA, the EBA publishes the taxonomy as a downloadable ZIP, currently version 4.0 for the Register of Information. The taxonomy package is what defines every column, every enumerated value (think country codes, function classifications, criticality flags), and every cross-table rule.

The reason Excel submissions get rejected so consistently is not that supervisors are gatekeeping. It's that an Excel cell has no datatype and no enumeration constraint. A column labeled "Country Code" in Excel can contain "Ireland", "IE", "ireland", "Eire" — all of which a human reads correctly and none of which the EBA's validator accepts except the ISO 3166-1 alpha-2 code "IE", in uppercase, with no whitespace.

## Why Excel files fail (the actual list)

After helping a few teams iterate to a clean submission, the rejection causes that appeared repeatedly:

**Wrong enumerated values.** The EBA taxonomy enforces enumerations for fields like country codes, currency codes, function categorisations, and criticality classifications. Excel templates accept anything you type. A free-text "Cloud Hosting Services" where the taxonomy expects the enumerated code for that service category is an immediate rejection.

**Datatype violations.** Dates need to be ISO 8601. Decimals need a specific precision. Booleans need to be lowercase `true`/`false`, not "Yes"/"No". A taxonomy validator catches these instantly; Excel doesn't surface them at all.

**Missing dimensional context.** Several Register of Information tables are dimensional — the same row of data is qualified by which financial entity it belongs to, which ICT service category, which provider tier. xBRL-CSV expresses these as columns referencing predefined member lists. Excel templates rarely round-trip them correctly.

**Encoding and delimiter mistakes.** xBRL-CSV requires UTF-8, comma-delimited (with strict quoting rules for fields containing commas). Excel on Windows defaults to UTF-16 LE or to system-locale encodings, and Excel on a German or French locale uses semicolons as delimiters by default. A spreadsheet that opens correctly on your machine can fail validation on the supervisor's side.

**Missing or malformed `report.json`.** Every xBRL-CSV submission needs an index file that pins the taxonomy entry point and lists the included CSVs. Some Excel-to-CSV exporters skip this file entirely; others generate one with a wrong entry point. Either way, the package fails to load before any data is even read.

## The stack that worked

The pipeline I ended up running, in order:

**Step 1: Download the EBA taxonomy package.** Currently version 4.0 for the Register of Information, available from the EBA website under "Reporting frameworks." It's a multi-megabyte ZIP. Don't unzip it casually — Arelle expects the package as-is.

**Step 2: Model your register data in a normalised structure.** Before generating any CSV, build a clean internal representation: contracts, ICT services, providers, sub-outsourcing chains, function classifications. Keep this independent of the taxonomy so you can regenerate output if the taxonomy version bumps.

**Step 3: Transform to per-table CSVs.** Each table in the taxonomy maps to one CSV. The column order is fixed by the taxonomy. Enumerated values must match exactly (case-sensitive, no padding). Decimals must use a dot, not a comma, regardless of locale.

**Step 4: Generate `report.json` and the metadata files.** This is the index. It points to the taxonomy entry point, lists every CSV in the package, and declares the reporting period. Get this wrong and Arelle can't even start.

**Step 5: Validate locally with Arelle.** Arelle is the open-source xBRL processor that the EBA uses as a reference. Install via pip (`pip install arelle-release`) or download the GUI. Load the EBA taxonomy package, then load your generated submission package. Arelle prints every formula violation, datatype mismatch, and missing dimensional context, with the exact row and column. Iterate until the validation log is empty.

**Step 6: Submit through the supervisor's portal.** Different national authorities have different submission portals. They run the same Arelle-based validation server-side. If your local validation is clean, the supervisor's check usually passes.

The reason this matters: the difference between "Arelle is clean locally" and "the supervisor accepts the file" is small but non-zero. The supervisor's validation pipeline may apply additional national-level rules. Build the iteration loop locally, then submit and expect zero or one round of corrections, not five.

## The errors that took me longest to debug

Three rejection messages that wasted me hours and might save you time:

**"Concept not found in DTS."** This usually means your `report.json` is pointing to the wrong taxonomy entry point. The EBA taxonomy has multiple entry points (one per reporting framework). Use the entry point that matches "Register of Information for ICT Third-Party Providers" specifically, not a generic supervisory one.

**Silent dimensional context errors.** Arelle sometimes prints a validation pass while the supervisor rejects with a dimensional error. This happens when a CSV row is missing a default dimension that the taxonomy allows to be implicit but the supervisor requires explicit. The fix: populate every dimension column on every row, even when the default would work, until the supervisor's validator stops complaining.

**Decimal precision mismatches.** If the taxonomy says a column accepts decimals to 4 places and you submit a value with 6, validation may pass locally but the supervisor's downstream processing truncates and complains. Round at the source, in your transform layer, to the exact precision the taxonomy declares.

## What I'd skip

- Vendors selling "Register of Information generators" as a feature on top of a generic compliance platform. Most produce technically-valid xBRL-CSV but charge per-submission and lock your register data inside their tenant.
- Letting an LLM write CSV rows directly. The format is too rigid; one wrong character invalidates the file. Use the LLM upstream (mapping, explanation, planning) and use deterministic code for the final write.
- Manual Excel-to-CSV pipelines for anything you're going to submit more than once. The first submission burns a week. The second should take an hour. Without automation, you're burning a week every time.

## What this looks like in practice

Once the pipeline is built, regenerating the register for a new submission period looks like this: update the source data (new contracts, terminated contracts, changed providers), run the transform, run Arelle, fix any flagged issues (usually one or two, often a new enumeration value the taxonomy added), submit. End-to-end, an hour or two, versus a week the first time.

Most of the leverage is in step 2 — keeping your internal representation clean and decoupled from the taxonomy. The CSV transform is the part that bumps when the taxonomy version changes; everything upstream stays stable.

## Sources

- EBA reporting frameworks page, Register of Information taxonomy package 4.0
- Arelle open-source xBRL processor, GitHub repository and documentation
- ESAs RTS on the templates for the Register of Information (Implementing Regulation (EU) 2024/2956)
- xBRL International, "xBRL-CSV: Comma Separated Values format for xBRL" specification
- Personal pipeline notes from one financial entity submission and several SaaS vendor side-submissions
