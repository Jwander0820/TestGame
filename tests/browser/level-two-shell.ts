import '../../src/styles.css';
import markup from '../../index.html?raw';
import { mountGameShell } from '../../src/gameShell';
import { LEVEL_ONE_ID } from '../../src/game/content/levelOne';
import { LEVEL_TWO_ID } from '../../src/game/content/levelTwo';
import { PROGRESS_STORAGE_KEY, createDefaultProgress, createLevelProgress } from '../../src/game/state/progress';
import { advanceProgress, completeLevel } from '../../src/game/sympathy/director';

const template = new DOMParser().parseFromString(markup, 'text/html');
template.querySelectorAll('script').forEach(script => script.remove());
document.body.replaceChildren(...Array.from(template.body.childNodes));
const params = new URLSearchParams(location.search);
const station = Math.max(0, Math.min(3, Number.parseInt(params.get('station') ?? '0', 10) || 0));
let state = completeLevel(advanceProgress(createDefaultProgress(), LEVEL_ONE_ID, 'goal', 4), LEVEL_ONE_ID);
if (station > 0) state = advanceProgress(state, LEVEL_TWO_ID, `clockwork-station-${station}`, station);
if (params.get('mercy') === '1') {
  const level = state.levels[LEVEL_TWO_ID] ?? createLevelProgress();
  state = { ...state, totalDeaths: 21, levels: { ...state.levels,
    [LEVEL_TWO_ID]: { ...level, totalDeaths: 21, attempt: 22, deathsByCause: { 'clockwork-void': 21 } },
  } };
}
const memory = new Map<string, string>([[PROGRESS_STORAGE_KEY, JSON.stringify(state)]]);
const shell = document.querySelector<HTMLElement>('.game-shell');
shell?.setAttribute('data-test-progress', JSON.stringify(state));
mountGameShell({ getItem: key => memory.get(key) ?? null, setItem: (key, value) => {
  memory.set(key, value);
  if (key === PROGRESS_STORAGE_KEY) shell?.setAttribute('data-test-progress', value);
} }, {
  reset: () => undefined,
  update: frame => { shell?.setAttribute('data-playtest-frame', JSON.stringify(frame)); },
});
