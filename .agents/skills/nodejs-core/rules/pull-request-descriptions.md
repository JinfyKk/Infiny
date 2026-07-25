---
name: pull-request-descriptions
description: Node.js core pull request title and description style derived from merged 2024-2025 PRs
metadata:
  tags: pull-request, description, writing, contributing, nodejs-core
---

# Node.js Core Pull Request Descriptions

Use the same terse, subsystem-first style as Node.js commit messages. A routine
pull request should help a reviewer understand the change without making them
read a generic template.

## Title

Write the title as a candidate commit subject:

```text
subsystem[,subsystem...]: imperative description
```

Keep it lowercase where possible, prefer 50 characters or fewer, never exceed
72 characters, and do not end it with punctuation. See
[commit-messages.md](commit-messages.md) for subsystem and capitalization rules.

## Tone and voice

Write for maintainers deciding whether the change should land:

- Be concise, technical, and natural rather than formal or promotional.
- Lead with concrete behavior. Do not repeat the title in a longer sentence.
- Use active voice and the exact names of APIs, flags, errors, and subsystems.
- Explain the problem and reasoning, not the effort spent or files touched.
- State uncertainty, limitations, and trade-offs plainly when they matter.
- Use first person only when recording an actual decision or question, such as
  `I kept this experimental because ...`; do not use it as a preamble.
- Do not claim tests passed, performance improved, or compatibility was
  preserved unless the evidence is available.

Avoid release-note language and inflated claims such as `comprehensive`,
`robust`, `seamless`, `significantly improves`, or `This PR enhances ...`.
Avoid canned openings (`This PR aims to ...`) and closings (`This is now ready
for review`).

## Routine description

Start immediately with the context missing from the title. Use this order:

1. Describe the previous behavior or problem.
2. Describe the changed behavior and why it is the right fix.
3. Add evidence, a limitation, or a design choice only when it helps review.

A one-sentence description is enough when the reason is obvious. Most routine
PRs need no more than one or two short paragraphs.

```markdown
Concurrent close() calls could start more than one native close operation.
The closing state is now recorded before awaiting the first operation, so later
calls share its result.

Fixes: https://github.com/nodejs/node/issues/12345
```

Do not add boilerplate headings such as `Summary`, `Changes`, `Benefits`, or
`Test plan` to a small pull request. Do not repeat the file list, narrate each
edit, thank reviewers, or add a generic statement that tests pass.

## Add detail only when it helps review

- **Several behaviors or caveats:** use a short bullet list.
- **New or changed API:** explain observable behavior, limitations, and why it
  belongs in core. Include a focused example when it clarifies the contract.
- **Bug fix:** identify the previous failure and why the fix addresses it.
- **Performance claim:** include the benchmark command or workload, relevant
  environment, before/after values with units, and enough runs or variation to
  judge noise.
- **Tests:** bug fixes and features must include tests. Mention testing in the
  description only when the validation is manual, platform-specific,
  non-obvious, intentionally omitted, or otherwise useful to the reviewer.
- **Breaking change:** explain why it is needed, the exact behavior that breaks,
  and the situation that triggers the break.
- **Large PR:** follow Node.js's large-PR guide; the normal terse format is not a
  reason to omit required design and dependency detail.

A structured body is appropriate for a genuinely complex change:

```markdown
The new experimental API exposes the module compile cache to tooling. Tools can
enable caching without requiring an environment variable.

The API:

- uses NODE_COMPILE_CACHE when it is already set;
- falls back to a directory under os.tmpdir();
- can be disabled with NODE_DISABLE_COMPILE_CACHE.

On `<environment>`, `<benchmark command>` changed median startup time from
42.1 ms to 35.8 ms over 30 runs.

Refs: https://github.com/nodejs/node/issues/12345
```

## References and generated metadata

Use full URLs on standalone lines at the end of the authored description:

- `Fixes: <issue-url>` when landing should close the issue.
- `Refs: <issue-or-PR-url>` for relevant context that should not be closed.
- Use both when both meanings apply; otherwise omit them.

Do not add `PR-URL:`, `Reviewed-By:`, landing commit hashes, commit-queue logs,
or backport metadata to the PR description. Those belong to the landing or
collaborator workflow. Do not copy the repository's hidden HTML template or
Developer Certificate text into the visible body.

## Create the PR with `gh`

Write the body to a file so Markdown and newlines are preserved:

```bash
cat > /tmp/pr-body.md <<'EOF'
Concurrent close() calls could start more than one native close operation.
The closing state is now recorded before awaiting the first operation, so later
calls share its result.

Fixes: https://github.com/nodejs/node/issues/12345
EOF

gh pr create \
  --repo nodejs/node \
  --base main \
  --head USER:BRANCH \
  --title "fs: avoid closing file handles twice" \
  --body-file /tmp/pr-body.md
```

## Evidence for the house style

The observed sample contains 3,393 non-routine, human-authored merged PRs
opened in 2024 and 2025 and targeting `main`. Hidden template comments,
non-human authors, and mechanical update PRs were excluded:

- 97.0% of titles used a subsystem prefix; 98.7% of those began lowercase
  after the colon, and 98.5% of all titles were at most 72 characters.
- 94.6% had a visible description.
- The median visible body was 32 words and 3 lines.
- Only 3.1% used headings, 8.9% used bullets, and 1.8% used visible checklists.
- 23.0% mentioned tests or CI; most routine PRs relied on the test diff and CI
  rather than a ceremonial test section.
- 25.9% included at least one full-URL `Fixes:` or `Refs:` line.

The majority pattern is direct prose, not a multi-section template. Longer
feature and performance PRs are legitimate exceptions.

## Upstream sources

- [Pull request template at the analyzed revision](https://github.com/nodejs/node/blob/cf882a79042cba4146acfdb7993b6a97c21e7239/.github/PULL_REQUEST_TEMPLATE.md)
- [Pull request guide at the analyzed revision](https://github.com/nodejs/node/blob/cf882a79042cba4146acfdb7993b6a97c21e7239/doc/contributing/pull-requests.md)
- [Large pull request guide](https://github.com/nodejs/node/blob/cf882a79042cba4146acfdb7993b6a97c21e7239/doc/contributing/large-pull-requests.md)
