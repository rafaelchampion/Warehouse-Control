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
  constructor(name, grid, brain) {
    this.name = this.generateName();
    this.r = 12;
    this.score = 0;
    this.fitness = 0;
    this.distanceToTargetX;
    this.distanceToTargetY;
    this.invalidPosition = false;
    this.cellsMoved = 0;
    this.standTime = 0;
    this.lastMovement = "";
    this.repetitionMovementCount = 0;
    this.timeWithoutHittingTarget = 0;
    this.status = "active";
    this.activeShelf;
    let randX;
    let randY;
    do {
      randX = Math.floor(Math.random() * grid[0].length);
      randY = Math.floor(Math.random() * grid.length);
    } while (grid[randX][randY].agent != undefined || grid[randX][randY].shelf == true || grid[randX][randY].wall == true);
    this.cell = grid[randX][randY];
    this.previouscell = this.cell;

    this.getTarget();

    if (brain instanceof NeuralNetwork) {
      this.brain = brain.copy();
      this.brain.mutate(mutate);
    } else {
      this.brain = new NeuralNetwork(22, 8, 5);
    }
  }

  copy() {
    return new Agent(this.generateName(), grid, this.brain);
  }

  generateName() {
    let abc = "abcdefghijklmnopqrstuvwxyz1234567890".split("");
    let token = "";
    for (let i = 0; i < 32; i++) {
      token += abc[Math.floor(Math.random() * abc.length)];
    }
    return token;
  }

  getTarget() {
    if (this.status == "carrying") {
      this.targetCell = grid[grid.length / 2][grid[0].length - 2];
    } else if (this.status == "returning") {
      debugger;
      this.targetCell = this.activeShelf;
    } else {
      let randX;
      let randY;
      do {
        randX = Math.floor(Math.random() * grid[0].length);
        randY = Math.floor(Math.random() * grid.length);
      } while (grid[randX][randY].shelf == false || grid[randX][randY].isTarget === true && (randX == this.cell.x && randY == this.cell.y));
      this.targetCell = grid[randX][randY];
    }
    grid[this.targetCell.x][this.targetCell.y].isTarget = true;
  }

  // TODO: refatorar para funcionar de outra forma porque desta maneira só destrói o agente responsável pela colisão, e não o agente colidido.
  hits() {
    if (this.cell.shelf && (this.targetCell.x != this.cell.x || this.targetCell.y != this.cell.y)) {
      this.invalidPosition = true;
    }

    if (this.cell.wall) {
      this.invalidPosition = true;
    }

    if (grid[this.cell.x][this.cell.y].agent != undefined) {
      if (grid[this.cell.x][this.cell.y].agent.name != this.name) {
        this.invalidPosition = true;
      }
    }
  }

  think(grid) {
    let targetX = this.targetCell.x;
    let targetY = this.targetCell.y;
    let cellUpIsWall = this.cell.cellUp != undefined ? this.cell.cellUp.wall : false;
    let cellUpIsAgent = this.cell.cellUp != undefined ? this.cell.cellUp.agent != undefined : false;
    let cellUpIsShelf = this.cell.cellUp != undefined && !(this.cell.y - this.targetCell.y == 1 && this.cell.x == this.targetCell.x) ? this.cell.cellUp.shelf : false;
    let cellRightIsWall = this.cell.cellRight != undefined ? this.cell.cellRight.wall : false;
    let cellRightIsAgent = this.cell.cellRight != undefined ? this.cell.cellRight.agent != undefined : false;
    let cellRightIsShelf = this.cell.cellRight != undefined && !(this.cell.y == this.targetCell.y && this.targetCell.x - this.cell.x == 1) ? this.cell.cellRight.shelf : false;
    let cellDownIsWall = this.cell.cellDown != undefined ? this.cell.cellDown.wall : false;
    let cellDownIsAgent = this.cell.cellDown != undefined ? this.cell.cellDown.agent != undefined : false;
    let cellDownIsShelf = this.cell.cellDown != undefined && !(this.targetCell.y - this.cell.y == 1 && this.cell.x == this.targetCell.x) ? this.cell.cellDown.shelf : false;
    let cellLeftIsWall = this.cell.cellLeft != undefined ? this.cell.cellLeft.wall : false;
    let cellLeftIsAgent = this.cell.cellLeft != undefined ? this.cell.cellLeft.agent != undefined : false;
    let cellLeftIsShelf = this.cell.cellLeft != undefined && !(this.cell.y == this.targetCell.y && this.cell.x - this.targetCell.x == 1) ? this.cell.cellLeft.shelf : false;
    let distanceToTargetX = Math.abs(this.targetCell.x - this.cell.x);
    let distanceToTargetY = Math.abs(this.targetCell.y - this.cell.y);
    let targetIsUp = this.cell.y > this.targetCell.y ? true : false;
    let targetIsRight = this.cell.x < this.targetCell.x ? true : false;
    let targetIsDown = this.cell.y < this.targetCell.y ? true : false;
    let targetIsLeft = this.cell.x > this.targetCell.x ? true : false
    let cellUpIsTarget = (this.cell.y - this.targetCell.y == 1 && this.cell.x == this.targetCell.x) ? true : false;
    let cellRightIsTarget = (this.cell.y == this.targetCell.y && this.targetCell.x - this.cell.x == 1) ? true : false;
    let cellDownIsTarget = (this.targetCell.y - this.cell.y == 1 && this.cell.x == this.targetCell.x) ? true : false;
    let cellLeftIsTarget = (this.cell.y == this.targetCell.y && this.cell.x - this.targetCell.x == 1) ? true : false;
    let inputs = [];
    inputs[0] = cellUpIsWall ? 1 : 0;
    inputs[1] = cellUpIsAgent ? 1 : 0;
    inputs[2] = cellUpIsShelf ? 1 : 0;
    inputs[3] = cellRightIsWall ? 1 : 0;
    inputs[4] = cellRightIsAgent ? 1 : 0;
    inputs[5] = cellRightIsShelf ? 1 : 0;
    inputs[6] = cellDownIsWall ? 1 : 0;
    inputs[7] = cellDownIsAgent ? 1 : 0;
    inputs[8] = cellDownIsShelf ? 1 : 0;
    inputs[9] = cellLeftIsWall ? 1 : 0;
    inputs[10] = cellLeftIsAgent ? 1 : 0;
    inputs[11] = cellLeftIsShelf ? 1 : 0;
    inputs[12] = map(distanceToTargetX, 0, grid.length, 0, 1);
    inputs[13] = map(distanceToTargetY, 0, grid[0].length, 0, 1);
    inputs[14] = targetIsUp ? 1 : 0;
    inputs[15] = targetIsRight ? 1 : 0;
    inputs[16] = targetIsDown ? 1 : 0;
    inputs[17] = targetIsLeft ? 1 : 0;
    inputs[18] = cellUpIsTarget ? 1 : 0;
    inputs[19] = cellRightIsTarget ? 1 : 0;
    inputs[20] = cellDownIsTarget ? 1 : 0;
    inputs[21] = cellLeftIsTarget ? 1 : 0;

    // Get the outputs from the network
    let action = this.brain.predict(inputs);
    // Decide to jump or not!
    let move = action.indexOf(Math.max.apply(null, action));

    if (move === 0) {
      this.up(grid);
    } else if (move === 1) {
      this.down(grid);
    } else if (move === 2) {
      this.left(grid);
    } else if (move === 3) {
      this.right(grid);
    } else if (move === 4) {
      this.stand();
    }
  }

  up(grid) {
    if (this.cell.y - 1 >= 0) {
      this.updateLocation(grid, grid[this.cell.x][this.cell.y - 1]);
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
      this.updateLocation(grid, grid[this.cell.x][this.cell.y + 1]);
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
      this.updateLocation(grid, grid[this.cell.x - 1][this.cell.y]);
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
      this.updateLocation(grid, grid[this.cell.x + 1][this.cell.y]);
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
  }

  updateLocation(grid, cell) {
    this.cell.agent = undefined;
    this.previouscell = this.cell;
    this.cell = cell;
    this.cellsMoved++;
    this.standTime = 0;
    grid[cell.x][cell.y].agent = this;
    this.hits();
  }

  checkInvalidPosition(grid) {
    if (this.cell.x > grid[0].length - 1 || this.cell.y > grid.length - 1) {
      this.invalidPosition = true;
    }
  }

  dispose() {
    if (this.activeShelf != undefined) {
      grid[this.activeShelf.x][this.activeShelf.y].shelf = true;
    }
    this.cell.agent = undefined;
    grid[this.targetCell.x][this.targetCell.y].isTarget = false;
  }

  update() {
    if ((Math.abs(this.targetCell.x - this.cell.x) < Math.abs(this.targetCell.x - this.previouscell.x) || Math.abs(this.targetCell.y - this.cell.y) < Math.abs(this.targetCell.y - this.previouscell.y)) && this.standTime < 10) {
      this.score++;
    } else {
      if (this.score > 0) {
        this.score--;
      }
    }
    if (this.targetCell.x == this.cell.x && this.targetCell.y == this.cell.y) {
      debugger;
      this.score += 250;
      this.timeWithoutHittingTarget = 0;
      if (this.status == "active") {
        this.activeShelf = this.cell;
        grid[this.targetCell.x][this.targetCell.y].isTarget = false;
        grid[this.targetCell.x][this.targetCell.y].shelf = false;
        this.status = "carrying";
      } else if (this.status == "returning") {
        this.cell.shelf = true;
        this.status = "active";
        this.activeShelf = undefined;
      } else {
        this.status = "returning";
      }
      this.getTarget();
    } else {
      this.timeWithoutHittingTarget++;
    }
  }
}
