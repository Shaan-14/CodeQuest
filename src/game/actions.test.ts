import { describe, expect, it } from 'vitest';
import { newSave, MAX_FOCUS, type SaveData } from '../core/save';
import { areas, quests } from '../content/world';
import { lessons } from '../content';
import * as A from './actions';
import { isAreaUnlocked, questOffered } from './world';
import { newlyEarned } from './achievements';
import { levelFromXp } from './progression';

const started = () => A.createPlayer(newSave(), '  Ada  ', 'wizard').save;
const area = (id: string) => areas.find((a) => a.id === id)!;

describe('player creation', () => {
  it('creates a trimmed profile and unlocks the academy', () => {
    const r = A.createPlayer(newSave(), '  Ada  ', 'wizard');
    expect(r.save.player?.name).toBe('Ada');
    expect(r.save.unlockedAreas).toContain('academy');
  });
  it('does not mutate its input', () => {
    const before = newSave();
    A.createPlayer(before, 'x', 'y');
    expect(before.player).toBeNull();
  });
});

describe('quest and areas', () => {
  it('locks Training Grounds until the quest is accepted', () => {
    let s = started();
    expect(isAreaUnlocked(area('training-grounds'), s)).toBe(false);
    s = A.acceptQuest(s, 'wake-the-robot').save;
    expect(isAreaUnlocked(area('training-grounds'), s)).toBe(true);
    expect(s.unlockedAreas).toContain('training-grounds');
  });
  it('keeps future areas locked, even after finishing everything', () => {
    let s = A.acceptQuest(started(), 'wake-the-robot').save;
    for (const l of lessons) s = A.completeLesson(s, l.id).save;
    for (const id of ['observatory']) expect(isAreaUnlocked(area(id), s)).toBe(false);
  });
  it('unlocks Library and Shop through lessons', () => {
    let s = A.acceptQuest(started(), 'wake-the-robot').save;
    expect(isAreaUnlocked(area('library'), s)).toBe(false);
    s = A.completeLesson(s, 'py-01-first-program').save;
    expect(isAreaUnlocked(area('library'), s)).toBe(true);
    expect(isAreaUnlocked(area('shop'), s)).toBe(false);
    s = A.completeLesson(s, 'py-02-fixing-errors').save;
    expect(isAreaUnlocked(area('shop'), s)).toBe(true);
  });
  it('completes the quest exactly once and rewards it', () => {
    let s = A.acceptQuest(started(), 'wake-the-robot').save;
    const q = quests[0]!;
    let last: A.Result | undefined;
    for (const o of q.objectives) last = A.completeLesson(s, o.lessonId), (s = last.save);
    expect(s.quests[q.id]?.status).toBe('complete');
    expect(last!.events.some((e) => e.type === 'questComplete')).toBe(true);
    expect(s.inventory['robot-bolt']).toBe(1);
    expect(s.achievements['robot-awake']).toBeDefined();
    const xp = s.stats.xp;
    const again = A.completeLesson(s, q.objectives[0]!.lessonId).save;
    expect(again.stats.xp).toBe(xp);
    expect(again.inventory['robot-bolt']).toBe(1);
  });
});

