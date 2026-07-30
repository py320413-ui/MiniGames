/**
 * [역할]
 *   야추 화면을 그리고 갱신한다. 규칙은 하나도 모른다 — 상태를 받아 보여주기만 한다.
 *
 * [구성 순서]
 *   1. 주사위 눈 배치
 *   2. DOM 조립
 *   3. 갱신
 *
 * [설계 방향]
 *   DOM 을 매번 다시 만들지 않는다. 한 번 만들어 두고 값만 바꾼다.
 *   통째로 다시 그리면 주사위 애니메이션이 끊기고 키보드 초점이 날아간다.
 *   플레이어 수가 바뀔 때만 점수표를 다시 짓는다 (열 개수가 달라지므로).
 *
 * [주의]
 *   문구는 전부 ty() 로 가져온다. 여기에 한국어를 직접 적으면 영어·일본어 페이지에서 샌다.
 */
import type { Category, DieValue, GameState } from './types.ts';
import {
  CATEGORIES,
  LOWER_CATEGORIES,
  TOTAL_ROUNDS,
  UPPER_CATEGORIES,
  bonusRemaining,
  totalScore,
  upperBonus,
  upperSubtotal,
} from './scoring.ts';
import { canChoose, canHold, canRoll, currentRound, hasRolled, isFinished, previewScores, results } from './engine.ts';
import { ty, type YachtKey } from './i18n.ts';
import { t } from '../../shared/i18n/index.ts';
import type { Locale } from '../../shared/site.ts';

// ══════════════════════════════════════════════════════════════
// 1. 주사위 눈 배치
// ══════════════════════════════════════════════════════════════

/** 3×3 격자에서 눈이 찍히는 [행, 열]. 실제 주사위와 같은 배치다. */
const PIP_LAYOUT: Record<DieValue, readonly (readonly [number, number])[]> = {
  1: [[2, 2]],
  2: [
    [1, 1],
    [3, 3],
  ],
  3: [
    [1, 1],
    [2, 2],
    [3, 3],
  ],
  4: [
    [1, 1],
    [1, 3],
    [3, 1],
    [3, 3],
  ],
  5: [
    [1, 1],
    [1, 3],
    [2, 2],
    [3, 1],
    [3, 3],
  ],
  6: [
    [1, 1],
    [1, 3],
    [2, 1],
    [2, 3],
    [3, 1],
    [3, 3],
  ],
};

/** 족보 → 메시지 키. */
const CATEGORY_KEY: Record<Category, YachtKey> = {
  aces: 'cat.aces',
  deuces: 'cat.deuces',
  threes: 'cat.threes',
  fours: 'cat.fours',
  fives: 'cat.fives',
  sixes: 'cat.sixes',
  choice: 'cat.choice',
  fourOfAKind: 'cat.fourOfAKind',
  fullHouse: 'cat.fullHouse',
  smallStraight: 'cat.smallStraight',
  largeStraight: 'cat.largeStraight',
  yacht: 'cat.yacht',
};

export interface ViewHandlers {
  onRoll(): void;
  onToggleHold(index: number): void;
  onChoose(category: Category): void;
  onNewGame(): void;
  onPlayerCountChange(count: number): void;
}

export interface RenderExtras {
  /** 저장된 최고 기록 (1인 모드에서만 의미가 있다). */
  readonly best: number;
  /** 이번 판이 최고 기록을 넘었는가. */
  readonly newRecord: boolean;
}

