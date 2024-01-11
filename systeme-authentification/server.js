const path = require("node:path");
const fs = require("node:fs");
const bcrypt = require("bcrypt");
const mysql = require("mysql");
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");

require("dotenv").config();
app.use(express.static(path.join(__dirname, "public")));

// Je dis à express qu'on utilisera pug comme moteur de template
// pour les pages web
app.set("view engine", "pug");
// Je dis à express que toutes les pages pug sont dans le dossier "pug"
app.set("views", "pug");

// J'importe body-parser
const bodyParser = require("body-parser");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

// Ce qu'il se passe en GET sur '/'
app.get("/", (req, res) => {
  res.send("Hello World!!!");
});

/***************************************************************  REGISTER  **************************************************************/

app.get("/register", (req, res) => {
  const cheminDuFichier = path.join(__dirname, "views", "register.html");
  const contenuDuFichier = fs.readFileSync(cheminDuFichier, {
    encoding: "utf-8",
  });
  res.json({
    status: "Succès",
    message: "Formulaire envoyé",
    redirect: "/login",
    form: contenuDuFichier,
  });
});

app.post("/register", async (req, res) => {
  let identifiant = req.body.identifiant;
  let motdepasse = req.body.motdepasse;

  // Vérification des données
  if (!identifiant || !motdepasse) {
    return res.json({
      status: "Erreur",
      message: "JSON Incorrect",
      redirect: "/register",
    });
  }

  // Hash du mot de passe de l'utilisateur
  bcrypt.hash(motdepasse, 10, function (err, hash) {
    if (err) {
      return res.json({
        status: "Erreur",
        message: "Erreur lors du hachage du mot de passe",
        redirect: "/register",
      });
    }

    const nouvelleLigne = {
      identifiant: identifiant,
      motdepasse: hash,
    };

    // Création de la connexion à la base de données
    const connection = mysql.createConnection({
      host: process.env.HOST_MYSQL,
      user: process.env.USERNAME_MYSQL,
      password: process.env.PASSWORD_MYSQL,
      database: process.env.DATABASE_MYSQL,
    });

    // On vérifie si l'utilisateur existe déjà ou non
    // si il n'existe pas on l'ajoute en BD
    connection.query(
      `SELECT * FROM users WHERE identifiant = ?`,
      identifiant,
      (err, results, fields) => {
        if (err) {
          connection.end();
          return res.json({
            status: "Erreur",
            message: "Erreur lors de la vérification de l'utilisateur",
            redirect: "/register",
          });
        }

        if (results && results.length === 0) {
          connection.query(
            "INSERT INTO users SET ?",
            nouvelleLigne,
            (err, results, fields) => {
              connection.end();
              if (err) {
                return res.json({
                  status: "Erreur",
                  message: "Erreur lors de l'insertion de l'utilisateur",
                  redirect: "/register",
                });
              }
              res.json({
                status: "Success",
                message: "Inscription réussie ! ",
                redirect: "/login",
              });
            }
          );
        } else {
          connection.end();
          res.json({
            status: "Erreur",
            message: "Compte déjà existant",
            redirect: "/register",
          });
        }
      }
    );
  });
});

/***************************************************************  LOGIN *****************************************************************/
app.get("/login", (req, res) => {
  try {
    const cheminDuFichier = path.join(__dirname, "views", "login.html");
    const contenuDuFichier = fs.readFileSync(cheminDuFichier, "utf-8");

    res.json({
      status: "Succès",
      message: "Formulaire envoyé",
      redirect: "/login",
      form: contenuDuFichier,
    });
  } catch (error) {
    console.error("Erreur lors de la lecture du fichier :", error);
    res.status(500).json({
      status: "Erreur interne du serveur",
      message: "Une erreur est survenue lors du traitement de la requête.",
    });
  }
});

