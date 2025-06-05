import twilio from 'twilio';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// הגדרות Google Sheets
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = 'twilio-logger@crack-unfolding-460908-h8.iam.gserviceaccount.com';

async function logToGoogleSheets(logData) {
  try {
    // בדיקה אם המשתנים מוגדרים
    if (!SHEET_ID || !process.env.GOOGLE_PRIVATE_KEY) {
      console.log('⚠️ משתני Google Sheets לא מוגדרים - מדלג על לוגינג');
      return;
    }

    // יצירת JWT authentication
    const serviceAccountAuth = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // התחברות לגיליון
    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    
    const sheet = doc.sheetsByIndex[0];
    
    // בדיקה אם יש כותרות, אם לא - ניצור אותן
    const headers = sheet.headerValues;
    if (!headers || headers.length === 0) {
      await sheet.setHeaderRow([
        'תאריך ושעה',
        'מספר טלפון', 
        'Call SID',
        'סטטוס',
        'IP כתובת',
        'User Agent',
        'זמן תגובה',
        'הערות'
      ]);
    }
    
    // הוספת השורה החדשה
    await sheet.addRow({
      'תאריך ושעה': logData.time,
      'מספר טלפון': logData.to,
      'Call SID': logData.callSid || 'N/A',
      'סטטוס': logData.status,
      'IP כתובת': logData.userIP,
      'User Agent': logData.userAgent,
      'זמן תגובה': logData.responseTime,
      'הערות': logData.notes || ''
    });

    console.log('✅ נתונים נשמרו בגוגל שיטס');
  } catch (error) {
    console.error('❌ שגיאה בשמירה לגוגל שיטס:', error.message);
    // לא נכשיל את השיחה בגלל בעיה בלוגינג
  }
}

export default async function handler(req, res) {
  const startTime = Date.now();
  const { to } = req.query;
  
  // איסוף נתוני הבקשה
  const requestData = {
    time: new Date().toLocaleString('he-IL'),
    to: to || 'לא צוין',
    userIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown',
    userAgent: req.headers['user-agent'] || 'Unknown'
  };

  if (!to) {
    const errorLog = {
      ...requestData,
      status: 'שגיאה - מספר יעד חסר',
      responseTime: `${Date.now() - startTime}ms`,
      notes: 'הבקשה לא כללה מספר טלפון'
    };
    
    // לוג של בקשה שגויה
    await logToGoogleSheets(errorLog);
    
    return res.status(400).json({ error: 'מספר יעד חסר' });
  }

  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  
  try {
    const call = await client.calls.create({
      to,
      from: process.env.TWILIO_FROM,
      url: process.env.TWIML_URL
    });

    const successLog = {
      ...requestData,
      callSid: call.sid,
      status: 'השיחה בוצעה בהצלחה',
      responseTime: `${Date.now() - startTime}ms`,
      notes: `Call SID: ${call.sid}`
    };

    // לוג של שיחה מוצלחת
    await logToGoogleSheets(successLog);

    // הצלחה
    res.status(200).json({ 
      message: 'השיחה בוצעה בהצלחה',
      callSid: call.sid 
    });
    
  } catch (error) {
    console.error('שגיאה בהתקשרות:', error.message);
    
    const errorLog = {
      ...requestData,
      status: `שגיאה בביצוע השיחה`,
      responseTime: `${Date.now() - startTime}ms`,
      notes: `Twilio Error: ${error.message}`
    };
    
    // לוג של שיחה שנכשלה
    await logToGoogleSheets(errorLog);
    
    res.status(500).json({ 
      error: 'קרתה שגיאה בביצוע השיחה',
      details: error.message 
    });
  }
}
