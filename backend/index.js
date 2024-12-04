const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql");
const app = express();
const port = 4444;
require("dotenv").config();

// MySQL veza
const connection = mysql.createConnection({
  host: "student.veleri.hr",
  user: "isvalina",
  password: "11",
  database: "isvalina",
});

connection.connect(function (err) {
  if (err) throw err;
  console.log("Connected to the database!");
});

// Middleware za JSON tijelo zahtjeva
app.use(bodyParser.json());
app.use(cors());

// Ruta za registraciju korisnika
app.post("/api/registracija", (request, response) => {
  const { ime, prezime, korime, lozinka } = request.body;

  console.log("Podaci za registraciju:", { ime, prezime, korime, lozinka });

  // Provjeravamo postoji li već korisničko ime u bazi
  connection.query(
    "SELECT * FROM korisnik WHERE korime = ?",
    [korime],
    (err, results) => {
      if (err) {
        console.error("Greška pri provjeri korisničkog imena:", err);
        return response.json({
          success: false,
          message: "Došlo je do pogreške pri provjeri korisničkog imena.",
        });
      }

      if (results.length > 0) {
        // Ako korisničko ime već postoji
        console.log("Korisničko ime već postoji.");
        return response.json({
          success: false,
          message: "Korisničko ime je već registrirano!",
        });
      }

      // Unos novog korisnika u bazu (bez šifriranja lozinke)
      const query =
        "INSERT INTO korisnik (ime, prezime, korime, lozinka) VALUES (?, ?, ?, ?)";
      connection.query(
        query,
        [ime, prezime, korime, lozinka],
        (err, results) => {
          if (err) {
            console.error("Greška pri unosu korisnika:", err);
            return response.json({
              success: false,
              message: "Došlo je do pogreške pri unosu korisnika.",
            });
          }

          console.log("Korisnik uspješno registriran.");
          response.json({
            success: true,
            message: "Korisnik uspješno registriran!",
          });
        }
      );
    }
  );
});

// Ruta za dohvaćanje knjiga
app.get("/api/knjige", (request, response) => {
  connection.query("SELECT * FROM knjiga", (error, results) => {
    if (error) throw error;

    // Ako su slike BLOB podaci, pretvorimo ih u Base64
    results.forEach((book) => {
      if (book.slika) {
        const base64Image = Buffer.from(book.slika).toString("base64");
        book.slika = `data:image/jpeg;base64,${base64Image}`; // Pretpostavljamo da je slika JPEG
      }
    });

    response.send(results);
  });
});

// Ruta za rezervaciju knjige (nije zaštićena)
app.post("/api/rezerv_knjige", (req, res) => {
  const { datum, id_knjiga } = req.body;

  if (!datum || !id_knjiga) {
    return res.status(400).json({ message: "Svi podaci su obavezni." });
  }

  const rezervacija = [[datum, id_knjiga]];

  connection.query(
    "INSERT INTO rezervacija (datum_rez, knjiga) VALUES ?",
    [rezervacija],
    (error, results) => {
      if (error) {
        console.error("Greška prilikom dodavanja rezervacije:", error);
        return res.status(500).json({ message: "Došlo je do greške." });
      }

      res.json({
        message: "Rezervacija uspješno dodana!",
        reservationId: results.insertId,
      });
    }
  );
});

// Provjera korisničkog imena (check-korime)
app.post("/api/check-korime", (req, res) => {
  const { korime } = req.body;

  // Provjera postoji li korisničko ime u bazi podataka
  connection.query(
    "SELECT * FROM korisnik WHERE korime = ?",
    [korime],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Greška u provjeri korisničkog imena.",
        });
      }

      // Ako korisničko ime postoji, šaljemo odgovor
      if (results.length > 0) {
        return res.json({ exists: true }); // Ako korisnik već postoji
      } else {
        return res.json({ exists: false }); // Ako korisnik ne postoji
      }
    }
  );
});

// Startanje servera
app.listen(port, () => {
  console.log(`Server running at port: ${port}`);
});
