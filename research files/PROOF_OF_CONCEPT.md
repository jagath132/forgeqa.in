# ForgeQA Proof of Concept

**Purpose:** Research and feasibility assessment  
**Status:** Proposed validation plan; no results are claimed by this document  
**Related material:** `PROOF_OF_CONCEPT.docx`, `PRD.md`, and `TEST_PLAN.md`

## Research question

Can ForgeQA turn a software requirement into reviewable QA artifacts, while preserving enough requirement context for a QA engineer to verify the result and export it into a standard workflow?

## Prototype scope

Validate one end-to-end workflow:

1. Enter a written requirement or provide a target application for exploration.
2. Select an AI provider configured for the account.
3. Generate a structured PRD or test artifacts.
4. Review the streamed result and correct it as needed.
5. Export or save the approved result for downstream QA work.

The current implementation provides relevant prototype paths in `src/pages/PrdGeneratorPage.tsx`, `server/prd/generator.js`, `server/ai/gemini.js`, and the knowledge-base APIs. The existence of these paths establishes implementation scope, not successful research validation.

## Hypotheses and proposed checks

| Hypothesis | Research check | Evidence to retain |
|---|---|---|
| A requirement can produce a complete, readable artifact | Run a fixed set of representative requirements through the same workflow | Input, model/provider, timestamp, output, completion/error status |
| Generated content can be reviewed and corrected by a QA engineer | Ask reviewers to identify unsupported or missing requirements | Annotated output and reviewer notes |
| Domain documents improve relevance when supplied as context | Compare equivalent runs with and without retrieved project context | Source documents, retrieved excerpts, paired outputs, rubric scores |
| The output fits a standard QA handoff | Export and open the artifact in the intended downstream format | Exported file and import/open result |

## Suggested acceptance criteria

- The core workflow completes without an application error for each test input.
- Generated claims can be traced to the supplied requirement or are explicitly labeled as assumptions.
- Reviewers can identify and correct omissions before using an artifact.
- The exported artifact opens in the selected format and retains its content.
- Errors and incomplete generations are visible rather than presented as successful output.

These criteria are proposed for the study; they have not been measured here.

## Research method

Use a small, consented set of non-confidential requirements covering a happy path, validation rules, permissions, and failure handling. Keep provider, model, prompt, and settings fixed within each comparison. Have at least two QA reviewers score completeness, correctness, traceability, and edit effort using the same rubric. Preserve raw inputs and outputs so another researcher can reproduce the evaluation.

## Limitations and safeguards

- Model output is probabilistic; a successful response is not proof of correctness.
- A small prototype sample cannot establish enterprise readiness, general accuracy, or production reliability.
- Do not use customer secrets, credentials, or personal data in research prompts.
- Numerical claims in other draft material should be treated as hypotheses until supported by a reproducible study.

## Result record

For each run, record the study ID, date, software revision, provider/model, input ID, configuration, duration, completion status, reviewer scores, defects, and artifact location. Leave results blank until the experiment is conducted.
