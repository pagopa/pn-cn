// copied from activityStepManager
const { Buffer } = require("node:buffer");
const { gunzipSync } = require("node:zlib");

function myGunzip(buffer) {
  return gunzipSync(buffer);
}

function decodePayload(b64Str) {
  const payloadBuf = Buffer.from(b64Str, "base64");

  let parsedJson;
  try {
    parsedJson = JSON.parse(payloadBuf.toString("utf8"));
  } catch (err) {
    const uncompressedBuf = myGunzip(payloadBuf);
    parsedJson = JSON.parse(uncompressedBuf.toString("utf8"));
  }

  return parsedJson;
}

function isCdcTtlRemovalEvent(event){
  return event &&
    event.eventName === "REMOVE" &&
    event.userIdentity !== null &&
    event.userIdentity.type === "Service" &&
    event.userIdentity.principalId === "dynamodb.amazonaws.com"
}

exports.isCdcTtlRemovalEvent = isCdcTtlRemovalEvent

function isSafeStorageEvent(event){
  return event && event['detail-type'] === 'SafeStorageOutcomeEvent'
}

exports.isSafeStorageEvent = isSafeStorageEvent

// DELETE intead of INSERT ()
function mustProcess(rec) {
  return isCdcTtlRemovalEvent(rec) || isSafeStorageEvent(rec)
}

exports.extractKinesisData = function (kinesisEvent) {
  console.log("Kinesis event: ", JSON.stringify(kinesisEvent));
  if (kinesisEvent == null || kinesisEvent.Records == null) {
    return [];
  }
  return kinesisEvent.Records.map((rec) => {
    const decodedPayload = decodePayload(rec.kinesis.data);
    return {
      kinesisSeqNumber: rec.kinesis.sequenceNumber,
      ...decodedPayload,
    };
  }).filter((rec) => {
    return mustProcess(rec);
  });
};
