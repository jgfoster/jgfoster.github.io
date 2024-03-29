
function hash(s) {
    return s.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0);
}

function equalLines(l1, l2) {
    return equalPoints(l1.start, l2.start) && equalPoints(l1.end, l2.end);
}

function equalPoints(p1, p2) {
    return p1.x == p2.x && p1.y == p2.y;
}

function resetPixels(pixels) {
    for (let i = 0; i < 10; i++) {
        pixels[i] = new Array(10);
        for (let j = 0; j < 10; j++) {
            pixels[i][j] = 0;       // percent coverage
        }
    }
}

function getWidgets() {
    const topEdge = document.getElementById("topEdge").getContext("2d");
    topEdge.font = '14px sans-serif';
    topEdge.textAlign = 'center';
    topEdge.textBaseline = 'bottom';
    const leftEdge = document.getElementById("leftEdge").getContext("2d");
    leftEdge.font = '14px sans-serif';
    leftEdge.textAlign = 'right';
    const graphics = document.getElementById("canvas").getContext("2d");
    graphics.font = '14px sans-serif';
    return {
        paragraph:  document.getElementById("paragraph"),
        progress:   document.getElementById("progress").getContext("2d"),
        graphics,
        topEdge,
        leftEdge,
        offset:     { x: 0, y: 0, topToBottom: true },
        pixels:     new Array(10),
        color:      "black"
    }
}

function getMousePixelLocation(canvas, event, widgets, cellSize = 40) {
    const rect = canvas.getBoundingClientRect();
    const transform = widgets.graphics.getTransform();
    let x = (event.clientX - rect.left - transform.e) / transform.a;
    let y = (event.clientY - rect.top - transform.f) / transform.d;
    x = Math.floor(x / cellSize);
    y = Math.floor(y / cellSize);
    return { x: x, y: y };
}

