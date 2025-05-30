
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;
const client = require('twilio')(accountSid, authToken);

module.exports = async (req, res) => {
  const to = req.query.to;
  const from = process.env.TWILIO_FROM;
  const twimlUrl = process.env.TWIML_URL;

  if (!to) {
    res.status(400).send('Missing "to" number');
    return;
  }

  try {
    const call = await client.calls.create({
      to,
      from,
      url: twimlUrl
    });
    res.status(200).send('שיחה נשלחה בהצלחה');
  } catch (error) {
    res.status(500).send('שגיאה: ' + error.message);
  }
};
