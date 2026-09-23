import '../../src/styles.css';
import markup from '../../index.html?raw';
import { mountGameShell } from '../../src/gameShell';
import { PROGRESS_STORAGE_KEY, createDefaultProgress } from '../../src/game/state/progress';
import { advanceProgress } from '../../src/game/sympathy/director';
import { LEVEL_ONE_ID } from '../../src/game/content/levelOne';
import { createMaxAssistanceProgress } from './maxAssistanceState';

const template = new DOMParser().parseFromString(markup, 'text/html');
template.querySelectorAll('script').forEach(script => script.remove());
document.body.replaceChildren(...Array.from(template.body.childNodes));
const selected = new URLSearchParams(location.search).get('state');
const initial = selected === 'max' ? createMaxAssistanceProgress() : selected === 'goal' ?
  advanceProgress(createDefaultProgress(), LEVEL_ONE_ID, 'after-intern-bridge', 3) : selected === 'slimes' ?
    advanceProgress(createDefaultProgress(), LEVEL_ONE_ID, 'after-first-gap', 1) : createDefaultProgress();
const memory = new Map<string, string>([[PROGRESS_STORAGE_KEY, JSON.stringify(initial)]]);
mountGameShell({ getItem: key => memory.get(key) ?? null, setItem: (key, value) => { memory.set(key, value); } });
