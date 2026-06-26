// ── DOM ELEMENTS ──
const cells         = document.querySelectorAll(".cell");
const statusText    = document.getElementById("status");
const gameMode      = document.getElementById("gameMode");
const difficulty    = document.getElementById("difficulty");
const diffBox       = document.getElementById("diffBox");
const playAs        = document.getElementById("playAs");
const playAsBox     = document.getElementById("playAsBox");

const xScoreEl      = document.getElementById("xScore");
const oScoreEl      = document.getElementById("oScore");
const drawScoreEl   = document.getElementById("drawScore");
const xLabel        = document.getElementById("xLabel");
const oLabel        = document.getElementById("oLabel");

const timerEl       = document.getElementById("timer");
const timerDisplay  = document.getElementById("timerDisplay");
const timerFill     = document.getElementById("timerFill");

const historyList   = document.getElementById("historyList");
const historyToggle = document.getElementById("historyToggle");
const toggleIcon    = document.getElementById("toggleIcon");

const newGameBtn     = document.getElementById("newGame");
const resetScoresBtn = document.getElementById("resetScores");
const themeBtn       = document.getElementById("themeBtn");

const winnerModal   = document.getElementById("winnerModal");
const winnerText    = document.getElementById("winnerText");
const winnerSub     = document.getElementById("winnerSub");
const closeModalBtn = document.getElementById("closeModal");
const modalEmoji    = document.getElementById("modalEmoji");

const nameXInput = document.getElementById("nameX");
const nameOInput = document.getElementById("nameO");

// ── STATE ──
let board         = ["","","","","","","","",""];
let currentPlayer = "X";
let gameActive    = true;
let xScore = 0, oScore = 0, drawScore = 0;
let timerCount    = 15;
const TOTAL_TIME  = 15;
let timerInterval;
let historyVisible = false;
let isLightTheme   = false;
let nameX = "Player X";
let nameO = "Player O";
let humanMark = "X";   // which mark the human controls in CPU mode
let cpuMark   = "O";

const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
];

// ── INIT ──
startTimer();
updateStatus();
handleModeChange(); // set initial visibility

// ── PLAYER NAME INPUTS ──
nameXInput.addEventListener("input", () => {
    nameX = nameXInput.value.trim() || "Player X";
    xLabel.textContent = nameX;
    updateStatus();
});

nameOInput.addEventListener("input", () => {
    nameO = nameOInput.value.trim() || "Player O";
    oLabel.textContent = nameO;
    updateStatus();
});

// ── CELL CLICKS ──
cells.forEach(cell => {
    cell.addEventListener("click", handleCellClick);
});

// ── BUTTON EVENTS ──
newGameBtn.addEventListener("click", () => {
    // Close modal if open when clicking New Game directly
    winnerModal.classList.remove("show");
    resetBoard();
});

resetScoresBtn.addEventListener("click", resetScores);

closeModalBtn.addEventListener("click", () => {
    winnerModal.classList.remove("show");
    resetBoard();
});

themeBtn.addEventListener("click", () => {
    isLightTheme = !isLightTheme;
    document.body.classList.toggle("light-theme", isLightTheme);
    themeBtn.textContent = isLightTheme ? "🌙 Dark Mode" : "☀️ Light Mode";
});

gameMode.addEventListener("change", () => {
    handleModeChange();
    resetBoard();
});

playAs.addEventListener("change", () => {
    humanMark = playAs.value;
    cpuMark   = humanMark === "X" ? "O" : "X";
    resetBoard();
});

difficulty.addEventListener("change", () => {
    resetBoard();
});

historyToggle.addEventListener("click", () => {
    historyVisible = !historyVisible;
    historyList.classList.toggle("hidden", !historyVisible);
    toggleIcon.textContent = historyVisible ? "▲ Hide" : "▼ Show";
});

