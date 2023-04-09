const express = require('express');
const app = express();
const port = 3000;

app.get('/oauth2callback', (req, res) => {
  const code = req.query.code;
  if (code) {
    res.send(`<h1>Authorization code:</h1><pre>${code}</pre><p>Please copy this code and paste it in the terminal.</p>`);
  } else {
    res.send('<h1>Error:</h1><p>No authorization code received.</p>');
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
