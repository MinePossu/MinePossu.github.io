import * as Overlay from "./overlay.js";
//import * as scengi from "./scriptengine.js";


export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');

const winnoise = new Audio('sounds/win.mp3');
const death = new Audio('sounds/death.wav');
const musa = new Audio('sounds/musa.mp3');
musa.loop = true

window.musa = function() { //to bypass the auto play music restriction on firefox
  musa.play();
  musa.volume = 0.2
}
//do not the code
//do not the

//fuck fuck fuck

window.TILE_SIZE = 64;
window.mapData = {}; //allows for some cursed shit
window.tileImages = {};
let entityImages = {};

export let overlay = false;
let overlay2 = 0;
let yesEval = 2

window.dbg = false; //debug //dbg = !dbg

let lastMoveTime = 0;
const moveCooldown = 150; // milliseconds between moves

export let camera = {
  x: 0,
  y: 0
};

//credits
console.log("A game by @MinePossu & @ahma"); //:3
console.log("The tiles are either drawn or just a snapped picture gimped with the tile seamless");

// where map
let maptoken = new URLSearchParams(window.location.search).get('map');
export let mapURL = maptoken ? `maps/${maptoken}.json` : 'maps/map.json'; // handle loading different maps

window.loadMap = async function(mapName, direct=null) { // handles level changes
  camera.x = 0;
  camera.y = 0;
  mapURL = `maps/${mapName}.json`;
  if (direct) mapURL = direct;
  try {
    const response = await fetch(mapURL);
    const data = await response.json();
    mapData = data;
    await preloadTileImages();
    await preloadEntityImages(); // if you're doing entities too
    draw();
  } catch (e) {
    console.error("Failed to load map:", mapName, e);
  }
}


async function preloadTileImages() {
  if (!mapData || !mapData.tiles) return;

  const tileDefs = mapData.tiles;
  let promises = [];

  for (let id in tileDefs) {
    const tile = tileDefs[id];
    let src;

    if (tile.image) {
      src = tile.image;
    } else if (tile.tilesheet && tile.size) {
      src = tile.tilesheet;
    }

    if (src) {
      let img = new Image();
      img.src = src;
      tileImages[id] = img;

      promises.push(new Promise((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn(`Failed to load tile ID ${id}: ${src}`);
          resolve();
        };
      }));
    }
  }

  if (promises.length > 0) {
    await Promise.all(promises);
  }
}


async function preloadEntityImages() {
  if (!mapData || !mapData.entities) return;

  const entityDefs = mapData.entities;
  let promises = [];

  for (const [id, entity] of Object.entries(entityDefs)) {
    if (entity.image) {
      let img = new Image();
      img.src = entity.image;
      entityImages[id] = img;

      tileImages[`__entity_${id}`] = img;  //another hack

      promises.push(new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = () => {
          console.warn(`Failed to load entity ID ${id}: ${entity.image}`);
          resolve();
        };
      }));
    }
  }

  if (promises.length > 0) {
    await Promise.all(promises);
  }
}


function drawT() { //boring function
  if (false) {          //TODO remove the following shit in if tru
  } else {  //Doing the pro gamer move and passing the whole map just as a metatile //Benefit is i don't have to deal with two seperate rendering logics
    const meta = mapData.terrain;   //NEW

    const fakeTile = {
      metatile: meta
    };

    handleMetaTile(
      fakeTile,
      -camera.x,
      -camera.y,
      mapData.terrain[0].length * TILE_SIZE,
      mapData.terrain.length * TILE_SIZE,
      1,
      0
    );
  }
}

