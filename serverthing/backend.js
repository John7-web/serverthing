import express from "express";
import { v4 as uuid } from "uuid";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage (Replit restarts will reset)
let games = {};

function createEmptyBoard() {
  return Array.from({ length: 10 }, () =>
    Array(10).fill({ status: "empty" })
  );
}

app.post("/create-game", (req, res) => {
  const gameId = uuid();
  games[gameId] = {
    id: gameId,
    players: {},
    turn: null,
    finished: false
  };

  res.json({ gameId });
});

app.post("/join-game", (req, res) => {
  const { gameId, playerName } = req.body;
  const game = games[gameId];

  if (!game) return res.status(404).json({ error: "Game not found" });

  if (Object.keys(game.players).length >= 2) {
    return res.json({ error: "Game already has 2 players" });
  }

  const playerId = uuid();
  game.players[playerId] = {
    id: playerId,
    name: playerName,
    board: createEmptyBoard(),
    guesses: createEmptyBoard(),
    shipsPlaced: false,
    ships: []
  };

  if (!game.turn) game.turn = playerId;

  res.json({ playerId });
});

app.post("/place-ships", (req, res) => {
  const { gameId, playerId, ships } = req.body;
  const game = games[gameId];

  if (!game) return res.status(404).json({ error: "Game not found" });
  if (!game.players[playerId]) return res.json({ error: "Player not found" });

  const board = createEmptyBoard();

  ships.forEach(ship => {
    ship.positions.forEach(({ x, y }) => {
      board[x][y] = { status: "ship" };
    });
  });

  game.players[playerId].board = board;
  game.players[playerId].ships = ships;
  game.players[playerId].shipsPlaced = true;

  res.json({ success: true });
});

app.post("/fire", (req, res) => {
  const { gameId, playerId, x, y } = req.body;
  const game = games[gameId];

  if (!game) return res.status(404).json({ error: "Game not found" });

  if (game.turn !== playerId) {
    return res.json({ error: "Not your turn" });
  }

  const opponentId = Object.keys(game.players).find(id => id !== playerId);
  const opponent = game.players[opponentId];

  let result = "miss";
  const cell = opponent.board[x][y];

  if (cell.status === "ship") {
    opponent.board[x][y] = { status: "hit" };
    result = "hit";
  } else {
    opponent.board[x][y] = { status: "miss" };
  }

  game.turn = opponentId;

  // Check win condition
  const allShipCells = opponent.ships.flatMap(s => s.positions);
  const allHit = allShipCells.every(pos => {
    return opponent.board[pos.x][pos.y].status === "hit";
  });

  if (allHit) {
    game.finished = true;
    return res.json({ result, winner: playerId });
  }

  res.json({ result });
});

app.get("/state/:gameId", (req, res) => {
  const game = games[req.params.gameId];
  if (!game) return res.status(404).json({ error: "Game not found" });
  res.json(game);
});

app.listen(3000, () => {
  console.log("Battleship server running on Replit");
});
