const mysql = require("mysql");
const express = require("express");
const app = express();
const axios = require("axios");
const cookieParser = require("cookie-parser");

app.set("view engine", "pug");
app.set("views", "pug");

require("dotenv").config();

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
  let id_user = "NC";
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
        id_user = resPost.data.utilisateur.ID_user;
      });
  }
  if (!estConnecte) {
    res.redirect("/login");
  }
  res.locals.estConnecte = estConnecte;
  res.locals.id_user = id_user;
  next();
});

/************************************** DASHBOARD ***************************************************/
app.get("/dashboard", async (req, res) => {
  // Création de la connexion à la base de données
  const connection = mysql.createConnection({
    host: process.env.HOST_MYSQL,
    user: process.env.USERNAME_MYSQL,
    password: process.env.PASSWORD_MYSQL,
    database: process.env.DATABASE_MYSQL,
  });

  connection.query(
    "SELECT * FROM itineraires WHERE id_user = ?",
    [res.locals.id_user],
    (err, results, fields) => {
      if (err) {
        console.error("Erreur lors de la récupération des itinéraires :", err);
        return res.redirect("/dashboard");
      }

      const routes = results.map((itineraire) => ({
        id: itineraire.id,
        name: "Itineraire " + itineraire.id,
        startPoint: itineraire.startPoint,
        distance: itineraire.distance / 1000,
        endPoint: itineraire.endPoint,
      }));

      res.render("itineraires", { routes: routes });
    }
  );
});

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

app.post("/creation-itineraire", async (req, res) => {
  const startPoint = req.body.startPoint;
  const endPoint = req.body.endPoint;
  const instructions = req.body.instructions;
  const distance = req.body.distance;

  // Création de la connexion à la base de données
  const connection = mysql.createConnection({
    host: process.env.HOST_MYSQL,
    user: process.env.USERNAME_MYSQL,
    password: process.env.PASSWORD_MYSQL,
    database: process.env.DATABASE_MYSQL,
  });

  const SQLquery =
    "INSERT INTO itineraires (startPoint, endPoint, distance, instructions, id_user) VALUES (?, ?, ?, ?, ?)";
  connection.query(
    SQLquery,
    [startPoint, endPoint, distance, instructions, res.locals.id_user],
    async (err, results, fields) => {
      if (err) {
        console.log(err);
      } else {
        // Envoi la demande pour générer le pdf
        await axios
          .post(
            "http://localhost:6000/itinerary/",
            {
              itineraireId: results.insertId,
              startPoint: startPoint,
              distance: distance,
              endPoint: endPoint,
              instructions: instructions,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
          .then((res) => {
            res.end();
          });
        connection.end();
        res.redirect("/dashboard");
      }
    }
  );
});
/************************************** DELETE ITINERARY ***************************************************/

app.get("/delete-itineraire/:id", (req, res) => {
  const idItineraire = req.params.id;
  // Création de la connexion à la base de données
  const connection = mysql.createConnection({
    host: process.env.HOST_MYSQL,
    user: process.env.USERNAME_MYSQL,
    password: process.env.PASSWORD_MYSQL,
    database: process.env.DATABASE_MYSQL,
  });
  connection.query(
    `DELETE FROM itineraires WHERE id = ?`,
    [idItineraire],
    (err, results, fields) => {
      if (err) {
        console.error("Erreur lors de la suppression de l'itinéraire :", err);
        return res.redirect("/dashboard");
      }
      connection.end();
      console.log(`Itinéraire avec l'ID ${idItineraire} supprimé avec succès.`);
      res.redirect("/dashboard");
    }
  );
});

/************************************** VIEW ITINERARY ***************************************************/
app.get("/view-itineraire/:id", async (req, res) => {
  try {
    const idItineraire = req.params.id;

    // Création de la connexion à la base de données
    const connection = mysql.createConnection({
      host: process.env.HOST_MYSQL,
      user: process.env.USERNAME_MYSQL,
      password: process.env.PASSWORD_MYSQL,
      database: process.env.DATABASE_MYSQL,
    });
    let itineraire;
    connection.query(
      "SELECT * FROM itineraires WHERE id = ?",
      [idItineraire],
      async (err, results, fields) => {
        if (err) {
          console.error(
            "Erreur lors de la récupération de l'itinéraire :",
            err
          );
          return res.redirect("/dashboard");
        }
        if (results.length === 0) {
          console.log(`Aucun itinéraire trouvé avec l'ID ${idItineraire}`);
          return res.redirect("/dashboard");
        }
        // Récupérer les données de l'itinéraire
        itineraire = results[0];
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

        connection.end();
        res.render("viewItineraire", {
          dataStations: JSON.stringify(dataStations), // Convertir en chaîne JSON
          dataStationStatus: JSON.stringify(dataStationStatus), // Convertir en chaîne JSON
          itineraire: JSON.stringify(itineraire),
        });
      }
    );
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
});

/************************************** DOWNLOAD PDF ***************************************************/
app.get("/itinerary/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const cookie = req.cookies.cookies.JWT;

    // Appel à la route localhost:6000/itinerary/:id pour récupérer les données binaires du PDF
    const response = await axios.get(
      `http://127.0.0.1:6000/itinerary/${id}?cookie=${cookie}`,
      { responseType: "arraybuffer" }
    );

    // Renvoyer les données binaires en tant que fichier PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=itinerary_${id}.pdf`
    );
    res.send(Buffer.from(response.data, "binary"));
  } catch (error) {
    console.error("Error fetching PDF data:", error);
    res.status(500).send("Internal Server Error");
  }
});

/************************************** CHANGER MON MOT DE PASSE ***************************************************/

app.get("/changePassword", async (req, res) => {
  await axios
    .get("http://localhost:4000/changePassword", {
      params: {
        jeton: req.cookies.cookies.JWT,
      },
    })
    .then((resGet) =>
      res.render("changePassword", {
        formData: resGet.data.form,
      })
    );
});

app.post("/changePassword/:userID", async (req, res) => {
  const userID = parseInt(req.params.userID);
  await axios
    .patch(
      `http://localhost:4000/changePassword/${userID}`,
      {
        identifiant: req.body.nouvelIdentifiant,
        ancienMotDePasse: req.body.ancienMotDePasse,
        nouveauMotDePasse: req.body.nouveauMotDePasse,
        confirmationMotDePasse: req.body.confirmationMotDePasse,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    .then((resPatch) => {
      res.redirect(resPatch.data.redirect);
    });
});

// On écoute sur le port 3000
app.listen(3000, () => {
  console.log("Listening on 3000");
});
