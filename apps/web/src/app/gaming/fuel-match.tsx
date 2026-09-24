"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import type { Locale } from "@fanfuel/types";
import { getAppDictionary, getStoredLocalePreference } from "../../lib/i18n";
import styles from "./gaming.module.css";

const BOARD_SIZE = 8;
const STORAGE_KEY = "fanfuel_fuel_match_v1";
const TILE_KINDS = ["spark", "drop", "bolt", "gem", "heart", "nova"] as const;

type TileKind = (typeof TILE_KINDS)[number];
type Special = "row" | "column" | "prism" | null;
type Booster = "hammer" | "shuffle" | "cross";
type GameStatus = "playing" | "paused" | "won" | "lost";

type Tile = {
  id: number;
  kind: TileKind;
  special: Special;
};

type Goal = { kind: TileKind; count: number };

type Level = {
  moves: number;
  targetScore: number;
  reward: number;
  goals: Goal[];
};

type SavedProgress = {
  unlocked: number;
  currentLevel: number;
  coins: number;
  boosters: Record<Booster, number>;
  bestScores: Record<number, number>;
  claimedLevels: number[];
};

type MatchRun = {
  indexes: number[];
  kind: TileKind;
  orientation: "row" | "column";
};

type Resolution = {
  board: Tile[];
  cleared: Partial<Record<TileKind, number>>;
  score: number;
  charge: number;
  combos: number;
};

const LEVELS: Level[] = [
  {
    moves: 22,
    targetScore: 1200,
    reward: 90,
    goals: [
      { kind: "spark", count: 10 },
      { kind: "drop", count: 10 }
    ]
  },
  {
    moves: 21,
    targetScore: 1800,
    reward: 110,
    goals: [
      { kind: "bolt", count: 14 },
      { kind: "gem", count: 12 }
    ]
  },
  {
    moves: 20,
    targetScore: 2400,
    reward: 125,
    goals: [
      { kind: "heart", count: 16 },
      { kind: "nova", count: 12 }
    ]
  },
  {
    moves: 20,
    targetScore: 3100,
    reward: 145,
    goals: [
      { kind: "spark", count: 18 },
      { kind: "gem", count: 16 }
    ]
  },
  {
    moves: 19,
    targetScore: 3800,
    reward: 165,
    goals: [
      { kind: "drop", count: 20 },
      { kind: "bolt", count: 18 }
    ]
  },
  {
    moves: 19,
    targetScore: 4500,
    reward: 185,
    goals: [
      { kind: "heart", count: 22 },
      { kind: "spark", count: 18 }
    ]
  },
  {
    moves: 18,
    targetScore: 5200,
    reward: 210,
    goals: [
      { kind: "nova", count: 22 },
      { kind: "gem", count: 20 }
    ]
  },
  {
    moves: 18,
    targetScore: 6100,
    reward: 235,
    goals: [
      { kind: "bolt", count: 25 },
      { kind: "heart", count: 22 }
    ]
  },
  {
    moves: 17,
    targetScore: 7000,
    reward: 260,
    goals: [
      { kind: "drop", count: 26 },
      { kind: "nova", count: 24 }
    ]
  },
  {
    moves: 17,
    targetScore: 7900,
    reward: 290,
    goals: [
      { kind: "spark", count: 28 },
      { kind: "bolt", count: 26 }
    ]
  },
  {
    moves: 16,
    targetScore: 8800,
    reward: 320,
    goals: [
      { kind: "gem", count: 30 },
      { kind: "heart", count: 28 }
    ]
  },
  {
    moves: 16,
    targetScore: 9800,
    reward: 360,
    goals: [
      { kind: "nova", count: 32 },
      { kind: "drop", count: 30 }
    ]
  }
];

const BOOSTER_COSTS: Record<Booster, number> = {
  hammer: 90,
  shuffle: 120,
  cross: 170
};

