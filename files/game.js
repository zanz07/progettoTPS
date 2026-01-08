function moveTowards(current, target, maxDelta) {
  const diff = target.sub(current)
  const dist = diff.len()

  if (dist <= maxDelta || dist === 0) {
    return target
  }

  return current.add(diff.scale(maxDelta / dist))
}

pSize = 32
pBulletSize = 20
enemySize = 32

let doUpdate = true

kaboom({
    width:1080,
    height:720,
    background: [0,0,0],
})

function createTimer(duration) {
  return {
    time: duration,
    update() {
      if (!doUpdate) return

      this.time -= dt()
    },
    isOver() {
      return this.time <= 0
    }
  }
}

function spawnBullet(p, dir, dmg){
    return add([
    rect(pBulletSize, pBulletSize),
    pos(p),
    anchor("center"),
    color(255, 0, 0),
    area(),
    z(1),
    {
      dir: dir,
      speed: 800,
      damage: dmg,
      update(){
        if(doUpdate){
          this.move(this.dir.x * this.speed, this.dir.y * this.speed)
        }        
      }
    },
    "bullet",
    offscreen({ destroy: true }),
    ])
}

function spawnEnemy(p) {
  const n = Math.floor(Math.random() * 4);
  
  const enemy = add([
    rect(enemySize, enemySize),
    pos(p),
    anchor("center"),
    area(),
    color(255, 0, 0),
    health(3),
    {
      target: vec2(0, 0),
      speed: 300,
      n: n, //target sul player scelto dal nemico
      update(){
        if(doUpdate){
          this.target = player.pos.clone().add(player.targets[this.n].scale(pSize / 2))
          this.moveTo(this.target, this.speed)
        }
       
      }
    },
    "enemy"
  ])

  enemy.onDeath(() => {
    destroy(enemy)
  })

  enemy.onCollide("enemy", (other) => {
    const diff = enemy.pos.sub(other.pos)
    const dist = diff.len()
    const minDist = enemySize

    if (dist === 0 || dist >= minDist) return

    const strength = (minDist - dist) / minDist
    const push = diff.unit().scale(strength * 100)

    enemy.move(push)
  })

  enemy.onCollide("bullet", (b) =>{
      destroy(b),
      enemy.hurt(b.damage)
    })

  return enemy
}

function gun(player) {
  return {
    fireRate: 0.5,
    lastShot: 0,
    damage: 1,

    shoot() {
      if (player.shootingDir.len() === 0) return

      if (time() - this.lastShot >= this.fireRate) {
        spawnBullet(
          player.pos.clone(),
          player.shootingDir.clone(),
          this.damage
        )
        this.lastShot = time()
      }
    }
  }
}

function spawnPlayer(p){
  const player = add([
    rect(pSize, pSize),
    pos(p),
    anchor("center"),
    color(0, 0, 255),
    area(),
    z(2),
    health(5),
    {
      dir: vec2(0, 0),
      vel: vec2(0, 0),
      maxSpeed: 500,
      accel: 5000,
      friction: 7500,
      weapons : [],
      currentWeapon: 0,
      shootingDir: vec2(0, 0),
      targets: [
        vec2(1, 0),
        vec2(0, 1),
        vec2(-1, 0),
        vec2(0, -1)
      ],
      update() {
        if(doUpdate){
          let input = this.dir.clone()
          if (input.len() > 0) {
            input = input.unit()
          }

          const target = input.scale(this.maxSpeed)

          const rate = input.len() > 0 ? this.accel : this.friction

          this.vel = moveTowards(this.vel, target, rate * dt())

          this.move(this.vel)
        }
        
      }
    },
    "player",
  ])

  player.weapons.push(gun(player))

  //moving right
  onKeyDown("d", () => {
    player.dir.x = 1
  })
  onKeyRelease("d", () => {
    player.dir.x = 0
  })
  //moving left
  onKeyDown("a", () => {
    player.dir.x = -1
  })
  onKeyRelease("a", () => {
    player.dir.x = 0
  })
  //moving up
  onKeyDown("w", () => {
    player.dir.y = -1
  })
  onKeyRelease("w", () => {
    player.dir.y = 0
  })
  //moving down
  onKeyDown("s", () => {
    player.dir.y = 1
  })
  onKeyRelease("s", () => {
    player.dir.y = 0
  })

  //shooting

  onKeyDown("right", () => {
    player.shootingDir = vec2(1, 0)
    player.weapons[player.currentWeapon].shoot()
  })

  onKeyDown("left", () => {
    player.shootingDir = vec2(-1, 0)
    player.weapons[player.currentWeapon].shoot()
  })

  onKeyDown("up", () => {
    player.shootingDir = vec2(0, -1)
    player.weapons[player.currentWeapon].shoot()
  })

  onKeyDown("down", () => {
    player.shootingDir = vec2(0, 1)
    player.weapons[player.currentWeapon].shoot()
  })

  player.onCollide("enemy", () => {
    player.hurt(1)
  })

  player.onDeath(() => {
    doUpdate = false
    showGameOver()
  })

  return player
}

