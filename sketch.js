/***********************************
Configurações do espaço de trabalho
***********************************/

//Largura e altura da vizualização do espaço
let w, h;
//Quantidade de colunas do espaço útil
let cols = 48;
//Quantidade de linhas do espaço útil
let rows = 48;
//Grade virtual do espaço útil
let grid = new Array(cols, rows);
//Rodar somente o melhor agente?
let runBest = false;

/***********************************
 **************Métricas**************
 ***********************************/

//Maior pontuação total de um agente
let highScore = 0;
//Contador de gerações
let generation = 1;
//População total para treinamento/execução
let totalPopulation = 20;

/***********************************
 **************Agentes***************
 ***********************************/

//Array da população de agentes gerados
let allAgents = [];
//Array com todos os agentes ativos (não descartados)
let activeAgents = [];
//Agente com melhor pontuação
let bestAgent;

/***********************************
 ***********Elementos DOM************
 ***********************************/

//Span que exibe a melhor pontuação até o momento
let spanActHighScore;
//Span que exibe a melhor pontuação atual
let spanHighScore;
//Span que exibe a geração atual
let spanGeneration;
//Tabela de Agentes
let agTable;
//Botão para rodar somente o melhor até o momento
let runBestButton;
//Botão para salvar o cérebro do melhor agente até o momento
let saveBestButton;

let speedSlider;
let speedSpan;

let chkHide;

/***********************************
 ********Outras propriedades*********
 ***********************************/

// TODO: Encontrar outra forma de popular automaticamente as prateleiras
//Colunas que são prateleiras
let cShelf = [3, 4, 7, 8, 11, 12, 15, 16, 19, 20, 23, 24, 27, 28, 31, 32, 35, 36, 39, 40, 43, 44];
//Linhas que não são prateleiras
let rNotShelf = [0, 1, 2, 9, 10, 17, 18, 25, 26, 33, 34, 41, 42, 43, 44, 45, 46, 47];

function toggleState() {
  runBest = !runBest;
  // Show the best bird
  if (runBest) {
    resetGame();
    runBestButton.html('Continuar treiando');
    // Go train some more
  } else {
    nextGeneration();
    runBestButton.html('Rodar somente o melhor até o momento');
  }
}

function resetTable(){
  for (var i = 0; i < allAgents.length - 1; i++) {
    updateAgentTableLine(i);
  }
}

function updateAgentTableLine(agIndex) {

  let linha = document.getElementById(('linha_').concat(agIndex + 1));
  let cel_name = document.getElementById(('linha_').concat(agIndex + 1).concat("_name"));
  let cel_pos = document.getElementById(('linha_').concat(agIndex + 1).concat("_pos"));
  let cel_status = document.getElementById(('linha_').concat(agIndex + 1).concat("_status"));
  let cel_score = document.getElementById(('linha_').concat(agIndex + 1).concat("_score"));
  let cel_targ = document.getElementById(('linha_').concat(agIndex + 1).concat("_targ"));
  let cel_dist = document.getElementById(('linha_').concat(agIndex + 1).concat("_dist"));
  cel_name.innerHTML = allAgents[agIndex].name;
  cel_pos.innerHTML = (allAgents[agIndex].cell.x).toString().concat(",").concat(allAgents[agIndex].cell.y);
  cel_status.innerHTML = allAgents[agIndex].status;
  cel_score.innerHTML = allAgents[agIndex].score.toFixed(2);
  cel_targ.innerHTML = (allAgents[agIndex]).targetCell.x.toString().concat(",").concat(allAgents[agIndex].targetCell.y);
  cel_dist.innerHTML = allAgents[agIndex].cellsMoved;
  switch (allAgents[agIndex].status) {
    case "active":
      linha.style.display = "table-row";
      cel_status.className = "b_blue";
      break;
    case "dead":
      cel_status.className = "b_red";
      debugger;
      if (chkHide.checked()) {
        linha.style.display = "none";
      }
      break;
    case "carrying":
      cel_status.className = "b_green1";
      break;
    case "inDeliveryZone":
      cel_status.className = "b_green2";
      break;
    case "delivered":
      cel_status.className = "b_green3";
      break;
    case "returning":
      cel_status.className = "b_green4";
      break;
  }
}

