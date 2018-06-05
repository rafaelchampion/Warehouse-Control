function mutate(x) {
  if (random(1) < 0.1) {
    let offset = randomGaussian() * 0.5;
    let newx = x + offset;
    return newx;
  } else {
    return x;
  }
}

class Agent {
  constructor(grid, generation, brain) {
    this.name = this.generateName();
    this.score = 0;
    this.fitness = 0;
    this.invalidPosition = false;
    this.cellsMoved = 0;
    this.standTime = 0;
    this.lastMovement = "";
    this.repetitionMovementCount = 0;
    this.timeWithoutHittingTarget = 0;
    this.timesHitShlelf = 0;
    this.status = "active";
    this.activeShelf;
    this.generation = generation;
    this.hitCount = 0;
    this.previousBestPath = [];
    this.bestPath = [];
    this.bestNextCell;

    this.distanceToTargetX = 0;
    this.distanceToTargetY = 0;

    this.targetIsUp = false;
    this.targetIsRight = false;
    this.targetIsDown = false;
    this.targetIsLeft = false;

    this.cellUpIsWall = false;
    this.cellRightIsWall = false;
    this.cellDownIsWall = false;
    this.cellLeftIsWall = false;

    this.cellUpIsShelf = false;
    this.cellRightIsShelf = false;
    this.cellDownIsShelf = false;
    this.cellLeftIsShelf = false;

    this.cellUpIsAgent = false;
    this.cellRightIsAgent = false;
    this.cellDownIsAgent = false;
    this.cellLeftIsAgent = false;

    this.cellUpIsBest = false;
    this.cellRightIsBest = false;
    this.cellDownIsBest = false;
    this.cellLeftIsBest = false;

    let randX;
    let randY;
    do {
      randX = Math.floor(Math.random() * grid[0].length);
      randY = Math.floor(Math.random() * grid.length);
    } while (grid[randX][randY].agent.length > 0 || grid[randX][randY].shelf == true || grid[randX][randY].wall == true || grid[randX][randY].depositAreaEntrance == true || grid[randX][randY].depositAreaExit == true || randY == grid[0].length - 2 || randY == grid[0].length - 3);
    this.cell = grid[randX][randY];
    grid[this.cell.x][this.cell.y].agent.push(this);
    this.previouscell = this.cell;

    this.getTarget();

    if (brain instanceof NeuralNetwork) {
      this.brain = brain.copy();
      this.brain.mutate(mutate);
    } else {
      this.brain = new NeuralNetwork(24, 8, 5, this.generation);
    }
  }

  copy() {
    return new Agent(grid, this.generation + 1, this.brain);
  }

  generateName() {
    let abc = "abcdefghijklmnopqrstuvwxyz1234567890".split("");
    let token = "";
    for (let i = 0; i < 16; i++) {
      token += abc[Math.floor(Math.random() * abc.length)];
    }
    return token;
  }

  getTarget() {
    switch (this.status) {
      case "active":
        {
          let randX;
          let randY;
          do {
            randX = Math.floor(Math.random() * grid[0].length);
            randY = Math.floor(Math.random() * grid.length);
          } while (grid[randX][randY].shelf == false || grid[randX][randY].isTarget === true && (randX == this.cell.x && randY == this.cell.y));
          this.targetCell = grid[randX][randY];
          break;
        }

      case "carrying":
        {
          this.targetCell = grid[1][grid[0].length - 5];
          break;
        }

      case "inDeliveryZone":
        {
          this.targetCell = grid[grid.length / 2][grid[0].length - 2];
          break;
        }

      case "delivered":
        {
          this.targetCell = grid[grid.length - 2][grid[0].length - 5];
          break;
        }

      case "returning":
        {
          this.targetCell = this.activeShelf;
          break;
        }

      default:
        {
          break;
        }
    }
    this.targetCell.isTarget = true;
    this.targetCell.show();
  }

