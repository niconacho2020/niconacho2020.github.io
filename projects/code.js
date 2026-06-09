class CanvasRenderer {
	constructor(canvasId) {
		this.canvas = document.getElementById(canvasId);
		/**@type {CanvasRenderingContext2D} */
		this.ctx = this.canvas.getContext("2d");
		this.colors = ["#2185C5", "#7ECEFD", "#FFF6E5", "#FF7F66"];
		this.mouse = {
			x: window.innerWidth / 2,
			y: window.innerHeight / 2,
		};

		this.cMouse = {
			x: 0,
			y: 0,
		};

		this.resize();
		this.rect = this.canvas.getBoundingClientRect();

		this.initEventListeners();

		this.lastTime = performance.now();
		this.fps = 0;
		this.deltaTime = 0;
	}

	initEventListeners() {
		window.addEventListener("mousemove", (event) => {
			this.mouse.x = event.clientX;
			this.mouse.y = event.clientY;

			const x = event.clientX - this.rect.left;
			const y = event.clientY - this.rect.top;

			this.cMouse.x = (x / this.rect.width) * 2 - 1;
			this.cMouse.y = -(y / this.rect.height) * 2 + 1;
		});

		window.addEventListener("resize", () => this.resize());
	}

	resize() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;

		this.rect = this.canvas.getBoundingClientRect();

		this.ctx.imageSmoothingEnabled = false;
	}

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	drawRect(x, y, w, h, color) {
		this.ctx.beginPath(); // Fixed: Added parentheses
		this.ctx.fillStyle = color;
		this.ctx.fillRect(x, y, w, h);
		this.ctx.closePath();
	}

	drawCircle(x, y, radiusX, radiusY, rot, color) {
		this.ctx.beginPath();
		this.ctx.fillStyle = color;
		this.ctx.ellipse(x, y, radiusX, radiusY, rot, 0, Math.PI * 2);
		this.ctx.fill();
		this.ctx.closePath();
	}

	drawText(x, y, text, font, color) {
		this.ctx.beginPath();
		this.ctx.font = font;
		this.ctx.fillStyle = color; // Fixed: replaced 'ftx' with 'this.ctx'
		this.ctx.fillText(text, x, y);
	}

	animate(callback) {
		const loop = (currentTime) => {
			this.deltaTime = (currentTime - this.lastTime) / 1000;
			this.lastTime = currentTime;

			this.fps = this.deltaTime > 0 ? Math.round(1 / this.deltaTime) : 0;

			if (callback) callback(this.deltaTime, this.fps);

			requestAnimationFrame(loop);
		};

		requestAnimationFrame(loop);
	}

	HSLToRGB(h, s, l) {
		s /= 100;
		l /= 100;
		const k = (n) => (n + h / 30) % 12;
		const a = s * Math.min(l, 1 - l);
		const f = (n) =>
			l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
		return `rgb(${255 * f(0)}, ${255 * f(8)}, ${255 * f(4)})`;
	}
}
class RenderSquare {
	constructor(color, x, y, size, duplicator, lcount) {
		this.color = color;
		this.x = x;
		this.y = y;
		this.size = size;
		this.duplicator = duplicator;
		this.lcount = lcount;

		allSquares.push(this);
	}
}

const ren = new CanvasRenderer("canvas");

const allSquares = [];
let activeSquares = [];
const keys = new Set();
const pos = { x: 0, y: 0 };
const occupiedCoords = new Set();
const baseDirections = [
	{ x: -1, y: -1 },
	{ x: 0, y: -1 },
	{ x: 1, y: -1 },
	{ x: -1, y: 0 },
	{ x: 1, y: 0 },
	{ x: -1, y: 1},
	{ x: 0, y: 1 },
	{ x: 1, y: 1 },
];

let directions = [baseDirections[1],baseDirections[3],baseDirections[4],baseDirections[6]]

let tryFunction;
let minX = -1000,
	minY = -1000,
	maxX = 1000,
	maxY = 1000;
let width = maxX - minX + 2;
let height = maxY - minY + 2;
let zoom = 1;
let max = 500;
let count = 0;
let chance = 0.4;
const increase = 2;
let squareSize = 1;
let seedCount = 100;

const hiddenCanvas = document.createElement("canvas");
hiddenCanvas.width = width;
hiddenCanvas.height = height;
hiddenCanvas.id = "hiddenCanvas";
const hCtx = hiddenCanvas.getContext("2d");
hCtx.imageSmoothingEnabled = false;

function addSquare(color, x, y, size, duplicator, lcount) {
	const square = new RenderSquare(color, x, y, size, duplicator, lcount);
	occupiedCoords.add(`${x}, ${y}`);

	if (duplicator) {
		activeSquares.push(square);
	}

	coloring(color, lcount, x, y, size);
}