function handleMetaTile(tile, x, y, tileSize = TILE_SIZE, tileSize2 = TILE_SIZE, depth = 1, rotation = 0) {
  const meta = tile.metatile; //the cool function allowing me to do very stupid recursive things.
  if (!meta || depth >= 10) return; //if depth over 10 we dont need to continue deepening it uwu.

  const cols = meta[0].length; //allows doing whack
  const rows = meta.length;

  const subTileSize = tileSize / cols;
  const subTileSize2 = tileSize2 / rows;

  //center
  const centerX = x + tileSize / 2;
  const centerY = y + tileSize2 / 2;

  //more fancy gpt code. But tbh this is some really whacky shit!
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-tileSize / 2, -tileSize2 / 2);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const subTileId = meta[row][col];
      const subTile = mapData.tiles[subTileId];

      const screenX = col * subTileSize;
      const screenY = row * subTileSize2;

      if (subTile) {
        handleTileBullshit(subTile)
        const nextRotation = subTile.rotation || 0;
        if (subTile.metatile) {
          handleMetaTile(subTile, screenX, screenY, subTileSize, subTileSize2, depth + 1, nextRotation);
        } else if (subTile.image && tileImages[subTileId]) {
          //ctx.drawImage(tileImages[subTileId], screenX, screenY, subTileSize, subTileSize2);
          ctx.save();
          ctx.translate(screenX + subTileSize / 2, screenY + subTileSize2 / 2);
          ctx.rotate((nextRotation * Math.PI) / 180);
          ctx.drawImage(
            tileImages[subTileId],
            -subTileSize / 2,
            -subTileSize2 / 2,
            subTileSize,
            subTileSize2
          );
          ctx.restore();


        } else if (subTile.color) {  //color
          ctx.fillStyle = subTile.color;
          ctx.fillRect(screenX, screenY, subTileSize, subTileSize2);
        } else if (subTile.tilesheet && subTile.size && typeof subTile.frame === "number") {
          const img = tileImages[subTileId];
          const [cols, rows] = subTile.size;
          const frame = subTile.frame;
          const trim = subTile.trim || 0;

          const frameW = img.width / cols;
          const frameH = img.height / rows;

          const sx = (frame % cols) * frameW + trim;
          const sy = Math.floor(frame / cols) * frameH + trim;
          const sw = frameW - trim * 2;
          const sh = frameH - trim * 2;

          ctx.save();
          ctx.translate(screenX + subTileSize / 2, screenY + subTileSize2 / 2);
          ctx.rotate((nextRotation * Math.PI) / 180);
          ctx.drawImage(
            img,
            sx, sy, sw, sh,
            -subTileSize / 2, -subTileSize2 / 2,
            subTileSize, subTileSize2
          );
          ctx.restore();
        }
 else if (!subTile.none) {
          ctx.fillStyle = "purple";
          ctx.fillRect(screenX, screenY, subTileSize, subTileSize2);
        }
      } else if (subTile === undefined || !subTile.none) {
        ctx.fillStyle = "purple";
        ctx.fillRect(screenX, screenY, subTileSize, subTileSize2);
      }
    }
  }

  ctx.restore();
}

function handleTileBullshit(tile=null,rawtile=null, screenX=null, screenY=null) {
  if (tile == null) return;
  try {
    if (tile.eval && yesEval == true) {
      eval(tile.eval) //Lmao, This will be fun
    } else if (yesEval == 2 && tile.eval) {
      yesEval = confirm("DANGER! This is stupid especially on custom maps (aka not made by MinePossu), however do you want to allow eval?")
      if (yesEval == false) return;
      if (prompt("Type in the following 'yes' to allow eval.") != 'yes') yesEval = false;
    }
  } catch (e) {
    console.log(e)
  }
}

//Overlay the entities

//function drawEntities() {
//  if (!mapData || !mapData.entities) return;
//
//  for (const [id, entity] of Object.entries(mapData.entities)) {
//    const screenX = entity.x * TILE_SIZE - camera.x;
//    const screenY = entity.y * TILE_SIZE - camera.y;
//
//    if (entity.image && entityImages[id]) {
//      ctx.drawImage(entityImages[id], screenX, screenY, TILE_SIZE, TILE_SIZE);
//    } else {
//      // Fallback if image isn't loaded
//      ctx.fillStyle = "red";
//      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
//    }
//  }
//}

function drawEntities() { // a hack to just metatile renderer
  if (!mapData || !mapData.entities) return;

  for (const [id, entity] of Object.entries(mapData.entities)) {
    const screenX = entity.x * TILE_SIZE - camera.x;
    const screenY = entity.y * TILE_SIZE - camera.y;

    // Create a fake tile using entity data
    const fakeTile = {
      metatile: [[`__entity_${id}`]]
    };

    // Inject this "entity tile" into mapData.tiles temporarily
    mapData.tiles[`__entity_${id}`] = {
      ...entity
    };

    // Use the metatile renderer
    handleMetaTile(fakeTile, screenX, screenY, TILE_SIZE, TILE_SIZE);
    delete mapData.tiles[`__entity_${id}`];
  }
}




function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawT();
  drawEntities();
  Overlay.info();
  if (dbg) Overlay.debug();
  if (overlay && overlay2 ==2) {
    Overlay.drawOverlay2();
  } else {
    overlay2 = 0;
    if (overlay) Overlay.drawOverlay();
  }
  //console.log(overlay);
}

// Handle key strokes
const keys = {};
const keysHandled = {};

