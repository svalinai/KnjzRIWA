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

// Handler za kada se dogodi greška u vezi s bazom
pool.on("error", (err) => {
  console.error("Database connection error:", err);
  // Ovdje možete implementirati ponovni pokušaj ili obavijestiti administratore
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

app.get("/api/rezervirane_knjige", (req, res) => {
  const query = `
    SELECT 
        r.id AS rezervacija_id,
        r.datum_rez AS datum_rezervacije,
        k.naslov AS naslov_knjige,
        k.autor AS autor_knjige,
        k.opis AS opis_knjige,
        k.stanje AS stanje_knjige,
        kor.ime AS ime_korisnika,
        kor.prezime AS prezime_korisnika,
        kor.korime AS korisnicko_ime
    FROM rezervacija r
    JOIN knjiga k ON r.knjiga = k.id
    JOIN korisnik kor ON r.korisnik = kor.id;
  `;

  // Koristi pool.query za izvršavanje upita
  pool.query(query, (err, results) => {
    if (err) {
      console.error("Greška pri dohvaćanju podataka:", err);
      res.status(500).send("Greška pri dohvaćanju podataka");
      return;
    }
    res.json(results); // Vraća sve rezervacije s podacima o knjigama i korisnicima
  });
});

// Pokretanje servera
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
