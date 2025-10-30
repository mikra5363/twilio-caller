<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// התמודדות עם preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// נתיב לקובץ JSON
$jsonFile = 'completed-calls.json';

// פונקציה לקריאת נתונים מהקובץ
function readCompletedCalls($file) {
    if (!file_exists($file)) {
        return [];
    }
    
    $content = file_get_contents($file);
    if ($content === false) {
        return [];
    }
    
    $data = json_decode($content, true);
    return $data ? $data : [];
}

// פונקציה לכתיבת נתונים לקובץ
function writeCompletedCalls($file, $data) {
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return file_put_contents($file, $json, LOCK_EX) !== false;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // קריאת רשימת השיחות שבוצעו
        $completedCalls = readCompletedCalls($jsonFile);
        
        // החזרת רשימת ה-IDs של השיחות שבוצעו
        $response = [
            'success' => true,
            'completed' => array_keys($completedCalls)
        ];
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // קבלת נתונים מהבקשה
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data || !isset($data['action']) || !isset($data['callId'])) {
            throw new Exception('נתונים חסרים בבקשה');
        }
        
        $action = $data['action'];
        $callId = $data['callId'];
        
        // קריאת הנתונים הקיימים
        $completedCalls = readCompletedCalls($jsonFile);
        
        if ($action === 'complete') {
            // הוספת השיחה לרשימת השיחות שבוצעו
            $completedCalls[$callId] = [
                'completed_at' => date('Y-m-d H:i:s'),
                'timestamp' => time()
            ];
            
            // שמירה לקובץ
            if (writeCompletedCalls($jsonFile, $completedCalls)) {
                $response = [
                    'success' => true,
                    'message' => 'השיחה סומנה כבוצעה בהצלחה',
                    'callId' => $callId
                ];
            } else {
                throw new Exception('שגיאה בשמירת הנתונים');
            }
            
        } elseif ($action === 'uncomplete') {
            // הסרת השיחה מרשימת השיחות שבוצעו
            if (isset($completedCalls[$callId])) {
                unset($completedCalls[$callId]);
                
                if (writeCompletedCalls($jsonFile, $completedCalls)) {
                    $response = [
                        'success' => true,
                        'message' => 'הסימון של השיחה בוטל בהצלחה',
                        'callId' => $callId
                    ];
                } else {
                    throw new Exception('שגיאה בשמירת הנתונים');
                }
            } else {
                $response = [
                    'success' => true,
                    'message' => 'השיחה לא הייתה מסומנת כבוצעה',
                    'callId' => $callId
                ];
            }
            
        } else {
            throw new Exception('פעולה לא תקינה');
        }
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        
    } else {
        throw new Exception('שיטת HTTP לא נתמכת');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    $response = [
        'success' => false,
        'error' => $e->getMessage()
    ];
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}
?>
