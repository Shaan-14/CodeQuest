import { skills } from '../../content';
import { detectPatterns, summarizeSkill, unmetRequirements, type SkillStatus } from '../../learning/mastery';
import { useGame } from '../../game/store';
import { challenges } from '../../content';
import { reviewsDue } from '../../game/retention';
import { allComposites, skillHistory } from '../../game/skillHistory';

const COMPOSITE_LABEL = { none: 'Not started', attempted: 'Attempted', guided: 'Only with guidance', developing: 'Developing', demonstrated: 'Demonstrated together' } as const;

const STATUS_LABEL: Record<SkillStatus, string> = {
  none: 'Not started',
  attempted: 'Attempted',
  guided: 'Passed with guidance only',
  developing: 'Developing',
  demonstrated: 'Demonstrated independently',
};

/** The honest record. Deliberately shows NO XP or level: those are not evidence. */
export function SkillsView() {
  const { save } = useGame();
  const categories = [...new Set(skills.map((s) => s.category))];
  const due = new Map(reviewsDue(save, Date.now(), (id) => challenges.find((c) => c.id === id)?.skillIds).map((d) => [d.skill.id, d]));
  return (
    <div class="skills" data-testid="skills-view">
      <p class="callout">
        This is your <strong>evidence record</strong>. It counts only code you ran and passed. “Demonstrated” means you solved
        problems <em>without hints</em>, across different challenges, different concepts and different real-world settings, so it
        cannot come from memorising one answer. XP and level never appear here because they do not prove skill.
      </p>
      {allComposites(save).length > 0 && (
        <section class="skill-category" data-testid="composites">
          <h3>Skills used together</h3>
          <p class="muted small">Real problems combine skills. These are computed only from challenges that needed <em>all</em> the skills listed, and they say nothing about each skill on its own.</p>
          {allComposites(save).map((c) => (
            <div class={`skill-card status-${c.status}`} key={c.composite.id} data-testid={`composite-${c.composite.id}`}>
              <div class="skill-head"><strong>{c.composite.title}</strong><span class={`chip ${c.status}`}>{COMPOSITE_LABEL[c.status]}</span></div>
              <div class="skill-stats"><span>Attempts <b>{c.attempts}</b></span><span>Passed <b>{c.passes}</b></span><span>Independent <b>{c.independentPasses}</b></span><span>Settings <b>{c.contexts}</b></span></div>
            </div>
          ))}
        </section>
      )}
      {categories.map((cat) => {
        const inCat = skills.filter((s) => s.category === cat).map((skill) => ({ skill, sum: summarizeSkill(save.evidence, skill) }));
        return (
          <section key={cat} class="skill-category">
            <h3>{cat}</h3>
            {inCat.map(({ skill, sum }) => {
              const patterns = detectPatterns(save.evidence, skill.id);
              const missing = sum.status === 'demonstrated' ? [] : unmetRequirements(sum, skill);
              return (
                <div class={`skill-card status-${sum.status}`} key={skill.id} data-testid={`skill-${skill.id}`}>
                  <div class="skill-head">
                    <strong>{skill.title}</strong>
                    <span class={`chip ${sum.status}`}>{STATUS_LABEL[sum.status]}</span>
                  </div>
                  <div class="skill-stats">
                    <span>Attempts <b>{sum.attempts}</b></span>
                    <span>Passed <b>{sum.passes}</b></span>
                    <span>Failed <b>{sum.failures}</b></span>
                    <span>Hints used <b>{sum.hintsUsed}</b></span>
                    <span>Independent solves <b>{sum.independentPasses}</b></span>
                    <span>Concepts <b>{sum.distinctIndependentObjectives}</b></span>
                    <span>Settings <b>{sum.distinctIndependentContexts}</b></span>
                    {sum.recoveredPasses > 0 && <span>Solved after failing <b>{sum.recoveredPasses}</b></span>}
                    {sum.projectPasses > 0 && <span>Projects <b>{sum.projectPasses}</b></span>}
                  </div>
                  {due.has(skill.id) && <div class="note note-review" data-testid={`review-${skill.id}`}>⏳ {due.get(skill.id)!.reason}</div>}
                  {missing.length > 0 && sum.status !== 'none' && <div class="muted small">Still needed for “Demonstrated”: {missing.join('; ')}.</div>}
                  {(() => {
                    const hist = skillHistory(save, skill.id);
                    return hist && hist.note ? <div class="note note-history" data-testid={`history-${skill.id}`}>📈 {hist.note}</div> : null;
                  })()}
                  {patterns.map((p) => (
                    <div class={`note note-${p.kind}`} key={p.kind}>🧭 {p.detail}</div>
                  ))}
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
