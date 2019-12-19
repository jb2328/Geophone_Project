
points=[];
coords=[];
flatCoords=[];

var finished_transition=true;
var swirl=true;

var transition_step = 0.009;
var amount = 0;


var counter=0;

var mouseIsClicked=false;
var last_read;

var rSlider;
var sSlider;
var iSlider;

function setup() {
  // put setup code here
createCanvas(400,400);
//generateCoords(200);
generateEquidistantCoords(999);
generateDots(100);
//generateFlatCoords();




}

function draw() {
  background(230);

  drawVertices();
  drawPoints();
  transitionModes();
  
//console.log();
setMode();
  // for(let i =0; i<flatCoords.length;i++){
  //   let v=flatCoords[i];
  //   point(v.x,v.y);
  // }
  //.log(rSlider.value(),sSlider.value(),iSlider.value());
  //regenerateEquidistantCoords(rSlider.value(),points.length,sSlider.value(),iSlider.value())

}

function getMode(){

if(!finished_transition){
  return "in movement"
}
if(swirl){
return "spiral mode"

}
else{return "straight line"}

}

function setMode(){

  if(!finished_transition){
    //return "in movement"
  }
  let v=points[0].getPos();
  if(dist(v.x,v.y, 0, height/2)>20 &&(dist(v.x,v.y, width/2, height/2)<20)){
    swirl=true;
    console.log("swirly boi");

  }
  else{swirl=false;}
}
  



function transitionModes(){
  if(!finished_transition){
  if (amount > 1 || amount < 0) {
    transition_step *= -1;
    finished_transition=true;
  }
  amount += transition_step;

  for(let i =0; i<points.length;i++){

    let start=coords[i];
    let finish=flatCoords[i];

    let temp = p5.Vector.lerp(start, finish, amount);


    push();
    translate(0,0);
    points[i].setPos(temp.x,temp.y);
    translate(temp.mag(),0);
    //console.log(temp.mag())


    pop();

  }
}
}


