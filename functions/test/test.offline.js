const chai = require("chai");
const assert = chai.assert;
const sinon = require("sinon");
const admin = require("firebase-admin");
const test = require("firebase-functions-test")();
const uuid = require("uuid");
const fs = require("fs");

const { Storage } = require(`@google-cloud/storage`);
const storage = new Storage();

const request = require("request");

describe("Cloud functions", () => {
  let myFunctions, adminInitStub;

  before(() => {
    myFunctions = require("../index");

    adminInitStub = sinon.stub();
    Object.defineProperty(admin, "initializeApp()", { get: () => adminInitStub });
  });

  after(() => {
    test.cleanup();
  });

  describe("newFile", () => {
    it("should insert data from file in database", async () => {
      const filePrefix = `${uuid.v4()}`;

      const bucket = storage.bucket("promo-code-enrichment.appspot.com");
      const fileName = `${filePrefix}.csv`;
      const fileStub = sinon.stub();
      const bucketStub = sinon.stub();
      const storageStub = sinon.stub();

      Object.defineProperty(admin, "storage", { get: () => storageStub });
      storageStub.returns({ bucket: bucketStub });
      bucketStub.withArgs(bucket).returns({ file: fileStub });
      fileStub
        .withArgs(fileName)
        .returns({
          createReadStream: () =>
            fs.createReadStream("/home/bollc/IdeaProjects/google/promo-code-enrichment/functions/test/springoffer.csv")
        });

      const databaseStub = sinon.stub();
      const collectionParam1 = "offer";
      const collectionStub1 = sinon.stub();
      const docStub = sinon.stub();
      const collectionParam2 = "assignment";
      const collectionStub2 = sinon.stub();
      const docParam = `${filePrefix}`;
      Object.defineProperty(admin, "firestore", { get: () => databaseStub });
      databaseStub.returns({ collection: collectionStub1 });
      collectionStub1.withArgs(collectionParam1).returns({ doc: docStub });
      docStub.withArgs(docParam).returns({ collection: collectionStub2 });
      const assigmentReference = [];
      collectionStub2.withArgs(collectionParam2).returns({
        add: hash => {
          assigmentReference[assigmentReference.length] = hash;
          return new Promise(resolve => {
            resolve();
          });
        }
      });

      const event = {
        name: fileName,
        bucket
      };

      const wrapped = test.wrap(myFunctions.newFile);

      await wrapped(event);

      const expected = [{ assignmentReference: "assignment1" }, { assignmentReference: "assignment2" }];

      assert.deepEqual(assigmentReference, expected);
    });
  });

  describe("enrichAssignment", () => {
    it("should return ok", () => {
      const req = {
        body: {
          tableId: "tableId",
          data: {
            id: 1,
            offerReference: "offerReference",
            synchronized: "false"
          }
        }
      };

      const res = {
        send: message => {
          assert.equal(message, `post request on actito api return with status 200`);
        }
      };

      const databaseStub = sinon.stub();
      const collectionParam1 = "offer";
      const collectionStub1 = sinon.stub();
      const docParam1 = "offerReference";
      const docStub1 = sinon.stub();
      const collectionParam2 = "assignment";
      const collectionStub2 = sinon.stub();
      const limitParam = 1;
      const limitStub = sinon.stub();
      const getStub = sinon.stub();
      const snapshotStub = new Array();
      const docStub2 = sinon.stub();

      const doc = {
        id: 123,
        data: () => {
          return { assignmentReference: "assignment1" };
        }
      };

      Object.defineProperty(admin, "firestore", { get: () => databaseStub });
      databaseStub.returns({ collection: collectionStub1 });
      collectionStub1.withArgs(collectionParam1).returns({ doc: docStub1 });
      docStub1.withArgs(docParam1).returns({ collection: collectionStub2 });
      collectionStub2.withArgs(collectionParam2).returns({ limit: limitStub, doc: docStub2 });
      limitStub.withArgs(limitParam).returns({ get: getStub });

      getStub.returns(Promise.resolve(snapshotStub));
      snapshotStub.push(doc);

      docStub2.withArgs().returns({
        delete: () => {
          return new Promise(resolve => {
            resolve();
          });
        }
      });

      const obj = {
        res: {
          statusCode: 200
        },
        body: {
          id: 1
        }
      };

      const requestStub = sinon.stub(request, "put").yields(null, obj.res, JSON.stringify(obj.body));

      myFunctions.enrichAssignment(req, res);
    });
  });
});
