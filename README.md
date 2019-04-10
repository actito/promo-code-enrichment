# Google Cloud Functions - Offer Assignment Reference sample

The functions here will allow you to simulate a cash register system to synchronize personal coupon codes with the ACTITO offer module.

This package contains two functions:

1. First function: readFile

   This function reads files from a text file uploaded to google storage and adds the corresponding information in the google firestore database.

   Note that :

   - file must be a csv with one column named assignmentReference
   - fileName must be an offerReference in offerCatalog table

2. Second function: enrichAssignment

   This function triggers the enrichment of the assignment record with a personalized coupon code from the firestore database.

   Note that :

   - It will be called from the actito webhook when a new offer assignment is created.
   - It requires actito web service credentials to be stored in `functions/credentials/actito-credentials.json`.

## Insert your ACTITO credentials

save your actito informations to `.actito-credentials.json`
format should be:

```json
{
    "credentials": {
      "user": "licenceName/login",
      "password": "password"
    },
    "entity": "entityName",
    "env": "test" or "prod"
};
```

## Setup your firebase project

- Setup your [firebase](https://firebase.google.com) account
- Create your [firebase project](https://firebase.google.com/docs/web/setup).
- Get the credentials from your project

  - go to the porject settings from your [firebase console](https://console.firebase.google.com/)

    ![Project setup](./readme/firebase-project-settings.png)

  - Go to the service accounts tab

    ![Service accounts tab](./readme/service-accounts.png)

  - Generate the private key

    ![Generate the private key](./readme/generate-private-key.png)

  save your firebase admin key to `.google-private-key.json`

  - Copy your databaseUrl to `credentials.js`

### Upload your functions to google

1. Login into your account

   Type `firebase login` at the command prompt to log into your google account

2. Deploy functions

   ```bash
   cd /functions
   npm install
   npm run deploy
   ```

### Create your actito webhook

1. Go to [actito api](https://api.actito.com/ActitoWebServices/doc/)

   For test [actito api](https://test.actito.be/ActitoWebServices/doc/)

   ![Custom table api](./readme/custom-table-api.png)

2. Complete form with your entityName and customTableName (name of the table assignment)

   ![Webhook subscription api](./readme/create-webhook-subscription.png)

3. Complete form with with webhookSubscription

```json
{
  "eventType": "CREATE",
  "isActive": true,
  "onFields": [
    "synchronized", "offerReference"
  ],
  "targetUrl": "google function enrichAssignment url"
};
```

- google function enrichAssignment url

![Google cloud functions](./readme/google-cloud-funcions.png)

![google cloud function url](./readme/google-cloud-function-url.png)

1. Submit with `Try it out!` button

## See it in action

1. Ensure your licence has an offer - assignment configuration

2. Create an offer in your catalog with offerReference `springoffer`

   - Make sure toSynchronize is set to `true`

   ![Spring offer creation](./readme/springoffer-creation.png)

3. Upload file with the codes to your google storage.
   You have a test file here : `./functions/test/springoffer.csv`
   ![Upload codes to storage](./readme/upload-to-storage.png)

4. Check that the appropriate entries have been created in your firestore database
   ![See codes in the database](./readme/assignment-codes-created.png)

5. Create a new assignment in your table

   - linked to springoffer
   - with `synchronized`set to false

     ![Assignment to enrich](./readme/assignment-to-enrich.png)

6. See in google that the function `enrichAssignment` has been called

   ![Assignment function log](./readme/assignment-function-run.png)

7. See that the assignment has been enriched

   ![Enriched assignment](./readme/assignment-enriched.png)

Voilà !
