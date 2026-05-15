import { makeFunctionReference } from "convex/server";

export const tasksApi = {
  list: makeFunctionReference<"query">("tasks:list"),
  create: makeFunctionReference<"mutation">("tasks:create"),
  update: makeFunctionReference<"mutation">("tasks:update"),
  moveInKanban: makeFunctionReference<"mutation">("tasks:moveInKanban"),
  plan: makeFunctionReference<"mutation">("tasks:plan"),
  moveToWeek: makeFunctionReference<"mutation">("tasks:moveToWeek"),
  moveToBacklog: makeFunctionReference<"mutation">("tasks:moveToBacklog"),
  complete: makeFunctionReference<"mutation">("tasks:complete"),
  archive: makeFunctionReference<"mutation">("tasks:archive"),
  restore: makeFunctionReference<"mutation">("tasks:restore"),
  restoreSnapshot: makeFunctionReference<"mutation">("tasks:restoreSnapshot"),
};
