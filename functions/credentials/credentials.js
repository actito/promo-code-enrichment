// save your firebase admin key to ./google-private-key.json
const serviceAccountKey = require("./google-private-key.json");

// save your firebase admin key to ./actito-credentials.json
// format should be:
// {
//     "credentials": {
//       "user": "licenceName/login",
//       "password": "password"
//     },
//     "entity": "entityName",
//     "url": "url"
// };
const actitoCredentials = require("./actito-credentials.json");

module.exports = {
  googleInfo: {
    serviceAccountKey,
    databaseUrl: "https://actito-promo.firebaseio.com"
  },

  actitoInfo: actitoCredentials
};
