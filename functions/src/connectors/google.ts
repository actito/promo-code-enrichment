import { googleInfo } from "../credentials";
import * as admin from "firebase-admin";
import * as firebaseFunctions from "firebase-functions";

export const functions = firebaseFunctions.region("europe-west1");

admin.initializeApp({
  credential: admin.credential.cert(googleInfo.serviceAccountKey as admin.ServiceAccount),
  databaseURL: googleInfo.databaseUrl
});
