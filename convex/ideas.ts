import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ideaVerdict, projectFront } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const ideas = await ctx.db.query("ideas").collect();
    return ideas.filter((idea) => !idea.archivedAt).sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    note: v.optional(v.string()),
    front: v.optional(projectFront),
  },
  handler: async (ctx, args) => {
    if (!args.title.trim()) throw new Error("Idea title is required.");
    const now = Date.now();
    return await ctx.db.insert("ideas", {
      title: args.title.trim(),
      note: args.note?.trim() || undefined,
      front: args.front,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setVerdict = mutation({
  args: { id: v.id("ideas"), verdict: ideaVerdict },
  handler: async (ctx, args) => {
    const idea = await ctx.db.get(args.id);
    if (!idea) return;
    const now = Date.now();
    await ctx.db.patch(args.id, { verdict: args.verdict, reviewedAt: now, updatedAt: now });
  },
});

export const promote = mutation({
  args: { id: v.id("ideas") },
  handler: async (ctx, args) => {
    const idea = await ctx.db.get(args.id);
    if (!idea || idea.promotedTaskId) return;
    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      title: idea.title,
      description: idea.note,
      type: idea.front === "pessoal" ? "personal" : "professional",
      status: "backlog",
      priority: "normal",
      sortOrder: now,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(args.id, {
      verdict: "now",
      reviewedAt: now,
      promotedTaskId: taskId,
      updatedAt: now,
    });
    return taskId;
  },
});

export const archive = mutation({
  args: { id: v.id("ideas") },
  handler: async (ctx, args) => {
    const idea = await ctx.db.get(args.id);
    if (!idea) return;
    await ctx.db.patch(args.id, { archivedAt: Date.now(), updatedAt: Date.now() });
  },
});
