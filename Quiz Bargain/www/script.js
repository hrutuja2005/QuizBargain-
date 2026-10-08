/* =========================================================
   QUIZBARGAIN
   Complete Game Logic
========================================================= */


/* =========================================================
   GAME SETTINGS
========================================================= */

const TOTAL_ROUNDS = 10;
const STARTING_COINS = 100;
const QUESTION_TIME = 30;


/* =========================================================
   GAME STATE
========================================================= */

let players = [];

let currentPlayerIndex = 0;
let currentQuestionIndex = 0;
let currentRound = 1;

let selectedOption = null;

let currentOffer = 0;
let currentBuyerIndex = null;
let currentSellerIndex = null;

let timerInterval = null;
let timeLeft = QUESTION_TIME;

let soundEnabled = true;
let audioContext = null;

let answerSubmitted = false;


/* =========================================================
   SCREEN MANAGEMENT
========================================================= */

function showScreen(screenId) {

    const screens = document.querySelectorAll(".screen");

    screens.forEach(screen => {
        screen.classList.remove("active");
    });

    const target = document.getElementById(screenId);

    if (target) {
        target.classList.add("active");
    }

    window.scrollTo(0, 0);
}


/* =========================================================
   PLAYER SETUP
========================================================= */

function showPlayerSetup() {

    showScreen("playerSetup");

    const inputs = [
        document.getElementById("player1"),
        document.getElementById("player2"),
        document.getElementById("player3"),
        document.getElementById("player4")
    ];

    inputs.forEach(input => {
        if (input) {
            input.value = "";
        }
    });
}


/* =========================================================
   START GAME
========================================================= */

function startGame() {

    const names = [
        document.getElementById("player1").value.trim(),
        document.getElementById("player2").value.trim(),
        document.getElementById("player3").value.trim(),
        document.getElementById("player4").value.trim()
    ];

    if (!names[0] || !names[1]) {

        alert("Please enter names for at least 2 players.");

        return;
    }


    players = names
        .filter(name => name !== "")
        .map(name => ({
            name: name,

            coins: STARTING_COINS,

            score: 0,

            correct: 0,

            hintsBought: 0,

            hintsSold: 0,

            streak: 0,

            hintUsedThisQuestion: false
        }));


    currentPlayerIndex = 0;
    currentQuestionIndex = 0;
    currentRound = 1;

    selectedOption = null;

    currentOffer = 0;
    currentBuyerIndex = null;
    currentSellerIndex = null;


    if (typeof questions !== "undefined") {

        questions.forEach(question => {
            delete question.removedOptions;
        });

    }


    showScreen("gameScreen");

    initAudio();

    startGameCountdown();
}


/* =========================================================
   GAME START COUNTDOWN
========================================================= */

function startGameCountdown() {

    clearInterval(timerInterval);

    const overlay =
        document.getElementById("countdownOverlay");

    const countdownText =
        document.getElementById("countdownText");

    if (!overlay || !countdownText) {

        loadQuestion();

        return;
    }


    overlay.classList.add("active");


    let count = 3;

    countdownText.textContent = count;

    playCountdownSound();


    const interval = setInterval(() => {

        count--;


        if (count > 0) {

            countdownText.textContent = count;

            countdownText.style.animation = "none";

            void countdownText.offsetWidth;

            countdownText.style.animation =
                "countdownPop 0.8s ease";

            playCountdownSound();

        }


        else {

            countdownText.textContent = "GO!";

            countdownText.style.animation = "none";

            void countdownText.offsetWidth;

            countdownText.style.animation =
                "countdownPop 0.8s ease";

            playGoSound();


            clearInterval(interval);


            setTimeout(() => {

                overlay.classList.remove("active");

                loadQuestion();

            }, 700);

        }

    }, 1000);
}


/* =========================================================
   LOAD QUESTION
========================================================= */

