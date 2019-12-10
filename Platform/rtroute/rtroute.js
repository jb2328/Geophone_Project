"use strict";
// ***************************************************************************
// *******************  Page and map code ************************************
// ***************************************************************************
// Constants

var VERSION = '5.06';
            // 5.06 token support, set_uri added to RTMONITOR_API
            // 5.05 bugfix for TIMETABLE_URI
            // 5.04 updated to use rtmonitor_api 3.0 (register & connect methods)
            // 5.03 added transport/stops API to retrieve stops within bounding box
            // 5.02 remove local rt socket code and use RTMonitorAPI from tfc_web
            // 5.01 move bus tracking code into ../rt_tracking, generalize API for tracking
            // 4.10 add rtmonitor-config.js and API key support
            // 4.09 rtmonitor websocket uri now https, added blur callback for change on page
            // 4.08 improving polygon draw support
            // 4.07 forward/back scroll through sock send messages, subscribe link on bus popup
            // 4.06 display/update RTMONITOR_URI on page
            // 4.05 will now get_route() and draw_route_profile() on bus popup -> journey
            // 4.04 geo.js get_box() and is_inside() testing
            // 4.03 using stop -> journeys API
            // 4.02 restructure to use sensor.state.route_profile and not .route
            // 4.01 adding timetable API call to lookup sirivm->route
            // 3.12 added 'pattern_starting' sensor state variable 0..1
            // 3.11 improve timetable vector from prior start stub
            // 3.10 segment_progress (not path_progress)
            // 3.09 progess (still as 'path progress')
            // 3.08 added stop delay to (path) progress
            // 3.06 more work on (path) progress vector
            // 3.04 'before' function added to segment distance
            // 3.03 'beyond' function added to segment distance
            // 3.01 added basic timetable vector (binary started /not started)
            // 2.00 initial development of 'progress vector'
            // 1.00 initial development of 'segment distance vector'

// All supplied from rtroute_config.js
// var RTMONITOR_URI = '';
// var TIMETABLE_URI = '';
// var STOP_API
// var STOPS_API
// var API_KEY = '';

var DEBUG = '';

var STOP_MAX_JOURNEYS = 20; // max # of journeys to request from transport api (i.e. nresults)

var LOG_TRUNCATE = 200; // we'll limit the log to this many messages

var MAP_CENTER = [52.20563, 0.11798];//[52.205, 0.119];
var MAP_SCALE = 13;//15;

var OLD_TIMER_INTERVAL = 30; // watchdog timer interval (s) checking for old data records
var OLD_DATA_RECORD = 60; // time (s) threshold where a data record is considered 'old'

var SVGNS = 'http://www.w3.org/2000/svg';

var DRAW_PROGRESS_LEFT_MARGIN = 5;
var DRAW_PROGRESS_RIGHT_MARGIN = 5;
var DRAW_PROGRESS_TOP_MARGIN = 20;
var DRAW_PROGRESS_BOTTOM_MARGIN = 10;

// RTMonitor rt_connect client_data
var CLIENT_DATA = { rt_client_name: 'RTRoute V'+VERSION,
                    rt_client_id: 'rtroute',
                    rt_token: 'xmVLnwqANWeJrZH0Dxfww1GUYt5zWk5BmawvWIF7gOWFYfKspFOYtPoCQt4wOzrWmTF34Pi6SUERykWrEfsP6gSh4bwYvzkc7tEm0BZdsTC2tMeteio1IWIH1E3OGEC3yO49nOYwf7+ZpFmiDyhL/RvfL1TfjYDseTnKSbCzght2vDxpjAKxRJP2TsHzXpjlhZOq4UXMSpUltirdmMYVmfmtuebgVs0bAIRPzJjOc7nycnkC8CMftbraIn5JSSKd4yx4+4T/BNodrhE3gfBEn2qiMLp2K7G74ogT92228tkXfII5rNYcd6z6RuVPcBfHQtgUNG0AAnrfMqt8ggG5it+JKDIMrLdVNqqRK4Hjxo3nxsGbe/hVKCMMZqiD8wEp'
                  };

// *************************************************************
// *************************************************************
// Globals
// *************************************************************
// *************************************************************
var map = null;       // Leaflet map
var map_tiles; // map tiles layer

var urlparams = new URLSearchParams(window.location.search);
var debug = urlparams.has('debug');
var mapbounds;

