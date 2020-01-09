var HEIGHT = 500;
var WIDTH = 500;
var MARGIN=50;
var init_time=Date.now();

var ccs;



/* global requestAnimationFrame, $, d3 */
window.requestAnimationFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
           return window.setTimeout(callback, 1000/60);
         };
})();
 

var svg = d3.select("body")
  .append("svg")
  .attr("width", WIDTH)
  .attr("height", HEIGHT);

  // add the tooltip area to the webpage
var tooltip = d3.select("body").append("div")
.attr("class", "tooltip")
.style("opacity", 0);

class event {
  constructor(type,color, value) {
    this.type=type;
    this.color = color;
    this.val = value;
    this.id = null;
    let time = new Date();
    this.ts = time.getHours()+":"+time.getMinutes()+":"+time.getSeconds();
    this.unix_ts=Date.now();
    this.r = map(value, 0,100,1,10);//Math.floor(Math.random()* (10 - 2) + 2);
    this.magnitude=null;
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
    this.radii=[];
    this.jsonSpiral = toJson(generateEquidistantCoords(this.circles));
    this.jsonLine = toJson(generateFlatCoords(this.circles));
    this.buffer = [];

  }

  data() {
    //this.refresh();
    return this.buffer;
  }

  prefill(N) {
    for (let i = 0; i < N; i++) {
      this.addEvent(new event('PREFILL',"rgb(150,155,150)", 0));
    }
    //customFill();
    this.recordRadii();
  }
  addEvent(event) {
    if (this.getPrecalculated() > this.length()) {

      event.setID(this.length());
      //console.log(event, this.length());
      this.buffer.push(event);

     // console.log(this.buffer);
      let i = this.length() - 1;
      //console.log(this.buffer[i]);
      this.refresh();

      //automatically goes to spiral
      this.buffer[i].setPos(this.jsonSpiral[i].cx, this.jsonSpiral[i].cy);
    } else 
    this.refresh();
    this.adjustMagnitude();
  }

