import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "./ui/dialog";
import { FieldPills } from "./field-pills";
import { formatDateLabel } from "../lib/format";
import { addDays, toDateKey } from "../lib/dates";
import { getEffectiveStatus } from "../lib/taskRules";
import type { Decision, DecisionDraft, Idea, IdeaVerdict, Project, ProjectDraft, ProjectFront, ProjectStage, RadarActions, Task } from "../types";

export const frontLabels: Record<ProjectFront, string> = {
  conatus: "Conatus",
  iara: "Iara / SC",
  agro: "Agro deep tech",
  "fontes-verdes": "Fontes Verdes",
  launchpad: "LaunchpadHub",
  pessoal: "Pessoal",
  outro: "Outro",
};

export const stageLabels: Record<ProjectStage, string> = {
  exploring: "Explorando",
  active: "Ativo",
  waiting: "Aguardando",
  parked: "Estacionado",
};

const verdictLabels: Record<IdeaVerdict, string> = {
  now: "Agora",
  later: "Depois",
  incubate: "Incubar",
  discard: "Descartar",
};

const fronts = Object.keys(frontLabels) as ProjectFront[];

export function isDecisionUrgent(decision: Decision, today: string): boolean {
  if (decision.decidedAt) return false;
  if (decision.blocksWho) return true;
  if (!decision.dueDate) return false;
  return decision.dueDate <= toDateKey(addDays(new Date(`${today}T12:00:00`), 3));
}

export type RadarTab = "projects" | "decisions" | "ideas";

type Notify = (message: string) => void;

export function RadarView({ actions, decisions, ideas, initialTab, onNotify, projects, tasks }: { actions?: RadarActions; decisions: Decision[]; ideas: Idea[]; initialTab: RadarTab; onNotify: Notify; projects: Project[]; tasks: Task[] }) {
  const [tab, setTab] = useState<RadarTab>(initialTab);
  const [projectModal, setProjectModal] = useState<Project | "new" | null>(null);
  const [decisionModal, setDecisionModal] = useState<Decision | "new" | null>(null);

  if (!actions) {
    return <p className="radar-offline">O Radar precisa da conexão com o Convex.</p>;
  }

  const openDecisions = decisions.filter((decision) => !decision.decidedAt);
  const ideaInbox = ideas.filter((idea) => !idea.verdict);

  return (
    <section className="radar-view" aria-label="Radar de projetos, decisões e ideias">
      <header className="radar-header">
        <div className="sidebar-tabs radar-tabs">
          <button aria-pressed={tab === "projects"} className={tab === "projects" ? "active" : ""} onClick={() => setTab("projects")} type="button">Projetos <strong>{projects.length}</strong></button>
          <button aria-pressed={tab === "decisions"} className={tab === "decisions" ? "active" : ""} onClick={() => setTab("decisions")} type="button">Decisões <strong>{openDecisions.length}</strong></button>
          <button aria-pressed={tab === "ideas"} className={tab === "ideas" ? "active" : ""} onClick={() => setTab("ideas")} type="button">Ideias <strong>{ideaInbox.length}</strong></button>
        </div>
        {tab === "projects" ? (
          <Button onClick={() => setProjectModal("new")} variant="primary"><Plus size={15} /> Novo projeto</Button>
        ) : tab === "decisions" ? (
          <Button onClick={() => setDecisionModal("new")} variant="primary"><Plus size={15} /> Nova decisão</Button>
        ) : null}
      </header>

      {tab === "projects" ? <ProjectsTab onOpen={setProjectModal} projects={projects} tasks={tasks} /> : null}
      {tab === "decisions" ? <DecisionsTab decisions={decisions} onOpen={setDecisionModal} /> : null}
      {tab === "ideas" ? <IdeasTab actions={actions} ideas={ideas} onNotify={onNotify} /> : null}

      {projectModal ? <ProjectModal actions={actions} onClose={() => setProjectModal(null)} onNotify={onNotify} project={projectModal} /> : null}
      {decisionModal ? <DecisionModal actions={actions} onClose={() => setDecisionModal(null)} onNotify={onNotify} decision={decisionModal} /> : null}
    </section>
  );
}

