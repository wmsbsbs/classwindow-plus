<?php
/**
 * 作业云端同步后端API
 * 用于处理作业的上传、下载和验证功能
 * 重写版本：增强错误处理、数据验证和安全性
 */

// 配置日志文件
define('LOG_FILE', __DIR__ . '/logs/debug.log');

// 确保日志目录存在
if (!is_dir(__DIR__ . '/logs')) {
    mkdir(__DIR__ . '/logs', 0755, true);
}

// 日志记录函数
function logMessage($message, $level = 'INFO') {
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$level] $message\n";
    file_put_contents(LOG_FILE, $logEntry, FILE_APPEND);
}

// 处理 OPTIONS 预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    logMessage('收到 OPTIONS 预检请求', 'DEBUG');
    
    // 设置响应头，允许跨域请求
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Referer, User-Agent');
    header('Access-Control-Max-Age: 86400');
    header('Content-Type: application/json');
    
    $response = ['success' => true, 'message' => 'OPTIONS 请求成功'];
    logMessage('返回 OPTIONS 响应: ' . json_encode($response), 'DEBUG');
    
    echo json_encode($response);
    exit;
}

// 设置响应头，允许跨域请求
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Referer, User-Agent');
header('Content-Type: application/json');

// 配置文件路径 - 使用绝对路径
define('DATA_DIR', __DIR__ . '/data');
define('SCHOOLS_FILE', DATA_DIR . '/schools.json');

// 确保数据目录存在
if (!is_dir(DATA_DIR)) {
    if (mkdir(DATA_DIR, 0755, true)) {
        logMessage('创建数据目录成功: ' . DATA_DIR, 'INFO');
    } else {
        logMessage('创建数据目录失败: ' . DATA_DIR, 'ERROR');
        echo json_encode([
            'success' => false,
            'message' => '服务器配置错误: 无法创建数据目录'
        ]);
        exit;
    }
}

// 确保学校数据文件存在
if (!file_exists(SCHOOLS_FILE)) {
    if (file_put_contents(SCHOOLS_FILE, json_encode([]))) {
        logMessage('创建学校数据文件成功: ' . SCHOOLS_FILE, 'INFO');
    } else {
        logMessage('创建学校数据文件失败: ' . SCHOOLS_FILE, 'ERROR');
        echo json_encode([
            'success' => false,
            'message' => '服务器配置错误: 无法创建数据文件'
        ]);
        exit;
    }
}

// 读取学校数据
function getSchoolsData() {
    try {
        if (!file_exists(SCHOOLS_FILE)) {
            throw new Exception('学校数据文件不存在');
        }
        
        $data = file_get_contents(SCHOOLS_FILE);
        if ($data === false) {
            throw new Exception('读取学校数据文件失败');
        }
        
        $schoolsData = json_decode($data, true);
        if ($schoolsData === null) {
            throw new Exception('解析学校数据文件失败');
        }
        
        return $schoolsData;
    } catch (Exception $e) {
        logMessage('获取学校数据失败: ' . $e->getMessage(), 'ERROR');
        throw $e;
    }
}

// 保存学校数据
function saveSchoolsData($data) {
    try {
        // 验证数据格式
        if (!is_array($data)) {
            throw new Exception('无效的数据格式');
        }
        
        // 确保目录可写
        if (!is_writable(DATA_DIR)) {
            throw new Exception('数据目录不可写');
        }
        
        // 确保文件可写
        if (file_exists(SCHOOLS_FILE) && !is_writable(SCHOOLS_FILE)) {
            throw new Exception('数据文件不可写');
        }
        
        $result = file_put_contents(SCHOOLS_FILE, json_encode($data, JSON_PRETTY_PRINT));
        if ($result === false) {
            throw new Exception('保存数据失败，可能是文件权限问题或磁盘空间不足');
        }
        
        logMessage('保存学校数据成功，写入 ' . $result . ' 字节', 'INFO');
        return $result;
    } catch (Exception $e) {
        logMessage('保存学校数据失败: ' . $e->getMessage(), 'ERROR');
        throw $e;
    }
}