  restoreBuffer(){
    let spiral=this.getSpiral();
    for (let i = 0; i < this.length(); i++) {
    this.buffer[i].cx = spiral[i].cx;
    this.buffer[i].cy = spiral[i].cy;
    }
  }
  deleteEvent(N) {
    console.log("attempting to pop", N);
    for (let i = this.length() - 1; i > N; i--) {
      let b = this.buffer[i].getPos();
      this.buffer[i].setPos(this.getSpiral()[i - N].cx, this.getSpiral()[i - N].cy);
      console.log(b, this.buffer[i].getPos());
      svg.selectAll(".circles")._groups[0][i].remove();

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

    this.recordRadii();
  }
  recordRadii() {
    for (let i = 0; i < this.length(); i++) {
      this.radii[i]=this.buffer[i].r;
    }

  }
  adjustMagnitude(){
    for (let i = 0; i < this.length(); i++) {
      if(this.buffer[i].type=='FINISH'){
        let dur=(this.buffer[i].unix_ts-this.buffer[i-1].unix_ts)/1000;
        let intensity=this.buffer[i].val;
        let magnitude=dur*intensity;
        this.buffer[i].magnitude=magnitude;
        let newRadius=map(magnitude,1,400,1,10);

        if (newRadius<1){newRadius=1;}
        else if(newRadius>11){newRadius=11}

        this.buffer[i].r=newRadius;
        //console.log(magnitude,newRadius);
      }
    }
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


function getRandomOffset(offset) {
  return (Math.random() * 2 * offset) - offset;
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
     // onmouse = function(e){console.log("mouse location:", e.clientX, e.clientY)}
     //console.log(d3.event.pageX,d3.event.page);
      tooltip.transition()
      .duration(200)
      .style("opacity", .9);
    tooltip.html("Logged: "+i.ts + "<br/> Intensity: " +i.val +"<br/> Magnitude: "+Math.floor(i.magnitude))
      .style("left", (d3.event.pageX + 5) + "px")
      .style("top", (d3.event.pageY - 28) + "px");
      
     // console.log(e.clientX,  e.clientY);
      //document.getElementById('val').innerHTML = i.ts+"<br>"+i.val;

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

        tooltip.transition()
        .duration(500)
        .style("opacity", 0);

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

    })
    .attr('class','circles');
    
svg.append("path");

let colors=["rgb(255,0,0)","rgb(0,0,255)","rgb(0,0,0)"]
let text=['Incoming Event', 'Event','Watchdog'];


  }
  
var BUFFER = new eventBuffer(350);
BUFFER.prefill(1);



initCanvas();

var stepCurve=d3.curveStepBefore;



//not working as well as expected
function preMove(){
  let x_=[];
  let y_=[];
  for(let i=0; i<BUFFER.length();i++){
    x_.push(getRandomOffset(20));
    y_.push(getRandomOffset(20));
  }
  
 ccs.transition()
  .duration(250)
  .on("end", function () {
    //vibrate(500);
    console.log("done1");
   // document.getElementById('trans').innerHTML = "Initiate transition!";
  })
  .tween("move", function (d,i) {
    let self = d3.select(this),
      x = d3.interpolate(self.attr('cx'),parseInt(self.attr('cx'))+x_[i]),
      y = d3.interpolate( self.attr('cy'),parseInt(self.attr('cy'))+y_[i]);
     
    return function (d) {  
      let cx = x(d),
        cy = y(d);
      self.attr("cx", cx);
      self.attr("cy", cy);
     
    };
  }); 
}

function moveBack(){
  ccs=svg.selectAll(".circles");
  ccs.transition()
  .duration(250)
  .on("end", function () {
    BUFFER.restoreBuffer();
    //ccs.remove();
    //initCanvas();
  })
  .tween("move", function () {
    let self = d3.select(this),
      x = d3.interpolate(self.attr('cx'),BUFFER.getSpiral()[self.attr('id')].cx),
      y = d3.interpolate( self.attr('cy'),BUFFER.getSpiral()[self.attr('id')].cy);
    return function (d) {  
      let cx = x(d),
        cy = y(d);
      self.attr("cx", cx);
      self.attr("cy", cy);
      
    };
  });


}

function move3(){
  ccs=svg.selectAll(".circles");

    ccs.each(function(d,i){

      d3.select(this)
          .attr('cx',function(d){  
            return d.cx += getRandomOffset(0.5);})

          .attr('cy',function(d){  
            return d.cy += getRandomOffset(0.5);})
          });
}


function vibrate(duration){
  var start= null;  
  function step(timestamp) {
    if (!start) start = timestamp;
    var progress = timestamp - start;
    move3();
    if (progress < duration) {
      window.requestAnimationFrame(step);
      //console.log(progress);
    }else{ 
      //runs after the last animation frame is finished
    moveBack();
  }
  }
  window.requestAnimationFrame(step);
}

//recursive move animation without frame updates
function move(N){
 
  if(N>0){
    setTimeout(function(){
       ccs.each(function(d,i){d3.select(this)
         .attr('cx',function(d){  
        return d.cx+=getRandomOffset(1) ;})
    
          .attr('cy',function(d){ 
          return d.cy+=getRandomOffset(1) ;});})
      },1);
      move(--N);
    }
  }


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
function customFill(){
  addEvents(1,"WATCHDOG", 0)
  addEvents(1,"START", 0)
  addEvents(1,"FINISH", 10)
  addEvents(1,"WATCHDOG", 0)
  addEvents(1,"START", 0)
  addEvents(1,"FINISH", 30)
  addEvents(1,"WATCHDOG", 0)
  addEvents(1,"WATCHDOG", 0)
  addEvents(1,"START", 0)
  addEvents(1,"FINISH", 80)
  addEvents(1,"WATCHDOG", 0)
  addEvents(1,"START", 0)
  addEvents(1,"FINISH", 20)
  addEvents(1,"WATCHDOG", 0)
  addEvents(1,"WATCHDOG", 0)
  addEvents(1,"WATCHDOG", 0)
  addEvents(1,"START", 0)
  addEvents(1,"FINISH", 100)
  }


function drawAxes() {


  let f = BUFFER.getLine();
  let d = BUFFER.data();

  var txt = svg.selectAll('g')
    .data(f)
    .append("text")
    .attr("id", "xticks")
    .attr('y', function (f) {
      return (HEIGHT / 2) + 20;
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
        //txt.remove()
      })
      .ease(d3.easeLinear)
      .style("opacity", 1);


	let txt_ts= d3.selectAll('#xticks')._groups[0];
	 for(let i =1; i<txt_ts.length-1;i++){
	 	let current_txt=parseInt(txt_ts[i].attributes.x.value);
	 	let prev_txt=parseInt(txt_ts[i-1].attributes.x.value);
	 	
		if(current_txt-prev_txt<7){
			d3.select(txt_ts[i])
			.attr('style',  "writing-mode: tb;font-size:0px;")
			}
	 	}
     var y_values=[0];
 let lines1=	svg.selectAll('path')
  	.datum(f)
  	.attr("fill", "none")
  	.attr('stroke', 'black')
  	.attr("d", d3.line()
  		.curve(d3.curveStepBefore)
  		.x( function (f) {return f.cx})
  		.y( function (f) {y_values.push(map(f.cy,0,100,250,150)); return f.cy})
  		)
  	.attr('stroke-width', 0)
  	.transition()
      	.duration(500)
      	.on("end", function () {
     		
      	     })
       	.attr('stroke-width', 1)
       	.ease(d3.easeLinear)

 //console.log(y_values);
 let y_offset=105;
  // Create scale
  let y_scale = d3.scaleLinear()
  .domain([d3.min(y_values), d3.max(y_values)])
  .range([y_offset, 0]);

   // Add scales to axis
   let y_axis = d3.axisLeft()
   .scale(y_scale);
   
   svg.append("g")
   .attr("transform", "translate("+MARGIN+", "+(y_offset+40)+")")
   .call(y_axis)
   .attr("id", "xticks");//put the same id as xticks 

   
}

function addEvents(N, state, intensity,) {
  
  try{
    if(svg.selectAll(".circles")._groups[0][0].cx.baseVal.value == MARGIN) {
  
      svg.selectAll('.circles')
                    .attr('opacity', 0)
                    .transition()
                    .duration(100)
                    .ease(d3.easeLinear)
                    .attr("opacity", 1)
                    .on("end", initiateTransition());    
    }

 }
 catch(err){}

  

  for (let i = 0; i < N; i++) {
    //console.log("Trying to push event",i);
let color;
    if(state==='START'){
  color="rgb(0,0,0)";
  vibrate(2000);
  //break;
	 }
   else if(state==='FINISH'){
    	color="rgb(0,0,255)";
        }
   else if(state==='WATCHDOG'){
   	color="rgb(0,0,0)";
       }
    else{color="rgb(0,0,0)";}
       
  
    BUFFER.addEvent(new event(state,color, intensity));
  }
  //BUFFER.refresh();
  ccs=svg.selectAll(".circles");
  ccs.remove();
  initCanvas();
  }

function deleteEvents(N) {

  BUFFER.deleteEvent(N);
  initCanvas();
}

function shiftEvents(N) {
  deleteEvents(N);
  addEvents(N,"None",0);

}


function initiateTransition() {
//svg.selectAll('circle').attr('visibility','hidden');

  document.getElementById('trans').innerHTML = "Transitioning!";
  let next = [];
  let circles = svg.selectAll(".circles");


  if (circles._groups[0][0].cx.baseVal.value == MARGIN) {

 	let paths = svg.selectAll("path");
          paths.transition()
            .duration(500)
            .on("end", function () {
              paths.remove()
            })
            .ease(d3.easeLinear)
  			.attr('stroke-width', 0)


    let txt = svg.selectAll("#xticks");
    txt.transition()
      .duration(500)
      .on("end", function () {
        txt.remove()
      })
      .ease(d3.easeLinear)
      .style("opacity", 0);

                 

    next = BUFFER.getSpiral();
  } else {
	svg.append('path');
    drawAxes();
    next = BUFFER.getLine();
    
  }
  //console.log(next);
  let d = BUFFER.data();
//console.log(d);
  circles.transition()
    .duration(1000)
    .on("end", function () {
      document.getElementById('trans').innerHTML = "Initiate transition!";
    })
    .tween("move", function () {
      let self = d3.select(this),
        x = d3.interpolate(self.attr('cx'), next[self.attr('id')].cx),
        y = d3.interpolate(self.attr('cy'), next[self.attr('id')].cy),
        r = d3.interpolate(self.attr('r'), next[self.attr('id')].r);
      //console.log(next[self.attr('id')],r);
      return function (d) {
         
        let cx = x(d),
          cy = y(d),
          cr =r(d);//r(t);
         // console.log(cr,r, t); 
        self.attr("cx", cx);
        self.attr("cy", cy);
        self.attr("r", cr);
      };
    });


}

function map(n, start1, stop1, start2, stop2){
  let newval=((n-start1)/(stop1-start1)*(stop2-start2)+start2);
  //console.log(newval);
	return newval;
}

function generateFlatCoords(N) {

	//let margin=MARG;
	
	  flatCoords = [];
	  let myScale;
	  let first;
	  let last;
	  
	try{
	   myScale = d3.scaleLinear()
	   		.domain([BUFFER.buffer[0].unix_ts,BUFFER.buffer[N-1].unix_ts])
	   		.range([MARGIN, WIDTH-MARGIN]);
	
	   first=BUFFER.buffer[0].unix_ts;
	   last= BUFFER.buffer[N-1].unix_ts;
	}
	catch(err){
		myScale = d3.scaleLinear()
		   .domain([init_time,Date.now()])
		   .range([MARGIN, WIDTH-MARGIN]);
		   //console.log("scaleLinear failed")
		   first=init_time;
		   last=Date.now();
	}
	
	
	//console.log('domain',last-first);
	
	for (let i = 0; i < N; i++) {
		
		let offset=0;
		let step;
	
		try{
	 		offset=BUFFER.buffer[i].val;
			 step = myScale(BUFFER.buffer[i].unix_ts,first,last, MARGIN, WIDTH-MARGIN);
			//console.log('all good', step)
			}
		catch(err){
			offset=0;
			step =myScale( i,init_time,Date.now(), MARGIN, WIDTH-MARGIN);
			}
	
	
		
	//step = myScale( i,0, N, 10, WIDTH);
	
	let v = {
	 			      x: step,
	 			      y: (HEIGHT / 2)-offset,
	 			      cr: 2
	 			    };		 

    flatCoords.push(v);

  }
  return flatCoords;

}

function generateEquidistantCoords(N) {


  let increment = 0.2;
  let step = 0;
  
  let coords = [];
  for (let i = 0; i < N; i++) {
    step += increment;
    //radius=Math.floor(Math.random()*10);
    let v = getEquidistantVector(i, 30, step);
    coords.push(v);

  }

  return coords;


}

function getEquidistantVector(index, N, T) {
  let height = HEIGHT;
  let a = height / 2; //let k=20;
  let spacing_radius=5;

  let TN_root = Math.sqrt(T * N);
  
  let x = TN_root * Math.cos(TN_root);
  let y = TN_root * Math.sin(TN_root);
  let R;
  try{R=BUFFER.radii[index];   
     //console.log("BUENO",R);
}catch(err){
   // console.log("caught error");

    R=25;
  }
  return {
    x: a + spacing_radius * x,
    y: a + spacing_radius * y,
    cr: R
  };
}