window.addEventListener('keydown', e => {
  if (!keys[e.key]) {
    keys[e.key] = true;

    // Only handle once per press
    if (!keysHandled[e.key]) {
      keysHandled[e.key] = true;
      handleKeyPressOnce(e.key);
    }
  }
});

window.addEventListener('keyup', e => {
  keys[e.key] = false;
  keysHandled[e.key] = false;
});

function handleKeyPressOnce(key) {
  if (key === 'Escape') {
    overlay = !overlay;
    overlay2 = 0;
    //console.log("Overlay toggled:", overlay);
    Overlay.overlay()
  }
  // Add other key actions here
}

window.toggleoverlay = function() {
  overlay = !overlay;
}

function isWalkable(x,y) {
  if (mapData?.terrain?.[y]?.length == undefined) return false;
  if (y > mapData.terrain.length) return false;
  if (x+1 > mapData.terrain[y].length) return false;
  if (x < 0) return false;
  if (y < 0) return false;
  const tileId = mapData.terrain[y]?.[x];
  const tile = mapData.tiles?.[tileId];
    const check = Object.entries(mapData.entities)
  .filter(([key, ent]) => ent.x === x && ent.y === y);
  let quickch = check.some(([key, ent]) => ent.walk === true);
  const defaultnonmove = ["mirror", "mirrorflat", "laser", "laserrc"];

  //check.some(([key, ent]) => ent.type === "beam")
  //console.log(tile?.walk);
  if (tile?.walk == false) {
    return false;
  } else if (check.some(([key, ent]) => defaultnonmove.includes(ent.type)) && quickch != true) {
    return false;
  }
  return true;
}

function updateCamera() { //TODO disable later we don't need user messing the camera
  const speed = 5;
  if (dbg) {
    if (keys['ArrowUp']) camera.y -= speed;
    if (keys['ArrowDown']) camera.y += speed;
    if (keys['ArrowLeft']) camera.x -= speed;
    if (keys['ArrowRight']) camera.x += speed;
  }

  let x = mapData.entities["bot"].x
  let y = mapData.entities["bot"].y

  const now = performance.now();
  if (now - lastMoveTime >= moveCooldown) {
    if (keys['w']) {
      if (isWalkable(x+0, y-1)) {
      pushent(x+0, y-1, 0, -1)
      mapData.entities["bot"].rotation = 270;
      moveEntity("bot", 0, -1);
      lastMoveTime = now;
      }

    }
    else if (keys['a']) {
      if (isWalkable(x-1, y+0)) {
      pushent(x-1, y+0, -1, 0)
      mapData.entities["bot"].rotation = 180;
      moveEntity("bot", -1, 0);
      lastMoveTime = now;
      }
    }
    else if (keys['s']) {
      if (isWalkable(x+0, y+1)) {
      pushent(x+0, y+1, 0, 1)
      mapData.entities["bot"].rotation = 90;
      moveEntity("bot", 0, 1);
      lastMoveTime = now;
      }
    }
    else if (keys['d']) {
      if (isWalkable(x+1, y+0)) {
      pushent(x+1, y+0, 1, 0)
      mapData.entities["bot"].rotation = 0;
      moveEntity("bot", 1, 0);
      lastMoveTime = now;
      }
    }
  }
}



canvas.addEventListener('click', (e) => {
  document.getElementById("debug").style.display = dbg ? "block" : "none"; //quick hackjob of a map editor
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left + camera.x) / TILE_SIZE);
  const y = Math.floor((e.clientY - rect.top + camera.y) / TILE_SIZE);

  if (mapData.terrain[y] && mapData.terrain[y][x] !== undefined && !overlay && dbg) { //change tile on map on click "mapeditor"
    let tileKeys = Object.keys(mapData.tiles);
    let currentIndex = tileKeys.indexOf(mapData.terrain[y][x].toString());
    let nextIndex = (currentIndex + 1) % tileKeys.length;
    if (document.getElementById("toggle1").checked) {
      console.log("add entity");
      const name = prompt("name");
      const copy = structuredClone(mapData.entities[name]);
      copy.x = x;
      copy.y = y;
      copy.rotation = prompt("rotation");
      addEntity(copy, name, name + "_"+ Math.random().toString(36).slice(2));

    } else if(document.getElementById("toggle2").checked) {
      if (confirm("Delete entities here?")) purgeentity(x,y);
    } else {
      mapData.terrain[y][x] = parseInt(tileKeys[nextIndex]);
    }
    draw();
  } else if (mapData.terrain[y] && mapData.terrain[y][x] !== undefined && !overlay) {
    if (mapURL != "maps/lvlselect.json") return; //disable clicking tiles on anything else that isn't lvl select map.
    //console.log("Clicked!");
    let tileKeys = Object.keys(mapData.tiles);
    let currentIndex = tileKeys.indexOf(mapData.terrain[y][x].toString());
    eval(mapData.tiles[currentIndex].click);
  }
});




