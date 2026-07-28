from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import List, Optional
import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()  # reads .env from the project root into os.environ

app = FastAPI(
    title="AI Storyboard & Budget Copilot",
    description="Turns a rough creator idea into a storyboard, production checklist, and budget estimate.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# IBM Granite / watsonx.ai configuration
# ---------------------------------------------------------------------------
WATSONX_API_KEY   = os.getenv("WATSONX_API_KEY")
WATSONX_PROJECT   = os.getenv("WATSONX_PROJECT_ID")
WATSONX_URL       = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
GRANITE_MODEL     = "ibm/granite-3-8b-instruct"

# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

async def _get_iam_token() -> str:
    """Exchange the watsonx API key for a short-lived IAM bearer token."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://iam.cloud.ibm.com/identity/token",
            data={
                "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                "apikey": WATSONX_API_KEY,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=30,
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"IAM token error: {resp.text}")
    return resp.json()["access_token"]


async def _call_granite(prompt: str) -> str:
    """
    Send a prompt to IBM Granite via watsonx.ai and return the raw text response.
    Instructs the model to output JSON only.
    """
    if not WATSONX_API_KEY or not WATSONX_PROJECT:
        raise HTTPException(
            status_code=500,
            detail="WATSONX_API_KEY and WATSONX_PROJECT_ID environment variables must be set.",
        )

    token = await _get_iam_token()

    payload = {
        "model_id": GRANITE_MODEL,
        "project_id": WATSONX_PROJECT,
        "input": prompt,
        "parameters": {
            "decoding_method": "greedy",
            "max_new_tokens": 4096,
            "stop_sequences": ["```"],
        },
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{WATSONX_URL}/ml/v1/text/generation?version=2023-05-29",
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=60,
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Granite API error: {resp.text}")

    return resp.json()["results"][0]["generated_text"].strip()


def _parse_json(raw: str, primed: bool = True) -> dict:
    """
    Robustly extract and parse the first complete JSON object or array from
    the model output, handling:
    - primed prompts (response continues after the '{' we injected)
    - prose preambles before the JSON
    - trailing prose/notes after the closing bracket
    - markdown code fences
    """
    cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    # In primed mode the model continues after the '{' we put in the prompt,
    # so prepend it back unless the model happened to repeat it.
    if primed and cleaned and cleaned[0] not in "{[":
        cleaned = "{" + cleaned

    # In non-primed mode scan forward to find the first { or [
    if not primed or (cleaned and cleaned[0] not in "{["):
        start = next((i for i, c in enumerate(cleaned) if c in "{["), None)
        if start is not None:
            cleaned = cleaned[start:]

    # Walk the string tracking brace/bracket depth to find where the top-level
    # JSON structure ends, then discard everything after it (e.g. model notes).
    def _extract_json_boundary(s: str) -> str:
        depth = 0
        in_string = False
        escape = False
        opener = s[0] if s else "{"
        closer = "}" if opener == "{" else "]"
        for i, ch in enumerate(s):
            if escape:
                escape = False
                continue
            if ch == "\\" and in_string:
                escape = True
                continue
            if ch == '"':
                in_string = not in_string
                continue
            if in_string:
                continue
            if ch == opener:
                depth += 1
            elif ch == closer:
                depth -= 1
                if depth == 0:
                    return s[: i + 1]
        return s  # fallback: return as-is

    if cleaned and cleaned[0] in "{[":
        cleaned = _extract_json_boundary(cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Last resort: try prepending { in case the model omitted it
        try:
            return json.loads("{" + cleaned)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=500, detail=f"Failed to parse AI response as JSON: {e}\n\nRaw output:\n{raw}")


# ---------------------------------------------------------------------------
# Pydantic models — Request
# ---------------------------------------------------------------------------

class BudgetProfile(BaseModel):
    location: str        # e.g. "home/indoor", "outdoor", "studio"
    equipment: str       # e.g. "basic", "intermediate", "advanced"
    crew: str            # e.g. "solo", "2-3 collaborators"
    shooting_days: int = 1

class StoryboardRequest(BaseModel):
    project_title: str
    description: str
    platform: str        # YouTube | Instagram | TikTok | podcast | other
    duration_minutes: int
    style: str           # tutorial | vlog | narrative | interview

    @field_validator("duration_minutes")
    @classmethod
    def positive_duration(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("duration_minutes must be greater than 0")
        return v

    @field_validator("platform")
    @classmethod
    def valid_platform(cls, v: str) -> str:
        allowed = {"youtube", "instagram", "tiktok", "podcast", "other"}
        if v.lower() not in allowed:
            raise ValueError(f"platform must be one of {allowed}")
        return v.lower()

class ChecklistRequest(BaseModel):
    storyboard: "Storyboard"   # forward-ref resolved at end of file

class BudgetRequest(BaseModel):
    project_title: str
    description: str
    budget_profile: BudgetProfile

class RefineRequest(BaseModel):
    """Send a follow-up instruction to adjust a previously generated artefact."""
    artefact_type: str          # "storyboard" | "checklist" | "budget"
    previous_output: dict       # the JSON object to refine
    instruction: str            # e.g. "make the tone more humorous"


# ---------------------------------------------------------------------------
# Pydantic models — Response
# ---------------------------------------------------------------------------

class Scene(BaseModel):
    id: int
    title: str
    description: str
    visuals: List[str]
    key_points: List[str]

class Storyboard(BaseModel):
    project_title: str
    platform: str
    duration_minutes: int
    style: str
    scenes: List[Scene]

class Task(BaseModel):
    id: str
    description: str
    role: str
    estimated_time_hours: float

class Phase(BaseModel):
    name: str
    tasks: List[Task]

class Checklist(BaseModel):
    phases: List[Phase]

class BudgetCategory(BaseModel):
    name: str
    low_estimate: float
    high_estimate: float
    notes: Optional[str] = None

class Budget(BaseModel):
    currency: str
    categories: List[BudgetCategory]
    total_low: float
    total_high: float

# Resolve forward reference used in ChecklistRequest
ChecklistRequest.model_rebuild()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/storyboard", response_model=Storyboard, summary="Generate storyboard from idea")
async def generate_storyboard(request: StoryboardRequest) -> Storyboard:
    """
    Accepts a project idea and parameters, returns a scene-based storyboard (5–12 scenes).
    """
    prompt = f"""<|user|>
Generate a storyboard with 5 to 8 scenes for this project and return ONLY a valid JSON object, nothing else.

Project title: {request.project_title}
Description: {request.description}
Platform: {request.platform}
Duration: {request.duration_minutes} minutes
Style: {request.style}

The JSON must have these exact keys: project_title (string), platform (string), duration_minutes (integer), style (string), scenes (array). Each scene must have: id (integer), title (string), description (string), visuals (array of strings), key_points (array of strings).
<|assistant|>
{{"""

    raw = await _call_granite(prompt)
    data = _parse_json(raw)
    try:
        return Storyboard(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model returned unexpected structure: {e}")


@app.post("/api/checklist", response_model=Checklist, summary="Generate production checklist from storyboard")
async def generate_checklist(request: ChecklistRequest) -> Checklist:
    """
    Accepts a storyboard JSON object, returns a phased production checklist
    (pre-production, production, post-production) with tasks, roles, and time estimates.
    """
    storyboard_json = request.storyboard.model_dump_json(indent=2)

    prompt = f"""<|user|>
Generate a production checklist for the storyboard below and return ONLY a valid JSON object, nothing else.

Storyboard:
{storyboard_json}

The JSON must have one key: phases (array). Each phase must have: name (string, one of "Pre-production", "Production", "Post-production"), tasks (array). Each task must have: id (string), description (string), role (string), estimated_time_hours (number).
<|assistant|>
{{"""

    raw = await _call_granite(prompt)
    data = _parse_json(raw)
    try:
        return Checklist(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model returned unexpected structure: {e}")


@app.post("/api/budget", response_model=Budget, summary="Generate budget estimate from idea and parameters")
async def generate_budget(request: BudgetRequest) -> Budget:
    """
    Accepts a project description and budget profile, returns a categorised budget estimate
    with low/high cost ranges.
    """
    prompt = f"""<|user|>
Generate a budget estimate for the project below and return ONLY a valid JSON object, nothing else.

Project title: {request.project_title}
Description: {request.description}
Location type: {request.budget_profile.location}
Equipment level: {request.budget_profile.equipment}
Crew: {request.budget_profile.crew}
Shooting days: {request.budget_profile.shooting_days}

Use these categories: Equipment, Locations, Talent/Crew, Post-production, Marketing/Distribution, Contingency.
The JSON must have these exact keys: currency (string, use "USD"), categories (array), total_low (number), total_high (number). Each category must have: name (string), low_estimate (number), high_estimate (number), notes (string).
<|assistant|>
{{"""

    raw = await _call_granite(prompt)
    data = _parse_json(raw)
    try:
        return Budget(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model returned unexpected structure: {e}")


@app.post("/api/refine", summary="Refine a previously generated artefact with a follow-up instruction")
async def refine_artefact(request: RefineRequest) -> dict:
    """
    Accepts a previously generated storyboard, checklist, or budget together with a plain-English
    refinement instruction (e.g. "make the tone more humorous", "constrain budget to low-cost options")
    and returns the updated artefact as JSON.
    """
    prompt = f"""<|user|>
Modify the {request.artefact_type} JSON below according to the instruction and return ONLY the updated valid JSON object, nothing else.

Instruction: {request.instruction}

Current {request.artefact_type}:
{json.dumps(request.previous_output, indent=2)}
<|assistant|>
{{"""

    raw = await _call_granite(prompt)
    return _parse_json(raw)


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("Backend.main:app", host="0.0.0.0", port=8000, reload=True)
