import { getSkill, skills } from '../../content';
import { detectPatterns, summarizeSkill, type SkillStatus } from '../../learning/mastery';
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
  return (
    <div class="skills" data-testid="skills-view">
      <p class="callout">
        This is your <strong>evidence record</strong>. It counts only code you ran and passed. “Demonstrated” means you solved
        problems <em>without hints</em> across more than one challenge. XP and level never appear here because they do not prove skill.
      </p>
      {skills.map((skill) => {
        const sum = summarizeSkill(save.evidence, skill);
        const patterns = detectPatterns(save.evidence, skill.id);
        const r = skill.masteryRequirements;
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
            </div>
            <div class="muted small">
              Demonstrated when: {r.independentPasses} independent pass{r.independentPasses > 1 ? 'es' : ''} across {r.distinctChallenges} different challenge{r.distinctChallenges > 1 ? 's' : ''}
              {r.minDifficulty > 1 ? `, at least one of difficulty ${r.minDifficulty}+` : ''}. You have {sum.independentPasses} independent pass{sum.independentPasses === 1 ? '' : 'es'} across {sum.distinctIndependentChallenges} challenge{sum.distinctIndependentChallenges === 1 ? '' : 's'}.
            </div>
            {patterns.map((p) => (
              <div class={`note note-${p.kind}`} key={p.kind}>🧭 {p.detail}</div>
            ))}
          </div>
        );
      })}
      {!getSkill('py.output') && null}
    </div>
  );
}