document.getElementById('saveButton').addEventListener('click', () => {
  for (const id in mapData.entities) { //remove beams
    const ent = mapData.entities[id];

    if (id.startsWith("__entity_beam_")) {
      delete mapData.entities[id];
      delete entityImages[id];
      delete tileImages["__entity__" + id];
    }
  }
  let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mapData, null, 2));
  let downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "map.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
});


function tryLoadShite(src) {
  const script = document.createElement('script');
  script.src = src;

  script.onload = () => {
    try {
      if (typeof main === 'function') {
        main();
        if (dbg) console.log(`main() executed from ${src}`);
      } else if (dbg) {
        console.warn(`${src} loaded, but no main() function found.`);
      }
    } catch (e) {
      console.error(`Error running main() from ${src}:`, e);
    }
  };

  script.onerror = () => {
    if (dbg) console.warn(`${src} not found — skipping.`);
  };

  document.head.appendChild(script);
}

window.pushent = function(x, y, dx, dy) {
  //if (mapURL != "maps/finale.json") return false;
  //console.log(getEntityK(x,y)?.[0]);
  const target = getEntityK(x,y)?.[0];  //TODO change to get entities
  if (target == undefined) return true;
  if (!target) return true; // empty space = end of chain = can move

  const nextX = x + dx;
  const nextY = y + dy;

  if (!isWalkable(nextX, nextY)) return false; // solid wall, can't push
  //console.log(x+ " " + y)
  if (getEntitiesAt(x, y)?.[0]?.type == "beam") return true;
  if (getEntitiesAt(x, y)?.[0]?.walk === true) {
    //console.log("ok")

  }else {
    //console.log("pain");
    return false;
  };

  // Try to push the next entity
  if (!pushent(nextX, nextY, dx, dy)) return false;

  // If we made it here, everything ahead can move
  //console.log(target.id);
  moveEntity(target, dx, dy);
  return true;
}

window.getEntitiesAt = function(x, y) { //useless
  return Object.values(mapData.entities).filter(ent => ent.x === x && ent.y === y); //mapData.entities[id]
}
function getEntityK(x, y) { //returns bot and flag as an example
  return Object.entries(mapData.entities)
    .filter(([key, ent]) => ent.x === x && ent.y === y)
    .map(([key]) => key);
}


function gamelogic() {
  if (mapData.entities && mapData.entities["bot"]) {
      //console.log(mapData.entities["bot"].x);
      let hentity = getEntityK(mapData.entities["bot"].x,mapData.entities["bot"].y);
      //console.log(hentity);
      if (hentity.includes("flag") && hentity.includes("bot")) win();
  }
  //delete mapData.tiles[`__entity_${id}`];
  //remove old laser beams
  for (const id in mapData.entities) {
    const ent = mapData.entities[id];

    if (id.startsWith("__entity_beam_")) {
      delete mapData.entities[id];
      delete entityImages[id];
      delete tileImages["__entity__" + id];
    }
  }

  for (let y = 0; y < mapData.terrain.length; y++) {
  for (let x = 0; x < mapData.terrain[0].length; x++) {
    const entitiesHere = Object.entries(mapData.entities)
      .filter(([key, ent]) => ent.x === x && ent.y === y);

    for (const [key, ent] of entitiesHere) {
      //console.log(`Tile (${x},${y}) has entity: ${key} of type ${ent.type}`); //handle laser last as we want to wait before redoing laser beam
      if (ent.type=="laser") laser(x,y);
    }
  }
  }
}

function addEntity(entity, sourceId = null, id = "__entity_" + sourceId + "_"+ Math.random().toString(36).slice(2)) {
  mapData.entities[id] = entity;

  if (sourceId && tileImages["__entity_" + sourceId]) {
    // Copy the image reference from the original source ID
    tileImages["__entity_" + id] = entityImages[sourceId];
    //entityImages[id] = tileImages["__entity__" + sourceId];
  }

  return id;
}


