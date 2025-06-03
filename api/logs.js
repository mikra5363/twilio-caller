// קובץ: api/logs.js

import twilio from 'twilio';

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;
const client = twilio(accountSid, authToken);

export default async function handler(req, res) {
  try {
    const calls = await client.calls.list({ limit: 20 });

    const logs = calls.map(call => ({
      to: call.to,
      status: call.status === 'completed' ? 'success' : 'failed',
      duration: parseInt(call.duration) || 0,
      time: new Date(call.startTime).toLocaleString('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
    }));

    res.status(200).json(logs);
  } catch (error) {
    console.error('שגיאה בשליפת לוגים מ-Twilio:', error);
    res.status(500).json({ error: 'שגיאה בשליפת לוגים מ-Twilio' });
  }
}