function saveBestAgentBrain() {
  if (bestAgent == undefined) {
    return;
  }
  bestAgent.generation = generation;
  bestAgent.brain.generation = generation;
  let str = JSON.stringify(bestAgent.brain);
  let dlbtn = document.getElementById("saveBest");
  let file = new Blob([str], {
    type: "application/json;charset=utf-8"
  });
  dlbtn.href = URL.createObjectURL(file);
  dlbtn.download = "bestBrain.json";
}

function loadBrain() {
  noLoop();
  let rawFile = new XMLHttpRequest();
  rawFile.open('GET', 'http://localhost:8000/bestBrain.json', true); // Replace 'appDataServices' with the path to your file
  rawFile.onreadystatechange = function() {
    if (rawFile.readyState === 4) {
      if (rawFile.status === 200 || rawFile.status == 0) {
        let responseText = rawFile.responseText;
        let protoBrain = JSON.parse(responseText);
        let protoMatrix = new Matrix();
        let brain = new NeuralNetwork();
        let matrix = new Matrix(protoBrain.bias_h.rows, protoBrain.bias_h.cols);
        matrix.data = protoBrain.bias_h.data;
        brain.bias_h = matrix;
        matrix = new Matrix(protoBrain.bias_o.rows, protoBrain.bias_o.cols);
        matrix.data = protoBrain.bias_o.data;
        brain.bias_o = matrix;
        brain.generation = protoBrain.generation;
        brain.hidden_nodes = protoBrain.hidden_nodes;
        brain.input_nodes = protoBrain.input_nodes;
        brain.learning_rate = protoBrain.learning_rate;
        brain.output_nodes = protoBrain.output_nodes;
        matrix = new Matrix(protoBrain.weights_ho.rows, protoBrain.weights_ho.cols);
        matrix.data = protoBrain.weights_ho.data;
        brain.weights_ho = matrix;
        matrix = new Matrix(protoBrain.weights_ih.rows, protoBrain.weights_ih.cols);
        matrix.data = protoBrain.weights_ih.data;
        brain.weights_ih = matrix;
        for (let i = 0; i < allAgents.length - 1; i++) {
          allAgents[i].dispose();
          allAgents[i].brain = brain;
        }
        for (let i = 0; i < activeAgents.length - 1; i++) {
          activeAgents[i].dispose();
          activeAgents[i].brain = brain;
        }
        bestAgent.dispose();
        bestAgent.brain = brain;
        generation = brain.generation;
        spanGeneration.html(generation);
        nextGeneration();
      }
    }
  }
  rawFile.send(null);
  loop();
}

/***********************************
 **************P5 Setup**************
 ***********************************/

function setup() {
  //Cria um objeto canvas
  let canvas = createCanvas(700, 700);
  //Associa o objeto canvas ao seu elemento DOM
  canvas.parent('canvascontainer');
  canvas.style.display = "block";
  canvas.style.marignLeft = "auto";
  canvas.style.marignRight = "auto";
  //Associação das variáveis métricas aos seus elementos DOM
  spanGeneration = select('#gen');
  spanHighScore = select('#sco');
  spanActHighScore = select('#actSco');
  speedSlider = select('#speedSlider');
  speedSpan = select('#speed');
  agTable = document.getElementById("agentTable");
  runBestButton = select('#best');
  chkHide = select('#chkHideTableLines');
  runBestButton.mousePressed(toggleState);
  chkHide.mousePressed(resetTable);
  w = width / cols;
  h = height / cols;
  //Construindo a matriz
  for (let i = 0; i < cols; i++) {
    grid[i] = new Array(rows);
  }

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j] = new Cell(i, j);
      if (i == 0 || i == cols - 1 || j == 0 || j == rows - 1) {
        grid[i][j].wall = true;
      }
      if (j == rows - 5 && (i != 1 && i != cols - 2)) {
        grid[i][j].wall = true;
      }
      if (j == rows - 5 && i == 1) {
        grid[i][j].depositAreaEntrance = true;
      }
      if (j == rows - 5 && i == cols - 2) {
        grid[i][j].depositAreaExit = true;
      }
      if (cShelf.includes(i) && !rNotShelf.includes(j)) {
        grid[i][j].shelf = true;
      }
    }
  }

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j].addNeighbors(grid);
    }
  }

  // Create a population
  for (let i = 0; i < totalPopulation; i++) {
    let randX;
    let randY;
    do {
      randX = Math.floor(Math.random() * cols);
      randY = Math.floor(Math.random() * rows);
    }
    while (grid[randX][randY].shelf == true);
    let agent = new Agent(grid, generation);
    activeAgents[i] = agent;
    allAgents[i] = agent;

    let linha = agTable.insertRow(); // document.createElement("TR");
    linha.id = ("linha_").concat(i + 1);
    let l1 = linha.insertCell();
    l1.id = (linha.id).concat("_").concat("name");
    let l2 = linha.insertCell();
    l2.id = (linha.id).concat("_").concat("pos");
    let l6 = linha.insertCell();
    l6.id = (linha.id).concat("_").concat("targ");
    let l3 = linha.insertCell();
    l3.id = (linha.id).concat("_").concat("status");
    let l4 = linha.insertCell();
    l4.id = (linha.id).concat("_").concat("score");
    // let l5 = linha.insertCell();
    // l5.id = (linha.id).concat("_").concat("fitness");
    let l7 = linha.insertCell();
    l7.id = (linha.id).concat("_").concat("dist");
  }

  background(255);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j].show();
    }
  }
}

