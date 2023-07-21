class Plan_PDDL {
  enviar_plano() {
    const cls = this;

    this.solver_btn.on("click", () => {
      const domText = $("#domain").val();
      let probText = $("#prob").val();

      const init_plano_objeto = cls.gera_init_plano_objeto();

      probText = probText.replace(":::OBJETOS:::", init_plano_objeto);

      const init_plano = cls.gera_init_plano();
      probText = probText.replace(":::CONTEUDO:::", init_plano);

      const data = JSON.stringify({ domain: domText, problem: probText });

      cls.set_carregando_plan(true);

      $.ajax({
        url: "https://solver.planning.domains/solve",
        type: "POST",
        contentType: "application/json",
        data,
      }).done(function (res) {
        if (res["status"] === "ok") {
          console.log("::: Plan found!", res.result);
          cls._ajustar_resposta_plano(res.result.plan);
        } else {
          console.log("::: Planning failed.");
        }

        cls.set_carregando_plan(false, cls.solver_btn);
        console.log(res);
      });
    });
  }

  _ajustar_resposta_plano = (res_plan) => {
    const passos = res_plan.map((i) => {
      return i.name;
    });
    const regex = /c\d+/g;

    const passos_format = passos.map((v) => {
      const p = v.match(regex);
      return p[0];
    });

    const passos_format_jogo = this._formatar_plano_func(passos_format);
    this.plan.val(passos_format_jogo);
  };

  _formatar_plano_func = (passos) => {
    return passos
      .map((p) => {
        p = p.replace("c", "").split("").join(",");
        return p;
      })
      .join("_");
  };

  gera_init_plano_objeto() {
    const tab = this.tabuleiro_gotas
      .map((vv, v) => vv.map((dd, d) => `C${v + 1}${d + 1}`).join(" "))
      .join("\n");
    const conteudo_completo = `
     ${tab}
     `;
    console.log("conteudo_completo:", conteudo_completo);

    return conteudo_completo;
  }

  gera_init_plano() {
    const onde_tem_gota = this._onde_tem_gota_func();
    const tamanho_gota = this._tamanho_gota_func();
    const adjacente_gota = this._adjacente_gota_func();

    const conteudo_completo = `
     ; Onde tem gota
     ${onde_tem_gota.join("\n")}
     ; Tamanhos de cada gota
     ${tamanho_gota.join("\n")}
     ; Qual gota está do lado da outra
     ${adjacente_gota.join("\n")}
     `;
    return conteudo_completo;
  }

  _onde_tem_gota_func = () => {
    let arr = [];
    this.squares.each((i, btn) => {
      const rowInd = $(btn).parent().index() + 1;
      const colInd = $(btn).index() + 1;

      const temGota = $(btn).find("img");

      if (temGota.length) {
        arr.push(`(TEM-GOTA C${rowInd}${colInd})`);
      }
    });
    return arr;
  };

  _tamanho_gota_func = () => {
    let arr = [];
    this.squares.each((i, btn) => {
      const rowInd = $(btn).parent().index() + 1;
      const colInd = $(btn).index() + 1;

      const temGota = $(btn).find("img");

      if (temGota.length) {
        if (temGota.hasClass("water--sm"))
          arr.push(`(TAMANHO-GOTA-P C${rowInd}${colInd})`);
        if (temGota.hasClass("water--md"))
          arr.push(`(TAMANHO-GOTA-M C${rowInd}${colInd})`);
        if (temGota.hasClass("water--lg"))
          arr.push(`(TAMANHO-GOTA-G C${rowInd}${colInd})`);
      }
    });
    return arr;
  };

  _adjacente_gota_func = () => {
    let arr = [];
    const cls = this;

    this.squares.each((i, btn) => {
      const rowInd = $(btn).parent().index();
      const colInd = $(btn).index();
      const temGota = $(btn).find("img");

      if (temGota.length) {
        let cols_up = [rowInd - 1, colInd];
        let cols_right = [rowInd, colInd + 1];
        let cols_down = [rowInd + 1, colInd];
        let cols_left = [rowInd, colInd - 1];

        const c_up = cls.get_cell(cols_up[0], cols_up[1]);
        const c_rg = cls.get_cell(cols_right[0], cols_right[1]);
        const c_dw = cls.get_cell(cols_down[0], cols_down[1]);
        const c_lf = cls.get_cell(cols_left[0], cols_left[1]);

        let sub_arr = [];
        [c_up, c_rg, c_dw, c_lf].map((elem) => {
          const rowInd = $(elem).parent().index();
          const colInd = $(elem).index();
          const temGotaB = $(elem).find("img");

          if (temGotaB.length) {
            sub_arr.push(`C${rowInd + 1}${colInd + 1}`);
          } else {
            sub_arr.push(`C00`);
          }
        });

        const nome_btn_planner = `C${rowInd + 1}${colInd + 1}`;
        arr.push(`(ADJACENTE ${nome_btn_planner} ${sub_arr.join(" ")})`);
      }
    });
    return arr;
  };
}