describe('challenge submission, evidence and rewards', () => {
  const id = 'py-06-ticket-total'; // challenge mode, xp 45, coins 8
  it('records failed attempts as evidence and costs focus', () => {
    const r = A.submitChallenge(started(), id, false, 5000, 'x');
    expect(r.save.evidence).toHaveLength(1);
    expect(r.save.evidence[0]).toMatchObject({ passed: false, attemptNumber: 1, executed: true, support: 'independent' });
    expect(r.save.stats.xp).toBe(0);
    expect(r.save.stats.focus).toBe(MAX_FOCUS - A.FOCUS_LOSS_PER_FAILED_SUBMIT);
  });
  it('pays an independence bonus, and records support level', () => {
    const r = A.submitChallenge(started(), id, true, 1000, 'x');
    expect(r.save.stats.xp).toBe(56); // round(45 * 1.25)
    expect(r.save.evidence[0]!.support).toBe('independent');
    expect(r.save.learning.challenges[id]!.passed).toBe(true);
  });
  it('pays less when hints were used, and records them', () => {
    let s = started();
    s = A.revealHint(s, id).save;
    s = A.revealHint(s, id).save;
    s = A.submitChallenge(s, id, true, 1000, 'x').save;
    expect(s.stats.xp).toBe(27); // round(45 * 0.6)
    expect(s.evidence[0]).toMatchObject({ support: 'hinted', hintsUsed: 2 });
  });
  it('does not pay again for a repeat solve', () => {
    let s = A.submitChallenge(started(), id, true, 1, 'x').save;
    const xp = s.stats.xp;
    s = A.submitChallenge(s, id, true, 1, 'x').save;
    expect(s.stats.xp).toBe(xp);
    expect(s.evidence).toHaveLength(2);
  });
  it('pays only the difference for a hint-free replay, and records the stronger evidence', () => {
    let s = A.revealHint(started(), id).save;
    s = A.submitChallenge(s, id, true, 1, 'x').save;
    const first = s.stats.xp; // round(45 * 0.8) = 36
    expect(first).toBe(36);
    s = A.submitChallenge(s, id, true, 1, 'x').save; // still hinted: no extra pay
    expect(s.stats.xp).toBe(first);
    s = A.startReplay(s, id).save;
    expect(s.learning.challenges[id]!.hintsUsed).toBe(0);
    s = A.submitChallenge(s, id, true, 1, 'x').save;
    expect(s.stats.xp).toBe(56); // total is now the independent reward, not first + 56
    expect(s.evidence.at(-1)!.support).toBe('independent');
  });
  it('caps hints at the number authored and never in independent mode', () => {
    let s = started();
    for (let i = 0; i < 10; i++) s = A.revealHint(s, id).save;
    expect(s.learning.challenges[id]!.hintsUsed).toBe(3);
    s = A.revealHint(s, 'py-14-warehouse-audit').save;
    expect(s.learning.challenges['py-14-warehouse-audit']?.hintsUsed ?? 0).toBe(0);
  });
  it('levels up from XP and emits an event', () => {
    let s = started();
    let leveled = false;
    for (const l of lessons) {
      for (const st of l.steps) {
        if (st.kind !== 'challenge') continue;
        const r = A.submitChallenge(s, st.challengeId, true, 1, 'x');
        s = r.save;
        leveled ||= r.events.some((e) => e.type === 'levelUp');
      }
    }
    expect(leveled).toBe(true);
    expect(levelFromXp(s.stats.xp)).toBeGreaterThanOrEqual(5);
  });
  it('XP does not create mastery evidence by itself', () => {
    const s = A.completeLesson(started(), 'py-01-first-program').save;
    expect(s.stats.xp).toBeGreaterThan(0);
    expect(s.evidence).toHaveLength(0);
  });
  it('unlocks achievements', () => {
    let s = A.recordRun(started()).save;
    expect(s.achievements['first-run']).toBeDefined();
    s = A.submitChallenge(s, id, true, 1, 'x').save;
    expect(s.achievements['first-pass']).toBeDefined();
    expect(s.achievements['own-two-feet']).toBeDefined();
  });
});

