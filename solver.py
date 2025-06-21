"""
Wordle solver
"""

from typing import List
from wordle import Feedback, WordleGame


class WordleSolver:
    """A simple Wordle solver that keeps track of guesses and feedback."""

    def __init__(self):
        self.valid_words = set(
            [
                word.upper()
                for word in open("valid-wordle-words.txt").read().splitlines()
            ]
        )
        self.guesses = []
        self.feedbacks = []

    def add_guess(self, guess: str, feedback: List[Feedback]) -> None:
        """Add a guess and its feedback to the solver."""
        self.guesses.append(guess.upper())
        self.feedbacks.append(feedback)

    def get_possible_answers(self) -> List[str]:
        """Get a list of possible answers based on the guesses and feedback."""
        possible_answers = self.valid_words.copy()

        for guess, feedback in zip(self.guesses, self.feedbacks):
            for i, char in enumerate(guess):
                if feedback[i] == Feedback.GREEN:  # Green
                    possible_answers = {
                        word for word in possible_answers if word[i] == char
                    }
                elif feedback[i] == Feedback.YELLOW:  # Yellow
                    possible_answers = {
                        word
                        for word in possible_answers
                        if char in word and word[i] != char
                    }
                elif feedback[i] == Feedback.BLACK:  # Black
                    possible_answers = {
                        word for word in possible_answers if char not in word
                    }

        return list(possible_answers)

    def solve(self, game: WordleGame) -> str:
        """Solve the Wordle game using the current guesses and feedback."""
        while not game.is_game_over:
            possible_answers = self.get_possible_answers()
            if not possible_answers:
                return "No possible answers left."

            # Choose the first possible answer as the next guess
            next_guess = possible_answers[0]

            feedback, is_correct_guess = game.make_guess(next_guess)
            print(
                f"Guess: {next_guess}, Feedback: {"".join([i.value for i in feedback])}"  # noqa: E501
            )

            if is_correct_guess:
                self.add_guess(next_guess, feedback)
                return f"Solved! The answer is {next_guess}. Guesses made: {len(self.guesses)}"  # noqa: E501

            self.add_guess(next_guess, feedback)

        return "Game over without a solution."


if __name__ == "__main__":
    wordle_game = WordleGame()
    solver = WordleSolver()

    print(solver.solve(wordle_game))
