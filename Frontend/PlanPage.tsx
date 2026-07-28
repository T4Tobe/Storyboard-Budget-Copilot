import React, { useState } from "react";

// ---------------------------------------------------------------------------
// Types — mirroring Backend/main.py Pydantic models
// ---------------------------------------------------------------------------

type BudgetProfile = {
  location: string;
  equipment: string;
  crew: string;
  shooting_days: number;
};

type StoryboardRequest = {
  project_title: string;
  description: string;
  platform: string;
  duration_minutes: number;
  style: string;
};

type BudgetRequest = {
  project_title: string;
  description: string;
  budget_profile: BudgetProfile;
};

type RefineRequest = {
  artefact_type: "storyboard" | "checklist" | "budget";
  previous_output: object;
  instruction: string;
};

type Scene = {
  id: number;
  title: string;
  description: string;
  visuals: string[];
  key_points: string[];
};

type Storyboard = {
  project_title: string;
  platform: string;
  duration_minutes: number;
  style: string;
  scenes: Scene[];
};

type Task = {
  id: string;
  description: string;
  role: string;
  estimated_time_hours: number;
};

type Phase = {
  name: string;
  tasks: Task[];
};

type Checklist = {
  phases: Phase[];
};

type BudgetCategory = {
  name: string;
  low_estimate: number;
  high_estimate: number;
  notes?: string;
};

type Budget = {
  currency: string;
  categories: BudgetCategory[];
  total_low: number;
  total_high: number;
};

