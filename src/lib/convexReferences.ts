import { api } from "../../convex/_generated/api";

export const tasksApi = {
  list: api.tasks.list,
  create: api.tasks.create,
  update: api.tasks.update,
  moveInKanban: api.tasks.moveInKanban,
  plan: api.tasks.plan,
  moveToWeek: api.tasks.moveToWeek,
  moveToBacklog: api.tasks.moveToBacklog,
  complete: api.tasks.complete,
  archive: api.tasks.archive,
  restore: api.tasks.restore,
  restoreSnapshot: api.tasks.restoreSnapshot,
};
