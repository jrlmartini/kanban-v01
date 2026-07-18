import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const optionalString = v.optional(v.string());

const decisionFields = {
  title: v.string(),
  context: optionalString,
  options: optionalString,
  recommendation: optionalString,
  dueDate: optionalString,
  blocksWho: optionalString,
  projectId: v.optional(v.id("projects")),
};

function normalize(args: { title: string; context?: string; options?: string; recommendation?: string; dueDate?: string; blocksWho?: string }) {
  return {
    title: args.title.trim(),
    context: args.context?.trim() || undefined,
    options: args.options?.trim() || undefined,
    recommendation: args.recommendation?.trim() || undefined,
    dueDate: args.dueDate || undefined,
    blocksWho: args.blocksWho?.trim() || undefined,
  };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const decisions = await ctx.db.query("decisions").collect();
    return decisions
      .filter((decision) => !decision.archivedAt)
      .sort((a, b) => {
        if (Boolean(a.decidedAt) !== Boolean(b.decidedAt)) return a.decidedAt ? 1 : -1;
        return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || b.updatedAt - a.updatedAt;
      });
  },
});

export const create = mutation({
  args: decisionFields,
  handler: async (ctx, args) => {
    if (!args.title.trim()) throw new Error("Decision title is required.");
    const now = Date.now();
    return await ctx.db.insert("decisions", {
      ...args,
      ...normalize(args),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: { id: v.id("decisions"), ...decisionFields },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    const decision = await ctx.db.get(id);
    if (!decision) return;
    if (!patch.title.trim()) throw new Error("Decision title is required.");
    await ctx.db.patch(id, {
      ...patch,
      ...normalize(patch),
      updatedAt: Date.now(),
    });
  },
});

export const decide = mutation({
  args: { id: v.id("decisions"), outcome: v.string() },
  handler: async (ctx, args) => {
    const decision = await ctx.db.get(args.id);
    if (!decision) return;
    const now = Date.now();
    await ctx.db.patch(args.id, {
      outcome: args.outcome.trim() || undefined,
      decidedAt: now,
      updatedAt: now,
    });
  },
});

export const reopen = mutation({
  args: { id: v.id("decisions") },
  handler: async (ctx, args) => {
    const decision = await ctx.db.get(args.id);
    if (!decision) return;
    await ctx.db.patch(args.id, { decidedAt: undefined, outcome: undefined, updatedAt: Date.now() });
  },
});

export const archive = mutation({
  args: { id: v.id("decisions") },
  handler: async (ctx, args) => {
    const decision = await ctx.db.get(args.id);
    if (!decision) return;
    await ctx.db.patch(args.id, { archivedAt: Date.now(), updatedAt: Date.now() });
  },
});