  hits() {
    if (this.cell.shelf && (this.targetCell.x != this.cell.x || this.targetCell.y != this.cell.y) && !(this.previouscell == this.cell)) {
      this.invalidPosition = true;
    }

    if (this.cell.wall) {
      this.invalidPosition = true;
    }

    if ((this.cell.depositAreaEntrance || this.cell.depositAreaExit) && this.activeShelf == undefined) {
      this.invalidPosition = true;
    }

    if (this.cell.agent.length > 1) {
      for (let i = 0; i < this.cell.agent.length; i++) {
        this.invalidPosition = true;
      }
    }
    this.hitCount++;
  }

  think(grid) {

    var simplifiedGrid = new Array;
    for (var i = 0; i < grid.length; i++) {
      var line = new Array;
      for (var j = 0; j < grid[0].length; j++) {
        let cell = grid[i][j];
        let blockedCell = cell.wall || (cell.shelf && cell != grid[this.targetCell.x][this.targetCell.y]) || (cell.agent.length > 0 && !(cell.agent.includes(this) && cell.agent.length == 1));
        line[j] = blockedCell ? 0 : 1;
      }
      simplifiedGrid[i] = line;
    }

    var graph = new Graph(simplifiedGrid);
    var start = graph.grid[this.cell.x][this.cell.y];
    var end = graph.grid[this.targetCell.x][this.targetCell.y];
    var result = astar.search(graph, start, end, {
      diagonal: false,
      closest: true,
    });
    this.previousBestPath = this.bestPath;
    this.bestPath = result;
    if (result.length > 0) {
      this.bestNextCell = grid[result[0].x][result[0].y];
    } else {
      this.bestNextCell = undefined;
    }

    this.updateSpacePerception();

    let inputs = [];

    //This.Position
    inputs[0] = map(this.cell.x, 0, grid.length, 0, 1);
    inputs[1] = map(this.cell.y, 0, grid[0].length, 0, 1);

    //This.TargetPosition
    inputs[2] = map(this.distanceToTargetX, 0, grid.length, 0, 1);
    inputs[3] = map(this.distanceToTargetY, 0, grid[0].length, 0, 1);

    inputs[4] = this.targetIsUp ? 1 : 0;
    inputs[5] = this.targetIsRight ? 1 : 0;
    inputs[6] = this.targetIsDown ? 1 : 0;
    inputs[7] = this.targetIsLeft ? 1 : 0;

    inputs[8] = this.cellUpIsWall ? 1 : 0;
    inputs[9] = this.cellRightIsWall ? 1 : 0;
    inputs[10] = this.cellDownIsWall ? 1 : 0;
    inputs[11] = this.cellLeftIsWall ? 1 : 0;

    inputs[12] = this.cellUpIsShelf ? 1 : 0;
    inputs[13] = this.cellRightIsShelf ? 1 : 0;
    inputs[14] = this.cellDownIsShelf ? 1 : 0;
    inputs[15] = this.cellLeftIsShelf ? 1 : 0;

    inputs[16] = this.cellUpIsAgent ? 1 : 0;
    inputs[17] = this.cellRightIsAgent ? 1 : 0;
    inputs[18] = this.cellDownIsAgent ? 1 : 0;
    inputs[19] = this.cellLeftIsAgent ? 1 : 0;

    inputs[20] = this.cellUpIsBest ? 1 : 0;
    inputs[21] = this.cellRightIsBest ? 1 : 0;
    inputs[22] = this.cellDownIsBest ? 1 : 0;
    inputs[23] = this.cellLeftIsBest ? 1 : 0;

    //MUNDO PERFEITO
    if(this.cellUpIsBest)
    {
      this.up(grid);
    }else if(this.cellRigthIsBest){
      this.right(grid);
    }
    else if(this.cellDownIsBest){
      this.down(grid);
    }
    else if(this.cellLeftIsBest){
      this.left(grid);
    }else{
      this.stand();
    }

    // let action = this.brain.predict(inputs);
    //
    // let move = action.indexOf(Math.max.apply(null, action));
    //
    // if (move === 0) {
    //   this.up(grid);
    // } else if (move === 1) {
    //   this.down(grid);
    // } else if (move === 2) {
    //   this.left(grid);
    // } else if (move === 3) {
    //   this.right(grid);
    // } else if (move === 4) {
    //   this.stand();
    //}
  }

