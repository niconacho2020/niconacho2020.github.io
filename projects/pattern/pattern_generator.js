let grayGrid = [];
const fileInput = document.getElementById("fileInput");
const slider = document.getElementById("thresholdSlider");
const threshLabel = document.getElementById("threshValue");
const widthSlider = document.getElementById("widthSlider");
const heightSlider = document.getElementById("heightSlider");
const widthLabel = document.getElementById("widthValue");
const heightLabel = document.getElementById("heightValue");
const canvas = document.getElementById("preview");
const ctx = canvas.getContext("2d");
const resultBox = document.getElementById("resultBox");
const color1Picker = document.getElementById("color1");
const color2Picker = document.getElementById("color2");

fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
        const img = new Image();
        img.onload = () => {
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tempCtx = tempCanvas.getContext("2d");
            tempCtx.drawImage(img, 0, 0);
            const imageData = tempCtx.getImageData(0,0,img.width,img.height);
            grayGrid = [];
            for(let y=0;y<img.height;y++){
                const row = [];
                for(let x=0;x<img.width;x++){
                    const idx = (y*img.width + x)*4;
                    const r = imageData.data[idx];
                    const g = imageData.data[idx+1];
                    const b = imageData.data[idx+2];
                    // convert to grayscale
                    row.push(0.299*r + 0.587*g + 0.114*b);
                }
                grayGrid.push(row);
            }
            widthSlider.max = img.width;
            heightSlider.max = img.height;
            widthSlider.value = img.width;
            heightSlider.value = img.height;
            widthLabel.textContent = img.width;
            heightLabel.textContent = img.height;
            update();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

function update(){
    const threshold = parseInt(slider.value);
    const newW = parseInt(widthSlider.value);
    const newH = parseInt(heightSlider.value);
    threshLabel.textContent = threshold;
    widthLabel.textContent = newW;
    heightLabel.textContent = newH;
    
    const origH = grayGrid.length;
    const origW = grayGrid[0]?.length || 1;
    const color1 = color1Picker.value;
    const color2 = color2Picker.value;

    const bwGrid = [];
    for(let y=0;y<newH;y++){
        const row=[];
        for(let x=0;x<newW;x++){
            const srcX=Math.floor(x*origW/newW);
            const srcY=Math.floor(y*origH/newH);
            const p = grayGrid[srcY]?.[srcX] || 0;
            row.push(p<threshold?1:0);
        }
        bwGrid.push(row);
    }

    canvas.width = newW;
    canvas.height = newH;
    for(let y=0;y<bwGrid.length;y++){
        for(let x=0;x<bwGrid[y].length;x++){
            ctx.fillStyle = bwGrid[y][x]?color1:color2;
            ctx.fillRect(x,y,1,1);
        }
    }

    // Encode into Base64 pattern key
    let flatBytes=[];
    let byte=0,bitsFilled=0;
    for(let row of bwGrid){
        for(let bit of row){
            byte |= (bit<<bitsFilled);
            bitsFilled++;
            if(bitsFilled===8){flatBytes.push(byte); byte=0; bitsFilled=0;}
        }
    }
    if(bitsFilled>0) flatBytes.push(byte);

    const effective_width = Math.max(0,newW-2);
    const effective_height = Math.max(0,newH-2);
    const scale = 0;
    const byte1 = ((effective_width & 0x1F)<<3)|(scale & 0x07);
    const byte2 = ((effective_width>>5)&0x03)|((effective_height&0x3F)<<2);
    const patternBytes=[0,byte1,byte2,...flatBytes];
    const b64Pattern=btoa(String.fromCharCode(...patternBytes))
        .replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");

    resultBox.textContent=b64Pattern;
}

slider.addEventListener("input", update);
widthSlider.addEventListener("input", update);
heightSlider.addEventListener("input", update);
color1Picker.addEventListener("input", update);
color2Picker.addEventListener("input", update);

resultBox.addEventListener("click", ()=>{
    const code=resultBox.textContent.trim();
    if(code){
        window.open("https://aotumuri.github.io/openfront-utility/#"+code,"_blank");
    }
});
