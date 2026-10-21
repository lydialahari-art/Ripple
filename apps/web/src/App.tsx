
import { useState } from "react";
import "./App.css";

type Task = {
  id: number;
  name: string;
  owner: string;
  day: number;
  duration: number;
  status: "On track" | "At risk" | "Blocked";
};

const initialTasks: Task[] = [
  { id: 1, name: "Collect and clean dataset", owner: "Ananya", day: 1, duration: 2, status: "On track" },
  { id: 2, name: "Train baseline model", owner: "Lahari", day: 3, duration: 2, status: "On track" },
  { id: 3, name: "Evaluate model performance", owner: "Rahul", day: 5, duration: 2, status: "At risk" },
  { id: 4, name: "Prepare final presentation", owner: "Ananya", day: 7, duration: 2, status: "On track" },
];

function App() {
  const [disruption, setDisruption] = useState(false);
  const [strategy, setStrategy] = useState("balanced");
  const [approved, setApproved] = useState(false);
  const [reevaluated, setReevaluated] = useState(false);
  const [decisionHistory, setDecisionHistory] = useState<string[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [backendLoading, setBackendLoading] = useState(false);
const [backendResult, setBackendResult] = useState<{
  strategy: string;
  score: number;
  valid: boolean;
  evaluationDay: number;
  presentationDay: number;
  owner: string;
  issues: string[];
} | null>(null);
const [backendError, setBackendError] = useState("");

  
const affectedTaskCount = disruption
  ? initialTasks.filter((task) => {
      if (task.id === 3 || task.id === 4) {
        return true;
      }
      return false;
    }).length
  : 0;


  const tasks = initialTasks.map((task) => {
    if (!disruption) return task;

    if (task.id === 3) {
      return {
        ...task,
        day: strategy === "deadline" ? 4 : strategy === "minimal" ? 6 : 5,
        owner: strategy === "deadline" ? "Lahari" : "Rahul",
      };
    }

    if (task.id === 4) {
      return {
        ...task,
        day: strategy === "minimal" ? 8 : strategy === "deadline" ? 6 : 7,
      };
    }

    return task;
  });

  const strategyDetails = {
  balanced: {
    title: "Balanced recovery",
    description:
      "Keep the evaluation owner and make a limited schedule adjustment.",
    owner: "Rahul",
    evaluationDay: 5,
    presentationDay: 7,
  },
  deadline: {
    title: "Deadline-first recovery",
    description:
      "Reassign evaluation to Lahari to protect the final presentation milestone.",
    owner: "Lahari",
    evaluationDay: 4,
    presentationDay: 6,
  },
  minimal: {
    title: "Minimal-change recovery",
    description:
      "Keep Rahul as the evaluation owner and move evaluation one day later.",
    owner: "Rahul",
    evaluationDay: 6,
    presentationDay: 8,
  },
};

const validateStrategy = (details: {
  title: string;
  owner: string;
  evaluationDay: number;
  presentationDay: number;
}) => {
  const issues: string[] = [];

  if (details.presentationDay > 7) {
    issues.push("Presentation exceeds the Day 7 deadline.");
  }

  if (details.evaluationDay >= details.presentationDay) {
    issues.push("Evaluation must happen before the presentation.");
  }

  if (!details.owner.trim()) {
    issues.push("An evaluation owner must be assigned.");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
};

const selectedStrategy = strategyDetails[
  strategy as keyof typeof strategyDetails
];
const selectedValidation = validateStrategy(selectedStrategy);


const evaluateWithBackend = async () => {
  setBackendLoading(true);
  setBackendError("");

  try {
    const response = await fetch("/api/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-03-26",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "evaluate_recovery_strategy",
          arguments: {
            strategyName: selectedStrategy.title,
            evaluationDay: selectedStrategy.evaluationDay,
            presentationDay: selectedStrategy.presentationDay,
            owner: selectedStrategy.owner,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status}`);
    }

    
const contentType = response.headers.get("content-type") || "";
let data: any;

if (contentType.includes("application/json")) {
  data = await response.json();
} else {
  const text = await response.text();

  const dataLine = text
    .split(/\r?\n/)
    .find((line) => line.startsWith("data:"));

  if (!dataLine) {
    throw new Error(
      "The backend returned an unexpected MCP response."
    );
  }

  data = JSON.parse(dataLine.slice(5).trim());
}


    if (data.error) {
      throw new Error(data.error.message || "MCP evaluation failed.");
    }

    const contentText = data.result?.content?.find(
      (item: { type: string; text?: string }) => item.type === "text"
    )?.text;

    if (!contentText) {
      throw new Error("The backend returned no evaluation result.");
    }

    const result = JSON.parse(contentText);

    setBackendResult(result);
    setDecisionHistory((history) => [
      ...history,
      `${new Date().toLocaleTimeString()} — Backend evaluation: ${result.strategy} | Score: ${result.score}/100 | Validation: ${result.valid ? "Passed" : `Failed — ${result.issues.join(" ")}`}`,
    ]);
  } catch (error) {
    setBackendError(
      error instanceof Error ? error.message : "Unknown backend error."
    );
  } finally {
    setBackendLoading(false);
  }
};




const copyDecisionSummary = async () => {
  const summary = [
    "RIPPLE — DECISION SUMMARY",
    `Recommended strategy: ${recommendedStrategy.title}`,
    `Recommendation score: ${recommendedStrategy.score}/100`,
    `Recommendation fit: ${
  recommendedStrategy.score >= 90
    ? "Strong"
    : recommendedStrategy.score >= 70
      ? "Good"
      : "Poor"
}`,
    `Validation: ${
      recommendedStrategy.validation.isValid
        ? "Passed"
        : "Needs review"
    }`,
    `Reason: ${recommendedStrategy.validation.issues.join(" ") || "Passed the demo constraints."}`,
    "Note: This is a rule-based recommendation. Verify deadlines, dependencies, and team availability before acting.",
  ].join("\n");

  try {
    await navigator.clipboard.writeText(summary);
setCopySuccess(true);
  } catch {
    setCopySuccess(false);
  }
};


const downloadDecisionReport = () => {
  const report = [
    "RIPPLE — DECISION REPORT",
    
`Selected strategy: ${selectedStrategy.title}`,
`Selected strategy score: ${selectedImpactScore}/100`,
`Selected strategy validation: ${
  selectedValidation.isValid ? "Passed" : "Needs review"
}`,
`Deadline warning: ${
  selectedStrategy.presentationDay > 7
    ? `Presentation exceeds the Day 7 deadline (scheduled for Day ${selectedStrategy.presentationDay}).`
    : "Presentation meets the Day 7 deadline."
}`,

`Risk priority: ${
  selectedStrategy.presentationDay > 7 ? "HIGH" : "NORMAL"
}`,

    "========================",
    "",
"DECISION COMPARISON",
`Selected strategy: ${selectedStrategy.title}`,
`Recommended strategy: ${recommendedStrategy.title}`,
`Score difference: ${recommendedStrategy.score - selectedImpactScore} points`,
`Decision: ${
  selectedStrategy.title === recommendedStrategy.title
    ? "Selected strategy matches the recommendation."
    : selectedValidation.isValid
      ? "The selected strategy is valid, but another strategy scores higher."
      : "The selected strategy needs review. Consider the recommended valid strategy."
}`,

`Schedule impact: ${
  selectedStrategy.presentationDay <= 7
    ? `Presentation remains within the Day 7 deadline (Day ${selectedStrategy.presentationDay}).`
    : `Presentation exceeds the Day 7 deadline (Day ${selectedStrategy.presentationDay}).`
}`,
`Evaluation owner: ${selectedStrategy.owner}`,
`Trade-off: ${
  selectedStrategy.title === recommendedStrategy.title
    ? "Selected strategy matches the highest-scoring valid recommendation."
    : selectedValidation.isValid
      ? "Selected strategy is valid, but scores lower than the recommendation."
      : "Selected strategy violates a configured constraint; review the recommended valid strategy."
}`,

    "",
    `Recommended strategy: ${recommendedStrategy.title}`,
    `Recommendation score: ${recommendedStrategy.score}/100`,
    `Recommended strategy validation: ${
  recommendedStrategy.validation.isValid ? "Passed" : "Needs review"
}`,
    `Reason: ${
      recommendedStrategy.validation.issues.join(" ") ||
      "Passed the demo constraints."
    }`,
    "",
    "HUMAN REVIEW",
    "Verify deadlines, task dependencies, and team availability",
    "before acting on this rule-based recommendation.",
    "",
    "Note: This report reflects the current demo logic.",
  ].join("\n");

  const blob = new Blob([report], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "ripple-decision-report.txt";
  link.click();

  URL.revokeObjectURL(url);
};




const scoringRules = {
  deadlineProtection: 50,
  minimalScheduleChange: 30,
  ownerContinuity: 20,
};

const comparisonStrategies = Object.entries(strategyDetails).map(
  ([key, details]) => {
    const deadlineScore =
      details.presentationDay <= 7
        ? scoringRules.deadlineProtection
        : 0;

    const scheduleScore =
      details.evaluationDay <= 5
        ? scoringRules.minimalScheduleChange
        : 0;

    const ownerScore =
      details.owner === "Rahul"
        ? scoringRules.ownerContinuity
        : 0;

    return {
      key,
      title: details.title,
      validation: validateStrategy(details),
      score: deadlineScore + scheduleScore + ownerScore,
      deadline: details.presentationDay <= 7 ? "Protected" : "At risk",
      schedule:
        details.evaluationDay <= 5 ? "Limited change" : "More changes",
      owner: details.owner === "Rahul" ? "Retained" : "Changed",
    };
  }
);


const validStrategies = comparisonStrategies.filter(
  (item) => item.validation.isValid
);

const recommendedStrategy =
  [...validStrategies].sort((a, b) => b.score - a.score)[0] ??
  [...comparisonStrategies].sort((a, b) => b.score - a.score)[0];

const hasValidRecommendation = validStrategies.length > 0;

const selectedIsRecommended =
  strategy === recommendedStrategy.key;


const scoreBreakdown = {
  deadlineProtection:
    selectedStrategy.presentationDay <= 7
      ? scoringRules.deadlineProtection
      : 0,

  minimalScheduleChange:
    selectedStrategy.evaluationDay <= 5
      ? scoringRules.minimalScheduleChange
      : 0,

  ownerContinuity:
    selectedStrategy.owner === "Rahul"
      ? scoringRules.ownerContinuity
      : 0,
};

const scoreExplanations = {
  deadlineProtection:
    selectedStrategy.presentationDay <= 7
      ? `Presentation remains on Day ${selectedStrategy.presentationDay}, within the Day 7 deadline.`
      : `Presentation moves to Day ${selectedStrategy.presentationDay}, beyond the Day 7 deadline.`,

  minimalScheduleChange:
    selectedStrategy.evaluationDay <= 5
      ? `Evaluation stays on Day ${selectedStrategy.evaluationDay}, limiting schedule changes.`
      : `Evaluation moves to Day ${selectedStrategy.evaluationDay}, requiring more schedule changes.`,

  ownerContinuity:
    selectedStrategy.owner === "Rahul"
      ? "Rahul retains ownership, preserving continuity."
      : `${selectedStrategy.owner} takes ownership, changing the original owner.`,
};

const selectedImpactScore =

  scoreBreakdown.deadlineProtection +
  scoreBreakdown.minimalScheduleChange +
  scoreBreakdown.ownerContinuity;

  const reset = () => {
  setDisruption(false);
  setStrategy("balanced");
  setApproved(false);
  setReevaluated(false);
  setDecisionHistory([]);
};

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">r</span> ripple
        </div>
        <p className="side-label">WORKSPACE</p>
        <button className="nav-item active">● &nbsp; Overview</button>
        <button className="nav-item" onClick={() => setDisruption(true)}>
          ↗ &nbsp; Recovery plans
        </button>
        <button className="nav-item" onClick={reset}>
          ↻ &nbsp; Reset workspace
        </button>
        <div className="sidebar-bottom">
          <div className="avatar">LL</div>
          <div>
            <strong>Project workspace</strong>
            <small>Local demo environment</small>
          </div>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div>
            <span className="eyebrow">WORKSPACE / PROJECTS</span>
            <h1>Project overview</h1>
          </div>
          <span className="live-pill">Local simulation</span>
        </header>

        <section className="welcome">
          <div>
            <span className="eyebrow light">YOUR PLAN, ADAPTED</span>
            <h2>When plans change,<br />find your next move.</h2>
            <p>
              Ripple explores the impact of a disruption and helps your team
              review recovery options before making changes.
            </p>
            <button
  type="button"
  className="primary-button"
  onClick={() => {
    console.log("Ripple disruption button clicked");
    setDisruption(true);
    setApproved(false);
  }}
>
            
               Simulate a disruption
            </button>
          </div>
          <div className="orbit-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit-core">r</div>
            <span className="orbit-dot dot-one" />
            <span className="orbit-dot dot-two" />
          </div>
        </section>

        <div className="section-heading">
          <div>
            <h2>Delivery snapshot</h2>
            <p>Student ML project · Demo workspace</p>
          </div>
          <button className="text-button" onClick={reset}>Reset demo ↺</button>
        </div>

        <div className="stats-grid">
          <article className="stat-card">
            <span>PROJECT TASKS</span>
            <strong>{tasks.length}</strong>
            <small>Tasks in the project plan</small>
          </article>
          <article className="stat-card">
            <span>DEPENDENCY ALERTS</span>
            <strong className={disruption ? "warning-text" : ""}>
              {disruption ? 2 : 0}
            </strong>
            <small>{disruption ? "Scenario requires review" : "No active demo disruption"}</small>
          </article>
          <article className="stat-card">
            <span>PLAN STATUS</span>
            <strong className="status-word">
              {approved ? "Approved" : disruption ? "Review" : "Stable"}
            </strong>
            <small>{approved ? "Approved in this session" : "Human approval required"}</small>
          </article>
        </div>

        <div className="content-grid">
          <section className="panel task-panel">
            <div className="panel-heading">
              <div>
                <h3>Project timeline</h3>
                <p>Relative project days</p>
              </div>
              <span className="tiny-tag">4 TASKS</span>
            </div>

            {tasks.map((task) => (
              <div className="task-row" key={task.id}>
                <div className="task-info">
                  <span
                    className={
                      "task-dot task-" +
                      task.status.toLowerCase().replace(" ", "-")
                    }
                  />
                  <div>
                    <strong>{task.name}</strong>
                    <small>{task.owner} · {task.duration} days</small>
                  </div>
                </div>
                <div className="task-schedule">
                  <div className="schedule-track">
                    <span
                      style={{
                        left: ((task.day - 1) * 10) + "%",
                        width: (task.duration * 10) + "%",
                      }}
                    />
                  </div>
                  
<small>
  Day {task.day}
  {disruption &&
    task.day !== initialTasks.find((original) => original.id === task.id)?.day && (
      <span className="moved-label"> Moved</span>
    )}
</small>

                </div>
              </div>
            ))}

            <div className="legend">
              <span><i className="legend-dot green" /> On track</span>
              <span><i className="legend-dot amber" /> At risk</span>
            </div>
          </section>

          <section className="panel impact-panel">
            <div className="panel-heading">
              <div>
                <h3>Impact analysis</h3>
                <p>Understand what a change affects</p>
              </div>
              <span className="impact-icon">⌁</span>
            </div>

            {disruption ? (
              <>
              

<div className="affected-tasks-heading">
  <strong>Affected by this disruption</strong>
  <span>
    {affectedTaskCount}{" "}
    {affectedTaskCount === 1 ? "task" : "tasks"} require review
  </span>
</div>


<div className="affected-task-list">
  {tasks
    .filter((task) => task.id === 3 || task.id === 4)
    .map((task) => (
      <div className="affected-task-item" key={task.id}>
        <span className="task-dot task-at-risk" />
        <div>
          <strong>{task.name}</strong>
          <small>
            {task.owner} · Day {task.day} · {task.duration} days
          </small>
        </div>
        <span
  className={
    task.day !==
      initialTasks.find((original) => original.id === task.id)?.day ||
    task.owner !==
      initialTasks.find((original) => original.id === task.id)?.owner
      ? "moved-label"
      : "task-status-unchanged"
  }
>
  {task.day !==
    initialTasks.find((original) => original.id === task.id)?.day ||
  task.owner !==
    initialTasks.find((original) => original.id === task.id)?.owner
    ? "Changed"
    : "Unchanged"}
</span>
      </div>
    ))}
</div>


{strategyDetails[strategy as keyof typeof strategyDetails]
  .presentationDay > 7 && (
  <div className="deadline-warning" role="alert">
    <strong>⚠ Deadline at risk</strong>
    <p>
      The final presentation moves to Day{" "}
      {strategyDetails[strategy as keyof typeof strategyDetails]
        .presentationDay}
      , beyond the configured Day 7 deadline.
      Review the recovery strategy before proceeding.
    </p>
  </div>
)}


<div className="scenario-summary">
  <strong>Recovery impact summary</strong>
  <p>
    {strategy === "deadline"
      ? "Evaluation is reassigned to Lahari on Day 4. The final presentation moves to Day 6, protecting the Day 7 deadline."
      : strategy === "minimal"
        ? "Rahul keeps evaluation ownership, but evaluation moves to Day 6 and the final presentation moves to Day 8. The deadline is at risk."
        : "Rahul keeps evaluation ownership. Evaluation remains on Day 5 and the final presentation stays on Day 7, meeting the configured deadline."}
  </p>
</div>





                <div className="alert-box">
                  <strong>
  {strategy === "deadline"
    ? "Deadline protected through reassignment"
    : strategy === "minimal"
      ? "Evaluation schedule adjusted"
      : "Evaluation dependency at risk"}
</strong>
                  
<p>
  {strategy === "deadline"
    ? "Evaluation is reassigned to Lahari and moved to Day 4, helping protect the final presentation milestone on Day 6."
    : strategy === "minimal"
      ? "Rahul retains evaluation ownership, but the evaluation moves to Day 6 and the final presentation to Day 8."
      : "Rahul retains evaluation ownership, with evaluation on Day 5 and the final presentation on Day 7."}
</p>

                </div>
                <div className="impact-step">
                  <span>1</span>
                  <div>
                    <strong>Model evaluation</strong>
                    <small>Review task ownership and timing</small>
                  </div>
                  <b>Direct</b>
                </div>
                <div className="impact-step">
                  <span>2</span>
                  <div>
                    <strong>Final presentation</strong>
                    <small>Review downstream timing</small>
                  </div>
                  <b>Related</b>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div>⌁</div>
                <strong>See how a change ripples</strong>
                <p>
                  Simulate a disruption to open the recovery workbench and
                  compare strategies.
                </p>
                <button
                  className="secondary-button"
                  onClick={() => setDisruption(true)}
                >
                  Run scenario
                </button>
              </div>
            )}
          </section>
        </div>

        {disruption && (
          <section className="panel recovery-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">RECOVERY WORKBENCH</span>
                <h3>Choose a recovery strategy</h3>
                <p>Compare the options before approving a change.</p>
              </div>
              <span className="tiny-tag">DEMO SCENARIO</span>
            </div>

            <div className="scenario-box">
              <strong>Scenario: evaluation owner is unavailable for one day</strong>
              <p>
                Select an option to preview how the proposed project schedule
                changes. This prototype uses illustrative demo data.
              </p>
            </div>

            <div className="strategy-grid">
              <button
                className={"strategy-card " + (strategy === "balanced" ? "selected" : "")}
                onClick={() => {
  setStrategy("balanced");
  setApproved(false);
  setReevaluated(false);
  setCopySuccess(false);
  setDecisionHistory((history) => [
  ...history,
  `${new Date().toLocaleTimeString()} — Selected: Balanced recovery | Score: 100/100 | Validation: Passed`,
]);
}}
              >
                <span>01 · BALANCED</span>
                <strong>Keep the plan steady</strong>
                <small>Preview a limited schedule adjustment.</small>
              </button>

              <button
                className={"strategy-card " + (strategy === "deadline" ? "selected" : "")}
                onClick={() => {
  setStrategy("deadline");
  setApproved(false);
  setReevaluated(false);
  setCopySuccess(false);
  setDecisionHistory((history) => [
  ...history,
  `${new Date().toLocaleTimeString()} — Selected: Deadline-first recovery | Score: 80/100 | Validation: Passed`,
]);
}}
              >
                <span>02 · DEADLINE FIRST</span>
                <strong>Protect the milestone</strong>
                <small>Preview reassignment to another teammate.</small>
              </button>

              <button
                className={"strategy-card " + (strategy === "minimal" ? "selected" : "")}
                onClick={() => {
  setStrategy("minimal");
  setApproved(false);
  setReevaluated(false);
  setCopySuccess(false);
  setDecisionHistory((history) => [
  ...history,
  `${new Date().toLocaleTimeString()} — Selected: Minimal-change recovery | Score: 20/100 | Validation: Failed — Presentation exceeds Day 7 deadline`,
]);
}}
              >
                <span>03 · MINIMAL CHANGE</span>
                <strong>Preserve ownership</strong>
                <small>Preview a later schedule for evaluation.</small>
              </button>
            </div>

            <div className="scenario-box">
  <strong>{selectedStrategy.title}</strong>
  
<div className="impact-score">
  <span>Selected strategy score (demo)</span>
  

<small>
  Currently previewing: {selectedStrategy.title}
</small>

<strong>{selectedImpactScore}/100</strong>
<span className={
  selectedStrategy.presentationDay > 7
    ? "validation-warning"
    : "validation-success"
}>
  {selectedStrategy.presentationDay > 7
    ? "Deadline at risk"
    : "Within deadline"}
</span>




<div
  className="impact-score-track"
  role="img"
  aria-label={`Illustrative impact score: ${selectedImpactScore} out of 100`}
>
  <div
    className="impact-score-fill"
    style={{ width: `${selectedImpactScore}%` }}
  />
</div>

<div className="score-breakdown">
  <p>
    <span>Deadline protection</span>
    <strong>{scoreBreakdown.deadlineProtection}/50</strong>
  </p>
  <small>{scoreExplanations.deadlineProtection}</small>

  <p>
    <span>Minimal schedule change</span>
    <strong>{scoreBreakdown.minimalScheduleChange}/30</strong>
  </p>
  <small>{scoreExplanations.minimalScheduleChange}</small>

  <p>
    <span>Owner continuity</span>
    <strong>{scoreBreakdown.ownerContinuity}/20</strong>
  </p>
  <small>{scoreExplanations.ownerContinuity}</small>
</div>


<small>Illustrative demo score, not a validated prediction</small>

</div>

  <p>{selectedStrategy.description}</p>
  <p>
    Evaluation owner: <strong>{selectedStrategy.owner}</strong>
    {" · "}
    Evaluation starts: <strong>Day {selectedStrategy.evaluationDay}</strong>
    {" · "}
    Presentation starts: <strong>Day {selectedStrategy.presentationDay}</strong>
  </p>
</div>


<div className="scenario-box">
  <h4>Original vs Proposed Schedule</h4>

  <div className="schedule-comparison">
    <div>
      <strong>Evaluation</strong>
      <p>
        Original: Day {initialTasks.find((task) => task.id === 3)?.day}
      </p>
      <p>
        Proposed: Day {selectedStrategy.evaluationDay}
      </p>
      <p>
        Owner: {selectedStrategy.owner}
      </p>
    </div>

    <div>
      <strong>Final presentation</strong>
      <p>
        Original: Day {initialTasks.find((task) => task.id === 4)?.day}
      </p>
      <p>
        Proposed: Day {selectedStrategy.presentationDay}
      </p>
    </div>
  </div>
</div>

<div className="recommended-strategy">
  <p className="recommendation-label">RECOMMENDED STRATEGY</p>

  <div className="validation-status">
  <div className="status-item">
    <span className="status-dot status-demo"></span>
    <div>
      <strong>Scoring status</strong>
      <p>Calculated using demo rules</p>
    </div>
  </div>

  <div className="status-item">
    <span className="status-dot status-pending"></span>
    <div>
      <strong>Constraint validation</strong>
      <p>
Demo constraints checked; real-world constraints not verified
</p>
    </div>
  </div>
</div>

  
<h3>Recommended: {recommendedStrategy.title}</h3>


<p>
  <span className="fit-label">Rule-based fit:</span>{" "}
  <span className="fit-value">
    {recommendedStrategy.score >= 90
      ? "Strong"
      : recommendedStrategy.score >= 70
        ? "Good"
        : "Poor"}
  </span>
</p>



<p className="recommendation-reason">
  {`This strategy scores ${recommendedStrategy.score}/100 under the demo rules. `}
  {recommendedStrategy.deadline === "Protected"
    ? "It keeps the final presentation within the Day 7 deadline. "
    : "It does not protect the Day 7 deadline. "}
  {recommendedStrategy.schedule === "Limited change"
    ? "It also limits schedule changes. "
    : "It requires additional schedule changes. "}
  {recommendedStrategy.owner === "Retained"
    ? "It preserves the original evaluation owner."
    : "It changes the evaluation owner to support recovery."}
</p>


<p
  className={
    !hasValidRecommendation
      ? "validation-warning"
      : selectedIsRecommended
        ? "validation-success"
        : "validation-warning"
  }
>
  {!hasValidRecommendation
    ? "⚠ No strategy passed validation. Review the constraints before choosing a recovery plan."
    : selectedIsRecommended
      ? "✓ Your selected strategy is the recommended option."
      : `Your selected strategy is ${selectedStrategy.title}. Consider ${recommendedStrategy.title}, which has the highest score among valid strategies.`}
</p>

  

<p
  className={
    selectedValidation.isValid
      ? "validation-success"
      : "validation-warning"
  }
>
  {selectedValidation.isValid
    ? "✓ Selected strategy passes all configured demo constraints."
    : `⚠ Selected strategy needs review: ${selectedValidation.issues.join(" ")}`}
</p>



  <strong>{recommendedStrategy.score}/100</strong>

  <p>
    
<p>
  {recommendedStrategy.deadline === "Protected"
    ? "Protects the presentation deadline."
    : "The presentation deadline is at risk."}{" "}
  {recommendedStrategy.schedule === "Limited change"
    ? "Limits schedule changes."
    : "Requires more schedule changes."}{" "}
  {recommendedStrategy.owner === "Retained"
    ? "Keeps the original owner for continuity."
    : "Changes ownership to support recovery."}
</p>

  </p>

  <div className="why-this-wins">
  <h4>Why not the alternatives?</h4>

  {comparisonStrategies
    .filter((item) => item.key !== recommendedStrategy.key)
    .map((item) => (
      <div className="reason-row" key={item.key}>
        <span>{item.title}</span>
        <strong>{item.score}/100</strong>
        
<p>
  {item.validation.isValid
    ? `Valid option, but scores ${recommendedStrategy.score - item.score} points lower than Balanced recovery. Balanced recovery protects the Day 7 presentation deadline, limits schedule changes, and preserves the original evaluation owner.`
    : `Not recommended because ${item.validation.issues.join(" ")}`}
</p>

      </div>
    ))}
</div>
</div>


<div className="confidence-note">
  <strong>Decision confidence: Rule-based</strong>
  <p>
    This recommendation is based on predefined scoring rules and
    demo constraints. It is not a guarantee of the best real-world
    outcome. A human should verify deadlines, dependencies, and
    team availability before acting.
  </p>
</div>


<button
  type="button"
  className="copy-summary-button"
  onClick={copyDecisionSummary}
>
  Copy decision summary
</button>


{copySuccess && (
  <p className="copy-success-message" role="status">
    ✓ Decision summary copied successfully!
  </p>
)}



<button
  type="button"
  className="copy-summary-button"
  onClick={downloadDecisionReport}
>
  <span aria-hidden="true">↓ </span>
  Download Decision Report
</button>




<div className="strategy-summary">
  <strong>
    {validStrategies.length} of {comparisonStrategies.length} strategies passed validation
  </strong>
  <p>
    {validStrategies.length === comparisonStrategies.length
      ? "All strategies satisfy the configured demo constraints."
      : validStrategies.length === 0
        ? "No strategy satisfies all configured demo constraints. Review the constraints before proceeding."
        : "Only strategies that pass the configured demo constraints are eligible for recommendation."}
  </p>
</div>



<div className="decision-confidence">
  <strong>Decision status</strong>
  <span>
    {validStrategies.length === 0
      ? "Needs review — no valid strategies"
      : validStrategies.length === comparisonStrategies.length
        ? "Ready for review — all strategies passed"
        : "Qualified — invalid strategies excluded"}
  </span>
  <p>
    This status reflects demo constraint checks, not a guarantee of real-world success.
  </p>
</div>


<div className="review-notice">
  <strong>Review before applying</strong>
  <p>
    Verify project deadlines, owner availability, and dependencies before
    applying this recovery strategy. No project changes have been made.
  </p>
</div>


<div className="strategy-comparison">
  <h3>Strategy Comparison</h3>

  <p className="comparison-subtitle">
    Compare recovery options across deadline, schedule, and ownership.
  </p>

  <div className="strategy-comparison-grid">
    {comparisonStrategies.map((item) => (
      <div
  className={`strategy-comparison-card ${
    item.key === recommendedStrategy.key ? "recommended-card" : ""
  }`}
  key={item.key}
>
  {item.key === recommendedStrategy.key && (
    
<span className="recommended-badge">
  {hasValidRecommendation ? "Recommended" : "⚠ No valid strategy"}
</span>

  )}

  <h4>{item.title}</h4>

        <strong className="comparison-score">
          {item.score}/100
        </strong>

        <p>Deadline: {item.deadline}</p>
        <p>Schedule: {item.schedule}</p>
        <p>Owner: {item.owner}</p>
        
<div
  className={`constraint-result ${
    item.validation.isValid ? "validation-success" : "validation-warning"
  }`}
>
  <strong>
    {item.validation.isValid
      ? "✓ Constraints passed"
      : "⚠ Constraints failed"}
  </strong>

  {item.validation.issues.length > 0 && (
    <ul>
      {item.validation.issues.map((issue) => (
        <li key={issue}>{issue}</li>
      ))}
    </ul>
  )}
  

{!item.validation.isValid && (
  <div className="rejection-reason">
    <strong>Why not recommended:</strong>
    <ul>
      {item.validation.issues.map((issue) => (
        <li key={issue}>{issue}</li>
      ))}
    </ul>
  </div>
)}


</div>

      </div>
    ))}
  </div>

  <p className="comparison-note">
    Scores are illustrative and based on demo scoring rules.
  </p>
</div>


<div className="scenario-box decision-report">
  <h4>Recovery Decision Report</h4>

  
<p>
  <strong>Decision outcome:</strong>{" "}
  {selectedValidation.isValid
    ? "Passes configured demo constraints"
    : "Needs review — one or more constraints failed"}
</p>


  <p>
    <strong>Disruption:</strong> The evaluation owner is unavailable
    for one day.
  </p>

  <p>
    <strong>Proposed action:</strong> {selectedStrategy.description}
  </p>

  <p>
    <strong>Schedule impact:</strong> Evaluation moves to Day{" "}
    {selectedStrategy.evaluationDay}, and the final presentation
    is planned for Day {selectedStrategy.presentationDay}.
  </p>

  <p>
    <strong>Ownership:</strong> {selectedStrategy.owner} is assigned
    to the evaluation task.
  </p>

  <p>
  <strong>Validation:</strong> Demo constraints checked.
  Real-world deadlines, dependencies, and teammate availability
  still require human verification.
</p>
</div>



            <div className="validation-row">
              <div className="validation-icon pass">✓</div>
              <div>
                <strong>Demo validation complete — human review required</strong>
<p>
  Configured demo constraints have been checked. Verify actual
  project deadlines, dependencies, and owner availability before
  applying any recovery plan.
</p>
              </div>
              <span className="validation-label pass-label">DEMO PREVIEW</span>
            </div>

            <div className="recovery-actions">
              <button className="text-button" onClick={() => setApproved(false)}>
                Keep reviewing
              </button>
              
<button
  className="secondary-button"
  onClick={() => {
  setApproved(false);
  setDisruption(true);
  setReevaluated(true);
    void evaluateWithBackend();
  setDecisionHistory((history) => [
  ...history,
  `${new Date().toLocaleTimeString()} — Re-evaluated: ${selectedStrategy.title} | Score: ${selectedImpactScore}/100 | Validation: ${
    selectedValidation.isValid
      ? "Passed"
      : `Failed — ${selectedValidation.issues.join(" ")}`
  }`,
]);
}}
>
  ↻ Re-evaluate strategy
</button>

              
<button
  className="primary-button"
  disabled={approved || !selectedValidation.isValid}
  onClick={() => {
    if (!selectedValidation.isValid) return;

    setApproved(true);
    setDecisionHistory((history) => [
  ...history,
  `${new Date().toLocaleTimeString()} — Approved for review: ${selectedStrategy.title} | Score: ${selectedImpactScore}/100 | Validation: Passed | Evaluation owner: ${selectedStrategy.owner} | Presentation: Day ${selectedStrategy.presentationDay}`,
]);
  }}
>
  {approved
    ? "✓ Marked approved"
    : !selectedValidation.isValid
      ? "Cannot approve — validation failed"
      : "Approve demo plan →"}
</button>

            </div>

            
{!selectedValidation.isValid && !approved && (
  <div className="deadline-warning" role="alert">
    <strong>Approval blocked</strong>
    <p>
      This strategy does not meet all configured demo constraints.
      {` ${selectedValidation.issues.join(" ")}`}
      Choose a valid strategy before approving the demo plan.
    </p>
  </div>
)}


            {reevaluated && !approved && (
  <div className="success-message">
    <strong>✓ Strategy re-evaluated</strong>
    <p>
      The recovery options and recommendation reflect the
      current demo rules. Please review the result before approval.
    </p>
  </div>
)}


{backendLoading && (
  <div className="validation-row">
    <strong>Evaluating with Ripple backend...</strong>
  </div>
)}

{backendError && (
  <div className="deadline-warning" role="alert">
    <strong>Backend evaluation failed</strong>
    <p>{backendError}</p>
  </div>
)}

{backendResult && (
  <div className="scenario-box">
    <h4>Ripple Backend Evaluation</h4>

    <p>
      <strong>Strategy:</strong> {backendResult.strategy}
    </p>

    <p>
      <strong>Backend score:</strong> {backendResult.score}/100
    </p>

    <p>
      <strong>Validation:</strong>{" "}
      {backendResult.valid ? "Passed" : "Failed"}
    </p>

    <p>
      <strong>Evaluation owner:</strong> {backendResult.owner}
    </p>

    <p>
      <strong>Evaluation day:</strong> Day{" "}
      {backendResult.evaluationDay}
    </p>

    <p>
      <strong>Presentation day:</strong> Day{" "}
      {backendResult.presentationDay}
    </p>

    {backendResult.issues.length > 0 && (
      <>
        <strong>Issues to review:</strong>
        <ul>
          {backendResult.issues.map((issue, index) => (
            <li key={`${issue}-${index}`}>{issue}</li>
          ))}
        </ul>
      </>
    )}
  </div>
)}


{decisionHistory.length > 0 && (
  <div className="scenario-box">
    <h4>Decision History</h4>
    <p>Recent recovery actions in this session.</p>

    <button
  className="text-button"
  onClick={() => setDecisionHistory([])}
>
  Clear history
</button>

    
<ul className="decision-history-list">
  {decisionHistory.map((entry, index) => {
    const timestamp = entry.split(" — ")[0];
    const isApproved = entry.includes("Approved for review:");
    const isReevaluated = entry.includes("Re-evaluated:");
    const status = isApproved
      ? "Approved"
      : isReevaluated
        ? "Re-evaluated"
        : "Selected";

    const badgeClass = isApproved
      ? "history-approved"
      : isReevaluated
        ? "history-reevaluated"
        : "history-selected";

    
return (
  <li key={`${index}-${entry}`}>
    <span className={`history-badge ${badgeClass}`}>
      {status}
    </span>

    <div className="history-entry-content">
    <span className="history-timestamp">{timestamp}</span>
      <strong>
        {entry.includes("Balanced recovery")
          ? "Balanced recovery"
          : entry.includes("Deadline-first recovery")
            ? "Deadline-first recovery"
            : "Minimal-change recovery"}
      </strong>

      <span className="history-entry-details">
  {entry
    .split(" — ")
    .slice(1)
    .join(" — ")
    .replace(
      /^(Selected: |Re-evaluated: |Approved for review: )/,
      ""
    )
    .replace(
      /^(Balanced recovery|Deadline-first recovery|Minimal-change recovery)\s*\|\s*/,
      ""
    )}
</span>
    </div>
  </li>
);

  })}
</ul>

  </div>
)}
            

{approved && (
  <div className="success-message" role="status">
    <strong>✓ Demo plan approved for review</strong>
    <p>
      Selected strategy: {selectedStrategy.title}
    </p>
    <p>
      Evaluation owner: {selectedStrategy.owner}
    </p>
    <p>
      Evaluation: Day {selectedStrategy.evaluationDay} ·
      {" "}Final presentation: Day {selectedStrategy.presentationDay}
    </p>
    <p>
      This approval is recorded only in the current demo session.
      No external project data has been changed.
    </p>
  </div>
)}


          </section>
        )}

        <footer>
          RIPPLE · INTERACTIVE PROTOTYPE
          <span>Human-reviewed project recovery</span>
        </footer>
      </section>
    </main>
  );
}

export default App;