// 验证输入参数
function validateParams($data, $required) {
    foreach ($required as $param) {
        if (!isset($data[$param]) || empty($data[$param])) {
            return [
                'success' => false,
                'message' => '缺少必要参数: ' . $param
            ];
        }
    }
    return null;
}

// 处理用户注册
function handleRegister($data) {
    logMessage('开始处理注册请求', 'INFO');
    logMessage('注册请求数据: ' . json_encode($data), 'DEBUG');
    
    // 验证必要参数
    $validationError = validateParams($data, ['schoolCode', 'classCode', 'password']);
    if ($validationError) {
        logMessage('注册参数验证失败: ' . $validationError['message'], 'WARN');
        return $validationError;
    }
    
    $schoolCode = $data['schoolCode'];
    $classCode = $data['classCode'];
    $password = $data['password'];
    
    try {
        // 读取学校数据
        $schoolsData = getSchoolsData();
        
        // 检查学校是否存在
        if (!isset($schoolsData[$schoolCode])) {
            // 创建新学校
            $schoolsData[$schoolCode] = [
                'classes' => []
            ];
            logMessage('创建新学校: ' . $schoolCode, 'INFO');
        }
        
        // 检查班级是否存在
        if (isset($schoolsData[$schoolCode]['classes'][$classCode])) {
            logMessage('班级已存在: ' . $schoolCode . '/' . $classCode, 'WARN');
            return [
                'success' => false,
                'message' => '班级已存在，请使用不同的班级代码'
            ];
        }
        
        // 创建新班级
        $schoolsData[$schoolCode]['classes'][$classCode] = [
            'password' => $password,
            'homeworkData' => [],
            'lastUpdated' => time()
        ];
        
        // 保存数据
        saveSchoolsData($schoolsData);
        
        $response = [
            'success' => true,
            'message' => '注册成功',
            'schoolCode' => $schoolCode,
            'classCode' => $classCode
        ];
        
        logMessage('注册成功: ' . $schoolCode . '/' . $classCode, 'INFO');
        return $response;
    } catch (Exception $e) {
        logMessage('注册失败: ' . $e->getMessage(), 'ERROR');
        return [
            'success' => false,
            'message' => '注册失败: ' . $e->getMessage()
        ];
    }
}

// 处理作业上传
function handleUpload($data) {
    logMessage('开始处理作业上传请求', 'INFO');
    logMessage('上传请求数据: ' . json_encode($data), 'DEBUG');
    
    // 验证必要参数
    $validationError = validateParams($data, ['schoolCode', 'classCode', 'password', 'homeworkData']);
    if ($validationError) {
        logMessage('上传参数验证失败: ' . $validationError['message'], 'WARN');
        return $validationError;
    }
    
    $schoolCode = $data['schoolCode'];
    $classCode = $data['classCode'];
    $password = $data['password'];
    $homeworkData = $data['homeworkData'];
    
    try {
        // 验证作业数据格式
        if (!is_array($homeworkData)) {
            throw new Exception('作业数据格式无效');
        }
        
        // 读取学校数据
        $schoolsData = getSchoolsData();
        
        // 检查学校是否存在
        if (!isset($schoolsData[$schoolCode])) {
            logMessage('学校不存在: ' . $schoolCode, 'WARN');
            return [
                'success' => false,
                'message' => '学校不存在'
            ];
        }
        
        // 检查班级是否存在
        if (!isset($schoolsData[$schoolCode]['classes'][$classCode])) {
            logMessage('班级不存在: ' . $schoolCode . '/' . $classCode, 'WARN');
            return [
                'success' => false,
                'message' => '班级不存在'
            ];
        }
        
        // 验证密码
        if ($schoolsData[$schoolCode]['classes'][$classCode]['password'] !== $password) {
            logMessage('密码错误: ' . $schoolCode . '/' . $classCode, 'WARN');
            return [
                'success' => false,
                'message' => '密码错误'
            ];
        }
        
        // 更新作业数据
        $schoolsData[$schoolCode]['classes'][$classCode]['homeworkData'] = $homeworkData;
        $schoolsData[$schoolCode]['classes'][$classCode]['lastUpdated'] = time();
        
        // 保存数据
        saveSchoolsData($schoolsData);
        
        $response = [
            'success' => true,
            'message' => '作业上传成功',
            'homeworkCount' => count($homeworkData),
            'lastUpdated' => $schoolsData[$schoolCode]['classes'][$classCode]['lastUpdated']
        ];
        
        logMessage('作业上传成功: ' . $schoolCode . '/' . $classCode . ', 共 ' . count($homeworkData) . ' 个作业', 'INFO');
        return $response;
    } catch (Exception $e) {
        logMessage('上传失败: ' . $e->getMessage(), 'ERROR');
        return [
            'success' => false,
            'message' => '上传失败: ' . $e->getMessage()
        ];
    }
}