function loadQuestion() {

    clearInterval(timerInterval);
    answerSubmitted = false;
    document.getElementById("submitAnswerBtn").disabled = false;


    if (
        typeof questions === "undefined" ||
        questions.length === 0
    ) {

        alert("No questions found.");

        return;
    }


    const question =
        questions[currentQuestionIndex];


    const player =
        players[currentPlayerIndex];


    if (!player || !question) {
        return;
    }


    /* Reset question state */

    selectedOption = null;

    player.hintUsedThisQuestion = false;


    /* Reset removed options for this question */

    if (!question.removedOptions) {
        question.removedOptions = [];
    }


    /* Question text */

    const questionText =
        document.getElementById("questionText");

    if (questionText) {
        questionText.textContent = question.question;
    }


    /* Difficulty */

    const difficulty =
        document.getElementById("questionDifficulty");

    if (difficulty) {
        difficulty.textContent =
            question.difficulty.toUpperCase();
    }


    /* Reward */

    const reward =
        document.getElementById("questionReward");

    if (reward) {
        reward.textContent = question.value;
    }


    /* Current player */

    const currentPlayerDisplay =
        document.getElementById("currentPlayerDisplay");

    if (currentPlayerDisplay) {
        currentPlayerDisplay.textContent =
            player.name;
    }


    /* Options */

    const optionsContainer =
        document.getElementById("options");

    if (optionsContainer) {

        optionsContainer.innerHTML = "";


        question.options.forEach((option, index) => {

            const button =
                document.createElement("button");

            button.className = "option-btn";

            button.textContent =
                `${String.fromCharCode(65 + index)}. ${option}`;


            button.onclick = () => {
                selectOption(index);
            };


            if (
                question.removedOptions &&
                question.removedOptions.includes(index)
            ) {

                button.classList.add("removed-option");

                button.disabled = true;
            }


            optionsContainer.appendChild(button);

        });

    }


    /* Feedback */

    const feedback =
        document.getElementById("feedbackMessage");

    if (feedback) {

        feedback.textContent = "";

        feedback.className =
            "feedback-message";
    }


    /* Update UI */

    updateRoundUI();

    updatePlayerCards();


    /* Animate question */

    animateQuestion();


    /* Start timer */

    startTimer();
}


/* =========================================================
   TIMER
========================================================= */

function startTimer() {

    clearInterval(timerInterval);


    timeLeft = QUESTION_TIME;


    const timerElement =
        document.getElementById("timer");


    if (!timerElement) {
        return;
    }


    timerElement.textContent =
        timeLeft;

    timerElement.classList.remove("warning");


    timerInterval = setInterval(() => {

        timeLeft--;


        timerElement.textContent =
            timeLeft;


        if (timeLeft <= 10) {

            timerElement.classList.add("warning");

        }


        if (timeLeft <= 0) {

            clearInterval(timerInterval);

            timeUp();

        }

    }, 1000);
}


/* =========================================================
   TIME UP
========================================================= */

function timeUp() {

    clearInterval(timerInterval);


    const player =
        players[currentPlayerIndex];


    if (!player) {
        return;
    }


    player.coins =
        Math.max(0, player.coins - 10);

    player.streak = 0;


    playTimeUpSound();


    showFeedback(
        "⏰ Time's up! -10 coins",
        "wrong"
    );


    showCoinChange(-10);

    updatePlayerCards();


    setTimeout(() => {

        nextTurn();

    }, 1200);
}


/* =========================================================
   SELECT OPTION
========================================================= */

function selectOption(index) {

    const question =
        questions[currentQuestionIndex];


    if (
        question.removedOptions &&
        question.removedOptions.includes(index)
    ) {

        return;
    }


    selectedOption = index;


    const buttons =
        document.querySelectorAll(".option-btn");


    buttons.forEach((button, i) => {

        button.classList.remove("selected");

        if (i === index) {
            button.classList.add("selected");
        }

    });
}


/* =========================================================
   SUBMIT ANSWER
========================================================= */

