const express = require("express");
const app = express();
const axios = require("axios");
const puppeteer = require("puppeteer");
const bodyParser = require("body-parser");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const cookieParser = require("cookie-parser");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());
app.use(express.static("public"));

app.post("/itinerary", async (req, res) => {
  //Récupérer un ID
  // id = req.body.id;
  //jeton = req.body.jeton;

  const id_itineraire = req.body.itineraireId;
  const start_point = req.body.startPoint;
  const end_point = req.body.endPoint;
  const instructions = req.body.instructions;

  // Création d'un nouveau document PDF
  const doc = new PDFDocument();

  doc.pipe(fs.createWriteStream(`public/pdf/itinerary_${id_itineraire}.pdf`));

  doc.fontSize(12).text(`ID Itinéraire: ${id_itineraire}`);
  doc.fontSize(12).text(`Point de départ: ${start_point}`);
  doc.fontSize(12).text(`Point d'arrivée: ${end_point}`);
  let array_instruction = JSON.parse(instructions);

  array_instruction.forEach((instru) => {
    //console.log(instru);
    doc
      .fontSize(12)
      .text(
        `Instructions: ${instru.text}, Distance : ${parseInt(
          instru.distance
        )} mètre(s)`
      );
  });
  //doc.fontSize(12).text(`Instructions: ${instructions}`);

  const pdfBuffer = [];
  doc.on("data", (chunk) => pdfBuffer.push(chunk));
  doc.on("end", () => {
    const finalPDF = Buffer.concat(pdfBuffer);
    fs.writeFileSync(`public/pdf/itinerary_${id_itineraire}.pdf`, finalPDF);
  });
  // Finalisation du document PDF
  doc.end();

  res.end(pdfBuffer, "binary");
});

app.get("/itinerary/:id", async (req, res) => {
  // Récupération du params ID qui correspond à l'identifiant de l'itinéraire
  const id = req.params.id;
  const jeton = req.query.cookie;

  // Appel à la route localhost:4000/verify pour vérifier le jeton
  axios
    .post(
      "http://127.0.0.1:4000/verify",
      { jeton: jeton },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    .then((response) => {
      // Vérification si l'utilisateur est connecté
      const estConnecte = response.data.estConnecte;
      const ID_user = response.data.ID_user;

      if (estConnecte) {
        // Si l'utilisateur est connecté, on récupère le fichier PDF
        const pdfPath = `public/pdf/itinerary_${id}.pdf`;

        // Vérification de l'existence du fichier
        if (fs.existsSync(pdfPath)) {
          // Lecture du fichier PDF
          const pdfData = fs.readFileSync(pdfPath);

          // Envoi du fichier PDF comme réponse
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename=itinerary_${id}.pdf`
          );
          res.send(pdfData);
        } else {
          res.status(404).send("Le fichier PDF n'existe pas.");
        }
      } else {
        res.status(403).send("Utilisateur non connecté.");
      }
    })
    .catch((error) => {
      console.error("Erreur lors de la vérification de l'utilisateur :", error);
    });
});

app.listen(6000, () => {
  console.log("Listening on 6000");
});
