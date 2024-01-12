const express = require("express");
const app = express();
const axios = require("axios");
const bodyParser = require("body-parser");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const puppeteer = require("puppeteer");
const pug = require("pug");

app.set("view engine", "pug");
app.set("views", "pug");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());
app.use(express.static("public"));

app.post("/itineraryPuppeteer", async (req, res) => {
  try {
    const id_itineraire = req.body.itineraireId;
    const start_point = req.body.startPoint;
    const end_point = req.body.endPoint;
    const instructions = req.body.instructions;

    // Revoir pour créer une fonction
    fs.readFile("public/images/bicycle-red.png", (err, data) => {
      if (err) {
      }
      // Convertir le buffer en base64
      const base64Image = Buffer.from(data).toString("base64");
      // Envoyer la réponse avec l'image en base64
      base64Red = base64Image;
    });

    fs.readFile("public/images/bicycle-orange.png", (err, data) => {
      if (err) {
      }
      // Convertir le buffer en base64
      const base64Image = Buffer.from(data).toString("base64");
      // Envoyer la réponse avec l'image en base64
      base64Orange = base64Image;
    });

    fs.readFile("public/images/bicycle-blue.png", (err, data) => {
      if (err) {
      }
      // Convertir le buffer en base64
      const base64Image = Buffer.from(data).toString("base64");
      // Envoyer la réponse avec l'image en base64
      base64Blue = base64Image;
    });

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

    const itineraire = {
      id: id_itineraire,
      startPoint: start_point,
      endPoint: end_point,
      instructions: instructions,
    };

    // Compilez le fichier Pug avec les paramètres
    let htmlContent = pug.renderFile("pug/basecopy.pug", {
      dataStations: JSON.stringify(dataStations),
      dataStationStatus: JSON.stringify(dataStationStatus),
      itineraire: JSON.stringify(itineraire),
      base64Red: base64Red,
      base64Orange: base64Orange,
      base64Blue: base64Blue,
    });

    fs.writeFileSync("./public/files/test.html", htmlContent);
    const doc = new PDFDocument();

    // Utilisez Puppeteer pour générer un PDF à partir du contenu HTML
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 0,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
    });
    // await browser.close();
    const pdfPath = `public/pdf/itinerary_${id_itineraire}.pdf`;
    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log(`Le PDF a été enregistré avec succès à ${pdfPath}`);

    // Enregistrez le PDF dans le répertoire /public/pdf/
  } catch (error) {
    console.error("Erreur lors de la génération du PDF :", error);
  }
});

// Première ébauche de génération PDF
app.post("/itinerary", async (req, res) => {
  const id_itineraire = req.body.itineraireId;
  const start_point = req.body.startPoint;
  const end_point = req.body.endPoint;
  const instructions = req.body.instructions;

  // Création d'un nouveau document PDF
  const doc = new PDFDocument();

  doc.pipe(fs.createWriteStream(`public/pdf/itinerary_${id_itineraire}.pdf`));

  doc.fontSize(12).fillColor("red").text(`ID Itinéraire: ${id_itineraire}`, {
    width: 410,
    align: "center",
  });
  doc.fontSize(12).fillColor("black").text(`Point de départ : ${start_point}`);
  doc.fontSize(12).text(`Point d'arrivée : ${end_point}`);
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

app.listen(7000, () => {
  console.log("Listening on 7000");
});