var clock_time; // the JS Date 'current time', either now() or replay_time
var clock_timer; // the intervaltimer to update the clock in real time (not during replay)

var log_div; // page div element containing the log

var page_progress = {}; // All the 'progress' page elements and page-related global vars
//    .div -- page div element to hold progress visualization
//    .svg -- svg element within div for drawn elements
//    .annotations -- array with element for each route segment derived from data segment_index annotations
//       .box -- the svg rect
//    .route_profile -- the route_profile currently being displayed
//
var progress_update_elements = []; // these are the SVG elements we delete and create each update

var PROGRESS_X_START; // pixel dimensions of progress visual route draw area
var PROGRESS_X_FINISH;
var PROGRESS_Y_START;
var PROGRESS_Y_FINISH;

var log_record_odd = true; // binary toggle for alternate log background colors

var log_append = false;

var log_data = false;

// *********************************************************
// RTRoutes globals

// Sensor data - dictionary of sensors by sensor_id
var sensors = {};
// Where each sensor:
// sensor
//    .msg                - the most recent data message received for this sensor
//    .bus_tracker        - function object containing route tracking state
//    .prev_segment_index - memory of previous segment_index for drawing highlight lines on change
//    .route_highlight    - route highlight drawn line
//    .old                - boolean when sensor data is 'old'


// Local dictionary of STOPS keyed on stop_id
// Sample stop record in rtroute_stops:
// { stop_id:'0500CCITY055', lat:52.2114061236, lng:0.10481260687, common_name:'Storey\'s Way'},
// becomes
// stops_cache['0500CCITY055'] = {this stop record}
var stops_cache = {};

var stops_drawn; // boolean whether stops are drawn on map or not

// Local cache dictionary of JOURNEYS keyed on vehicle_journey_id
// Sample journey data record in rtroutes_journeys:
// {vehicle_journey_id:'20-4-_-y08-1-98-T2',order:1,time:'11:22:00',stop_id:'0500SCAMB011'},
// becomes:
// journeys['20-4-_-y08-1-98-T2'] = { route: [ ... {above record} ] }
var journey_cache = {};
var journey_start_times = {}; // holds lists of journeys by start time

var drawn_journeys = {}; // dictionary (by drawn_journey_id_id) of drawn routes, so they can be removed from map

var drawn_stops = {}; // dictionary (by stop_id) of drawn stops so they can be updated/removed from map

// Trip data (from rtroutes_trip.js)
//  { "Delay": "PT0S",
//    "acp_id": "SCCM-19611",
//    "acp_ts": 1511156152,
//    "Bearing": "0",
//    "InPanic": "0",
//    "LineRef": "4",
//    "acp_lat": 52.230381,
//    "acp_lng": 0.159207,
//    "Latitude": "52.2303810",
//    "Longitude": "0.1592070",
//    "Monitored": "true",
//    "OriginRef": "0500SCAMB011",
//    "OriginName": "De La Warr Way",
//    "VehicleRef": "SCCM-19611",
//    "OperatorRef": "SCCM",
//    "DataFrameRef": "1",
//    "DirectionRef": "INBOUND",
//    "DestinationRef": "0500CCITY484",
//    "RecordedAtTime": "2017-11-20T05:35:52+00:00",
//    "ValidUntilTime": "2017-11-20T05:35:52+00:00",
//    "DestinationName": "Drummer Str Stop D3",
//    "PublishedLineName": "4",
//    "VehicleMonitoringRef": "SCCM-19611",
//    "DatedVehicleJourneyRef": "2",
//    "OriginAimedDepartureTime": "2017-11-20T06:02:00+00:00"
//    },

// Message history for socket messages SENT
var rt_send_history =  [];

var rt_history_cursor = 0; // index to allow user scrolling through history

// Data recording
var recorded_records = [];
var recording_on = false;

// Replay
var replay_time; // holds JS Date, current time of replay
var replay_timer; // the JS interval timer for the replay function
var replay_on = false; // Replay mode on|off
var replay_interval = 1; // Replay step interval (seconds)
var replay_speedup = 10; // relative speed of replay time to real time
var replay_index = 0; // current index into replay data
var replay_errors = 0; // simple count of errors during replay
var replay_stop_on_error = false; // stop the replay if annotation doesn't match analysis

// Segment analysis
var analyze = false;

// Batch replay
var batch = false;

