const admin = require('firebase-admin');
const functions = require('firebase-functions');
const serviceAccount = require('./credentials/serviceAccountKey');
const actitoInfo = require('./credentials/actitoInfo');
const request = require('request');
const parse = require('csv-parser');


exports.newFile = functions.storage.object().onFinalize(async (data) => {

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: 'your database url',
        });
    }

    const db = admin.firestore();
    const filePath = data.name;
    const bucket = admin.storage().bucket(data.bucket);

    await readFile(db, filePath, bucket, data);
});

function readFile(db, filePath, bucket, data) {
    return new Promise((resolve) => {
        bucket.file(filePath).createReadStream().pipe(parse())
            .on('data', (record) => {
                db.collection('offer').doc(`${data.name}`.split('.')[0]).collection('assignment')
                    .add({"assignmentReference": record.assignmentReference})
                    .then((data) => {
                    })
                    .catch((err) => {
                        console.error(err)
                    });
            })
            .on('end', () => {
                resolve();
            });
    });
}

exports.webhookPost = functions.https.onRequest(async (req, res) => {

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: 'your database url',
        });
    }

    const db = admin.firestore();
    let data = req.body.data;
    let tableId = req.body.tableId;

    let id = data["id"];
    let offerReference = data["offerReference"];
    let synchronized = data["synchronized"];
    let docs = [];

    if (synchronized != "true") {
        docs = await getDocs(db, offerReference);

        db.collection('offer').doc(`${offerReference}`).collection('assignment').doc(docs[0].id).delete()
            .then(() => {
            })
            .catch((error) => {
                console.error(error);
            });

        const statuscode = await put(tableId, id, docs);

        res.send(`post request on actito api return with status ${statuscode}`);

    } else
        res.send(`already synchronized`)
});

function put(tableId, id, docs) {
    return new Promise((resolve) => {

        const record = {
            properties: [
                {name: "synchronized", value: true},
                {name: "assignmentReference", value: docs[0].assignmentReference}
            ]
        };

        const auth = "Basic " + new Buffer(actitoInfo.credentials.user + ":" + actitoInfo.credentials.password).toString("base64");
        request.put({
                method: 'PUT',
                url: `${actitoInfo.url}/entity/${actitoInfo.entity}/customTable/${tableId}/record/${id}`,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": auth
                },
                body: record,
                json: true,
            },
            function (error, response, body) {
                if (error || response.statusCode != 200) {
                    console.error({error, code: response.statusCode});
                }
                resolve(response.statusCode);
            });
    });
}

function getDocs(db, offerReference) {
    return new Promise((resolve) => {
        const docs = [];
        db.collection('offer').doc(`${offerReference}`).collection('assignment').limit(1).get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    let indoc = doc.data();
                    indoc.id = doc.id;
                    docs[docs.length] = indoc;
                    resolve(docs);
                });
            })
            .catch((error) => {
                console.error(error);
            });
    });
}