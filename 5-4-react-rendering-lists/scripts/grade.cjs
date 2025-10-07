#!/usr/bin/env node
/**
 * Study Buddy React Lab — Auto Grader (CommonJS)
 * Output: grade-report.md + grade-report.json
 *
 * Top-level policy (Tasks out of 80):
 * - No attempt ➜ 0/80
 * - Any attempt ➜ min 60/80 (flexible floor)
 * - Fully complete ➜ award actual earned (up to 80)
 *
 * Per-task rubric (max 20 each):
 * - Completeness: 8
 * - Correctness:  6
 * - Code Quality: 6
 *
 * Submission (out of 20):
 * - On time  = 20
 * - Late     = 10
 *
 * IMPORTANT: The feedback report does NOT mention any grace marks policy.
 */

const fs = require("fs");
const path = require("path");

// ---------------- CLI ----------------
const args = process.argv.slice(2);
function getArg(name, fallback = null) {
  const i = args.findIndex(a => a === name || a.startsWith(name + "="));
  if (i === -1) return fallback;
  const eq = args[i].indexOf("=");
  if (eq !== -1) return args[i].slice(eq + 1);
  return args[i + 1] || fallback;
}
const ROOT = path.resolve(getArg("--root", "."));
const CONFIG_PATH = path.resolve(getArg("--config", "grading.config.yml"));
const SUBMITTED_AT = getArg("--submittedAt", null); // ISO string (optional)

