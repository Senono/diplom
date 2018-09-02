'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  
  plus(vector) {
    if (!(vector instanceof Vector)) {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }
    return new Vector(this.x + vector.x, this.y + vector.y);
  }
  
  times(multiplier) {
    return new Vector(this.x * multiplier, this.y * multiplier);
  }
}

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
      throw new Error()
    }
    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }
  
  act() {
  }
  
  get left() {
    return this.pos.x;
  }
  
  get top() {
    return this.pos.y;
  }
  
  get right() {
    return this.pos.x + this.size.x;
  }
  
  get bottom() {
    return this.pos.y + this.size.y;
  }
  
  get type() {
    return 'actor';
  }
  
  isIntersect(actor) {
    if (!(actor instanceof Actor) || arguments.length === 0) {
      throw new Error();
    }
    
    return !(actor === this || this.left >= actor.right || this.top >= actor.bottom || actor.left >= this.right || actor.top >= this.bottom);
  }
}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.player = this.actors.find(actor => actor.type === 'player');
    this.height = grid.length;
    this.width = Math.max(0, ...this.grid.map(value => value.length));
    this.status = null;
    this.finishDelay = 1;
  }
  
  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }
  
  actorAt(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error();
    }
    
    return this.actors.find(at => at.isIntersect(actor));
  }
  
  obstacleAt(pos, size) {
    if (!(pos instanceof Vector) || !(size instanceof Vector)) {
      throw new Error();
    }
    
    let actor = new Actor(pos, size);
    
    if (actor.bottom > this.height) {
      return 'lava';
    }
    
    if (actor.top < 0 || actor.left < 0 || actor.right > this.width) {
      return 'wall';
    }
    
    for (let i = Math.floor(actor.left); i < actor.right; i++) {
      for (let j = Math.floor(actor.top); j < actor.bottom; j++) {
        if (this.grid[j][i] !== undefined) {
          return this.grid[j][i];
        }
      }
    }
    
    return undefined;
  }
  
  removeActor(actor) {
    let index = this.actors.findIndex(find => find === actor);
    this.actors.splice(index, 1);
  }
  
  noMoreActors(type) {
    return this.actors.every(actor => actor.type !== type);
  }
  
  playerTouched(type, actor) {
    if (this.isFinished()) {
      return;
    }
    
    if (type === 'lava' || type === 'fireball') {
      this.status = 'lost';
    }
    
    if (type === 'coin' && actor !== undefined && actor.type === 'coin') {
      this.removeActor(actor);
      if (this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }
  }
}

class LevelParser {
  constructor(obj) {
    this.obj = obj;
  }
  
  actorFromSymbol(symbol) {
    if (this.obj !== undefined && symbol !== undefined && symbol in this.obj) {
      return this.obj[symbol];
    }
    return undefined;
  }
  
  obstacleFromSymbol(symbol) {
    switch (symbol) {
      case 'x':
        return 'wall';
      case '!':
        return 'lava';
      default:
        return undefined;
    }
  }
  
  createGrid(arr) {
    let grid = [];
    for (let i = 0; i < arr.length; i++) {
      let strArr = [];
      for (let g = 0; g < arr[i].length; g++) {
        strArr.push(this.obstacleFromSymbol(arr[i].charAt(g)));
      }
      grid.push(strArr);
    }
    return grid;
  }
  
  createActors(arr) {
    let actors = [];
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr[i].length; j++) {
        let actor = this.actorFromSymbol(arr[i].charAt(j));
        if (actor !== undefined && typeof actor === 'function') {
          let instance = new actor(new Vector(j, i));
          if (instance instanceof Actor) {
            actors.push(instance);
          }
        }
      }
    }
    return actors;
  }
  
  parse(arr) {
    return new Level(this.createGrid(arr), this.createActors(arr))
  }
}

class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(pos, new Vector(1, 1), speed);
  }
  
  get type() {
    return 'fireball';
  }
  
  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }
  
  handleObstacle() {
    this.speed = this.speed.times(-1);
  }
  
  act(time, level) {
    let nextPos = this.getNextPosition(time);
    if (level.obstacleAt(nextPos, this.size) === undefined) {
      this.pos = nextPos;
    } else {
      this.handleObstacle();
    }
  }
  
  
}

class HorizontalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(2, 0))
  }
}

class VerticalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 2))
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 3));
    this.currentPos = pos;
  }
  
  handleObstacle() {
    this.pos = this.currentPos;
  }
}

class Coin extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.floor(Math.random() * (Math.PI * 2));
    this.currentPos = pos;
  }
  
  get type() {
    return 'coin';
  }
  
  updateSpring(time = 1) {
    this.spring = this.spring + this.springSpeed * time;
  }
  
  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }
  
  getNextPosition(time = 1) {
    this.spring += this.springSpeed * time;
    return this.currentPos.plus(this.getSpringVector());
  }
}


