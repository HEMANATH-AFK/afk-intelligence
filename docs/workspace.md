# Workspace Scanning & Retrieval Services

This document describes how the AFK-Intelligence backend indexes the developer's local codebase, performs AST extraction, and retrieves relevant code snippets.

## 1. Workspace Scanning (`scanner.py`)

The scanner recursively crawls directory paths, skipping ignored files (from `.gitignore`), and index structural representations of code files.
- **AST Parsing:** Parses code files to build functional models (methods, classes, imports).
- **Metadata Tagging:** Attaches file properties, paths, and size footprints.

---

## 2. Code Chunking (`chunking.py`)

To fit source code into local LLM context windows (such as Gemma's context constraints), files are chunked into smaller semantic fragments.
- **Fixed-Size Chunking with Overlap:** Ensures code blocks are not sliced mid-logic.
- **Syntactic Boundaries:** Detects function and class declarations to preserve contextual boundaries.

---

## 3. Embedding and Retrieval (`retrieval.py`)

Once chunked, the content is vector-embedded using `nomic-embed-text` and query-indexed.
- **Semantic Querying:** Finds matching code segments across the codebase based on search relevance.
- **Context Injection:** Feeds matching fragments as context inputs directly to the specialized agents.
