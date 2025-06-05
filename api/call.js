import twilio from 'twilio';

export default async function handler(req, res) {
  const { to } = req.query;
  
  if (!to) {
    return res.status(400).json({ error: 'מספר יעד חסר' });
  }
  
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  
  try {
    const call = await client.calls.create({
      to,
      from: process.env.TWILIO_FROM,
      url: process.env.TWIML_URL
    });
    
    res.status(200).send('השיחה בוצעה בהצלחה');
  } catch (error) {
    console.error('שגיאה בהתקשרות:', error.message);
    res.status(500).send('קרתה שגיאה בביצוע השיחה');
  }
}