// 处理作业下载
function handleDownload($data) {
    logMessage('开始处理作业下载请求', 'INFO');
    logMessage('下载请求数据: ' . json_encode($data), 'DEBUG');
    
    // 验证必要参数
    $validationError = validateParams($data, ['schoolCode', 'classCode', 'password']);
    if ($validationError) {
        logMessage('下载参数验证失败: ' . $validationError['message'], 'WARN');
        return $validationError;
    }
    
    $schoolCode = $data['schoolCode'];
    $classCode = $data['classCode'];
    $password = $data['password'];
    
    try {
        // 读取学校数据
        $schoolsData = getSchoolsData();
        
        // 检查学校是否存在
        if (!isset($schoolsData[$schoolCode])) {
            logMessage('学校不存在: ' . $schoolCode, 'WARN');
            return [
                'success' => false,
                'message' => '学校不存在'
            ];
        }
        
        // 检查班级是否存在
        if (!isset($schoolsData[$schoolCode]['classes'][$classCode])) {
            logMessage('班级不存在: ' . $schoolCode . '/' . $classCode, 'WARN');
            return [
                'success' => false,
                'message' => '班级不存在'
            ];
        }
        
        // 验证密码
        if ($schoolsData[$schoolCode]['classes'][$classCode]['password'] !== $password) {
            logMessage('密码错误: ' . $schoolCode . '/' . $classCode, 'WARN');
            return [
                'success' => false,
                'message' => '密码错误'
            ];
        }
        
        // 获取作业数据
        $homeworkData = $schoolsData[$schoolCode]['classes'][$classCode]['homeworkData'] ?? [];
        $lastUpdated = $schoolsData[$schoolCode]['classes'][$classCode]['lastUpdated'] ?? time();
        
        $response = [
            'success' => true,
            'message' => '作业下载成功',
            'homeworkData' => $homeworkData,
            'homeworkCount' => count($homeworkData),
            'lastUpdated' => $lastUpdated
        ];
        
        logMessage('作业下载成功: ' . $schoolCode . '/' . $classCode . ', 共 ' . count($homeworkData) . ' 个作业', 'INFO');
        return $response;
    } catch (Exception $e) {
        logMessage('下载失败: ' . $e->getMessage(), 'ERROR');
        return [
            'success' => false,
            'message' => '下载失败: ' . $e->getMessage()
        ];
    }
}