// ===================
// ===================
// ===================
// =================== CLASSE DFS_Sim
// ===================
// ===================

class DFS_Sim extends Plan_PDDL {
  constructor() {
    super();
  }

  async init_DFS_Sim(board) {
    return new Promise((resolve) => {
      if (!board) {
        console.log("Nenhum board");
        resolve(false);
      }

      const data = JSON.stringify({
        board,
        click_ini: this.click_ini,
        board_size: this.board_size,
      });

      $.ajax({
        url: "http://localhost:5001/solve",
        type: "POST",
        contentType: "application/json",
        data,
      }).done(function (res) {
        try {
          resolve(res.bestClicks);
        } catch (error) {
          console.log("Error:", error);
          resolve("Error:" + error);
        }
      });
    });
  }

  async init_DFS_Sim_local(board) {
    if (!board) {
      console.log("Nenhum board");
      return false;
    }

    this.dfs_iteracoes_qnt = 0;
    this.dfs_iteracoes_total_qnt = 0;
    const bestClicks = await this.dfs(board, this.click_ini);
    console.log("FIM this.dfs_iteracoes_qnt:", this.dfs_iteracoes_qnt);
    console.log(
      "FIM this.dfs_iteracoes_total_qnt:",
      this.dfs_iteracoes_total_qnt
    );

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
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      let maxScore = 0;
      let bestClicks = [];

      for (let x = 0; x < this.board_size[0]; x++) {
        for (let y = 0; y < this.board_size[1]; y++) {
          cls.dfs_iteracoes_total_qnt += 1;
          if (board[x][y] > 0) {
            cls.dfs_iteracoes_qnt += 1;
            // a cada 10000 iterações exibe console log
            if (cls.dfs_iteracoes_qnt % 1000000 === 0) {
              console.log("cls.dfs_iteracoes_qnt:", cls.dfs_iteracoes_qnt);
            }

            const currentBoard = this.copyBoard(board);
            const currentScore = currentBoard[x][y] === 3 ? 1 : 0;

            this.clickDrop(currentBoard, x, y);
            let nextClicks = [];

            if (clicksLeft > 1) {
              nextClicks = await this.dfs(currentBoard, clicksLeft - 1);
            }

            if (currentScore + nextClicks.length > maxScore) {
              maxScore = currentScore + nextClicks.length;
              bestClicks = [[x + 1, y + 1], ...nextClicks];
            }
          }
        }
      }

      resolve(bestClicks);
    });
  }
}

// ===================
// ===================
// ===================
// =================== CLASSE Plan_DFS
// ===================
// ===================

class Plan_DFS extends DFS_Sim {
  constructor() {
    super();
  }

  enviar_plano_dfs() {
    const cls = this;

    this.dfs_btn.on("click", function () {
      const data = cls._gera_init_plano_dfs();

      cls.set_carregando_plan(true);

      setTimeout(async () => {
        let plano;

        if (cls.utilizar_dfs_local) {
          plano = await cls.init_DFS_Sim_local(data);
        } else {
          plano = await cls.init_DFS_Sim(data);
        }

        cls._ajustar_resposta_plano_dfs(plano);
        cls.set_carregando_plan(false, cls.dfs_btn);
      }, 300);
    });
  }

  set_carregando_plan(sim, btn) {
    if (sim) {
      this.time_start = window.performance.now();
      this.carregando_plan.slideDown();
    } else {
      this.time_end = window.performance.now();
      const diff = this.time_end - this.time_start;
      console.log("::: DIFF:", diff);
      if (btn) btn.find(".badge").text(Math.round(diff));
      this.carregando_plan.hide();
    }
  }

