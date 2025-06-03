import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  const to = req.query.to;

  if (!to) {
    return res.status(400).json({ error: 'Missing "to" parameter' });
  }

  try {
    const call = await client.calls.create({
      url: 'http://demo.twilio.com/docs/voice.xml',
      to,
      from: FROM_NUMBER,
    });

    console.log(`שיחה נשלחה ל-${to}, SID: ${call.sid}`);

    res.status(200).send('ההודעה נשלחה בהצלחה ✅');
  } catch (err) {
    console.error('שגיאה בשליחת שיחה:', err.message);
    res.status(500).send('שגיאה בשליחת שיחה ❌');
  }
}
