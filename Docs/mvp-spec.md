MVP Specification – STORYBOARD & BUDGET COPILOT
1. Product overview
Title: STORYBOARD & BUDGET COPILOT
Tagline: An AI assistant that helps small creators turn a rough idea into a structured storyboard, production checklist, and budget estimate.

Goal (MVP):
Enable solo creators and small teams to input a rough project idea and receive, in one place:

A scene‑based storyboard.

A production checklist (tasks, assets, simple timeline).

A basic, editable budget estimate.

This MVP targets the July “Reimagine Creative Industries with AI” theme of the AI Builders Challenge with IBM Bob.

2. Core user flows (MVP)
2.1 Idea → Storyboard
User opens the web app and sees an “Idea Input” form.

User enters:

Project title.

Short description of the idea (1–2 paragraphs).

Target platform (YouTube, Instagram, TikTok, podcast, other).

Target duration (e.g., 5–10 minutes).

Style (tutorial, vlog, narrative, interview).

Backend validates input and, if needed, returns clarifying questions (e.g., tone, target audience).

AI generates a storyboard:

5–12 scenes/segments.

Each scene has: title, description, suggested visuals, key talking points.

Frontend displays the storyboard as a list or cards, allowing the user to scroll and review.

2.2 Storyboard → Production checklist
From the generated storyboard, user clicks “Generate production checklist.”

Backend sends storyboard JSON to the AI layer.

AI returns a checklist including:

Tasks (e.g., script draft, filming, B‑roll, editing, thumbnail creation, publishing).

Roles (creator, editor, designer; default to solo creator where applicable).

A simple timeline (pre‑production, production, post‑production phases).

Frontend displays the checklist in a structured table or list.

2.3 Idea + parameters → Budget estimate
User provides a few budget‑related parameters:

Location type (home/indoor, outdoor, studio).

Equipment level (basic, intermediate, advanced).

Crew size (solo, 2–3 collaborators).

Estimated number of shooting days.

Backend passes these parameters, plus the original idea, to the AI layer.

AI generates a budget estimate:

Categories: equipment, locations, talent/crew, post‑production, marketing/distribution, contingency.

For each category: low and high cost estimate, notes, and assumptions.

Frontend renders a simple budget table with total low/high ranges.

2.4 Refinement and export
User can adjust or regenerate:

“Regenerate storyboard with fewer scenes”

“Make the tone more humorous”

“Constrain budget to low‑cost options”

Frontend offers a “Copy to clipboard” or “Download as JSON/text” button for storyboard and budget.

3. Feature list
3.1 Must‑have features (for MVP) — ALL COMPLETE ✅
Web UI with:

Idea input form (title, description, platform, duration, style, budget parameters). ✅

Display of storyboard, checklist, and budget. ✅

Mobile-responsive layout with accessible tap targets. ✅

Backend endpoints:

POST /api/storyboard – generate storyboard from idea + parameters. ✅

POST /api/checklist – generate production checklist from storyboard JSON. ✅

POST /api/budget – generate budget estimate from idea + budget parameters. ✅

POST /api/refine – refine any generated output with a follow-up instruction. ✅

AI integration:

IBM Granite via watsonx.ai producing structured JSON for storyboard, checklist, and budget. ✅

Robust JSON parsing handling prose preambles, trailing notes, and markdown fences. ✅

Basic refinement:

Refine panel allows follow-up prompts on storyboard, checklist, or budget. ✅

Simple export:

Copy to clipboard and download as JSON for all three outputs. ✅

3.2 Stretch features (future, not required for MVP)
Project saving (local storage or lightweight database).

Export budget to CSV/Excel for detailed financial analysis.

Content‑type templates (tutorial, vlog, interview, narrative short).

Analytics summary (number of scenes, estimated total cost, distribution of costs by category).

4. Tech stack
4.1 Frontend
Framework: React + Vite (TypeScript).

Key components (all in Frontend/PlanPage.tsx):

StoryboardView – displays generated scenes with numbered badges, visuals, and talking points.

ChecklistView – displays tasks in phased tables (Pre-production, Production, Post-production).

BudgetView – displays cost categories and totals in a responsive table.

Refine panel – sends follow-up instructions to adjust any generated output.

4.2 Backend
Python + FastAPI.

REST API endpoints:

POST /api/storyboard – generate storyboard from idea + parameters.

POST /api/checklist – generate production checklist from storyboard JSON.

POST /api/budget – generate budget estimate from idea + budget parameters.

POST /api/refine – refine any previously generated output with a plain-English instruction.

Backend responsibilities:

Validate user input (Pydantic models with field validators).

Build prompts for the AI model using Granite chat format.

Call the watsonx.ai API and robustly parse JSON responses.

Return structured data to the frontend.

4.3 AI layer
Model: IBM Granite (ibm/granite-3-8b-instruct) via watsonx.ai HTTP API.

Authentication: IBM Cloud IAM token exchange using WATSONX_API_KEY.

Prompt strategy:

Use Granite chat format (<|user|> / <|assistant|>) with a '{' primer to force JSON continuation.

Describe required JSON keys in plain English — no schema examples in prompts (prevents model from describing instead of generating).

JSON parsing is handled by a brace-depth walker that extracts the first complete JSON object and discards any trailing model commentary.

IBM Bob in VS Code is used to:

Design and refine prompt templates.

Generate and refactor API handlers, data models, and parsing logic.

Debug integration issues and review code quality.

5. Data structures (JSON)
5.1 Storyboard JSON (example schema)
json
{
  "project_title": "Sample Video",
  "platform": "YouTube",
  "duration_minutes": 8,
  "style": "tutorial",
  "scenes": [
    {
      "id": 1,
      "title": "Opening hook",
      "description": "Introduce the problem and why the viewer should care.",
      "visuals": ["talking head", "on-screen text"],
      "key_points": [
        "State the problem",
        "Promise the solution",
        "Briefly preview what is coming"
      ]
    }
  ]
}
5.2 Production checklist JSON (example schema)
json
{
  "phases": [
    {
      "name": "Pre-production",
      "tasks": [
        {
          "id": "PP1",
          "description": "Write script draft",
          "role": "Creator",
          "estimated_time_hours": 2
        }
      ]
    },
    {
      "name": "Production",
      "tasks": [
        {
          "id": "P1",
          "description": "Record main video",
          "role": "Creator",
          "estimated_time_hours": 3
        }
      ]
    }
  ]
}
5.3 Budget estimate JSON (example schema)
json
{
  "currency": "USD",
  "categories": [
    {
      "name": "Equipment",
      "low_estimate": 0,
      "high_estimate": 150,
      "notes": "Assumes basic camera or smartphone and basic lighting."
    },
    {
      "name": "Locations",
      "low_estimate": 0,
      "high_estimate": 100,
      "notes": "Assumes home or public spaces without permit fees."
    }
  ],
  "total_low": 0,
  "total_high": 250
}
6. Non‑functional MVP considerations
Simplicity:

Focus on a single‑page or minimal‑page UI; reduce friction for first‑time users.

Reliability:

Enforce JSON‑only outputs from the AI to avoid parsing errors.

Handle errors gracefully (e.g., show a message if AI call fails, allow retry).

Performance:

Keep prompts concise to maintain acceptable response times.

Explainability:

Include brief notes in the UI explaining how estimates were generated and that they are indicative, not guarantees.