function ProjectsTab({ onOpen, projects, tasks }: { onOpen: (project: Project) => void; projects: Project[]; tasks: Task[] }) {
  if (!projects.length) {
    return <p className="radar-empty">Nenhum projeto ativo. Crie um por frente de trabalho — e mantenha no máximo ~8 ativos.</p>;
  }
  return (
    <div className="project-grid">
      {projects.map((project) => {
        const openCount = tasks.filter((task) => task.projectId === project._id && !task.archivedAt && getEffectiveStatus(task) !== "done").length;
        return (
          <article className={`project-card stage-${project.stage}`} key={project._id} onClick={() => onOpen(project)}>
            <header>
              <span className="project-front">{frontLabels[project.front]}</span>
              <span className={`stage-light stage-${project.stage}`} title={stageLabels[project.stage]} />
            </header>
            <h3>{project.name}</h3>
            {project.objective ? <p className="project-objective">{project.objective}</p> : null}
            <dl className="project-meta">
              {project.nextMilestone ? (
                <div>
                  <dt>Próximo marco</dt>
                  <dd>{project.nextMilestone}{project.nextMilestoneDate ? ` · ${formatDateLabel(project.nextMilestoneDate)}` : ""}</dd>
                </div>
              ) : null}
              {project.nextStep ? (
                <div>
                  <dt>Próximo passo</dt>
                  <dd>{project.nextStep}</dd>
                </div>
              ) : null}
              {project.blockedNote ? (
                <div className="project-blocked">
                  <dt>Bloqueio</dt>
                  <dd>{project.blockedNote}</dd>
                </div>
              ) : null}
            </dl>
            <footer>
              <span>{project.owner ? `Dono: ${project.owner}` : "Sem dono"}</span>
              <span>{openCount} tarefa{openCount === 1 ? "" : "s"} aberta{openCount === 1 ? "" : "s"}</span>
            </footer>
          </article>
        );
      })}
    </div>
  );
}

function DecisionsTab({ decisions, onOpen }: { decisions: Decision[]; onOpen: (decision: Decision) => void }) {
  const today = toDateKey(new Date());
  const open = decisions.filter((decision) => !decision.decidedAt);
  const decided = decisions.filter((decision) => decision.decidedAt);

  return (
    <div className="decision-list">
      {open.length ? (
        open.map((decision) => (
          <article className={`decision-card ${isDecisionUrgent(decision, today) ? "urgent" : ""}`} key={decision._id} onClick={() => onOpen(decision)}>
            <header>
              <h3>{decision.title}</h3>
              <div className="decision-flags">
                {decision.blocksWho ? <span className="decision-flag blocks">Bloqueia {decision.blocksWho}</span> : null}
                {decision.dueDate ? <span className={`decision-flag ${decision.dueDate <= today ? "due" : ""}`}>Prazo {formatDateLabel(decision.dueDate)}</span> : null}
              </div>
            </header>
            {decision.context ? <p className="decision-context">{decision.context}</p> : null}
            {decision.recommendation ? <p className="decision-recommendation">Recomendação: {decision.recommendation}</p> : null}
          </article>
        ))
      ) : (
        <p className="radar-empty positive">Nenhuma decisão aberta. Cabeça limpa.</p>
      )}
      {decided.length ? (
        <details className="decided-section">
          <summary>{decided.length} decidida{decided.length === 1 ? "" : "s"}</summary>
          {decided.map((decision) => (
            <article className="decision-card decided" key={decision._id} onClick={() => onOpen(decision)}>
              <header><h3>{decision.title}</h3></header>
              {decision.outcome ? <p className="decision-context">→ {decision.outcome}</p> : null}
            </article>
          ))}
        </details>
      ) : null}
    </div>
  );
}