  up(grid) {
    if (this.cell.y - 1 >= 0) {
      this.updateLocation(grid[this.cell.x][this.cell.y - 1]);
      if (this.lastMovement == "down") {
        this.repetitionMovementCount++;
      } else {
        this.repetitionMovementCount = 0;
      }
      this.lastMovement = "up";
    } else {
      this.invalidPosition = true;
    }
  }

  down(grid) {
    if (this.cell.y != grid[0].length - 1) {
      this.updateLocation(grid[this.cell.x][this.cell.y + 1]);
      if (this.lastMovement == "up") {
        this.repetitionMovementCount++;
      } else {
        this.repetitionMovementCount = 0;
      }
      this.lastMovement = "down";
    } else {
      this.invalidPosition = true;
    }
  }

  left(grid) {
    if (this.cell.x - 1 >= 0) {
      this.updateLocation(grid[this.cell.x - 1][this.cell.y]);
      if (this.lastMovement == "right") {
        this.repetitionMovementCount++;
      } else {
        this.repetitionMovementCount = 0;
      }
      this.lastMovement = "left";
    } else {
      this.invalidPosition = true;
    }
  }

  right(grid) {
    if (this.cell.x != grid.length - 1) {
      this.updateLocation(grid[this.cell.x + 1][this.cell.y]);
      if (this.lastMovement == "left") {
        this.repetitionMovementCount++;
      } else {
        this.repetitionMovementCount = 0;
      }
      this.lastMovement = "right";
    } else {
      this.invalidPosition = true;
    }
  }

  stand() {
    this.standTime++;
    //this.score--;
  }

  updateSpacePerception() {
    this.distanceToTargetX = Math.abs(this.targetCell.x - this.cell.x);
    this.distanceToTargetY = Math.abs(this.targetCell.y - this.cell.y);

    this.targetIsUp = this.cell.y > this.targetCell.y ? true : false;
    this.targetIsRight = this.cell.x < this.targetCell.x ? true : false;
    this.targetIsDown = this.cell.y < this.targetCell.y ? true : false;
    this.targetIsLeft = this.cell.x > this.targetCell.x ? true : false;

    this.cellUpIsWall = this.cell.cellUp != undefined ? this.cell.cellUp.wall : false;
    this.cellRightIsWall = this.cell.cellRight != undefined ? this.cell.cellRight.wall : false;
    this.cellDownIsWall = this.cell.cellDown != undefined ? this.cell.cellDown.wall : false;
    this.cellLeftIsWall = this.cell.cellLeft != undefined ? this.cell.cellLeft.wall : false;

    this.cellUpIsShelf = this.cell.cellUp != undefined && !(this.cell.y - this.targetCell.y == 1 && this.cell.x == this.targetCell.x) ? this.cell.cellUp.shelf : false;
    this.cellRightIsShelf = this.cell.cellRight != undefined && !(this.cell.y == this.targetCell.y && this.targetCell.x - this.cell.x == 1) ? this.cell.cellRight.shelf : false;
    this.cellDownIsShelf = this.cell.cellDown != undefined && !(this.targetCell.y - this.cell.y == 1 && this.cell.x == this.targetCell.x) ? this.cell.cellDown.shelf : false;
    this.cellLeftIsShelf = this.cell.cellLeft != undefined && !(this.cell.y == this.targetCell.y && this.cell.x - this.targetCell.x == 1) ? this.cell.cellLeft.shelf : false;

    this.cellUpIsAgent = this.cell.cellUp != undefined ? this.cell.cellUp.agent > 0 : false;
    this.cellRightIsAgent = this.cell.cellRight != undefined ? this.cell.cellRight.agent > 0 : false;
    this.cellDownIsAgent = this.cell.cellDown != undefined ? this.cell.cellDown.agent > 0 : false;
    this.cellLeftIsAgent = this.cell.cellLeft != undefined ? this.cell.cellLeft.agent > 0 : false;

    this.cellUpIsBest = grid[this.cell.x][this.cell.y - 1] == this.bestNextCell ? true : false;
    this.cellRigthIsBest = grid[this.cell.x + 1][this.cell.y] == this.bestNextCell ? true : false;
    this.cellDownIsBest = grid[this.cell.x][this.cell.y + 1] == this.bestNextCell ? true : false;
    this.cellLeftIsBest = grid[this.cell.x - 1][this.cell.y] == this.bestNextCell ? true : false;
  }