// ---------------- Tiny YAML (flat) ----------------
function parseTinyYAML(src) {
  const out = {};
  src.split(/\r?\n/).forEach(line => {
    const s = line.trim();
    if (!s || s.startsWith("#")) return;
    const m = s.match(/^([^:#]+):\s*(.*)$/);
    if (!m) return;
    const key = m[1].trim();
    let val = m[2].trim();
    const hash = val.indexOf(" #");
    if (hash !== -1) val = val.slice(0, hash).trim();
    if (/^(true|false)$/i.test(val)) val = /^true$/i.test(val);
    else if (!isNaN(Number(val))) val = Number(val);
    out[key] = val;
  });
  return out;
}

function loadConfig(p) {
  if (!fs.existsSync(p)) return {};
  try { return parseTinyYAML(fs.readFileSync(p, "utf8")); }
  catch { return {}; }
}

// ---------------- FS helpers ----------------
function read(p) { try { return fs.readFileSync(p, "utf8"); } catch { return ""; } }
function exists(p) { try { return fs.existsSync(p); } catch { return false; } }
function has(txt, re) { return txt ? (re instanceof RegExp ? re.test(txt) : txt.includes(re)) : false; }

// ---------------- Paths ----------------
const paths = {
  app: path.join(ROOT, "src", "App.jsx"),
  courseCard: path.join(ROOT, "src", "components", "CourseCard.jsx"),
  taskItem: path.join(ROOT, "src", "components", "TaskItem.jsx"),
  dueBadge: path.join(ROOT, "src", "components", "DueBadge.jsx"),
};
const code = {
  app: read(paths.app),
  courseCard: read(paths.courseCard),
  taskItem: read(paths.taskItem),
  dueBadge: read(paths.dueBadge),
};

// ---------------- Deadline ----------------
const cfg = loadConfig(CONFIG_PATH);
const DEFAULT_DUE = "2025-10-08T23:59:59+03:00";
const DUE_DATE_ISO = process.env.DUE_DATE || cfg.deadline || DEFAULT_DUE;

function getSubmittedISO() {
  if (SUBMITTED_AT) return new Date(SUBMITTED_AT).toISOString();
  // Try GitHub payload env
  try {
    const p = process.env.GITHUB_EVENT_PATH;
    if (p && fs.existsSync(p)) {
      const payload = JSON.parse(fs.readFileSync(p, "utf8"));
      const t = payload?.head_commit?.timestamp
        || payload?.workflow_run?.head_commit?.timestamp
        || payload?.commits?.[payload.commits?.length - 1]?.timestamp;
      if (t) return new Date(t).toISOString();
    }
  } catch {}
  // Try git log
  try {
    const { execSync } = require("child_process");
    const iso = execSync("git log -1 --pretty=format:%cI", { encoding: "utf8" }).trim();
    if (iso) return new Date(iso).toISOString();
  } catch {}
  return new Date().toISOString();
}
const submittedISO = getSubmittedISO();
const isLate = (() => {
  try { return new Date(submittedISO).getTime() > new Date(DUE_DATE_ISO).getTime(); }
  catch { return false; }
})();
const submissionScore = isLate ? 10 : 20;

// ---------------- Feedback helpers ----------------
function runChecks(checks, maxPoints) {
  // check: {desc, test:boolean, pts:number}
  let earned = 0;
  const achieved = [];
  const missed = [];
  for (const c of checks) {
    if (c.test) { earned += c.pts; achieved.push(`✅ ${c.desc}`); }
    else { missed.push(`❌ ${c.desc}`); }
  }
  return {
    earned: Math.min(maxPoints, earned),
    achieved, missed,
    passed: achieved.length, total: checks.length,
  };
}

function taskSection(title, correctness, completeness, quality, finalScore) {
  const lines = [];
  const render = (name, d, max) => {
    const out = [];
    out.push(`### ${name} — ${d.earned}/${max}`);
    if (d.achieved.length) {
      out.push("**What you achieved:**");
      d.achieved.forEach(a => out.push(`- ${a}`));
    } else out.push("_No checks achieved yet._");
    if (d.missed.length) {
      out.push("**What to improve:**");
      d.missed.forEach(m => out.push(`- ${m}`));
    }
    out.push("");
    return out.join("\n");
  };

  lines.push(`## ${title}`);
  lines.push(`**Score:** ${finalScore}/20`);
  lines.push("");
  // Order to match your reference style
  lines.push(render("Correctness", correctness, 6));
  lines.push(render("Completeness", completeness, 8));
  lines.push(render("Code Quality", quality, 6));
  return lines.join("\n");
}

// ---------------- Heuristic checks per task ----------------
//
// TASK 1 — App.jsx maps courses → <CourseCard />
const t1Completeness = runChecks([
  { desc: "Maps over courses with .map(...)", test: has(code.app, /\.map\s*\(\s*\(\s*course\s*,\s*idx?\s*\)\s*=>/), pts: 6 },
  { desc: "Uses course.id as key", test: has(code.app, /key=\{?\s*course\.id\s*\}?/), pts: 2 },
], 8);

const t1Correctness = runChecks([
  { desc: "Renders <CourseCard /> for each course", test: has(code.app, /<CourseCard[\s\S]*?>/), pts: 3 },
  { desc: "Passes required props (course, index, onMutateCourse)", test: has(code.app, /course=\{?course\}?/) && has(code.app, /index=\{?idx\}?/) && has(code.app, /onMutateCourse=\{?mutateCourseByIndex\}?/), pts: 3 },
], 6);

const t1Quality = runChecks([
  { desc: "Mapping code is readable and idiomatic JSX", test: has(code.app, /<section className="grid">[\s\S]*<\/section>/), pts: 3 },
  { desc: "Keys and props used consistently", test: has(code.app, /key=\{?\s*course\.id\s*\}?/) && has(code.app, /course=\{?course\}?/), pts: 3 },
], 6);

// TASK 2 — CourseCard: map course.tasks → <TaskItem />
const t2Completeness = runChecks([
  { desc: "Maps course.tasks with .map(...)", test: has(code.courseCard, /course\.tasks\.map\s*\(/), pts: 6 },
  { desc: "Uses task.id as key", test: has(code.courseCard, /key=\{?\s*task\.id\s*\}?/), pts: 2 },
], 8);

const t2Correctness = runChecks([
  { desc: "Renders <TaskItem /> per task", test: has(code.courseCard, /<TaskItem[\s\S]*?>/), pts: 3 },
  { desc: "Passes task, onToggle, onDelete props", test: has(code.courseCard, /task=\{?task\}?/) && has(code.courseCard, /onToggle=\{?toggleTask\}?/) && has(code.courseCard, /onDelete=\{?deleteTask\}?/), pts: 3 },
], 6);

const t2Quality = runChecks([
  { desc: "Task list appears inside <ul className=\"tasks\">", test: has(code.courseCard, /<ul\s+className="tasks">/), pts: 3 },
  { desc: "Clear, minimal list item structure", test: has(code.courseCard, /<li\b[^>]*className="task"/) || has(code.taskItem, /className="task"/), pts: 3 },
], 6);

// TASK 3 — Conditional Rendering (CourseCard, TaskItem, DueBadge)
const t3Completeness = runChecks([
  { desc: "Shows “All caught up” badge when all tasks are done (logical &&)", test: has(code.courseCard, /&&\s*["'`]?All caught up!?["'`]?/i), pts: 3 },
  { desc: "Shows empty state via ternary when no tasks", test: has(code.courseCard, /No tasks yet\.? Add your first one below\./i) && has(code.courseCard, /\?\s*.*:\s*/), pts: 3 },
  { desc: "TaskItem renders <DueBadge /> only when task is not done", test: has(code.taskItem, /\{\s*!\s*task\.isDone\s*&&\s*<DueBadge[\s\S]*?>\s*\}/), pts: 2 },
], 8);

const t3Correctness = runChecks([
  { desc: "DueBadge computes days with daysUntil(dueDate)", test: has(code.dueBadge, /daysUntil\s*\(\s*dueDate\s*\)/), pts: 2 },
  { desc: "Ternary chain labels (Overdue / Due today / 1 day remaining / N days remaining)", test:
      has(code.dueBadge, /Overdue/) &&
      has(code.dueBadge, /Due today/) &&
      has(code.dueBadge, /1 day remaining/) &&
      has(code.dueBadge, /days remaining/), pts: 2 },
  { desc: "Adds class 'danger' if overdue and 'warn' if due today", test:
      has(code.dueBadge, /\bbadge[^"'`}]*\bdanger\b/) &&
      has(code.dueBadge, /\bbadge[^"'`}]*\bwarn\b/), pts: 2 },
], 6);

const t3Quality = runChecks([
  { desc: "Conditional expressions are concise and readable", test: has(code.courseCard, /\?\s*.*:\s*/) && has(code.taskItem, /&&\s*<DueBadge/), pts: 3 },
  { desc: "DueBadge returns a single, clean <span className=\"badge ...\">", test: has(code.dueBadge, /<span\s+className="badge/), pts: 3 },
], 6);

// TASK 4 — Interactivity: toggle/delete/add (CourseCard) + wiring (TaskItem)
const t4Completeness = runChecks([
  { desc: "toggleTask(id) function exists", test: has(code.courseCard, /function\s+toggleTask\s*\(\s*id\s*\)/), pts: 2 },
  { desc: "deleteTask(id) function exists", test: has(code.courseCard, /function\s+deleteTask\s*\(\s*id\s*\)/), pts: 2 },
  { desc: "addTask(e) function exists", test: has(code.courseCard, /function\s+addTask\s*\(\s*e\s*\)/), pts: 2 },
  { desc: "Uses onMutateCourse(index, updater) to modify tasks", test: has(code.courseCard, /onMutateCourse\s*\(\s*index\s*,/), pts: 2 },
], 8);

const t4Correctness = runChecks([
  { desc: "Toggle implemented with .map and flips isDone", test: has(code.courseCard, /\.map\s*\(\s*t\s*=>[\s\S]*isDone\s*:\s*!t\.isDone/), pts: 2 },
  { desc: "Delete implemented with .filter(id)", test: has(code.courseCard, /\.filter\s*\(\s*t\s*=>\s*t\.id\s*!==\s*id\s*\)/), pts: 2 },
  { desc: "Add creates { id, title, dueDate: date, isDone: false }", test: has(code.courseCard, /\{\s*id\s*,\s*title\s*,\s*dueDate:\s*date\s*,\s*isDone:\s*false\s*\}/), pts: 2 },
], 6);

const t4Quality = runChecks([
  { desc: "Resets input fields after add (setTitle(''); setDate(''))", test: has(code.courseCard, /setTitle\s*\(\s*['"`]\s*['"`]\s*\)\s*;?[\s\S]*setDate\s*\(\s*['"`]\s*['"`]\s*\)/), pts: 3 },
  { desc: "TaskItem checkbox calls onToggle(task.id) and Delete calls onDelete(task.id)", test:
      has(code.taskItem, /type=['"]checkbox['"][^>]*onChange=\{\s*\(\)\s*=>\s*onToggle\s*\(\s*task\.id\s*\)\s*\}/) &&
      has(code.taskItem, /onClick=\{\s*\(\)\s*=>\s*onDelete\s*\(\s*task\.id\s*\)\s*\}/), pts: 3 },
], 6);

// ---------------- Assemble task results ----------------
function packTask(name, c, k, q) {
  return {
    name,
    completeness: c.earned,
    correctness: k.earned,
    quality: q.earned,
    final: c.earned + k.earned + q.earned,
    cDetail: c,
    kDetail: k,
    qDetail: q,
  };
}
const tasks = [
  packTask("Task 1 — Render Course Components", t1Completeness, t1Correctness, t1Quality),
  packTask("Task 2 — Render Tasks per Course", t2Completeness, t2Correctness, t2Quality),
  packTask("Task 3 — Conditional Rendering", t3Completeness, t3Correctness, t3Quality),
  packTask("Task 4 — Interactivity (Add/Toggle/Delete)", t4Completeness, t4Correctness, t4Quality),
];

let rawTasksTotal = tasks.reduce((s, t) => s + t.final, 0);

// Attempt detection (any signal across files)
const attemptSignals = [
  /useState\s*\(/, /onChange=\{/, /onClick=\{/, /<TaskItem\b/, /<DueBadge\b/, /onMutateCourse\s*\(/,
  /setTitle\s*\(/, /setDate\s*\(/, /isDone/
];
const attemptDetected = attemptSignals.some(rx =>
  has(code.app, rx) || has(code.courseCard, rx) || has(code.taskItem, rx) || has(code.dueBadge, rx)
);

// Fully complete heuristic: near-max per task (transparent only)
const allFull = tasks.every(t => t.completeness >= 7 && t.correctness >= 5);

// Flexible floor to 60 if attempted but not fully complete
let tasksTotal = rawTasksTotal;
if (!attemptDetected) {
  tasksTotal = 0;
  tasks.forEach(t => t.final = 0);
} else if (!allFull && rawTasksTotal < 60) {
  // Evenly nudge per-task scores up to 60 total without exceeding 20 each
  let deficit = 60 - rawTasksTotal;
  const room = tasks.map(t => 20 - t.final);
  while (deficit > 0 && room.some(r => r > 0)) {
    for (let i = 0; i < tasks.length && deficit > 0; i++) {
      if (room[i] > 0) {
        tasks[i].final += 1;
        room[i] -= 1;
        deficit -= 1;
      }
    }
  }
  tasksTotal = tasks.reduce((s, t) => s + t.final, 0);
}

// ---------------- Build reports ----------------
const header = `# Study Buddy Lab — Grading Report

**Commit Time:** ${submittedISO}
**Due Date:** ${DUE_DATE_ISO}
**Submission:** ${submissionScore}/20 ${isLate ? "(Late)" : "(On time)"}

**Files detected**
- App.jsx: ${exists(paths.app) ? paths.app : "NOT FOUND"}
- CourseCard.jsx: ${exists(paths.courseCard) ? paths.courseCard : "NOT FOUND"}
- TaskItem.jsx: ${exists(paths.taskItem) ? paths.taskItem : "NOT FOUND"}
- DueBadge.jsx: ${exists(paths.dueBadge) ? paths.dueBadge : "NOT FOUND"}
`;

const sections = tasks.map(t =>
  taskSection(
    t.name,
    t.kDetail,     // Correctness
    t.cDetail,     // Completeness
    t.qDetail,     // Quality
    t.final
  )
).join("\n\n");

const totals = `
## Totals
- Tasks Total: **${tasksTotal}/80**
- Submission: **${submissionScore}/20**
- **Grand Total: ${tasksTotal + submissionScore}/100**
`;

const md = `${header}\n${sections}\n\n${totals}\n`;

// JSON (student-friendly, mirrors sections)
const json = {
  submittedISO,
  dueISO: DUE_DATE_ISO,
  late: isLate,
  submissionScore,
  files: {
    app: exists(paths.app) ? paths.app : null,
    courseCard: exists(paths.courseCard) ? paths.courseCard : null,
    taskItem: exists(paths.taskItem) ? paths.taskItem : null,
    dueBadge: exists(paths.dueBadge) ? paths.dueBadge : null,
  },
  tasks: tasks.map(t => ({
    name: t.name,
    final: t.final,
    breakdown: {
      completeness: t.completeness,
      correctness: t.correctness,
      quality: t.quality,
    },
    achieved: {
      completeness: t.cDetail.achieved,
      correctness: t.kDetail.achieved,
      quality: t.qDetail.achieved,
    },
    missed: {
      completeness: t.cDetail.missed,
      correctness: t.kDetail.missed,
      quality: t.qDetail.missed,
    },
  })),
  tasksTotal,
  grandTotal: tasksTotal + submissionScore,
  policy: {
    tasks: "0 if no attempt; floor 60 if attempted; up to 80 when complete.",
    submission: "On time: 20; Late: 10.",
  }
};

// ---------------- Write outputs ----------------
try { fs.writeFileSync(path.join(ROOT, "grade-report.md"), md, "utf8"); } catch {}
try { fs.writeFileSync(path.join(ROOT, "grade-report.json"), JSON.stringify(json, null, 2), "utf8"); } catch {}
console.log(md);
