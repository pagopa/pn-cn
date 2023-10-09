exports.getSecret = async function(secretName) {
  try {
    const response = await fetch(
      `http://localhost:2773/secretsmanager/get?secretId=${encodeURIComponent(
          secretName
      )}`,
      {
        headers: {
          'Content-Type': 'application/json',
          "X-Aws-Parameters-Secrets-Token": process.env.AWS_SESSION_TOKEN,
        },
      }
    );
    const data = await response.json()
    const secret = data.SecretString;
    const secretAsJson = JSON.parse(secret)
    return secretAsJson
  } catch (err) {
    console.error("Error in get secret ", err);
    throw new Error("Error in get secret "+secretName);
  }
}
    