function IdeasTab({ actions, ideas, onNotify }: { actions: RadarActions; ideas: Idea[]; onNotify: Notify }) {
  const [title, setTitle] = useState("");
  const [front, setFront] = useState<ProjectFront | "">("");
  const inbox = ideas.filter((idea) => !idea.verdict);
  const triaged = (["now", "later", "incubate"] as IdeaVerdict[]).map((verdict) => ({
    verdict,
    items: ideas.filter((idea) => idea.verdict === verdict),
  }));

  async function capture() {
    if (!title.trim()) return;
    try {
      await actions.createIdea(title, undefined, front || undefined);
      setTitle("");
      onNotify("Ideia capturada. Triagem é no ritual semanal.");
    } catch {
      onNotify("Não consegui salvar a ideia.");
    }
  }

  async function run(action: () => Promise<void>, message: string) {
    try {
      await action();
      onNotify(message);
    } catch {
      onNotify("Não consegui concluir a ação.");
    }
  }

  return (
    <div className="ideas-tab">
      <div className="idea-capture">
        <input
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") void capture(); }}
          placeholder="Capture a ideia e volte ao que estava fazendo"
          value={title}
        />
        <select onChange={(event) => setFront(event.target.value as ProjectFront | "")} value={front}>
          <option value="">Frente (opcional)</option>
          {fronts.map((option) => <option key={option} value={option}>{frontLabels[option]}</option>)}
        </select>
        <Button disabled={!title.trim()} onClick={() => void capture()} variant="primary">Capturar</Button>
      </div>

      <section className="idea-section">
        <h3>Caixa de entrada <strong>{inbox.length}</strong></h3>
        {inbox.length ? (
          inbox.map((idea) => (
            <article className="idea-row" key={idea._id}>
              <div className="idea-row-main">
                <span>{idea.title}</span>
                {idea.front ? <small>{frontLabels[idea.front]}</small> : null}
              </div>
              <div className="idea-actions">
                {(["now", "later", "incubate", "discard"] as IdeaVerdict[]).map((verdict) => (
                  <button
                    key={verdict}
                    onClick={() => void run(() => actions.setIdeaVerdict(idea._id, verdict), verdict === "discard" ? "Ideia descartada (fica no histórico)." : `Ideia marcada: ${verdictLabels[verdict]}.`)}
                    type="button"
                  >
                    {verdictLabels[verdict]}
                  </button>
                ))}
              </div>
            </article>
          ))
        ) : (
          <p className="radar-empty">Capture sem culpa. A triagem é semanal.</p>
        )}
      </section>

      {triaged.map(({ verdict, items }) =>
        items.length ? (
          <section className="idea-section" key={verdict}>
            <h3>{verdictLabels[verdict]} <strong>{items.length}</strong></h3>
            {items.map((idea) => (
              <article className="idea-row" key={idea._id}>
                <div className="idea-row-main">
                  <span>{idea.title}</span>
                  {idea.front ? <small>{frontLabels[idea.front]}</small> : null}
                  {idea.promotedTaskId ? <small className="idea-promoted">virou tarefa</small> : null}
                </div>
                <div className="idea-actions">
                  {verdict === "now" && !idea.promotedTaskId ? (
                    <button onClick={() => void run(() => actions.promoteIdea(idea._id), "Ideia virou tarefa no backlog.")} type="button">Virar tarefa</button>
                  ) : null}
                  <button onClick={() => void run(() => actions.archiveIdea(idea._id), "Ideia arquivada.")} type="button">Arquivar</button>
                </div>
              </article>
            ))}
          </section>
        ) : null,
      )}
    </div>
  );
}

