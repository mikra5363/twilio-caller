const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;
const client = require('twilio')(accountSid, authToken);
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  const to = req.query.to;
  const from = process.env.TWILIO_FROM;
  const twimlUrl = process.env.TWIML_URL;

  if (!to) {
    res.status(400).send('Missing "to" number');
    return;
  }

  try {
    const call = await client.calls.create({ to, from, url: twimlUrl });

    // רשום ליומן
    const logPath = path.join(__dirname, '..', 'call_log', 'log.json');
    const logs = fs.existsSync(logPath)
      ? JSON.parse(fs.readFileSync(logPath, 'utf8'))
      : [];

    logs.unshift({
      to,
      from,
      date: new Date().toISOString(),
      callSid: call.sid
    });

    fs.writeFileSync(logPath, JSON.stringify(logs.slice(0, 100), null, 2));

    res.status(200).send('השיחה יצאה בהצלחה!');
  } catch (error) {
    res.status(500).send('שגיאה: ' + error.message);
  }
};