function submitAnswer() {
    if (answerSubmitted) return;

    answerSubmitted = true;
    document.getElementById("submitAnswerBtn").disabled = true;

    if (selectedOption === null) {

        showFeedback(
            "Please select an answer first.",
            "wrong"
        );

        return;
    }


    clearInterval(timerInterval);


    const question =
        questions[currentQuestionIndex];


    const player =
        players[currentPlayerIndex];


    const buttons =
        document.querySelectorAll(".option-btn");


    buttons.forEach(button => {
        button.disabled = true;
    });


    const correctIndex =
        question.answer;


    /* Correct answer */

    if (selectedOption === correctIndex) {

        buttons[selectedOption]
            ?.classList.add("correct");


        player.coins += question.value;

        player.score += question.value;

        player.correct++;

        player.streak++;


        playCorrectSound();


        showFeedback(
            `✓ Correct! +${question.value} coins`,
            "correct"
        );


        showCoinChange(
            question.value
        );


        /* Streak bonus */

        if (player.streak >= 3) {

            player.coins += 10;

            player.score += 10;


            showFeedback(
                `🔥 ${player.streak} streak! +10 bonus`,
                "correct"
            );


            showCoinChange(10);

        }

    }


    /* Wrong answer */

    else {

        buttons[selectedOption]
            ?.classList.add("wrong");


        buttons[correctIndex]
            ?.classList.add("correct");


        player.coins =
            Math.max(0, player.coins - 10);


        player.streak = 0;


        playWrongSound();


        showFeedback(
            `✕ Wrong! -10 coins`,
            "wrong"
        );


        showCoinChange(-10);

    }


    updatePlayerCards();


    setTimeout(() => {

        nextTurn();

    }, 1500);
}


/* =========================================================
   NEXT TURN
========================================================= */

function nextTurn() {

    clearInterval(timerInterval);


    currentPlayerIndex++;


    /* End of player cycle */

    if (
        currentPlayerIndex >= players.length
    ) {

        currentPlayerIndex = 0;

        currentRound++;


        /* End game */

        if (currentRound > TOTAL_ROUNDS) {

            showLeaderboard();

            return;
        }


        /* Round bonus */

        players.forEach(player => {

            if (player.coins >= 100) {

                player.score += 5;

            }

        });

    }


    /* Move to next question */

    currentQuestionIndex++;

    if (
        currentQuestionIndex >= questions.length
    ) {

        currentQuestionIndex = 0;

    }


    loadQuestion();
}


/* =========================================================
   ROUND UI
========================================================= */

function updateRoundUI() {

    const roundDisplay =
        document.getElementById("roundDisplay");


    if (roundDisplay) {

        roundDisplay.textContent =
            `${Math.min(currentRound, TOTAL_ROUNDS)} / ${TOTAL_ROUNDS}`;

    }


    const progress =
        Math.min(
            currentRound / TOTAL_ROUNDS * 100,
            100
        );


    const progressBar =
        document.getElementById("roundProgressBar");


    if (progressBar) {

        progressBar.style.width =
            `${progress}%`;

    }
}


/* =========================================================
   PLAYER CARDS
========================================================= */

function updatePlayerCards() {

    const container =
        document.getElementById("playerCards");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    players.forEach((player, index) => {

        const card =
            document.createElement("div");


        card.className =
            "player-card";


        if (index === currentPlayerIndex) {

            card.classList.add("active");

        }


        card.innerHTML = `

            <span class="player-card-name">
                ${escapeHTML(player.name)}
            </span>

            <div class="player-card-coins">
                🪙 ${player.coins}
            </div>

            <div class="player-card-score">
                Score: ${player.score}
            </div>

        `;


        container.appendChild(card);

    });
}


/* =========================================================
   OPEN TRADE PANEL
========================================================= */

function openTradePanel() {

    const player =
        players[currentPlayerIndex];


    if (!player) {
        return;
    }


    if (player.hintUsedThisQuestion) {

        alert(
            "You have already bought a hint for this question."
        );

        startTimer();

        return;
    }


    clearInterval(timerInterval);


    showScreen("tradeScreen");


    const buyerName =
        document.getElementById("tradeBuyerName");


    const buyerCoins =
        document.getElementById("tradeBuyerCoins");


    if (buyerName) {
        buyerName.textContent =
            player.name;
    }


    if (buyerCoins) {
        buyerCoins.textContent =
            player.coins;
    }


    /* Suggested price */

    const question =
        questions[currentQuestionIndex];


    let suggestedPrice = 15;


    if (question.difficulty === "Medium") {
        suggestedPrice = 25;
    }

    if (question.difficulty === "Hard") {
        suggestedPrice = 40;
    }


    const suggested =
        document.getElementById("suggestedPrice");


    if (suggested) {
        suggested.textContent =
            suggestedPrice;
    }


    const offerInput =
        document.getElementById("offerPrice");


    if (offerInput) {

        offerInput.value =
            suggestedPrice;

        offerInput.max =
            player.coins;

    }


    /* Seller list */

    const sellerSelect =
        document.getElementById("sellerSelect");


    if (sellerSelect) {

        sellerSelect.innerHTML = "";


        players.forEach((seller, index) => {

            if (index === currentPlayerIndex) {
                return;
            }


            const option =
                document.createElement("option");


            option.value = index;

            option.textContent =
                `${seller.name} — 🪙 ${seller.coins}`;


            sellerSelect.appendChild(option);

        });

    }
}


