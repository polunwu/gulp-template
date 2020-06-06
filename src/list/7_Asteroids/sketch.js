const FPS         = 30;  // frames per second
const FRICTION    = 0.7; // friction coefficient of space (0 = none friction, 1 = lots)
const ROIDS_NUM   = 10;   // starting number of astroids
const ROIDS_JAG   = 0.4; // jaggedness of astroids (0 = none, 1 = lots)
const ROIDS_SIZE  = 100; // starting size of astroids in pixels
const ROIDS_SPD   = 50;  // max starting speed of astroids in pixels pre second
const ROIDS_VERT  = 10;  // average number of vertices on each astroid
const SHIP_SIZE   = 30;  // ship height in pixels
const SHIP_THRUST = 5;   // accerletation of the ship in pixels per second per second
const TURN_SPEED  = 360; // turn speed in degrees per second

/** @type {HTMLCanvasDocument} */
let canv = document.getElementById('gameCanvas');
let ctx = canv.getContext('2d');

// set up ship object
let ship = {
  x: canv.width / 2,
  y: canv.height / 2,
  r: SHIP_SIZE / 2,
  a: 90 / 180 * Math.PI, // 90 degrees covert to radius
  rot: 0,
  thrusting: false,
  thrust: {
    x: 0,
    y: 0
  }
}

// setup asteroids
let roids = [];
createAsteroidBelt();

// set up event handlers
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

// set up the game loop
setInterval(update, 1000 / FPS);

function createAsteroidBelt() {
  roids = [];
  let x, y;
  for (let i = 0; i < ROIDS_NUM; i++) {
    do {
      x = Math.floor(Math.random() * canv.width);
      y = Math.floor(Math.random() * canv.height);
    } while (distBetweenPoints(ship.x, ship.y, x, y) < ship.r + ROIDS_SIZE * 2);
    roids.push(newAstreroid(x, y));
  }
}

function distBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function keyDown(/** @type {KeyboardEvent} */ ev) {
  switch (ev.keyCode) {
    case 37: // arrow left (rotate ship left)
      ship.rot = TURN_SPEED / 180 * Math.PI / FPS;
      break;
    case 38: // arrow up (thrust the ship forward)
      ship.thrusting = true;
      break;
    case 39: // arrow right (rotate ship right)
      ship.rot = -TURN_SPEED / 180 * Math.PI / FPS;
      break;

    default:
      break;
  }
}

function keyUp(/** @type {KeyboardEvent} */ ev) {
  switch (ev.keyCode) {
    case 37: // stop rotating left
      ship.rot = 0
      break;
    case 38: // stop thrusting forward)
      ship.thrusting = false;
      break;
    case 39: // stop rotating right
      ship.rot = 0
      break;

    default:
      break;
  }
}

function newAstreroid(x, y) {
  let roid = {
    x: x,
    y: y,
    xv: Math.random() * ROIDS_SPD / FPS * (Math.random() < 0.5 ? 1 : -1), // with + or - direction
    yv: Math.random() * ROIDS_SPD / FPS * (Math.random() < 0.5 ? 1 : -1),
    r: ROIDS_SIZE / 2,
    a: Math.random() * 2 * Math.PI, // in radius
    vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2),
    offs: []
  };
  // create the vertex offsets array
  for (let i = 0; i < roid.vert; i++) {
    roid.offs.push(Math.random() * ROIDS_JAG * 2 + 1 - ROIDS_JAG)
  }

  return roid;
}

function update() {
  // draw space
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canv.width, canv.height);

  // thrust the ship
  if (ship.thrusting) {
    ship.thrust.x += SHIP_THRUST * Math.cos(ship.a) / FPS;
    ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a) / FPS;
    // draw the thruster
    drawThruster();
  } else {
    ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
    ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
  }

  // draw a triangular ship
  drawShip();

  // draw the asteroids
  ctx.strokeStyle = 'slategrey';
  ctx.lineWidth = SHIP_SIZE / 20;
  let x, y, r, a, vert, offs;
  for (let i = 0; i < roids.length; i++) {
    
    // get the properties of asteroids
    x = roids[i].x;
    y = roids[i].y;
    a = roids[i].a;
    r = roids[i].r;
    vert = roids[i].vert;
    offs = roids[i].offs;

    // draw a path
    ctx.beginPath();
    ctx.moveTo(
      x + r * offs[0] * Math.cos(a),
      y + r * offs[0] * Math.sin(a)
    );
    
    // draw the polygon
    for (let j = 1; j < vert; j++) {
      ctx.lineTo(
        x + r * offs[j] * Math.cos(a + j * Math.PI * 2  / vert),
        y + r * offs[j] * Math.sin(a + j * Math.PI * 2  / vert)
      );
    }
    ctx.closePath();
    ctx.stroke();

    // move the asteroid
    roids[i].x += roids[i].xv;
    roids[i].y += roids[i].yv;

    // handle edge of screen
     if (roids[i].x < 0 - roids[i].r) {
      roids[i].x = canv.width + roids[i].r;
    } else if (roids[i].x > canv.width + roids[i].r) {
      roids[i].x = 0 - roids[i].r;
    }
    if (roids[i].y < 0 - roids[i].r) {
      roids[i].y = canv.height + roids[i].r;
    } else if (roids[i].y > canv.height + roids[i].r) {
      roids[i].y = 0 - roids[i].r;
    }
    
  }

  // rotate ship
  ship.a += ship.rot;

  // move ship
  ship.x += ship.thrust.x;
  ship.y += ship.thrust.y;

  // handle edge of screen
  if (ship.x < 0 - ship.r) {
    ship.x = canv.width + ship.r;
  } else if (ship.x > canv.width + ship.r) {
    ship.x = 0 - ship.r;
  }
  if (ship.y < 0 - ship.r) {
    ship.y = canv.height + ship.r;
  } else if (ship.y > canv.height + ship.r) {
    ship.y = 0 - ship.r;
  }
}

function drawThruster() {
  ctx.fillStyle = 'red';
  ctx.strokeStyle = 'yellow';
  ctx.lineWidth = SHIP_SIZE / 10;
  ctx.beginPath();
  ctx.moveTo( // rear left of th ship
    ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
    ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
  )
  ctx.lineTo( // rear center behind the ship
    ship.x - ship.r * 6 / 3 * Math.cos(ship.a),
    ship.y + ship.r * 6 / 3 * Math.sin(ship.a)
  )
  ctx.lineTo( // rear rigth
    ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
    ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
  )
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawShip() {
  // draw a triangular ship
  ctx.strokeStyle = 'white';
  ctx.lineWidth = SHIP_SIZE / 20;
  ctx.beginPath();
  ctx.moveTo( // nose of th ship
    ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
    ship.y - 4 / 3 * ship.r * Math.sin(ship.a)
  )
  ctx.lineTo( // rear left
    ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + Math.sin(ship.a)),
    ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - Math.cos(ship.a))
  )
  ctx.lineTo( // rear right
    ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - Math.sin(ship.a)),
    ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + Math.cos(ship.a))
  )
  ctx.closePath();
  ctx.stroke();
  // draw center dot
  ctx.fillStyle = 'red';
  ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2);
}