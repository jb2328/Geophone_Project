var HEIGHT = 500;
var WIDTH = 500;

var svg = d3.select("body")
  .append("svg")
  .attr("width", WIDTH)
  .attr("height", HEIGHT);


class event {
  constructor(color, value) {
    this.color = color;
    this.val = value;
    this.id = null;
    let now = new Date();
    this.ts = now.getHours()+":"+now.getMinutes()+":"+now.getSeconds();
    this.r = 5;
    this.cx = null;
    this.cy = null;
  }

  setPos(newX, newY) {
    this.cx = newX;
    this.cy = newY;

  }
  setID(id) {
    this.id = id;
  }
  getRadius() {
    return this.r;
  }
  setRadius(R) {
    this.r = R;
  }
  getPos() {
    return {
      cx: this.cx,
      cy: this.cy
    };
  }
}

class eventBuffer {
  constructor(N) {
    this.circles = N;
    this.jsonSpiral = toJson(generateEquidistantCoords(this.circles));
    this.jsonLine = toJson(generateFlatCoords(this.circles));
    this.buffer = [];
    //this.jsonLine=null;
    //this.jsonSpiral=null;

  }

  data() {
    return this.buffer;
  }

  prefill(N) {
    for (let i = 0; i < N; i++) {
      this.addEvent(new event("rgb(255,55,0)", 0));
    }
  }
  addEvent(event) {
    if (this.getPrecalculated() > this.length()) {

      event.setID(this.length());
      console.log(event, this.length());
      this.buffer.push(event);

      console.log(this.buffer);
      let i = this.length() - 1;
      console.log(this.buffer[i]);
      this.refresh();
      this.buffer[i].setPos(this.jsonSpiral[i].cx, this.jsonSpiral[i].cy);
      console.log("event pushed");
    } else console.log("Nope");

    //this.refresh();
  }
  deleteEvent(N) {
    console.log("attempting to pop", N);
    for (let i = this.length() - 1; i > N; i--) {
      let b = this.buffer[i].getPos();
      this.buffer[i].setPos(this.getSpiral()[i - N].cx, this.getSpiral()[i - N].cy);
      console.log(b, this.buffer[i].getPos());
      svg.selectAll("circle")._groups[0][i].remove();


    }

    this.buffer.splice(0, N);

    console.log("buffer len:", this.length());
    this.refresh();
    //initCanvas();

  }
  shift(N) {
    this.deleteEvent(N);
    this.addEvent(N);
  }
  refresh() {
    this.jsonSpiral = toJson(generateEquidistantCoords(this.length()));
    this.jsonLine = toJson(generateFlatCoords(this.length()));
    for (let i = 0; i < this.length(); i++) {
      this.buffer[i].id = i;

    }
  }
  transition(id) {


  }

  getPrecalculated() {
    return this.circles;
  }
  length() {
    return this.buffer.length;
  }
  getLine() {
    return toJson(generateFlatCoords(this.length()));; //.splice(0,this.length());
  }
  getSpiral() {
    return toJson(generateEquidistantCoords(this.length())); //.splice(0,this.length());
  }
}



function initCanvas() {

  var init_r;
  let d = BUFFER.data();

  let items = svg.selectAll("items")
    .data(d)
    .enter(d)
    .append('g')
    .append("circle")
    .attr('stroke', 'black')
    .attr('stroke-width', 0)


    .on("mouseover", function (i) {
      console.log(i.r);
      document.getElementById('val').innerHTML = i.ts+"<br>"+i.val;

      d3.select(this)
        //.style("fill", "black")
        .transition()
        .duration(500)
        .attr('stroke-width', 5);
    })
    .on("mouseout", function (i) {

      d3.select(this)
        //.style("fill", "red")
        .transition()
        .duration(500)
        .attr('stroke-width', 0);
    });


  var circleAttributes = items
    .attr("cx", function (d) {
      return d.cx;
    })
    .attr("cy", function (d) {
      return d.cy;
    })
    .attr("r", function (d) {
      return d.r;
    })
    .attr("id", function (d) {
      return d.id;
    })

    .style("fill", function (d) {
      return d.color;

    });


  //.attr('text', 4);


}

var BUFFER = new eventBuffer(100);
BUFFER.prefill(50);



initCanvas();



function toJson(arr) {
  let new_arr = [];
  for (let i = 0; i < arr.length; i++) {
    new_arr.push({
      "cx": Math.floor(arr[i].x),
      "cy": Math.floor(arr[i].y),
      "r": arr[i].cr,
      "color": arr[i].color,
      "id": i
    });

  }

  return new_arr;

}