function ProjectModal({ actions, onClose, onNotify, project }: { actions: RadarActions; onClose: () => void; onNotify: Notify; project: Project | "new" }) {
  const existing = project === "new" ? null : project;
  const [name, setName] = useState(existing?.name ?? "");
  const [front, setFront] = useState<ProjectFront>(existing?.front ?? "conatus");
  const [stage, setStage] = useState<ProjectStage>(existing?.stage ?? "active");
  const [objective, setObjective] = useState(existing?.objective ?? "");
  const [owner, setOwner] = useState(existing?.owner ?? "");
  const [nextMilestone, setNextMilestone] = useState(existing?.nextMilestone ?? "");
  const [nextMilestoneDate, setNextMilestoneDate] = useState(existing?.nextMilestoneDate ?? "");
  const [nextStep, setNextStep] = useState(existing?.nextStep ?? "");
  const [blockedNote, setBlockedNote] = useState(existing?.blockedNote ?? "");
  const [pending, setPending] = useState(false);

  async function save() {
    if (!name.trim() || pending) return;
    const draft: ProjectDraft = {
      name,
      front,
      stage,
      objective: objective || undefined,
      owner: owner || undefined,
      nextMilestone: nextMilestone || undefined,
      nextMilestoneDate: nextMilestoneDate || undefined,
      nextStep: nextStep || undefined,
      blockedNote: blockedNote || undefined,
    };
    setPending(true);
    try {
      if (existing) {
        await actions.updateProject(existing._id, draft);
        onNotify("Projeto salvo.");
      } else {
        await actions.createProject(draft);
        onNotify("Projeto criado.");
      }
      onClose();
    } catch {
      onNotify("Não consegui salvar o projeto.");
    } finally {
      setPending(false);
    }
  }

  async function archive() {
    if (!existing || pending) return;
    if (!window.confirm("Arquivar este projeto? As tarefas ligadas a ele continuam existindo.")) return;
    setPending(true);
    try {
      await actions.archiveProject(existing._id);
      onNotify("Projeto arquivado.");
      onClose();
    } catch {
      onNotify("Não consegui arquivar o projeto.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog onOpenChange={onClose}>
      <DialogContent className="task-modal" onMouseDown={(event) => event.stopPropagation()}>
        <DialogHeader>
          <div>
            <p className="eyebrow">{existing ? "Editar projeto" : "Novo projeto"}</p>
            <h2>{existing ? existing.name : "Novo projeto"}</h2>
          </div>
          <Button aria-label="Fechar" disabled={pending} onClick={onClose} size="icon" variant="secondary"><X size={18} /></Button>
        </DialogHeader>

        <label>
          Nome
          <input autoFocus onChange={(event) => setName(event.target.value)} placeholder="Ex.: Iara — fase piloto" value={name} />
        </label>

        <div className="modal-grid">
          <label>
            Frente
            <select onChange={(event) => setFront(event.target.value as ProjectFront)} value={front}>
              {fronts.map((option) => <option key={option} value={option}>{frontLabels[option]}</option>)}
            </select>
          </label>
          <label>
            Dono
            <input onChange={(event) => setOwner(event.target.value)} placeholder="Quem responde por ele" value={owner} />
          </label>
        </div>

        <FieldPills<ProjectStage>
          label="Estágio"
          onChange={setStage}
          options={[["exploring", "Explorando"], ["active", "Ativo"], ["waiting", "Aguardando"], ["parked", "Estacionado"]]}
          value={stage}
        />

        <label>
          Objetivo (uma frase)
          <input onChange={(event) => setObjective(event.target.value)} placeholder="O que este projeto entrega" value={objective} />
        </label>

        <div className="modal-grid">
          <label>
            Próximo marco
            <input onChange={(event) => setNextMilestone(event.target.value)} placeholder="Ex.: Piloto na ETA" value={nextMilestone} />
          </label>
          <label>
            Data do marco
            <input onChange={(event) => setNextMilestoneDate(event.target.value)} type="date" value={nextMilestoneDate} />
          </label>
        </div>

        <label>
          Próximo passo
          <input onChange={(event) => setNextStep(event.target.value)} placeholder="Próxima ação concreta" value={nextStep} />
        </label>

        <label>
          Bloqueio (se houver)
          <input onChange={(event) => setBlockedNote(event.target.value)} placeholder="O que está travando" value={blockedNote} />
        </label>

        <DialogFooter>
          <div>
            {existing ? <Button disabled={pending} onClick={archive} variant="danger">Arquivar</Button> : null}
          </div>
          <div>
            <Button disabled={pending} onClick={onClose} variant="secondary">Cancelar</Button>
            <Button disabled={pending || !name.trim()} onClick={save} variant="primary">{pending ? "Salvando" : existing ? "Salvar" : "Criar"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DecisionModal({ actions, decision, onClose, onNotify }: { actions: RadarActions; decision: Decision | "new"; onClose: () => void; onNotify: Notify }) {
  const existing = decision === "new" ? null : decision;
  const [title, setTitle] = useState(existing?.title ?? "");
  const [context, setContext] = useState(existing?.context ?? "");
  const [options, setOptions] = useState(existing?.options ?? "");
  const [recommendation, setRecommendation] = useState(existing?.recommendation ?? "");
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? "");
  const [blocksWho, setBlocksWho] = useState(existing?.blocksWho ?? "");
  const [outcome, setOutcome] = useState(existing?.outcome ?? "");
  const [pending, setPending] = useState(false);
  const isDecided = Boolean(existing?.decidedAt);

  async function save() {
    if (!title.trim() || pending) return;
    const draft: DecisionDraft = {
      title,
      context: context || undefined,
      options: options || undefined,
      recommendation: recommendation || undefined,
      dueDate: dueDate || undefined,
      blocksWho: blocksWho || undefined,
    };
    setPending(true);
    try {
      if (existing) {
        await actions.updateDecision(existing._id, draft);
        onNotify("Decisão salva.");
      } else {
        await actions.createDecision(draft);
        onNotify("Decisão registrada.");
      }
      onClose();
    } catch {
      onNotify("Não consegui salvar a decisão.");
    } finally {
      setPending(false);
    }
  }

  async function decide() {
    if (!existing || pending) return;
    setPending(true);
    try {
      await actions.decideDecision(existing._id, outcome);
      onNotify("Decisão tomada. Um loop a menos na cabeça.");
      onClose();
    } catch {
      onNotify("Não consegui registrar a decisão.");
    } finally {
      setPending(false);
    }
  }

  async function reopen() {
    if (!existing || pending) return;
    setPending(true);
    try {
      await actions.reopenDecision(existing._id);
      onNotify("Decisão reaberta.");
      onClose();
    } catch {
      onNotify("Não consegui reabrir a decisão.");
    } finally {
      setPending(false);
    }
  }

  async function archive() {
    if (!existing || pending) return;
    if (!window.confirm("Arquivar esta decisão?")) return;
    setPending(true);
    try {
      await actions.archiveDecision(existing._id);
      onNotify("Decisão arquivada.");
      onClose();
    } catch {
      onNotify("Não consegui arquivar a decisão.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog onOpenChange={onClose}>
      <DialogContent className="task-modal" onMouseDown={(event) => event.stopPropagation()}>
        <DialogHeader>
          <div>
            <p className="eyebrow">{existing ? (isDecided ? "Decisão tomada" : "Decisão aberta") : "Nova decisão"}</p>
            <h2>{existing ? existing.title : "Nova decisão"}</h2>
          </div>
          <Button aria-label="Fechar" disabled={pending} onClick={onClose} size="icon" variant="secondary"><X size={18} /></Button>
        </DialogHeader>

        <label>
          O que precisa ser decidido
          <input autoFocus onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Fechar fornecedor do piloto SC" value={title} />
        </label>

        <label>
          Contexto (2–3 frases)
          <textarea onChange={(event) => setContext(event.target.value)} rows={2} value={context} />
        </label>

        <label>
          Opções
          <textarea onChange={(event) => setOptions(event.target.value)} placeholder="A) ...  B) ...  C) ..." rows={2} value={options} />
        </label>

        <label>
          Recomendação (sua intuição atual)
          <input onChange={(event) => setRecommendation(event.target.value)} value={recommendation} />
        </label>

        <div className="modal-grid">
          <label>
            Prazo
            <input onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} />
          </label>
          <label>
            Bloqueia quem
            <input onChange={(event) => setBlocksWho(event.target.value)} placeholder="Pessoa ou projeto que espera" value={blocksWho} />
          </label>
        </div>

        {existing && !isDecided ? (
          <label>
            Desfecho (para decidir agora)
            <textarea onChange={(event) => setOutcome(event.target.value)} placeholder="O que foi decidido e por quê" rows={2} value={outcome} />
          </label>
        ) : null}
        {isDecided && existing?.outcome ? <p className="decision-outcome-note">→ {existing.outcome}</p> : null}

        <DialogFooter>
          <div>
            {existing && !isDecided ? <Button disabled={pending || !outcome.trim()} onClick={decide} variant="secondary">Decidir</Button> : null}
            {existing && isDecided ? <Button disabled={pending} onClick={reopen} variant="secondary">Reabrir</Button> : null}
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