function addDots(N){
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

function generateFlatCoords(){

//let increment=(width)/N;
//let step=(width/N)/2;
flatCoords=[];
let N=points.length;

  for(let i =0; i<N;i++){
    step=map(i, 0,N, 5, width);
    let v=createVector(step, height/2);
    flatCoords.push(v); 
  
  }
  
}

function regenerateEquidistantCoords(R,N,S, inc){
  
coords=[];
  increment=inc;
let step=0;
let radius;
  for(let i =0; i<N;i++){
    step+=increment;
    radius=R;
    //getEquidistantVector(R,N,T){
    v=getEquidistantVector(radius,S,step);
    coords.push(v); 
  
  }
  

}


function generateEquidistantCoords(N){
  

  increment=0.1;
  let step=0;

  for(let i =0; i<N;i++){
    step+=increment;
    radius=5;
    //getEquidistantVector(R,N,T){
    v=getEquidistantVector(radius,30,step);
    coords.push(v); 
  
  }
  
  

}

function getEquidistantVector(R,N,T){
  let a=height/2;  //let k=20;
  let r=R
  
  let TN_root=Math.sqrt(T*N);
  
  let x=TN_root*cos(TN_root);
  let y=TN_root*sin(TN_root);;
  return createVector(a+r*x,a+r*y );//a+r*sin(T)
  }
  

function generateCoords(N){
  let increment=0.5;
let step=0;
let radius=1;
  for(let i =0; i<N;i++){
    step+=increment;
    radius+=2.1*increment;
    v=getVector(radius,step);
    coords.push(v); 
  
  }
  
  step=0;
  radius=1;

}
function generateDots(N){
  for(let i =0; i<N; i++)
{  
  let v;
  let col;
  if(i==0||i==N-1){col=color(255,0,0)}
  else{
  col= color(random(0,50),random(0,50),random(0,50));}

  v=coords[i]
  //apend points to the point array
  points.push(new dataPoint(v,col));

}
}

function debugCoords(){
  stroke(0);
  strokeWeight(1);
  //horiz
  line(0,height/2, width,height/2);
  //vert
  line(width/2,0,width/2,height);

  let a =[mouseX, mouseY];
  text(a, mouseX, mouseY);

}
function timePassed(){
if(millis()-last_read>100){

  return true;
}
else return false;

}

function keyReleased() {
if(swirl){
  if(key=='z'){
    console.log("deleting 2 dots");
    deletePoints(2);
  }
  if(key=='x'){
    console.log("shifting by 1 dot");

    deletePoints(1);
    addDots(1);
    //shiftPoints();
  }
  if(key=='c'){
    console.log("adding 10 dots");

    addDots(10);

  }}
  if(key==' '){
    generateFlatCoords();
    finished_transition=false;
    transitionModes();

  
}

}

function deletePoints(N){
 

for(let i =points.length-1; i>N;i--){
  
  let b =points[i].getPos();

  points[i].setPos(coords[i-N].x, coords[i-N].y);

}

points.splice(0,N);

console.log("arr len: "+points.length);

}



function drawPoints(){
  noFill();
  
 // beginShape();
for(let i=0; i<points.length;i++){
  if(i%10==0){
    this.points[i].highlight();

    if(!swirl){
      this.points[i].showID();
  
    }

  }
this.points[i].display();
this.points[i].hover();




}
}


function drawVertices(){
  strokeWeight(0.5);
  stroke(60);
  beginShape();
  //vertex(points[1].x,points[1].y);

for (let i=0; i<points.length; i++){
  let b =points[i].getPos();
curveVertex(b.x,b.y);
} 
curveVertex(points[points.length-1].x,points[points.length-1].y);

endShape();
}

function mouseClicked(){
  mouseIsClicked=true
  return mouseIsClicked
}

function getVector(R, T){
let a=height/2;
let r=R
return createVector(a+r*cos(T), a+r*sin(T));
}

function getMouseQuadrant(){
  if((mouseX>0)&&(mouseX<width/2)&&(mouseY>0)&&(mouseY<height/2)){
    return 1;
  }
  if((mouseX>width/2)&&(mouseX<width)&&(mouseY>0)&&(mouseY<height/2)){
    return 2;
  }
  if((mouseX>width/2)&&(mouseX<width)&&(mouseY>height/2)&&(mouseY<height)){
    return 3;
  }
  if((mouseX>0)&&(mouseX<width/2)&&(mouseY>height/2)&&(mouseY<height)){
    return 4;
  }

}
// Point class
class dataPoint {
  constructor(V,COL) {
    this.x = V.x;
    this.y = V.y;
    //this.diameter = random(10, 30);
    this.color = COL;
  }

setPos(newX,newY){
this.x=newX;
this.y=newY;

}

getPos(){
  return createVector(this.x,this.y);
}

  highlight(){
    strokeWeight(10);
    stroke(0,50);
    point(this.x, this.y);
  }

   display() {
    strokeWeight(3);
    stroke(this.color);
    point(this.x, this.y);
  }
  showID(){
    //strokeWeight(10);
    //stroke(0,50);
    //point(this.x, this.y+30);
    
    noStroke();
    fill(0);
    textSize(8);
    textAlign(CENTER);
    let textData=points.indexOf(this);

    text(textData,this.x, this.y+30), 

    noFill();


  }
  hover(){
    let thresh=5;
    if(dist(mouseX, mouseY, this.x,this.y)<thresh){

    

  let offsetBox_X;
  let offsetBox_Y;
  let offsetText_X;
  let offsetText_Y;

      switch(getMouseQuadrant()){
        case 1:
            offsetBox_X=-50;
            offsetBox_Y=-35;
            offsetText_X=-50;
            offsetText_Y=-25;
          break;
          case 2:
              offsetBox_X=50;
              offsetBox_Y=-35;
              offsetText_X=2;
              offsetText_Y=-25;
            break;
            case 3:
                offsetBox_X=50;
                offsetBox_Y=35
                offsetText_X=2;
                offsetText_Y=10;
              break;
              case 4:
                  offsetBox_X=-50;
                  offsetBox_Y=35;
                  offsetText_X=-50;
                  offsetText_Y=10;
                break;
                default:
                    offsetBox_X=50;
                    offsetBox_Y=-35;
                    offsetText_X=50;
                    offsetText_Y=35;
              
                  break;


      }
     

    fill(50,99);
    strokeWeight(0.6);


    rect(this.x, this.y,offsetBox_X,offsetBox_Y);

    noStroke();
    fill(0);
    textSize(8);
    textAlign(LEFT);
    let textData="EVENT\t"+points.indexOf(this)+"\nTS\nVALUE";

    text(textData,this.x+offsetText_X, this.y+offsetText_Y), 

    noFill();
    }
  }
}