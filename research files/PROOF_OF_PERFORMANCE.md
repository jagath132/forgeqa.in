# ForgeQA Proof of Performance

**Purpose:** Research and benchmark protocol  
**Status:** Proposed protocol; no performance measurements are claimed by this document

## Objective

Measure whether ForgeQA's core QA-authoring workflow performs reliably and efficiently under representative usage. This document defines how to collect evidence; it is not evidence that a target has already been met.

## Benchmark scenarios

| Scenario | Input | Measures |
|---|---|---|
| Requirement-to-PRD | Short, medium, and long product descriptions | Time to first token, total generation time, completion/error rate |
| Requirement-to-test-cases | Fixed requirements with expected edge cases | Latency, output completeness, reviewer-rated correctness |
| Knowledge-assisted generation | Requirement plus a fixed document set | Retrieval latency, context relevance, end-to-end latency |
| Concurrent generation | Same workload under increasing concurrent users | Throughput, p50/p95 latency, error and timeout rates |
| Export | Generated artifact exported to supported formats | Export time, file validity, content preservation |

## Measurement protocol

1. Record the exact commit, deployment, runtime, database region, network conditions, provider/model, and relevant configuration.
2. Use a versioned, non-sensitive dataset with short, medium, and long inputs. Keep the same dataset across comparison runs.
3. Warm up the service, then run each scenario at least 30 times for latency reporting. Record failures separately; do not discard slow or failed runs.
4. Report median (p50), p95, maximum, throughput, timeouts, and error rate. Report sample count and date with every value.
5. For output quality, use blinded review and a predefined rubric. Latency alone does not establish acceptable performance.
6. Repeat the run after meaningful infrastructure, prompt, provider, or model changes.

## Proposed performance objectives

The existing ForgeQA PRD proposes a target of generating 50 test cases in under two minutes. Treat that as a candidate objective, not a verified result. Before acceptance, define the exact prompt size, model, output format, test environment, and whether elapsed time includes human review.

Other objectives (concurrency, p95 latency, quality score, and failure-rate thresholds) should be agreed by the research owner before testing. Do not infer them from this protocol.

## Results table

| Run/date | Revision | Provider/model | Scenario | Sample count | p50 | p95 | Error rate | Quality result | Notes |
|---|---|---|---|---:|---:|---:|---:|---|---|
| Not run | — | — | — | — | — | — | — | — | No benchmark results recorded |

## Interpretation

Separate provider/API latency from ForgeQA server and browser time. Include rate limiting, retries, token/output size, and failures in the analysis. Any published conclusion should state the tested environment and sample limits; do not generalize a single-provider test to all supported providers.
