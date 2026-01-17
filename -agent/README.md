# Agent Configuration System

This is the root AGENTS.md file. All agent behavior is governed by this file unless explicitly scoped.

See ./-agent/README.md for available agent configurations.

## Structure
Each agent subdirectory contains:
- `config.json` - Agent settings, preferences, and tool configuration
- `preferences.md` - Behavioral guidelines and workflow preferences

## Available Agents
- `./opencode/` - OpenCode design sessions

### Auto-Load
I will read `./opencode/config.json` automatically when starting in repo root.