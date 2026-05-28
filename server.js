// Originally created by Rachel Pottinger at UBC
// Modified by Kelly Shaw in 2026 for Williams CS335

// This file would be run on a CS machine

const express = require('express')
const app = express()
const appRouter = require('./appRouter');

require('dotenv').config();
const port = process.env.PORT || 3000;

app.use(express.static('public'));  // Serve static files from the 'public' directory
app.use(express.json());             // Parse incoming JSON payloads

// mount the router
app.use('/', appRouter);

// The 0.0.0.0 is needed to work over the VPN
app.listen(port, '0.0.0.0', () => {
  console.log(`Server app listening at http://localhost:${port}/`)
})
