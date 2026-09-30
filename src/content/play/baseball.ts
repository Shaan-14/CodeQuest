/** The six steps of analysis that shape the Herons (see play/logic/baseballSim.ts): each one is an effect caused by passing the SQL lesson that teaches it. */
export const BASEBALL_STEPS: { effect: string; label: string; why: string }[] = [
  { effect: 'office.roster:load', label: 'Load the roster', why: 'you know who is available' },
  { effect: 'office.ranking:sort', label: 'Rank the hitters', why: 'the best on-base hitters bat near the top' },
  { effect: 'office.roster:clean', label: 'Deal with missing data', why: 'players with missing stats are not silently treated as zeros' },
  { effect: 'office.stats:summarise', label: 'Summarise the season', why: 'the lineup reflects the season, not a few games' },
  { effect: 'office.positions:group', label: 'Group by position', why: 'players are in positions they play well, so fewer balls are misplayed' },
  { effect: 'field.lineup:set', label: 'Join players to their stats and set the lineup', why: 'every name in the order is backed by his numbers' },
];
