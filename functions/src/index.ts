import { updateRecord, addRecord } from "@actito/data-model-sdk/lib/tables";
import { getProfile } from "@actito/data-model-sdk/lib/profiles";
import { functions } from "./connectors/google";
import { v4 as uuid } from "uuid";

// tslint:disable-next-line: no-import-side-effect
import "./init-actito";

const PROFILE_TABLE = "Clients";
const ASSIGNMENTS_TABLE = "OfferAssignments";

// --------------------------------------------------
// Called from ACTITO webhook to enrich assignment

export const enrichAssignment = functions.https.onRequest(async (req, res) => {
  const { data, tableId } = req.body;
  const { id, synchronized } = data;
  if (synchronized !== "true") {
    const statuscode = await updateRecord(tableId, id, { synchronized: true, assignmentReference: uuid() });
    res.send(`post request on actito api return with status ${statuscode}`);
  } else {
    res.send(`already synchronized`);
  }
});

// --------------------------------------------------
// To be called from ACTITO webhook when sponsored profile has entered store
//

export const onFirstPurchase = functions.https.onRequest(async (req, res) => {
  const { data } = req.body;
  const { profileId } = data;

  const visitorInfo = await getProfile(PROFILE_TABLE, profileId);
  const { firstName, lastName, sponsorEmail, firstPurchaseDate } = visitorInfo.profile;

  if (!sponsorEmail) {
    res.send(`NON sponsored ${firstName} ${lastName} has made a first purchase on ${firstPurchaseDate}`);
  } else {
    await addRecord(ASSIGNMENTS_TABLE, {
      synchronized: false,
      offerReference: "sponsoredFirstPurchase",
      profileReference: sponsorEmail
    });
    res.send(`sponsored ${firstName} ${lastName} has made a first purchase on ${firstPurchaseDate}`);
  }
});
