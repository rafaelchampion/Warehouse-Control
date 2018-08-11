class Cell {
  constructor(i, j) {
    this.x = i;
    this.y = j;
    this.wall = false;
    this.agent = [];
    this.shelf = false;
    this.isTarget = false;
    this.receptor = false;
    this.cellUp;
    this.cellRight;
    this.cellDown;
    this.cellLeft;
    this.depositAreaEntrance = false;
    this.depositAreaExit = false;
    this.f = 0;
    this.g = 0;
    this.h = 0;
    this.previous = undefined;
    this.neighbors = [];
  }

  show(color) {
    if (color != undefined) {
      fill(color);
    } else {
      fill(69, 90, 100);
    }
    if (this.wall) {
      fill(0);
    }
    if (this.shelf) {
      fill(38, 166, 154);
    }
    if (this.isTarget) {
      if (this.shelf) {
        fill(24, 255, 255);
      } else {

      }
    }
    if (this.receptor) {
      fill(155, 130, 200);
    }
    if (this.depositAreaEntrance) {
      fill(255, 214, 0);
    }
    if (this.depositAreaExit) {
      fill(0, 229, 255);
    }
    stroke(55, 71, 79);
    strokeWeight(2);
    rect(this.x * w, this.y * h, w - 1, h - 1);
    if (this.agent.length > 0) {
      fill(255);
      for (let i = 0; i < this.agent.length; i++) {
        if (this.agent[i].activeShelf != undefined) {
          if (this.agent[i].status == "returning" || this.agent[i].status == "delivered") {
            fill(120, 210, 110);
          } else if (this.agent[i].status == "carrying" || this.agent[i].status == "inDeliveryZone") {
            fill(255, 210, 150);
          } else {
            fill(24, 255, 255);
          }
        }
      }
      ellipse(this.x * w + w / 2, this.y * h + h / 2, w - 1, h - 1);
    }
    if (color != undefined) {
      fill(color);
      rect(this.x * w, this.y * h, w - 1, h - 1);
    }
  }

  addNeighbors(grid) {
    let x = this.x;
    let y = this.y;
    if (x < cols - 1) {
      this.cellRight = grid[x + 1][y];
    }
    if (x > 0) {
      this.cellLeft = grid[x - 1][y];
    }
    if (y < rows - 1) {
      this.cellUp = grid[x][y - 1];
    }
    if (y > 0) {
      this.cellDown = grid[x][y + 1];
    }
  }

  getNeighbors() {
    if (!this.neighbors) {
      this.populateNeighbors();
    }
    return this.neighbors;
  }

  populateNeighbors() {
    this.neighbors = [];
    this.neighboringWalls = [];

    //Add Left/Up/Right/Down Moves
    for (var i = 0; i < 4; i++) {
      var node = this.getNode(this.i + LURDMoves[i][0], this.j + LURDMoves[i][1]);
      if (node != null) {
        if (!node.wall && !node.shelf) {
          this.neighbors.push(node);
        } else {
          this.neighboringWalls.push(node);
        }
      }
    }

    //Add Diagonals

    for (var i = 0; i < 4; i++) {
      var gridX = this.i + DiagonalMoves[i][0];
      var gridY = this.j + DiagonalMoves[i][1];

      var node = this.getNode(gridX, gridY);

      if (node != null) {
        if (allowDiagonals && !node.wall) {
          if (!canPassThroughCorners) {
            //Check if blocked by surrounding walls
            var border1 = DiagonalBlockers[i][0];
            var border2 = DiagonalBlockers[i][1];
            //no need to protect against OOB as diagonal move
            //check ensures that blocker refs must be valid
            var blocker1 = this.grid[this.i + LURDMoves[border1][0]]
              [this.j + LURDMoves[border1][1]];
            var blocker2 = this.grid[this.i + LURDMoves[border2][0]]
              [this.j + LURDMoves[border2][1]];


            if (!blocker1.wall || !blocker2.wall) {
              //one or both are open so we can move past
              this.neighbors.push(node);
            }
          } else {
            this.neighbors.push(node);
          }
        }
        if (node.wall) {
          this.neighboringWalls.push(node);
        }
      }
    }
  }
}