  updateLocation(cell) {
    this.cell.agent.splice(this.cell.agent.indexOf(this), 1);
    this.previouscell = this.cell;
    this.cell = cell;
    this.cellsMoved++;
    this.standTime = 0;
    this.cell.agent.push(this);
    this.hits();
  }

  checkInvalidPosition(grid) {
    if (this.cell.x > grid[0].length - 1 || this.cell.y > grid.length - 1) {
      this.invalidPosition = true;
    }
  }

  dispose() {
    // console.log(this.name, this.cell, this.previouscell, this.brain, this.score, this.fitness, this.invalidPosition, this.cellsMoved, this.standTime, this.lastMovement, this.repetitionMovementCount, this.timeWithoutHittingTarget, this.status, this.activeShelf);
    if (this.activeShelf != undefined) {
      this.activeShelf.shelf = true;
    }
    this.status = "dead";
    this.cell.agent.splice(this.cell.agent.indexOf(this), 1);
    this.targetCell.isTarget = false;
    this.cell.show();
    this.targetCell.show()
    if (this.activeShelf != undefined) {
      this.activeShelf.show()
    }
  }

  update() {
    //Caso estiver indo na direção do alvo, ganha score
    if (this.bestNextCell != undefined) {
      if (this.cell.x === this.bestNextCell.x && this.cell.y === this.bestNextCell.y) {
        this.score++
      }
    }

    // let distanceToTargetX = Math.abs(this.targetCell.x - this.cell.x);
    // let distanceToTargetY = Math.abs(this.targetCell.y - this.cell.y);
    // if ((Math.abs(this.targetCell.x - this.cell.x) < Math.abs(this.targetCell.x - this.previouscell.x) || Math.abs(this.targetCell.y - this.cell.y) < Math.abs(this.targetCell.y - this.previouscell.y)) && this.standTime < 10) {
    //   // if(this.score == 0)
    //   // {
    //   //   this.score = 1;
    //   // }
    //   // else {
    //   //   console.log(this.score);
    //   //   debugger;
    //   //   this.score = parseFloat(this.score + (1 - ((distanceToTargetX + distanceToTargetY)/100*this.score))).toFixed(2);
    //   // }
    //   this.score++;
    // } else {
    //   //Caso estiver se afastando do alvo, subtrai o score
    //   if (this.score > 0) {
    //     this.score--;;
    //     this.score = parseFloat((this.score - ((distanceToTargetX + distanceToTargetY) / 100 * this.score)).toFixed(2));
    //   }
    // }

    //Se atingiu o alvo, ganha 50 de score e muda o alvo
    if (this.targetCell.x == this.cell.x && this.targetCell.y == this.cell.y) {
      this.timeWithoutHittingTarget = 0;
      this.score += 50;
      //this.score++;
      switch (this.status) {
        //Caso estiver ativo quando atingir o alvo, significa que pegou a prateleira
        case "active":
          {
            //Determina a célula atual como prateleira ativa do agente
            this.activeShelf = this.cell;
            //Muda o status da célula atual para não alvo
            this.targetCell.isTarget = false;
            //Remove o status de prateleira da célula atual
            this.targetCell.shelf = false;
            //Muda o status pra carregando
            this.status = "carrying";
            break;
          }
          //Caso o status for carregando, se atingir o alvo significa que entrou na área de depósito
        case "carrying":
          {
            //Muda o status para em área de depósito
            this.status = "inDeliveryZone";
            break;
          }
        case "inDeliveryZone":
          {
            this.status = "delivered";
            break;
          }
        case "delivered":
          {
            this.status = "returning";
            break;
          }
        case "returning":
          {
            this.cell.shelf = true;
            this.status = "active";
            this.targetCell.isTarget = false;
            this.activeShelf = undefined;
            break;
          }
        default:
          {
            break;
          }
      }
      this.getTarget();
    } else {
      this.timeWithoutHittingTarget++;
    }
  }
}