// ══════════════════════════════════════════════════════════════
// 2. DOM 조립
// ══════════════════════════════════════════════════════════════

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createView(root: HTMLElement, locale: Locale, handlers: ViewHandlers) {
  const say = (key: YachtKey, vars?: Record<string, string | number>) => ty(locale, key, vars);

  // 플레이어 수가 바뀌면 점수표를 다시 지어야 해서, 조립 결과를 여기 담아둔다.
  let built: BuiltView | null = null;
  let previousDice: readonly DieValue[] = [];

  interface BuiltView {
    playerCount: number;
    roundLabel: HTMLElement;
    bestLabel: HTMLElement;
    modeButtons: HTMLButtonElement[];
    dice: HTMLButtonElement[];
    rollButton: HTMLButtonElement;
    hint: HTMLElement;
    cells: Map<string, HTMLButtonElement>;
    columnCells: HTMLElement[][];
    subtotals: HTMLElement[];
    bonuses: HTMLElement[];
    totals: HTMLElement[];
    result: HTMLElement;
    resultTitle: HTMLElement;
    resultScore: HTMLElement;
    resultRecord: HTMLElement;
  }

  function build(playerCount: number): BuiltView {
    root.textContent = '';
    const board = element('div', 'yacht');

    // ── 상단 바 ──────────────────────────────────────────────
    const bar = element('div', 'yacht__bar');
    const roundLabel = element('span', 'yacht__round');
    const modes = element('div', 'yacht__modes');
    const modeButtons = [1, 2].map((count) => {
      const button = element('button', 'yacht__mode');
      button.type = 'button';
      button.textContent = count === 1 ? t(locale, 'mode.solo') : t(locale, 'mode.local2p');
      button.addEventListener('click', () => handlers.onPlayerCountChange(count));
      modes.appendChild(button);
      return button;
    });
    const bestLabel = element('span', 'yacht__best');
    bar.append(roundLabel, modes, bestLabel);

    // ── 결과 ────────────────────────────────────────────────
    const result = element('div', 'yacht__result');
    result.hidden = true;
    result.setAttribute('role', 'status');
    const resultTitle = element('p', 'yacht__result-title');
    const resultScore = element('span', 'yacht__result-score');
    const resultRecord = element('span', 'yacht__result-record');
    // 굴리기 버튼과 같은 생김새지만 클래스는 따로 둔다.
    // 같은 클래스를 쓰면 셀렉터가 어느 쪽을 잡는지 헷갈린다 (실제로 한 번 걸렸다).
    const resultNew = element('button', 'yacht__again');
    resultNew.type = 'button';
    resultNew.textContent = say('newGame');
    resultNew.addEventListener('click', () => handlers.onNewGame());
    result.append(resultTitle, resultScore, resultRecord, resultNew);

    // ── 주사위 ──────────────────────────────────────────────
    const diceRow = element('div', 'yacht__dice');
    const dice = Array.from({ length: 5 }, (_, index) => {
      const button = element('button', 'die');
      button.type = 'button';
      button.addEventListener('click', () => handlers.onToggleHold(index));
      diceRow.appendChild(button);
      return button;
    });

    // ── 굴리기 ──────────────────────────────────────────────
    const actions = element('div', 'yacht__actions');
    const rollButton = element('button', 'yacht__roll');
    rollButton.type = 'button';
    rollButton.addEventListener('click', () => handlers.onRoll());
    const hint = element('p', 'yacht__hint');
    actions.append(rollButton, hint);

    // ── 점수표 ──────────────────────────────────────────────
    const table = element('table', 'yacht__card');
    const head = element('thead');
    const headRow = element('tr');
    headRow.appendChild(element('th', undefined, say('category')));
    for (let index = 0; index < playerCount; index++) {
      headRow.appendChild(
        element(
          'th',
          undefined,
          playerCount === 1 ? say('myScore') : say('player', { n: index + 1 }),
        ),
      );
    }
    head.appendChild(headRow);

    const body = element('tbody');
    const cells = new Map<string, HTMLButtonElement>();
    const columnCells: HTMLElement[][] = Array.from({ length: playerCount }, () => []);

    const addCategoryRow = (category: Category, extraClass?: string) => {
      const row = element('tr', extraClass);
      row.appendChild(element('th', undefined, say(CATEGORY_KEY[category])));
      for (let index = 0; index < playerCount; index++) {
        const cell = element('td');
        const button = element('button', 'yacht__cell');
        button.type = 'button';
        button.addEventListener('click', () => handlers.onChoose(category));
        cell.appendChild(button);
        row.appendChild(cell);
        cells.set(`${index}:${category}`, button);
        columnCells[index]?.push(cell);
      }
      body.appendChild(row);
    };

    const addSummaryRow = (label: string, className: string, note?: HTMLElement) => {
      const row = element('tr', className);
      const header = element('th', undefined, label);
      if (note) header.appendChild(note);
      row.appendChild(header);
      const valueCells = Array.from({ length: playerCount }, () => {
        const cell = element('td');
        row.appendChild(cell);
        return cell;
      });
      body.appendChild(row);
      valueCells.forEach((cell, index) => columnCells[index]?.push(cell));
      return valueCells;
    };

    for (const category of UPPER_CATEGORIES) addCategoryRow(category);
    const subtotals = addSummaryRow(say('upperSubtotal'), 'row-sum');
    const bonusNote = element('span', 'yacht__bonus-note');
    const bonuses = addSummaryRow(say('bonus'), 'row-sum', bonusNote);
    LOWER_CATEGORIES.forEach((category, index) =>
      addCategoryRow(category, index === 0 ? 'row-divider' : undefined),
    );
    const totals = addSummaryRow(say('total'), 'row-total');

    table.append(head, body);

    // ── 새 게임 ─────────────────────────────────────────────
    const reset = element('button', 'yacht__reset');
    reset.type = 'button';
    reset.textContent = say('newGame');
    reset.addEventListener('click', () => handlers.onNewGame());

    board.append(bar, result, diceRow, actions, table, reset);
    root.appendChild(board);

    return {
      playerCount,
      roundLabel,
      bestLabel,
      modeButtons,
      dice,
      rollButton,
      hint,
      cells,
      columnCells,
      subtotals,
      bonuses,
      totals,
      result,
      resultTitle,
      resultScore,
      resultRecord,
    };
  }

  // ══════════════════════════════════════════════════════════
  // 3. 갱신
  // ══════════════════════════════════════════════════════════

  function paintDie(button: HTMLButtonElement, value: DieValue, held: boolean, interactive: boolean) {
    button.textContent = '';
    for (const [row, column] of PIP_LAYOUT[value]) {
      const pip = element('span', 'die__pip');
      pip.style.gridRow = String(row);
      pip.style.gridColumn = String(column);
      button.appendChild(pip);
    }
    button.setAttribute('aria-pressed', String(held));
    button.disabled = !interactive;
    button.setAttribute(
      'aria-label',
      `${say('dieLabel', { n: value })} — ${held ? say('holdOn') : say('holdOff')}`,
    );
  }

  function render(state: GameState, extras: RenderExtras): void {
    if (!built || built.playerCount !== state.players.length) {
      built = build(state.players.length);
      previousDice = [];
    }
    const view = built;
    const finished = isFinished(state);
    const rolled = hasRolled(state);
    const preview = previewScores(state);
    const holdable = canHold(state);

    // 상단 바
    view.roundLabel.textContent = say('round', { n: currentRound(state), total: TOTAL_ROUNDS });
    view.bestLabel.textContent =
      state.players.length === 1 ? `${say('best')} ${extras.best}` : '';
    view.modeButtons.forEach((button, index) => {
      button.setAttribute('aria-pressed', String(state.players.length === index + 1));
    });

    // 주사위
    state.dice.forEach((value, index) => {
      const button = view.dice[index];
      if (!button) return;
      const changed = previousDice[index] !== value;
      paintDie(button, value, state.held[index] === true, holdable);
      // 값이 바뀐 주사위만 흔든다. 고정해 둔 건 가만히 있어야 고정된 게 눈에 보인다.
      if (changed && rolled) {
        button.classList.remove('is-rolling');
        void button.offsetWidth; // 애니메이션을 다시 트리거하려면 리플로우가 필요하다
        button.classList.add('is-rolling');
      }
    });
    previousDice = [...state.dice];

    // 굴리기
    view.rollButton.disabled = !canRoll(state);
    view.rollButton.textContent = rolled
      ? `${say('roll')} · ${say('rollsLeft', { n: state.rollsLeft })}`
      : say('roll');
    view.hint.textContent = finished
      ? ''
      : !rolled
        ? say('rollToStart')
        : state.rollsLeft > 0
          ? say('rerollHint')
          : say('pickCategory');

    // 점수표
    for (let player = 0; player < state.players.length; player++) {
      const card = state.players[player]?.card;
      if (!card) continue;
      const isCurrent = player === state.current && !finished;

      for (const category of CATEGORIES) {
        const button = view.cells.get(`${player}:${category}`);
        if (!button) continue;
        const value = card[category];

        if (value !== null) {
          button.textContent = String(value);
          button.className = `yacht__cell yacht__cell--filled${value === 0 ? ' yacht__cell--zero' : ''}`;
          button.disabled = true;
          button.removeAttribute('aria-label');
          continue;
        }

        const openHere = isCurrent && canChoose(state, category);
        const previewValue = openHere ? preview[category] : undefined;
        button.textContent = previewValue === undefined ? '' : String(previewValue);
        button.className = `yacht__cell${openHere ? ' yacht__cell--open' : ''}`;
        button.disabled = !openHere;
        if (openHere && previewValue !== undefined) {
          button.setAttribute(
            'aria-label',
            say('scoreInto', { cat: say(CATEGORY_KEY[category]), n: previewValue }),
          );
        } else {
          button.removeAttribute('aria-label');
        }
      }

      // 배열 인덱싱 결과를 지역 변수로 받아야 undefined 검사가 유지된다.
      const subtotalCell = view.subtotals[player];
      const bonusCell = view.bonuses[player];
      const totalCell = view.totals[player];
      if (subtotalCell) subtotalCell.textContent = String(upperSubtotal(card));
      if (bonusCell) bonusCell.textContent = String(upperBonus(card));
      if (totalCell) totalCell.textContent = String(totalScore(card));

      // 현재 차례인 열을 표시한다.
      for (const cell of view.columnCells[player] ?? []) {
        cell.classList.toggle('is-active-col', isCurrent);
      }
    }

    // 보너스 안내 — 지금 차례인 사람 기준.
    const activeCard = state.players[state.current]?.card;
    const bonusNote = root.querySelector('.yacht__bonus-note');
    if (bonusNote && activeCard) {
      const remaining = bonusRemaining(activeCard);
      bonusNote.textContent = remaining > 0 ? say('bonusNeed', { n: remaining }) : say('bonusGot');
    }

    // 결과
    view.result.hidden = !finished;
    if (finished) {
      const totals = state.players.map((player) => totalScore(player.card));
      const { winners, best } = results(totals);
      if (state.players.length === 1) {
        view.resultTitle.textContent = say('gameOver');
        view.resultScore.textContent = say('finalScore', { n: totals[0] ?? 0 });
      } else {
        view.resultTitle.textContent =
          winners.length > 1 ? say('draw') : say('winner', { n: (winners[0] ?? 0) + 1 });
        view.resultScore.textContent = say('finalScore', { n: best });
      }
      view.resultRecord.textContent = extras.newRecord ? say('newRecord') : '';
    }
  }

  return { render };
}
