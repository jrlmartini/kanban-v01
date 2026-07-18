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

export const projectsApi = {
  list: api.projects.list,
  create: api.projects.create,
  update: api.projects.update,
  archive: api.projects.archive,
};

export const decisionsApi = {
  list: api.decisions.list,
  create: api.decisions.create,
  update: api.decisions.update,
  decide: api.decisions.decide,
  reopen: api.decisions.reopen,
  archive: api.decisions.archive,
};

export const ideasApi = {
  list: api.ideas.list,
  create: api.ideas.create,
  setVerdict: api.ideas.setVerdict,
  promote: api.ideas.promote,
  archive: api.ideas.archive,
};