function createHealthBar(entity, maxHealth) {

  const width = 200
  const height = 20

  const bg = add([
    rect(width, height),
    pos(20, 20),
    color(100, 0, 0),
    fixed(),   // 👈 NON segue la camera
    z(100),
  ])

  const bar = add([
    rect(width, height),
    pos(20, 20),
    color(0, 200, 0),
    fixed(),
    z(101),
    {
      update() {
        const ratio = entity.hp() / maxHealth
        this.width = width * Math.max(ratio, 0)
      }
    }
  ])

  return {bg, bar}
}

function showGameOver() {
  add([
    text("GAME OVER", { size: 48 }),
    pos(width() / 2, height() / 2),
    anchor("center"),
    fixed(),
    z(100),
    color(255, 0, 0),
  ])

  add([
    text("Premi R per ricominciare", { size: 16 }),
    pos(width() / 2, height() / 2 + 60),
    anchor("center"),
    fixed(),
    z(100),
  ])
}

function levelCompleted() {
  add([
    text("YOU WIN", { size: 32 }),
    pos(width() / 2, height() / 2),
    anchor("center"),
    fixed(),
    z(100),
    color(255, 0, 0),
    {
      timer: createTimer(3),
      update() {
        this.timer.update()
        if (timer.isOver()) {
          go("levelComplete")
        }
      }
    }
  ])
}

function createSpawner(p, rate, dir){
  const spawner = add([
    rect(64, 64),
    pos(p),
    anchor("center"),
    area(),
    health(20),
    color(255, 0, 255),
    z(2),
    {
      lastSpawned: 0,
      spawnRate: rate,
      dir: dir,
      dist: 50,
      update(){
        if(doUpdate){
          const spawnPos = this.pos.add(this.dir.scale(this.dist))
          if (time() - this.lastSpawned >= this.spawnRate) {
            spawnEnemy(spawnPos)
            this.lastSpawned = time()
          }
        }
        
      }
    },
    "spawner"
  ])

  return spawner
}

scene("levelComplete", ()=> {
  add([
    area(100, 30),
    text("LEVEL COMPLETED", { size: 48 }),
    pos(width() / 2, height() / 2),
    anchor("center"),
    fixed(),
    z(100),
  ])
})

scene("level1", () => {
  player = spawnPlayer(vec2(100, height() / 2))
  createHealthBar(player, 5)

  spawner = createSpawner(vec2(1000, 360), 3, vec2(-1, 0))
  
  timer = createTimer(30)

  onUpdate(() => {
    timer.update()

    if (timer.isOver()) {
      levelCompleted()
    }
    
  })

  //pausing
  onKeyPress("space", () => {
    if (!timer.isOver()) {
      doUpdate = !doUpdate 
    }
  })

  onKeyPress("r", () => {
    go("level1")
  })
})

scene("level2", () => {
  player = spawnPlayer(vec2(width() / 2, height() / 2))
  createHealthBar(player, 5)

  spawner1 = createSpawner(vec2(1000, 360), 3, vec2(-1, 0))

  spawner2 = createSpawner(vec2(100, 360), 3, vec2(1, 0))
  
  timer = createTimer(45)

  onUpdate(() => {
    timer.update()

    if (timer.isOver()) {
      levelCompleted()
    }
    
  })

  //pausing
  onKeyPress("space", () => {
    if (!timer.isOver()) {
      doUpdate = !doUpdate 
    }
  })

  onKeyPress("r", () => {
    go("level2")
  })
})

scene("level3", () => {
  player = spawnPlayer(vec2(width() / 2, height() / 2))
  createHealthBar(player, 5)

  spawner1 = createSpawner(vec2(1000, 360), 3, vec2(-1, 0))

  spawner2 = createSpawner(vec2(100, 360), 3, vec2(1, 0))
  
  timer = createTimer(60)

  onUpdate(() => {
    timer.update()

    if (timer.isOver()) {
      levelCompleted()
    }
    
  })

  //pausing
  onKeyPress("space", () => {
    if (!timer.isOver()) {
      doUpdate = !doUpdate 
    }
  })

  onKeyPress("r", () => {
    go("level3")
  })
})

scene("home", () => {
  
})

scene("game", () => {
  
})

go("level2")


