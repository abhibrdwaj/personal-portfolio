---
kind: project
title: Personal Projects
---

# Personal Projects

## AI Inference Guardrail

I engineered a low-latency validation layer in Rust to intercept and sanitize LLM prompts, preventing PII leakage and prompt-injection attacks through regex-based policy enforcement. It achieves sub-millisecond median latency under a 200 req/sec load using Tokio for async I/O and zero-copy JSON parsing, and is containerized as a Kubernetes sidecar proxy.

## Custom Memory Allocator and Thread Library

I engineered a custom memory allocator (First Fit policy, doubly-linked free-list) and a thread library with MLFQ and Round Robin scheduling in C. I validated library integrity via Bash-automated unit tests achieving 100% memory-leak detection across the test suite, and prevented deadlocks and segmentation faults through Valgrind audits.

## CoCo AI

I developed a React Native mobile health assistant using AWS Bedrock, implementing a human-in-the-loop ticketing system to escalate low-confidence responses and mitigate hallucinations. I architected a RAG pipeline on AWS (Glue, Kendra, S3) with Server-Sent Events for real-time streaming notifications. This project won the Rutgers Health Hackathon.
