import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const taskStatus = v.union(
  v.literal("backlog"),
  v.literal("planned"),
  v.literal("doing"),
  v.literal("delegated"),
  v.literal("done"),
);

export const workflowStatus = v.union(
  v.literal("planned"),
  v.literal("doing"),
  v.literal("delegated"),
  v.literal("done"),
);

export const taskPriority = v.union(
  v.literal("low"),
  v.literal("normal"),
  v.literal("high"),
  v.literal("critical"),
);

export const taskType = v.union(v.literal("professional"), v.literal("personal"));

export const waitingKind = v.union(
  v.literal("delegated"),
  v.literal("waiting"),
  v.literal("blocked"),
  v.literal("parked"),
);

export const taskImpact = v.union(
  v.literal("cash"),
  v.literal("asset"),
  v.literal("unblock"),
  v.literal("maintenance"),
);

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    nextStep: v.optional(v.string()),
    type: v.optional(taskType),
    status: taskStatus,
    priority: v.optional(taskPriority),
    plannedWeek: v.optional(v.string()),
    plannedDay: v.optional(v.string()),
    impact: v.optional(taskImpact),
    waitingKind: v.optional(waitingKind),
    delegatedTo: v.optional(v.string()),
    followUpAt: v.optional(v.string()),
    waitingSince: v.optional(v.number()),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_planned_week", ["plannedWeek"])
    .index("by_planned_day", ["plannedDay"])
    .index("by_completed_at", ["completedAt"])
    .index("by_archived_at", ["archivedAt"]),
});
