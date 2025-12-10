import React, { useState } from 'react';

// Tic Tac Toe React Port
const winConditions = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function getInitialState() {
  return {
    options: Array(9).fill(''),
    currentPlayer: 'X',
    running: true,
    status: "Your turn (X)",
    scoreX: 0,
    scoreO: 0,
  };
}

const TicTacToe: React.FC = () => {
  const [state, setState] = useState(getInitialState());

  const handleCellClick = (idx: number) => {
    if (!state.running || state.options[idx] !== '' || state.currentPlayer !== 'X') return;
    const newOptions = [...state.options];
    newOptions[idx] = 'X';
    setState(s => ({ ...s, options: newOptions }));
    setTimeout(() => checkWinner(newOptions, 'X'), 50);
    setTimeout(() => computerMove(newOptions), 350);
  };

  const computerMove = (options: string[]) => {
    if (!state.running) return;
    const available = options.map((v, i) => (v === '' ? i : null)).filter(v => v !== null) as number[];
    if (available.length === 0) return;

    // 1. Try to win
    for (const idx of available) {
      const testOptions = [...options];
      testOptions[idx] = 'O';
      if (isWinningMove(testOptions, 'O')) {
        makeAIMove(idx, options);
        return;
      }
    }
    // 2. Block player win
    for (const idx of available) {
      const testOptions = [...options];
      testOptions[idx] = 'X';
      if (isWinningMove(testOptions, 'X')) {
        makeAIMove(idx, options);
        return;
      }
    }
    // 3. Otherwise, pick random
    const randomIndex = available[Math.floor(Math.random() * available.length)];
    makeAIMove(randomIndex, options);
  };

  // Helper to check if a move wins
  function isWinningMove(opts: string[], player: string) {
    return winConditions.some(([a, b, c]) =>
      opts[a] === player && opts[b] === player && opts[c] === player
    );
  }

  // Helper to make the move and update state
  function makeAIMove(idx: number, options: string[]) {
    const newOptions = [...options];
    newOptions[idx] = 'O';
    setState(s => ({ ...s, options: newOptions, currentPlayer: 'X', status: 'Your turn (X)' }));
    setTimeout(() => checkWinner(newOptions, 'O'), 50);
  }

  const checkWinner = (options: string[], player: string) => {
    for (let i = 0; i < winConditions.length; i++) {
      const [a, b, c] = winConditions[i];
      if (
        options[a] !== '' &&
        options[a] === options[b] &&
        options[b] === options[c]
      ) {
        endGame(`${player} wins!`, player);
        return;
      }
    }
    if (!options.includes('')) {
      endGame('Draw!', '');
      return;
    }
    if (player === 'X') {
      setState(s => ({ ...s, currentPlayer: 'O', status: `Computer's turn (O)...` }));
    }
  };

  const endGame = (message: string, winner: string) => {
    setState(s => ({
      ...s,
      status: message,
      running: false,
      scoreX: winner === 'X' ? s.scoreX + 1 : s.scoreX,
      scoreO: winner === 'O' ? s.scoreO + 1 : s.scoreO,
    }));
  };

  const restartGame = () => {
    setState(s => ({
      ...getInitialState(),
      scoreX: s.scoreX,
      scoreO: s.scoreO,
    }));
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex justify-between w-full max-w-xs mb-2">
        <div className="font-semibold text-blue-700">You (X): <span>{state.scoreX}</span></div>
        <div className="font-semibold text-blue-700">AI (O): <span>{state.scoreO}</span></div>
      </div>
      <h2 className="text-xl font-bold mb-2">Tic Tac Toe</h2>
      <div className="grid grid-cols-3 gap-2 mb-2" style={{ width: 210 }}>
        {state.options.map((cell, idx) => (
          <button
            key={idx}
            className="w-16 h-16 bg-gray-100 rounded-lg text-3xl font-bold flex items-center justify-center shadow hover:bg-emerald-100 transition"
            onClick={() => handleCellClick(idx)}
            disabled={cell !== '' || !state.running || state.currentPlayer !== 'X'}
          >
            {cell}
          </button>
        ))}
      </div>
      <div className="text-lg font-semibold mb-2 text-gray-700">{state.status}</div>
      <button
        className="mt-2 px-6 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition"
        onClick={restartGame}
      >
        Restart
      </button>
    </div>
  );
};

export default TicTacToe; 