const mysql = require("mysql");
const express = require("express");
const app = express();
const axios = require("axios");
const cookieParser = require("cookie-parser");

app.set("view engine", "pug");
app.set("views", "pug");

const bodyParser = require("body-parser");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static("public"));

/************************************** LOGIN ***************************************************/

app.get("/login", async (req, res) => {
  await axios.get("http://localhost:4000/login").then((resGet) =>
    res.render("login", {
      formData: resGet.data.form,
    })
  );
});

app.post("/login", async (req, res) => {
  await axios
    .post(
      "http://localhost:4000/login",
      {
        identifiant: req.body.identifiant,
        motdepasse: req.body.motdepasse,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    .then((resPost) => {
      res.cookie("cookies", {
        identifiant: resPost.data.identifiant,
        JWT: resPost.data.JWT,
      });
      res.redirect(resPost.data.redirect);
      //  console.log("mon cookie", req.cookies);
    });
});

/************************************** LOGOUT ***************************************************/

app.get("/logout", async (req, res) => {
  await axios
    .get("http://localhost:4000/logout", {
      params: {
        jeton: req.cookies.cookies.JWT,
      },
    })
    .then((resGet) => {
      res.clearCookie("cookies");
      res.redirect(resGet.data.redirect);
    });
});

/************************************** REGISTER ***************************************************/

app.get("/register", async (req, res) => {
  await axios.get("http://localhost:4000/register").then((resGet) =>
    res.render("register", {
      formData: resGet.data.form,
    })
  );
});

app.post("/register", async (req, res) => {
  await axios
    .post(
      "http://localhost:4000/register",
      {
        identifiant: req.body.identifiant,
        motdepasse: req.body.motdepasse,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    .then((resPost) => {
      res.redirect(resPost.data.redirect);
    });
});

/************************************************ MiddleWare Verify ********************************************/

app.all("*", async (req, res, next) => {
  let estConnecte;
  if (!req?.cookies?.cookies?.JWT) {
    estConnecte = false;
  } else {
    await axios
      .post(
        "http://localhost:4000/verify",
        {
          jeton: req.cookies.cookies.JWT,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((resPost) => {
        estConnecte = resPost.data.estConnecte;
      });
  }
  if (!estConnecte) {
    res.redirect("/login");
  }
  res.locals.estConnecte = estConnecte;
  next();
});

/************************************** DASHBOARD ***************************************************/

app.get("/dashboard", async (req, res) => {
  // Récupération des itinéraires de l'utilisateur
  // Envoie des itinéraires dans le template
  const routes = [
    {
      name: "Itinéraire 1",
      points: [
        { latitude: 40.7128, longitude: -74.006 },
        { latitude: 34.0522, longitude: -118.2437 },
        // ... d'autres points
      ],
      distance: 150, // en kilomètres
    },
    {
      name: "Itinéraire 2",
      points: [
        { latitude: 51.5074, longitude: -0.1278 },
        { latitude: 48.8566, longitude: 2.3522 },
        // ... d'autres points
      ],
      distance: 200, // en kilomètres
    },
  ];
  res.render("itineraires", { routes });
});

/************************************** ITINERARY ***************************************************/

app.post("/itinerary", async (req, res) => {});
app.get("/itinerary", async (req, res) => {});

/************************************** PROFILE ***************************************************/

app.get("/profil", async (req, res) => {
  await axios
    .get("http://localhost:4000/profil", {
      params: {
        jeton: req.cookies.cookies.JWT,
      },
    })
    .then((resGet) =>
      res.render("profil", {
        formData: resGet.data.form,
      })
    );
});

app.post("/update/:userID", async (req, res) => {
  const userID = parseInt(req.params.userID);
  await axios
    .patch(
      `http://localhost:4000/update/${userID}`,
      {
        identifiant: req.body.nouvelIdentifiant,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    .then((resPatch) => {
      //res.clearCookie("cookies");
      res.cookie("cookies", {
        identifiant: resPatch.data.identifiant,
        JWT: resPatch.data.JWT,
      });
      res.redirect(resPatch.data.redirect);
    });
});
/************************************** MAP ***************************************************/
app.get("/occupation", async (req, res) => {
  try {
    const [responseStations, responseStatus] = await Promise.all([
      axios.get(
        "https://velib-metropole-opendata.smovengo.cloud/opendata/Velib_Metropole/station_information.json"
      ),
      axios.get(
        "https://velib-metropole-opendata.smovengo.cloud/opendata/Velib_Metropole/station_status.json"
      ),
    ]);

    const dataStations = responseStations.data.data.stations;
    const dataStationStatus = responseStatus.data.data.stations;

    res.render("occupation", {
      dataStations: JSON.stringify(dataStations), // Convertir en chaîne JSON
      dataStationStatus: JSON.stringify(dataStationStatus), // Convertir en chaîne JSON
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
});

/************************************** CREATE ITINERARY ***************************************************/
app.get("/creation-itineraire", async (req, res) => {
  try {
    const [responseStations, responseStatus] = await Promise.all([
      axios.get(
        "https://velib-metropole-opendata.smovengo.cloud/opendata/Velib_Metropole/station_information.json"
      ),
      axios.get(
        "https://velib-metropole-opendata.smovengo.cloud/opendata/Velib_Metropole/station_status.json"
      ),
    ]);

    const dataStations = responseStations.data.data.stations;
    const dataStationStatus = responseStatus.data.data.stations;

    res.render("creationItineraire", {
      dataStations: JSON.stringify(dataStations), // Convertir en chaîne JSON
      dataStationStatus: JSON.stringify(dataStationStatus), // Convertir en chaîne JSON
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
});

// On écoute sur le port 3000
app.listen(3000, () => {
  console.log("Listening on 3000");
});
