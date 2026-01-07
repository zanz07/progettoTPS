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
      speed: 100,
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
      weapons : [gun(this)],
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
      p = player.pos.clone()
      d = vec2(1, 0)

      if (time() - player.lastShot >= player.fireRate) {
          spawnBullet(p,d, 1)
          player.lastShot = time()
      }
  })

  onKeyDown("left", () => {
      p = player.pos.clone()
      d = vec2(-1, 0)

      if (time() - player.lastShot >= player.fireRate) {
          spawnBullet(p,d, 1)
          player.lastShot = time()
      }
  })

  onKeyDown("up", () => {
      p = player.pos.clone()
      d = vec2(0, -1)

      if (time() - player.lastShot >= player.fireRate) {
          spawnBullet(p,d, 1)
          player.lastShot = time()
      }
  })

  onKeyDown("down", () => {
      p = player.pos.clone()
      d = vec2(0, 1)

      if (time() - player.lastShot >= player.fireRate) {
          spawnBullet(p,d, 1)
          player.lastShot = time()
      }
  })

  player.onCollide("enemy", () => {
    player.hurt(1)
  })

  return player
}

function createSpawner(p, rate){
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
      dir: vec2(-1, 0),
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

function gun(player){
  const gun = add([
    pos(vec2(0, 0)),
    {
      fireRate : 0.75,
      lastShot : 0,
      damage : 1,
      update(){
        this.pos = player.pos.clone()
      },
      shoot(dir){
        if (time() - this.lastShot >= this.fireRate) {
          spawnBullet(this.pos, dir, this.damage)
          this.lastShot = time()
      }
      }
    }
  ])

  return gun
}

scene("level1", () => {
  player = spawnPlayer(vec2(100, 100))

  spawner = createSpawner(vec2(1000, 360), 3)

  
  //pausing
    onKeyPress("space", () => {
      doUpdate = !doUpdate
    })
})

go("level1")