// Annotate (i.e. the user adds the 'correct' segments to the data)
var annotate_auto = false;
var annotate_manual = false;

// *********************************************************
// Display options

var breadcrumbs = false; // location 'breadcrumbs' will be dropped as things move

var map_only = false; // page is in "only display map" mode

// Here we define the 'data record format' of the incoming websocket feed
var RECORD_INDEX = 'acp_id';  // data record property that is primary key
var RECORDS_ARRAY = 'request_data'; // incoming socket data property containing data records
var RECORD_TS = 'acp_ts'; // data record property containing timestamp
var RECORD_TS_FORMAT = 'unix'; // data record timestamp format
                                  // 'ISO8601' = iso-format string
var RECORD_LAT = 'Latitude';      // name of property containing latitude
var RECORD_LNG = 'Longitude';     // name of property containing longitude

// *****************
// Map globals
var ICON_URL = '/static/images/bus-logo.png';

var ICON_IMAGE = new Image();
ICON_IMAGE.src = ICON_URL;

var crumbs = []; // array to hold breadcrumbs as they are drawn

var icon_size = 'L';

var oldsensorIcon = L.icon({
    iconUrl: ICON_URL,
    iconSize: [20, 20]
});

// *************************
// **** Routes stuff

var bus_stop_icon = L.icon({
    iconUrl: '/static/images/bus_stop.png',
    iconSize: [15,40],
    iconAnchor: [3,40]
});

// ************************
// User 'draw polygon' global vars. The polygon must always be drawn CLOCKWISE.
// The code will automatically add a dashed 'close' line to the polygon between the
// last vertex and the first, closing the shape.
// For use in traffic 'zones', the first drawn edge is always selected as the 'start'
// and the midpoint of any other edge can be clicked on to make it the 'finish'.
var poly_draw = false; // true when user is drawing polygon
var poly_start; // first marker of drawn polygon
var poly_markers = [];
var poly_line; // open line around polygon
var poly_line_start; // line between poly points [0]..[1]
var poly_line_close; // line between poly last point and start, closing polygon
var poly_line_finish; // line highlighting edge selected as zone finish
var poly_finish_index; // index of the edge select as zone finish
var poly_mid_markers = []; // markers marking edge midpoints to select zone finish
var poly_mid_marker_close; // edge midpoint for closing line to select zone finish

// *********************************************************************************
var RTMONITOR_API = null;

var rt_mon; // rtmonitor_api client object

var msg_list=["1"];

// *********************************************************************************
// *********************************************************************************
// ********************  INIT RUN ON PAGE LOAD  ************************************
// *********************************************************************************
// *********************************************************************************
function init()
{
    document.title = 'JB!' + VERSION; 
    //initialise page_title
    var page_title_text = document.createTextNode('JB vis tests '+VERSION);
    var page_title = document.getElementById('page_title');
    // remove existing title if there is one
    while (page_title.firstChild) {
            page_title.removeChild(page_title.firstChild);
    }
    document.getElementById('page_title').appendChild(page_title_text);

    // initialize log 'console'
    log_div = document.getElementById('log_div');

    // display RTMONITOR_URI on control div
    var rtmonitor_uri_input = document.getElementById('rtmonitor_uri');

    rtmonitor_uri_input.value = RTMONITOR_URI;

    rtmonitor_uri_input.addEventListener('focus', function (e) {
        rtmonitor_uri_input.style['background-color'] = '#ddffdd'; //lightgreen
        return false;
    });

    rtmonitor_uri_input.addEventListener('blur', function (e) {
        RTMONITOR_URI = rtmonitor_uri_input.value;
        RTMONITOR_API.set_uri(RTMONITOR_URI);
        console.log('RTMONITOR_URI changed to '+RTMONITOR_URI);
        rtmonitor_uri_input.style['background-color'] = '#ffffff'; //white
        return false;
    });

    rtmonitor_uri_input.addEventListener('keydown', function (e) {
        if (e.key === "Enter" || e.keyCode == 13 || e.which == 13)
        {
            RTMONITOR_URI = rtmonitor_uri_input.value;
            RTMONITOR_API.set_uri(RTMONITOR_URI);
            console.log('RTMONITOR_URI changed to '+RTMONITOR_URI);
            rtmonitor_uri_input.blur();
            e.preventDefault();
            return false;
        }
        return false;
    });

    // initialize progress div
    page_progress.div = document.getElementById('progress_div');

    page_progress.svg = document.createElementNS(SVGNS, 'svg');
    page_progress.svg.setAttribute('width',page_progress.div.clientWidth);
    page_progress.svg.setAttribute('height',page_progress.div.clientHeight);

    page_progress.div.appendChild(page_progress.svg);
    PROGRESS_X_START = DRAW_PROGRESS_LEFT_MARGIN;
    PROGRESS_X_FINISH = page_progress.div.clientWidth - DRAW_PROGRESS_RIGHT_MARGIN;
    PROGRESS_Y_START = DRAW_PROGRESS_TOP_MARGIN;
    PROGRESS_Y_FINISH = page_progress.div.clientHeight - DRAW_PROGRESS_BOTTOM_MARGIN;





    update_clock(new Date());
    clock_timer = setInterval(function () { update_clock(new Date()); }, 1000);

    // initialize UI checkboxes

   // document.getElementById('log_append').checked = false;
   // document.getElementById('breadcrumbs').checked = false;

    // watchdog timer checking for 'old' data records

    setInterval(check_old_records, OLD_TIMER_INTERVAL*1000);

   

    RTMONITOR_API = new RTMonitorAPI(CLIENT_DATA, RTMONITOR_URI);

    rt_mon = RTMONITOR_API.register(rtmonitor_connected,rtmonitor_disconnected);

    rt_mon.connect();



} // end init()


