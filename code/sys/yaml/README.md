# YAML
Tools for working with [YAML](https://yaml.org/spec/1.2.2/) parsing, serialization, and schema-driven data structures.

## Overview
This package provides a unified abstraction for YAML parsing, serialization, and schema validation pipelines.

### Structure
- **(base)** — core parser and helpers (`@sys/yaml` ← `@sys/yaml/core`)
- **/slug** — semantic YAML layer for Slug definitions (`@sys/yaml/slug`)

### Goals
- Single canonical YAML API for all sys modules.
- Strict type alignment with `@sys/schema`.
- Zero drift between schema, types, and serialized form.

### Status
🐷 Refactor in progress — consolidating core YAML and Slug YAML under this module.
