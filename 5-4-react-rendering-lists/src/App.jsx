import { useState } from "react";
import { sampleCourses } from "./data";
import CourseCard from "./components/CourseCard";
import "./index.css";

/* =========================================================
   🧩 STUDY BUDDY LAB — MASTER TODO ROADMAP
   =========================================================

   🛠️ SETUP INSTRUCTIONS
   ---------------------------------------------------------
   1️⃣ Open your VS Code terminal.
   2️⃣ Navigate into the lab directory:
         cd 5-4-react-rendering-lists
   3️⃣ Install dependencies:
         npm i
         (or)
         npm install
   4️⃣ Start the development server:
         npm run dev
   ⚠️ If you get an error like “running scripts is disabled” or
      the system blocks npm commands, run this first:
         Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
      Then re-run your npm commands.

   Once the app runs successfully, open it in the browser
   and start implementing the tasks below.

   ⚠️ To get good marks in the lab, follow the instructions strictly, otherwise you may lose the marks.

   =========================================================
   📘 TASK 1 — Render Course Components
   File: src/App.jsx  (YOU ARE HERE)
   ---------------------------------------------------------
   GOAL:
   Display all courses dynamically using .map() and <CourseCard />.

   STEPS:
   1️⃣ Use the `courses` state variable which stores all course objects.
   2️⃣ Use `.map()` to loop through the `courses` array.
   3️⃣ For each `course`, render a <CourseCard /> component.
   4️⃣ Pass these props:
        - course={course}
        - index={idx}
        - onMutateCourse={mutateCourseByIndex}
   5️⃣ Use `course.id` as the key prop.

   🧭 LINE REFERENCE:
   → Go to the <section className="grid"> block near the bottom of this file.
     Replace the existing JSX comment with the .map() implementation if missing.

   ✅ This task is already implemented for you,
      so you can *see the course cards on screen immediately*.
      Read and understand how `.map()` and `key` work.
      Then move on to Task 2 below.

   ---------------------------------------------------------
   📘 TASK 2 — Render Tasks for Each Course
   File: src/components/CourseCard.jsx
   ---------------------------------------------------------
   GOAL:
   Inside each course card, display all its tasks using .map().

   STEPS:
   1️⃣ Open **CourseCard.jsx**.
   2️⃣ Find the comment:
         `<ul className="tasks">`
         → You’ll write your code right *inside this list*.
   3️⃣ Use `course.tasks.map()` to loop through each task.
   4️⃣ For each task, render a `<TaskItem />` component.
   5️⃣ Pass these props:
         - key={task.id}
         - task={task}
         - onToggle={toggleTask}
         - onDelete={deleteTask}

   💡 HINT:
   Each course already has a `tasks` array in `data.js`.
   You only need to map through it and render each task visually.

   ---------------------------------------------------------
   📘 TASK 3 — Conditional Rendering
   Files: CourseCard.jsx, TaskItem.jsx, DueBadge.jsx
   ---------------------------------------------------------
   GOAL:
   Practice conditional rendering using if, ternary (? :), and logical &&.

   🟩 PART A — CourseCard.jsx
   ---------------------------------
   1️⃣ Find the header section (`<header className="cardHeader">`).
       → Add a badge that says “All caught up” when **all tasks are done**.
         Use logical && rendering.
   2️⃣ Find the block where the task list or message should appear.
       → If there are **no tasks**, show:
         “No tasks yet. Add your first one below.”
         Else, render the list (use a ternary operator).

   🟩 PART B — TaskItem.jsx
   ---------------------------------
   1️⃣ Open **TaskItem.jsx**.
   2️⃣ Find the `<DueBadge />` inside the <li>.
       → Only render it if the task is *not done*.
         Use logical &&:
         `{!task.isDone && <DueBadge dueDate={task.dueDate} />}`

   🟩 PART C — DueBadge.jsx
   ---------------------------------
   1️⃣ Open **DueBadge.jsx**.
   2️⃣ Inside the component:
       - Call the helper `daysUntil(dueDate)` and store it in variable `d`.
       - Use a **ternary chain** to display:
         - if d < 0 → "Overdue"
         - if d === 0 → "Due today"
         - if d === 1 → "1 day remaining"
         - else → `${d} days remaining`
       - Return a `<span className="badge">` element.
       - Add class `"danger"` if overdue, `"warn"` if due today.

   💡 HINT:
   All required functions and HTML structure already exist.
   You only need to fill in the conditions.

   ---------------------------------------------------------
   📘 TASK 4 — Make the App Interactive
   Files: CourseCard.jsx, TaskItem.jsx
   ---------------------------------------------------------
   GOAL:
   Implement add, toggle, and delete task functionality using React state.

   🟩 PART A — CourseCard.jsx
   ---------------------------------
   1️⃣ Scroll to the functions near the top:
         - `toggleTask(id)`
         - `deleteTask(id)`
         - `addTask(e)`
       → Write code inside these functions.
   2️⃣ Use `onMutateCourse(index, updater)` to modify tasks.
   3️⃣ Use `.map()` for toggle and `.filter()` for delete.
   4️⃣ In addTask(), create a new task object:
       `{ id, title, dueDate: date, isDone: false }`
   5️⃣ Append it to the existing list and reset the input fields.

   💡 HINT:
   The add form is already visible at the bottom of each card.
   You only need to connect the logic.

   🟩 PART B — TaskItem.jsx
   ---------------------------------
   1️⃣ Find the `<input type="checkbox">` in the list item.
       → Call `onToggle(task.id)` when changed.
   2️⃣ Find the Delete button.
       → Call `onDelete(task.id)` when clicked.

   ---------------------------------------------------------
   ✅ FINISH LINE
   ---------------------------------------------------------
   Once all tasks are complete:
   - You can add, toggle, and delete tasks per course.
   - “All caught up!” appears automatically when all are done.
   - “No tasks yet” appears when the list is empty.
   - You’ve practiced .map(), keys, conditional rendering, and React state!
   =========================================================
*/


export default function App() {
  const [courses, setCourses] = useState(sampleCourses);

  // Helper function (no need to edit this)
  function mutateCourseByIndex(index, updater) {
    setCourses(cs =>
      cs.map((c, i) => (i === index ? { ...c, tasks: updater(c.tasks) } : c))
    );
  }

  return (
    <main className="wrap">
      <header className="appHeader">
        <h1>
          Study Buddy <span className="blink">▍</span>
        </h1>
        <p className="subtitle">Lists • Keys • Conditional Rendering</p>
      </header>

      <section className="grid">
        {/* ✅ TASK 1 already implemented — for reference.
            Observe how .map() dynamically renders one <CourseCard /> per course. */}
        {courses.map((course, idx) => (
          <CourseCard
            key={course.id}
            course={course}
            index={idx}
            onMutateCourse={mutateCourseByIndex}
          />
        ))}
      </section>
    </main>
  );
}
