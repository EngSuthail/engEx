import L from "leaflet";
import io, { Socket } from "socket.io-client";

let map, socket;
const API = 'http://localhost:3001';

let userPosition;

function setUserPosition(latLng) {
  userPosition = latLng
  console.log(`user position set to: ${userPosition[0]}, ${userPosition[1]}`)
  gpsListners.forEach((listener) => listener(userPosition))
}

function getUserPosition() {
  console.log(`user position served: ${userPosition[0]}, ${userPosition[1]}`)
  return userPosition;
}

function buildingClick(id) {
  console.log("Building clicked:", id);
  if (buildingClickListner.length === 0) {
    console.warn("No building click listeners registered.");
    return
  }
  buildingClickListner.forEach(fn => fn(id));
}

window.buildingClick = buildingClick;

function initWebSocket() {
  socket = io(API);
  socket.on('connection')
}

function initMap(map_div) {
  const southWest = L.latLng(7.252000, 80.590249);
  const northEast = L.latLng(7.255500, 80.593809);
  const bounds = L.latLngBounds(southWest, northEast);

  map = L.map(map_div, {
    maxZoom: 22,
    minZoom: 18,
    maxBounds: bounds,
    maxBoundsViscosity: 1.0
  }).setView([7.253750, 80.592028], 19);

  // Create custom panes
  map.createPane('routePane');
  map.getPane('routePane').style.zIndex = 650;

  // Add OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 22
  }).addTo(map);


  // Load SVG overlay
  fetch(`${API}/map`)
    .then(res => res.text())
    .then(svgText => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
      const svgElement = svgDoc.documentElement;
      L.svgOverlay(svgElement, bounds).addTo(map);

      //Attach click listeners to SVG buildings
      const buildings = document.querySelectorAll('#_x3C_buildings_x3E_ .st4');
      buildings.forEach(building => {
          building.addEventListener('click', (event) => {
              buildingClick(event.target.id);
          });
      });
    })
    .then(() => {
      //connectSSE();
    })
    .catch(err => console.error('Error loading SVG:', err));

  map.fitBounds(bounds);

  initWebSocket();
}

const buildings = {
  "b29": 39,
  "b10": 29,
  "b16": 81,
  "b34": 61,
  "b15": 17,
  "b14": 84,
  "b6": 30,
  "b13": 36,
  "b7": 90,
  "b12": 83,
  "b33": 77,
  "b32": 41,
  "b11": 32,
  "b18": 59,
  "b20":35,
  "b21": 56,
  "b28": 40,
  "b22": 57,
  "b30": 54,
  "b23": 38,
  "b24": 37,
  "b4": 50,
  "b2": 24,
  "b1": 48,


};

function buildingToNode(id) {
  return buildings[id];
}


function drawRoute(result) {

  console.log(result)

  map.getPane('routePane').querySelectorAll('path, circle, polygon').forEach(el => el.remove());

  if (result) {

    L.circleMarker(result.snappedAt, { radius: 8, color: 'orange', pane: 'routePane' }).addTo(map).bindTooltip('Snapped');
    L.polyline(result.routeCoords, { color: 'red', weight: 5, pane: 'routePane' }).addTo(map);
    L.circleMarker(result.routeCoords.at(-1), { radius: 7, color: 'red', pane: 'routePane' }).addTo(map).bindTooltip('end');
    map.fitBounds(result.routeCoords);
  }

}

function drawMarker(latLng) {
  if(latLng){
    L.circleMarker(latLng, { radius: 8, color: 'blue', pane: 'routePane' }).addTo(map);
  }
}



let buildingClickListner = [];

function addBuildingClickListner(listner) {
  buildingClickListner.push(listner);
}

let gpsListners = [];
function addGpsListner(listener) {
  gpsListners.push(listener);
}

let watchId;
function startGPS() {
  if (navigator.geolocation) {
    // Watch position continuously
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log(`Updated location: ${lat}, ${lng}`);
        setUserPosition([lat, lng]); // update state -> rerender
      },
      (error) => {
        console.error(error);
        // fallback
        setUserPosition([7.252310, 80.592530]);
      },
      {
        enableHighAccuracy: true,  // better accuracy
        maximumAge: 0,             // don’t use cached
        timeout: 5000              // fail after 5s
      }
    );

  }
}

function sendMessage(type, data) {
  socket.emit(type, data);
}

function addMessageListner(type, listner) {
  socket.on(type, listner);
}

function stopGps() {
  navigator.geolocation.clearWatch(watchId);
}

export {map, initMap, setUserPosition, getUserPosition, buildingToNode, drawRoute, addBuildingClickListner, addGpsListner, startGPS, stopGps, drawMarker, addMessageListner, sendMessage };





