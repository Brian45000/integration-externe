fetch(
  "https://velib-metropole-opendata.smovengo.cloud/opendata/Velib_Metropole/station_information.json"
).then((res) => {
  console.log(res);
});

const stationData = {
  lastUpdatedOther: 1704812264,
  ttl: 3600,
  data: {
    stations: [
      {
        station_id: 213688169,
        name: "Benjamin Godard - Victor Hugo",
        lat: 48.865983,
        lon: 2.275725,
        capacity: 35,
        stationCode: "16107",
      },
      {
        station_id: 653222953,
        name: "Mairie de Rosny-sous-Bois",
        lat: 48.871256519012,
        lon: 2.4865807592869,
        capacity: 30,
        stationCode: "31104",
        rental_methods: ["CREDITCARD"],
      },
      {
        station_id: 17278902806,
        name: "Rouget de L'isle - Watteau",
        lat: 48.778192750803,
        lon: 2.3963020229163,
        capacity: 20,
        stationCode: "44015",
      },
    ],
  },
};
