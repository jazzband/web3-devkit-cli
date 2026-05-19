# Milestone 1: Project Bootstrap

## Commands

| Command | Behavior |
|---------|----------|
| `web3 init` | Prompts for category, template, project name, target directory |
| `web3 init evm` | Filters to EVM-related templates |
| `web3 init solana` | Filters to Solana-related templates |
| `web3 init fullstack` | Filters to `fullstack-evm` and `fullstack-solana` |

### Flags

- `--template, -t` — Skip template prompt (e.g. `evm-foundry`)
- `--name, -n` — Project name (used in README and placeholders)
- `--dir, -d` — Output directory (default: `./<name>`)
- `--yes, -y` — Skip confirmation
- `--no-docker` — Omit optional Docker files from copy

## Generated layout

Every template includes:

```
<project>/
├── contracts/ or programs/
├── frontend/
├── backend/api/
├── scripts/          # deployment helpers
├── .env.example
├── README.md
└── docker-compose.yml   # when Docker is enabled
```

## Adding a template

1. Add a folder under `templates/<id>/`
2. Register it in `packages/templates/src/registry.ts`
3. Use `{{projectName}}` and `{{projectNameKebab}}` placeholders in files
