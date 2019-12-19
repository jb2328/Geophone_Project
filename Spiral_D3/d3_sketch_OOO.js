var HEIGHT = 500;
var WIDTH = 500;

var N_CIRCLES=70;
var jsonCircles = toJson(generateEquidistantCoords(N_CIRCLES));
var jsonLine = toJson(generateFlatCoords(N_CIRCLES));

var svg = d3.select("body")
  .append("svg")
  .attr("width", WIDTH)
  .attr("height", HEIGHT);

// console.log(svg);


var circles = svg.selectAll("circle")
  .data(jsonCircles)
  .enter()
  .append("circle");



var circleAttributes = circles
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

  .attr("fill",function(d) {
    return d.color;
    
  // .style("fill", function (d) {
  //   return  d.color;
  });


function toJson(arr) {
  let new_arr = [];
  for (let i = 0; i < arr.length; i++) {
    new_arr.push({
      "cx": arr[i].x,
      "cy": arr[i].y,
      "r": arr[i].cr,
      "color": arr[i].color,
      "id": i
    });

  }

  return new_arr;

}


  function addEvents(N){
    let arrayState=points.length;
  for(let i =0; i<N; i++){

  let v;
  //let col;

  let col= color(random(50,255),random(50,255),random(50,255));

  v=coords[arrayState+i];
  //append points to the point array
  points.push(new dataPoint(v,col));

  }

  }
  function deleteEvents(N){
    for(let i =points.length-1; i>N;i--){
  
      let b =points[i].getPos();
    
      points[i].setPos(coords[i-N].x, coords[i-N].y);
    
    }
    
    points.splice(0,N);
    
    console.log("arr len: "+points.length);
  }
  function shiftEvents(N){
    deleteEvents(N);
    addEvents(N);

  }


function initiateTransition(id) {
  console.log("Hi");

  id.innerHTML = "Transitioning!";
  let next = [];

  if (circles._groups[0][0].cx.baseVal.value == 0) {
    next = jsonCircles;
  } else {
    next = jsonLine
  }

  circles.transition()
    .duration(1000)
    .on("end", function () {
      id.innerHTML = "Initiate transition!";

    })
    .tween("move", function () {
      let self = d3.select(this),
        x      = d3.interpolate(self.attr('cx'),    next[self.attr('id')].cx),
        y      = d3.interpolate(self.attr('cy'),    next[self.attr('id')].cy);
        r = d3.interpolate(self.attr('r'),next[self.attr('id')].r);

      return function (t) {
        let cx = x(t),
          cy = y(t),
          cr=r(t);

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
      cr: 1
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
