// api/logs.js - Enhanced version
import twilio from 'twilio';

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;
const client = twilio(accountSid, authToken);

export default async function handler(req, res) {
  // תמיכה רק ב-GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // קביעת טווח תאריכים לפי הפרמטר
    const { period = 'week', limit = 50 } = req.query;
    let dateAfter;
    
    switch (period) {
      case 'today':
        dateAfter = new Date();
        dateAfter.setHours(0, 0, 0, 0);
        break;
      case 'week':
        dateAfter = new Date();
        dateAfter.setDate(dateAfter.getDate() - 7);
        break;
      case 'month':
        dateAfter = new Date();
        dateAfter.setMonth(dateAfter.getMonth() - 1);
        break;
      default:
        // שבוע אחרון כברירת מחדל
        dateAfter = new Date();
        dateAfter.setDate(dateAfter.getDate() - 7);
    }

    // שליפת השיחות מ-Twilio עם טווח תאריכים
    const calls = await client.calls.list({ 
      startTimeAfter: dateAfter,
      limit: parseInt(limit)
    });

    // עיבוד הנתונים לפורמט מפורט יותר
    const logs = calls.map(call => ({
      // נתונים בסיסיים (תואם לפורמט הקיים)
      to: call.to,
      status: call.status === 'completed' ? 'success' : 
              call.status === 'busy' ? 'busy' :
              call.status === 'no-answer' ? 'no-answer' : 'failed',
      duration: parseInt(call.duration) || 0,
      time: new Date(call.startTime || call.dateCreated).toLocaleString('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      
      // נתונים מפורטים נוספים
      sid: call.sid,
      from: call.from,
      direction: call.direction,
      price: call.price ? `${Math.abs(parseFloat(call.price))} ${call.priceUnit}` : 'חינם',
      rawStatus: call.status,
      dateCreated: call.dateCreated,
      startTime: call.startTime,
      endTime: call.endTime,
      
      // תרגום סטטוס לעברית
      statusHe: call.status === 'completed' ? 'הושלמה בהצלחה' :
                call.status === 'busy' ? 'קו תפוס' :
                call.status === 'no-answer' ? 'לא נענה' :
                call.status === 'failed' ? 'נכשלה' :
                call.status === 'canceled' ? 'בוטלה' : call.status,
      
      // אם השיחה הושלמה
      answered: call.status === 'completed',
      
      // מידע על האזנה (אם יש duration זה אומר שהאזין)
      listened: parseInt(call.duration) > 0,
      listeningTime: parseInt(call.duration) > 0 ? `${call.duration} שניות` : 'לא האזין'
    }));

    // חישוב סטטיסטיקות מהירות
    const stats = {
      total: logs.length,
      completed: logs.filter(call => call.answered).length,
      listened: logs.filter(call => call.listened).length,
      totalDuration: logs.reduce((sum, call) => sum + call.duration, 0),
      avgDuration: 0,
      successRate: 0,
      listenRate: 0
    };

    // חישוב אחוזים
    if (stats.total > 0) {
      stats.successRate = Math.round((stats.completed / stats.total) * 100);
      stats.listenRate = Math.round((stats.listened / stats.total) * 100);
    }
    
    if (stats.completed > 0) {
      stats.avgDuration = Math.round(stats.totalDuration / stats.completed);
    }

    // החזרת התוצאה
    res.status(200).json({
      success: true,
      logs: logs,
      stats: stats,
      period: period,
      count: logs.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('שגיאה בשליפת לוגים מ-Twilio:', error);
    res.status(500).json({ 
      success: false,
      error: 'שגיאה בשליפת לוגים מ-Twilio',
      details: error.message 
    });
  }
}