//p5.js test functions

// function setup(){
// 	var cnv=createCanvas(200,100);
// 	cnv.parent('dataVis');
// 	background(0);
// //	init();
// }
// function draw(){
//     background(150);
//     let val = parseInt(msg_list[0]);
//     text(val,10,10)
//     fill(255,0,0);
//     ellipse(width/2, height/2, val,val);
// }

	

// *********************************************************************************
// ************* RTRoute code      ***************************************************
// *********************************************************************************

// ********************************************************************************
// ********************************************************************************
// ***********  Process the data records arrived from WebSocket or Replay *********
// ********************************************************************************
// ********************************************************************************

// Process websocket data
function handle_records(websock_data)
{
    //console.log(websock_data);
    //var incoming_data = JSON.parse(websock_data);
    //console.log('handle_records'+json['request_data'].length);
    for (var i = 0; i < websock_data[RECORDS_ARRAY].length; i++)
    {
	    handle_msg(websock_data[RECORDS_ARRAY][i], new Date());
    }
} // end function handle_records

// process a single data record
function handle_msg(msg, clock_time)
{
    // add to recorded_data if recording is on

    if (recording_on)
    {
        recorded_records.push(JSON.stringify(msg));
    }

    var sensor_id = msg[RECORD_INDEX];
    console.log("Got message: "+JSON.stringify(msg["intensity"]));

    // If an existing entry in 'sensors' has this key, then update
    // otherwise create new entry.
    if (sensors.hasOwnProperty(sensor_id))
    {
        update_sensor(msg, clock_time);
    }
    else
    {
        init_sensor(msg, clock_time);
    }

    msg_list.unshift(JSON.stringify(msg["intensity"]))
}

// We have received data from a previously unseen sensor, so initialize
function init_sensor(msg, clock_time)
    {
        // new sensor, create marker
        console.log(' ** New '+msg[RECORD_INDEX]);

        var sensor_id = msg[RECORD_INDEX];

        var sensor = { sensor_id: sensor_id,
                       msg: msg
                     };



    }

// update realtime clock on page
// called via intervalTimer in init()
function update_clock(time)
{
    clock_time = time;
    document.getElementById('clock').innerHTML = hh_mm_ss(time);
    check_old_records(time);
}

// Give
// watchdog function to flag 'old' data records
// records are stored in 'sensors' object
function check_old_records(clock_time)
{
    //console.log('checking for old data records..,');

    var check_time = new Date();
    if (clock_time != null)
    {
        check_time = clock_time;
    }

    // do nothing if timestamp format not recognised
    switch (RECORD_TS_FORMAT)
    {
        case 'ISO8601':
            break;

        default:
            return;
    }

    for (var sensor_id in sensors)
    {
        //console.log('check_old_records '+sensor_id);
        update_old_status(sensors[sensor_id], check_time);
    }
}

