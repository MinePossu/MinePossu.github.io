import * as game from './game.js';

window.buttons = [];
let dragThreshold = 3; // pixels
let initialPos = { x: 0, y: 0 };
let activeButton = null;

export function createStructuredButtons(data, x = 50, y = 50, depth = 0, parent = null) {
  const padding = 6;
  const buttonHeight = 30;
  let currentY = y;

  for (let item of data) {
    const btn = {
      x,
      y: currentY,
      width: 140,
      height: buttonHeight,
      text: item.text,
      onClick: item.onClick || (() => {}),
      children: [],
      parent,
      depth,
      dragging: false
    };

    buttons.push(btn);

    if (item.children?.length) {
      createStructuredButtons(item.children, x + 20, currentY + buttonHeight + padding, depth + 1, btn);
    }

    currentY += buttonHeight + padding;
  }
}

export function drawButtons(ctx) {
  for (let btn of buttons) {
    ctx.fillStyle = "#0055aa";
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "14px sans-serif";
    ctx.fillText(btn.text, btn.x + 10, btn.y + 20);
  }
}

export function handleMouse(mx, my, type) {
  if (game.overlay == false) return;

  if (type === 'down') {
    // Check top-to-bottom for clicks
    for (let i = buttons.length - 1; i >= 0; i--) {
      const btn = buttons[i];
      const hit = mx >= btn.x && mx <= btn.x + btn.width &&
                  my >= btn.y && my <= btn.y + btn.height;

      if (hit) {
        activeButton = btn;
        btn.dragging = true;
        btn.wasDragged = false;
        btn.offsetX = mx - btn.x;
        btn.offsetY = my - btn.y;
        initialPos = { x: mx, y: my };

        // Bring button to front
        buttons.splice(i, 1);
        buttons.push(btn);
        break;
      }
    }
  }

  else if (type === 'move') {
    if (activeButton && activeButton.dragging) {
      const dx = mx - activeButton.offsetX - activeButton.x;
      const dy = my - activeButton.offsetY - activeButton.y;

      if (Math.abs(mx - initialPos.x) > dragThreshold || Math.abs(my - initialPos.y) > dragThreshold) {
        activeButton.wasDragged = true;
      }

      activeButton.x += dx;
      activeButton.y += dy;
    }
  }

  else if (type === 'up') {
    if (activeButton) {
      activeButton.dragging = false;
      activeButton = null;
    }
  }

  else if (type === 'click') {
    // Only allow click if no drag happened
    for (let i = buttons.length - 1; i >= 0; i--) {
      const btn = buttons[i];
      const hit = mx >= btn.x && mx <= btn.x + btn.width &&
                  my >= btn.y && my <= btn.y + btn.height;

      if (hit && !btn.wasDragged) {
        btn.onClick();
        break;
      }
    }
  }
}

export function cancelDragging() {
  for (let btn of buttons) {
    btn.dragging = false;
    btn.wasDragged = false;
  }
  activeButton = null;
}
