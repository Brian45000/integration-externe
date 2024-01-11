# Schéma de la Base de Données

## Table des Utilisateurs

```sql
CREATE DATABASE IF NOT EXISTS ie_authentification;
USE ie_authentification;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    identifiant VARCHAR(255) NOT NULL,
    motdepasse VARCHAR(255) NOT NULL
);

CREATE TABLE users_jwt (
    id INT PRIMARY KEY AUTO_INCREMENT,
    jwt VARCHAR(255) NOT NULL,
    id_user VARCHAR(255) NOT NULL
);
```

## Table des itinéraires

```sql
CREATE DATABASE IF NOT EXISTS ie_itineraire;
USE ie_itineraire;

CREATE TABLE itineraires (
    id INT PRIMARY KEY AUTO_INCREMENT,
    startPoint VARCHAR(255) NOT NULL,
    endPoint VARCHAR(255) NOT NULL,
    instructions TEXT,
    id_user INT,
);

```
