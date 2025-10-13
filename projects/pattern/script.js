const canvas = document.getElementById("preview");
const ctx = canvas.getContext("2d");
const fileInput = document.getElementById("imageInput");
const thresholdSlider = document.getElementById("thresholdSlider");
const threshLabel = document.getElementById("threshValue");
const widthSlider = document.getElementById("widthSlider");
const heightSlider = document.getElementById("heightSlider");
const widthLabel = document.getElementById("widthValue");
const heightLabel = document.getElementById("heightValue");
const color1Picker = document.getElementById("color1");
const color2Picker = document.getElementById("color2");
const resultBox = document.getElementById("resultBox");

let grayGrid = [];

fileInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    const w = img.width;
    const h = img.height;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);

    // Convert to grayscale
    const data = ctx.getImageData(0, 0, w, h).data;
    grayGrid = [];
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        row.push(gray);
      }
      grayGrid.push(row);
    }

    // Update sliders to match image size
    widthSlider.max = w;
    heightSlider.max = h;
    widthSlider.value = w;
    heightSlider.value = h;
    widthLabel.textContent = w;
    heightLabel.textContent = h;

    // Immediately generate preview & Base64
    update();
  };
  img.src = URL.createObjectURL(file);
});

function update() {
  if (grayGrid.length === 0) return;

  const threshold = parseInt(thresholdSlider.value);
  const newW = parseInt(widthSlider.value);
  const newH = parseInt(heightSlider.value);
  const color1 = color1Picker.value;
  const color2 = color2Picker.value;
  const origH = grayGrid.length;
  const origW = grayGrid[0].length;

  canvas.width = newW;
  canvas.height = newH;

  const bwGrid = [];
  for (let y = 0; y < newH; y++) {
    const row = [];
    for (let x = 0; x < newW; x++) {
      const srcX = Math.floor(x * origW / newW);
      const srcY = Math.floor(y * origH / newH);
      const p = grayGrid[srcY][srcX];
      row.push(p < threshold ? 1 : 0);
    }
    bwGrid.push(row);
  }

  // Draw canvas
  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < newW; x++) {
      ctx.fillStyle = bwGrid[y][x] ? color1 : color2;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Encode Base64 pattern
  let flatBytes = [];
  let byte = 0, bitsFilled = 0;
  for (let row of bwGrid) {
    for (let bit of row) {
      byte |= (bit << bitsFilled);
      bitsFilled++;
      if (bitsFilled === 8) {
        flatBytes.push(byte);
        byte = 0;
        bitsFilled = 0;
      }
    }
  }
  if (bitsFilled > 0) flatBytes.push(byte);

  const effective_width = Math.max(0, newW - 2);
  const effective_height = Math.max(0, newH - 2);
  const scale = 0;
  const byte1 = ((effective_width & 0x1F) << 3) | (scale & 0x07);
  const byte2 = ((effective_width >> 5) & 0x03) | ((effective_height & 0x3F) << 2);
  const patternBytes = [0, byte1, byte2, ...flatBytes];
  const b64Pattern = btoa(String.fromCharCode.apply(null, patternBytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  resultBox.textContent = b64Pattern;
}

// Event listeners for sliders/colors
thresholdSlider.addEventListener("input", e => { threshLabel.textContent = e.target.value; update(); });
widthSlider.addEventListener("input", e => { widthLabel.textContent = e.target.value; update(); });
heightSlider.addEventListener("input", e => { heightLabel.textContent = e.target.value; update(); });
color1Picker.addEventListener("input", update);
color2Picker.addEventListener("input", update);

// Click Base64 to open in OpenFront Utility
resultBox.addEventListener("click", () => {
  const code = resultBox.textContent.trim();
  if (code) window.open("https://aotumuri.github.io/openfront-utility/#" + code, "_blank");
});
