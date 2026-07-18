export type TaskStatus = "backlog" | "planned" | "doing" | "delegated" | "done";
export type WorkflowStatus = Exclude<TaskStatus, "backlog">;

export type TaskPriority = "low" | "normal" | "high" | "critical";
export type TaskType = "professional" | "personal";
export type WaitingKind = "delegated" | "waiting" | "blocked" | "parked";
export type TaskImpact = "cash" | "asset" | "unblock" | "maintenance";
export type ProjectFront = "conatus" | "iara" | "agro" | "fontes-verdes" | "launchpad" | "pessoal" | "outro";
export type ProjectStage = "exploring" | "active" | "waiting" | "parked";
export type IdeaVerdict = "now" | "later" | "incubate" | "discard";

export type Project = {
  _id: string;
  name: string;
  front: ProjectFront;
  objective?: string;
  owner?: string;
  stage: ProjectStage;
  nextMilestone?: string;
  nextMilestoneDate?: string;
  nextStep?: string;
  blockedNote?: string;
  archivedAt?: number;
  createdAt: number;
  updatedAt: number;
};

export type ProjectDraft = {
  name: string;
  front: ProjectFront;
  objective?: string;
  owner?: string;
  stage: ProjectStage;
  nextMilestone?: string;
  nextMilestoneDate?: string;
  nextStep?: string;
  blockedNote?: string;
};

export type Decision = {
  _id: string;
  title: string;
  context?: string;
  options?: string;
  recommendation?: string;
  dueDate?: string;
  blocksWho?: string;
  projectId?: string;
  decidedAt?: number;
  outcome?: string;
  archivedAt?: number;
  createdAt: number;
  updatedAt: number;
};

export type DecisionDraft = {
  title: string;
  context?: string;
  options?: string;
  recommendation?: string;
  dueDate?: string;
  blocksWho?: string;
  projectId?: string;
};

export type Idea = {
  _id: string;
  title: string;
  note?: string;
  front?: ProjectFront;
  verdict?: IdeaVerdict;
  reviewedAt?: number;
  promotedTaskId?: string;
  archivedAt?: number;
  createdAt: number;
  updatedAt: number;
};

export type RadarActions = {
  createProject: (draft: ProjectDraft) => Promise<void>;
  updateProject: (id: string, draft: ProjectDraft) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  createDecision: (draft: DecisionDraft) => Promise<void>;
  updateDecision: (id: string, draft: DecisionDraft) => Promise<void>;
  decideDecision: (id: string, outcome: string) => Promise<void>;
  reopenDecision: (id: string) => Promise<void>;
  archiveDecision: (id: string) => Promise<void>;
  createIdea: (title: string, note?: string, front?: ProjectFront) => Promise<void>;
  setIdeaVerdict: (id: string, verdict: IdeaVerdict) => Promise<void>;
  promoteIdea: (id: string) => Promise<void>;
  archiveIdea: (id: string) => Promise<void>;
};

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
  projectId?: string;
  impact?: TaskImpact;
  waitingKind?: WaitingKind;
  delegatedTo?: string;
  followUpAt?: string;
  waitingSince?: number;
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
  projectId?: string;
  impact?: TaskImpact;
  waitingKind?: WaitingKind;
  delegatedTo?: string;
  followUpAt?: string;
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
