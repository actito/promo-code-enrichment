const admin = require("firebase-admin");
const functions = require("firebase-functions");
const request = require("request");
const parse = require("csv-parser");

// see content of './credentials/credentials for information on providing actual credentials
const { actitoInfo, googleInfo } = require("./credentials/credentials");

admin.initializeApp({
  credential: admin.credential.cert(googleInfo.serviceAccountKey),
  databaseURL: googleInfo.databaseUrl
});

const db = admin.firestore();
const storage = admin.storage();

exports.newFile = functions.storage.object().onFinalize(async data => {
  const filePath = data.name;
  const bucket = storage.bucket(data.bucket);
  await readFile(filePath, bucket, data);
});

function readFile(filePath, bucket, data) {
  return new Promise(resolve => {
    const offerName = data.name.split(".")[0];
    bucket
      .file(filePath)
      .createReadStream()
      .pipe(parse())
      .on("data", record => {
        db.collection(`offer/${offerName}/assignment`)
          .add({ assignmentReference: record.assignmentReference })
          .catch(err => {
            console.error(err);
          });
      })
      .on("end", () => {
        resolve();
      });
  });
}

exports.webhookPost = functions.https.onRequest(async (req, res) => {
  const { data, tableId } = req.body;
  const { id, offerReference, synchronized } = data;

  if (synchronized !== "true") {
    const docs = await getDocs(offerReference);
    db.doc(`offer/${offerReference}/assignment/${docs[0].id}`)
      .delete()
      .catch(error => {
        console.error(error);
      });
    const statuscode = await put(tableId, id, docs);
    res.send(`post request on actito api return with status ${statuscode}`);
  } else res.send(`already synchronized`);
});

function put(tableId, id, docs) {
  return new Promise(resolve => {
    const record = {
      properties: [
        { name: "synchronized", value: true },
        { name: "assignmentReference", value: docs[0].assignmentReference }
      ]
    };

    const auth =
      "Basic " + new Buffer(actitoInfo.credentials.user + ":" + actitoInfo.credentials.password).toString("base64");
    request.put(
      {
        url: `${actitoInfo.url}/entity/${actitoInfo.entity}/customTable/${tableId}/record/${id}`,
        headers: {
          "Content-Type": "application/json",
          Authorization: auth
        },
        body: record,
        json: true
      },
      function(error, response) {
        if (error || response.statusCode !== 200) {
          console.error({ error, code: response.statusCode });
        }
        resolve(response.statusCode);
      }
    );
  });
}

function getDocs(offerReference) {
  return new Promise(resolve => {
    db.collection(`offer/${offerReference}/assignment`)
      .limit(1)
      .get()
      .then(snapshot => {
        const doc = snapshot.docs[0];
        resolve([{ id: doc.id, ...doc.data() }]);
      })
      .catch(error => {
        console.error(error);
      });
  });
}
