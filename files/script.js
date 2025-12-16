kaboom({
    width:1080,
    height:720,
    background: [0, 0, 0],
})

function spawnBullet(p, dir, player_dir){
    return add([
    rect(8, 8),
    pos(p),
    color(255, 100, 100),
    
    {
        dir: dir,
        speed: 600,
        update(){
            this.move(this.dir.x * this.speed, this.dir.y * this.speed)
        }
    },
    "bullet",
    offscreen({ destroy: true }),
    ])
}

const player = add([
  rect(32, 32),
  pos(100, 100),
  color(0, 0, 255),
  {
    dir: vec2(1, 0),
    fireRate: 0.25,
    lastShot: 0
  },
  "player",
])

onKeyDown("d", () => {
  player.move(200, 0)
  player.dir = vec2(1, 0)
})

onKeyDown("a", () => {
  player.move(-200, 0)
  player.dir = vec2(-1, 0)
})

onKeyDown("w", () => {
  player.move(0, -200)
  player.dir = vec2(0, -1)
})

onKeyDown("s", () => {
  player.move(0, 200)
  player.dir = vec2(0, 1)
})

onKeyDown("right", () => {
    p = player.pos.clone()
    d = vec2(1, 0)
    p.x += 12
    p.y += 12

    if (time() - player.lastShot >= player.fireRate) {
        spawnBullet(p,d)
        player.lastShot = time()
    }
})

onKeyDown("left", () => {
    p = player.pos.clone()
    d = vec2(-1, 0)
    p.x += 12
    p.y += 12

    if (time() - player.lastShot >= player.fireRate) {
        spawnBullet(p,d)
        player.lastShot = time()
    }
})

onKeyDown("up", () => {
    p = player.pos.clone()
    d = vec2(0, -1)
    p.x += 12
    p.y += 12

    if (time() - player.lastShot >= player.fireRate) {
        spawnBullet(p,d)
        player.lastShot = time()
    }
})

onKeyDown("down", () => {
    p = player.pos.clone()
    d = vec2(0, 1)
    p.x += 12
    p.y += 12

    if (time() - player.lastShot >= player.fireRate) {
        spawnBullet(p,d)
        player.lastShot = time()
    }
})