function draw() {

  let speed = speedSlider.value();
  speedSpan.html(speed);
  let mappedSpeed = speed;
  if (speed < 1) {
    mappedSpeed = 1;
  } else {
    mappedSpeed = speed;
  }
  for (let n = 0; n < mappedSpeed; n++) {
    if (speed < 1) {
      fps = parseInt(map(speed, 0, -10, 50, 1));
      frameRate(fps);
    } else {
      frameRate(60);
    }
    if (runBest) {
      bestAgent.think(grid);
      bestAgent.update();

      if (bestAgent.invalidPosition) {
        bestAgent.dispose();
        resetGame();
      }

      if (bestAgent.standTime > 30) {
        bestAgent.dispose();
        resetGame();
      }

      if (bestAgent.repetitionMovementCount > 3) {
        bestAgent.dispose();
        resetGame();
      }

      if (bestAgent.timeWithoutHittingTarget > 1000) {
        bestAgent.dispose();
        resetGame();
      }
    } else {
      for (let k = activeAgents.length - 1; k >= 0; k--) {
        let agent = activeAgents[k];
        agent.think(grid);
        agent.update();
        agent.previouscell.show();
        agent.cell.show();

        if (k == 200) {
          for (var i = 1; i < activeAgents[k].previousBestPath.length; i++) {
            grid[activeAgents[k].previousBestPath[i].x][activeAgents[k].previousBestPath[i].y].show();
          }
          noFill();
          stroke(255, 255, 255);
          beginShape();
          for (var i = 1; i < activeAgents[k].bestPath.length; i++) {
            vertex(activeAgents[k].bestPath[i].x * w + w / 2, activeAgents[k].bestPath[i].y * h + h / 2);
            //grid[activeAgents[k].bestPath[i].x][activeAgents[k].bestPath[i].y].show(color(238,255,65));
          }
          endShape();
        }

        updateAgentTableLine(allAgents.indexOf(activeAgents[k]));

        if (agent.invalidPosition || agent.standTime > 30 || agent.repetitionMovementCount > 4) { //  || agent.timeWithoutHittingTarget > 300 || agent.hitCount > 10
          agent.dispose();
          agent.cell.show();
          updateAgentTableLine(allAgents.indexOf(activeAgents[k]));
          activeAgents.splice(k, 1);
          break;
        }
      }
    }
  }

  let tempHighScore = 0;
  if (!runBest) {
    let tempBestAgent = null;
    for (let i = 0; i < activeAgents.length; i++) {
      let s = activeAgents[i].score;
      if (s > tempHighScore) {
        tempHighScore = s;
        tempBestAgent = activeAgents[i];
      }
    }
    if (tempHighScore >= highScore) {
      highScore = tempHighScore;
      bestAgent = tempBestAgent;
    }
  } else {
    tempHighScore = bestAgent.score;
    if (tempHighScore >= highScore) {
      highScore = tempHighScore;
    }
  }
  spanActHighScore.html(tempHighScore.toFixed(2));
  spanHighScore.html(highScore);


  if (activeAgents.length == 0) {
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        grid[i][j].isTarget = false;
      }
    }

    background(255);
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        grid[i][j].show();
      }
    }
    generation++;
    spanGeneration.html(generation);
    nextGeneration();
  }
}