// ── MODE CHANGE ──
// BUG FIX 1: Difficulty is now always visible/enabled in both PvP and CPU modes.
// BUG FIX 8: humanMark/cpuMark reset properly when switching back to PvP.
function handleModeChange() {
    const isCPU = gameMode.value === "cpu";

    // "Play As" only makes sense in CPU mode — hide it in PvP
    playAsBox.classList.toggle("hidden", !isCPU);

    // Difficulty is now always enabled regardless of mode
    diffBox.classList.remove("hidden");

    if (isCPU) {
        humanMark = playAs.value;
        cpuMark   = humanMark === "X" ? "O" : "X";
    } else {
        // In PvP, reset marks so CPU-blocking logic never triggers
        humanMark = "X";
        cpuMark   = "";  // empty string means no CPU — click blocking won't fire
    }
}

// ── GAME LOGIC ──
function handleCellClick() {
    const index = this.dataset.index;
    if (board[index] !== "" || !gameActive) return;

    // BUG FIX 8: Only block clicks on CPU's turn when actually in CPU mode
    if (gameMode.value === "cpu" && currentPlayer === cpuMark) return;

    placeMove(index, currentPlayer);
}

function placeMove(index, player) {
    board[index] = player;

    const cell = cells[index];
    cell.textContent = player;
    cell.classList.add("taken", player === "X" ? "x-mark" : "o-mark", "mark-enter");

    cell.addEventListener("animationend", () => {
        cell.classList.remove("mark-enter");
    }, { once: true });

    if (checkWinner()) return;
    if (checkDraw()) return;

    switchPlayer();

    // If next turn is CPU's turn, fire AI
    if (gameMode.value === "cpu" && currentPlayer === cpuMark) {
        setTimeout(computerMove, 500);
    }
}

function switchPlayer() {
    // BUG FIX 2: Never switch player or trigger CPU if game is already over
    if (!gameActive) return;
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    updateStatus();
    resetTimer();
}

function updateStatus() {
    if (!gameActive) return;
    const name = currentPlayer === "X" ? nameX : nameO;
    const cls  = currentPlayer === "X" ? "x-name" : "o-name";
    statusText.innerHTML = `<span class="${cls}">${name}</span>'s Turn`;
}

// ── COMPUTER AI ──
function computerMove() {
    // BUG FIX 3: Guard against firing when game is no longer active
    if (!gameActive) return;

    let move;
    const diff = difficulty.value;

    if (diff === "hard") {
        move = getBestMove();
    } else if (diff === "medium") {
        move = Math.random() < 0.6 ? getBestMove() : randomMove();
    } else {
        move = randomMove();
    }

    if (move !== null && move !== undefined) {
        placeMove(move, cpuMark);
    }
}

function randomMove() {
    const empty = board.map((v, i) => v === "" ? i : null).filter(v => v !== null);
    return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
}

function getBestMove() {
    // Try to win
    for (let p of winPatterns) {
        const vals = p.map(i => board[i]);
        if (vals.filter(v => v === cpuMark).length === 2 && vals.includes("")) {
            return p[vals.indexOf("")];
        }
    }
    // Block human win
    for (let p of winPatterns) {
        const vals = p.map(i => board[i]);
        if (vals.filter(v => v === humanMark).length === 2 && vals.includes("")) {
            return p[vals.indexOf("")];
        }
    }
    // Take center
    if (board[4] === "") return 4;

    return randomMove();
}

// ── WIN / DRAW CHECK ──
function checkWinner() {
    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            [a, b, c].forEach(i => cells[i].classList.add("win"));

            gameActive = false;
            clearInterval(timerInterval);

            const winnerName = board[a] === "X" ? nameX : nameO;

            if (board[a] === "X") {
                xScore++;
                xScoreEl.textContent = xScore;
            } else {
                oScore++;
                oScoreEl.textContent = oScore;
            }

            const card = document.querySelector(board[a] === "X" ? ".x-card" : ".o-card");
            card.classList.add("pop");
            setTimeout(() => card.classList.remove("pop"), 400);

            addHistory(winnerName, board[a]);
            launchConfetti();
            setTimeout(() => showModal("win", winnerName), 600);
            return true;
        }
    }
    return false;
}

