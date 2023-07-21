/* eslint-disable no-undef */
class DFS_Sim {
  click_ini = 2;
  board_size = [3, 3];

  init_DFS_Sim(board, click_ini, board_size) {
    if (!board) {
      console.log("Nenhum board");
      return false;
    }

    if (click_ini) this.click_ini = click_ini;
    if (board_size) this.board_size = board_size;

    const bestClicks = this.dfs(board, this.click_ini);

    return bestClicks;
  }

  // Função para copiar o tabuleiro
  copyBoard(board) {
    return board.map((row) => row.slice());
  }

  // Função para verificar se uma posição é válida no tabuleiro
  isValidPosition(x, y) {
    return x >= 0 && y >= 0 && x < this.board_size[0] && y < this.board_size[1];
  }

  // Função para clicar em uma gota e atualizar o tabuleiro
  clickDrop(board, x, y) {
    const size = board[x][y];
    if (size === 1) {
      board[x][y] = 2;
    } else if (size === 2) {
      board[x][y] = 3;
    } else if (size === 3) {
      board[x][y] = 0;
      const neighbors = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];
      neighbors.forEach(([nx, ny]) => {
        if (this.isValidPosition(nx, ny)) {
          // board[nx][ny] = Math.max(0, board[nx][ny] - 1);
          board[nx][ny] = 0;
        }
      });
    }
  }

  // Função DFS para encontrar o clique máximo
  dfs(board, clicksLeft) {
    const cls = this;
    let maxScore = 0;
    let bestClicks = [];

    for (let x = 0; x < this.board_size[0]; x++) {
      for (let y = 0; y < this.board_size[1]; y++) {
        cls.dfs_iteracoes_total_qnt += 1;
        if (board[x][y] > 0) {
          cls.dfs_iteracoes_qnt += 1;
          // a cada 10000 iterações exibe console log
          if (cls.dfs_iteracoes_qnt % 1000000 === 0) {
            console.log(
              "cls.dfs_iteracoes_qnt (1mi):",
              cls.dfs_iteracoes_qnt / 1000000
            );
          }

          const currentBoard = this.copyBoard(board);
          const currentScore = currentBoard[x][y] === 3 ? 1 : 0;

          this.clickDrop(currentBoard, x, y);
          let nextClicks = [];

          if (clicksLeft > 1) {
            nextClicks = this.dfs(currentBoard, clicksLeft - 1);
          }

          if (currentScore + nextClicks.length > maxScore) {
            maxScore = currentScore + nextClicks.length;
            bestClicks = [[x + 1, y + 1], ...nextClicks];
          }
        }
      }
    }

    return bestClicks;
  }
}

// ============

const express = require("express");
var cors = require("cors");

// Create express api and expose it
const app = express();
app.use(cors());
app.use(express.json());

// Create a new instance of the DFS_Sim class
const dfs_sim = new DFS_Sim();

// Route to get the best clicks
app.post("/solve", (req, res) => {
  const { board, click_ini, board_size } = req.body;

  dfs_sim.dfs_iteracoes_qnt = 0;
  dfs_sim.dfs_iteracoes_total_qnt = 0;

  console.time("Ini_tempo");

  const bestClicks = dfs_sim.init_DFS_Sim(board, click_ini, board_size);

  console.timeEnd("Ini_tempo");
  console.log("FIM this.dfs_iteracoes_qnt:", dfs_sim.dfs_iteracoes_qnt);
  console.log(
    "FIM dfs_sim.dfs_iteracoes_total_qnt:",
    dfs_sim.dfs_iteracoes_total_qnt
  );

  res.json({
    bestClicks,
    dfs_iteracoes_qnt: dfs_sim.dfs_iteracoes_qnt,
    dfs_iteracoes_total_qnt: dfs_sim.dfs_iteracoes_total_qnt,
  });
});

const porta = 5001;
app.listen(porta, function () {
  console.log(`CORS-enabled web server listening on port ${porta}`);
});