  _ajustar_resposta_plano_dfs = (res_plan) => {
    const passos_format_jogo = res_plan
      .map((v) => {
        return v.join(",");
      })
      .join("_");
    this.plan.val(passos_format_jogo);
  };

  _formatar_plano_func_dfs = (passos) => {
    return passos
      .map((p) => {
        p = p.replace("c", "").split("").join(",");
        return p;
      })
      .join("_");
  };

  _gera_init_plano_dfs() {
    this.get_status_tabuleiro();
    return this.tabuleiro_gotas;
  }

  _simula_clique = (row_num, col_num, board) => {
    row_num -= 1;
    col_num -= 1;
    let qnt_score = 0;
    // let qnt_score = 0;

    this.tabuleiro_gotas_mock = board ?? [...this.tabuleiro_gotas];
    this.vizinhos_mock = this.vizinhos;

    let v = this.tabuleiro_gotas_mock[row_num][col_num];
    const vizinhos_atual = this.vizinhos_mock[`${row_num}_${col_num}`];
    const is_vai_explodir = v === 3;

    if (is_vai_explodir) {
      qnt_score += 1;
    }
    // verifica se this.vizinhos_mock tem o vizinho
    vizinhos_atual.map((k) => {
      const valor_viz_atual = this.tabuleiro_gotas_mock[k[0]][k[1]];
      const is_tem_gota = valor_viz_atual !== 0;

      // Se tem gota, então explode
      if (is_tem_gota && is_vai_explodir) {
        this.tabuleiro_gotas_mock[k[0]][k[1]] = 0;
        qnt_score += 1;
      }
      return k;
    });

    v = this._logica_adicao_gota(v);
    this.tabuleiro_gotas_mock[row_num][col_num] = v;

    // console.log(
    //   "this.tabuleiro_gotas:",
    //   JSON.stringify(this.tabuleiro_gotas_mock)
    // );
    // console.log("qnt_score:", qnt_score);

    return qnt_score;
  };

  _logica_adicao_gota(v) {
    if (v > 0 && v <= 2) v += 1;
    else v = 0;
    return v;
  }
}

// ===================
// ===================
// ===================
// ===================
// ===================
// ===================
// =================== CLASSE Game
// ===================
// ===================
// ===================
// ===================
// ===================

class Game extends Plan_DFS {
  water_lg;
  water_md;
  water_sm;
  board;

  constructor() {
    super();
  }

  async init() {
    this.default_values();
    this.set_tamanho();
    this.default_values();
    this.set_score(this.score_ini);
    this.set_qnt_click(this.click_ini);
    this.cell_click();
    this.init_pos();
    this.run_plan();

    this.get_status_tabuleiro();
    this.set_link_mesma_config();

    this.enviar_plano();
    this.enviar_plano_dfs();

    // console.log("this.tabuleiro_gotas:", JSON.stringify(this.tabuleiro_gotas));
  }

  default_values() {
    // this.board_size = [3, 3];
    this.board_size = [4, 4];
    // this.board_size = [5, 5];
    // this.board_size = [10, 10];
    this.sizes = ["lg", "md", "sm"];
    this.score_ini = 0;
    this.click_ini = 10;
    this.score = 0;
    this.clicks = 0;
    this.tmp_rodar_plan = 500;
    this.utilizar_dfs_local = true;

    this.tabuleiro = [];
    this.vizinhos = [];
    this.tabuleiro_gotas = [];

    this.tabuleiro_gotas_mock = [];
    this.css_explodir = "explodiu animate__animated animate__jello";
    this.css_auto = "auto animate__animated animate__bounceIn";

    this.board = $("#board");
    this.water = $(".water");
    this.score_elem = $("#score");
    this.link_mesma_config = $("#link_mesma_config");
    this.qnt_click_elem = $("#qnt_click");
    this.plan = $("#plan");
    this.run_btn = $("#run");
    this.solver_btn = $("#run_solver");
    this.dfs_btn = $("#run_dfs");
    this.carregando_plan = $("#carregando_plan");
    this.carregando_plan.hide();

    this.squares = this.board.find(`.square`);
    this.water_lg = this.water.clone().addClass("water--lg");
    this.water_md = this.water.clone().addClass("water--md");
    this.water_sm = this.water.clone().addClass("water--sm");
  }

