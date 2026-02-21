const express = require("express");
const admin = require("firebase-admin");
const { distanceKm } = require("./geo");

const app = express();
app.use(express.json());

// ✅ PASTE HERE
app.get("/", (req, res) => {
  res.send("Nearest Care API running");
});

// Firebase initialization
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Existing API
app.get("/nearest", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    const snapshot = await db.collection("hospitals").get();
    const hospitals = [];

    snapshot.forEach(doc => {
      const h = doc.data();
      if (
        h.open_status === true &&
        typeof h.latitude === "number" &&
        typeof h.longitude === "number"
      ) {
        const dist = distanceKm(lat, lng, h.latitude, h.longitude);
        hospitals.push({
          id: doc.id,
          name: h.name,
          phone: h.phone,
          latitude: h.latitude,
          longitude: h.longitude,
          distance_km: Number(dist.toFixed(2)),
        });
      }
    });

    hospitals.sort((a, b) => a.distance_km - b.distance_km);
    res.json(hospitals.slice(0, 5));

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});