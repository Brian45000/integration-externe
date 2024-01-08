const mysql = require("mysql");
const express = require("express");
const app = express();
const axios = require("axios");
//Je dis à express qu'on utilisera pug comme moteur de template
// pour les pages web
app.set("view engine", "pug");
// Je dis à express que toutes les pages pug sont dans le dossier "pug"
app.set("views", "pug");

// J'importe body-parser
const bodyParser = require("body-parser");
// app.use permet d'ajouter des fonctionnalités à express
// En fait, ce sont des modules express (parce qu'express a aussi
// des modules, comme express est un module de Node)
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/login", async (req, res) => {
  await axios
    .get("http://localhost:4000/login")
    .then((res) => console.log(res.data));

  res.render("login", {
    formData: res.data,
  });
});

// On écoute sur le port 3000
app.listen(3000, () => {
  console.log("Listening on 3000");
});
