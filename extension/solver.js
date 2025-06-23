
let boardContainer = null;
let validWords = null; // Initialize an empty set for valid words



function initialize() {
    // Fetch the valid words from the GitHub repository
    fetch('https://raw.githubusercontent.com/LOCKhart07/wordle-solver/main/valid-wordle-words.txt')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            validWords = new Set(
                data
                    .split('\n')
                    .map(word => word.trim().toUpperCase())
            );
        })
        .catch(error => {
            // Log error and possible CSP issue
            console.error("Error fetching data from GitHub:", error);
        });
}

function getBestGuess() {

    const guessesWithFeedback = getCurrentGuessesAndFeedback();
    if (guessesWithFeedback.length === 0) {
        updateBestGuessDiv("CRANE");
        return;
    }
    const possibleAnswers = getPossibleAnswers(guessesWithFeedback);

    updateBestGuessDiv(possibleAnswers[0] || "No valid guesses found");

}


function updateBestGuessDiv(bestGuess) {
    const bestGuessDiv = document.getElementById("best-guess-div");
    if (bestGuessDiv) {
        bestGuessDiv.textContent = `${bestGuess}`;
    } else {
        console.error("Best guess div not found. Please ensure it is created before displaying the best guess.");
    }
}

function getPossibleAnswers(guessesWithFeedback) {
    let possibleAnswers = validWords;

    // Track letter constraints per position and globally
    const greenPositions = Array(5).fill(null); // letter at position if green
    const yellowPositions = Array(5).fill(null).map(() => new Set()); // letters that can't be at position
    const minLetterCounts = {}; // minimum times a letter must appear
    const maxLetterCounts = {}; // maximum times a letter can appear

    // First pass: gather constraints
    for (const guess of guessesWithFeedback) {
        const letterCounts = {};
        const yellowCounts = {};
        const blackCounts = {};

        // Count occurrences and feedbacks
        for (let i = 0; i < guess.length; i++) {
            const [char, feedback] = guess[i];
            letterCounts[char] = (letterCounts[char] || 0) + 1;
            if (feedback === "G") {
                greenPositions[i] = char;
                minLetterCounts[char] = Math.max(minLetterCounts[char] || 0, letterCounts[char]);
            } else if (feedback === "Y") {
                yellowPositions[i].add(char);
                yellowCounts[char] = (yellowCounts[char] || 0) + 1;
                minLetterCounts[char] = Math.max(minLetterCounts[char] || 0, yellowCounts[char]);
            } else if (feedback === "B") {
                blackCounts[char] = (blackCounts[char] || 0) + 1;
            }
        }

        // Handle black logic for repeated letters
        for (const [char, count] of Object.entries(blackCounts)) {
            // If char also has green/yellow in this guess, set max count to min count seen
            if ((yellowCounts[char] || 0) + (guess.filter(([c, f]) => c === char && f === "G").length) > 0) {
                maxLetterCounts[char] = minLetterCounts[char] || 0;
            } else {
                // If only black, letter must not appear at all
                maxLetterCounts[char] = 0;
            }
        }
    }

    // Now filter possible answers
    possibleAnswers = new Set(Array.from(possibleAnswers).filter(word => {
        // Green check
        for (let i = 0; i < 5; i++) {
            if (greenPositions[i] && word[i] !== greenPositions[i]) return false;
        }
        // Yellow check
        for (let i = 0; i < 5; i++) {
            for (const char of yellowPositions[i]) {
                if (word[i] === char) return false;
            }
        }
        // Min/max letter count check
        const wordLetterCounts = {};
        for (const c of word) wordLetterCounts[c] = (wordLetterCounts[c] || 0) + 1;
        for (const [char, minCount] of Object.entries(minLetterCounts)) {
            if ((wordLetterCounts[char] || 0) < minCount) return false;
        }
        for (const [char, maxCount] of Object.entries(maxLetterCounts)) {
            if ((wordLetterCounts[char] || 0) > maxCount) return false;
        }
        return true;
    }));

    return Array.from(possibleAnswers);
}

function mapFeedbackStringToColor(feedback) {
    switch (feedback) {
        case "absent":
            return "B"; // Black
        case "present in another position":
            return "Y"; // Yellow
        case "correct":
            return "G"; // Green
        default:
            return "U"; // Default color for unknown feedback
    }
}

function getCurrentGuessesAndFeedback() {

    const guesses = [];

    const rows = document.getElementsByClassName("Row-module_row__pwpBq");

    for (const row of rows) {
        const guess = [];
        for (const tile of row.children) {
            const line = tile.firstElementChild.ariaLabel;
            const match = line.match(/letter,\s([A-Z]),\s(.+)$/);
            if (match) {
                const letter = match[1];
                const feedback = mapFeedbackStringToColor(match[2]);
                guess.push([letter, feedback]);
            }
        } if (guess.length === 0) {
            continue; // Skip empty rows
        }
        guesses.push(guess);

    }

    return guesses;
}