const DEFAULT_PROGRESS: SavedProgress = {
  unlocked: 1,
  currentLevel: 1,
  coins: 300,
  boosters: { hammer: 2, shuffle: 1, cross: 1 },
  bestScores: {},
  claimedLevels: []
};

let tileId = 0;

function randomKind(): TileKind {
  return TILE_KINDS[Math.floor(Math.random() * TILE_KINDS.length)];
}

function makeTile(kind: TileKind = randomKind(), special: Special = null): Tile {
  tileId += 1;
  return { id: tileId, kind, special };
}

function createBoard(): Tile[] {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const board: Tile[] = [];

    for (let index = 0; index < BOARD_SIZE * BOARD_SIZE; index += 1) {
      const row = Math.floor(index / BOARD_SIZE);
      const column = index % BOARD_SIZE;
      let kind = randomKind();
      let guard = 0;

      while (
        guard < 20 &&
        ((column >= 2 && board[index - 1]?.kind === kind && board[index - 2]?.kind === kind) ||
          (row >= 2 &&
            board[index - BOARD_SIZE]?.kind === kind &&
            board[index - BOARD_SIZE * 2]?.kind === kind))
      ) {
        kind = randomKind();
        guard += 1;
      }

      board.push(makeTile(kind));
    }

    if (hasPossibleMove(board)) {
      return board;
    }
  }

  return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => makeTile());
}

function findMatches(board: Tile[]): MatchRun[] {
  const matches: MatchRun[] = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    let start = 0;
    for (let column = 1; column <= BOARD_SIZE; column += 1) {
      const current = column < BOARD_SIZE ? board[row * BOARD_SIZE + column]?.kind : null;
      const first = board[row * BOARD_SIZE + start]?.kind;
      if (current !== first) {
        if (column - start >= 3 && first) {
          matches.push({
            indexes: Array.from(
              { length: column - start },
              (_, offset) => row * BOARD_SIZE + start + offset
            ),
            kind: first,
            orientation: "row"
          });
        }
        start = column;
      }
    }
  }

  for (let column = 0; column < BOARD_SIZE; column += 1) {
    let start = 0;
    for (let row = 1; row <= BOARD_SIZE; row += 1) {
      const current = row < BOARD_SIZE ? board[row * BOARD_SIZE + column]?.kind : null;
      const first = board[start * BOARD_SIZE + column]?.kind;
      if (current !== first) {
        if (row - start >= 3 && first) {
          matches.push({
            indexes: Array.from(
              { length: row - start },
              (_, offset) => (start + offset) * BOARD_SIZE + column
            ),
            kind: first,
            orientation: "column"
          });
        }
        start = row;
      }
    }
  }

  return matches;
}

function swapTiles(board: Tile[], first: number, second: number): Tile[] {
  const next = [...board];
  [next[first], next[second]] = [next[second], next[first]];
  return next;
}

function areAdjacent(first: number, second: number): boolean {
  const firstRow = Math.floor(first / BOARD_SIZE);
  const secondRow = Math.floor(second / BOARD_SIZE);
  const firstColumn = first % BOARD_SIZE;
  const secondColumn = second % BOARD_SIZE;
  return Math.abs(firstRow - secondRow) + Math.abs(firstColumn - secondColumn) === 1;
}

function hasPossibleMove(board: Tile[]): boolean {
  for (let index = 0; index < board.length; index += 1) {
    const right = index % BOARD_SIZE < BOARD_SIZE - 1 ? index + 1 : -1;
    const below = index + BOARD_SIZE < board.length ? index + BOARD_SIZE : -1;
    for (const target of [right, below]) {
      if (target < 0) continue;
      if (board[index].special === "prism" || board[target].special === "prism") return true;
      if (findMatches(swapTiles(board, index, target)).length > 0) return true;
    }
  }
  return false;
}

