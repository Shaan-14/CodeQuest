import { skills } from '../../content';
import { detectPatterns, summarizeSkill, unmetRequirements, type SkillStatus } from '../../learning/mastery';
import { useGame } from '../../game/store';

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
  return (
    <div class="skills" data-testid="skills-view">
      <p class="callout">
        This is your <strong>evidence record</strong>. It counts only code you ran and passed. “Demonstrated” means you solved
        problems <em>without hints</em>, across different challenges, different concepts and different real-world settings, so it
        cannot come from memorising one answer. XP and level never appear here because they do not prove skill.
      </p>
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
                  {missing.length > 0 && sum.status !== 'none' && <div class="muted small">Still needed for “Demonstrated”: {missing.join('; ')}.</div>}
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
