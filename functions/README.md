# Google Cloud Functions - Offer Assignment Reference sample

## Create your Google account

## Init project to Firebase
1. change the serviceAccountKey.json file with your Firebase Admin SDK private key.
In firebase, go to Project settings -> service accounts -> generate new private key
1. change databaseURL in index.js

### Command line

1. Login

        firebase login 
        
1. Init

        firebase init
        
1. Deploy functions

        cd /functions
        npm install
        firebase deploy
        
### Database
1. add collection offer with id assignment



## First functions: readFile
1. file must be a csv with one column named assignmentReference
1. fileName must be an offerReference in offerCatalog table

## Second functions: webhookPost
1. activated at the post of a web hook
1. modify the actitoInfo.json file with your informations and the url of the webservices 
(depend on your actito licence environment)