/* =========================================================
   CLOSE TRADE PANEL
========================================================= */

function closeTradePanel() {

    showScreen("gameScreen");

    startTimer();
}


/* =========================================================
   MAKE OFFER
========================================================= */

function makeOffer() {

    const sellerSelect =
        document.getElementById("sellerSelect");


    const offerInput =
        document.getElementById("offerPrice");


    if (!sellerSelect || !offerInput) {
        return;
    }


    currentSellerIndex =
        parseInt(sellerSelect.value);


    currentBuyerIndex =
        currentPlayerIndex;


    currentOffer =
        parseInt(offerInput.value);


    const buyer =
        players[currentBuyerIndex];


    const seller =
        players[currentSellerIndex];


    if (!seller) {

        alert("Please select a seller.");

        return;
    }


    if (
        isNaN(currentOffer) ||
        currentOffer <= 0
    ) {

        alert("Enter a valid offer.");

        return;
    }


    if (
        currentOffer > buyer.coins
    ) {

        alert(
            "You don't have enough coins."
        );

        return;
    }


    showScreen("negotiationScreen");


    const buyerName =
        document.getElementById("negotiationBuyer");


    const sellerName =
        document.getElementById("negotiationSeller");


    const offerDisplay =
        document.getElementById("negotiationOffer");


    const negotiationText =
        document.getElementById("negotiationText");


    if (buyerName) {
        buyerName.textContent =
            buyer.name;
    }


    if (sellerName) {
        sellerName.textContent =
            seller.name;
    }


    if (offerDisplay) {
        offerDisplay.textContent =
            currentOffer;
    }


    if (negotiationText) {

        negotiationText.textContent =
            `${buyer.name} offered ${currentOffer} coins for your hint.`;

    }
}


/* =========================================================
   ACCEPT OFFER
========================================================= */

function acceptOffer() {

    completeTrade(currentOffer);
}


/* =========================================================
   SHOW COUNTER OFFER
========================================================= */

function showCounterOffer() {

    const originalOffer =
        document.getElementById("originalOffer");


    if (originalOffer) {

        originalOffer.textContent =
            currentOffer;

    }


    const counterInput =
        document.getElementById("counterPrice");


    if (counterInput) {

        counterInput.value =
            currentOffer + 5;

    }


    showScreen("counterOfferScreen");
}


/* =========================================================
   SUBMIT COUNTER OFFER
========================================================= */

function submitCounterOffer() {

    const input =
        document.getElementById("counterPrice");


    if (!input) {
        return;
    }


    const counterPrice =
        parseInt(input.value);


    const buyer =
        players[currentBuyerIndex];


    if (
        isNaN(counterPrice) ||
        counterPrice <= 0
    ) {

        alert(
            "Enter a valid counter price."
        );

        return;
    }


    if (counterPrice > buyer.coins) {

        alert(
            "The buyer cannot afford this price."
        );

        return;
    }


    /*
        Simple MVP negotiation:
        Counter offer is automatically accepted.
    */

    completeTrade(counterPrice);
}


/* =========================================================
   REJECT OFFER
========================================================= */

function rejectOffer() {

    showScreen("gameScreen");

    startTimer();
}


/* =========================================================
   COMPLETE TRADE
========================================================= */

function completeTrade(price) {

    const buyer =
        players[currentBuyerIndex];


    const seller =
        players[currentSellerIndex];


    const question =
        questions[currentQuestionIndex];


    if (!buyer || !seller) {
        return;
    }


    if (price > buyer.coins) {

        alert(
            "Buyer does not have enough coins."
        );

        return;
    }


    /* Transfer coins */

    buyer.coins -= price;

    seller.coins += price;


    /* Rewards */

    buyer.hintsBought++;

    seller.hintsSold++;


    buyer.score += 10;

    seller.score += 5;


    buyer.hintUsedThisQuestion = true;


    /* Generate hint */

    applyHint(question);


    playCoinSound();


    /* Update result screen */

    const resultText =
        document.getElementById("tradeResultText");


    if (resultText) {

        resultText.textContent =
            `${buyer.name} bought a hint from ${seller.name} for ${price} coins.`;

    }


    const hintText =
        document.getElementById("hintText");


    if (hintText) {

        hintText.textContent =
            question.hint;

    }


    showScreen("tradeResultScreen");
}