app.post("/login", async (req, res) => {
  let identifiant = req.body.identifiant;
  let motdepasse = req.body.motdepasse;

  // Création de la connexion à la base de données
  const connection = mysql.createConnection({
    host: process.env.HOST_MYSQL,
    user: process.env.USERNAME_MYSQL,
    password: process.env.PASSWORD_MYSQL,
    database: process.env.DATABASE_MYSQL,
  });
  connection.query(
    `SELECT * FROM users WHERE identifiant = ? `,
    identifiant,
    async (err, results, fields) => {
      if (results && results.length === 1) {
        let isPasswordValid = await bcrypt.compare(
          motdepasse,
          results[0].motdepasse
        );
        if (isPasswordValid) {
          // Création du JWT et ajout en BDD
          var TokenJWTUtilisateur = jwt.sign(
            {
              iss: "http://localhost",
              ID_user: results[0]["id"],
              identifiant: identifiant,
            },
            process.env.SECRET_KEY_JWT
          );

          const SQLquery = `INSERT INTO users_jwt (jwt, id_user) VALUES (?, ?)`;

          connection.query(
            SQLquery,
            [TokenJWTUtilisateur, results[0]["id"]],
            (err, results, fields) => {
              if (!err) {
                console.error(
                  "Insertion du JWT pour l'utilisateur :",
                  identifiant
                );
              } else {
                console.error("Erreur lors de l'insertion du JWT :", err);
              }
            }
          );
          connection.end();

          res.json({
            identifiant: identifiant,
            JWT: TokenJWTUtilisateur,
            status: "Succès",
            message: "Connexion réussie",
            redirect: "/dashboard",
          });
        } else {
          res.json({
            status: "Erreur",
            message: "Identifiants ou Mot de passe incorrects",
            redirect: "/login",
          });
        }
      } else {
        connection.end();
        res.json({
          status: "Erreur",
          message: "Identifiants incorrects",
          redirect: "/login",
        });
      }
    }
  );
});

/***************************************************************  LOGOUT  *****************************************************************/

app.get("/logout", (req, res) => {
  let jeton = req.query.jeton;

  // Création de la connexion à la base de données
  const connection = mysql.createConnection({
    host: process.env.HOST_MYSQL,
    user: process.env.USERNAME_MYSQL,
    password: process.env.PASSWORD_MYSQL,
    database: process.env.DATABASE_MYSQL,
  });

  // On vérifie si le JWT existe déjà ou non
  // si il existe on le supprime
  connection.query(
    `SELECT * FROM users_jwt WHERE jwt = ?`,
    jeton,
    (err, results, fields) => {
      if (err) {
        connection.end();
        return res.json({
          status: "Erreur",
          message: "Erreur lors de la vérification du JWT",
          redirect: "/dashboard",
        });
      }

      if (results && results.length === 1) {
        connection.query(
          "DELETE FROM users_jwt WHERE jwt = ?",
          [jeton],
          (err, results, fields) => {
            connection.end();
            if (err) {
              return res.json({
                status: "Erreur",
                message: "Erreur lors de la suppression du JWT",
                redirect: "/dashboard",
              });
            }
            res.json({
              status: "Succès",
              message: "Vous venez de vous déconnecter",
              redirect: "/login",
            });
          }
        );
      } else {
        connection.end();
        res.json({
          status: "Erreur",
          message: "Jeton inconnu",
          redirect: "/dashboard",
        });
      }
    }
  );
});

/***************************************************************  VERIFY *****************************************************************/

app.post("/verify", (req, res) => {
  const jeton = req.body.jeton;

  // Création de la connexion à la base de données
  const connection = mysql.createConnection({
    host: process.env.HOST_MYSQL,
    user: process.env.USERNAME_MYSQL,
    password: process.env.PASSWORD_MYSQL,
    database: process.env.DATABASE_MYSQL,
  });

  // On vérifie si le JWT existe déjà ou non
  connection.query(
    `SELECT * FROM users_jwt WHERE jwt = ?`,
    jeton,
    (err, results, fields) => {
      if (err) {
        connection.end();
        return res.json({
          status: "Erreur",
          message: "Erreur lors de la vérification du JWT",
          estConnecte: false,
          redirect: "/",
        });
      }

      if (results && results.length === 1) {
        // Vérifier le JWT et récupérer l'identifiant
        var decoded = jwt.verify(results[0]["jwt"], process.env.SECRET_KEY_JWT);

        if (decoded) {
          res.json({
            status: "Succès",
            message: "JWT Vérifié",
            utilisateur: {
              identifiant: decoded.identifiant,
              ID_user: decoded.ID_user,
            },
            estConnecte: true,
            redirect: "/login",
          });
        } else {
          res.json({
            status: "Erreur",
            message: "Jeton inconnu",
            estConnecte: false,
            redirect: "/login",
          });
        }
      } else {
        connection.end();
        res.json({
          status: "Erreur",
          message: "Jeton inconnu",
          estConnecte: false,
          redirect: "/login",
        });
      }
    }
  );
});

/***************************************************************  UPDATE  *****************************************************************/