  async set_tamanho() {
    const cls = this;

    const rElem = cls.board.find(".r").clone();
    const cElem = cls.board.find(".r .square").clone();
    cls.board.empty();

    for (let i = 0; i < cls.board_size[0]; i++) {
      const new_rElem = rElem.clone();
      cls.board.append(new_rElem);

      for (let i = 1; i < cls.board_size[1]; i++) {
        new_rElem.append(cElem.clone());
      }
    }
  }

  run_plan() {
    const cls = this;
    this.run_btn.on("click", function () {
      const inps = cls.plan.val().split("_");

      inps.forEach((i, ii) => {
        const coord = i.split(",");

        setTimeout(() => {
          cls.squares.removeClass(cls.css_auto);

          const row_i = parseInt(coord[0]) - 1;
          const col_i = parseInt(coord[1]) - 1;

          const c = cls.get_cell(row_i, col_i);

          c.addClass(cls.css_auto).click();
        }, cls.tmp_rodar_plan * ii);
      });
    });
  }

  set_link_mesma_config() {
    this.link_mesma_config.attr("href", `?posDef=${this.tabuleiro_gotas}`);
  }

  init_pos() {
    const params = window.location.search;

    const cls = this;
    if (params.indexOf("posFix") !== -1) {
      this.init_fixed_pos();
    } else if (params.indexOf("posDef") !== -1) {
      const valores = params.split("=")[1];

      const inputArray = valores.split(",");

      // Criar a matriz bidimensional
      const size = Math.sqrt(inputArray.length);
      const matrix = [];

      for (let i = 0; i < size; i++) {
        matrix.push(inputArray.slice(i * size, (i + 1) * size));
      }

      // console.log("matrix:", matrix);

      matrix.map((m, im) => {
        m.map((c, cm) => {
          if (c === "1") cls.add_row_col(cls.water_sm, im, cm);
          if (c === "2") cls.add_row_col(cls.water_md, im, cm);
          if (c === "3") cls.add_row_col(cls.water_lg, im, cm);
        });
      });
    } else {
      this.init_random_pos();
    }
  }

  init_fixed_pos() {
    this.squares.removeClass(this.css_auto);
    this.add_row_col(this.water_md, 0, 0);
    this.add_row_col(this.water_md, 0, 1);
    this.add_row_col(this.water_lg, 1, 1);
    this.add_row_col(this.water_lg, 2, 2);
    this.add_row_col(this.water_sm, 2, 1);
    this.add_row_col(this.water_sm, 3, 3);
  }

  set_score(num) {
    this.score = num;
    this.score_elem.text(this.score);
  }

  set_qnt_click(num) {
    if (num > 0) {
      this.clicks = num;
      this.qnt_click_elem.text(this.clicks);
    } else {
      this.qnt_click_elem.text("Fim de jogo");
      this.board.addClass("fim");
      this.squares.attr("disabled", true);
    }
  }

  add_row_col(obj, row_num, col_num) {
    const col = this.board.find(`.r:eq(${row_num}) .square:eq(${col_num})`);

    col.empty().append(obj.clone());
  }

  cell_click() {
    const cls = this;
    this.squares.on("click", function () {
      cls.set_qnt_click(cls.clicks - 1);

      const img = $(this).find("img");

      if (img.hasClass("water--md")) {
        img.removeClass("water--md").addClass("water--lg");
      } else if (img.hasClass("water--sm")) {
        img.removeClass("water--sm").addClass("water--md");
      } else if (img.hasClass("water--lg")) {
        cls.explode($(this));
        img.remove();
      } else {
        console.log("não tem classe");
      }

      cls.verificar_se_nao_tem_mais_gota();
    });
  }

  verificar_se_nao_tem_mais_gota() {
    const qnt_gotas = this.squares.find("img");
    if (qnt_gotas.length === 0) {
      console.log("::: Reiniciando");
      setTimeout(() => {
        console.log("::: Reiniciado");
        // this.init_random_pos();
      }, 1000);
    }
  }

  init_random_pos() {
    this.squares.removeClass(this.css_auto);
    const qnt_squares = this.squares.length;

    let random_pos = [];
    for (let i = 0; i < qnt_squares; i++) {
      const rand_1 = this._gera_random(this.board_size[0]) - 1;
      const rand_2 = this._gera_random(this.board_size[1]) - 1;

      const qnt_tmh = this.sizes.length;
      const rand_tmh = this._gera_random(qnt_tmh);

      switch (rand_tmh) {
        case 1:
          this.add_row_col(this.water_lg, rand_1, rand_2);
          break;
        case 2:
          this.add_row_col(this.water_md, rand_1, rand_2);
          break;
        case 3:
          this.add_row_col(this.water_sm, rand_1, rand_2);
          break;
      }
      random_pos.push([rand_1, rand_2]);
    }
  }

