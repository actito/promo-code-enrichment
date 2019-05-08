import { updateRecord, addRecord } from "@actito/data-model-sdk/lib/tables";
import { getProfile } from "@actito/data-model-sdk/lib/profiles";
import { functions } from "./connectors/google";

// tslint:disable-next-line: no-import-side-effect
import "./init-actito";
import { addUserToDiscount, addCouponCodeToPriceRule } from "./connectors/shopify";

const PROFILE_TABLE = "Clients";
const ASSIGNMENTS_TABLE = "OfferAssignments";

// --------------------------------------------------
// Called from ACTITO webhook to enrich assignment

export const enrichAssignment = functions.https.onRequest(async (req, res) => {
  const { data, tableId } = req.body;
  const { id, profileReference: email, offerReference, synchronized } = data;
  if (synchronized !== "true") {
    const uniqueCode = Math.random()
      .toString(36)
      .substring(2, 15)
      .toUpperCase();
    try {
      await addUserToDiscount(email, offerReference);
      await addCouponCodeToPriceRule(offerReference, uniqueCode);
      const statuscode = await updateRecord(tableId, id, { synchronized: true, assignmentReference: uniqueCode });
      res.send(`post request on actito api return with status ${statuscode}`);
    } catch (error) {
      console.log("error from shopify" + error.toString());
      res.status(500).send(error.toString());
    }
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