app.get("/profil", (req, res) => {
  try {
    //Récupérer le JWT avec l'identifiant utilisateur
    let jeton = req.query.jeton;
    var decoded = jwt.verify(jeton, process.env.SECRET_KEY_JWT);

    // Création de la connexion à la base de données
    const connection = mysql.createConnection({
      host: process.env.HOST_MYSQL,
      user: process.env.USERNAME_MYSQL,
      password: process.env.PASSWORD_MYSQL,
      database: process.env.DATABASE_MYSQL,
    });
    connection.query(
      `SELECT * FROM users WHERE id = ?`,
      decoded.ID_user,
      (err, results, fields) => {
        if (err) {
          connection.end();
          return res.json({
            status: "Erreur",
            message: "Erreur lors de la vérification de l'utilisateur",
            estConnecte: false,
            redirect: "/",
          });
        }

        if (results && results.length === 1) {
          const cheminDuFichier = path.join(__dirname, "views", "modify.html");
          let contenuDuFichier = fs.readFileSync(cheminDuFichier, "utf-8");

          nouvelleValeur = results[0]["identifiant"];
          contenuDuFichier = contenuDuFichier.replace(
            'value=""',
            `value="${nouvelleValeur}"`
          );
          contenuDuFichier = contenuDuFichier.replace(
            ":userID",
            `${results[0]["id"]}`
          );

          res.json({
            status: "Succès",
            message: "Formulaire envoyé",
            redirect: "/profil",
            form: contenuDuFichier,
          });
        } else {
          connection.end();
          res.json({
            status: "Erreur",
            message: "Utilisateur inconnu",
            estConnecte: false,
            redirect: "/login",
          });
        }
      }
    );
  } catch (error) {
    console.error("Erreur lors de la lecture du fichier :", error);
    res.status(500).json({
      status: "Erreur interne du serveur",
      message: "Une erreur est survenue lors du traitement de la requête.",
    });
  }
});

app.patch("/update/:userID", (req, res) => {
  const identifiant = req.body.identifiant;
  const userID = parseInt(req.params.userID);

  // Création de la connexion à la base de données
  const connection = mysql.createConnection({
    host: process.env.HOST_MYSQL,
    user: process.env.USERNAME_MYSQL,
    password: process.env.PASSWORD_MYSQL,
    database: process.env.DATABASE_MYSQL,
  });

  connection.query(
    `UPDATE users SET identifiant = ? WHERE id = ?`,
    [identifiant, userID],
    (err, results, fields) => {
      if (err) {
        return res.json({
          status: "Erreur",
          message: "Erreur lors de la vérification de l'utilisateur",
          estConnecte: false,
          redirect: "/",
        });
      } else {
        let TokenJWTUtilisateur;
        // Supprimer l'ancien JWT
        connection.query(
          "DELETE FROM users_jwt WHERE id_user = ?",
          [userID],
          (err, results, fields) => {
            if (err) {
              console.log(err);
            }
            // Créer et  Ajouter un nouveau JWT
            TokenJWTUtilisateur = jwt.sign(
              {
                iss: "http://localhost",
                ID_user: userID,
                identifiant: identifiant,
              },
              process.env.SECRET_KEY_JWT
            );

            const SQLquery = `INSERT INTO users_jwt (jwt, id_user) VALUES (?, ?)`;

            connection.query(
              SQLquery,
              [TokenJWTUtilisateur, userID],
              (err, results, fields) => {
                if (!err) {
                  console.error(
                    "Insertion du JWT pour l'utilisateur :",
                    identifiant
                  );
                  connection.end();
                  res.json({
                    identifiant: identifiant,
                    JWT: TokenJWTUtilisateur,
                    status: "Succès",
                    message: "Modification réussie",
                    redirect: "/dashboard",
                  });
                } else {
                  console.error("Erreur lors de l'insertion du JWT :", err);
                }
              }
            );
          }
        );
      }
    }
  );
  connection.end();
});