// ---------------------------------------------------------------------------
// Global responsive styles injected once
// ---------------------------------------------------------------------------

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; background: #f0f4f8; }

  .cp-hero {
    background: linear-gradient(135deg, #0f2544 0%, #1e3a5f 60%, #0f2544 100%);
    padding: 40px 24px 36px;
    text-align: center;
    color: #fff;
  }
  .cp-hero h1 {
    margin: 0 0 8px;
    font-size: clamp(22px, 5vw, 34px);
    font-weight: 800;
    letter-spacing: -0.5px;
  }
  .cp-hero p {
    margin: 0;
    font-size: clamp(14px, 3vw, 16px);
    color: #a8c0dc;
  }
  .cp-badge {
    display: inline-block;
    background: #f59e0b;
    color: #0f2544;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 20px;
    margin-bottom: 14px;
  }

  .cp-main {
    max-width: 860px;
    margin: 0 auto;
    padding: 28px 16px 60px;
    font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
    font-size: 15px;
    color: #1a2535;
    line-height: 1.65;
  }

  .cp-section-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 700;
    color: #0f2544;
    margin: 32px 0 14px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e2e8f0;
  }
  .cp-section-icon {
    width: 32px;
    height: 32px;
    background: #0f2544;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }

  .cp-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    box-shadow: 0 1px 4px rgba(15,37,68,0.06);
  }

  .cp-two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 14px;
  }
  @media (max-width: 580px) {
    .cp-two-col { grid-template-columns: 1fr; }
  }

  .cp-label {
    display: block;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    margin-bottom: 5px;
  }

  .cp-input {
    width: 100%;
    padding: 10px 12px;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    color: #1a2535;
    background: #f8fafc;
    transition: border-color 0.15s;
    outline: none;
    appearance: none;
  }
  .cp-input:focus { border-color: #1e3a5f; background: #fff; }

  .cp-btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: #0f2544;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 11px 22px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    min-height: 44px;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .cp-btn-primary:hover:not(:disabled) { background: #1e3a5f; }
  .cp-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

  .cp-btn-accent {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: #f59e0b;
    color: #0f2544;
    border: none;
    border-radius: 8px;
    padding: 11px 22px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    min-height: 44px;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .cp-btn-accent:hover:not(:disabled) { background: #d97706; }
  .cp-btn-accent:disabled { opacity: 0.55; cursor: not-allowed; }

  .cp-btn-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: transparent;
    color: #0f2544;
    border: 1.5px solid #cbd5e1;
    border-radius: 8px;
    padding: 10px 18px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    min-height: 44px;
    transition: border-color 0.15s, background 0.15s;
    white-space: nowrap;
  }
  .cp-btn-ghost:hover { border-color: #0f2544; background: #f0f4f8; }

  .cp-action-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 18px;
  }
  @media (max-width: 480px) {
    .cp-action-row .cp-btn-primary,
    .cp-action-row .cp-btn-ghost { width: 100%; }
  }

  /* Scene cards */
  .cp-scene-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #f59e0b;
    border-radius: 10px;
    padding: 18px;
    margin-bottom: 14px;
  }
  .cp-scene-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }
  .cp-scene-num {
    width: 30px;
    height: 30px;
    background: #0f2544;
    color: #f59e0b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 800;
    flex-shrink: 0;
  }
  .cp-scene-title {
    font-size: 15px;
    font-weight: 700;
    color: #0f2544;
    margin: 0;
  }
  .cp-scene-desc {
    font-size: 14px;
    color: #475569;
    margin: 0 0 12px;
  }
  .cp-scene-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  @media (max-width: 540px) {
    .cp-scene-cols { grid-template-columns: 1fr; }
  }
  .cp-mini-heading {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #94a3b8;
    margin: 0 0 6px;
  }
  .cp-mini-list {
    margin: 0;
    padding-left: 16px;
    font-size: 13px;
    color: #334155;
  }
  .cp-mini-list li { margin-bottom: 3px; }

  /* Phase pills */
  .cp-phase-pill {
    display: inline-block;
    padding: 4px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 10px;
  }
  .cp-phase-pre  { background: #dbeafe; color: #1d4ed8; }
  .cp-phase-prod { background: #dcfce7; color: #15803d; }
  .cp-phase-post { background: #fef9c3; color: #a16207; }

  /* Table */
  .cp-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .cp-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    min-width: 400px;
  }
  .cp-table th {
    background: #f1f5f9;
    border-bottom: 2px solid #e2e8f0;
    padding: 9px 12px;
    text-align: left;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
  }
  .cp-table td {
    border-bottom: 1px solid #f1f5f9;
    padding: 9px 12px;
    vertical-align: top;
    color: #334155;
  }
  .cp-table tr:last-child td { border-bottom: none; }
  .cp-table .cp-total-row td {
    background: #0f2544;
    color: #fff;
    font-weight: 700;
    border-bottom: none;
  }

  /* Error */
  .cp-error {
    background: #fff1f2;
    border: 1.5px solid #fecdd3;
    border-left: 4px solid #e11d48;
    border-radius: 8px;
    padding: 12px 16px;
    color: #9f1239;
    font-size: 14px;
    margin-bottom: 16px;
  }

  /* Divider */
  .cp-divider {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 28px 0;
  }

  /* Spinner */
  .cp-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: cp-spin 0.7s linear infinite;
  }
  .cp-spinner-dark {
    border-color: rgba(15,37,68,0.2);
    border-top-color: #0f2544;
  }
  @keyframes cp-spin { to { transform: rotate(360deg); } }
`;

function GlobalStyles() {
  return <style>{GLOBAL_CSS}</style>;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function apiFetch<T>(path: string, body: object): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Phase pill helper
// ---------------------------------------------------------------------------

function phasePillClass(name: string) {
  const n = name.toLowerCase();
  if (n.includes("pre")) return "cp-phase-pill cp-phase-pre";
  if (n.includes("post")) return "cp-phase-pill cp-phase-post";
  return "cp-phase-pill cp-phase-prod";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const StoryboardView: React.FC<{ storyboard: Storyboard }> = ({ storyboard }) => (
  <section>
    {storyboard.scenes.map((scene) => (
      <div key={scene.id} className="cp-scene-card">
        <div className="cp-scene-header">
          <div className="cp-scene-num">{scene.id}</div>
          <p className="cp-scene-title">{scene.title}</p>
        </div>
        <p className="cp-scene-desc">{scene.description}</p>
        <div className="cp-scene-cols">
          <div>
            <p className="cp-mini-heading">Visuals</p>
            <ul className="cp-mini-list">
              {scene.visuals.map((v, i) => <li key={i}>{v}</li>)}
            </ul>
          </div>
          <div>
            <p className="cp-mini-heading">Key talking points</p>
            <ul className="cp-mini-list">
              {scene.key_points.map((k, i) => <li key={i}>{k}</li>)}
            </ul>
          </div>
        </div>
      </div>
    ))}
  </section>
);

const ChecklistView: React.FC<{ checklist: Checklist }> = ({ checklist }) => (
  <section>
    {checklist.phases.map((phase) => (
      <div key={phase.name} style={{ marginBottom: 22 }}>
        <span className={phasePillClass(phase.name)}>{phase.name}</span>
        <div className="cp-table-wrap">
          <table className="cp-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Task</th>
                <th>Role</th>
                <th>Est. hours</th>
              </tr>
            </thead>
            <tbody>
              {phase.tasks.map((task) => (
                <tr key={task.id}>
                  <td style={{ fontWeight: 600, color: "#0f2544", whiteSpace: "nowrap" }}>{task.id}</td>
                  <td>{task.description}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{task.role}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{task.estimated_time_hours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ))}
  </section>
);

const BudgetView: React.FC<{ budget: Budget }> = ({ budget }) => (
  <section>
    <div className="cp-table-wrap">
      <table className="cp-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Low ({budget.currency})</th>
            <th>High ({budget.currency})</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {budget.categories.map((cat) => (
            <tr key={cat.name}>
              <td style={{ fontWeight: 600, color: "#0f2544" }}>{cat.name}</td>
              <td>${cat.low_estimate.toFixed(2)}</td>
              <td>${cat.high_estimate.toFixed(2)}</td>
              <td style={{ color: "#64748b", fontSize: 13 }}>{cat.notes ?? "—"}</td>
            </tr>
          ))}
          <tr className="cp-total-row">
            <td>Total estimate</td>
            <td>${budget.total_low.toFixed(2)}</td>
            <td>${budget.total_high.toFixed(2)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
);

// ---------------------------------------------------------------------------
// Section heading helper
// ---------------------------------------------------------------------------

function SectionHeading({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="cp-section-heading">
      <div className="cp-section-icon">{icon}</div>
      {title}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const PlanPage: React.FC = () => {
  const [storyboardReq, setStoryboardReq] = useState<StoryboardRequest>({
    project_title: "",
    description: "",
    platform: "youtube",
    duration_minutes: 8,
    style: "tutorial",
  });
  const [budgetProfile, setBudgetProfile] = useState<BudgetProfile>({
    location: "home/indoor",
    equipment: "basic",
    crew: "solo",
    shooting_days: 1,
  });

  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);

  const [loadingStoryboard, setLoadingStoryboard] = useState(false);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refineTarget, setRefineTarget] = useState<"storyboard" | "checklist" | "budget">("storyboard");
  const [refineInstruction, setRefineInstruction] = useState("");
  const [loadingRefine, setLoadingRefine] = useState(false);

  const handleStoryboardChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setStoryboardReq((prev) => ({
      ...prev,
      [name]: name === "duration_minutes" ? Number(value) : value,
    }));
  };

  const handleBudgetProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setBudgetProfile((prev) => ({
      ...prev,
      [name]: name === "shooting_days" ? Number(value) : value,
    }));
  };

  const handleGenerateStoryboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStoryboard(null);
    setChecklist(null);
    setBudget(null);
    setLoadingStoryboard(true);
    try {
      const sb = await apiFetch<Storyboard>("/api/storyboard", storyboardReq);
      setStoryboard(sb);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoadingStoryboard(false);
    }
  };

  const handleGenerateChecklist = async () => {
    if (!storyboard) return;
    setError(null);
    setLoadingChecklist(true);
    try {
      const cl = await apiFetch<Checklist>("/api/checklist", { storyboard });
      setChecklist(cl);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoadingChecklist(false);
    }
  };

  const handleGenerateBudget = async () => {
    setError(null);
    setLoadingBudget(true);
    try {
      const b = await apiFetch<Budget>("/api/budget", {
        project_title: storyboardReq.project_title,
        description: storyboardReq.description,
        budget_profile: budgetProfile,
      } satisfies BudgetRequest);
      setBudget(b);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoadingBudget(false);
    }
  };

  const handleRefine = async () => {
    const targets = { storyboard, checklist, budget };
    const current = targets[refineTarget];
    if (!current || !refineInstruction.trim()) return;
    setError(null);
    setLoadingRefine(true);
    try {
      const updated = await apiFetch<object>("/api/refine", {
        artefact_type: refineTarget,
        previous_output: current,
        instruction: refineInstruction,
      } satisfies RefineRequest);
      if (refineTarget === "storyboard") setStoryboard(updated as Storyboard);
      if (refineTarget === "checklist") setChecklist(updated as Checklist);
      if (refineTarget === "budget") setBudget(updated as Budget);
      setRefineInstruction("");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoadingRefine(false);
    }
  };

  const handleExport = (data: object, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (data: object) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  const hasResults = storyboard || checklist || budget;

  return (
    <>
      <GlobalStyles />

      {/* Hero header */}
      <div className="cp-hero">
        <div className="cp-badge">Powered by IBM Granite</div>
        <h1>Storyboard &amp; Budget Copilot</h1>
        <p>Turn a rough idea into a scene-by-scene storyboard, production checklist, and budget — in seconds.</p>
      </div>

      <div className="cp-main">

        {/* Error banner */}
        {error && (
          <div className="cp-error">
            <strong>Something went wrong:</strong> {error}
          </div>
        )}

        {/* ── Project idea form ── */}
        <SectionHeading icon="🎬" title="Your project idea" />
        <form onSubmit={handleGenerateStoryboard} className="cp-card">

          <label className="cp-label">Project title</label>
          <input
            className="cp-input"
            style={{ marginBottom: 14 }}
            name="project_title"
            placeholder="e.g. Beginner Running Blueprint for Busy Students"
            value={storyboardReq.project_title}
            onChange={handleStoryboardChange}
            required
          />

          <label className="cp-label">Description</label>
          <textarea
            className="cp-input"
            style={{ height: 100, resize: "vertical", marginBottom: 14 }}
            name="description"
            placeholder="Describe your idea in 1–2 paragraphs — the more detail, the better the output."
            value={storyboardReq.description}
            onChange={handleStoryboardChange}
            required
          />

          <div className="cp-two-col">
            <div>
              <label className="cp-label">Platform</label>
              <select className="cp-input" name="platform" value={storyboardReq.platform} onChange={handleStoryboardChange}>
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="podcast">Podcast</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="cp-label">Style</label>
              <select className="cp-input" name="style" value={storyboardReq.style} onChange={handleStoryboardChange}>
                <option value="tutorial">Tutorial</option>
                <option value="vlog">Vlog</option>
                <option value="narrative">Narrative</option>
                <option value="interview">Interview</option>
              </select>
            </div>
          </div>

          <label className="cp-label">Duration (minutes)</label>
          <input
            className="cp-input"
            style={{ marginBottom: 20 }}
            name="duration_minutes"
            type="number"
            min={1}
            value={storyboardReq.duration_minutes}
            onChange={handleStoryboardChange}
            required
          />

          <hr className="cp-divider" style={{ margin: "0 0 18px" }} />
          <p style={{ fontWeight: 700, color: "#0f2544", margin: "0 0 14px", fontSize: 14 }}>
            💰 Budget parameters
          </p>

          <div className="cp-two-col">
            <div>
              <label className="cp-label">Location</label>
              <select className="cp-input" name="location" value={budgetProfile.location} onChange={handleBudgetProfileChange}>
                <option value="home/indoor">Home / Indoor</option>
                <option value="outdoor">Outdoor</option>
                <option value="studio">Studio</option>
              </select>
            </div>
            <div>
              <label className="cp-label">Equipment level</label>
              <select className="cp-input" name="equipment" value={budgetProfile.equipment} onChange={handleBudgetProfileChange}>
                <option value="basic">Basic (phone / entry-level)</option>
                <option value="intermediate">Intermediate (mirrorless / DSLR)</option>
                <option value="advanced">Advanced (cinema / pro)</option>
              </select>
            </div>
          </div>
          <div className="cp-two-col">
            <div>
              <label className="cp-label">Crew</label>
              <select className="cp-input" name="crew" value={budgetProfile.crew} onChange={handleBudgetProfileChange}>
                <option value="solo">Solo creator</option>
                <option value="2-3 collaborators">2–3 Collaborators</option>
              </select>
            </div>
            <div>
              <label className="cp-label">Shooting days</label>
              <input
                className="cp-input"
                name="shooting_days"
                type="number"
                min={1}
                value={budgetProfile.shooting_days}
                onChange={handleBudgetProfileChange}
              />
            </div>
          </div>

          <button className="cp-btn-accent" type="submit" disabled={loadingStoryboard} style={{ marginTop: 6, width: "100%" }}>
            {loadingStoryboard
              ? <><span className="cp-spinner cp-spinner-dark" /> Generating storyboard…</>
              : "✦ Generate storyboard"}
          </button>
        </form>

        {/* ── Storyboard results ── */}
        {storyboard && (
          <>
            <SectionHeading icon="🎞" title="Storyboard" />
            <div className="cp-action-row">
              <button className="cp-btn-primary" onClick={handleGenerateChecklist} disabled={loadingChecklist}>
                {loadingChecklist ? <><span className="cp-spinner" /> Generating…</> : "✔ Generate checklist"}
              </button>
              <button className="cp-btn-primary" onClick={handleGenerateBudget} disabled={loadingBudget}>
                {loadingBudget ? <><span className="cp-spinner" /> Generating…</> : "$ Generate budget"}
              </button>
              <button className="cp-btn-ghost" onClick={() => handleCopy(storyboard)}>⎘ Copy JSON</button>
              <button className="cp-btn-ghost" onClick={() => handleExport(storyboard, "storyboard.json")}>↓ Download</button>
            </div>
            <StoryboardView storyboard={storyboard} />
          </>
        )}

        {/* ── Checklist results ── */}
        {checklist && (
          <>
            <SectionHeading icon="✅" title="Production checklist" />
            <div className="cp-action-row">
              <button className="cp-btn-ghost" onClick={() => handleCopy(checklist)}>⎘ Copy JSON</button>
              <button className="cp-btn-ghost" onClick={() => handleExport(checklist, "checklist.json")}>↓ Download</button>
            </div>
            <div className="cp-card" style={{ padding: 0, overflow: "hidden" }}>
              <ChecklistView checklist={checklist} />
            </div>
          </>
        )}

        {/* ── Budget results ── */}
        {budget && (
          <>
            <SectionHeading icon="💰" title="Budget estimate" />
            <div className="cp-action-row">
              <button className="cp-btn-ghost" onClick={() => handleCopy(budget)}>⎘ Copy JSON</button>
              <button className="cp-btn-ghost" onClick={() => handleExport(budget, "budget.json")}>↓ Download</button>
            </div>
            <div className="cp-card" style={{ padding: 0, overflow: "hidden" }}>
              <BudgetView budget={budget} />
            </div>
          </>
        )}

        {/* ── Refine panel ── */}
        {hasResults && (
          <>
            <SectionHeading icon="✏️" title="Refine" />
            <div className="cp-card">
              <p style={{ margin: "0 0 16px", fontSize: 14, color: "#475569" }}>
                Adjust any generated output with a plain-English instruction — e.g. <em>"make the tone more humorous"</em>, <em>"constrain budget to low-cost options"</em>, or <em>"add more scenes about post-production"</em>.
              </p>
              <div className="cp-two-col">
                <div>
                  <label className="cp-label">What to refine</label>
                  <select
                    className="cp-input"
                    value={refineTarget}
                    onChange={(e) => setRefineTarget(e.target.value as typeof refineTarget)}
                  >
                    {storyboard && <option value="storyboard">Storyboard</option>}
                    {checklist && <option value="checklist">Checklist</option>}
                    {budget && <option value="budget">Budget</option>}
                  </select>
                </div>
                <div>
                  <label className="cp-label">Instruction</label>
                  <input
                    className="cp-input"
                    placeholder='e.g. "Fewer scenes, more detail per scene"'
                    value={refineInstruction}
                    onChange={(e) => setRefineInstruction(e.target.value)}
                  />
                </div>
              </div>
              <button
                className="cp-btn-accent"
                onClick={handleRefine}
                disabled={loadingRefine || !refineInstruction.trim()}
              >
                {loadingRefine
                  ? <><span className="cp-spinner cp-spinner-dark" /> Refining…</>
                  : "✦ Apply refinement"}
              </button>
            </div>
          </>
        )}

      </div>
    </>
  );
};

export default PlanPage;
