
//funzione per leggere i file
function readFile(file){
  return new Promise((resolve, reject) =>{
    const reader = new FileReader();
    reader.onerror = ( ) => reject(new Error("Errore nel caricamento file"))
    reader.onload = () => resolve(reader.result)
    reader.readAsText(file, "utf-8")
  });
}


//caricamento file di salvataggio
const fileInput = document.getElementById("load-file")

document.getElementById("import-btn").addEventListener("click", async () =>{
  if(fileInput.files.length === 0){
    alert("Errore nel caricamento file")
  }

  try{
    const file = await readFile(fileInput.files[0])
    const save = JSON.parse(file)

    gameState.username = save.username
    gameState.level2Unlocked = save.level2Unlocked
    gameState.level3Unlocked = save.level3Unlocked
    gameState.CLUnlocked = save.CLUnlocked
    gameState.customLevels = save.customLevels
    gameState.deaths = save.deaths

    alert("Caricato con successo")

  }catch(error){
    alert("Errore" + error.messagge)
  }
})


//caricamento livelli custom
const levelInput = document.getElementById("load-level")

document.getElementById("importLVL-btn").addEventListener("click", async () =>{
  if(levelInput.files.length === 0){
    alert("Errore nel caricamento file")
  }

  try{
    const file = await readFile(levelInput.files[0])
    const level = JSON.parse(file)

    if(!level.spawners || !level.player || !level.duration) {
      throw new Error("File non valido")
    }

    gameState.customLevels.push(level)
    gameState.customLevels = [...gameState.customLevels]

    alert("Caricato con successo")

  }catch(error){
    alert("Errore" + error.messagge)
  }
})


//scaricare il file di salvataggio
document.getElementById("save-btn").addEventListener("click", () => {
  const data = JSON.stringify(gameState, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "savegame.json";
    a.click();
    URL.revokeObjectURL(url);
});


//scaricare la base di un livello custom
document.getElementById("blueprint").addEventListener("click", () => {
  const data = JSON.stringify(levelBP, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "level_blueprint.json";
    a.click();
    URL.revokeObjectURL(url);
});


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
let currentLevel = ""

kaboom({
    width: 1080,
    height: 720,
    background: [10,10,10],
    root: document.getElementById("game-container")
});


//oggetti per il salvataggio e per la base del livello
let gameState = {
  level2Unlocked: false,
  level3Unlocked: false,
  username: "default",
  CLUnlocked: false,
  customLevels: [],
  deaths: 0
}

let levelBP = {
  name: "",
  duration: 0,
  player: {
    x: 0,
    y: 0,
    hp: 0
  },
  spawners: [
    {
      x: 0,
      y: 0,
      rate: 0,
      dir: { x: 0, y: 0 }
    }
  ]
}

//funzioni varie per il gioco

//    funzioni per gli oggetti del gioco
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
      state: "normal",
      players: get("player"),
      n: n, //target sul player scelto dal nemico
      update(){
        player = this.players[0]
        if(doUpdate){
          this.target = player.pos.clone().add(player.targets[this.n].scale(pSize / 2))
          this.moveTo(this.target, this.speed)
        }

        if(this.state == "knocked"){
          timer = createTimer(2)
          
          
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
      destroy(b)
      
      enemy.hurt(b.damage)
    })

  return enemy
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
      enemies: 0,
      cap: 50,
      update(){
        if(doUpdate){
          const spawnPos = this.pos.add(this.dir.scale(this.dist))
          if (time() - this.lastSpawned >= this.spawnRate) {
            spawnEnemy(spawnPos)
            this.lastSpawned = time()
            this.enemies++
          }

          if(this.enemies >= this.cap){
            showGameOver()
          }
        }
        
      }
    },
    "spawner"
  ])

  return spawner
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

  createNameTag(player)

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
    gameState.deaths++
  })

  return player
}

