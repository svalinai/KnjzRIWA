const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const app = express();
const port = 4444;

// Middleware za parsiranje JSON podataka
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS omogućen za sve zahtjeve
app.use(cors());

// Postavljanje veze s bazom podataka (Koristimo connection pool umjesto obične veze)
const pool = mysql.createPool({
  host: "student.veleri.hr",
  user: "fgunja",
  password: "11",
  database: "fgunja",
  waitForConnections: true,
  connectionLimit: 10, // Ovdje možete promijeniti broj veza prema potrebama
  queueLimit: 0,
});

// Dohvaćanje svih knjiga
app.get("/api/knjige", (req, res) => {
  pool.query("SELECT * FROM knjiga", (error, results) => {
    if (error) {
      console.error("Error fetching books:", error);
      res.status(500).send("Error fetching books");
      return;
    }

    // Convert the BLOB images to Base64 strings
    const booksWithImages = results.map((book) => {
      if (book.slika) {
        // Convert the BLOB data into a Base64 string
        book.slika = Buffer.from(book.slika).toString("base64");
      }
      return book;
    });

    // Send the book data as a JSON response
    res.json(booksWithImages);
  });
});

// Dohvaćanje jedne knjige prema ID-u
app.get("/api/knjige/:id", (req, res) => {
  const id = req.params.id;
  pool.query("SELECT * FROM knjiga WHERE id = ?", [id], (error, results) => {
    if (error) {
      console.error("Error fetching book:", error);
      res.status(500).send("Error fetching book");
      return;
    }
    if (results.length === 0) {
      res.status(404).send("Book not found");
      return;
    }
    res.json(results[0]);
  });
});

// Dodavanje rezervacije za knjigu
app.post("/api/rezerv_knjige", (req, res) => {
  const { datum, id_knjiga, id_korisnik } = req.body;

  if (!datum || !id_knjiga || !id_korisnik) {
    res.status(400).send("Missing required fields");
    return;
  }

  const rezervacija = [[datum, id_knjiga, id_korisnik]];
  pool.query(
    "INSERT INTO rezervacija (datum_rez, knjiga, korisnik) VALUES ?",
    [rezervacija],
    (error, results) => {
      if (error) {
        console.error("Error creating reservation:", error);
        res.status(500).send("Error creating reservation");
        return;
      }
      res
        .status(201)
        .send({ message: "Reservation created", id: results.insertId });
    }
  );
});

// Pokretanje servera
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