function expandSpecials(board: Tile[], initial: Set<number>): Set<number> {
  const expanded = new Set(initial);
  const queue = [...initial];

  while (queue.length > 0) {
    const index = queue.shift()!;
    const tile = board[index];
    if (!tile?.special) continue;

    const additions: number[] = [];
    if (tile.special === "row") {
      const rowStart = Math.floor(index / BOARD_SIZE) * BOARD_SIZE;
      for (let column = 0; column < BOARD_SIZE; column += 1) additions.push(rowStart + column);
    } else if (tile.special === "column") {
      const column = index % BOARD_SIZE;
      for (let row = 0; row < BOARD_SIZE; row += 1) additions.push(row * BOARD_SIZE + column);
    } else {
      board.forEach((candidate, candidateIndex) => {
        if (candidate.kind === tile.kind) additions.push(candidateIndex);
      });
    }

    additions.forEach((candidate) => {
      if (!expanded.has(candidate)) {
        expanded.add(candidate);
        queue.push(candidate);
      }
    });
  }

  return expanded;
}

function collapseBoard(
  board: Tile[],
  clearIndexes: Set<number>,
  placements: Map<number, Special>
): { board: Tile[]; cleared: Partial<Record<TileKind, number>>; amount: number } {
  const expanded = expandSpecials(board, clearIndexes);
  const cleared: Partial<Record<TileKind, number>> = {};
  const working: Array<Tile | null> = board.map((tile, index) => {
    if (!expanded.has(index) || placements.has(index)) return tile;
    cleared[tile.kind] = (cleared[tile.kind] ?? 0) + 1;
    return null;
  });

  placements.forEach((special, index) => {
    const original = board[index];
    if (expanded.has(index)) {
      cleared[original.kind] = (cleared[original.kind] ?? 0) + 1;
    }
    working[index] = makeTile(original.kind, special);
  });

  for (let column = 0; column < BOARD_SIZE; column += 1) {
    const survivors: Tile[] = [];
    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      const tile = working[row * BOARD_SIZE + column];
      if (tile) survivors.push(tile);
    }
    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      working[row * BOARD_SIZE + column] = survivors[BOARD_SIZE - 1 - row] ?? makeTile();
    }
  }

  return { board: working as Tile[], cleared, amount: expanded.size };
}

function mergeCounts(
  target: Partial<Record<TileKind, number>>,
  source: Partial<Record<TileKind, number>>
) {
  TILE_KINDS.forEach((kind) => {
    target[kind] = (target[kind] ?? 0) + (source[kind] ?? 0);
  });
}

function resolveBoard(
  startingBoard: Tile[],
  preferredIndex: number | null,
  forcedClear?: Set<number>
): Resolution {
  let board = startingBoard;
  let combos = 0;
  let score = 0;
  let charge = 0;
  const cleared: Partial<Record<TileKind, number>> = {};

  if (forcedClear && forcedClear.size > 0) {
    combos += 1;
    const result = collapseBoard(board, forcedClear, new Map());
    board = result.board;
    mergeCounts(cleared, result.cleared);
    score += result.amount * 55;
    charge += result.amount * 4;
  }

  for (let guard = 0; guard < 30; guard += 1) {
    const matches = findMatches(board);
    if (matches.length === 0) break;

    combos += 1;
    const clearIndexes = new Set(matches.flatMap((match) => match.indexes));
    const placements = new Map<number, Special>();

    matches.forEach((match) => {
      if (match.indexes.length < 4) return;
      const preferred =
        preferredIndex !== null && match.indexes.includes(preferredIndex)
          ? preferredIndex
          : match.indexes[Math.floor(match.indexes.length / 2)];
      placements.set(
        preferred,
        match.indexes.length >= 5 ? "prism" : match.orientation === "row" ? "row" : "column"
      );
    });

    const result = collapseBoard(board, clearIndexes, placements);
    board = result.board;
    mergeCounts(cleared, result.cleared);
    score += result.amount * 60 * combos;
    charge += result.amount * (combos > 1 ? 6 : 4);
    preferredIndex = null;
  }

  if (!hasPossibleMove(board)) {
    board = createBoard();
  }

  return { board, cleared, score, charge, combos };
}