// 处理学生访问
function handleStudentAccess($data) {
    logMessage('开始处理学生访问请求', 'INFO');
    logMessage('学生访问请求数据: ' . json_encode($data), 'DEBUG');
    
    // 验证必要参数
    $validationError = validateParams($data, ['schoolCode', 'classCode']);
    if ($validationError) {
        logMessage('学生访问参数验证失败: ' . $validationError['message'], 'WARN');
        return $validationError;
    }
    
    $schoolCode = $data['schoolCode'];
    $classCode = $data['classCode'];
    
    try {
        // 读取学校数据
        $schoolsData = getSchoolsData();
        
        // 检查学校是否存在
        if (!isset($schoolsData[$schoolCode])) {
            logMessage('学校不存在: ' . $schoolCode, 'WARN');
            return [
                'success' => false,
                'message' => '学校不存在'
            ];
        }
        
        // 检查班级是否存在
        if (!isset($schoolsData[$schoolCode]['classes'][$classCode])) {
            logMessage('班级不存在: ' . $schoolCode . '/' . $classCode, 'WARN');
            return [
                'success' => false,
                'message' => '班级不存在'
            ];
        }
        
        // 获取作业数据
        $homeworkData = $schoolsData[$schoolCode]['classes'][$classCode]['homeworkData'] ?? [];
        $lastUpdated = $schoolsData[$schoolCode]['classes'][$classCode]['lastUpdated'] ?? time();
        
        $response = [
            'success' => true,
            'message' => '访问成功',
            'homeworkData' => $homeworkData,
            'homeworkCount' => count($homeworkData),
            'lastUpdated' => $lastUpdated
        ];
        
        logMessage('学生访问成功: ' . $schoolCode . '/' . $classCode . ', 共 ' . count($homeworkData) . ' 个作业', 'INFO');
        return $response;
    } catch (Exception $e) {
        logMessage('访问失败: ' . $e->getMessage(), 'ERROR');
        return [
            'success' => false,
            'message' => '访问失败: ' . $e->getMessage()
        ];
    }
}

// 处理老师登录
function handleTeacherLogin($data) {
    logMessage('开始处理老师登录请求', 'INFO');
    logMessage('老师登录请求数据: ' . json_encode($data), 'DEBUG');
    
    // 验证必要参数
    $validationError = validateParams($data, ['schoolCode', 'classCode', 'password']);
    if ($validationError) {
        logMessage('老师登录参数验证失败: ' . $validationError['message'], 'WARN');
        return $validationError;
    }
    
    $schoolCode = $data['schoolCode'];
    $classCode = $data['classCode'];
    $password = $data['password'];
    
    try {
        // 读取学校数据
        $schoolsData = getSchoolsData();
        
        // 检查学校是否存在
        if (!isset($schoolsData[$schoolCode])) {
            logMessage('学校不存在: ' . $schoolCode, 'WARN');
            return [
                'success' => false,
                'message' => '学校不存在'
            ];
        }
        
        // 检查班级是否存在
        if (!isset($schoolsData[$schoolCode]['classes'][$classCode])) {
            logMessage('班级不存在: ' . $schoolCode . '/' . $classCode, 'WARN');
            return [
                'success' => false,
                'message' => '班级不存在'
            ];
        }
        
        // 验证密码
        if ($schoolsData[$schoolCode]['classes'][$classCode]['password'] !== $password) {
            logMessage('密码错误: ' . $schoolCode . '/' . $classCode, 'WARN');
            return [
                'success' => false,
                'message' => '密码错误'
            ];
        }
        
        // 获取作业数据
        $homeworkData = $schoolsData[$schoolCode]['classes'][$classCode]['homeworkData'] ?? [];
        $lastUpdated = $schoolsData[$schoolCode]['classes'][$classCode]['lastUpdated'] ?? time();
        
        $response = [
            'success' => true,
            'message' => '登录成功',
            'homeworkData' => $homeworkData,
            'homeworkCount' => count($homeworkData),
            'lastUpdated' => $lastUpdated
        ];
        
        logMessage('老师登录成功: ' . $schoolCode . '/' . $classCode, 'INFO');
        return $response;
    } catch (Exception $e) {
        logMessage('登录失败: ' . $e->getMessage(), 'ERROR');
        return [
            'success' => false,
            'message' => '登录失败: ' . $e->getMessage()
        ];
    }
}