function constructCustomElements() {
    // Create a custom element for the button
    const getBestGuessButton = document.createElement("button");
    getBestGuessButton.textContent = "Get Best Guess";
    getBestGuessButton.id = "get-best-guess-btn";
    getBestGuessButton.style = "display: inline-flex; align-items: center; justify-content: center; padding: 10px 20px; font-size: 14px; color: #333; background: linear-gradient(to right, #fff, #e6e6e6); border: 1px solid #ccc; border-radius: 5px; box-shadow: inset 0 1px 0 #fff; cursor: pointer; position: relative; margin: 5px;";
    getBestGuessButton.addEventListener("click", () => getBestGuess());

    // Create a custom element for the best guess display
    const bestGuessDiv = document.createElement("div");
    bestGuessDiv.id = "best-guess-div";
    bestGuessDiv.style = "display: inline-flex; align-items: center; justify-content: center; padding: 10px 20px; font-size: 16px; color: #333; background: linear-gradient(to right, #fff, #e6e6e6); border: 1px solid #ccc; border-radius: 5px; box-shadow: inset 0 1px 0 #fff; position: relative; margin: 5px; width:2 px";
    bestGuessDiv.textContent = "Best guess will appear here.";
    bestGuessDiv.addEventListener("click", () => showAllPossibleGuesses());
    const customElementParentContainer = document.createElement("div");
    customElementParentContainer.id = "custom-element-container";
    customElementParentContainer.style = "display: flex; justify-content: center; align-items: center; flex-direction: row; margin-top: 10px; widht: 50px;";
    customElementParentContainer.appendChild(getBestGuessButton);
    customElementParentContainer.appendChild(bestGuessDiv);
    return customElementParentContainer;

}

function displayCustomElements() {
    const customElements = constructCustomElements();

    // Ensure the custom elements are displayed below the board, not side by side
    const board = boardContainer[0];
    // Insert the custom elements after the board container
    if (board.nextSibling) {
        board.parentNode.insertBefore(customElements, board.nextSibling);
    } else {
        board.parentNode.appendChild(customElements);
    }
}

function displayButton() {
    const getBestGuessButton = document.createElement("button");
    // getAllLinksButton.style = "border: 5px solid red;";
    getBestGuessButton.style = "display: inline-flex; align-items: center; justify-content: center; padding: 10px 20px; font-size: 14px; color: #333; background: linear-gradient(to right, #fff, #e6e6e6); border: 1px solid #ccc; border-radius: 5px; box-shadow: inset 0 1px 0 #fff; cursor: pointer; position: relative; margin: 5px;"
    // linksBox.style = "display: flex; justify-content: center; align-items: center;"
    getBestGuessButton.textContent = "Get Best Guess";
    getBestGuessButton.type = "submit";
    getBestGuessButton.id = "get-all-links-btn"
    getBestGuessButton.addEventListener("click", () => getBestGuess());

    // boardContainer[0].appendChild(getBestGuessButton);
    // Ensure the best guess div is displayed below the board, not side by side
    const board = boardContainer[0];
    // Insert the best guess div after the board container
    if (board.nextSibling) {
        board.parentNode.insertBefore(getBestGuessButton, board.nextSibling);
    } else {
        board.parentNode.appendChild(getBestGuessButton);
    }
}

function displayBestGuessDiv() {
    const bestGuessDiv = document.createElement("div");
    bestGuessDiv.style = "display: inline-flex; align-items: center; justify-content: center; padding: 10px 20px; font-size: 16px; color: #333; background: linear-gradient(to right, #fff, #e6e6e6); border: 1px solid #ccc; border-radius: 5px; box-shadow: inset 0 1px 0 #fff; position: relative; margin: 5px;";
    bestGuessDiv.id = "best-guess-div";
    bestGuessDiv.textContent = "Best guess will appear here.";

    // Ensure the best guess div is displayed below the board, not side by side
    const board = boardContainer[0];
    bestGuessDiv.addEventListener("click", () => showAllPossibleGuesses());
    // Insert the best guess div after the board container
    if (board.nextSibling) {
        board.parentNode.insertBefore(bestGuessDiv, board.nextSibling);
    } else {
        board.parentNode.appendChild(bestGuessDiv);
    }

}

function showAllPossibleGuesses() {
    const guessesWithFeedback = getCurrentGuessesAndFeedback();

    const possibleAnswers = getPossibleAnswers(guessesWithFeedback);

    let displayText = "Possible Guesses:\n";
    for (const word of possibleAnswers) {
        displayText += `${word}\n`;
    }
    alert(displayText);
}


function waitForBoardContainerToBeInitialized() {
    boardContainer = document.getElementsByClassName("Board-module_boardContainer__TBHNL");
    if (boardContainer && boardContainer.length > 0) {
        // displayButton();
        // displayBestGuessDiv();
        displayCustomElements();
    } else {
        setTimeout(waitForBoardContainerToBeInitialized, 500);
    }
}
initialize();
waitForBoardContainerToBeInitialized();