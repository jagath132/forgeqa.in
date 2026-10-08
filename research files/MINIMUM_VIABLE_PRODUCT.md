# ForgeQA Minimum Viable Product

**Purpose:** Research proposal for an MVP scope  
**Status:** Candidate scope for evaluation; not a product roadmap or implementation commitment

## Product outcome

Help a QA engineer move from a written requirement to a reviewable, reusable test artifact with less manual drafting, while keeping the engineer in control of correctness and export.

## Target research user

A QA engineer or developer who receives feature requirements and needs to prepare test coverage for a web application. Validate this persona through interviews before treating it as a confirmed market segment.

## MVP journey

1. Sign in and configure one supported AI provider.
2. Enter a requirement and optional product/module context.
3. Generate structured test cases.
4. Review, edit, and select the useful cases.
5. Export or save the resulting artifact.
6. See a clear failure message and retry when generation or export fails.

## Candidate must-haves

- Secure account access and provider-key setup.
- Requirement input with basic validation.
- One stable provider integration for the initial research cohort.
- Structured, streamable output with visible generation errors.
- Human review and editing before an artifact is treated as complete.
- A dependable export path and a way to retrieve recent work.
- Basic usage and failure telemetry that avoids storing secrets.

## Defer from the MVP study

- Multi-provider comparison, until one end-to-end path is reliable.
- Billing plans, seat purchasing, and subscription administration.
- Enterprise team administration, SSO, and advanced audit workflows.
- Automated crawling and build-artifact regression, unless interviews show they are essential to the first user outcome.
- Claims of autonomous or production-ready test execution without a separate validation study.

These are research scope suggestions; the current repository may contain additional functionality.

## Research questions

- Can a participant complete the journey without assistance?
- Which generated sections require the most correction?
- Does the artifact save meaningful drafting time compared with the participant's current process?
- Which export format is required for adoption?
- Is configuring a provider key acceptable to the intended users?

## MVP evaluation signals

Measure task completion, time to first usable artifact, number and type of reviewer edits, export success, generation failure rate, and participant-reported usefulness. Define sample size and thresholds with the research owner before recruiting participants. Do not treat feature count or model response time as proof of product value.

## Out of scope

This document supports research and prioritization only. It does not authorize removal of production billing services, changes to customer plans, or claims about commercial readiness.
