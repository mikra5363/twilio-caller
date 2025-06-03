import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const logFile = path.join(process.cwd(), 'logs.json');

  try {
    const data = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '[]';
    const logs = JSON.parse(data);
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בקריאת יומן השיחות' });
  }
}