function checkDraw() {
    if (board.every(cell => cell !== "")) {
        gameActive = false;
        drawScore++;
        drawScoreEl.textContent = drawScore;
        clearInterval(timerInterval);
        addHistory(null, "D");
        setTimeout(() => showModal("draw"), 400);
        return true;
    }
    return false;
}

// ── MODAL ──
function showModal(type, winnerName) {
    if (type === "win") {
        modalEmoji.textContent = "🏆";
        winnerText.textContent  = `${winnerName} Wins!`;
        winnerSub.textContent   = "Brilliant move! Play again?";
    } else {
        modalEmoji.textContent = "🤝";
        winnerText.textContent  = "It's a Draw!";
        winnerSub.textContent   = "Well played by both sides!";
    }
    winnerModal.classList.add("show");
}

// ── RESET ──
function resetBoard() {
    board         = ["","","","","","","","",""];
    currentPlayer = "X";
    gameActive    = true;

    cells.forEach(cell => {
        cell.textContent = "";
        cell.className   = "cell";
    });

    // BUG FIX 6: Clear any leftover confetti pieces between games
    document.getElementById("confettiContainer").innerHTML = "";

    updateStatus();
    resetTimer();

    // If human chose O in CPU mode, CPU (as X) goes first
    if (gameMode.value === "cpu" && cpuMark === "X") {
        setTimeout(computerMove, 600);
    }
}

function resetScores() {
    xScore = 0; oScore = 0; drawScore = 0;
    xScoreEl.textContent    = 0;
    oScoreEl.textContent    = 0;
    drawScoreEl.textContent = 0;
    historyList.innerHTML   = "";
    winnerModal.classList.remove("show");
    resetBoard();
}

// ── TIMER ──
function startTimer() {
    timerInterval = setInterval(() => {
        timerCount--;
        timerEl.textContent = timerCount;

        const pct = (timerCount / TOTAL_TIME) * 100;
        timerFill.style.width = pct + "%";

        const isWarn   = timerCount <= 6 && timerCount > 3;
        const isDanger = timerCount <= 3;

        timerFill.className    = "timer-fill" + (isDanger ? " danger" : isWarn ? " warn" : "");
        timerDisplay.className = isDanger ? "danger" : isWarn ? "warn" : "";

        if (timerCount <= 0) {
            // BUG FIX 2 & 3: Only act on timer expiry if game is still active
            if (!gameActive) return;
            switchPlayer();
            if (gameMode.value === "cpu" && currentPlayer === cpuMark) {
                setTimeout(computerMove, 500);
            }
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
    timerCount = TOTAL_TIME;
    timerEl.textContent   = timerCount;
    timerFill.style.width = "100%";
    timerFill.className   = "timer-fill";
    timerDisplay.className = "";
    startTimer();
}

// ── MATCH HISTORY ──
function addHistory(winnerName, result) {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const li   = document.createElement("li");

    let badge = "";
    if (result === "D") {
        badge = `<span class="badge badge-draw">Draw</span>`;
    } else if (result === "X") {
        badge = `<span class="badge badge-x">${winnerName} ✓</span>`;
    } else {
        badge = `<span class="badge badge-o">${winnerName} ✓</span>`;
    }

    li.innerHTML = `${badge}<span class="history-time">${time}</span>`;
    historyList.prepend(li);

    while (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild);
    }
}

// ── CONFETTI ──
function launchConfetti() {
    const colors = ["#7c3aed","#60a5fa","#f97316","#facc15","#a855f7","#34d399"];
    const container = document.getElementById("confettiContainer");

    for (let i = 0; i < 55; i++) {
        const el = document.createElement("div");
        el.className = "confetti-piece";
        el.style.cssText = `
            left: ${Math.random() * 100}vw;
            top: -10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            animation-duration: ${1 + Math.random() * 2}s;
            animation-delay: ${Math.random() * 0.6}s;
            transform: rotate(${Math.random() * 360}deg);
            width: ${6 + Math.random() * 6}px;
            height: ${6 + Math.random() * 6}px;
        `;
        container.appendChild(el);
        setTimeout(() => el.remove(), 3500);
    }
}