const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

module.exports = async (req, res) => {
  const { to } = req.query;

  if (!to) {
    res.status(400).send('Missing phone number');
    return;
  }

  try {
    const call = await client.calls.create({
      url: 'http://demo.twilio.com/docs/voice.xml',
      to,
      from: FROM_NUMBER,
    });

    // חכה 15 שניות וכתוב לוג
    setTimeout(async () => {
      const updated = await client.calls(call.sid).fetch();
      const logPath = path.join(process.cwd(), 'logs.json');

      const log = {
        to,
        status: updated.status === 'completed' ? 'success' : 'failed',
        duration: parseInt(updated.duration || 0),
        time: new Date().toLocaleString('he-IL'),
      };

      let logs = [];
      if (fs.existsSync(logPath)) {
        const data = fs.readFileSync(logPath, 'utf8');
        logs = JSON.parse(data || '[]');
      }

      logs.push(log);
      fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
    }, 15000);

    res.status(200).send('ההודעה נשלחה בהצלחה ✅');
  } catch (err) {
    console.error('❌ שגיאה בשליחת השיחה:', err.message);
    res.status(500).send('שגיאה בשליחת שיחה ❌');
  }
};

