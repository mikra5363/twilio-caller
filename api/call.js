import twilio from 'twilio';
import fs from 'fs';
import path from 'path';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { to } = req.body;

  try {
    const call = await client.calls.create({
      url: 'http://demo.twilio.com/docs/voice.xml',
      to,
      from: FROM_NUMBER,
    });

    // חכה 15 שניות ואז שלוף את נתוני השיחה
    setTimeout(async () => {
      try {
        const updatedCall = await client.calls(call.sid).fetch();

        const log = {
          to,
          from: FROM_NUMBER,
          sid: updatedCall.sid,
          status: updatedCall.status,
          duration: updatedCall.duration || 0,
          startTime: updatedCall.startTime || null,
          endTime: updatedCall.endTime || null,
          timestamp: new Date().toISOString()
        };

        const logPath = path.join(process.cwd(), 'public', 'logs.json');
        let logs = [];

        if (fs.existsSync(logPath)) {
          const data = fs.readFileSync(logPath, 'utf8');
          logs = JSON.parse(data || '[]');
        }

        logs.push(log);
        fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), 'utf8');

        console.log('✅ לוג נשמר:', log);
      } catch (err) {
        console.error('❌ שגיאה בשליפת סטטוס השיחה:', err.message);
      }
    }, 15000);

    res.status(200).json({ message: 'השיחה יצאה לדרך', sid: call.sid });

  } catch (err) {
    console.error('❌ שגיאה בשליחת שיחה:', err.message);
    res.status(500).json({ error: 'שגיאה בשליחת שיחה', details: err.message });
  }
}