// 处理添加作业
function handleAddHomework($data) {
    logMessage('开始处理添加作业请求', 'INFO');
    logMessage('添加作业请求数据: ' . json_encode($data), 'DEBUG');
    
    // 验证必要参数
    $validationError = validateParams($data, ['schoolCode', 'classCode', 'subject', 'content']);
    if ($validationError) {
        logMessage('添加作业参数验证失败: ' . $validationError['message'], 'WARN');
        return $validationError;
    }
    
    $schoolCode = $data['schoolCode'];
    $classCode = $data['classCode'];
    $subject = $data['subject'];
    $content = $data['content'];
    $dueDate = $data['dueDate'] ?? '';
    
    try {
        // 读取学校数据
        $schoolsData = getSchoolsData();
        
        // 检查学校是否存在
        if (!isset($schoolsData[$schoolCode])) {
            logMessage('学校不存在: ' . $schoolCode, 'WARN');
            return [
                'success' => false,
                'message' => '学校不存在'
            ];
        }
        
        // 检查班级是否存在
        if (!isset($schoolsData[$schoolCode]['classes'][$classCode])) {
            logMessage('班级不存在: ' . $schoolCode . '/' . $classCode, 'WARN');
            return [
                'success' => false,
                'message' => '班级不存在'
            ];
        }
        
        // 创建新作业
        $newHomework = [
            'subject' => $subject,
            'content' => $content,
            'dueDate' => $dueDate,
            'timestamp' => time()
        ];
        
        // 添加到作业列表
        if (!isset($schoolsData[$schoolCode]['classes'][$classCode]['homeworkData'])) {
            $schoolsData[$schoolCode]['classes'][$classCode]['homeworkData'] = [];
        }
        array_push($schoolsData[$schoolCode]['classes'][$classCode]['homeworkData'], $newHomework);
        $schoolsData[$schoolCode]['classes'][$classCode]['lastUpdated'] = time();
        
        // 保存数据
        saveSchoolsData($schoolsData);
        
        $response = [
            'success' => true,
            'message' => '作业添加成功',
            'homeworkData' => $schoolsData[$schoolCode]['classes'][$classCode]['homeworkData'],
            'lastUpdated' => $schoolsData[$schoolCode]['classes'][$classCode]['lastUpdated']
        ];
        
        logMessage('作业添加成功: ' . $schoolCode . '/' . $classCode, 'INFO');
        return $response;
    } catch (Exception $e) {
        logMessage('添加作业失败: ' . $e->getMessage(), 'ERROR');
        return [
            'success' => false,
            'message' => '添加作业失败: ' . $e->getMessage()
        ];
    }
}

