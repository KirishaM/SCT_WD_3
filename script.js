const cells = document.querySelectorAll(".cell");
const statusText = document.getElementById("status");
const gameMode = document.getElementById("gameMode");
const difficulty = document.getElementById("difficulty");

const xScoreEl = document.getElementById("xScore");
const oScoreEl = document.getElementById("oScore");
const drawScoreEl = document.getElementById("drawScore");

const timerEl = document.getElementById("timer");
const historyList = document.getElementById("historyList");

const newGameBtn = document.getElementById("newGame");
const resetScoresBtn = document.getElementById("resetScores");

const themeBtn = document.getElementById("themeBtn");

const winnerModal =
document.getElementById("winnerModal");

const winnerText =
document.getElementById("winnerText");

const closeModal =
document.getElementById("closeModal");

let board =
["","","","","","","","",""];

let currentPlayer = "X";

let gameActive = true;

let xScore = 0;
let oScore = 0;
let drawScore = 0;

let timer = 10;
let timerInterval;

const winPatterns = [

    [0,1,2],
    [3,4,5],
    [6,7,8],

    [0,3,6],
    [1,4,7],
    [2,5,8],

    [0,4,8],
    [2,4,6]
];

startTimer();

cells.forEach(cell => {

    cell.addEventListener(
        "click",
        handleCellClick
    );

});

newGameBtn.addEventListener(
    "click",
    resetBoard
);

resetScoresBtn.addEventListener(
    "click",
    resetScores
);

closeModal.addEventListener(
    "click",
    () => {

        winnerModal.style.display =
        "none";

        resetBoard();

    }
);

themeBtn.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "light-theme"
        );

    }
);

function handleCellClick(){

    const index =
    this.dataset.index;

    if(
        board[index] !== "" ||
        !gameActive
    ){
        return;
    }

    board[index] = currentPlayer;

    this.textContent =
    currentPlayer;

    if(checkWinner()){
        return;
    }

    if(checkDraw()){
        return;
    }

    switchPlayer();

    if(
        gameMode.value === "cpu" &&
        currentPlayer === "O"
    ){

        setTimeout(
            computerMove,
            500
        );

    }
}

function switchPlayer(){

    currentPlayer =
    currentPlayer === "X"
    ? "O"
    : "X";

    statusText.textContent =
    `Player ${currentPlayer}'s Turn`;

    resetTimer();
}

function computerMove(){

    if(!gameActive){
        return;
    }

    let move;

    if(
        difficulty.value === "hard"
    ){

        move =
        getBestMove();

    }else{

        const emptyCells =
        board
        .map(
            (cell,index)=>
            cell===""
            ? index
            : null
        )
        .filter(
            cell=>cell!==null
        );

        move =
        emptyCells[
            Math.floor(
                Math.random() *
                emptyCells.length
            )
        ];
    }

    board[move] = "O";

    cells[move].textContent =
    "O";

    if(checkWinner()){
        return;
    }

    if(checkDraw()){
        return;
    }

    switchPlayer();
}

function getBestMove(){

    for(
        let pattern
        of winPatterns
    ){

        let values =
        pattern.map(
            i => board[i]
        );

        if(
            values.filter(
                v => v==="O"
            ).length === 2 &&
            values.includes("")
        ){

            return pattern[
                values.indexOf("")
            ];
        }
    }

    for(
        let pattern
        of winPatterns
    ){

        let values =
        pattern.map(
            i => board[i]
        );

        if(
            values.filter(
                v => v==="X"
            ).length === 2 &&
            values.includes("")
        ){

            return pattern[
                values.indexOf("")
            ];
        }
    }

    if(board[4] === ""){
        return 4;
    }

    const empty =
    board
    .map(
        (v,i)=>
        v===""
        ? i
        : null
    )
    .filter(
        v=>v!==null
    );

    return empty[
        Math.floor(
            Math.random() *
            empty.length
        )
    ];
}

function checkWinner(){

    for(
        let pattern
        of winPatterns
    ){

        const
        [a,b,c] =
        pattern;

        if(

            board[a] &&
            board[a]===board[b] &&
            board[a]===board[c]

        ){

            cells[a]
            .classList.add("win");

            cells[b]
            .classList.add("win");

            cells[c]
            .classList.add("win");

            gameActive = false;

            clearInterval(
                timerInterval
            );

            if(
                board[a] === "X"
            ){

                xScore++;

                xScoreEl.textContent =
                xScore;

            }else{

                oScore++;

                oScoreEl.textContent =
                oScore;
            }

            addHistory(
                `🏆 Player ${board[a]} Won`
            );

            winnerText.textContent =
            `🎉 Player ${board[a]} Wins!`;

            winnerModal.style.display =
            "flex";

            return true;
        }
    }

    return false;
}

function checkDraw(){

    if(
        board.every(
            cell => cell!==""
        )
    ){

        gameActive = false;

        drawScore++;

        drawScoreEl.textContent =
        drawScore;

        addHistory(
            "🤝 Draw Match"
        );

        winnerText.textContent =
        "🤝 It's a Draw!";

        winnerModal.style.display =
        "flex";

        clearInterval(
            timerInterval
        );

        return true;
    }

    return false;
}

function resetBoard(){

    board =
    ["","","","","","","","",""];

    currentPlayer = "X";

    gameActive = true;

    statusText.textContent =
    "Player X's Turn";

    cells.forEach(cell=>{

        cell.textContent = "";

        cell.classList.remove(
            "win"
        );

    });

    resetTimer();
}

function resetScores(){

    xScore = 0;
    oScore = 0;
    drawScore = 0;

    xScoreEl.textContent = 0;
    oScoreEl.textContent = 0;
    drawScoreEl.textContent = 0;

    historyList.innerHTML = "";

    resetBoard();
}

function addHistory(text){

    const li =
    document.createElement("li");

    li.textContent = text;

    historyList.prepend(li);
}

function startTimer(){

    timerInterval =
    setInterval(()=>{

        timer--;

        timerEl.textContent =
        timer;

        if(timer <= 0){

            switchPlayer();
        }

    },1000);
}

function resetTimer(){

    clearInterval(
        timerInterval
    );

    timer = 10;

    timerEl.textContent =
    timer;

    startTimer();
}