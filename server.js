const express = require("express");
const admin = require('firebase-admin');
const app = express();
const { v4: uuidv4 } = require('uuid');
const cors = require("cors");

// Initialize Firebase Admin
const serviceAccount = require('./secret.json'); // Update the path to your private key file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// app.use(express.json({limit: '50mb'})); // Increase the limit if your images are large

// Dummy photo data
app.use(cors());

app.use(express.json()); // For parsing application/json

app.post('/upload', async (req, res) => {
  try {
    const { photo, temperature, moisture, status, createdAt } = req.body;
    const imageId = uuidv4(); // Generate a unique UUID

    // Save the photo and additional data to Firestore
    const docRef = db.collection('photos').doc(imageId);
    await docRef.set({ photo, temperature,  moisture, status, id: imageId, createdAt: new Date() });

    res.send(`Data uploaded successfully to Firestore with ID: ${imageId}`);
  } catch (error) {
    console.error('Error saving to Firestore:', error.message, error.stack);
    res.status(500).send(`Error saving to Firestore: ${error.message}`);
  }
});

app.get('/photos', async (req, res) => {
  try {
    const photosRef = db.collection('photos')
                        .orderBy('createdAt', 'desc') // Order by createdAt in descending order
                        .limit(3); // Limit to the last three documents

    const snapshot = await photosRef.get();
    
    const photos = [];
    snapshot.forEach(doc => {
      photos.push({ id: doc.id, ...doc.data() });
    });

    res.json(photos);
  } catch (error) {
    console.error('Error fetching data from Firestore:', error.message);
    res.status(500).send(`Error fetching data: ${error.message}`);
  }
});

app.get('/photos/:id', async (req, res) => {
  try {
    const docId = req.params.id;
    const docRef = db.collection('photos').doc(docId);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).send('No document found with the given ID.');
    } else {
      res.json({ id: doc.id, ...doc.data() });
    }
  } catch (error) {
    console.error('Error fetching document from Firestore:', error.message);
    res.status(500).send(`Error fetching document: ${error.message}`);
  }
});

const path = require("path");

app.use(express.static(path.join(__dirname)));

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
