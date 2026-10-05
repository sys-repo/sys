# 🧩 @sys/skills

`@sys/skills` is a JSR package for publishing bundled Agent Skill artifacts as versioned library data.

It provides a stable surface for discovery, lazy per-skill access, materialization, and provenance-aware metadata, while treating `SKILL.md` as source input rather than the primary programmatic contract.

`@sys/skills/core` is the tight kernel for bundled skill artifact access and materialization, keeping the registry surface small and the operational mechanics explicit.

This makes skill adoption easier to audit, version, and load programmatically without expanding raw markdown into an implicit trust boundary.


### References

- [agentskills.io](https://agentskills.io) - emerging ecosystem convention for file-based agent skills centered on `SKILL.md`
