"""
A simple Wordle game implementation in Python.
This module provides a basic structure for a Wordle game, including
feedback mechanisms and game state management.
"""

import enum
from typing import List, Tuple


class Feedback(enum.Enum):
    """Enum for feedback colors in Wordle."""

    GREEN = "🟩"  # Correct letter and position
    YELLOW = "🟨"  # Correct letter, wrong position
    BLACK = "⬛"  # Incorrect letter
    # GREY = ' '   # Unknown letter


class WordleGame:
    """A simple Wordle game implementation."""

    def __init__(self, answer: str):

        self.round_limit = 6

        self._current_round = 1
        self.valid_words = set(
            [
                word.upper()
                for word in open("valid-wordle-words.txt").read().splitlines()
            ]
        )
        if answer:
            if len(answer) != 5 or answer.upper() not in self.valid_words:
                raise ValueError("Answer must be a 5-letter word.")
        else:
            self._answer = "GLADE"
        self._answer = answer.upper()
        self._is_won = False

    @property
    def current_round(self) -> int:
        """Get the current round number."""
        return self._current_round

    @property
    def is_game_over(self) -> bool:
        """Check if the game is over."""
        return self.current_round > self.round_limit or self._is_won

    def _get_feedback(self, guess: str):
        feedback = []
        for i, char in enumerate(guess):
            if char == self._answer[i]:
                feedback.append(Feedback.GREEN)
            elif char in self._answer:
                feedback.append(Feedback.YELLOW)
            else:
                feedback.append(Feedback.BLACK)
        return feedback

    @staticmethod
    def _get_str_feedback(feedback: List[Feedback]) -> str:
        return "".join(f.value for f in feedback)

    def _is_valid_word(self, word: str) -> bool:
        if len(word) != 5:
            return False
        return word.upper() in self.valid_words

    def make_guess(self, guess: str) -> Tuple[List[Feedback], bool]:
        """Make a guess and return feedback and whether the game is won."""
        if self.is_game_over:
            raise ValueError("Game is already over. Please start a new game.")
        guess = guess.upper()
        if not self._is_valid_word(guess):
            raise ValueError("Invalid word. Please try again.")
        feedback = self._get_feedback(guess)
        self._current_round += 1
        if feedback == [Feedback.GREEN] * 5:
            self._is_won = True
            return feedback, True
        elif self._current_round > self.round_limit:
            raise ValueError("Maximum number of rounds reached.")
        else:
            return feedback, False


if __name__ == "__main__":
    # Example usage
    game = WordleGame("glade")
    print(game.make_guess("raise"))
    print(game.make_guess("glade"))
    print(game.make_guess("glade"))
