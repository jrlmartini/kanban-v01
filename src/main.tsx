import { StrictMode, useEffect, useMemo, useState, type DragEvent, type MouseEvent } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from "convex/react";
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Circle, Clock3, Eye, KanbanSquare, Loader2, Plus, Search, Sparkles, X } from "lucide-react";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "./components/ui/dialog";
import { tasksApi } from "./lib/convexReferences";
import { createLocalActions, loadLocalTasks, saveLocalTasks } from "./lib/localTasks";
import { addDays, getIsoWeek, getWeekDays, isTimestampInsideWeek, startOfWeek, toDateKey } from "./lib/dates";
import { filterTasks, getEffectiveStatus, getOperationalSummary, getTimingState, isBacklogOverdue, isTaskOverdue, type OperationalSummary } from "./lib/taskRules";
import type { Task, TaskActions, TaskDraft, TaskPriority, TaskStatus, TaskType, WeekDay, WorkflowStatus } from "./types";
import "./styles.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const filtersStorageKey = "focusflow.filters";
const eInkPresetStorageKey = "focusflow.einkPreset";

type AppNotice = {
  id: number;
  message: string;
  undo?: () => void | Promise<void>;
};

type FilterState = {
  priority: "all" | TaskPriority;
  search: string;
  status: "all" | TaskStatus;
  type: "all" | TaskType;
};

type EInkPreset = "800x480" | "1024x758" | "print" | "tablet";

const eInkPresets: EInkPreset[] = ["800x480", "1024x758", "print", "tablet"];
const taskPriorities: TaskPriority[] = ["low", "normal", "high", "critical"];
const taskStatuses: TaskStatus[] = ["backlog", "planned", "doing", "delegated", "done"];
const taskTypes: TaskType[] = ["professional", "personal"];

const statusLabels: Record<TaskStatus, string> = {
  backlog: "Backlog",
  planned: "Não iniciada",
  doing: "Em andamento",
  delegated: "Delegada",
  done: "Concluída",
};

const priorityLabels: Record<TaskPriority, string> = {
  low: "Opcional",
  normal: "Normal",
  high: "Importante",
  critical: "Crítica",
};

const typeLabels: Record<TaskType, string> = {
  professional: "Profissional",
  personal: "Pessoal",
};

const kanbanColumns: Array<{ status: WorkflowStatus; label: string; hint: string }> = [
  { status: "planned", label: "Não iniciadas", hint: "Planejadas para a semana" },
  { status: "doing", label: "Em andamento", hint: "Execução ativa" },
  { status: "delegated", label: "Delegadas", hint: "Aguardando retorno" },
  { status: "done", label: "Concluídas", hint: "Feitas nesta semana" },
];

function ConvexApp() {
  const tasks = (useQuery(tasksApi.list) as Task[] | undefined) ?? [];
  const create = useMutation(tasksApi.create);
  const moveInKanban = useMutation(tasksApi.moveInKanban);
  const plan = useMutation(tasksApi.plan);
  const moveToWeek = useMutation(tasksApi.moveToWeek);
  const moveToBacklog = useMutation(tasksApi.moveToBacklog);
  const complete = useMutation(tasksApi.complete);
  const update = useMutation(tasksApi.update);
  const archive = useMutation(tasksApi.archive);
  const restore = useMutation(tasksApi.restore);
  const restoreSnapshot = useMutation(tasksApi.restoreSnapshot);

  const actions: TaskActions = useMemo(
    () => ({
      async createTask(draft) {
        await create(draft);
      },
      async updateTask(id, draft) {
        await update({ id: id as never, ...draft });
      },
      async moveInKanban(id, status, plannedWeek) {
        await moveInKanban({ id: id as never, status, plannedWeek });
      },
      async planTask(id, plannedDay, status) {
        await plan({ id: id as never, plannedDay, status });
      },
      async moveToWeek(id, plannedWeek, plannedDay) {
        await moveToWeek({ id: id as never, plannedWeek, plannedDay });
      },
      async moveToBacklog(id) {
        await moveToBacklog({ id: id as never });
      },
      async completeTask(id) {
        await complete({ id: id as never });
      },
      async archiveTask(id) {
        await archive({ id: id as never });
      },
      async restoreTask(id) {
        await restore({ id: id as never });
      },
      async restoreSnapshot(snapshot) {
        await restoreSnapshot({
          id: snapshot._id as never,
          title: snapshot.title,
          description: snapshot.description,
          nextStep: snapshot.nextStep,
          type: snapshot.type,
          status: snapshot.status,
          priority: snapshot.priority,
          plannedWeek: snapshot.plannedWeek,
          plannedDay: snapshot.plannedDay,
          sortOrder: snapshot.sortOrder,
          createdAt: snapshot.createdAt,
          completedAt: snapshot.completedAt,
          archivedAt: snapshot.archivedAt,
        });
      },
    }),
    [archive, complete, create, moveInKanban, moveToBacklog, moveToWeek, plan, restore, restoreSnapshot, update],
  );

  return <PlannerApp actions={actions} isConvexReady={Boolean(convexUrl)} tasks={tasks} />;
}

function LocalApp() {
  const [tasks, setTasks] = useState<Task[]>(loadLocalTasks);
  const actions = useMemo(() => createLocalActions(setTasks), []);

  useEffect(() => {
    saveLocalTasks(tasks);
  }, [tasks]);

  return <PlannerApp actions={actions} isConvexReady={false} tasks={tasks} />;
}