/* =========================================================
   APPLY HINT
========================================================= */

function applyHint(question) {

    if (!question.removedOptions) {

        question.removedOptions = [];

    }


    const wrongOptions = [];


    question.options.forEach((option, index) => {

        if (index !== question.answer) {

            wrongOptions.push(index);

        }

    });


    /* Shuffle wrong answers */

    wrongOptions.sort(() => Math.random() - 0.5);


    /* Remove 2 wrong options */

    question.removedOptions =
        wrongOptions.slice(0, 2);
}


/* =========================================================
   RETURN TO QUESTION
========================================================= */

function returnToQuestion() {

    showScreen("gameScreen");


    loadQuestion();
}


/* =========================================================
   LEADERBOARD
========================================================= */

function showLeaderboard() {

    clearInterval(timerInterval);


    const leaderboard =
        document.getElementById("leaderboard");


    if (!leaderboard) {
        return;
    }


    const results =
        players.map(player => {

            const finalScore =
                player.score +
                Math.floor(player.coins / 10);


            return {
                ...player,
                finalScore: finalScore
            };

        });


    results.sort(
        (a, b) =>
            b.finalScore - a.finalScore
    );


    leaderboard.innerHTML = "";


    results.forEach((player, index) => {

        const item =
            document.createElement("div");


        item.className =
            "leaderboard-item";


        let medal = "";

        if (index === 0) medal = "🥇";
        else if (index === 1) medal = "🥈";
        else if (index === 2) medal = "🥉";


        item.innerHTML = `

            <div class="leaderboard-rank">
                ${medal || index + 1}
            </div>

            <div class="leaderboard-name">

                <strong>
                    ${escapeHTML(player.name)}
                </strong>

                <small>
                    ✓ ${player.correct}
                    &nbsp;|&nbsp;
                    💡 Bought ${player.hintsBought}
                    &nbsp;|&nbsp;
                    💰 Sold ${player.hintsSold}
                </small>

            </div>

            <div class="leaderboard-score">

                <strong>
                    ${player.finalScore}
                </strong>

                <small>
                    🪙 ${player.coins}
                </small>

            </div>

        `;


        leaderboard.appendChild(item);

    });


    playVictorySound();


    showScreen("leaderboardScreen");
}


/* =========================================================
   RESTART GAME
========================================================= */

function restartGame() {

    clearInterval(timerInterval);


    players = [];

    currentPlayerIndex = 0;

    currentQuestionIndex = 0;

    currentRound = 1;

    selectedOption = null;

    currentOffer = 0;

    currentBuyerIndex = null;

    currentSellerIndex = null;


    if (typeof questions !== "undefined") {

        questions.forEach(question => {

            delete question.removedOptions;

        });

    }


    showPlayerSetup();
}


/* =========================================================
   FEEDBACK
========================================================= */

function showFeedback(message, type) {

    const feedback =
        document.getElementById("feedbackMessage");


    if (!feedback) {
        return;
    }


    feedback.textContent =
        message;


    feedback.className =
        `feedback-message show ${type}`;
}


/* =========================================================
   COIN CHANGE ANIMATION
========================================================= */

function showCoinChange(amount) {

    const card =
        document.getElementById("questionCard");


    if (!card) {
        return;
    }


    const popup =
        document.createElement("div");


    popup.className =
        "coin-change";


    popup.textContent =
        amount >= 0
            ? `+${amount} 🪙`
            : `${amount} 🪙`;


    card.appendChild(popup);


    setTimeout(() => {

        popup.remove();

    }, 1000);
}


/* =========================================================
   QUESTION ANIMATION
========================================================= */

