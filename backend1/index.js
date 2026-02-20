const express = require("express");
const admin = require("firebase-admin");
const { distanceKm } = require("./geo");

const app = express();
app.use(express.json());

// Initialize Firebase Admin using service account key
admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json"))
});

const db = admin.firestore();

// API endpoint
app.get("/nearest", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    // Validate inputs
    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    const snapshot = await db.collection("hospitals").get();

    const hospitals = [];
    snapshot.forEach(doc => {
      const h = doc.data();

      if (h.open_status === true) {
        const dist = distanceKm(lat, lng, h.latitude, h.longitude);

        hospitals.push({
          id: doc.id,
          name: h.name,
          phone: h.phone,
          type: h.type,
          latitude: h.latitude,
          longitude: h.longitude,
          distance_km: Number(dist.toFixed(2))
        });
      }
    });

    hospitals.sort((a, b) => a.distance_km - b.distance_km);

    return res.json(hospitals.slice(0, 5));

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Render requires dynamic port
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port", PORT));