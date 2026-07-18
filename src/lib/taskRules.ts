import { addDays, getIsoWeek, toDateKey } from "./dates";
import type { Task, TaskPriority, TaskStatus, TaskType } from "../types";

export type TaskFilters = {
  priority: "all" | TaskPriority;
  search: string;
  status: "all" | TaskStatus;
  type: "all" | TaskType;
};

export type OperationalSummary = {
  attention: Task[];
  backlog: Task[];
  delegated: Task[];
  doing: Task[];
  next14: Task[];
  outsideCount: number;
  overdue: Task[];
  relevantCount: number;
  today: Task[];
};

export function getEffectiveStatus(task: Task): TaskStatus {
  if (!task.plannedDay) return "backlog";
  if (task.status === "backlog") return "planned";
  return task.status;
}

export function isTaskOverdue(task: Task, today: string): boolean {
  if (!task.plannedDay) return false;
  if (getEffectiveStatus(task) === "done") return false;
  return task.plannedDay < today;
}

export function isBacklogOverdue(task: Task, today: string): boolean {
  if (!isTaskOverdue(task, today)) return false;
  const currentWeek = getIsoWeek(new Date(`${today}T00:00:00`));
  const taskWeek = task.plannedWeek ?? getIsoWeek(new Date(`${task.plannedDay}T00:00:00`));
  return taskWeek !== currentWeek;
}

export function getTimingState(task: Task): "none" | "ok" | "today" | "late" {
  if (!task.plannedDay || getEffectiveStatus(task) === "done") return "none";
  const today = toDateKey(new Date());
  if (task.plannedDay < today) return "late";
  if (task.plannedDay === today) return "today";
  return "ok";
}

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  const term = filters.search.trim().toLowerCase();
  return tasks.filter((task) => {
    if (filters.type !== "all" && (task.type ?? "professional") !== filters.type) return false;
    if (filters.priority !== "all" && (task.priority ?? "normal") !== filters.priority) return false;
    if (filters.status !== "all" && getEffectiveStatus(task) !== filters.status) return false;
    if (!term) return true;
    return [task.title, task.description, task.nextStep, task.status, task.priority, task.type, task.plannedDay, task.plannedWeek].filter(Boolean).join(" ").toLowerCase().includes(term);
  });
}

export function isCockpitRelevant(task: Task, today: string): boolean {
  const status = getEffectiveStatus(task);
  if (status === "done") return false;
  if (status === "doing" || status === "delegated") return true;
  if (task.priority === "critical") return true;
  if (isTaskOverdue(task, today)) return true;
  if (task.plannedDay) {
    const nextLimit = toDateKey(addDays(new Date(), 14));
    return task.plannedDay >= today && task.plannedDay <= nextLimit;
  }
  return status === "backlog";
}

export function isFollowUpDue(task: Task, today: string): boolean {
  if (getEffectiveStatus(task) === "done") return false;
  if (!task.followUpAt) return false;
  return task.followUpAt <= today;
}

export function getWaitingDays(task: Task, now: number): number {
  if (!task.waitingSince) return 0;
  return Math.max(0, Math.floor((now - task.waitingSince) / (24 * 60 * 60 * 1000)));
}

export function requiresMyAttention(task: Task, today: string): boolean {
  const status = getEffectiveStatus(task);
  if (status === "done") return false;
  if (isFollowUpDue(task, today)) return true;
  if (task.waitingKind === "blocked") return true;
  if (task.priority === "critical" && isTaskOverdue(task, today)) return true;
  return false;
}

export function getOperationalSummary(tasks: Task[]): OperationalSummary {
  const today = toDateKey(new Date());
  const nextLimit = toDateKey(addDays(new Date(), 14));
  const pending = tasks.filter((task) => getEffectiveStatus(task) !== "done");
  const overdue = pending.filter((task) => isTaskOverdue(task, today));
  const todayTasks = pending.filter((task) => task.plannedDay === today);
  const delegated = pending
    .filter((task) => task.status === "delegated" || task.waitingKind)
    .sort((a, b) => (a.followUpAt ?? "9999").localeCompare(b.followUpAt ?? "9999"));
  const doing = pending.filter((task) => getEffectiveStatus(task) === "doing");
  const next14 = pending.filter((task) => task.plannedDay && task.plannedDay > today && task.plannedDay <= nextLimit && !isTaskOverdue(task, today));
  const backlog = pending.filter((task) => !task.plannedDay);
  const relevant = pending.filter((task) => isCockpitRelevant(task, today));
  const attention = pending.filter((task) => requiresMyAttention(task, today));

  return {
    attention,
    backlog,
    doing,
    delegated,
    next14,
    outsideCount: pending.length - relevant.length,
    overdue,
    relevantCount: relevant.length,
    today: todayTasks,
  };
}