// return provided JS Date() as HH:MM:SS
function hh_mm_ss(datetime)
{
    var hh = ('0'+datetime.getHours()).slice(-2);
    var mm = ('0'+datetime.getMinutes()).slice(-2);
    var ss = ('0'+datetime.getSeconds()).slice(-2);
    return hh+':'+mm+':'+ss;
}

// ***************************************************************************
// *******************  Logging code      ************************************
// ***************************************************************************
/*
function log(msg, format)
{
    if (!format)
    {
        format = 'console';
    }

    // create outermost log record element
    var new_log_record = document.createElement('div');

    if (format == 'console')
    {
        // create HH:MM:SS timestamp for this log record
        var ts = hh_mm_ss(new Date());

        // create timestamp element
        var ts_element = document.createElement('div');
        ts_element.classList.add('log_ts');
        ts_element.innerHTML = ts;
        new_log_record.appendChild(ts_element);
    }

    // create msg element
    var msg_element = document.createElement('div');
    msg_element.classList.add('log_msg');
    msg_element.innerHTML = msg;
    new_log_record.appendChild(msg_element);

    new_log_record.classList.add('log_record');
    // set the log background color and toggle odd/even flag
    new_log_record.classList.add(log_record_odd ? 'log_record_odd' : 'log_record_even');
    log_record_odd = !log_record_odd;

    // if log is full then drop the oldest msg
    if (log_div.childElementCount == LOG_TRUNCATE)
    {
        //console.log('log hit limit '+LOG_TRUNCATE);
        if (log_append)
        {
            //console.log('log removing firstChild');
            log_div.removeChild(log_div.firstChild);
        }
        else
        {
            //console.log('log removing lastChild '+log_div.lastChild.tagName);
            log_div.removeChild(log_div.lastChild);
        }
        //console.log('log record count after removeChild: '+log_div.childElementCount)
    }
    if (log_append)
    {
        log_div.appendChild(new_log_record);
    }
    else
    {
        log_div.insertBefore(new_log_record, log_div.firstChild);
    }
    //console.log('log record count: '+log_div.childElementCount)
}

// Empty the console log div
function log_clear()
{
    while (log_div.firstChild)
    {
            log_div.removeChild(log_div.firstChild);
    }
}

// reverse the order of the messages in the log
function log_reverse()
{
    for (var i=0;i<log_div.childNodes.length;i++)
      log_div.insertBefore(log_div.childNodes[i], log_div.firstChild);
}
*/

// return {lat:, lng:} from bus message
function get_msg_point(msg)
{
    return { lat: msg[RECORD_LAT], lng: msg[RECORD_LNG] };
}

// return a JS Date() from bus message
function get_msg_date(msg)
{
    switch (RECORD_TS_FORMAT)
    {
        case 'ISO8601':
            return new Date(msg[RECORD_TS]);
            break;

        case 'unix':
            return new Date(msg[RECORD_TS]*1000);
            break;
            
        default:
            break;
    }
    return null;
}

// ***************************************************************************
// *******************  RTmonitor calls/callbacks ****************************
// ***************************************************************************

// user has clicked the 'connect' button
function rt_connect()
{
    console.log('** connecting rtmonitor **');
    rt_mon.connect();
}

// user has clicked the 'close' button
function rt_disconnect()
{
    console.log('** disconnecting rtmonitor **');
    rt_mon.close();
}

function rtmonitor_disconnected()
{
    console.log('** rtmonitor connection closed **');
}

function rtmonitor_connected()
{
    console.log('** rtmonitor connected **');
}

function rt_send_input(input_name)
{
    var str_msg = document.getElementById(input_name).value;

    rt_send_raw(str_msg);
}

function rt_send_raw(str_msg)
{
    console.log('sending: '+str_msg);

    // push msg onto history and update cursor to point to end
    rt_send_history.push(str_msg);

    rt_history_cursor = rt_send_history.length;

    // write msg into scratchpad textarea
    document.getElementById('rt_scratchpad').value = str_msg;

    rt_mon.raw(JSON.parse(str_msg), handle_records);
}


// draw a line between points A and B as {lat:, lng:}
function draw_line(A,B, color)
{
    if (!color) color = 'green';
    var line = L.polyline([[A.lat, A.lng],[B.lat,B.lng]], {color: color}).addTo(map);
    return line;
}

function draw_circle(A,radius,color)
{
    if (!color) color = 'green';
    var circle = L.circle([A.lat, A.lng],radius,{color: color}).addTo(map);
    return circle;
}