describe('shop, items, rest', () => {
  const rich = (): SaveData => {
    const s = started();
    s.stats.coins = 100;
    return s;
  };
  it('buys an item and spends coins', () => {
    const s = A.buyItem(rich(), 'focus-tea').save;
    expect(s.stats.coins).toBe(75);
    expect(s.inventory['focus-tea']).toBe(1);
    expect(s.achievements['shopper']).toBeDefined();
  });
  it('refuses when too poor or not for sale', () => {
    const poor = started();
    expect(A.buyItem(poor, 'focus-tea').save.inventory['focus-tea']).toBeUndefined();
    expect(A.buyItem(rich(), 'robot-bolt').save.inventory['robot-bolt']).toBeUndefined();
  });
  it('sells cosmetics only once', () => {
    let s = A.buyItem(rich(), 'explorer-cape').save;
    s = A.buyItem(s, 'explorer-cape').save;
    expect(s.inventory['explorer-cape']).toBe(1);
    expect(s.stats.coins).toBe(20);
  });
  it('uses consumables to restore focus and consumes them', () => {
    let s = A.buyItem(rich(), 'focus-tea').save;
    s.stats.focus = 10;
    s = A.useItem(s, 'focus-tea').save;
    expect(s.stats.focus).toBe(60);
    expect(s.inventory['focus-tea']).toBeUndefined();
  });
  it('does not waste a consumable at full focus', () => {
    const s = A.useItem(A.buyItem(rich(), 'focus-tea').save, 'focus-tea').save;
    expect(s.inventory['focus-tea']).toBe(1);
  });
  it('rest restores focus', () => {
    const s = started();
    s.stats.focus = 0;
    expect(A.rest(s).save.stats.focus).toBe(MAX_FOCUS);
  });
});

describe('reset', () => {
  it('returns a brand new save', () => {
    expect(A.resetAll().save.player).toBeNull();
  });

  describe('Phase 2 world and story', () => {
    it('opens the Database District after Messy Data, and the Pipeline Works after Safe and Fast', () => {
      let s = A.acceptQuest(started(), 'wake-the-robot').save;
      expect(isAreaUnlocked(area('data-center'), s)).toBe(false);
      expect(isAreaUnlocked(area('pipeline-works'), s)).toBe(false);
      s = A.completeLesson(s, 'py-21-cleaning').save;
      expect(isAreaUnlocked(area('data-center'), s)).toBe(true);
      expect(isAreaUnlocked(area('pipeline-works'), s)).toBe(false);
      s = A.completeLesson(s, 'sql-13-integrity-performance').save;
      expect(isAreaUnlocked(area('pipeline-works'), s)).toBe(true);
    });
    it('offers story quests in order and completes each exactly once with its reward', () => {
      let s = started();
      const ledger = quests.find((q) => q.id === 'ledger-vault')!;
      const district = quests.find((q) => q.id === 'database-district')!;
      expect(questOffered(ledger, s)).toBe(false);
      s = A.acceptQuest(s, 'wake-the-robot').save;
      for (const o of quests[0]!.objectives) s = A.completeLesson(s, o.lessonId).save;
      expect(s.quests['wake-the-robot']?.status).toBe('complete');
      expect(questOffered(ledger, s)).toBe(true);
      expect(questOffered(district, s)).toBe(false);
      s = A.acceptQuest(s, ledger.id).save;
      for (const o of ledger.objectives) s = A.completeLesson(s, o.lessonId).save;
      expect(s.quests[ledger.id]?.status).toBe('complete');
      expect(questOffered(district, s)).toBe(true);
      const xp = s.stats.xp;
      s = A.completeLesson(s, ledger.objectives[0]!.lessonId).save;
      expect(s.stats.xp).toBe(xp);
    });
    it('every quest objective names a real lesson, and quest lessons never duplicate across quests', () => {
      const ids = new Set(lessons.map((l) => l.id));
      const seen = new Set<string>();
      for (const q of quests) for (const o of q.objectives) {
        expect(ids.has(o.lessonId), o.lessonId).toBe(true);
        expect(seen.has(o.lessonId), `duplicate ${o.lessonId}`).toBe(false);
        seen.add(o.lessonId);
      }
    });
    it('achievements: first SQL pass and quest milestones are earned from evidence, not XP', () => {
      let s = started();
      expect(newlyEarned(s)).not.toContain('first-query');
      s = A.submitChallenge(s, 'sql-01-cheap-products', true, 1000, 'SELECT 1').save;
      expect(s.achievements['first-query']).toBeDefined();
      expect(s.achievements['vault-open']).toBeUndefined();
    });
  });
});
