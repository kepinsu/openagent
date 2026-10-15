# OpenAgent V1 archive

This is a frozen copy of the pre-migration working tree, including its existing
local edits. `archive-manifest.json` records the source commit and SHA-256 of
each original file. `README.pre-migration.md` preserves the original guide.

Use this directory as the target of your `.opencode` symlink on V1 machines:

```sh
# Run in the consuming project, only when .opencode does not already exist.
ln -s /absolute/path/to/openagent/.opencodev1 .opencode
```

For global installation, use the configuration directory appropriate to your
V1 installation as the link location. Keep the contents' `.opencode/...` paths:
they refer to the consuming project's link, not to this archive's name.

Install the archived dependencies with `npm ci --prefix .opencodev1` from this
repository if needed. Personal `opencode.json(c)`, installed dependencies and
credentials are intentionally not archived. Configure providers/MCP separately
on each machine; the archived profiles are templates, not auto-loaded configs.

The snapshot already contained some V2-labelled documentation and path-qualified
agent IDs. It preserves that state rather than claiming a newly tested V1
release. The V1 plugin implementation and dependency are retained. Validate the
snapshot against your machine's V1 version before relying on it.

Do not point V1 at the active `.opencode/` tree: it now uses native V2 syntax and
the V2 plugin API. This archive receives no automatic updates from that tree.