function laser(x,y, rotation = 0, len = 35) {
  let bypass = false;
  if (len <= 0) return;
  const copy = structuredClone(mapData.entities["beam"]);
  copy.x = x;
  copy.y = y;
  copy.rotation = rotation;
  //addEntity(copy, "beam");

  const check = Object.entries(mapData.entities)
  .filter(([key, ent]) => ent.x === x && ent.y === y);
  //check.some(([key, ent]) => ent.type === "beam")
  if (check.length != 0) {
    //console.log(check[0][1].type);
    if (check[0][1].type == "laser") {
      rotation = check[0][1].rotation
      if (len >= 35) { //TODO have same len number here if len changed
        bypass = true;
      }
    };

    if(check.some(([key, ent]) => ent.type === "beam")) {
      addEntity(copy, "beam");
    }

    if (check[0][1].type == "mirror") {
      //console.log(rotation);
      if (check[0][1].rotation == 90 || check[0][1].rotation == 270) {
        rotation = {
          0: 90,
          90: 0,
          180: 270,
          270: 180
        }[rotation];
      } else {
        //rotation += 90;
        rotation = {
          0: 270,
          270: 0,
          180: 90,
          90: 180
        }[rotation];
      }
      //console.log(rotation);

      //rotation = ((rotation % 360) + 360) % 360;
    };
    if (check[0][1].type == "mirrorflat") {
      if ((check[0][1].rotation == 0 || check[0][1].rotation == 180) && (rotation == 0 || rotation == 180)) {
      rotation += 180;
      }
      if ((check[0][1].rotation == 90 || check[0][1].rotation == 270) && (rotation == 90 || rotation == 270)) {
      rotation += 180;
      }
      rotation = ((rotation % 360) + 360) % 360;
    }
    if (check.some(([key, ent]) => key === "bot")) { //TODO better death
      if (!bypass) {
        //overlay = true;
        skillissue()
      }
    }
  } else {
    //copy.x
    addEntity(copy, "beam");
  }

  len--;
  if (rotation == 0)  laser(x+1, y, rotation, len)
  if (rotation == 90) laser(x, y+1, rotation, len)
  if (rotation == 180) laser(x-1, y, rotation, len)
  if (rotation == 270) laser(x, y-1, rotation, len)
}

let lastUpdateTime = performance.now();
const UPDATE_INTERVAL = 1000 / 60;

function gameLoop(currentTime) {
  const deltaTime = currentTime - lastUpdateTime;
  if (!overlay) gamelogic();

  if (deltaTime >= UPDATE_INTERVAL) {
    if (!overlay) {
      updateCamera();
    }
    draw();
    lastUpdateTime = currentTime;
  }

  requestAnimationFrame(gameLoop);
}

function skillissue() {
  //console.log("death");
  death.play();
  if (dbg) {
    Overlay.overlay();
    buttons[1].onClick = () => {};
  } else {
    if (mapURL == "maps/finale.json") {
      console.log("You just couldn't avoid looking in the mirror. Hence the mirror looked back.");
      loadMap("lvlselect");
      overlay = true;
      overlay2 = 2;
      Overlay.overlay();
    } else {
      console.log("death");
      Overlay.overlay()
      overlay = true;
    }
  }
  death.addEventListener('ended', () => {

  if (!dbg) {
    if (mapURL == "maps/finale.json") {
      //console.log("You just couldn't avoid looking in the mirror.");
    } else {
      buttons[0].text = "Try again"; //quick hack to replace play with try again
      loadMap("0", mapURL);
    }
  }
  });
}

function win() {
  moveEntity("bot",-100,-100) //hack to avoid sound playing twice :)
  winnoise.play();
  winnoise.addEventListener('ended', () => {
    loadMap("lvlselect");
  });
  console.log("win");
}

window.moveEntity = function(id, dx, dy) {
  if (!mapData.entities || !mapData.entities[id]) {
    console.warn(`Entity '${id}' not found.`);
    return;
  }

  const entity = mapData.entities[id];

  entity.x += dx;
  entity.y += dy;

  draw(); // Redraw the game after moving
}

function purgeentity(x,y) {
  for (const [key, ent] of Object.entries(mapData.entities)) {
    if (ent.x === x && ent.y === y) {
      delete mapData.entities[key];
    }
  }
}

async function startall() { //this fucker is needed to just wait for the load map to finnish. Fucking piece of shit otherwise has a fucking stroke
  await loadMap("0", mapURL); //load first map
  //preloadTileImages() //moved to loadMap
  requestAnimationFrame(gameLoop);

  if (mapURL == "maps/map.json") {
    Overlay.overlay()
    overlay = true;
  }
}
startall(); //it all begins.