function drawAxes() {


  let f = BUFFER.getLine();
  let d = BUFFER.data();

  var txt = svg.selectAll('g')
    .data(f)
    .append("text")
    .attr('y', function (f) {
      return f.cy + 20;
    })
    .attr('x', function (f) {
      return f.cx;
    })
    //.attr('transform', "rotate("+f.cx+","+f.cy+","+")")
    .data(d)

    .text(function (d) {
      return d.ts;
    })
    .attr('style', "writing-mode: tb;font-size:10px;")
    .style('opacity', 0)
    .transition()
      .duration(500)
      .on("end", function () {
      //  txt.remove()
      })
      .ease(d3.easeLinear)
      .style("opacity", 1);
  //.attr('style',"font-size:20px")
  ;

  if (d3.selectAll('text')._groups[0].length > 50)
    d3.selectAll('text')
    .each(function (c, i) {
      var odd = i % 2 === 1;

      d3.select(this)
        //.style('fill', odd ? 'orange' : '#ddd')
        .attr('style', odd ? "writing-mode: tb;font-size:0px;" : "writing-mode: tb;font-size:10px")
        .style('opacity', 0)
        .transition()
      .duration(500)
      .on("end", function () {
      //  txt.remove()
      })
      .ease(d3.easeLinear)
      .style("opacity", 1);

    });

    //let txt = svg.selectAll("text");
   // txt


}

function addEvents(N) {
  
  if (svg.selectAll("circle")._groups[0][0].cx.baseVal.value == 0) {
    initiateTransition();
  }

  for (let i = 0; i < N; i++) {
    //console.log("Trying to push event",i);
    let color = "rgb(" + Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255) + ")";
    //console.log(color);
    BUFFER.addEvent(new event(color, 20));
  }
  //BUFFER.refresh();
  initCanvas();
}

function deleteEvents(N) {

  BUFFER.deleteEvent(N);
  initCanvas();
}

function shiftEvents(N) {
  deleteEvents(N);
  addEvents(N);

}


function initiateTransition() {
  //console.log(id);

  document.getElementById('trans').innerHTML = "Transitioning!";
  let next = [];
  let circles = svg.selectAll("circle");


  if (circles._groups[0][0].cx.baseVal.value == 0) {
    let txt = svg.selectAll("text");
    txt.transition()
      .duration(500)
      .on("end", function () {
        txt.remove()
      })
      .ease(d3.easeLinear)
      .style("opacity", 0);
    

    next = BUFFER.getSpiral();
  } else {
    drawAxes();


    next = BUFFER.getLine();
  }
  //console.log(next);
  let d = BUFFER.data();

  circles.transition()
    .duration(1000)
    .on("end", function () {
      document.getElementById('trans').innerHTML = "Initiate transition!";
    })
    .tween("move", function () {
      let self = d3.select(this),
        x = d3.interpolate(self.attr('cx'), next[self.attr('id')].cx),
        y = d3.interpolate(self.attr('cy'), next[self.attr('id')].cy);
      r = d3.interpolate(self.attr('r'), next[self.attr('id')].r);
      //console.log(next[self.attr('id')]);
      return function (t) {
        // console.log(t);
        let cx = x(t),
          cy = y(t),
          cr = r(t);

        self.attr("cx", cx);
        self.attr("cy", cy);
        self.attr("r", cr);
      };
    });


}


function generateFlatCoords(N) {

  flatCoords = [];
  let myScale = d3.scaleLinear()
    .domain([0, N])
    .range([0, WIDTH]);


  for (let i = 0; i < N; i++) {
    step = myScale(i, 0, N, 5, WIDTH);

    let v = {
      x: step,
      y: HEIGHT / 2,
      cr: 2
    };

    flatCoords.push(v);

  }
  return flatCoords;

}

function generateEquidistantCoords(N) {


  let increment = 0.2;
  let step = 0;
  let radius = 5;
  let coords = [];
  for (let i = 0; i < N; i++) {
    step += increment;
    let v = getEquidistantVector(radius, 30, step);
    coords.push(v);

  }

  return coords;


}

function getEquidistantVector(R, N, T) {
  let height = HEIGHT;
  let a = height / 2; //let k=20;


  let TN_root = Math.sqrt(T * N);

  let x = TN_root * Math.cos(TN_root);
  let y = TN_root * Math.sin(TN_root);;
  return {
    x: a + R * x,
    y: a + R * y,
    cr: R
  };
}