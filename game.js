(function () {
  "use strict";

  const SUMS = [6, 9, 12, 15, 18, 21, 24];
  const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const DIFFICULTIES = {
    easy: { label: "Easy", blanks: 3 },
    medium: { label: "Medium", blanks: 5 },
    hard: { label: "Hard", blanks: 7 },
  };
  const LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  const STORAGE = {
    streak: "summetry.currentStreak",
    best: "summetry.bestScore",
  };

  const state = {
    difficulty: "easy",
    puzzle: null,
    grid: Array(9).fill(0),
    fixed: Array(9).fill(false),
    hinted: new Set(),
    selected: null,
    hints: 0,
    seconds: 0,
    timerId: null,
    solved: false,
    abandonedCurrentPuzzle: false,
    streak: Number(localStorage.getItem(STORAGE.streak) || 0),
    best: Number(localStorage.getItem(STORAGE.best) || 0),
  };

  const els = {
    homeScreen: document.getElementById("home-screen"),
    gameScreen: document.getElementById("game-screen"),
    homeStreak: document.getElementById("home-streak"),
    homeBest: document.getElementById("home-best"),
    difficultyLabel: document.getElementById("difficulty-label"),
    timer: document.getElementById("timer"),
    gameStreak: document.getElementById("game-streak"),
    targetSum: document.getElementById("target-sum"),
    board: document.getElementById("board"),
    message: document.getElementById("message"),
    numberPad: document.getElementById("number-pad"),
    hintButton: document.getElementById("hint-button"),
    newPuzzleButton: document.getElementById("new-puzzle-button"),
    homeButton: document.getElementById("home-button"),
    winModal: document.getElementById("win-modal"),
    winTime: document.getElementById("win-time"),
    winHints: document.getElementById("win-hints"),
    winScore: document.getElementById("win-score"),
    nextPuzzleButton: document.getElementById("next-puzzle-button"),
    confettiLayer: document.getElementById("confetti-layer"),
  };

  function shuffle(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function formatTime(seconds) {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  }

  function getLineStatus(grid, target) {
    const good = new Set();
    const bad = new Set();

    LINES.forEach((line) => {
      const values = line.map((index) => grid[index]);
      if (values.some((value) => value === 0)) {
        return;
      }
      const bucket = values.reduce((sum, value) => sum + value, 0) === target ? good : bad;
      line.forEach((index) => bucket.add(index));
    });

    return { good, bad };
  }

  function isSolved(grid, target) {
    return grid.every(Boolean) && LINES.every((line) => line.reduce((sum, index) => sum + grid[index], 0) === target);
  }

  function violatesPartialLine(grid, target, index) {
    return LINES.some((line) => {
      if (!line.includes(index)) {
        return false;
      }
      const values = line.map((cell) => grid[cell]);
      const filled = values.filter(Boolean);
      const partialSum = filled.reduce((sum, value) => sum + value, 0);
      if (filled.length === 3) {
        return partialSum !== target;
      }
      const remaining = 3 - filled.length;
      return partialSum + remaining > target || partialSum + remaining * 9 < target;
    });
  }

  function countSolutions(partialGrid, target, limit = 2) {
    const grid = partialGrid.slice();
    let count = 0;

    function chooseCell() {
      let best = -1;
      let bestOptions = null;

      for (let index = 0; index < 9; index += 1) {
        if (grid[index] !== 0) {
          continue;
        }
        const options = DIGITS.filter((digit) => {
          grid[index] = digit;
          const valid = !violatesPartialLine(grid, target, index);
          grid[index] = 0;
          return valid;
        });
        if (bestOptions === null || options.length < bestOptions.length) {
          best = index;
          bestOptions = options;
        }
      }

      return { index: best, options: bestOptions || [] };
    }

    function solve() {
      if (count >= limit) {
        return;
      }
      const { index, options } = chooseCell();
      if (index === -1) {
        if (isSolved(grid, target)) {
          count += 1;
        }
        return;
      }
      for (const digit of options) {
        grid[index] = digit;
        solve();
        grid[index] = 0;
        if (count >= limit) {
          return;
        }
      }
    }

    solve();
    return count;
  }

  function generateMagicSquare() {
    const target = SUMS[Math.floor(Math.random() * SUMS.length)];
    const center = target / 3;
    const candidates = [];

    for (const topLeft of DIGITS) {
      for (const topRight of DIGITS) {
        const grid = Array(9).fill(0);
        grid[0] = topLeft;
        grid[2] = topRight;
        grid[4] = center;
        grid[8] = 2 * center - topLeft;
        grid[6] = 2 * center - topRight;
        grid[1] = target - topLeft - topRight;
        grid[7] = 2 * center - grid[1];
        grid[3] = center - topLeft + topRight;
        grid[5] = 2 * center - grid[3];

        if (grid.every((value) => Number.isInteger(value) && value >= 1 && value <= 9) && isSolved(grid, target)) {
          const allSame = grid.every((value) => value === grid[0]);
          if (!allSame) {
            candidates.push(grid);
          }
        }
      }
    }

    return {
      target,
      solution: shuffle(candidates)[0],
    };
  }

  function makePuzzle(difficulty) {
    const blanksNeeded = DIFFICULTIES[difficulty].blanks;

    for (let attempt = 0; attempt < 500; attempt += 1) {
      const { target, solution } = generateMagicSquare();
      if (!solution) {
        continue;
      }
      const puzzle = solution.slice();
      let blanks = 0;
      const positions = shuffle([0, 1, 2, 3, 5, 6, 7, 8]);

      for (const index of positions) {
        if (blanks >= blanksNeeded) {
          break;
        }
        const saved = puzzle[index];
        puzzle[index] = 0;
        if (countSolutions(puzzle, target, 2) === 1) {
          blanks += 1;
        } else {
          puzzle[index] = saved;
        }
      }

      if (blanks === blanksNeeded && countSolutions(puzzle, target, 2) === 1) {
        return { target, solution, puzzle };
      }
    }

    throw new Error("Could not generate a unique puzzle. Try again.");
  }

  function persistScores() {
    localStorage.setItem(STORAGE.streak, String(state.streak));
    localStorage.setItem(STORAGE.best, String(state.best));
  }

  function updateScoreDisplays() {
    els.homeStreak.textContent = state.streak;
    els.gameStreak.textContent = state.streak;
    els.homeBest.textContent = state.best;
  }

  function startTimer() {
    clearInterval(state.timerId);
    state.seconds = 0;
    els.timer.textContent = formatTime(0);
    state.timerId = setInterval(() => {
      state.seconds += 1;
      els.timer.textContent = formatTime(state.seconds);
    }, 1000);
  }

  function stopTimer() {
    clearInterval(state.timerId);
    state.timerId = null;
  }

  function showMessage(text, tone) {
    els.message.textContent = text;
    els.message.className = `message${tone ? ` ${tone}` : ""}`;
  }

  function renderBoard() {
    els.board.innerHTML = "";
    const { good, bad } = getLineStatus(state.grid, state.puzzle.target);

    state.grid.forEach((value, index) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.setAttribute("aria-label", `Cell ${index + 1}${value ? `, ${value}` : ", empty"}`);
      cell.dataset.index = String(index);
      cell.textContent = value || "";

      if (state.fixed[index]) {
        cell.classList.add("fixed");
      }
      if (state.hinted.has(index)) {
        cell.classList.add("hint");
      }
      if (state.selected === index) {
        cell.classList.add("selected");
      }
      if (bad.has(index)) {
        cell.classList.add("bad");
      } else if (good.has(index)) {
        cell.classList.add("good");
      }

      cell.addEventListener("click", () => selectCell(index));
      els.board.appendChild(cell);
    });
  }

  function renderPad() {
    els.numberPad.innerHTML = "";
    DIGITS.forEach((digit) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = digit;
      button.addEventListener("click", () => fillSelected(digit));
      els.numberPad.appendChild(button);
    });

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "number-pad-clear";
    clear.textContent = "✕";
    clear.setAttribute("aria-label", "Clear selected cell");
    clear.addEventListener("click", () => fillSelected(0));
    els.numberPad.appendChild(clear);
  }

  function selectCell(index) {
    if (state.fixed[index] || state.solved) {
      return;
    }
    state.selected = index;
    renderBoard();
  }

  function fillSelected(value) {
    if (state.selected === null || state.fixed[state.selected] || state.solved) {
      showMessage("Select an empty cell first.", "warn");
      return;
    }
    state.grid[state.selected] = value;
    state.hinted.delete(state.selected);
    showMessage("Keep going. Completed lines will light up.", "");
    renderBoard();
    checkWin();
  }

  function revealHint() {
    if (state.solved) {
      return;
    }
    const empty = state.grid.map((value, index) => (value === 0 && !state.fixed[index] ? index : null)).filter((index) => index !== null);
    if (!empty.length) {
      checkWin();
      return;
    }
    const index = empty[Math.floor(Math.random() * empty.length)];
    state.grid[index] = state.puzzle.solution[index];
    state.fixed[index] = true;
    state.hinted.add(index);
    state.hints += 1;
    state.selected = null;
    showMessage("Hint revealed. Score penalty: 100.", "");
    renderBoard();
    const hintedCell = els.board.querySelector(`[data-index="${index}"]`);
    if (hintedCell) {
      hintedCell.classList.add("pulse");
    }
    checkWin();
  }

  function scorePuzzle() {
    return Math.max(100, 1000 - state.seconds * 2 - state.hints * 100);
  }

  function checkWin() {
    if (!isSolved(state.grid, state.puzzle.target)) {
      return;
    }

    state.solved = true;
    state.abandonedCurrentPuzzle = false;
    stopTimer();
    const score = scorePuzzle();
    state.streak += 1;
    state.best = Math.max(state.best, score);
    persistScores();
    updateScoreDisplays();

    els.winTime.textContent = `Time taken: ${formatTime(state.seconds)}`;
    els.winHints.textContent = `Hints used: ${state.hints}`;
    els.winScore.textContent = `Score for this puzzle: ${score}`;
    els.winModal.classList.remove("hidden");
    showMessage("Solved!", "win");
    renderBoard();
    launchConfetti();
  }

  function launchConfetti() {
    els.confettiLayer.innerHTML = "";
    const colors = ["#78c56f", "#dcc35b", "#4c92d9", "#d7685f", "#f4f1e8"];
    for (let i = 0; i < 48; i += 1) {
      const piece = document.createElement("span");
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = `${Math.random() * 0.35}s`;
      piece.style.transform = `rotate(${Math.random() * 180}deg)`;
      els.confettiLayer.appendChild(piece);
    }
    setTimeout(() => {
      els.confettiLayer.innerHTML = "";
    }, 1800);
  }

  function startPuzzle(difficulty, resetStreakForAbandon = false) {
    if (resetStreakForAbandon && state.abandonedCurrentPuzzle && !state.solved) {
      state.streak = 0;
      persistScores();
    }

    state.difficulty = difficulty;
    state.puzzle = makePuzzle(difficulty);
    state.grid = state.puzzle.puzzle.slice();
    state.fixed = state.grid.map(Boolean);
    state.hinted = new Set();
    state.selected = state.grid.findIndex((value, index) => value === 0 && !state.fixed[index]);
    state.hints = 0;
    state.solved = false;
    state.abandonedCurrentPuzzle = true;

    els.difficultyLabel.textContent = DIFFICULTIES[difficulty].label;
    els.targetSum.textContent = state.puzzle.target;
    els.winModal.classList.add("hidden");
    els.homeScreen.classList.remove("active");
    els.gameScreen.classList.add("active");

    updateScoreDisplays();
    showMessage("Select an empty cell, then tap a number.", "");
    renderBoard();
    startTimer();
  }

  function goHome() {
    stopTimer();
    els.gameScreen.classList.remove("active");
    els.homeScreen.classList.add("active");
    updateScoreDisplays();
  }

  function bindEvents() {
    document.querySelectorAll(".difficulty-button").forEach((button) => {
      button.addEventListener("click", () => startPuzzle(button.dataset.difficulty, false));
    });

    els.hintButton.addEventListener("click", revealHint);
    els.newPuzzleButton.addEventListener("click", () => startPuzzle(state.difficulty, true));
    els.nextPuzzleButton.addEventListener("click", () => startPuzzle(state.difficulty, false));
    els.homeButton.addEventListener("click", goHome);

    document.addEventListener("keydown", (event) => {
      if (!els.gameScreen.classList.contains("active")) {
        return;
      }
      if (/^[1-9]$/.test(event.key)) {
        fillSelected(Number(event.key));
      } else if (event.key === "Backspace" || event.key === "Delete" || event.key.toLowerCase() === "x") {
        fillSelected(0);
      }
    });
  }

  function init() {
    updateScoreDisplays();
    renderPad();
    bindEvents();
  }

  window.Summetry = {
    makePuzzle,
    countSolutions,
    isSolved,
  };

  init();
})();