// toggle the 'breadcrumbs' function that draws a dot every time a sensor position is received
function click_breadcrumbs()
{
    breadcrumbs = document.getElementById("breadcrumbs").checked == true;
}

// toggle the 'draw_stops' function that draws a stop icon at each stop lat,lng
function click_stops()
{
    if (document.getElementById("draw_stops").checked)
    {
        draw_stops(stops_cache);
    }
    else
    {
        hide_stops();
    }
}

// switch the console log between newest msg on top vs newest on bottom
function click_log_append()
{
    var prev_log_append = log_append;
    log_append = document.getElementById("log_append").checked == true;
    if (prev_log_append != log_append)
    {
        log_reverse();
    }
}

function click_log_data()
{
    log_data = document.getElementById("log_data").checked == true;
}

// remove all markers from map and reset 'sensors' array
function clear_markers()
{
    //console.log('clear_markers');
    for (var sensor_id in sensors)
    {
        if (sensors[sensor_id]['marker'])
        {
            map.removeLayer(sensors[sensor_id]['marker']);
        }
    }
    sensors = {};
}

// remove all crumbs from map
function clear_crumbs()
{
    for (var i=0; i<crumbs.length; i++)
    {
        map.removeLayer(crumbs[i]);
    }
    crumbs = [];
}

// empty textarea e.g. scratchpad
function clear_textarea(element_id)
{
    document.getElementById(element_id).value='';
}

// scroll BACK through socket messages sent to server and update scratchpad
function rt_prev_msg(element_id)
{
    // don't try and scroll backwards before start
    if (rt_history_cursor <= 1)
    {
        return;
    }

    rt_history_cursor--;

    document.getElementById(element_id).value = rt_send_history[rt_history_cursor-1];
}

// scroll FORWARDS through socket messages sent to server
function rt_next_msg(element_id)
{
    // don't scroll forwards after last msg
    if (rt_history_cursor >= rt_send_history.length)
    {
        return;
    }

    rt_history_cursor++;

    document.getElementById(element_id).value = rt_send_history[rt_history_cursor-1];
}

function marker_to_pos(marker)
{
    var lat_lng = marker.getLatLng();
    return '{  "lat": '+lat_lng.lat+', "lng": '+lat_lng.lng+' }';
}

// issue a request to server for the latest message
// Note this function DISABLED while RTMonitor doesn't send request_id in its reply
//function request_latest_msg()
//{
//    //sock_send_str('{ "msg_type": "rt_request", "request_id": "A", "options": [ "latest_msg" ] }');
//    var msg = {  options: [ 'latest_msg' ] };
//    RTMONITOR_API.request(CLIENT_DATA.rt_client_id,'A',msg,handle_records);
//}

// issue a request to server for the latest records
function request_latest_records()
{
    //sock_send_str('{ "msg_type": "rt_request", "request_id": "A", "options": [ "latest_records" ] }');
    var msg = {  options: [ 'latest_records' ] };
    rt_mon.request('A',msg,handle_records);
}

// issue a subscription to server for all records
function subscribe_all()
{
    rt_mon.subscribe('A',{},handle_records);
    //sock_send_str('{ "msg_type": "rt_subscribe", "request_id": "A" }');
}



//user clicked on 'subscribe' for a bus
function subscribe_to_sensor(sensor_id)
{
    var msg_obj = { msg_type: 'rt_subscribe',
                    request_id: sensor_id,
                    filters: [ { test: "=", key: "VehicleRef", value: sensor_id } ]
                  };
    //sock_send_str(JSON.stringify(msg_obj));
    rt_mon.subscribe(sensor_id, msg_obj, handle_records);
}


// user has clicked the 'Reset' button
function page_reset()
{
    init();
}



// *************************************************************
// Recording buttons
// *************************************************************

function record_start()
{
    recording_on = true;
    document.getElementById('record_start').value = 'Recording';
}

function record_clear()
{
    recording_on = false;
    recorded_records = [];
    document.getElementById('record_start').value = 'Record';
}

function record_print()
{
    console.log('Printing '+recorded_records.length+' recorded records to console');
    var msgs = '[\n';
    for (var i=0; i<recorded_records.length; i++)
    {
        msgs += JSON.stringify(recorded_records[i]);
        if (i < recorded_records.length-1)
        {
            msgs += ',\n';
        }
        else
        {
            msgs += '\n]';
        }
    }
    console.log(msgs);
}

