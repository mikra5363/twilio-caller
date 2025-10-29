const twilio = require('twilio');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(accountSid, authToken);

    const calls = await client.calls.list({ limit: 100 });
    const inboundCalls = calls
      .filter(call => call.direction === 'inbound')
      .map(call => ({
        from: call.from,
        to: call.to,
        startTime: call.startTime,
        duration: call.duration,
        status: call.status,
      }));

    res.status(200).json(inboundCalls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
