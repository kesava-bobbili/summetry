# suMMetry

suMMetry is a small 3x3 logic puzzle game built with vanilla HTML, CSS, and JavaScript. Fill the board so every row, every column, and both diagonals add up to the same hidden sum.

Live site: https://kesava-bobbili.github.io/summetry/

## How to Play

1. Choose Easy, Medium, or Hard.
2. Select an empty cell.
3. Tap a number from 1-9 to fill it.
4. Use the clear button to erase the selected cell.
5. Complete the grid so all eight lines equal the same hidden sum.

## Rules

- The board is a 3x3 grid.
- Digits 1-9 are allowed.
- Repetition is permitted.
- Every row, every column, and both diagonals must equal the same hidden sum `S`.
- `S` is one of `6, 9, 12, 15, 18, 21, 24`.
- The center cell is always fixed to `S / 3`.
- Every generated puzzle has exactly one valid solution.

## Difficulty

- Easy: 3 empty cells, 6 prefilled cells.
- Medium: 5 empty cells, 4 prefilled cells.
- Hard: 7 empty cells, 2 prefilled cells.

## Scoring

Each puzzle starts at 1000 points. Every second costs 2 points, and every hint costs 100 points. The minimum score is 100 points. Your current streak and best score are saved in localStorage.
