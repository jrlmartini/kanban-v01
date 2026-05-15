export type TaskStatus = "backlog" | "planned" | "doing" | "delegated" | "done";
export type WorkflowStatus = Exclude<TaskStatus, "backlog">;

export type TaskPriority = "low" | "normal" | "high" | "critical";
export type TaskType = "professional" | "personal";

export type Task = {
  _id: string;
  title: string;
  description?: string;
  nextStep?: string;
  type?: TaskType;
  status: TaskStatus;
  priority?: TaskPriority;
  plannedWeek?: string;
  plannedDay?: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  archivedAt?: number;
};

export type TaskDraft = {
  title: string;
  description?: string;
  nextStep?: string;
  type?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  plannedWeek?: string;
  plannedDay?: string;
};

export type WeekDay = {
  key: string;
  label: string;
  shortLabel: string;
  date: string;
};

export type TaskActions = {
  createTask: (draft: TaskDraft) => Promise<void>;
  updateTask: (id: string, draft: TaskDraft) => Promise<void>;
  moveInKanban: (id: string, status: WorkflowStatus, plannedWeek: string) => Promise<void>;
  planTask: (id: string, plannedDay: string, status: WorkflowStatus) => Promise<void>;
  moveToWeek: (id: string, plannedWeek: string, plannedDay?: string) => Promise<void>;
  moveToBacklog: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;
  restoreTask: (id: string) => Promise<void>;
  restoreSnapshot: (snapshot: Task) => Promise<void>;
};
