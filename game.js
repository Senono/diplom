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
