import DueBadge from "./DueBadge";


export default function TaskItem({ task, onToggle, onDelete }) {
return (
<li className="task" key={task.id}>
<label className="taskMain">
{/* 🟩 PART B (Anchor): Checkbox exists; students should wire onToggle(task.id) */}
<input type="checkbox" />


{/* 🟩 PART B (Anchor): Only render <DueBadge /> if task is NOT done (logical &&) */}


{/* Task title goes here */}
{/* Example: <span className="title">{task.title}</span> */}
</label>


{/* 🟩 PART B (Anchor): Delete button should call onDelete(task.id) */}
<button className="ghost" aria-label="Delete task">
✕
</button>
</li>
);
}