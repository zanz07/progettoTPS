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

kaboom({
    width:1080,
    height:720,
    background: [0,0,0],
})

function spawnBullet(p, dir, player_dir){
    return add([
    rect(pBulletSize, pBulletSize),
    pos(p),
    color(255, 100, 100),
    area(),
    {
      dir: dir,
      speed: 800,
      update(){
          this.move(this.dir.x * this.speed, this.dir.y * this.speed)
      }
    },
    "bullet",
    offscreen({ destroy: true }),
    ])
}

function spawnEnemy(p) {
  return add([
    pos(p),
    area(),
    rect(enemySize, enemySize)
    
  ])
}

const player = add([
  rect(pSize, pSize),
  pos(100, 100),
  color(0, 0, 255),
  area(),
  {
    dir: vec2(0, 0),
    vel: vec2(0, 0),
    maxSpeed: 500,
    accel: 5000,
    friction: 7500,
    fireRate: 0.25,
    lastShot: 0,
    update() {
      input = this.dir.clone()
      if (input.len() > 0) {
        input = input.unit()
      }

      const target = input.scale(this.maxSpeed)

      const rate = input.len() > 0 ? this.accel : this.friction

      this.vel = moveTowards(this.vel, target, rate * dt())

      this.move(this.vel)
    }  
  },
  "player",
])

onKeyDown("d", () => {
  player.dir.x = 1
})

onKeyRelease("d", () => {
  player.dir.x = 0
})

onKeyDown("a", () => {
  player.dir.x = -1
})

onKeyRelease("a", () => {
  player.dir.x = 0
})

onKeyDown("w", () => {
  player.dir.y = -1
})

onKeyRelease("w", () => {
  player.dir.y = 0
})

onKeyDown("s", () => {
  player.dir.y = 1
})

onKeyRelease("s", () => {
  player.dir.y = 0
})

onKeyDown("right", () => {
    p = player.pos.clone()
    d = vec2(1, 0)
    p.x += pSize/2 - pBulletSize / 2
    p.y += pSize/2 - pBulletSize / 2

    if (time() - player.lastShot >= player.fireRate) {
        spawnBullet(p,d)
        player.lastShot = time()
    }
})

onKeyDown("left", () => {
    p = player.pos.clone()
    d = vec2(-1, 0)
    p.x += pSize/2 - pBulletSize / 2
    p.y += pSize/2 - pBulletSize / 2

    if (time() - player.lastShot >= player.fireRate) {
        spawnBullet(p,d)
        player.lastShot = time()
    }
})

onKeyDown("up", () => {
    p = player.pos.clone()
    d = vec2(0, -1)
    p.x += pSize/2 - pBulletSize / 2
    p.y += pSize/2 - pBulletSize / 2

    if (time() - player.lastShot >= player.fireRate) {
        spawnBullet(p,d)
        player.lastShot = time()
    }
})

onKeyDown("down", () => {
    p = player.pos.clone()
    d = vec2(0, 1)
    p.x += pSize/2 - pBulletSize / 2
    p.y += pSize/2 - pBulletSize / 2

    if (time() - player.lastShot >= player.fireRate) {
        spawnBullet(p,d)
        player.lastShot = time()
    }
})
