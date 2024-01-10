var redIcon = L.icon({
  iconUrl: "/images/bicycle-red.png",
  iconSize: [25, 25], // Taille de l'icône
  iconAnchor: [10, 10], // Point d'ancrage de l'icône par rapport à sa position
  popupAnchor: [0, -32], // Point d'ancrage du popup par rapport à l'icône
});

var orangeIcon = L.icon({
  iconUrl: "/images/bicycle-orange.png",
  iconSize: [25, 25], // Taille de l'icône
  iconAnchor: [10, 10], // Point d'ancrage de l'icône par rapport à sa position
  popupAnchor: [0, -32], // Point d'ancrage du popup par rapport à l'icône
});

var blueIcon = L.icon({
  iconUrl: "/images/bicycle-blue.png",
  iconSize: [25, 25],
  iconAnchor: [10, 10],
  popupAnchor: [0, -32],
});

var element = document.querySelector("div[data-variable-station]");
var myStations = element.getAttribute("data-variable-station");
var stations = JSON.parse(myStations);

var elementStatus = document.querySelector("div[data-variable-status]");
var myStationsStatus = elementStatus.getAttribute("data-variable-status");
var statusData = JSON.parse(myStationsStatus);

// JavaScript pour initialiser la carte Leaflet
var map = L.map("map", {
  center: [48.8566, 2.3522],
  zoom: 15,
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

//console.log(JSON.parse(stations))
// Ajouter des marqueurs pour chaque station Velib

stations.forEach(function (station) {
  // Trouver la station correspondante dans dataStationStatus
  var status = statusData.find(function (statusStation) {
    return statusStation.station_id === station.station_id;
  });

  // Vérifier si la station existe dans dataStationStatus
  if (status) {
    // Calculer la différence entre la capacité et l'occupation
    var difference = station.capacity - status.num_bikes_available;

    // Choisir la couleur en fonction de la différence
    var iconColor =
      difference <= 5 && difference != 0
        ? "orangeIcon"
        : status.num_bikes_available === station.capacity
        ? "redIcon"
        : "blueIcon";

    // Ajouter le marqueur avec l'icône personnalisée à la carte
    switch (iconColor) {
      case "redIcon":
        var marker = L.marker([station.lat, station.lon], {
          icon: redIcon,
        }).addTo(map);
        break;

      case "orangeIcon":
        var marker = L.marker([station.lat, station.lon], {
          icon: orangeIcon,
        }).addTo(map);
        break;

      case "blueIcon":
        var marker = L.marker([station.lat, station.lon], {
          icon: blueIcon,
        }).addTo(map);
        break;
    }

    // Ajouter la popup
    marker.bindPopup(
      "Station " +
        station.stationCode +
        " - " +
        station.name +
        "<br>Capacité: " +
        station.capacity +
        "<br>Occupation: " +
        status.num_bikes_available
    );
  }
});
