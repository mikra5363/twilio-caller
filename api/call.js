const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

module.exports = async (req, res) => {
  const { to } = req.query;

  if (!to) {
    res.status(400).send('Missing phone number');
    return;
  }

  try {
    await client.calls.create({
      url: 'http://demo.twilio.com/docs/voice.xml',
      to,
      from: FROM_NUMBER,
    });

    res.status(200).send('ההודעה נשלחה בהצלחה ✅');
  } catch (err) {
    console.error('שגיאה בשליחת שיחה:', err.message);
    res.status(500).send('שגיאה בשליחת שיחה ❌');
  }
};
