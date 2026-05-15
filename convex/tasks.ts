import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { taskPriority, taskStatus, taskType, workflowStatus } from "./schema";

const optionalString = v.optional(v.string());
const DAY_MS = 24 * 60 * 60 * 1000;

type TaskInputStatus = "backlog" | "planned" | "doing" | "delegated" | "done";

function getIsoWeek(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function resolveInputStatus(plannedDay: string | undefined, status: TaskInputStatus | undefined): TaskInputStatus {
  if (!plannedDay) return "backlog";
  if (!status || status === "backlog") return "planned";
  return status;
}

function normalizeTaskInput(args: {
  title?: string;
  description?: string;
  nextStep?: string;
  type?: "professional" | "personal";
  status?: TaskInputStatus;
  priority?: "low" | "normal" | "high" | "critical";
  plannedWeek?: string;
  plannedDay?: string;
}) {
  const hasDate = Boolean(args.plannedDay);
  const plannedWeek = args.plannedDay ? getIsoWeek(args.plannedDay) : undefined;

  return {
    title: args.title?.trim(),
    description: args.description?.trim() || undefined,
    nextStep: args.nextStep?.trim() || undefined,
    type: args.type ?? "professional",
    priority: args.priority ?? "normal",
    status: resolveInputStatus(args.plannedDay, args.status),
    plannedWeek: hasDate ? plannedWeek : undefined,
    plannedDay: hasDate ? args.plannedDay : undefined,
  };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    return tasks.filter((task) => !task.archivedAt).sort((a, b) => a.sortOrder - b.sortOrder || b.updatedAt - a.updatedAt);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: optionalString,
    nextStep: optionalString,
    type: v.optional(taskType),
    status: v.optional(taskStatus),
    priority: v.optional(taskPriority),
    plannedWeek: optionalString,
    plannedDay: optionalString,
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const normalized = normalizeTaskInput(args);
    if (!normalized.title) throw new Error("Task title is required.");
    return await ctx.db.insert("tasks", {
      ...normalized,
      title: normalized.title,
      sortOrder: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.string(),
    description: optionalString,
    nextStep: optionalString,
    type: v.optional(taskType),
    status: v.optional(taskStatus),
    priority: v.optional(taskPriority),
    plannedWeek: optionalString,
    plannedDay: optionalString,
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    const task = await ctx.db.get(id);
    if (!task) return;
    const now = Date.now();
    const normalized = normalizeTaskInput(patch);
    if (!normalized.title) throw new Error("Task title is required.");
    await ctx.db.patch(id, {
      ...normalized,
      completedAt: normalized.status === "done" ? task.completedAt ?? now : undefined,
      updatedAt: now,
    });
  },
});

export const moveInKanban = mutation({
  args: {
    id: v.id("tasks"),
    status: workflowStatus,
    plannedWeek: optionalString,
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const task = await ctx.db.get(args.id);
    if (!task) return;
    const patch: {
      status: typeof args.status;
      plannedWeek?: string;
      completedAt?: number;
      updatedAt: number;
    } = {
      status: args.status,
      updatedAt: now,
    };

    if (!task.plannedDay) {
      await ctx.db.patch(args.id, {
        status: "backlog",
        plannedWeek: undefined,
        plannedDay: undefined,
        completedAt: undefined,
        updatedAt: now,
      });
      return;
    }

    patch.plannedWeek = task.plannedWeek ?? args.plannedWeek;

    if (args.status === "done") {
      patch.completedAt = task.completedAt ?? now;
    } else {
      patch.completedAt = undefined;
    }

    await ctx.db.patch(args.id, patch);
  },
});

export const plan = mutation({
  args: {
    id: v.id("tasks"),
    plannedDay: v.string(),
    status: workflowStatus,
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) return;
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: args.status,
      plannedWeek: getIsoWeek(args.plannedDay),
      plannedDay: args.plannedDay,
      completedAt: args.status === "done" ? task.completedAt ?? now : undefined,
      updatedAt: now,
    });
  },
});

export const moveToWeek = mutation({
  args: {
    id: v.id("tasks"),
    plannedWeek: v.string(),
    plannedDay: optionalString,
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) return;
    const plannedWeek = args.plannedDay ? getIsoWeek(args.plannedDay) : undefined;

    await ctx.db.patch(args.id, {
      status: args.plannedDay ? task.status === "backlog" ? "planned" : task.status : "backlog",
      plannedWeek: args.plannedDay ? plannedWeek ?? args.plannedWeek : undefined,
      plannedDay: args.plannedDay,
      completedAt: args.plannedDay ? task.completedAt : undefined,
      updatedAt: Date.now(),
    });
  },
});

export const moveToBacklog = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) return;
    await ctx.db.patch(args.id, {
      status: "backlog",
      plannedWeek: undefined,
      plannedDay: undefined,
      completedAt: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const complete = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const task = await ctx.db.get(args.id);
    if (!task) return;
    if (!task.plannedDay) {
      await ctx.db.patch(args.id, {
        status: "backlog",
        completedAt: undefined,
        updatedAt: now,
      });
      return;
    }
    await ctx.db.patch(args.id, {
      status: "done",
      completedAt: task.completedAt ?? now,
      updatedAt: now,
    });
  },
});

export const archive = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const task = await ctx.db.get(args.id);
    if (!task) return;
    await ctx.db.patch(args.id, {
      archivedAt: now,
      updatedAt: now,
    });
  },
});

export const restore = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) return;
    await ctx.db.patch(args.id, {
      archivedAt: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const restoreSnapshot = mutation({
  args: {
    id: v.id("tasks"),
    title: v.string(),
    description: optionalString,
    nextStep: optionalString,
    type: v.optional(taskType),
    status: taskStatus,
    priority: v.optional(taskPriority),
    plannedWeek: optionalString,
    plannedDay: optionalString,
    sortOrder: v.number(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...snapshot } = args;
    const task = await ctx.db.get(id);
    if (!task) return;
    await ctx.db.patch(id, {
      ...snapshot,
      plannedWeek: snapshot.plannedDay ? getIsoWeek(snapshot.plannedDay) : undefined,
      updatedAt: Date.now(),
    });
  },
});