function PlannerApp({ tasks, actions, isConvexReady }: { tasks: Task[]; actions: TaskActions; isConvexReady: boolean }) {
  const [view, setView] = useState<"week" | "kanban">("kanban");
  const [kanbanScope, setKanbanScope] = useState<"week" | "all">("week");
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState<"all" | "overdue" | "backlog">("all");
  const [savedFilters, setSavedFilters] = useState<FilterState>(loadSavedFilters);
  const [modalTask, setModalTask] = useState<Task | "new" | null>(null);
  const [planningMove, setPlanningMove] = useState<{ id: string; status: WorkflowStatus } | null>(null);
  const [isEInk, setIsEInk] = useState(() => localStorage.getItem("focusflow.eink") === "true");
  const [eInkPreset, setEInkPreset] = useState<EInkPreset>(loadEInkPreset);
  const [notice, setNotice] = useState<AppNotice | null>(null);
  const [now, setNow] = useState(() => new Date());
  const { priority: priorityFilter, search, status: statusFilter, type: typeFilter } = savedFilters;
  const currentWeek = getIsoWeek(weekAnchor);
  const weekDays = getWeekDays(weekAnchor);

  useEffect(() => {
    localStorage.setItem("focusflow.eink", String(isEInk));
  }, [isEInk]);

  useEffect(() => {
    localStorage.setItem(eInkPresetStorageKey, eInkPreset);
  }, [eInkPreset]);

  useEffect(() => {
    localStorage.setItem(filtersStorageKey, JSON.stringify(savedFilters));
  }, [savedFilters]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function closeFloatingUi(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (weekPickerOpen) {
        event.preventDefault();
        setWeekPickerOpen(false);
        return;
      }
      if (filtersOpen) {
        event.preventDefault();
        setFiltersOpen(false);
      }
    }

    window.addEventListener("keydown", closeFloatingUi);
    return () => window.removeEventListener("keydown", closeFloatingUi);
  }, [filtersOpen, weekPickerOpen]);

  const activeTasks = useMemo(() => tasks.filter((task) => !task.archivedAt), [tasks]);
  const visibleTasks = useMemo(() => [...activeTasks].sort((a, b) => a.sortOrder - b.sortOrder || b.updatedAt - a.updatedAt), [activeTasks]);
  const filteredTasks = useMemo(
    () => filterTasks(visibleTasks, { priority: priorityFilter, search, status: statusFilter, type: typeFilter }),
    [priorityFilter, search, statusFilter, typeFilter, visibleTasks],
  );
  const doneThisWeek = visibleTasks.filter((task) => task.plannedDay && getEffectiveStatus(task) === "done" && isTimestampInsideWeek(task.completedAt, weekAnchor));
  const openThisWeekCount = visibleTasks.filter((task) => task.plannedDay && task.plannedWeek === currentWeek && getEffectiveStatus(task) !== "done").length;
  const summary = getOperationalSummary(visibleTasks);
  const activeFilterCount = [search.trim(), typeFilter !== "all", priorityFilter !== "all", statusFilter !== "all"].filter(Boolean).length;

  if (isEInk) {
    return <EInkBoard currentWeek={currentWeek} now={now} onExit={() => setIsEInk(false)} onPresetChange={setEInkPreset} preset={eInkPreset} tasks={visibleTasks} weekAnchor={weekAnchor} weekDays={weekDays} />;
  }

  function showNotice(message: string, undo?: AppNotice["undo"]) {
    const id = Date.now();
    setNotice({ id, message, undo });
    window.setTimeout(() => {
      setNotice((current) => (current?.id === id ? null : current));
    }, 4500);
  }

  function setFilterPatch(patch: Partial<FilterState>) {
    setSavedFilters((filters) => ({ ...filters, ...patch }));
  }

  function clearFilters() {
    setSavedFilters({ priority: "all", search: "", status: "all", type: "all" });
    setFiltersOpen(false);
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Digital Planner</p>
          <h1>Chief of Staff: Lynx</h1>
          <p className="topbar-copy">Semana em curso.</p>
        </div>
        <div className="topbar-actions">
          <span className={`sync-pill ${isConvexReady ? "live" : ""}`} title={isConvexReady ? "Dados conectados ao Convex" : "Modo local temporário até conectar o Convex"}>
            <Sparkles size={12} />
            {isConvexReady ? "Convex" : "Local"}
          </span>
          <Button className={`icon-toggle ${isEInk ? "active" : ""}`} onClick={() => setIsEInk((value) => !value)} size="icon" title="Alternar e-ink" variant="icon">
            <Eye size={14} />
          </Button>
          <div className="time-context">
            <strong>{now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</strong>
            <span>{now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</span>
          </div>
        </div>
      </section>

      <DashboardSummary actions={actions} onNotify={showNotice} onOpenTask={setModalTask} onPlanTask={setPlanningMove} summary={summary} />

      <section className="toolbar">
        <div className="toolbar-left">
          <div className="segmented" aria-label="Alternar visão">
            <button aria-pressed={view === "kanban"} className={view === "kanban" ? "active" : ""} onClick={() => setView("kanban")} type="button">
              <KanbanSquare size={16} /> Kanban
            </button>
            <button aria-pressed={view === "week"} className={view === "week" ? "active" : ""} onClick={() => setView("week")} type="button">
              <CalendarDays size={16} /> Semana
            </button>
          </div>
          <div className={`segmented muted scope-control ${view === "kanban" ? "" : "placeholder"}`} aria-hidden={view !== "kanban"} aria-label="Escopo do Kanban">
            <button aria-pressed={kanbanScope === "week"} className={kanbanScope === "week" ? "active" : ""} disabled={view !== "kanban"} onClick={() => setKanbanScope("week")} tabIndex={view === "kanban" ? 0 : -1} type="button">Esta semana</button>
            <button aria-pressed={kanbanScope === "all"} className={kanbanScope === "all" ? "active" : ""} disabled={view !== "kanban"} onClick={() => setKanbanScope("all")} tabIndex={view === "kanban" ? 0 : -1} type="button">Todas</button>
          </div>
        </div>
        <div className="week-picker-wrap">
          {weekPickerOpen ? <button aria-label="Fechar calendário semanal" className="week-picker-scrim" onClick={() => setWeekPickerOpen(false)} type="button" /> : null}
          <div className="week-switcher">
            <button aria-label="Semana anterior" onClick={() => setWeekAnchor((date) => addWeek(date, -1))} type="button">
              <ChevronLeft size={16} />
            </button>
            <button className="week-label" onClick={() => { setCalendarMonth(weekAnchor); setWeekPickerOpen((open) => !open); }} type="button">
              <span>
                <strong>{formatWeekCode(currentWeek)}</strong>
                <small>{formatCompactWeekRange(weekAnchor)}</small>
              </span>
            </button>
            <button aria-label="Próxima semana" onClick={() => setWeekAnchor((date) => addWeek(date, 1))} type="button">
              <ChevronRight size={16} />
            </button>
          </div>
          <button className="today-button" onClick={() => setWeekAnchor(new Date())} type="button">Hoje</button>
          {weekPickerOpen ? (
            <WeekPicker
              anchorDate={calendarMonth}
              selectedWeek={currentWeek}
              today={new Date()}
              onClose={() => setWeekPickerOpen(false)}
              onMonthChange={setCalendarMonth}
              onSelect={(date) => {
                setWeekAnchor(date);
                setWeekPickerOpen(false);
              }}
            />
          ) : null}
        </div>
        <div className="toolbar-actions">
          <Button onClick={() => setFiltersOpen((open) => !open)} variant="secondary">
            <Search size={16} />
            Buscar e filtrar{activeFilterCount ? ` · ${activeFilterCount}` : ""}
          </Button>
          <Button onClick={() => setModalTask("new")} variant="primary">
            <Plus size={16} />
            Nova atividade
          </Button>
        </div>
      </section>

      {filtersOpen ? (
        <FilterPanel
          activeCount={activeFilterCount}
          clearFilters={clearFilters}
          priorityFilter={priorityFilter}
          resultCount={filteredTasks.length}
          search={search}
          setPriorityFilter={(priority) => setFilterPatch({ priority })}
          setSearch={(value) => setFilterPatch({ search: value })}
          setStatusFilter={(status) => setFilterPatch({ status })}
          setTypeFilter={(type) => setFilterPatch({ type })}
          statusFilter={statusFilter}
          today={toDateKey(new Date())}
          totalCount={visibleTasks.length}
          typeFilter={typeFilter}
        />
      ) : null}

      <section className={`workspace ${view === "week" ? "week-workspace" : "kanban-workspace"} ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <BacklogSidebar
          actions={actions}
          filter={sidebarFilter}
          isCollapsed={sidebarCollapsed}
          onNotify={showNotice}
          onOpenTask={setModalTask}
          onPlanTask={setPlanningMove}
          onSetFilter={setSidebarFilter}
          onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
          tasks={filteredTasks}
        />
        <div className="workspace-main">
          {view === "week" ? (
            <WeekView actions={actions} currentWeek={currentWeek} onOpenTask={setModalTask} onNotify={showNotice} tasks={filteredTasks} weekDays={weekDays} />
          ) : (
            <KanbanView actions={actions} currentWeek={currentWeek} onNotify={showNotice} onPlanTask={setPlanningMove} onOpenTask={setModalTask} scope={kanbanScope} tasks={filteredTasks} />
          )}
        </div>
      </section>

      <ProgressStrip doneCount={doneThisWeek.length} overdueCount={summary.overdue.length} plannedCount={openThisWeekCount} />
      {notice ? <Toast notice={notice} onDismiss={() => setNotice(null)} /> : null}
      {modalTask ? <TaskModal actions={actions} onClose={() => setModalTask(null)} onNotify={showNotice} task={modalTask} /> : null}
      {planningMove ? (
        <PlanningDialog
          actions={actions}
          currentWeek={currentWeek}
          onClose={() => setPlanningMove(null)}
          onNotify={showNotice}
          task={visibleTasks.find((candidate) => candidate._id === planningMove.id)}
          targetStatus={planningMove.status}
          weekDays={weekDays}
        />
      ) : null}
    </main>
  );
}

function EInkBoard({ currentWeek, now, onExit, onPresetChange, preset, tasks, weekAnchor, weekDays }: { currentWeek: string; now: Date; onExit: () => void; onPresetChange: (preset: EInkPreset) => void; preset: EInkPreset; tasks: Task[]; weekAnchor: Date; weekDays: WeekDay[] }) {
  const weekTasks = tasks.filter((task) => task.plannedWeek === currentWeek && task.plannedDay);
  const doneThisWeek = tasks.filter((task) => task.plannedDay && getEffectiveStatus(task) === "done" && isTimestampInsideWeek(task.completedAt, weekAnchor));
  const backlogCount = tasks.filter((task) => !task.plannedDay).length;
  const businessDays = weekDays.slice(0, 5);
  const weekendDays = weekDays.slice(5);
  const columns = [
    ...businessDays.map((day) => ({
      date: formatDateLabel(day.date),
      key: day.date,
      label: day.label,
      tasks: weekTasks.filter((task) => task.plannedDay === day.date),
    })),
    {
      date: formatDateRangeLabel(weekendDays[0].date, weekendDays[1].date),
      key: "weekend",
      label: "Fim de semana",
      tasks: weekTasks.filter((task) => weekendDays.some((day) => day.date === task.plannedDay)),
    },
  ];

  return (
    <main className="eink-shell">
      <div className="eink-controls">
        <div className="segmented muted">
          {(["800x480", "1024x758", "tablet", "print"] as const).map((option) => (
            <button aria-pressed={preset === option} className={preset === option ? "active" : ""} key={option} onClick={() => onPresetChange(option)} type="button">{option}</button>
          ))}
        </div>
        <button className="eink-exit" onClick={onExit} type="button">Sair da visão e-ink</button>
      </div>
      <section className={`eink-board eink-${preset}`} aria-label="Quadro e-ink semanal">
        <header className="eink-header">
          <div>
            <p>FocusFlow semanal</p>
            <h1>{formatWeekCode(currentWeek)}</h1>
          </div>
          <div className="eink-range">
            <strong>{formatCompactWeekRange(weekAnchor)}</strong>
            <span>Atualizado {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </header>

        <div className="eink-week-grid">
          {columns.map((column) => (
            <article className="eink-day" key={column.key}>
              <header>
                <div>
                  <h2>{column.label}</h2>
                  <span>{column.date}</span>
                </div>
                <strong>{column.tasks.length}</strong>
              </header>
              <div className="eink-task-list">
                {column.tasks.length ? (
                  column.tasks.slice(0, 5).map((task) => <EInkTaskLine key={task._id} task={task} />)
                ) : (
                  <span className="eink-empty">Livre</span>
                )}
                {column.tasks.length > 5 ? <span className="eink-more">+{column.tasks.length - 5} restantes</span> : null}
              </div>
            </article>
          ))}
        </div>

        <footer className="eink-footer">
          <span>{weekTasks.length} distribuídas</span>
          <span>{backlogCount} no backlog</span>
          <span>{doneThisWeek.length} concluídas</span>
        </footer>
      </section>
    </main>
  );
}

function EInkTaskLine({ task }: { task: Task }) {
  return (
    <article className="eink-task">
      <div className="eink-task-meta">
        <span>{statusLabels[getEffectiveStatus(task)]}</span>
        <span>{priorityLabels[task.priority ?? "normal"]}</span>
      </div>
      <h3>{task.title}</h3>
    </article>
  );
}

function DashboardSummary({ actions, onNotify, onOpenTask, onPlanTask, summary }: { actions: TaskActions; onNotify: (message: string, undo?: AppNotice["undo"]) => void; onOpenTask: (task: Task) => void; onPlanTask: (move: { id: string; status: WorkflowStatus }) => void; summary: OperationalSummary }) {
  const items = [
    { empty: "Nada marcado para hoje.", icon: Clock3, label: "Hoje", tasks: summary.today, tone: "info" },
    { empty: "Sem atrasos.", icon: AlertTriangle, label: "Atrasadas", tasks: summary.overdue, tone: "danger" },
    { empty: "Nada esperando terceiros.", icon: Circle, label: "Delegadas", tasks: summary.delegated, tone: "sand" },
    { empty: "Sem preparação próxima.", icon: CalendarDays, label: "Próx. 14 dias", tasks: summary.next14, tone: "success" },
  ] as const;

  return (
    <section className="cockpit" aria-label="Cockpit operacional">
      <header className="section-header">
        <div>
          <h2>Cockpit</h2>
          <p>Agora e próximos prazos.</p>
        </div>
        <div className="relevance-counter">
          <strong>{summary.relevantCount} no radar</strong>
          <span>{summary.outsideCount} fora do radar</span>
        </div>
      </header>
      <div className="dashboard-summary">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article className={`summary-tile ${item.tone} ${item.tasks.length ? "has-items" : ""}`} key={item.label}>
              <header>
                <span><Icon size={15} /> {item.label}</span>
                <strong>{item.tasks.length}</strong>
              </header>
              <div className="mini-card-list">
                {item.tasks.slice(0, 3).map((task) => (
                  <article className="mini-card" key={task._id}>
                    <button className="mini-card-main" onClick={() => onOpenTask(task)} type="button">
                      <span>{task.title}</span>
                      <small>{priorityLabels[task.priority ?? "normal"]} · {task.plannedDay ? formatDateLabel(task.plannedDay) : statusLabels[task.status]}</small>
                    </button>
                    <div className="mini-card-actions">
                      {getEffectiveStatus(task) !== "doing" && getEffectiveStatus(task) !== "done" && task.plannedDay ? (
                        <button onClick={() => void runQuickAction(task, onNotify, () => actions.moveInKanban(task._id, "doing", task.plannedWeek ?? getIsoWeek(new Date())), "Movida para em andamento.", actions)} type="button">Iniciar</button>
                      ) : null}
                      {getEffectiveStatus(task) !== "done" && task.plannedDay ? (
                        <button onClick={() => void runQuickAction(task, onNotify, () => actions.completeTask(task._id), "Atividade concluída.", actions)} type="button">Concluir</button>
                      ) : null}
                      {isTaskOverdue(task, toDateKey(new Date())) || !task.plannedDay ? (
                        <button onClick={() => onPlanTask({ id: task._id, status: getEffectiveStatus(task) === "delegated" ? "delegated" : "planned" })} type="button">Replanejar</button>
                      ) : null}
                    </div>
                  </article>
                ))}
                {!item.tasks.length ? <p>{item.empty}</p> : null}
                {item.tasks.length > 3 ? <small className="more-count">+{item.tasks.length - 3} no painel</small> : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function FilterPanel({
  activeCount,
  clearFilters,
  priorityFilter,
  resultCount,
  search,
  setPriorityFilter,
  setSearch,
  setStatusFilter,
  setTypeFilter,
  statusFilter,
  today,
  totalCount,
  typeFilter,
}: {
  activeCount: number;
  clearFilters: () => void;
  priorityFilter: "all" | TaskPriority;
  resultCount: number;
  search: string;
  setPriorityFilter: (value: "all" | TaskPriority) => void;
  setSearch: (value: string) => void;
  setStatusFilter: (value: "all" | TaskStatus) => void;
  setTypeFilter: (value: "all" | TaskType) => void;
  statusFilter: "all" | TaskStatus;
  today: string;
  totalCount: number;
  typeFilter: "all" | TaskType;
}) {
  return (
    <section className="filter-panel">
      <input onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por título, projeto, contexto ou próximo passo" value={search} />
      <select onChange={(event) => setTypeFilter(event.target.value as "all" | TaskType)} value={typeFilter}>
        <option value="all">Todos os tipos</option>
        <option value="professional">Profissional</option>
        <option value="personal">Pessoal</option>
      </select>
      <select onChange={(event) => setPriorityFilter(event.target.value as "all" | TaskPriority)} value={priorityFilter}>
        <option value="all">Todas prioridades</option>
        <option value="low">P4 · Opcional</option>
        <option value="normal">P3 · Normal</option>
        <option value="high">P2 · Importante</option>
        <option value="critical">P1 · Crítica</option>
      </select>
      <select onChange={(event) => setStatusFilter(event.target.value as "all" | TaskStatus)} value={statusFilter}>
        <option value="all">Todos status</option>
        <option value="backlog">Backlog</option>
        <option value="planned">Não iniciada</option>
        <option value="doing">Em andamento</option>
        <option value="delegated">Delegada</option>
        <option value="done">Concluída</option>
      </select>
      <button disabled={!activeCount} onClick={clearFilters} type="button">Limpar</button>
      <strong>{resultCount} de {totalCount}</strong>
      <div className="quick-filters" aria-label="Filtros rápidos">
        <button aria-pressed={priorityFilter === "critical"} onClick={() => setPriorityFilter(priorityFilter === "critical" ? "all" : "critical")} type="button">P1</button>
        <button aria-pressed={search === today} onClick={() => setSearch(search === today ? "" : today)} type="button">Hoje</button>
        <button aria-pressed={statusFilter === "delegated"} onClick={() => setStatusFilter(statusFilter === "delegated" ? "all" : "delegated")} type="button">Delegadas</button>
        <button aria-pressed={typeFilter === "personal"} onClick={() => setTypeFilter(typeFilter === "personal" ? "all" : "personal")} type="button">Pessoal</button>
        <button aria-pressed={typeFilter === "professional"} onClick={() => setTypeFilter(typeFilter === "professional" ? "all" : "professional")} type="button">Profissional</button>
      </div>
    </section>
  );
}

function BacklogSidebar({
  actions,
  filter,
  isCollapsed,
  onOpenTask,
  onNotify,
  onPlanTask,
  onSetFilter,
  onToggle,
  tasks,
}: {
  actions: TaskActions;
  filter: "all" | "overdue" | "backlog";
  isCollapsed: boolean;
  onOpenTask: (task: Task) => void;
  onNotify: (message: string, undo?: AppNotice["undo"]) => void;
  onPlanTask: (move: { id: string; status: WorkflowStatus }) => void;
  onSetFilter: (filter: "all" | "overdue" | "backlog") => void;
  onToggle: () => void;
  tasks: Task[];
}) {
  const [isOver, setIsOver] = useState(false);
  const today = toDateKey(new Date());
  const overdue = tasks.filter((task) => isBacklogOverdue(task, today));
  const backlog = tasks.filter((task) => !task.plannedDay && !isBacklogOverdue(task, today));
  const visible = filter === "overdue" ? overdue : filter === "backlog" ? backlog : [...overdue, ...backlog];
  const dropHandlers = {
    onDragLeave: () => setIsOver(false),
    onDragOver: (event: DragEvent) => {
      event.preventDefault();
      setIsOver(true);
    },
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const id = event.dataTransfer.getData("text/task-id");
      setIsOver(false);
      const task = tasks.find((candidate) => candidate._id === id);
      if (!task) return;
      void actions.moveToBacklog(id)
        .then(() => onNotify("Voltou ao backlog.", () => actions.restoreSnapshot(task)))
        .catch((error: unknown) => onNotify(formatActionError(error)));
    },
  };

  if (isCollapsed) {
    return (
      <button aria-label="Expandir backlog" className={`backlog-rail ${isOver ? "drop-over" : ""}`} onClick={onToggle} type="button" {...dropHandlers}>
        <span className="rail-icon"><ChevronRight size={15} /></span>
        <span className="rail-label">
          <span>Backlog</span>
          <strong>{overdue.length + backlog.length}</strong>
        </span>
      </button>
    );
  }

  return (
    <aside className={`backlog-sidebar ${isOver ? "drop-over" : ""}`} {...dropHandlers}>
      <header>
        <div>
          <h2>Backlog</h2>
          <span>{overdue.length + backlog.length} no radar</span>
        </div>
        <button aria-label="Recolher backlog" onClick={onToggle} type="button"><ChevronLeft size={16} /></button>
      </header>
      <div className="sidebar-tabs">
        <button aria-pressed={filter === "all"} className={filter === "all" ? "active" : ""} onClick={() => onSetFilter("all")} type="button">Todos <strong>{overdue.length + backlog.length}</strong></button>
        <button aria-pressed={filter === "overdue"} className={filter === "overdue" ? "active" : ""} onClick={() => onSetFilter("overdue")} type="button" title="Pendências de semanas anteriores para reprogramar">Atrasadas <strong>{overdue.length}</strong></button>
        <button aria-pressed={filter === "backlog"} className={filter === "backlog" ? "active" : ""} onClick={() => onSetFilter("backlog")} type="button">Backlog <strong>{backlog.length}</strong></button>
      </div>
      <div className="sidebar-list">
        {visible.length ? visible.map((task) => <SidebarCard key={task._id} onOpenTask={onOpenTask} onPlanTask={onPlanTask} task={task} />) : <p className="sidebar-empty">Nada solto por aqui.</p>}
      </div>
    </aside>
  );
}

function SidebarCard({ onOpenTask, onPlanTask, task }: { onOpenTask: (task: Task) => void; onPlanTask: (move: { id: string; status: WorkflowStatus }) => void; task: Task }) {
  const overdue = isBacklogOverdue(task, toDateKey(new Date()));
  const detail = overdue ? `Atrasada${task.plannedDay ? ` · ${formatDateLabel(task.plannedDay)}` : ""}` : task.plannedDay ? formatDateLabel(task.plannedDay) : "Sem data";
  return (
    <article
      className={`sidebar-card ${overdue ? "overdue" : ""}`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/task-id", task._id);
        event.dataTransfer.effectAllowed = "move";
      }}
    >
      <button className="sidebar-card-main" onClick={() => onOpenTask(task)} type="button">
        <span>{typeLabels[task.type ?? "professional"]}</span>
        <strong>{task.title}</strong>
        <small>{detail} · {priorityLabels[task.priority ?? "normal"]}</small>
      </button>
      <button
        className="sidebar-plan-button"
        onClick={() => onPlanTask({ id: task._id, status: "planned" })}
        type="button"
      >
        Planejar
      </button>
    </article>
  );
}

function WeekPicker({
  anchorDate,
  onClose,
  onMonthChange,
  onSelect,
  selectedWeek,
  today,
}: {
  anchorDate: Date;
  onClose: () => void;
  onMonthChange: (date: Date) => void;
  onSelect: (date: Date) => void;
  selectedWeek: string;
  today: Date;
}) {
  const weeks = getMonthWeekRows(anchorDate);
  const monthLabel = anchorDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const todayKey = toDateKey(today);

  return (
    <section className="week-picker" aria-label="Selecionar semana">
      <header>
        <button aria-label="Mês anterior" onClick={() => onMonthChange(addMonth(anchorDate, -1))} type="button"><ChevronLeft size={15} /></button>
        <strong>{monthLabel}</strong>
        <button aria-label="Próximo mês" onClick={() => onMonthChange(addMonth(anchorDate, 1))} type="button"><ChevronRight size={15} /></button>
      </header>
      <div className="week-picker-grid">
        <span />
        {["S", "T", "Q", "Q", "S", "S", "D"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
        {weeks.map((week) => {
          const weekId = getIsoWeek(week[0]);
          return (
            <button className={`week-row ${weekId === selectedWeek ? "selected" : ""}`} key={weekId} onClick={() => onSelect(week[0])} type="button">
              <strong>{weekId.replace(/^.*-/, "")}</strong>
              {week.map((day) => {
                const dayKey = toDateKey(day);
                const outsideMonth = day.getMonth() !== anchorDate.getMonth();
                return (
                  <span className={`${outsideMonth ? "muted" : ""} ${dayKey === todayKey ? "today" : ""}`} key={dayKey}>
                    {day.getDate()}
                  </span>
                );
              })}
            </button>
          );
        })}
      </div>
      <footer>
        <button onClick={onClose} type="button">Fechar</button>
        <button onClick={() => onSelect(new Date())} type="button">Esta semana</button>
      </footer>
    </section>
  );
}

function WeekView({ tasks, actions, currentWeek, onNotify, onOpenTask, weekDays }: { tasks: Task[]; actions: TaskActions; currentWeek: string; onNotify: (message: string, undo?: AppNotice["undo"]) => void; onOpenTask: (task: Task) => void; weekDays: WeekDay[] }) {
  const businessDays = weekDays.slice(0, 5);
  const weekendDays = weekDays.slice(5);
  const weekendTasks = tasks.filter((task) => task.plannedDay && task.plannedWeek === currentWeek && weekendDays.some((day) => day.date === task.plannedDay));
  const todayKey = toDateKey(new Date());

  return (
    <section className="week-layout">
      <div className="week-main">
        <header className="main-title">
          <h2>Distribuição semanal</h2>
          <span>{currentWeek}</span>
        </header>
        <div className="days-grid">
          {businessDays.map((day) => (
            <DropColumn
              key={day.date}
              cardMode="week"
              date={formatDateLabel(day.date)}
              hint={day.shortLabel}
              isToday={day.date === todayKey}
              onDropTask={(id) => actions.moveToWeek(id, currentWeek, day.date)}
              onOpenTask={onOpenTask}
              tasks={tasks.filter((task) => task.plannedDay && task.plannedWeek === currentWeek && task.plannedDay === day.date)}
              title={day.label}
              actions={actions}
              onNotify={onNotify}
            />
          ))}
          <DropColumn
            cardMode="week"
            date={formatDateRangeLabel(weekendDays[0].date, weekendDays[1].date)}
            hint="Sábado e domingo"
            isToday={weekendDays.some((day) => day.date === todayKey)}
            onDropTask={(id) => actions.moveToWeek(id, currentWeek, weekendDays[0].date)}
            onOpenTask={onOpenTask}
            tasks={weekendTasks}
            title="Fim de semana"
            actions={actions}
            onNotify={onNotify}
          />
        </div>
      </div>
    </section>
  );
}

function KanbanView({ tasks, actions, currentWeek, onNotify, onOpenTask, onPlanTask, scope }: { tasks: Task[]; actions: TaskActions; currentWeek: string; onNotify: (message: string, undo?: AppNotice["undo"]) => void; onOpenTask: (task: Task) => void; onPlanTask: (move: { id: string; status: WorkflowStatus }) => void; scope: "week" | "all" }) {
  const today = toDateKey(new Date());
  const scopedTasks = tasks.filter((task) => {
    if (isBacklogOverdue(task, today)) return false;
    if (!task.plannedDay) return false;
    if (scope === "all") return true;
    return task.plannedWeek === currentWeek;
  });

  return (
    <section>
      <header className="main-title">
        <h2>Fluxo de trabalho</h2>
        <span>{scope === "week" ? "Esta semana" : "Todas"}</span>
      </header>
      <div className="kanban-board">
        {kanbanColumns.map((column) => {
          const columnTasks = scopedTasks.filter((task) => {
            const status = getEffectiveStatus(task);
            if (column.status === "planned") return status === "planned" && (scope === "all" || task.plannedWeek === currentWeek);
            if (column.status === "done") return status === "done" && (scope === "all" || task.plannedWeek === currentWeek);
            return status === column.status;
          });
          return (
            <DropColumn
              cardMode="kanban"
              key={column.status}
              hint={column.hint}
              onDropTask={(id) => {
                const task = tasks.find((candidate) => candidate._id === id);
                if (!task) return;
                if (!task.plannedDay || isBacklogOverdue(task, today)) {
                  onPlanTask({ id, status: column.status });
                  return;
                }
                void actions.moveInKanban(id, column.status, currentWeek);
                onNotify(`Movida para ${column.label.toLowerCase()}.`);
              }}
              onOpenTask={onOpenTask}
              tasks={columnTasks}
              title={column.label}
              actions={actions}
              onNotify={onNotify}
            />
          );
        })}
      </div>
    </section>
  );
}

function DropColumn({ title, hint, cardMode, date, isToday = false, tasks, actions, onDropTask, onNotify, onOpenTask }: { title: string; hint: string; cardMode: "kanban" | "week"; date?: string; isToday?: boolean; tasks: Task[]; actions: TaskActions; onDropTask: (id: string) => void; onNotify: (message: string, undo?: AppNotice["undo"]) => void; onOpenTask: (task: Task) => void }) {
  const [isOver, setIsOver] = useState(false);

  return (
    <article
      className={`task-column ${isToday ? "today-column" : ""} ${isOver ? "drop-over" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        const id = event.dataTransfer.getData("text/task-id");
        setIsOver(false);
        if (id) onDropTask(id);
      }}
    >
      <header className="column-header">
        <div>
          <h2>{title}</h2>
          <span>
            <span className="column-date-text">{date ?? hint}</span>
            {isToday ? <em>Hoje</em> : null}
          </span>
        </div>
        <strong>{tasks.length}</strong>
      </header>
      <div className="task-list">
        {tasks.length ? tasks.map((task) => <TaskCard key={task._id} actions={actions} mode={cardMode} onNotify={onNotify} onOpenTask={onOpenTask} task={task} />) : <EmptyState dragging={isOver} label={getEmptyLabel(title)} />}
      </div>
    </article>
  );
}

function TaskCard({ task, actions, mode, onNotify, onOpenTask }: { task: Task; actions: TaskActions; mode: "kanban" | "week"; onNotify: (message: string, undo?: AppNotice["undo"]) => void; onOpenTask: (task: Task) => void }) {
  const timing = getTimingState(task);
  const status = getEffectiveStatus(task);
  const topChip = mode === "kanban" ? getDayChip(task) : statusLabels[status];
  return (
    <article
      className={`task-card timing-${timing} ${status === "done" ? "is-done" : ""}`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/task-id", task._id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onOpenTask(task)}
    >
      <div className="card-meta-row">
        <span className={`priority-dot priority-${task.priority ?? "normal"}`} />
        {topChip ? <Badge className="top-chip">{topChip}</Badge> : null}
      </div>
      <h3>{task.title}</h3>
      <footer>
        <span />
        <div className="card-actions">
          {status !== "doing" && status !== "done" ? (
            <button aria-label="Iniciar tarefa" onClick={(event) => { void runCardAction(event, task, onNotify, () => actions.moveInKanban(task._id, "doing", task.plannedWeek ?? getIsoWeek(new Date())), "Movida para em andamento.", actions); }} onPointerDown={(event) => event.stopPropagation()} title="Iniciar" type="button">
              Iniciar
            </button>
          ) : null}
          {status !== "done" ? (
            <button aria-label="Concluir tarefa" onClick={(event) => { void runCardAction(event, task, onNotify, () => actions.completeTask(task._id), "Atividade concluída.", actions); }} onPointerDown={(event) => event.stopPropagation()} title="Concluir" type="button">
              Concluir
            </button>
          ) : null}
        </div>
      </footer>
    </article>
  );
}

function TaskModal({ actions, onClose, onNotify, task }: { actions: TaskActions; onClose: () => void; onNotify: (message: string, undo?: AppNotice["undo"]) => void; task: Task | "new" }) {
  const existing = task === "new" ? null : task;
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [nextStep, setNextStep] = useState(existing?.nextStep ?? "");
  const [type, setType] = useState<TaskType>(existing?.type ?? "professional");
  const [status, setStatus] = useState<TaskStatus>(existing?.status ?? "backlog");
  const [priority, setPriority] = useState<TaskPriority>(existing?.priority ?? "normal");
  const [plannedDay, setPlannedDay] = useState(existing?.plannedDay ?? "");
  const [pending, setPending] = useState(false);

  const plannedWeek = plannedDay ? getIsoWeek(new Date(`${plannedDay}T12:00:00`)) : undefined;
  const isScheduled = Boolean(plannedDay);

  async function save() {
    if (!title.trim() || pending) return;
    const draft: TaskDraft = {
      description,
      nextStep,
      plannedDay: plannedDay || undefined,
      plannedWeek,
      priority,
      status,
      title,
      type,
    };
    setPending(true);
    try {
      if (existing) {
        const previous = existing;
        await actions.updateTask(existing._id, draft);
        onNotify("Atividade salva.", () => actions.restoreSnapshot(previous));
      } else {
        await actions.createTask(draft);
        onNotify("Atividade criada.");
      }
      onClose();
    } catch (error) {
      onNotify(formatActionError(error));
    } finally {
      setPending(false);
    }
  }

  async function complete() {
    if (!existing || pending) return;
    const previous = existing;
    setPending(true);
    try {
      await actions.completeTask(existing._id);
      onNotify("Atividade concluída.", () => actions.restoreSnapshot(previous));
      onClose();
    } catch (error) {
      onNotify(formatActionError(error));
    } finally {
      setPending(false);
    }
  }

  async function archive() {
    if (!existing || pending) return;
    if (!window.confirm("Arquivar esta atividade? Ela sai do dashboard ativo, mas continua preservada para histórico.")) return;
    setPending(true);
    try {
      await actions.archiveTask(existing._id);
      onNotify("Atividade arquivada.", () => actions.restoreSnapshot(existing));
      onClose();
    } catch (error) {
      onNotify(formatActionError(error));
    } finally {
      setPending(false);
    }
  }

  async function moveBacklog() {
    if (!existing || pending) return;
    const previous = existing;
    setPending(true);
    try {
      await actions.moveToBacklog(existing._id);
      onNotify("Voltou ao backlog.", () => actions.restoreSnapshot(previous));
      onClose();
    } catch (error) {
      onNotify(formatActionError(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog onOpenChange={onClose}>
      <DialogContent className="task-modal" onMouseDown={(event) => event.stopPropagation()}>
        <DialogHeader>
          <div>
            <p className="eyebrow">{existing ? "Editar atividade" : "Nova atividade"}</p>
            <h2>{existing ? "Detalhes da atividade" : "Nova atividade"}</h2>
          </div>
          <Button aria-label="Fechar" disabled={pending} onClick={onClose} size="icon" variant="secondary"><X size={18} /></Button>
        </DialogHeader>

        <label>
          Título
          <input autoFocus onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Revisar proposta" value={title} />
        </label>

        <div className="modal-grid">
          <FieldPills<TaskType> label="Tipo" onChange={setType} options={[["professional", "Profissional"], ["personal", "Pessoal"]]} value={type} />
          <FieldPills<TaskPriority> label="Prioridade" onChange={setPriority} options={[["low", "Opcional"], ["normal", "Normal"], ["high", "Importante"], ["critical", "Crítica"]]} value={priority} />
        </div>

        <FieldPills<TaskStatus>
          label="Status"
          onChange={setStatus}
          options={[["planned", "Não iniciada"], ["doing", "Em andamento"], ["delegated", "Delegada"], ["done", "Concluída"]]}
          value={status}
        />

        <div className="date-row">
          <label>
            Data
            <input onChange={(event) => { setPlannedDay(event.target.value); if (status === "backlog" && event.target.value) setStatus("planned"); }} type="date" value={plannedDay} />
          </label>
          <Button onClick={() => { setPlannedDay(""); setStatus("backlog"); }} variant="secondary">Sem data</Button>
          <Button onClick={() => { const today = toDateKey(new Date()); setPlannedDay(today); if (status === "backlog") setStatus("planned"); }} variant="secondary">Hoje</Button>
        </div>

        <label>
          Próximo passo
          <textarea onChange={(event) => setNextStep(event.target.value)} placeholder="Qual é a próxima ação concreta?" rows={2} value={nextStep} />
        </label>

        <label>
          Contexto
          <textarea onChange={(event) => setDescription(event.target.value)} placeholder="Contexto opcional." rows={2} value={description} />
        </label>

        <DialogFooter>
          <div>
            {existing && isScheduled ? <Button disabled={pending} onClick={complete} variant="secondary">Concluir</Button> : null}
            {existing && isScheduled ? <Button disabled={pending} onClick={moveBacklog} variant="secondary">Voltar ao backlog</Button> : null}
            {existing ? <Button disabled={pending} onClick={archive} variant="danger">Arquivar</Button> : null}
          </div>
          <div>
            <Button disabled={pending} onClick={onClose} variant="secondary">Cancelar</Button>
            <Button disabled={pending || !title.trim()} onClick={save} variant="primary">{pending ? "Salvando" : existing ? "Salvar" : "Criar"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlanningDialog({ actions, currentWeek, onClose, onNotify, targetStatus, task, weekDays }: { actions: TaskActions; currentWeek: string; onClose: () => void; onNotify: (message: string, undo?: AppNotice["undo"]) => void; targetStatus: WorkflowStatus; task?: Task; weekDays: WeekDay[] }) {
  const [customDate, setCustomDate] = useState("");
  const [pending, setPending] = useState(false);
  if (!task) return null;

  const today = new Date();
  const tomorrow = addDays(today, 1);
  const quickDates = [
    { date: toDateKey(today), label: "Hoje" },
    { date: toDateKey(tomorrow), label: "Amanhã" },
    ...weekDays.slice(0, 5).map((day) => ({ date: day.date, label: day.label })),
    { date: weekDays[5].date, label: "Fim de semana" },
  ].filter((choice, index, choices) => getIsoWeek(new Date(`${choice.date}T12:00:00`)) === currentWeek && choices.findIndex((item) => item.date === choice.date) === index);

  async function plan(date: string) {
    if (!task || !date || pending) return;
    const previous = task;
    setPending(true);
    try {
      await actions.planTask(task._id, date, targetStatus);
      onNotify("Atividade planejada.", () => actions.restoreSnapshot(previous));
      onClose();
    } catch (error) {
      onNotify(formatActionError(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog onOpenChange={onClose}>
      <DialogContent className="planning-dialog" onMouseDown={(event) => event.stopPropagation()}>
        <DialogHeader>
          <div>
            <p className="eyebrow">Planejar atividade</p>
            <h2>Escolha um dia</h2>
          </div>
          <Button aria-label="Fechar" disabled={pending} onClick={onClose} size="icon" variant="secondary"><X size={18} /></Button>
        </DialogHeader>
        <p className="planning-copy">Para entrar em {statusLabels[targetStatus].toLowerCase()}, a tarefa precisa estar no calendário.</p>
        <div className="planning-options">
          {quickDates.map((choice) => (
            <Button disabled={pending} key={`${choice.label}-${choice.date}`} onClick={() => void plan(choice.date)} variant="secondary">
              {choice.label}
            </Button>
          ))}
        </div>
        <div className="date-row planning-date-row">
          <label>
            Outro dia
            <input onChange={(event) => setCustomDate(event.target.value)} type="date" value={customDate} />
          </label>
          <Button disabled={!customDate || pending} onClick={() => void plan(customDate)} variant="primary">{pending ? "Planejando" : "Planejar"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldPills<T extends string>({ label, onChange, options, value }: { label: string; onChange: (value: T) => void; options: Array<[T, string]>; value: T }) {
  return (
    <fieldset className="field-pills">
      <legend>{label}</legend>
      <div>
        {options.map(([option, text]) => (
          <button className={`${value === option ? "active" : ""} pill-${option}`} key={option} onClick={() => onChange(option)} type="button">{text}</button>
        ))}
      </div>
    </fieldset>
  );
}

function EmptyState({ dragging, label }: { dragging: boolean; label: string }) {
  return (
    <div className="empty-state">
      <Loader2 size={18} />
      <span>{dragging ? "Solte aqui" : label}</span>
    </div>
  );
}

function ProgressStrip({ doneCount, overdueCount, plannedCount }: { doneCount: number; overdueCount: number; plannedCount: number }) {
  const total = doneCount + plannedCount;
  const progress = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <section className="progress-strip" aria-label="Resumo da semana">
      <div>
        <span>Semana</span>
        <strong>{progress}% concluída</strong>
      </div>
      <div className="progress-track">
        <span style={{ width: `${progress}%` }} />
      </div>
      <p>{doneCount} concluídas · {plannedCount} abertas · {overdueCount} atrasadas</p>
    </section>
  );
}

function Toast({ notice, onDismiss }: { notice: AppNotice; onDismiss: () => void }) {
  return (
    <aside className="toast" role="status" aria-live="polite">
      <span>{notice.message}</span>
      {notice.undo ? (
        <button
          onClick={() => {
            void notice.undo?.();
            onDismiss();
          }}
          type="button"
        >
          Desfazer
        </button>
      ) : null}
      <button aria-label="Fechar aviso" onClick={onDismiss} type="button">×</button>
    </aside>
  );
}

async function runCardAction(
  event: MouseEvent<HTMLButtonElement>,
  task: Task,
  onNotify: (message: string, undo?: AppNotice["undo"]) => void,
  action: () => Promise<void>,
  message: string,
  actions: TaskActions,
) {
  event.preventDefault();
  event.stopPropagation();
  await runQuickAction(task, onNotify, action, message, actions);
}

async function runQuickAction(task: Task, onNotify: (message: string, undo?: AppNotice["undo"]) => void, action: () => Promise<void>, message: string, actions: TaskActions) {
  const previous = task;
  try {
    await action();
    onNotify(message, () => actions.restoreSnapshot(previous));
  } catch (error) {
    onNotify(formatActionError(error));
  }
}

function formatActionError(error: unknown): string {
  if (error instanceof Error && error.message.includes("Task title")) return "Informe um título para salvar.";
  return "Não consegui concluir a ação. Tente novamente.";
}

function getEmptyLabel(title: string): string {
  if (title === "Delegadas") return "Nenhuma delegada";
  if (title === "Concluídas") return "Nada concluído ainda";
  if (title === "Não iniciadas") return "Nada planejado aqui";
  if (title === "Em andamento") return "Nada em execução";
  return "Nada por aqui";
}

function loadSavedFilters(): FilterState {
  const fallback: FilterState = { priority: "all", search: "", status: "all", type: "all" };
  const stored = localStorage.getItem(filtersStorageKey);
  if (!stored) return fallback;
  try {
    const parsed = JSON.parse(stored) as Partial<FilterState>;
    return {
      priority: isTaskPriority(parsed.priority) ? parsed.priority : fallback.priority,
      search: typeof parsed.search === "string" ? parsed.search : fallback.search,
      status: isTaskStatus(parsed.status) ? parsed.status : fallback.status,
      type: isTaskType(parsed.type) ? parsed.type : fallback.type,
    };
  } catch {
    return fallback;
  }
}

function loadEInkPreset(): EInkPreset {
  const stored = localStorage.getItem(eInkPresetStorageKey);
  return isEInkPreset(stored) ? stored : "800x480";
}

function isEInkPreset(value: unknown): value is EInkPreset {
  return typeof value === "string" && eInkPresets.includes(value as EInkPreset);
}

function isTaskPriority(value: unknown): value is FilterState["priority"] {
  return value === "all" || taskPriorities.includes(value as TaskPriority);
}

function isTaskStatus(value: unknown): value is FilterState["status"] {
  return value === "all" || taskStatuses.includes(value as TaskStatus);
}

function isTaskType(value: unknown): value is FilterState["type"] {
  return value === "all" || taskTypes.includes(value as TaskType);
}

function addWeek(date: Date, direction: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + direction * 7);
  return copy;
}

function addMonth(date: Date, direction: number): Date {
  const copy = new Date(date);
  copy.setDate(1);
  copy.setMonth(copy.getMonth() + direction);
  return copy;
}

function getMonthWeekRows(anchorDate: Date): Date[][] {
  const firstOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const firstWeekStart = startOfWeek(firstOfMonth);
  return Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => addDays(firstWeekStart, weekIndex * 7 + dayIndex)),
  );
}

function formatDay(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" });
}

function getDayChip(task: Task): string {
  if (task.plannedDay) return formatDay(task.plannedDay);
  return "Sem data";
}

function formatDateLabel(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatDateRangeLabel(start: string, end: string): string {
  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);
  const startDay = startDate.toLocaleDateString("pt-BR", { day: "2-digit" });
  const endDay = endDate.toLocaleDateString("pt-BR", { day: "2-digit" });
  const startMonth = startDate.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  const endMonth = endDate.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");

  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startDay}-${endDay} ${endMonth}`;
  }

  return `${startDay} ${startMonth}-${endDay} ${endMonth}`;
}

function formatWeekCode(week: string): string {
  const [, weekNumber] = week.split("-W");
  return `Semana ${Number(weekNumber)}`;
}

function formatCompactWeekRange(anchorDate: Date): string {
  const monday = startOfWeek(anchorDate);
  const sunday = addDays(monday, 6);
  const startDay = monday.toLocaleDateString("pt-BR", { day: "2-digit" });
  const endDay = sunday.toLocaleDateString("pt-BR", { day: "2-digit" });
  const startMonth = monday.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  const endMonth = sunday.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");

  if (monday.getMonth() === sunday.getMonth()) {
    return `${startDay} a ${endDay} de ${endMonth}`;
  }

  return `${startDay} ${startMonth} a ${endDay} ${endMonth}`;
}

const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    {convexUrl ? (
      <ConvexProvider client={new ConvexReactClient(convexUrl)}>
        <ConvexApp />
      </ConvexProvider>
    ) : (
      <LocalApp />
    )}
  </StrictMode>,
);
