import type { Task, TaskActions, TaskDraft, TaskStatus, WorkflowStatus } from "../types";
import type { Dispatch, SetStateAction } from "react";
import { getIsoWeek, getWeekDays } from "./dates";

const storageKey = "focusflow.weeklyKanban.tasks";

function createSeedTasks(): Task[] {
  const now = Date.now();
  const weekDays = getWeekDays(new Date());
  const plannedDay = weekDays[Math.min(new Date().getDay() || 7, 5) - 1]?.date ?? weekDays[0].date;
  const laterDay = weekDays[4].date;
  const plannedWeek = getIsoWeek(new Date(`${plannedDay}T12:00:00`));
  const laterWeek = getIsoWeek(new Date(`${laterDay}T12:00:00`));

  return [
    {
      _id: "local-1",
      title: "Validar modelo de dados no Convex",
      description: "Conferir campos mínimos e índices antes do deploy.",
      nextStep: "Conferir normalização de backlog, semana e status.",
      type: "professional",
      status: "planned",
      priority: "high",
      plannedWeek,
      plannedDay,
      sortOrder: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: "local-2",
      title: "Separar tarefas pequenas para a semana",
      type: "professional",
      status: "backlog",
      priority: "normal",
      sortOrder: now + 1,
      createdAt: now + 1,
      updatedAt: now + 1,
    },
    {
      _id: "local-3",
      title: "Começar primeiro fluxo de uso",
      nextStep: "Testar arrastar entre Semana e Kanban.",
      type: "professional",
      status: "delegated",
      priority: "low",
      plannedWeek: laterWeek,
      plannedDay: laterDay,
      sortOrder: now + 2,
      createdAt: now + 2,
      updatedAt: now + 2,
    },
  ];
}

function resolveDraftStatus(draft: TaskDraft, fallbackStatus: TaskStatus): TaskStatus {
  if (!draft.plannedDay) return "backlog";
  if (!draft.status || draft.status === "backlog") return fallbackStatus;
  return draft.status;
}

function normalizeDraft(draft: TaskDraft, fallbackStatus: TaskStatus = "planned") {
  const hasDate = Boolean(draft.plannedDay);
  const plannedWeek = draft.plannedDay ? getIsoWeek(new Date(`${draft.plannedDay}T12:00:00`)) : undefined;

  return {
    title: draft.title.trim(),
    description: draft.description?.trim() || undefined,
    nextStep: draft.nextStep?.trim() || undefined,
    type: draft.type ?? "professional",
    priority: draft.priority ?? "normal",
    status: resolveDraftStatus(draft, fallbackStatus),
    plannedWeek: hasDate ? plannedWeek : undefined,
    plannedDay: hasDate ? draft.plannedDay : undefined,
  };
}

export function loadLocalTasks(): Task[] {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return createSeedTasks();
  try {
    return JSON.parse(stored) as Task[];
  } catch {
    return createSeedTasks();
  }
}

export function saveLocalTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
  } catch {
    // Local mode is best-effort; Convex remains the durable path.
  }
}

export function createLocalActions(setTasks: Dispatch<SetStateAction<Task[]>>): TaskActions {
  const updateOne = (id: string, updater: (task: Task) => Task) => {
    setTasks((tasks) => tasks.map((task) => (task._id === id ? updater(task) : task)));
  };

  return {
    async createTask(draft: TaskDraft) {
      if (!draft.title.trim()) throw new Error("Task title is required.");
      const now = Date.now();
      setTasks((tasks) => [
        {
          _id: `local-${now}`,
          ...normalizeDraft(draft),
          sortOrder: now,
          createdAt: now,
          updatedAt: now,
        },
        ...tasks,
      ]);
    },
    async updateTask(id: string, draft: TaskDraft) {
      if (!draft.title.trim()) throw new Error("Task title is required.");
      updateOne(id, (task) => {
        const now = Date.now();
        const normalized = normalizeDraft(draft);
        return {
          ...task,
          ...normalized,
          completedAt: normalized.status === "done" ? task.completedAt ?? now : undefined,
          updatedAt: now,
        };
      });
    },
    async moveInKanban(id: string, status: WorkflowStatus, plannedWeek: string) {
      updateOne(id, (task) => {
        const now = Date.now();
        if (!task.plannedDay) {
          return {
            ...task,
            status: "backlog",
            plannedWeek: undefined,
            plannedDay: undefined,
            completedAt: undefined,
            updatedAt: now,
          };
        }
        return {
          ...task,
          status,
          plannedWeek: task.plannedWeek ?? plannedWeek,
          plannedDay: task.plannedDay,
          completedAt: status === "done" ? task.completedAt ?? now : undefined,
          updatedAt: now,
        };
      });
    },
    async planTask(id: string, plannedDay: string, status: WorkflowStatus) {
      updateOne(id, (task) => {
        const now = Date.now();
        return {
          ...task,
          status,
          plannedWeek: getIsoWeek(new Date(`${plannedDay}T12:00:00`)),
          plannedDay,
          completedAt: status === "done" ? task.completedAt ?? now : undefined,
          updatedAt: now,
        };
      });
    },
    async moveToWeek(id: string, plannedWeek: string, plannedDay?: string) {
      const derivedWeek = plannedDay ? getIsoWeek(new Date(`${plannedDay}T12:00:00`)) : undefined;
      updateOne(id, (task) => ({
        ...task,
        status: plannedDay ? task.status === "backlog" ? "planned" : task.status : "backlog",
        plannedWeek: plannedDay ? derivedWeek ?? plannedWeek : undefined,
        plannedDay,
        completedAt: plannedDay ? task.completedAt : undefined,
        updatedAt: Date.now(),
      }));
    },
    async moveToBacklog(id: string) {
      updateOne(id, (task) => ({
        ...task,
        status: "backlog",
        plannedWeek: undefined,
        plannedDay: undefined,
        completedAt: undefined,
        updatedAt: Date.now(),
      }));
    },
    async completeTask(id: string) {
      updateOne(id, (task) => {
        const now = Date.now();
        if (!task.plannedDay) return { ...task, status: "backlog", completedAt: undefined, updatedAt: now };
        return { ...task, status: "done", completedAt: task.completedAt ?? now, updatedAt: now };
      });
    },
    async archiveTask(id: string) {
      updateOne(id, (task) => ({ ...task, archivedAt: Date.now(), updatedAt: Date.now() }));
    },
    async restoreTask(id: string) {
      updateOne(id, (task) => ({ ...task, archivedAt: undefined, updatedAt: Date.now() }));
    },
    async restoreSnapshot(snapshot: Task) {
      setTasks((tasks) => tasks.map((task) => (task._id === snapshot._id ? { ...snapshot, updatedAt: Date.now() } : task)));
    },
  };
}