function initialize() {
	allSquares.length = 0;
	activeSquares = [];
	occupiedCoords.clear();
	hCtx.clearRect(0, 0, hCtx.canvas.width, hCtx.canvas.height);
	for (let i = 0; i < seedCount; i++) {
		addSquare(
			"blue",
			Math.round(Math.random() * 1000 - 500),
			Math.round(Math.random() * 1000 - 500),
			squareSize,
			true,
			0,
		);
	}
}

function createmap() {
	if (activeSquares.length === 0) {
		count = max;
		return;
	}
	count += 1;

	const currentLocations = [...activeSquares];
	activeSquares = [];

	currentLocations.forEach((obj) => {
		if (!obj.duplicator) return;

		directions.forEach(({ x: offsetX, y: offsetY }) => {
			const targetX = obj.x + offsetX;
			const targetY = obj.y + offsetY;

			if (
				!occupiedCoords.has(`${targetX}, ${targetY}`) &&
				obj.lcount < max
			) {
				const usedBias = offsetX !== 0 ? 0 : 0;
				if (Math.random() < chance + usedBias) {
					addSquare(
						undefined,
						targetX,
						targetY,
						squareSize,
						false,
						obj.lcount + 1,
					);
				} else {
					addSquare(
						undefined,
						targetX,
						targetY,
						squareSize,
						true,
						obj.lcount + 1,
					);
				}
			}
		});
	});

	if (count >= max){
		console.log(allSquares.length);
	}

	renderAllSquares();
}

function renderAllSquares() {
	activeSquares.forEach((s) => {
		coloring(s.color, s.lcount, s.x, s.y, s.size);
	});
}

function reset() {
	document.getElementById("squareSize").value = 1;
	document.getElementById("spawnCount").value = 100;
	document.getElementById("depth").value = 500;
	document.getElementById("chance").value = 40;
	document.getElementById("coloring").value =
		"hCtx.fillStyle = ren.HSLToRGB(0, 0, 100 - 100 * (lcount / max));";
}

function drawToCanvas() {
	ren.ctx.save();

	ren.ctx.translate(ren.canvas.width / 2, ren.canvas.height / 2);
	ren.ctx.scale(zoom, zoom);
	ren.ctx.translate(pos.x + minX, pos.y + minY);
	ren.ctx.drawImage(hiddenCanvas, 0, 0);

	ren.ctx.restore();
}

function coloring(color, lcount, x, y, size) {
	try {
		tryFunction(color, lcount, x, y, size);
	} catch (error) {
		if (!color) {
			// hCtx.fillStyle = ren.HSLToRGB(360 * (lcount / max), 100, 50);
			hCtx.fillStyle = ren.HSLToRGB(0, 0, 100 - 100 * (lcount / max));
		} else {
			hCtx.fillStyle = color;
		}
	}
	hCtx.fillRect(x - minX, y - minY, size, size);
}

document.addEventListener("keydown", (e) => {
	keys.add(e.key);

	if (e.key === "p") {
		generate();
	}
});

document.addEventListener("keyup", (e) => {
	keys.delete(e.key);
});

function generate() {
	squareSize = document.getElementById("squareSize").value;
	seedCount = document.getElementById("spawnCount").value;
	max = document.getElementById("depth").value;
	chance = document.getElementById("chance").value / 100;
	tryFunction = new Function("color", "lcount", "x", "y", "size", document.getElementById("coloring").value);

	directions.length = 0;
	document.querySelectorAll(".directions").forEach(e => {
		if (e.checked){
			directions.push(baseDirections[parseInt(e.id - 1)])
		}
	});

	initialize();
	createmap();
	count = 0;
}

generate();
ren.animate((deltaTime, fps) => {
	ren.clear();
	ren.ctx.fillStyle = document.getElementById("background").value;
	ren.ctx.fillRect(0, 0, ren.canvas.width, ren.canvas.height);
	if (keys.has("w")) pos.y += (1000 * deltaTime) / zoom;
	if (keys.has("a")) pos.x += (1000 * deltaTime) / zoom;
	if (keys.has("s")) pos.y -= (1000 * deltaTime) / zoom;
	if (keys.has("d")) pos.x -= (1000 * deltaTime) / zoom;
	if (keys.has("q")) zoom *= 1.01 * (1 + deltaTime);
	if (keys.has("e")) zoom /= 1.01 * (1 + deltaTime);

	if (count < max) {
		createmap();
	}
	drawToCanvas();

	document.getElementById("fps").innerHTML = fps;
});
