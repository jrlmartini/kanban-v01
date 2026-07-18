import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { projectFront, projectStage } from "./schema";

const optionalString = v.optional(v.string());

const projectFields = {
  name: v.string(),
  front: projectFront,
  objective: optionalString,
  owner: optionalString,
  stage: projectStage,
  nextMilestone: optionalString,
  nextMilestoneDate: optionalString,
  nextStep: optionalString,
  blockedNote: optionalString,
};

function normalize(args: { name: string; objective?: string; owner?: string; nextMilestone?: string; nextMilestoneDate?: string; nextStep?: string; blockedNote?: string }) {
  return {
    name: args.name.trim(),
    objective: args.objective?.trim() || undefined,
    owner: args.owner?.trim() || undefined,
    nextMilestone: args.nextMilestone?.trim() || undefined,
    nextMilestoneDate: args.nextMilestoneDate || undefined,
    nextStep: args.nextStep?.trim() || undefined,
    blockedNote: args.blockedNote?.trim() || undefined,
  };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();
    return projects.filter((project) => !project.archivedAt).sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const create = mutation({
  args: projectFields,
  handler: async (ctx, args) => {
    if (!args.name.trim()) throw new Error("Project name is required.");
    const now = Date.now();
    return await ctx.db.insert("projects", {
      ...args,
      ...normalize(args),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: { id: v.id("projects"), ...projectFields },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    const project = await ctx.db.get(id);
    if (!project) return;
    if (!patch.name.trim()) throw new Error("Project name is required.");
    await ctx.db.patch(id, {
      ...patch,
      ...normalize(patch),
      updatedAt: Date.now(),
    });
  },
});

export const archive = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (!project) return;
    await ctx.db.patch(args.id, { archivedAt: Date.now(), updatedAt: Date.now() });
  },
});
