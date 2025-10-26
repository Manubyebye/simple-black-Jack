document.addEventListener('DOMContentLoaded', () => {

    // DOM Elements
    const bankrollDisplay = document.getElementById('bankroll');
    const currentBetDisplay = document.getElementById('current-bet');
    const dealerScoreDisplay = document.getElementById('dealer-score');
    const playerScoreDisplay = document.getElementById('player-score');
    const dealerHandDisplay = document.getElementById('dealer-hand');
    const playerHandDisplay = document.getElementById('player-hand');
    const messageOverlay = document.getElementById('message-overlay');
    const messageText = document.getElementById('message-text');
    const betAmountInput = document.getElementById('bet-amount');
    const betButton = document.getElementById('bet-button');
    const hitButton = document.getElementById('hit-button');
    const standButton = document.getElementById('stand-button');
    const playAgainButton = document.getElementById('play-again-button');
    const bettingControls = document.getElementById('betting-controls');
    const actionControls = document.getElementById('action-controls');

    // Audio Elements
    const backgroundMusic = new Audio('sounds/background-music.mp3');
    const dealSound = new Audio('sounds/card-deal.wav');
    const betSound = new Audio('sounds/chip-bet.wav');
    const winSound = new Audio('sounds/win.wav');
    const loseSound = new Audio('sounds/lose.wav');

    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.3;

    // Game Variables
    const suits = ['♥', '♦', '♣', '♠'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];
    let playerHand = [];
    let dealerHand = [];
    let playerScore = 0;
    let dealerScore = 0;
    let bankroll = 1000;
    let currentBet = 0;
    let gameOver = false;
    let musicStarted = false;

    // --- Core Game Functions ---

    function createDeck() {
        deck = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({ suit, rank, value: getCardValue(rank) });
            }
        }
    }

    function shuffleDeck() {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    function getCardValue(rank) {
        if (['J', 'Q', 'K'].includes(rank)) return 10;
        if (rank === 'A') return 11;
        return parseInt(rank);
    }

    function calculateScore(hand) {
        let score = 0;
        let aceCount = 0;
        hand.forEach(card => {
            score += card.value;
            if (card.rank === 'A') {
                aceCount++;
            }
        });
        while (score > 21 && aceCount > 0) {
            score -= 10;
            aceCount--;
        }
        return score;
    }

    function dealCard(hand, display, isHidden = false, dealDelay = 0) {
        if (deck.length === 0) return;
        
        setTimeout(() => {
            dealSound.currentTime = 0;
            dealSound.play();
            
            const card = deck.pop();
            // ** THIS IS THE FIX -> Add the isHidden property to the card's data **
            card.isHidden = isHidden; 
            hand.push(card);
            
            const cardElement = createCardElement(card, isHidden);
            display.appendChild(cardElement);

            setTimeout(() => cardElement.classList.add('visible'), 50);
            
            updateScores();

        }, dealDelay);
    }

    function createCardElement(card, isHidden) {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        if (isHidden) {
            cardElement.classList.add('hidden');
        } else {
            const colorClass = ['♥', '♦'].includes(card.suit) ? 'red' : 'black';
            cardElement.classList.add(colorClass);
            cardElement.innerHTML = `
                <span class="suit top">${card.suit}</span>
                <span class="rank">${card.rank}</span>
                <span class="suit bottom">${card.suit}</span>
            `;
        }
        return cardElement;
    }
    
    // --- UI Update Functions ---

    function updateScores() {
        playerScore = calculateScore(playerHand);
        let dealerVisibleHand = dealerHand.filter(card => !card.isHidden);
        dealerScore = calculateScore(dealerVisibleHand);

        playerScoreDisplay.textContent = playerScore;
        dealerScoreDisplay.textContent = dealerScore;
    }

    function updateBankrollDisplay() {
        bankrollDisplay.textContent = bankroll;
        currentBetDisplay.textContent = currentBet;
    }
    
    function showMessage(msg, showPlayAgain = true) {
        messageText.textContent = msg;
        messageOverlay.classList.remove('hidden');
        if (showPlayAgain) {
            playAgainButton.classList.remove('hidden');
        } else {
            playAgainButton.classList.add('hidden');
        }
    }

    // --- Game Flow Functions ---

    function startGame() {
        gameOver = false;
        createDeck();
        shuffleDeck();
        playerHand = [];
        dealerHand = [];
        
        playerHandDisplay.innerHTML = '';
        dealerHandDisplay.innerHTML = '';
        messageOverlay.classList.add('hidden');

        let dealDelay = 0;
        dealCard(playerHand, playerHandDisplay, false, dealDelay);
        dealDelay += 300;
        dealCard(dealerHand, dealerHandDisplay, false, dealDelay);
        dealDelay += 300;
        dealCard(playerHand, playerHandDisplay, false, dealDelay);
        dealDelay += 300;
        dealCard(dealerHand, dealerHandDisplay, true, dealDelay);

        setTimeout(() => {
             if (calculateScore(playerHand) === 21) {
                winSound.play();
                endGame("Blackjack! You win!");
                bankroll += currentBet * 2.5;
            }
        }, dealDelay + 300);
    }

    function playerHit() {
        if (gameOver) return;
        dealCard(playerHand, playerHandDisplay);
        
        setTimeout(() => {
            if (calculateScore(playerHand) > 21) {
                loseSound.play();
                endGame("Bust! You lose.");
            }
        }, 400); // Increased delay slightly
    }

    function playerStand() {
        if (gameOver) return;
        gameOver = true;
        revealDealerCard();
    }

    function revealDealerCard() {
        const hiddenCardData = dealerHand.find(card => card.isHidden);
        const hiddenCardElement = dealerHandDisplay.querySelector('.hidden');
        
        if (hiddenCardData) {
            hiddenCardData.isHidden = false;
        }

        if (hiddenCardElement) {
            hiddenCardElement.style.transform = 'rotateY(180deg)';
            setTimeout(() => {
                const realCard = hiddenCardData;
                hiddenCardElement.classList.remove('hidden');
                const colorClass = ['♥', '♦'].includes(realCard.suit) ? 'red' : 'black';
                hiddenCardElement.classList.add(colorClass);
                hiddenCardElement.innerHTML = `
                    <span class="suit top">${realCard.suit}</span>
                    <span class="rank">${realCard.rank}</span>
                    <span class="suit bottom">${realCard.suit}</span>
                `;
                hiddenCardElement.style.transform = 'rotateY(0deg)';
                
                dealerScoreDisplay.textContent = calculateScore(dealerHand);
                setTimeout(dealerTurn, 800);
            }, 300);
        } else {
            setTimeout(dealerTurn, 800);
        }
    }
    
    function dealerTurn() {
        let fullDealerScore = calculateScore(dealerHand);
        if (fullDealerScore >= 17) {
            determineWinner();
            return;
        }

        const dealerInterval = setInterval(() => {
            fullDealerScore = calculateScore(dealerHand);
            if (fullDealerScore < 17) {
                dealCard(dealerHand, dealerHandDisplay);
                dealerScoreDisplay.textContent = calculateScore(dealerHand); // Update score after each hit
            } else {
                clearInterval(dealerInterval);
                determineWinner();
            }
        }, 1000);
    }
    
    function determineWinner() {
        let finalPlayerScore = calculateScore(playerHand);
        let finalDealerScore = calculateScore(dealerHand);
        
        dealerScoreDisplay.textContent = finalDealerScore;

        if (finalDealerScore > 21 || (finalPlayerScore <= 21 && finalPlayerScore > finalDealerScore)) {
            winSound.play();
            endGame("You win!");
            bankroll += currentBet * 2;
        } else if (finalDealerScore > finalPlayerScore) {
            loseSound.play();
            endGame("Dealer wins!");
        } else {
            endGame("Push (It's a tie)!");
            bankroll += currentBet;
        }
    }

    function endGame(message) {
        gameOver = true;
        showMessage(message);
        actionControls.classList.add('hidden');
    }

    function resetForNewRound() {
        currentBet = 0;
        updateBankrollDisplay();
        bettingControls.classList.remove('hidden');
        actionControls.classList.add('hidden');
        messageOverlay.classList.add('hidden');
        playerHandDisplay.innerHTML = '';
        dealerHandDisplay.innerHTML = '';
        playerScoreDisplay.textContent = '0';
        dealerScoreDisplay.textContent = '0';
        
        if (bankroll < 10) {
            showMessage("You're out of money! Restarting.", false);
            setTimeout(() => {
                bankroll = 1000;
                updateBankrollDisplay();
                messageOverlay.classList.add('hidden');
            }, 3000);
        }
    }


    // --- Event Listeners ---
    betButton.addEventListener('click', () => {
        if (!musicStarted) {
            backgroundMusic.play().catch(e => console.log("Browser prevented autoplay. Click again."));
            musicStarted = true;
        }

        betSound.play();
        const betValue = parseInt(betAmountInput.value);
        if (betValue > 0 && betValue <= bankroll) {
            currentBet = betValue;
            bankroll -= currentBet;
            updateBankrollDisplay();
            bettingControls.classList.add('hidden');
            actionControls.classList.remove('hidden');
            startGame();
        } else {
            alert("Invalid bet amount!");
        }
    });

    hitButton.addEventListener('click', playerHit);
    standButton.addEventListener('click', playerStand);
    playAgainButton.addEventListener('click', resetForNewRound);

    // Initial setup
    updateBankrollDisplay();
});