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

/************************************** DASHBOARD ***************************************************/

app.get("/dashboard", async (req, res) => {
  // Récupération des itinéraires de l'utilisateur
  // Envoie des itinéraires dans le template
  res.render("itineraires");
});

/************************************** ITINERARY ***************************************************/
app.post("/itinerary", async (req, res) => {});
app.get("/itinerary", async (req, res) => {});

// On écoute sur le port 3000
app.listen(3000, () => {
  console.log("Listening on 3000");
});