function loadProgress(): SavedProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    return {
      unlocked: Math.min(LEVELS.length, Math.max(1, parsed.unlocked ?? 1)),
      currentLevel: Math.min(LEVELS.length, Math.max(1, parsed.currentLevel ?? 1)),
      coins: Math.max(0, parsed.coins ?? DEFAULT_PROGRESS.coins),
      boosters: { ...DEFAULT_PROGRESS.boosters, ...parsed.boosters },
      bestScores: parsed.bestScores ?? {},
      claimedLevels: parsed.claimedLevels ?? []
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function FuelMatch() {
  const [locale, setLocale] = useState<Locale>("ru");
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [board, setBoard] = useState<Tile[]>([]);
  const [levelNumber, setLevelNumber] = useState(1);
  const [unlocked, setUnlocked] = useState(1);
  const [moves, setMoves] = useState(LEVELS[0].moves);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(DEFAULT_PROGRESS.coins);
  const [boosters, setBoosters] = useState(DEFAULT_PROGRESS.boosters);
  const [bestScores, setBestScores] = useState<Record<number, number>>({});
  const [claimedLevels, setClaimedLevels] = useState<number[]>([]);
  const [collected, setCollected] = useState<Partial<Record<TileKind, number>>>({});
  const [charge, setCharge] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [activeBooster, setActiveBooster] = useState<Booster | null>(null);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [message, setMessage] = useState("");
  const [combo, setCombo] = useState(0);
  const [lastReward, setLastReward] = useState(0);

  const common = getAppDictionary(locale).common;
  const level = LEVELS[levelNumber - 1];

  useEffect(() => {
    const progress = loadProgress();
    const safeLevel = Math.min(progress.currentLevel, progress.unlocked);
    setLocale(getStoredLocalePreference());
    setLevelNumber(safeLevel);
    setUnlocked(progress.unlocked);
    setCoins(progress.coins);
    setBoosters(progress.boosters);
    setBestScores(progress.bestScores);
    setClaimedLevels(progress.claimedLevels);
    setMoves(LEVELS[safeLevel - 1].moves);
    setBoard(createBoard());
    setHydrated(true);

    const syncLocale = () => setLocale(getStoredLocalePreference());
    window.addEventListener("storage", syncLocale);
    return () => window.removeEventListener("storage", syncLocale);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const progress: SavedProgress = {
        unlocked,
        currentLevel: levelNumber,
        coins,
        boosters,
        bestScores,
        claimedLevels
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [bestScores, boosters, claimedLevels, coins, hydrated, levelNumber, unlocked]);

  const goalsComplete = useMemo(
    () => level.goals.every((goal) => (collected[goal.kind] ?? 0) >= goal.count),
    [collected, level.goals]
  );

  function startLevel(nextLevel: number) {
    const safeLevel = Math.min(unlocked, Math.max(1, nextLevel));
    setLevelNumber(safeLevel);
    setBoard(createBoard());
    setMoves(LEVELS[safeLevel - 1].moves);
    setScore(0);
    setCollected({});
    setCharge(0);
    setSelected(null);
    setActiveBooster(null);
    setStatus("playing");
    setMessage("");
    setCombo(0);
    setLastReward(0);
  }

  function applyResolution(resolution: Resolution, moveCost: number, resetCharge = false) {
    const nextMoves = moves - moveCost;
    const nextScore = score + resolution.score;
    const nextCollected = { ...collected };
    mergeCounts(nextCollected, resolution.cleared);
    const completed =
      nextScore >= level.targetScore &&
      level.goals.every((goal) => (nextCollected[goal.kind] ?? 0) >= goal.count);

    setBoard(resolution.board);
    setMoves(nextMoves);
    setScore(nextScore);
    setCollected(nextCollected);
    setCharge(Math.min(100, (resetCharge ? 0 : charge) + resolution.charge));
    setCombo(resolution.combos);
    setSelected(null);
    setMessage("");

    if (completed) {
      const firstClear = !claimedLevels.includes(levelNumber);
      const reward = firstClear ? level.reward : 25;
      setLastReward(reward);
      setCoins((value) => value + reward);
      if (firstClear) setClaimedLevels((values) => [...values, levelNumber]);
      setBestScores((scores) => ({
        ...scores,
        [levelNumber]: Math.max(scores[levelNumber] ?? 0, nextScore)
      }));
      setUnlocked((value) => Math.min(LEVELS.length, Math.max(value, levelNumber + 1)));
      setStatus("won");
      setMessage("");
    } else if (nextMoves <= 0) {
      setStatus("lost");
      setMessage("");
    }
  }

  function handleTile(index: number) {
    if (status !== "playing" || board.length === 0) return;

    if (activeBooster === "hammer" || activeBooster === "cross") {
      const clearIndexes = new Set<number>([index]);
      if (activeBooster === "cross") {
        const rowStart = Math.floor(index / BOARD_SIZE) * BOARD_SIZE;
        for (let offset = 0; offset < BOARD_SIZE; offset += 1) {
          clearIndexes.add(rowStart + offset);
          clearIndexes.add(offset * BOARD_SIZE + (index % BOARD_SIZE));
        }
      }
      const booster = activeBooster;
      setBoosters((values) => ({ ...values, [booster]: Math.max(0, values[booster] - 1) }));
      setActiveBooster(null);
      applyResolution(resolveBoard(board, null, clearIndexes), 0);
      return;
    }

    if (selected === null) {
      setSelected(index);
      setMessage("");
      return;
    }

    if (selected === index) {
      setSelected(null);
      return;
    }

    if (!areAdjacent(selected, index)) {
      setSelected(index);
      return;
    }

    const first = board[selected];
    const second = board[index];
    const swapped = swapTiles(board, selected, index);

    if (first.special === "prism" || second.special === "prism") {
      const targetKind = first.special === "prism" ? second.kind : first.kind;
      const clearIndexes = new Set<number>([selected, index]);
      swapped.forEach((tile, tileIndex) => {
        if (tile.kind === targetKind) clearIndexes.add(tileIndex);
      });
      applyResolution(resolveBoard(swapped, index, clearIndexes), 1);
      return;
    }

    if (findMatches(swapped).length === 0) {
      setSelected(null);
      setMessage(common["gaming.noMatch"]);
      return;
    }

    applyResolution(resolveBoard(swapped, index), 1);
  }

  function activateBooster(booster: Booster) {
    if (status !== "playing") return;
    if (boosters[booster] <= 0) {
      setMessage(common["gaming.notEnoughCoins"]);
      return;
    }
    if (booster === "shuffle") {
      setBoosters((values) => ({ ...values, shuffle: values.shuffle - 1 }));
      setBoard(createBoard());
      setSelected(null);
      setMessage(common["gaming.shuffleNotice"]);
      return;
    }
    setActiveBooster((current) => (current === booster ? null : booster));
    setSelected(null);
    setMessage(currentBoosterMessage(activeBooster, booster, common));
  }

  function buyBooster(booster: Booster) {
    const cost = BOOSTER_COSTS[booster];
    if (coins < cost) {
      setMessage(common["gaming.notEnoughCoins"]);
      return;
    }
    setCoins((value) => value - cost);
    setBoosters((values) => ({ ...values, [booster]: values[booster] + 1 }));
    setMessage("");
  }

  function triggerPower() {
    if (charge < 100 || status !== "playing") return;
    const counts = new Map<TileKind, number>();
    board.forEach((tile) => counts.set(tile.kind, (counts.get(tile.kind) ?? 0) + 1));
    const targetKind = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const clearIndexes = new Set<number>();
    board.forEach((tile, index) => {
      if (tile.kind === targetKind) clearIndexes.add(index);
    });
    setCharge(0);
    applyResolution(resolveBoard(board, null, clearIndexes), 0, true);
    setMessage(common["gaming.powerUsed"]);
  }

  function resetProgress() {
    if (!window.confirm(common["gaming.resetConfirm"])) return;
    window.localStorage.removeItem(STORAGE_KEY);
    setUnlocked(DEFAULT_PROGRESS.unlocked);
    setCoins(DEFAULT_PROGRESS.coins);
    setBoosters(DEFAULT_PROGRESS.boosters);
    setBestScores({});
    setClaimedLevels([]);
    startLevel(1);
  }

  function handleGridKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
    const target = event.target as HTMLButtonElement;
    const index = Number(target.dataset.index);
    if (!Number.isFinite(index)) return;
    const delta =
      event.key === "ArrowUp"
        ? -BOARD_SIZE
        : event.key === "ArrowDown"
          ? BOARD_SIZE
          : event.key === "ArrowLeft"
            ? -1
            : 1;
    const next = index + delta;
    if (next < 0 || next >= board.length) return;
    if (
      (event.key === "ArrowLeft" && index % BOARD_SIZE === 0) ||
      (event.key === "ArrowRight" && index % BOARD_SIZE === BOARD_SIZE - 1)
    )
      return;
    event.preventDefault();
    document.querySelector<HTMLButtonElement>(`[data-game-tile="${next}"]`)?.focus();
  }

  if (!hydrated) {
    return (
      <main className={styles.loading} aria-busy="true">
        <span className={styles.loadingMark}>FF</span>
      </main>
    );
  }

  const tileLabels: Record<TileKind, string> = {
    spark: common["gaming.tileSpark"],
    drop: common["gaming.tileDrop"],
    bolt: common["gaming.tileBolt"],
    gem: common["gaming.tileGem"],
    heart: common["gaming.tileHeart"],
    nova: common["gaming.tileNova"]
  };
  const symbols: Record<TileKind, string> = {
    spark: "◉",
    drop: "●",
    bolt: "ϟ",
    gem: "◆",
    heart: "♥",
    nova: "▣"
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label={common["gaming.back"]}>
          <span>FF</span>
          <strong>{common["gaming.title"]}</strong>
        </a>
        <div className={styles.headerMeta}>
          <span className={styles.localBadge}>
            <i />
            {common["gaming.localMode"]}
          </span>
          <a className={styles.backLink} href="/">
            {common["gaming.back"]}
          </a>
        </div>
      </header>

      <section className={styles.intro}>
        <div>
          <span className={styles.eyebrow}>{common["gaming.eyebrow"]}</span>
          <h1>{common["gaming.title"]}</h1>
          <p>{common["gaming.subtitle"]}</p>
        </div>
        <div className={styles.coinWallet} title={common["gaming.coinsNote"]}>
          <span className={styles.coinIcon}>F</span>
          <span>
            <small>{common["gaming.coins"]}</small>
            <strong>{coins}</strong>
          </span>
        </div>
      </section>

      {storageError ? (
        <div className={styles.notice} role="alert">
          {common["gaming.storageError"]}
        </div>
      ) : null}

      <div className={styles.gameLayout}>
        <aside className={styles.leftRail}>
          <section className={styles.panel}>
            <div className={styles.panelHeading}>
              <span>{common["gaming.levels"]}</span>
              <strong>
                {levelNumber}/{LEVELS.length}
              </strong>
            </div>
            <div className={styles.levelGrid}>
              {LEVELS.map((_, index) => {
                const number = index + 1;
                const isLocked = number > unlocked;
                return (
                  <button
                    key={number}
                    type="button"
                    className={styles.levelButton}
                    aria-current={number === levelNumber ? "true" : undefined}
                    aria-label={`${common["gaming.level"]} ${number}${isLocked ? `, ${common["gaming.locked"]}` : ""}`}
                    disabled={isLocked}
                    onClick={() => startLevel(number)}
                  >
                    {isLocked ? "·" : number}
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeading}>
              <span>{common["gaming.goal"]}</span>
              <strong>
                {score}/{level.targetScore}
              </strong>
            </div>
            <div className={styles.scoreTrack}>
              <span style={{ width: `${Math.min(100, (score / level.targetScore) * 100)}%` }} />
            </div>
            <div className={styles.goalList}>
              {level.goals.map((goal) => {
                const current = Math.min(goal.count, collected[goal.kind] ?? 0);
                return (
                  <div
                    className={styles.goalRow}
                    key={goal.kind}
                    data-complete={current >= goal.count}
                  >
                    <span className={styles.goalToken} data-kind={goal.kind}>
                      {symbols[goal.kind]}
                    </span>
                    <span>
                      {common["gaming.collect"]} {tileLabels[goal.kind]}
                    </span>
                    <strong>
                      {current}/{goal.count}
                    </strong>
                  </div>
                );
              })}
            </div>
          </section>

          <details className={styles.help}>
            <summary>{common["gaming.howToPlay"]}</summary>
            <p>{common["gaming.howToPlayText"]}</p>
          </details>
        </aside>

        <section className={styles.boardShell}>
          <div className={styles.stats}>
            <div>
              <small>{common["gaming.level"]}</small>
              <strong>{levelNumber}</strong>
            </div>
            <div>
              <small>{common["gaming.score"]}</small>
              <strong>{score}</strong>
            </div>
            <div>
              <small>{common["gaming.moves"]}</small>
              <strong>{moves}</strong>
            </div>
            <button
              type="button"
              onClick={() => setStatus(status === "paused" ? "playing" : "paused")}
              disabled={status === "won" || status === "lost"}
            >
              <span>{status === "paused" ? common["gaming.resume"] : common["gaming.pause"]}</span>
            </button>
          </div>

          <div className={styles.boardWrap}>
            <div
              className={styles.board}
              role="grid"
              aria-label={common["gaming.title"]}
              aria-busy={status === "paused"}
              onKeyDown={handleGridKeyDown}
            >
              {board.map((tile, index) => {
                const specialLabel = tile.special
                  ? common[
                      `gaming.special${tile.special === "row" ? "Row" : tile.special === "column" ? "Column" : "Prism"}`
                    ]
                  : "";
                return (
                  <button
                    key={tile.id}
                    type="button"
                    role="gridcell"
                    className={styles.tile}
                    data-kind={tile.kind}
                    data-special={tile.special ?? undefined}
                    data-selected={selected === index || undefined}
                    data-game-tile={index}
                    data-index={index}
                    aria-label={`${tileLabels[tile.kind]}${specialLabel ? `, ${specialLabel}` : ""}${selected === index ? `, ${common["gaming.selected"]}` : ""}`}
                    onClick={() => handleTile(index)}
                    disabled={status !== "playing"}
                  >
                    <span className={styles.tileGlow} />
                    <span className={styles.tileSymbol}>{symbols[tile.kind]}</span>
                    {tile.special ? (
                      <span className={styles.specialMark} aria-hidden="true" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {status === "paused" ? (
              <div className={styles.overlay}>
                <strong>{common["gaming.pause"]}</strong>
                <button type="button" onClick={() => setStatus("playing")}>
                  {common["gaming.resume"]}
                </button>
              </div>
            ) : null}
            {status === "won" || status === "lost" ? (
              <div className={styles.overlay} role="dialog" aria-modal="true">
                <span className={status === "won" ? styles.winMark : styles.loseMark}>
                  {status === "won" ? "✓" : "!"}
                </span>
                <strong>{common[status === "won" ? "gaming.complete" : "gaming.failed"]}</strong>
                <p>{common[status === "won" ? "gaming.completeLead" : "gaming.failedLead"]}</p>
                {status === "won" ? (
                  <div className={styles.reward}>
                    <span className={styles.coinIcon}>F</span>+{lastReward}
                  </div>
                ) : null}
                <div className={styles.overlayActions}>
                  <button type="button" onClick={() => startLevel(levelNumber)}>
                    {common["gaming.retry"]}
                  </button>
                  {status === "won" && levelNumber < LEVELS.length ? (
                    <button
                      type="button"
                      className={styles.primaryAction}
                      onClick={() => startLevel(levelNumber + 1)}
                    >
                      {common["gaming.nextLevel"]}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className={styles.feedback} aria-live="polite">
            <span>
              {message ||
                (activeBooster
                  ? common["gaming.chooseTile"]
                  : combo > 1
                    ? `${common["gaming.combo"]} ×${combo}`
                    : "\u00a0")}
            </span>
            <span>{goalsComplete ? "✓" : ""}</span>
          </div>
        </section>

        <aside className={styles.rightRail}>
          <section className={`${styles.panel} ${styles.powerPanel}`}>
            <div className={styles.panelHeading}>
              <span>{common["gaming.power"]}</span>
              <strong>{charge}%</strong>
            </div>
            <div className={styles.powerOrb} data-ready={charge >= 100}>
              <span>FF</span>
              <i style={{ height: `${charge}%` }} />
            </div>
            <strong>
              {charge >= 100 ? common["gaming.powerReady"] : common["gaming.powerCharging"]}
            </strong>
            <button
              className={styles.primaryAction}
              type="button"
              disabled={charge < 100 || status !== "playing"}
              onClick={triggerPower}
            >
              {common["gaming.powerAction"]}
            </button>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeading}>
              <span>{common["gaming.boosters"]}</span>
            </div>
            <div className={styles.boosterList}>
              {(["hammer", "shuffle", "cross"] as Booster[]).map((booster) => {
                const labels = {
                  hammer: [common["gaming.boosterHammer"], common["gaming.boosterHammerText"], "◎"],
                  shuffle: [
                    common["gaming.boosterShuffle"],
                    common["gaming.boosterShuffleText"],
                    "⤨"
                  ],
                  cross: [common["gaming.boosterCross"], common["gaming.boosterCrossText"], "✚"]
                }[booster];
                return (
                  <div
                    className={styles.booster}
                    key={booster}
                    data-active={activeBooster === booster}
                  >
                    <button
                      type="button"
                      className={styles.boosterUse}
                      onClick={() => activateBooster(booster)}
                      disabled={status !== "playing"}
                    >
                      <span>{labels[2]}</span>
                      <span>
                        <strong>{labels[0]}</strong>
                        <small>{labels[1]}</small>
                      </span>
                      <b>×{boosters[booster]}</b>
                    </button>
                    <button
                      type="button"
                      className={styles.buyButton}
                      onClick={() => buyBooster(booster)}
                      disabled={coins < BOOSTER_COSTS[booster]}
                    >
                      +1 · {BOOSTER_COSTS[booster]} <span className={styles.miniCoin}>F</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <div className={styles.utilityActions}>
            <button type="button" onClick={() => startLevel(levelNumber)}>
              {common["gaming.restart"]}
            </button>
            <button type="button" onClick={resetProgress}>
              {common["gaming.resetProgress"]}
            </button>
          </div>
          <p className={styles.disclaimer}>{common["gaming.coinsNote"]}</p>
          {bestScores[levelNumber] ? (
            <p className={styles.best}>
              {common["gaming.best"]}: <strong>{bestScores[levelNumber]}</strong>
            </p>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

function currentBoosterMessage(
  current: Booster | null,
  next: Booster,
  common: ReturnType<typeof getAppDictionary>["common"]
) {
  return current === next ? common["gaming.boosterCancelled"] : common["gaming.chooseTile"];
}
