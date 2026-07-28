# STORYBOARD & BUDGET COPILOT

An AI assistant that helps small creators turn a rough idea into a structured storyboard, production checklist, and budget estimate, so they can move from concept to production with confidence.

## 1. Challenge track

- **Program:** AI Builders Challenge with IBM Bob  
- **Monthly theme:** July – Reimagine Creative Industries with AI  
- **Track:** Creative Industries – AI tools for content creation and production planning  

## 2. Problem statement

Small creators and solo content producers often struggle to turn vague ideas into actionable production plans with realistic budgets and timelines. They juggle creative brainstorming, script writing, asset planning, and cost estimation in scattered documents and spreadsheets, with little automation or guidance. This leads to missed deadlines, overspending, under‑utilized assets, and stalled projects.

STORYBOARD & BUDGET COPILOT addresses this by transforming a rough idea into a structured storyboard, production checklist, and budget estimate. The copilot guides creators from concept to execution with AI‑generated scenes, tasks, resources, and cost insights.

## 3. User persona

**Primary persona: Solo content creator**

- Runs a small YouTube/Instagram/TikTok channel, often working alone.  
- Has many ideas but limited time and budget.  
- Uses basic tools (Docs, Canva, simple spreadsheets) without formal project management.  
- Needs help turning ideas into clear plans without hiring a producer.

The copilot helps by:
- Turning a rough idea into a storyboard with scenes and key talking points.  
- Generating a production checklist (tasks, assets, roles, simple timeline).  
- Providing a basic, editable budget estimate by category.

## 4. Solution overview

AI STORYBOARD & BUDGET COPILOT is a web‑based tool where creators:

1. Enter a rough description of their project idea and basic parameters (duration, platform, style).  
2. Receive an AI‑generated storyboard with scenes, visual suggestions, and key narrative beats.  
3. Generate an AI‑derived production checklist based on the storyboard.  
4. View a simple budget estimate organized by categories (equipment, locations, talent, post‑production, marketing).  
5. Refine results with follow‑up prompts (shorter video, different tone, different budget level) and export the plan.

The goal is to reduce planning friction and make professional‑style production planning accessible to small creators.

## 5. Features (MVP)

- Text input form for project idea and basic parameters.  
- AI‑generated storyboard (scenes, descriptions, visuals, talking points).  
- AI‑generated production checklist (tasks, roles, simple timeline).  
- AI‑generated budget estimate with cost categories and ranges.  
- Simple refinement prompts for regenerating or adjusting the plan.  
- Copy/export options for storyboard and budget (e.g., copy to clipboard, download as text/JSON).

Planned stretch features:
- Saving multiple projects per user.  
- Export to CSV/Excel for detailed budgeting.  
- Templates by content type (tutorial, vlog, interview, narrative short).

## 6. Architecture and tech stack

**Frontend:**
- React + Vite (TypeScript)
- Core components: `StoryboardView`, `ChecklistView`, `BudgetView` in `Frontend/PlanPage.tsx`.

**Backend:**
- Python + FastAPI REST API:
  - `POST /api/storyboard` – generate storyboard from idea.
  - `POST /api/checklist` – derive checklist from storyboard.
  - `POST /api/budget` – estimate budget based on idea and parameters.
  - `POST /api/refine` – refine any output with a follow-up instruction.

**AI layer:**
- IBM Granite (`ibm/granite-3-8b-instruct`) via watsonx.ai API.
- Prompt templates using Granite chat format to produce structured JSON outputs.

See [`docs/mvp-spec.md`](mvp-spec.md) for a detailed specification.

## 7. AI approach

The AI approach focuses on:

- Structured generation: All AI outputs are produced as JSON with scenes, tasks, and cost categories to support predictable rendering.  
- Domain‑specific prompts: Prompts are tailored to solo content creation workflows (vlogs, tutorials, narrative shorts) and lightweight budgeting.  
- Iterative refinement: Users can send follow‑up prompts to adjust tone, length, or budget levels.

IBM Bob is used to:
- Analyze the MVP specification and propose architecture changes.  
- Generate starter code for API endpoints and React components.  
- Refactor and optimize code for clarity and maintainability.  
- Help design and test prompt templates and JSON schemas.

## 8. How IBM Bob is used

This project uses IBM Bob in Visual Studio Code as an AI SDLC partner:

- **Plan mode:** To create an implementation plan from the MVP spec (features, endpoints, components).  
- **Agent mode:** To generate boilerplate code for API routes, data models, and basic error handling.  Also, to refactor code, suggest tests, and improve prompts.
- **Ask mode:** To clarify integration details (e.g., connecting to the chosen LLM API, handling JSON responses).  

The README and documentation reflect how IBM Bob contributed to planning, coding, and optimization for the prototype.

## 9. Getting started

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Python | 3.9+ | [python.org](https://www.python.org/downloads/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| IBM Cloud account | — | [cloud.ibm.com](https://cloud.ibm.com) |
| watsonx.ai project | — | [dataplatform.cloud.ibm.com](https://dataplatform.cloud.ibm.com) |

---

### 1. Clone the repository

```bash
git clone https://github.com/T4Tobe/smart-story.git
cd smart-story
```

---

### 2. Configure environment variables

Copy the example file and fill in your real credentials:

```bash
cp .env.example .env
```

Open `.env` and set:

```
WATSONX_API_KEY=your-ibm-cloud-api-key
WATSONX_PROJECT_ID=your-watsonx-project-id
WATSONX_URL=https://us-south.ml.cloud.ibm.com
```

- **API key** → [cloud.ibm.com/iam/apikeys](https://cloud.ibm.com/iam/apikeys) → Create
- **Project ID** → [dataplatform.cloud.ibm.com](https://dataplatform.cloud.ibm.com) → your project → Manage → General

---

### 3. Set up the Python backend

```bash
# Create and activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1
# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

### 4. Set up the frontend

```bash
npm install
```

---

### 5. Run the app

Open **two terminals** in the project root:

**Terminal 1 — Backend**
```bash
uvicorn Backend.main:app --reload
```
Runs at `http://localhost:8000`

**Terminal 2 — Frontend**
```bash
npm run dev
```
Runs at `http://localhost:3000`

Then open **http://localhost:3000** in your browser.

---

### API reference

The backend exposes four endpoints (full interactive docs at `http://localhost:8000/docs`):

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/storyboard` | Generate a scene-based storyboard |
| POST | `/api/checklist` | Generate a production checklist from a storyboard |
| POST | `/api/budget` | Generate a budget estimate |
| POST | `/api/refine` | Refine any generated output with a follow-up instruction |

---

## 10. Roadmap

- [x] Core storyboard, checklist, and budget generation
- [x] Refinement prompts
- [x] Export / copy to clipboard
- [x] Mobile-responsive UI
- [ ] Save and load multiple projects
- [ ] Export budget to CSV/Excel
- [ ] Content-type templates (tutorial, vlog, interview, narrative)
- [ ] Demo video for AI Builders Challenge submission
