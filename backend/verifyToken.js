const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).json({ message: "Prvo se prijavite" });
  }

  try {
    const decoded = jwt.verify(token, "jak_kljuc");
    req.user = decoded; // Pohranjivanje korisničkih podataka iz tokena
    next();
  } catch (err) {
    return res.status(400).json({ message: "Neispravan ili istekao token" });
  }
}

module.exports = verifyToken;