  explode(btnElem) {
    const rowInd = btnElem.parent().index();
    const colInd = btnElem.index();

    let cols_up = [rowInd - 1, colInd];
    let cols_right = [rowInd, colInd + 1];
    let cols_down = [rowInd + 1, colInd];
    let cols_left = [rowInd, colInd - 1];

    // console.log("cols_up:", cols_up);
    this.remove_square_ind(cols_up[0], cols_up[1]);
    this.remove_square_ind(cols_right[0], cols_right[1]);
    this.remove_square_ind(cols_down[0], cols_down[1]);
    this.remove_square_ind(cols_left[0], cols_left[1]);

    // + 1 ponto para a própria bolha estourada
    this.set_score(this.score + 1);
  }

  remove_square_ind(row_num, col_num) {
    const c = this.get_cell(row_num, col_num);

    if (row_num >= 0 && col_num >= 0 && c !== null) {
      const temGota = c.addClass(this.css_explodir).delay(1000).find("img");

      if (temGota.length) {
        this.set_score(this.score + 1);
        temGota.remove();
      }
      setTimeout(() => {
        c.removeClass(this.css_explodir);
      }, 1000);
    }
  }

  get_status_tabuleiro() {
    const cls = this;
    let tabuleiro = [];
    let tabuleiro_gotas = [];
    let vizinhos = [];

    this.squares.map((i, btn) => {
      const rowInd = $(btn).parent().index();
      const colInd = $(btn).index();

      const temGota = $(btn).find("img");

      let cols_up = [rowInd - 1, colInd];
      let cols_right = [rowInd, colInd + 1];
      let cols_down = [rowInd + 1, colInd];
      let cols_left = [rowInd, colInd - 1];

      const c_up = cls.get_cell(cols_up[0], cols_up[1]);
      const c_rg = cls.get_cell(cols_right[0], cols_right[1]);
      const c_dw = cls.get_cell(cols_down[0], cols_down[1]);
      const c_lf = cls.get_cell(cols_left[0], cols_left[1]);

      const nome_btn = `${rowInd}_${colInd}`;

      [c_up, c_rg, c_dw, c_lf].map((elem) => {
        const rowInd = $(elem).parent().index();
        const colInd = $(elem).index();

        if (elem) {
          if (!vizinhos[nome_btn]) vizinhos[nome_btn] = [];

          vizinhos[nome_btn].push([rowInd, colInd]);

          // sort by row and col
          vizinhos[nome_btn] = vizinhos[nome_btn].sort((a, b) => {
            return a.rowInd - b.rowInd;
          });
        }
      });

      if (!tabuleiro[rowInd]) tabuleiro[rowInd] = [];
      tabuleiro[rowInd].push([rowInd, colInd]);

      if (!tabuleiro_gotas[rowInd]) tabuleiro_gotas[rowInd] = [];
      if (temGota.length) {
        if (temGota.hasClass("water--sm")) tabuleiro_gotas[rowInd].push(1);
        if (temGota.hasClass("water--md")) tabuleiro_gotas[rowInd].push(2);
        if (temGota.hasClass("water--lg")) tabuleiro_gotas[rowInd].push(3);
      } else {
        tabuleiro_gotas[rowInd].push(0);
      }

      return btn;
    });

    this.vizinhos = vizinhos;
    this.tabuleiro = tabuleiro;
    this.tabuleiro_gotas = tabuleiro_gotas;
  }

  get_cell(row_num, col_num) {
    if (this.is_position_valid(row_num, col_num)) {
      const col = this.board.find(`.r:eq(${row_num}) .square:eq(${col_num})`);
      return col;
    } else {
      return null;
    }
  }

  is_position_valid(row_num, col_num) {
    return (
      row_num >= 0 &&
      col_num >= 0 &&
      row_num < this.board_size[0] &&
      col_num < this.board_size[1]
    );
  }

  _gera_random(to) {
    const random_drops = Math.floor(Math.random() * to) + 1;
    return random_drops;
  }
}

// ===============

const game = new Game();
game.init();