function animateQuestion() {

    const card =
        document.getElementById("questionCard");


    if (!card) {
        return;
    }


    card.classList.remove("question-enter");


    void card.offsetWidth;


    card.classList.add("question-enter");
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(text) {

    const div =
        document.createElement("div");


    div.textContent =
        text;


    return div.innerHTML;
}


/* =========================================================
   AUDIO ENGINE
========================================================= */

function initAudio() {

    if (!soundEnabled) {
        return;
    }


    try {

        if (!audioContext) {

            const AudioContext =
                window.AudioContext ||
                window.webkitAudioContext;


            if (!AudioContext) {
                return;
            }


            audioContext =
                new AudioContext();

        }


        if (
            audioContext.state === "suspended"
        ) {

            audioContext.resume();

        }

    } catch (error) {

        console.log(
            "Audio unavailable:",
            error
        );

    }
}


/* =========================================================
   PLAY TONE
========================================================= */

function playTone(
    frequency,
    duration,
    type = "sine",
    volume = 0.08
) {

    if (!soundEnabled) {
        return;
    }


    try {

        initAudio();


        if (!audioContext) {
            return;
        }


        const oscillator =
            audioContext.createOscillator();


        const gain =
            audioContext.createGain();


        oscillator.type =
            type;


        oscillator.frequency.value =
            frequency;


        gain.gain.setValueAtTime(
            volume,
            audioContext.currentTime
        );


        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + duration
        );


        oscillator.connect(gain);

        gain.connect(
            audioContext.destination
        );


        oscillator.start();


        oscillator.stop(
            audioContext.currentTime + duration
        );

    } catch (error) {

        console.log(
            "Sound error:",
            error
        );

    }
}


/* =========================================================
   COUNTDOWN SOUND
========================================================= */

function playCountdownSound() {

    playTone(
        500,
        0.15,
        "square",
        0.05
    );
}


/* =========================================================
   GO SOUND
========================================================= */

function playGoSound() {

    playTone(
        800,
        0.15,
        "square",
        0.06
    );


    setTimeout(() => {

        playTone(
            1100,
            0.25,
            "square",
            0.06
        );

    }, 120);
}


/* =========================================================
   CORRECT SOUND
========================================================= */

function playCorrectSound() {

    playTone(
        650,
        0.12,
        "sine",
        0.06
    );


    setTimeout(() => {

        playTone(
            850,
            0.18,
            "sine",
            0.06
        );

    }, 100);
}


/* =========================================================
   WRONG SOUND
========================================================= */

function playWrongSound() {

    playTone(
        220,
        0.25,
        "sawtooth",
        0.045
    );


    setTimeout(() => {

        playTone(
            160,
            0.3,
            "sawtooth",
            0.035
        );

    }, 100);
}


/* =========================================================
   COIN SOUND
========================================================= */

function playCoinSound() {

    playTone(
        900,
        0.08,
        "triangle",
        0.05
    );


    setTimeout(() => {

        playTone(
            1200,
            0.15,
            "triangle",
            0.05
        );

    }, 80);
}


/* =========================================================
   TIME UP SOUND
========================================================= */

function playTimeUpSound() {

    playTone(
        300,
        0.18,
        "square",
        0.05
    );


    setTimeout(() => {

        playTone(
            220,
            0.25,
            "square",
            0.05
        );

    }, 150);
}


/* =========================================================
   VICTORY SOUND
========================================================= */

function playVictorySound() {

    playTone(
        600,
        0.12,
        "triangle",
        0.05
    );


    setTimeout(() => {

        playTone(
            750,
            0.12,
            "triangle",
            0.05
        );

    }, 130);


    setTimeout(() => {

        playTone(
            950,
            0.25,
            "triangle",
            0.06
        );

    }, 260);
}


/* =========================================================
   SOUND TOGGLE
========================================================= */

function toggleSound() {

    soundEnabled =
        !soundEnabled;


    const button =
        document.getElementById("soundToggle");


    if (button) {

        button.textContent =
            soundEnabled
                ? "🔊 SOUND ON"
                : "🔇 SOUND OFF";

    }


    if (soundEnabled) {

        initAudio();

        playTone(
            700,
            0.12,
            "sine",
            0.05
        );

    }
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        showScreen("mainMenu");


        const soundToggle =
            document.getElementById("soundToggle");


        if (soundToggle) {

            soundToggle.textContent =
                soundEnabled
                    ? "🔊 SOUND ON"
                    : "🔇 SOUND OFF";

        }

    }
);