function getMousePointLocation(canvas, event, widgets, cellSize = 40) {
    const rect = canvas.getBoundingClientRect();
    const transform = widgets.graphics.getTransform();
    let x = (event.clientX - rect.left - transform.e) / transform.a;
    let y = (event.clientY - rect.top - transform.f) / transform.d;
    x = Math.floor((x + cellSize / 4) / (cellSize / 2)) / 2;
    y = Math.floor((y + cellSize / 4) / (cellSize / 2)) / 2;
    return { x: x, y: y };
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function setupGrid(widgets, cellSize = 40, labelOffset = 0, allowNegative = true) {
    widgets.offset.topToBottom = getRandomInt(2) == 0;
    widgets.offset.x = allowNegative ? -getRandomInt(5) : 0;
    widgets.offset.y = allowNegative ? -getRandomInt(5) : 0;
    // reset to known values for development/debugging
    // widgets.offset.topToBottom = true;
    // widgets.offset.x = -2;
    // widgets.offset.y = -2;
    if (widgets.offset.topToBottom) {
        widgets.graphics.setTransform(1, 0, 0, 1, 0, 0);
    } else {
        widgets.graphics.setTransform(1, 0, 0, -1, 0, cellSize * 5 + 1);
    }
    widgets.graphics.transform(1, 0, 0, 1, 
        widgets.offset.x * -cellSize,     // horizontal translation
        widgets.offset.y * -cellSize);    // vertical translation
    resetPixels(widgets.pixels);
    drawGrid(widgets, cellSize, labelOffset);
}

function setProgress(widgets, value, cellSize = 40) {
    widgets.progress.fillStyle = "#FFF";
    widgets.progress.fillRect(0, 0, cellSize * 5, 20);
    widgets.progress.fillStyle = "#0F0";
    widgets.progress.fillRect(0, 0, value * cellSize / 2, 20);
}

function labelAxes(widgets, point, cellSize = 40, labelOffset = 0) {
    const x = Math.max(-(widgets.offset.x - point.x) * cellSize + labelOffset, 6);
    widgets.topEdge.fillText(point.x, x, 15);
    const y = widgets.offset.topToBottom ? 
        -(widgets.offset.y - point.y) * cellSize + labelOffset + 15 : 
        cellSize * 5 + 10 - labelOffset + (widgets.offset.y - point.y) * cellSize;
    widgets.leftEdge.fillText(point.y, 20, y);
}

function drawGrid(widgets, cellSize = 40, labelOffset = 0) {
    widgets.graphics.clearRect(-cellSize * 5, -cellSize * 5, cellSize * 10, cellSize * 10);
    widgets.graphics.fillStyle = "#FFF";
    widgets.graphics.fillRect(-cellSize * 5, -cellSize * 5, cellSize * 10, cellSize * 10);
    widgets.topEdge.clearRect(0, 0, cellSize * 5 + 10, 15);
    widgets.leftEdge.clearRect(0, 0, 30, cellSize * 5 + 20);

    widgets.graphics.beginPath();
    for (let i = -4; i <= 5; i++) {
        widgets.graphics.strokeStyle = '#AAA';
        widgets.graphics.moveTo(-cellSize * 5, i * cellSize + 0.5);
        widgets.graphics.lineTo(cellSize * 5, i * cellSize + 0.5);
        widgets.graphics.closePath();    
        widgets.graphics.moveTo(i * cellSize + 0.5, -cellSize * 5);
        widgets.graphics.lineTo(i * cellSize + 0.5, cellSize * 5);
        widgets.graphics.closePath();
        widgets.graphics.stroke();
        widgets.graphics.strokeStyle = '#AAA';
    }
    labelAxes(widgets, {x: 0, y: 0}, cellSize, labelOffset);

    for (let i = -4; i < 5; i++) {
        for (let j = -4; j < 5; j++) {
            let fill = widgets.pixels[j + 4][i + 4];
            fill = 255 - fill / 100 * 255;
            let color;
            if (widgets.color == "red") {
                color = "rgb(" + fill + ",0,0)";
            } else if (widgets.color == "green") {
                color = "rgb(0," + fill + ",0)";
            } else {
                color = "rgb(" + fill + "," + fill + "," + fill + ")";
            }
            widgets.graphics.fillStyle = color;
            widgets.graphics.fillRect(i * cellSize + 1, j * cellSize + 1, cellSize - 1, cellSize - 1);
            widgets.graphics.strokeStyle = "#FFF";
            widgets.graphics.font = '16px sans-serif';
            widgets.graphics.strokeText(
                '. . . . . '.substring(0, Math.floor((256 - fill) / 64) * 2), 
                i * cellSize + (10 * cellSize) / 100, 
                j * cellSize + (25 * cellSize) / 100);
        }
    }
}

function drawLine(widgets, line, style, cellSize = 40) {
    widgets.graphics.fillStyle = style;
    widgets.graphics.beginPath();
    widgets.graphics.arc(line.start.x * cellSize, line.start.y * cellSize, 15 * cellSize / 100, 0, Math.PI * 2);
    widgets.graphics.closePath();
    widgets.graphics.fill();
    widgets.graphics.beginPath();
    widgets.graphics.closePath();
    widgets.graphics.fill();
    widgets.graphics.strokeStyle = style;
    widgets.graphics.beginPath();
    widgets.graphics.moveTo(line.start.x * cellSize, line.start.y * cellSize);
    widgets.graphics.lineTo(line.end.x * cellSize, line.end.y * cellSize);
    widgets.graphics.closePath();
    widgets.graphics.stroke();
    const transform = widgets.graphics.getTransform();
    widgets.graphics.transform(1, 0, 0, 1, line.end.x * cellSize, line.end.y * cellSize);
    // https://math.stackexchange.com/questions/1327253/how-do-we-find-out-angle-from-x-y-coordinates
    const x = line.end.x - line.start.x;
    const y = line.end.y - line.start.y;
    const pi = Math.PI;
    const t2 = pi / 2 * (1 + Math.sign(x)) * (1 - Math.sign(y * y));
    const t3 = pi / 4 * (2 + Math.sign(x)) * Math.sign(y);
    const t4 = Math.sign(x * y) * Math.atan((Math.abs(x) - Math.abs(y)) / (Math.abs(x) + Math.abs(y)));
    widgets.graphics.rotate(pi - t2 - t3 - t4);
    widgets.graphics.moveTo(-20 * cellSize / 100, 20 * cellSize / 100);
    widgets.graphics.lineTo(0, 0);
    widgets.graphics.moveTo(-20 * cellSize / 100, -20 * cellSize / 100);
    widgets.graphics.lineTo(0, 0);
    widgets.graphics.closePath();
    widgets.graphics.stroke();
    widgets.graphics.setTransform(transform);
}

function reportResults(widgets, totalTime, attempts, cellSize = 40) {
    widgets.topEdge.clearRect(0, 0, 5 * cellSize + 10, 15);
    widgets.leftEdge.clearRect(0, 0, 30, 5 * cellSize + 20);
    widgets.graphics.setTransform(1, 0, 0, 1, 0, 0);
    widgets.graphics.fillStyle = "#0F0";
    widgets.graphics.fillRect(1, 1, 5 * cellSize - 1, 5 * cellSize - 1);
    const string = attempts + " attempts in " + Math.round(totalTime / 100) / 10 + " seconds";
    widgets.paragraph.textContent = string + "  (check " + Math.abs(hash(string) % 1000) + ")";
}
