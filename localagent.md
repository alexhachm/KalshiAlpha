# Local Agent Task Queue

This file is the inbox for the autonomous agent storm. Add work by appending
a task block, commit, and push to the `localagent` branch. The watcher picks
up new blocks on every poll and dispatches a parallel agent for each.

## Format

```
## Task: <short title>
<free-form body — goals, files, constraints>
<more lines…>
```

A task block runs from its `## Task:` header until the next `## ` heading
(or EOF). Each task is identified by a content hash; editing a task body
produces a new ID, so the watcher will re-dispatch it.

Processed IDs are tracked locally in `.localagent/processed.txt` (gitignored).

## Tasks

<!-- Append new `## Task:` blocks below this line. -->