//    funzioni per UI e logica
function createButton(label, size, p, enabled, onClick) {

  const btn = add([
    rect(200, 50),
    pos(p),
    anchor("center"),
    area(),
    fixed(),
    z(200),
    color(80, 80, 80),
    "button",
  ])

  const txt = add([
    text(enabled ? label : "🔒", { size: size }),
    pos(p),
    anchor("center"),
    fixed(),
    z(201),
    color(255, 255, 255),
    "buttonText"
  ])

  btn.onClick(() => {
    if(enabled) onClick()
  })

  return { btn, txt }
}

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

function createNameTag(player){
  return add([
    text(gameState.username, {size: 10}),
    pos(),
    z(199),
    anchor("center"),
    {
      update(){
        p = player.pos.clone()
        this.pos = vec2(p.x, p.y - pSize - 5)
      }
    }
  ])
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

function createPauseMenu(){
  const pause = add([
    text("PAUSA", { size: 60 }),
    pos(width() / 2, 100),
    anchor("center"),
    z(200),
    "button"
  ])

  createButton("RESUME", 24, vec2(width() / 2, 200), true, () => {
    const obj = get("button")
    for(o in obj) obj[o].destroy()
    doUpdate = true
  })

  createButton("RESTART", 24, vec2(width() / 2, 300), true, () => { go(currentLevel)})

  createButton("MENU", 24, vec2(width() / 2, 400), true, () => { go("game")})
}

function createCustomLevel(levelData) {

  scene("customLevel", () => {
    currentLevel = "customLevel"
    doUpdate = true

    // Player
    const player = spawnPlayer(vec2(
      levelData.player.x,
      levelData.player.y
    ))
    player.maxHP = levelData.player.hp
    createHealthBar(player, levelData.player.hp)

    // Spawners
    levelData.spawners.forEach(s => {
      createSpawner(
        vec2(s.x, s.y),
        s.rate,
        vec2(s.dir.x, s.dir.y)
      )
    })

    // Timer
    const timer = createTimer(levelData.duration)

    onUpdate(() => {
      timer.update()
      if (timer.isOver()) {
        go("levelComplete")
      }
    })

    onKeyPress("k", () => {
      doUpdate = false
      createPauseMenu()
    })

    onKeyPress("r", () => {
      go("customLevel")
    })
  })

  go("customLevel")
}

//scene del gioco
scene("levelComplete", ()=> {
  add([
    area(100, 30),
    text("LEVEL COMPLETED", { size: 48 }),
    pos(width() / 2, height() / 2),
    anchor("center"),
    fixed(),
    z(100),
  ])

  createButton("TORNA AL MENU", 24, vec2(width() / 2, 600), true, () => { go("game") })
})

scene("level1", () => {
  currentLevel = "level1"
  doUpdate = true
  player = spawnPlayer(vec2(100, height() / 2))
  createHealthBar(player, 5)

  spawner = createSpawner(vec2(1000, 360), 3, vec2(-1, 0))
  
  timer = createTimer(30)

  onUpdate(() => {
    timer.update()

    if (timer.isOver()) {
      go("levelComplete")
      gameState.level2Unlocked = true
    }
    
  })

  onKeyPress("k", () => {
    doUpdate = false
    createPauseMenu()
  })

  onKeyPress("r", () => {
    go("level1")
  })
})

scene("level2", () => {
  currentLevel = "level2"
  doUpdate = true
  player = spawnPlayer(vec2(width() / 2, height() / 2))
  createHealthBar(player, 5)

  spawner1 = createSpawner(vec2(1000, 360), 3, vec2(-1, 0))

  spawner2 = createSpawner(vec2(100, 360), 3, vec2(1, 0))
  
  timer = createTimer(45)

  onUpdate(() => {
    timer.update()

    if (timer.isOver()) {
      go("levelComplete")
      gameState.level3Unlocked = true
    }
    
  })

  onKeyPress("k", () => {
    doUpdate = false
    createPauseMenu()
  })

  onKeyPress("r", () => {
    go("level2")
  })
})

scene("level3", () => {
  currentLevel = "level3"
  doUpdate = true
  player = spawnPlayer(vec2(width() / 2, height() / 2))
  createHealthBar(player, 5)

  spawner1 = createSpawner(vec2(1000, 360), 3, vec2(-1, 0))

  spawner2 = createSpawner(vec2(100, 360), 3, vec2(1, 0))
  
  timer = createTimer(60)

  onUpdate(() => {
    timer.update()

    if (timer.isOver()) {
      gamestate.CLUnlocked = true
      go("levelComplete")
    }
    
  })

  onKeyPress("k", () => {
    doUpdate = false
    createPauseMenu()
  })

  onKeyPress("r", () => {
    go("level3")
  })
})

function createScrollableButtonList(items, startPos, onSelect) {

  const ITEM_HEIGHT = 70
  const VIEW_HEIGHT = 300

  let scrollOffset = 0
  const buttons = []

  // background lista
  add([
    rect(260, VIEW_HEIGHT),
    pos(startPos),
    anchor("center"),
    fixed(),
    z(150),
    color(30, 30, 30),
  ])

  items.forEach((item, i) => {

    const baseY =
      startPos.y - VIEW_HEIGHT / 2 +
      i * ITEM_HEIGHT +
      ITEM_HEIGHT / 2

    // crea bottone e testo
    const { btn, txt } = createButton(
      item.label,
      20,
      vec2(startPos.x, baseY),
      true,
      () => onSelect(item)
    )

    btn.update = () => {
      btn.pos.y = baseY - scrollOffset

      const top = startPos.y - VIEW_HEIGHT / 2
      const bottom = startPos.y + VIEW_HEIGHT / 2

      const visible = btn.pos.y > top && btn.pos.y < bottom

      btn.hidden = !visible

      txt.pos = vec2(btn.pos.x, btn.pos.y)
      txt.hidden = !visible
    }

    buttons.push({ btn, txt })
  })

  onKeyDown("down", () => {
    scrollOffset += 300 * dt()
    scrollOffset = clamp(
      scrollOffset,
      0,
      Math.max(0, buttons.length * ITEM_HEIGHT - VIEW_HEIGHT)
    )
  })

  onKeyDown("up", () => {
    scrollOffset -= 300 * dt()
    scrollOffset = clamp(
      scrollOffset,
      0,
      Math.max(0, buttons.length * ITEM_HEIGHT - VIEW_HEIGHT)
    )
  })
}


scene("customLevels", () =>{
  const levelItems = gameState.customLevels.map((lvl, i) => ({
    label: lvl.name ?? `CUSTOM ${i + 1}`,
    data: lvl
  }))

  createScrollableButtonList(
    levelItems,
    vec2(width() / 2, height() / 2),
    (item) => {
      createCustomLevel(item.data)
      go("customLevel")
    }
  )

  createButton("INDIETRO", 24, vec2(width() / 2, height() / 2 + 300), true, () =>{
    go("game")
  })
})


scene("home", () => {
  add([
    text("PROGETTO TPS", {size: 80}),
    pos(width() / 2, 200),
    anchor("center"),
    z(200)
  ])

  createButton("GIOCA", 24, vec2(width() / 2, height() / 2), true, () => {go("game")})
})

scene("game", () => {
  add([
    text("SELEZIONA IL LIVELLO", {size: 60}),
    pos(width() / 2, 100),
    anchor("center"),
    z(200)
  ])

  createButton("LIVELLO 1", 24,  vec2(width() / 2, (height() / 2) - 100), true, () => {
    go("level1")
  })

  createButton("LIVELLO 2", 24, vec2(width() / 2, height() / 2), gameState.level2Unlocked, () => {
    go("level2")
  })

  createButton("LIVELLO 3", 24, vec2(width() / 2, (height() / 2) + 100), gameState.level3Unlocked, () => {
    go("level3")
  })

  createButton("LIVELLI CUSTOM", 24, vec2(width() / 2, (height() / 2) + 200), gameState.CLUnlocked, () =>{
    go("customLevels")
  })

  createButton("INDIETRO", 24, vec2(width() / 2, height() / 2 + 300), true, () => {
    go("home")
  })
})

go("home")