// 处理删除作业
function handleDeleteHomework($data) {
    logMessage('开始处理删除作业请求', 'INFO');
    logMessage('删除作业请求数据: ' . json_encode($data), 'DEBUG');
    
    // 验证必要参数
    $validationError = validateParams($data, ['schoolCode', 'classCode', 'index']);
    if ($validationError) {
        logMessage('删除作业参数验证失败: ' . $validationError['message'], 'WARN');
        return $validationError;
    }
    
    $schoolCode = $data['schoolCode'];
    $classCode = $data['classCode'];
    $index = (int)$data['index'];
    
    try {
        // 读取学校数据
        $schoolsData = getSchoolsData();
        
        // 检查学校是否存在
        if (!isset($schoolsData[$schoolCode])) {
            logMessage('学校不存在: ' . $schoolCode, 'WARN');
            return [
                'success' => false,
                'message' => '学校不存在'
            ];
        }
        
        // 检查班级是否存在
        if (!isset($schoolsData[$schoolCode]['classes'][$classCode])) {
            logMessage('班级不存在: ' . $schoolCode . '/' . $classCode, 'WARN');
            return [
                'success' => false,
                'message' => '班级不存在'
            ];
        }
        
        // 检查作业数据是否存在
        if (!isset($schoolsData[$schoolCode]['classes'][$classCode]['homeworkData'])) {
            logMessage('作业数据不存在: ' . $schoolCode . '/' . $classCode, 'WARN');
            return [
                'success' => false,
                'message' => '作业数据不存在'
            ];
        }
        
        // 检查索引是否有效
        $homeworkData = $schoolsData[$schoolCode]['classes'][$classCode]['homeworkData'];
        if ($index < 0 || $index >= count($homeworkData)) {
            logMessage('无效的作业索引: ' . $index, 'WARN');
            return [
                'success' => false,
                'message' => '无效的作业索引'
            ];
        }
        
        // 删除作业
        array_splice($homeworkData, $index, 1);
        $schoolsData[$schoolCode]['classes'][$classCode]['homeworkData'] = $homeworkData;
        $schoolsData[$schoolCode]['classes'][$classCode]['lastUpdated'] = time();
        
        // 保存数据
        saveSchoolsData($schoolsData);
        
        $response = [
            'success' => true,
            'message' => '作业删除成功',
            'homeworkData' => $homeworkData,
            'lastUpdated' => $schoolsData[$schoolCode]['classes'][$classCode]['lastUpdated']
        ];
        
        logMessage('作业删除成功: ' . $schoolCode . '/' . $classCode . ', 索引: ' . $index, 'INFO');
        return $response;
    } catch (Exception $e) {
        logMessage('删除作业失败: ' . $e->getMessage(), 'ERROR');
        return [
            'success' => false,
            'message' => '删除作业失败: ' . $e->getMessage()
        ];
    }
}

// 处理模板同步
function handleTemplateSync($data) {
    logMessage('开始处理模板同步请求', 'INFO');
    logMessage('模板同步请求数据: ' . json_encode($data), 'DEBUG');
    
    // 验证必要参数
    $validationError = validateParams($data, ['schoolCode', 'classCode', 'password']);
    if ($validationError) {
        logMessage('模板同步参数验证失败: ' . $validationError['message'], 'WARN');
        return $validationError;
    }
    
    $schoolCode = $data['schoolCode'];
    $classCode = $data['classCode'];
    $password = $data['password'];
    $templates = $data['templates'] ?? [];
    $action = $data['syncAction'] ?? 'download'; // download or upload
    
    try {
        // 读取学校数据
        $schoolsData = getSchoolsData();
        
        // 检查学校是否存在
        if (!isset($schoolsData[$schoolCode])) {
            logMessage('学校不存在: ' . $schoolCode, 'WARN');
            return [
                'success' => false,
                'message' => '学校不存在'
            ];
        }
        
        // 检查班级是否存在
        if (!isset($schoolsData[$schoolCode]['classes'][$classCode])) {
            logMessage('班级不存在: ' . $schoolCode . '/' . $classCode, 'WARN');
            return [
                'success' => false,
                'message' => '班级不存在'
            ];
        }
        
        // 验证密码
        if ($schoolsData[$schoolCode]['classes'][$classCode]['password'] !== $password) {
            logMessage('密码错误: ' . $schoolCode . '/' . $classCode, 'WARN');
            return [
                'success' => false,
                'message' => '密码错误'
            ];
        }
        
        if ($action === 'upload') {
            // 上传模板
            $schoolsData[$schoolCode]['classes'][$classCode]['templates'] = $templates;
            $schoolsData[$schoolCode]['classes'][$classCode]['templatesLastUpdated'] = time();
            
            // 保存数据
            saveSchoolsData($schoolsData);
            
            $response = [
                'success' => true,
                'message' => '模板上传成功',
                'templateCount' => count($templates),
                'lastUpdated' => $schoolsData[$schoolCode]['classes'][$classCode]['templatesLastUpdated']
            ];
            
            logMessage('模板上传成功: ' . $schoolCode . '/' . $classCode . ', 共 ' . count($templates) . ' 个模板', 'INFO');
        } else {
            // 下载模板
            $storedTemplates = $schoolsData[$schoolCode]['classes'][$classCode]['templates'] ?? [];
            $lastUpdated = $schoolsData[$schoolCode]['classes'][$classCode]['templatesLastUpdated'] ?? time();
            
            $response = [
                'success' => true,
                'message' => '模板下载成功',
                'templates' => $storedTemplates,
                'templateCount' => count($storedTemplates),
                'lastUpdated' => $lastUpdated
            ];
            
            logMessage('模板下载成功: ' . $schoolCode . '/' . $classCode . ', 共 ' . count($storedTemplates) . ' 个模板', 'INFO');
        }
        
        return $response;
    } catch (Exception $e) {
        logMessage('模板同步失败: ' . $e->getMessage(), 'ERROR');
        return [
            'success' => false,
            'message' => '模板同步失败: ' . $e->getMessage()
        ];
    }
}

