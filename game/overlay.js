import * as game from './game.js';
import { drawButtons, handleMouse, cancelDragging, createStructuredButtons} from './buttons.js';

export const MenuBtn2 = [
  { text: "Play", onClick: () => {
    loadMap("lvlselect");
    musa();
    toggleoverlay();
  }
  },
  //{ text: "Settings", onClick: () => console.log("Open settings") },
  { text: "Quit", onClick: () => window.location.href = "https://minepossu.github.io/" }
];
export const MenuBtn = [
  { text: "Play", onClick: () => toggleoverlay() },
  //{ text: "Settings", onClick: () => console.log("Open settings") },
  { text: "Quit", onClick: () => {
    toggleoverlay();
    loadMap("map");
    setTimeout(() => {
      overlay();
      toggleoverlay();
    }, 200);

  }
  }
];


export function overlay() {
  buttons.length = 0;
  // 🖱 Mouse handling (hooked here only)
  game.canvas.addEventListener('mousedown', e => {
    const rect = game.canvas.getBoundingClientRect();
    handleMouse(e.clientX - rect.left, e.clientY - rect.top, 'down');
  });
  game.canvas.addEventListener('mousemove', e => {
    const rect = game.canvas.getBoundingClientRect();
    handleMouse(e.clientX - rect.left, e.clientY - rect.top, 'move');
  });
  game.canvas.addEventListener('mouseup', e => {
    const rect = game.canvas.getBoundingClientRect();
    handleMouse(e.clientX - rect.left, e.clientY - rect.top, 'up');
  });
  game.canvas.addEventListener('click', e => {
    const rect = game.canvas.getBoundingClientRect();
    handleMouse(e.clientX - rect.left, e.clientY - rect.top, 'click');
  });
  game.canvas.addEventListener('mouseleave', cancelDragging);
  //console.log(game.mapURL);
  if (game.mapURL == 'maps/map.json') {
    createStructuredButtons(MenuBtn2, 200, 200); //we have main menu :)
  } else {
    createStructuredButtons(MenuBtn, 200, 200);
  }
}

export function drawOverlay() {
  game.ctx.fillStyle = "white";
  game.ctx.font = "20px sans-serif";
  //game.ctx.fillText(`Camera: (${game.camera.x}, ${game.camera.y})`, 10, 30);

  game.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  game.ctx.fillRect(10, 30, game.canvas.width-10*2, game.canvas.height-30*2);
  game.ctx.fillStyle = "white";
  game.ctx.fillText("Mirror Line", 20, 72);
  game.ctx.fillText("A game by MinePossu & ahma", 20, 72+30);
  game.ctx.fillText("level: " + game.mapURL, 20 ,game.canvas.height-72-30*1);

  drawButtons(game.ctx);
}

export function drawMenu() {
  game.ctx.fillStyle = "black";
  game.ctx.font = "20px sans-serif";
  game.ctx.fillText(`Camera: (${game.camera.x}, ${game.camera.y})`, 10, 30);

  game.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  game.ctx.fillRect(10, 50, 250, 30);
  game.ctx.fillStyle = "white";
  game.ctx.fillText("Press arrows to move", 20, 72);
  //drawButtons(); // Do this later
}
//game.canvas.width


export function debug() {
  game.ctx.fillStyle = "black";
  game.ctx.font = "20px sans-serif";
  game.ctx.fillText(`Debug`, 10, 30);
}

export function info() {
  game.ctx.fillStyle = "black";
  game.ctx.font = "20px sans-serif";
  //game.ctx.fillText(`Release`, game.canvas.width-100, 30);
  //game.ctx.fillText(`0.1`, game.canvas.width-100, 60);
}
