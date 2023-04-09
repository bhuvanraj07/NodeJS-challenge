const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
require("dotenv").config();

const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];
const TOKEN_PATH = process.env.TOKEN_PATH;

const credentials = JSON.parse(fs.readFileSync("credentials.json"));
const { client_id, client_secret, redirect_uris } = credentials.web;

const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

async function authorize() {
  try {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    auth.setCredentials(token);
  } catch (error) {
    console.log("No token found. Requesting a new one...");
    await getNewToken(auth);
  }
  return auth;
}

function getNewToken(auth) {
  const authUrl = auth.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // Add this line
  });

  console.log("Authorize this app by visiting this url:", authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question("Enter the code from that page here: ", (code) => {
      rl.close();

      auth.getToken(code, (error, token) => {
        if (error) {
          console.error("Error retrieving access token", error);
          reject(error);
        } else {
          auth.setCredentials(token);
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
          console.log("Token stored to", TOKEN_PATH);
          resolve(auth);
        }
      });
    });
  });
}

module.exports = {
  authorize,
};
