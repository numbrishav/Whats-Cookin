# What's Cookin — AI Team

## Team Roster

| Agent | Persona | Linear Label | Owns | Primary Deliverable |
|---|---|---|---|---|
| Program Manager | Maya Chen | `agent:pm` | Epics, milestones, issue sequencing | Ordered issue list with ACs and labels |
| Product Manager | Priya Nair | `agent:product` | Specs, acceptance criteria, UX behavior | Functional spec comment on issue |
| Lead Architect | Arjun Sharma | `agent:architect` | Types, module boundaries, data model | TypeScript interfaces + architecture decision |
| Senior Frontend | Leila Hassan | `agent:frontend` | React components, Tailwind, PWA, Dexie reads | Complete TSX component code |
| Senior Backend | Rahul Mehta | `agent:backend` | Dexie schema, Supabase, recommendation engine | Complete TypeScript engine/db code |
| Senior QA | Zara Ahmed | `agent:qa` | Flow quality, friction, personalization quality, Apple design compliance | Structured QA review comment on issue |

## Label Registry

### Agent labels (who owns the task)
- `agent:pm` — Program Manager (Maya)
- `agent:product` — Product Manager (Priya)
- `agent:architect` — Lead Architect (Arjun)
- `agent:frontend` — Frontend Engineer (Leila)
- `agent:backend` — Backend Engineer (Rahul)
- `agent:qa` — Senior QA Engineer (Zara) — `2042f010-fd88-4f2b-bc55-45538924fc8d`

### Type labels (what kind of task)
- `type:epic` — Top-level epic, owned by Program Manager
- `type:spec` — Functional spec, owned by Product Manager
- `type:arch-doc` — Architecture decision, owned by Architect
- `type:implementation` — Code task, owned by an engineer
- `type:review` — Review request, any agent

---

## Invocation Pattern

Three steps. Memorize once.

```
1. Read the persona file:
   Read /Users/Numb/Work/Whats Cookin/.agents/[agent-file].md

2. Read the project context (always both):
   Read /Users/Numb/Work/Whats Cookin/STRATEGY.md
   Read /Users/Numb/Work/Whats Cookin/temp/decisions-log.md

3. State the task:
   "You are now [Agent Name]. Linear task [WHA-XX]: [paste title + description].
    Produce your deliverable per your output standards.
    Post the output as a comment on Linear task [WHA-XX] using the API."
```

---

## Linear API Reference

**API Key:** `lin_api_REDACTED`
**Team ID:** `6f5f93d6-9d0a-46d3-ae37-4bf1c5c9f403`
**Endpoint:** `https://api.linear.app/graphql`

### Fetch a task by key (to get UUID and full context)
```graphql
query {
  issue(id: "WHA-XX") {
    id
    title
    description
    labels { nodes { name } }
    comments { nodes { body createdAt } }
  }
}
```

### Post a comment (deliverable) on a task
```graphql
mutation {
  commentCreate(input: {
    issueId: "UUID-FROM-FETCH-ABOVE"
    body: "DELIVERABLE_MARKDOWN_HERE"
  }) {
    success
    comment { id }
  }
}
```

### Create a child issue
```graphql
mutation {
  issueCreate(input: {
    teamId: "6f5f93d6-9d0a-46d3-ae37-4bf1c5c9f403"
    title: "Issue title"
    description: "Description"
    parentId: "PARENT_UUID"
    labelIds: ["LABEL_UUID_1", "LABEL_UUID_2"]
  }) {
    success
    issue { id identifier url }
  }
}
```

### Label UUIDs
```
agent:pm          → f15b2cd9-bf18-4de0-b8ba-8a5f1e336837
agent:product     → bd3eaf81-18a4-4358-a3bb-9b30850979a7
agent:architect   → 57cc49d2-d9cf-4071-9a28-8df18b2a2f7b
agent:frontend    → 406a165e-fc3b-426b-b760-a6539cb2e0e7
agent:backend     → a2b26473-2dd9-4e47-b292-5a70937a8afa
type:epic         → 5879d568-9348-4be4-bcea-9e9b854a6e47
type:spec         → 2339f2fc-852f-4718-b157-2a35c232aad8
type:arch-doc     → 3a7c5ee8-d199-4856-9168-5ac0d3b11515
type:implementation → 02e75bed-1828-4b14-a314-d54ead341304
type:review       → 2a60074c-c13e-40de-8225-bda7d5c1e4f5
```

---

## Handoff Chain (Workflow Sequence)

```
YOU → create a vague Epic in Linear (type:epic)
         ↓
MAYA (agent:pm)
  Input: Epic + STRATEGY.md phases
  Output: Ordered child issues with labels and ACs
  Posts: As comments on Epic, creates child issues via API
         ↓
PRIYA (agent:product)
  Input: Each issue labeled agent:product
  Output: Functional spec (behavior, ACs, out of scope)
  Posts: As comment on the issue
  Trigger: After Maya structures the issue
         ↓
ARJUN (agent:architect)
  Input: Issues labeled agent:architect + Priya's spec comment
  Output: TypeScript interfaces + architecture decision
  Posts: As comment on the issue
  Trigger: Before engineers start — gates implementation
         ↓
LEILA / RAHUL (agent:frontend / agent:backend)
  Input: Issue + Priya's spec comment + Arjun's arch comment
  Output: Complete implementation code
  Posts: As comment on the issue
  Trigger: After both spec and architecture are posted
```

**Rule:** Each agent reads the previous agent's Linear comment before producing output. This is mandatory — it is on every agent's pre-flight checklist.

---

## Ground Rules

1. Agents always cite the relevant `D-XX` decision code from `decisions-log.md` in their output.
2. Deliverables live in Linear as comments — not as files in the repo.
3. Agents never cross role boundaries. Frontend does not design data models. Backend does not write component code.
4. No agent designs for Phase 2/3 unless it irreversibly affects Phase 1 data models.
5. Every agent reads `STRATEGY.md` and `decisions-log.md` before producing output — no exceptions.