app.get("/changePassword", (req, res) => {
  try {
    //Récupérer le JWT avec l'identifiant utilisateur
    let jeton = req.query.jeton;
    var decoded = jwt.verify(jeton, process.env.SECRET_KEY_JWT);

    // Création de la connexion à la base de données
    const connection = mysql.createConnection({
      host: process.env.HOST_MYSQL,
      user: process.env.USERNAME_MYSQL,
      password: process.env.PASSWORD_MYSQL,
      database: process.env.DATABASE_MYSQL,
    });
    connection.query(
      `SELECT * FROM users WHERE id = ?`,
      decoded.ID_user,
      (err, results, fields) => {
        if (err) {
          connection.end();
          return res.json({
            status: "Erreur",
            message: "Erreur lors de la vérification de l'utilisateur",
            estConnecte: false,
            redirect: "/",
          });
        }

        if (results && results.length === 1) {
          const cheminDuFichier = path.join(
            __dirname,
            "views",
            "changePassword.html"
          );
          let contenuDuFichier = fs.readFileSync(cheminDuFichier, "utf-8");

          contenuDuFichier = contenuDuFichier.replace(
            ":userID",
            `${results[0]["id"]}`
          );

          res.json({
            status: "Succès",
            message: "Formulaire envoyé",
            redirect: "/changePassword",
            form: contenuDuFichier,
          });
        } else {
          connection.end();
          res.json({
            status: "Erreur",
            message: "Utilisateur inconnu",
            estConnecte: false,
            redirect: "/login",
          });
        }
      }
    );
  } catch (error) {
    console.error("Erreur lors de la lecture du fichier :", error);
    res.status(500).json({
      status: "Erreur interne du serveur",
      message: "Une erreur est survenue lors du traitement de la requête.",
    });
  }
});

app.patch("/changePassword/:userID", (req, res) => {
  const identifiant = req.body.identifiant;
  const ancienMotDePasse = req.body.ancienMotDePasse;
  const nouveauMotDePasse = req.body.nouveauMotDePasse;
  const confirmationMotDePasse = req.body.confirmationMotDePasse;
  const userID = parseInt(req.params.userID);

  // Création de la connexion à la base de données
  const connection = mysql.createConnection({
    host: process.env.HOST_MYSQL,
    user: process.env.USERNAME_MYSQL,
    password: process.env.PASSWORD_MYSQL,
    database: process.env.DATABASE_MYSQL,
  });

  // On vérifie si les deux mots de passe sont identiques
  if (nouveauMotDePasse === confirmationMotDePasse) {
    // On vérifie si l'ancien mot de passe est bon
    connection.query(
      `SELECT * FROM users WHERE id = ?`,
      userID,
      async (err, results, fields) => {
        if (err) {
          connection.end();
          return res.json({
            status: "Erreur",
            message: "Erreur lors de la vérification de l'utilisateur",
            estConnecte: false,
            redirect: "/login",
          });
        }

        if (results && results.length === 1) {
          // On le compare avec bcrypt
          let isPasswordValid = await bcrypt.compare(
            ancienMotDePasse,
            results[0].motdepasse
          );
          if (isPasswordValid) {
            bcrypt.hash(nouveauMotDePasse, 10, function (err, hash) {
              if (err) {
                console.log("Erreur lors du hachage du mot de passe ");
                return res.json({
                  status: "Erreur",
                  message: "Erreur lors du hachage du mot de passe",
                  redirect: "/register",
                });
              } else {
                // L'ancien mot de passe correspond donc on modifie en base le mot de passe
                connection.query(
                  `UPDATE users SET motdepasse = ? WHERE id = ?`,
                  [hash, userID],
                  (err, results, fields) => {
                    if (err) {
                      console.log("Erreur lors de la mise à jour ");
                      return res.json({
                        status: "Erreur",
                        message: "Erreur lors de la mise à jour ",
                        estConnecte: false,
                        redirect: "/profil",
                      });
                    } else {
                      console.log("Mot de passe mis à jour ! ");
                      return res.json({
                        status: "Succès",
                        message: "Mot de passe mis à jour !",
                        estConnecte: true,
                        redirect: "/profil",
                      });
                    }
                  }
                );
              }
            });
          } else {
            connection.end();
            console.log("l'ancien mot de passe ne correspond pas ! ");
            res.json({
              status: "Erreur",
              message: "l'ancien mot de passe ne correspond pas ! ",
              estConnecte: false,
              redirect: "/login",
            });
          }
        } else {
          connection.end();
          console.log("Utilisateur inconnu");
          res.json({
            status: "Erreur",
            message: "Utilisateur inconnu",
            estConnecte: false,
            redirect: "/login",
          });
        }
      }
    );
  } else {
    connection.end();
    console.log("Les deux mot de passe ne sont pas identiques !");
    return res.json({
      status: "Erreur",
      message: "Erreur les deux mot de passes ne sont pas identiques !",
      estConnecte: false,
      redirect: "/changePassword",
    });
  }
});

// On écoute sur le port 4000
app.listen(4000, () => {
  console.log("Listening on 4000");
});
