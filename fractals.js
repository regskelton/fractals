function augmentImageData(o) {
    o.getPixel = function (x, y) {
        var i = (x + y * this.width) * 4;
        return {
            R: this.data[i],
            G: this.data[i + 1],
            B: this.data[i + 2],
            A: this.data[i + 3]
        }
    }
    o.setPixel = function (x, y, c) {
        var i = (x + y * this.width) * 4;
        this.data[i] = c.R;
        this.data[i + 1] = c.G;
        this.data[i + 2] = c.B;
        this.data[i + 3] = c.A;
    }
}

var origin = document.getElementById("origin");
var scale = document.getElementById("scale");
var canvas = document.getElementById("canvas");
var overlay = document.getElementById("overlay");

var elemLeft = canvas.offsetLeft,
    elemTop = canvas.offsetTop,
    context = canvas.getContext('2d'),
    overlayContext= overlay.getContext('2d');

function Point(x, y) {
    this.x = x;
    this.y = y;
}

Point.offset = function (other) {
    this.x -= other.x;
    this.y -= other.y;
}

function Drawing(bottomLeft, topRight, canvasOrigin, canvasSize) {
    this.bottomLeft = bottomLeft;
    this.topRight = topRight;
    this.canvasOrigin = canvasOrigin;
    this.canvasSize = canvasSize;
}

Drawing.prototype.recenter = function( center, scale){
    var new_x = (this.bottomLeft.x + (((center.x - this.canvasOrigin.x) / this.canvasSize.x) * (this.topRight.x - this.bottomLeft.x)));
    var new_y = (this.bottomLeft.y + (((center.y - this.canvasOrigin.y) / this.canvasSize.y) * (this.topRight.y - this.bottomLeft.y)));

    var new_width = (this.topRight.x - this.bottomLeft.x) / scale;
    this.bottomLeft.x = new_x - new_width / 2;
    this.topRight.x = new_x + new_width / 2;

    var new_height = (this.topRight.y - this.bottomLeft.y) / scale;
    this.bottomLeft.y = new_y - new_height / 2;
    this.topRight.y = new_y + new_height / 2;
}

var drawing = new Drawing(
    new Point(-2, -1.5),
    new Point(1, 1.5),
    new Point(canvas.offsetLeft, canvas.offsetTop),
    new Point(canvas.width, canvas.height));

var maxIteration = 1000;
var start = new Point(-2, -1.5);
var stop = new Point(1, 1.5);
var start_x = -2;
var stop_x = 1;
var start_y = -1.5;
var stop_y = 1.5;

// Add event listener for `click` events.
overlay.addEventListener('click', function (event) {
    drawing.recenter( new Point(event.offsetX,event.offsetY), 2);

    //console.log('Clicked at ' + x + ',' + y + '[' + new_x + ',' + new_y + ']');

    //maxIteration = maxIteration * 2;

    origin.textContent = '(' + ((drawing.topRight.x - drawing.bottomLeft.x) / 2) + ',' 
    + ((drawing.topRight.y - drawing.bottomLeft.y) / 2) + ')';
    scale.textContent = ' ' + 1 / ((drawing.topRight.x - drawing.bottomLeft.x) / drawing.canvasSize.x);

    mandelbrot(
        context, 
        drawing.bottomLeft.x,
        drawing.topRight.x,
        drawing.bottomLeft.y,
        drawing.topRight.y,
        drawing.canvasSize.x, 
        drawing.canvasSize.y,
        maxIteration);
}, false);

var selector= {origin: new Point( drawing.canvasOrigin.x + drawing.canvasSize.x/4,
                                  drawing.canvasOrigin.y + drawing.canvasSize.y/4),
            size: new Point( drawing.canvasSize.x/2, drawing.canvasSize.y/2)};

// Add event listener for `click` events.
overlay.addEventListener('mousemove', function (event) {
    
    overlayContext.clearRect( 0, 0, drawing.canvasSize.x, drawing.canvasSize.y);

    selector.origin.x= event.x;
    selector.origin.y= event.y;

    overlayContext.beginPath();
    overlayContext.lineWidth="1";
    overlayContext.strokeStyle="red";
    //overlayContext.globalCompositeOperation="xor";
    overlayContext.rect( selector.origin.x, selector.origin.y, selector.size.x, selector.size.y)
    overlayContext.stroke();
}, false);


mandelbrot(
    context, 
    drawing.bottomLeft.x,
    drawing.topRight.x,
    drawing.bottomLeft.y,
    drawing.topRight.y,
    drawing.canvasSize.x, 
    drawing.canvasSize.y,
    maxIteration);

//mandelbrot(context, start_x, stop_x, start_y, stop_y, canvas.width, canvas.height, maxIteration);

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function hslToRgb(h, s, l) {
    var r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function escapeTime(x, y, maxIteration) {
    var px = 0.0
    var py = 0.0
    var iteration = 0
    while (px * px + py * py < 2 * 2 && iteration < maxIteration) {
        var xtemp = px * px - py * py + x
        py = 2 * px * py + y
        px = xtemp
        iteration = iteration + 1
    }

    time = iteration / maxIteration;

    //console.log( iteration);

    return iteration / maxIteration;
}


/**
 *	mandelbrot(
 *		context,
 *		centre_x, centre_y,
 *		pixels_x, pixels_y,
 *		scale)
 *
 *	Draw the mandelbrot set at (centre_x, centre_y) 
 *	over a canvas of pixel dimensions (pixels_x, pixels_y),
 *	with scale s
 *	
 *	e.g. mandelbrot( -0.5, 0, 600, 600, 1/200) plots the classic double cardioid
 *	from (-0.5 - 600/2 * 1/200, 0 - 600/2 * 1/200) to (-0.5 + 600/2 * 1/200, 0 + 600/2 * 1/200)
 *	i.e. (-2, -1.75) to (1,1.75)
 */

function mandelbrot(context, start_x, stop_x, start_y, stop_y, pixels_x, pixels_y, max_iteration) {

    var ImDat = context.createImageData(pixels_x, pixels_y);
    augmentImageData(ImDat);

    var delta_x = stop_x - start_x;
    var delta_y = stop_y - start_y;
    var inc_x = delta_x / pixels_x;
    var inc_y = delta_y / pixels_y;

    for (var x = 0; x < pixels_x; x++) {
        //console.log( "Col " + x);
        for (var y = 0; y < pixels_y; y++) {

            var time = escapeTime(start_x + inc_x * x, start_y + inc_y * y, max_iteration);

            //var time = y / ImDat.height;

            var rgb = (time == 1 ? [0, 0, 0] : hslToRgb(time, 0.75, 0.5))

            ImDat.setPixel(x, y, {
                R: rgb[0],
                G: rgb[1],
                B: rgb[2],
                A: 255
            });
        }

        context.putImageData(ImDat, 0, 0);

    }
}