// 处理请求
function handleRequest() {
    try {
        logMessage('收到新的请求', 'INFO');
        logMessage('请求方法: ' . $_SERVER['REQUEST_METHOD'], 'DEBUG');
        logMessage('客户端IP: ' . ($_SERVER['REMOTE_ADDR'] ?? '未知'), 'DEBUG');
        
        // 获取请求数据
        $rawInput = file_get_contents('php://input');
        logMessage('原始请求数据: ' . $rawInput, 'DEBUG');
        
        // 验证请求数据
        if (empty($rawInput)) {
            logMessage('请求数据为空', 'WARN');
            return [
                'success' => false,
                'message' => '无效的请求数据: 请求体为空'
            ];
        }
        
        $requestData = json_decode($rawInput, true);
        
        if ($requestData === null) {
            logMessage('JSON解析失败', 'WARN');
            return [
                'success' => false,
                'message' => '无效的请求数据: JSON格式错误'
            ];
        }
        
        // 验证必要参数
        if (!isset($requestData['action'])) {
            logMessage('缺少action参数', 'WARN');
            return [
                'success' => false,
                'message' => '缺少action参数'
            ];
        }
        
        $action = $requestData['action'];
        logMessage('处理请求动作: ' . $action, 'INFO');
        
        switch ($action) {
            case 'register':
                return handleRegister($requestData);
            case 'upload':
                return handleUpload($requestData);
            case 'download':
                return handleDownload($requestData);
            case 'student':
                return handleStudentAccess($requestData);
            case 'teacherLogin':
                return handleTeacherLogin($requestData);
            case 'addHomework':
                return handleAddHomework($requestData);
            case 'deleteHomework':
                return handleDeleteHomework($requestData);
            case 'templateSync':
                return handleTemplateSync($requestData);
            default:
                logMessage('未知的action参数: ' . $action, 'WARN');
                return [
                    'success' => false,
                    'message' => '未知的action参数'
                ];
        }
    } catch (Exception $e) {
        logMessage('请求处理失败: ' . $e->getMessage(), 'ERROR');
        return [
            'success' => false,
            'message' => '请求处理失败: ' . $e->getMessage()
        ];
    }
}

// 执行请求处理
try {
    $result = handleRequest();
    logMessage('请求处理完成，返回结果: ' . json_encode($result), 'DEBUG');
    
    // 输出结果
    echo json_encode($result);
} catch (Exception $e) {
    // 捕获未处理的异常
    $errorResponse = [
        'success' => false,
        'message' => '服务器内部错误: ' . $e->getMessage()
    ];
    logMessage('未捕获的异常: ' . $e->getMessage(), 'ERROR');
    echo json_encode($errorResponse);
}
?>