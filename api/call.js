const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { to } = req.query;

  if (!to) {
    res.status(400).send('Missing "to" parameter');
    return;
  }

  try {
    const call = await client.calls.create({
      url: 'http://demo.twilio.com/docs/voice.xml',
      to,
      from: FROM_NUMBER,
    });

    console.log(`✅ שיחה נשלחה אל: ${to}, SID: ${call.sid}`);
    res.status(200).send('ההודעה נשלחה בהצלחה ✅');
  } catch (error) {
    console.error('❌ שגיאה בשליחת השיחה:', error.message);
    res.status(500).send('שגיאה בשליחת השיחה ❌');
  }
};
