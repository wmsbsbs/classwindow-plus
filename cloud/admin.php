<?php
// 配置文件路径
define('DATA_DIR', __DIR__ . '/data');
define('SCHOOLS_FILE', DATA_DIR . '/schools.json');

// 读取学校数据
function getSchoolsData() {
    try {
        if (!file_exists(SCHOOLS_FILE)) {
            return [];
        }
        
        $data = file_get_contents(SCHOOLS_FILE);
        if ($data === false) {
            return [];
        }
        
        $schoolsData = json_decode($data, true);
        if ($schoolsData === null) {
            return [];
        }
        
        return $schoolsData;
    } catch (Exception $e) {
        return [];
    }
}

// 获取所有数据
$schoolsData = getSchoolsData();

// 统计数据
$totalSchools = count($schoolsData);
$totalClasses = 0;
$totalHomework = 0;
$totalTemplates = 0;
$allHomework = [];

foreach ($schoolsData as $schoolCode => $school) {
    if (isset($school['classes'])) {
        $totalClasses += count($school['classes']);
        foreach ($school['classes'] as $classCode => $class) {
            // 统计作业数
            if (isset($class['homeworkData'])) {
                $homeworkCount = count($class['homeworkData']);
                $totalHomework += $homeworkCount;
                
                // 收集所有作业
                foreach ($class['homeworkData'] as $homework) {
                    $homework['school'] = $schoolCode;
                    $homework['class'] = $classCode;
                    $allHomework[] = $homework;
                }
            }
            
            // 统计模板数
            if (isset($class['templates'])) {
                $totalTemplates += count($class['templates']);
            }
        }
    }
}

// 统计每个学校的作业数量
$schoolHomeworkCounts = [];
foreach ($schoolsData as $schoolCode => $school) {
    $schoolHomeworkCount = 0;
    if (isset($school['classes'])) {
        foreach ($school['classes'] as $classCode => $class) {
            if (isset($class['homeworkData'])) {
                $schoolHomeworkCount += count($class['homeworkData']);
            }
        }
    }
    if ($schoolHomeworkCount > 0) {
        $schoolHomeworkCounts[$schoolCode] = $schoolHomeworkCount;
    }
}

// 转换数据为JSON格式供JavaScript使用
$schoolsDataJson = json_encode($schoolsData);
$allHomeworkJson = json_encode($allHomework);
$schoolHomeworkCountsJson = json_encode($schoolHomeworkCounts);
$statsJson = json_encode([
    'totalSchools' => $totalSchools,
    'totalClasses' => $totalClasses,
    'totalHomework' => $totalHomework,
    'totalTemplates' => $totalTemplates
]);
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>网站管理系统</title>
        <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            color: #1e293b;
            line-height: 1.6;
            overflow-x: hidden;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            padding: 40px 0;
            margin-bottom: 32px;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
            position: relative;
            overflow: hidden;
        }
        
        header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
            100% { transform: translateY(0px) rotate(0deg); }
        }
        
        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            z-index: 1;
        }
        
        h1 {
            font-size: 32px;
            font-weight: 800;
            text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            letter-spacing: -0.5px;
        }
        
        .nav-tabs {
            display: flex;
            background: white;
            border-radius: 16px;
            padding: 6px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            margin-bottom: 32px;
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
        }
        
        .nav-tab {
            flex: 1;
            padding: 18px 24px;
            text-align: center;
            border: none;
            background: transparent;
            border-radius: 12px;
            cursor: pointer;
            font-size: 15px;
            font-weight: 600;
            color: #64748b;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        
        .nav-tab.active {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
            transform: translateY(-1px);
        }
        
        .nav-tab:hover:not(.active) {
            background: #f8fafc;
            color: #334155;
            transform: translateY(-2px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        
        .nav-tab:active:not(.active) {
            transform: translateY(0);
        }
        
        .tab-content {
            background: white;
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            min-height: 600px;
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
            position: relative;
            overflow: hidden;
        }
        
        .tab-content::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #3b82f6, #10b981, #f59e0b, #ef4444);
            border-radius: 16px 16px 0 0;
        }
        
        h2 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 28px;
            color: #0f172a;
            letter-spacing: -0.3px;
            position: relative;
            display: inline-block;
        }
        
        h2::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 0;
            width: 60px;
            height: 4px;
            background: linear-gradient(90deg, #3b82f6, #1d4ed8);
            border-radius: 2px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
            margin-bottom: 32px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid #e2e8f0;
            position: relative;
            overflow: hidden;
        }
        
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, #3b82f6, #10b981);
            border-radius: 16px 16px 0 0;
        }
        
        .stat-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 12px 32px rgba(59, 130, 246, 0.2);
            border-color: #3b82f6;
        }
        
        .stat-number {
            font-size: 42px;
            font-weight: 800;
            color: #1e40af;
            margin-bottom: 12px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .stat-label {
            font-size: 15px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            background: white;
        }
        
        .data-table th,
        .data-table td {
            padding: 18px 20px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
            transition: all 0.3s ease;
        }
        
        .data-table th {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        .data-table tr {
            transition: all 0.3s ease;
        }
        
        .data-table tr:hover {
            background: #f8fafc;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .data-table tr:nth-child(even) {
            background: #f8fafc;
        }
        
        .data-table tr:last-child td {
            border-bottom: none;
        }
        
        .log-container {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            max-height: 500px;
            overflow-y: auto;
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .log-entry {
            margin-bottom: 8px;
            padding: 8px;
            border-radius: 4px;
            transition: all 0.2s ease;
        }
        
        .log-entry:hover {
            background: rgba(102, 126, 234, 0.1);
        }
        
        .log-entry.info {
            border-left: 4px solid #3498db;
        }
        
        .log-entry.debug {
            border-left: 4px solid #95a5a6;
            color: #666;
        }
        
        .log-entry.warn {
            border-left: 4px solid #f39c12;
            background: rgba(243, 156, 18, 0.1);
        }
        
        .log-entry.error {
            border-left: 4px solid #e74c3c;
            background: rgba(231, 76, 60, 0.1);
        }
        
        .filter-section {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
            flex-wrap: wrap;
        }
        
        .filter-input {
            padding: 12px 16px;
            border: 1px solid #ced4da;
            border-radius: 8px;
            font-size: 14px;
            background: #f8f9fa;
            transition: all 0.3s ease;
        }
        
        .filter-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .btn {
            padding: 14px 24px;
            border: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            position: relative;
            overflow: hidden;
            font-family: inherit;
        }
        
        .btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: all 0.6s ease;
        }
        
        .btn:hover::before {
            left: 100%;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
        }
        
        .btn-secondary {
            background: linear-gradient(135deg, #64748b 0%, #334155 100%);
            color: white;
            box-shadow: 0 4px 16px rgba(100, 116, 139, 0.3);
        }
        
        .btn-secondary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(100, 116, 139, 0.4);
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
            color: white;
            box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
        }
        
        .btn-danger:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
        }
        
        .btn:active {
            transform: translateY(0);
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .pagination {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 24px;
        }
        
        .page-btn {
            padding: 8px 16px;
            border: 1px solid #ced4da;
            background: white;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .page-btn.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-color: #667eea;
        }
        
        .page-btn:hover:not(.active) {
            background: #f8f9fa;
        }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            z-index: 1000;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(8px);
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
        
        .modal-content {
            background: white;
            border-radius: 16px;
            padding: 32px;
            max-width: 640px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid #e2e8f0;
            position: relative;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes slideOutLeft {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(-30px);
            }
        }
        
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .modal-title {
            font-size: 22px;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.3px;
        }
        
        .modal-close {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #64748b;
            transition: all 0.3s ease;
            border-radius: 8px;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-close:hover {
            background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
            color: white;
            transform: rotate(90deg);
        }
        
        .form-group {
            margin-bottom: 24px;
        }
        
        .form-label {
            display: block;
            margin-bottom: 10px;
            font-weight: 600;
            color: #334155;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .form-control {
            width: 100%;
            padding: 14px 16px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            font-size: 14px;
            transition: all 0.3s ease;
            background: #f8fafc;
            font-family: inherit;
        }
        
        .form-control:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
            background: white;
        }
        
        .form-control:read-only {
            background: #f1f5f9;
            cursor: default;
            border-color: #cbd5e1;
        }
        
        .text-center {
            text-align: center;
        }
        
        .mt-20 {
            margin-top: 20px;
        }
        
        .mb-20 {
            margin-bottom: 20px;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .header-content {
                flex-direction: column;
                gap: 16px;
                text-align: center;
            }
            
            .nav-tabs {
                flex-direction: column;
                gap: 4px;
            }
            
            .nav-tab {
                padding: 12px 16px;
            }
            
            .tab-content {
                padding: 20px;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .filter-section {
                flex-direction: column;
            }
            
            .data-table {
                font-size: 12px;
            }
            
            .data-table th,
            .data-table td {
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <header>
        <div class="header-content">
            <h1>R3N欢迎回来</h1>
            <div>
                <button class="btn btn-secondary" onclick="location.reload()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    </svg>
                    刷新数据
                </button>
            </div>
        </div>
    </header>
    
    <div class="container">
        <div class="nav-tabs">
            <button class="nav-tab active" data-tab="dashboard">仪表盘</button>
            <button class="nav-tab" data-tab="schools">学校管理</button>
            <button class="nav-tab" data-tab="homework">作业管理</button>
            <button class="nav-tab" data-tab="templates">模板管理</button>
            <button class="nav-tab" data-tab="logs">系统日志</button>
        </div>
        
        <div class="tab-content">
            <!-- 仪表盘 -->
            <div id="dashboard" class="tab-pane">
                <h2>系统概览</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number" id="totalSchools">0</div>
                        <div class="stat-label">总学校数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="totalClasses">0</div>
                        <div class="stat-label">总班级数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="totalHomework">0</div>
                        <div class="stat-label">总作业数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="totalTemplates">0</div>
                        <div class="stat-label">总模板数</div>
                    </div>
                </div>
                
                <h2>最近活动</h2>
                <div class="log-container" id="recentActivity">
                    <div class="loading">加载中...</div>
                </div>
                
                <!-- 学校作业分布 -->
                <h2>学校作业分布</h2>
                <div class="chart-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px; margin-bottom: 32px;">
                    <!-- 学校作业数量分布 -->
                    <div class="chart-container" style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
                        <h3 style="text-align: center; margin-bottom: 20px; color: #334155;">学校作业数量分布</h3>
                        <div id="schoolHomeworkBarChart" style="height: 300px; display: flex; flex-direction: column; justify-content: flex-end; gap: 10px; padding-bottom: 20px;">
                            <!-- 动态生成的条形图 -->
                        </div>
                    </div>
                    
                    <!-- 学校作业占比分布 -->
                    <div class="chart-container" style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
                        <h3 style="text-align: center; margin-bottom: 20px; color: #334155;">学校作业占比分布</h3>
                        <div id="schoolHomeworkPieChart" style="height: 300px; display: flex; justify-content: center; align-items: center;">
                            <!-- 动态生成的饼状图 -->
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 学校管理 -->
            <div id="schools" class="tab-pane" style="display: none;">
                <h2>学校管理</h2>
                <div class="filter-section">
                    <input type="text" class="filter-input" placeholder="搜索学校代码" id="schoolFilter">
                    <button class="btn btn-primary" onclick="filterSchools()">搜索</button>
                    <button class="btn btn-secondary" onclick="resetSchoolFilter()">重置</button>
                </div>
                <table class="data-table" id="schoolsTable">
                    <thead>
                        <tr>
                            <th>学校代码</th>
                            <th>班级数</th>
                            <th>作业数</th>
                            <th>最后更新</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="5" class="text-center">加载中...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- 作业管理 -->
            <div id="homework" class="tab-pane" style="display: none;">
                <h2>作业管理</h2>
                <div class="filter-section">
                    <input type="text" class="filter-input" placeholder="搜索作业标题" id="homeworkFilter">
                    <select class="filter-input" id="subjectFilter">
                        <option value="">所有科目</option>
                        <option value="chinese">语文</option>
                        <option value="math">数学</option>
                        <option value="english">英语</option>
                        <option value="physics">物理</option>
                        <option value="chemistry">化学</option>
                        <option value="biology">生物</option>
                        <option value="history">历史</option>
                        <option value="geography">地理</option>
                        <option value="politics">道法</option>
                        <option value="other">其他</option>
                    </select>
                    <button class="btn btn-primary" onclick="filterHomework()">搜索</button>
                    <button class="btn btn-secondary" onclick="resetHomeworkFilter()">重置</button>
                </div>
                <table class="data-table" id="homeworkTable">
                    <thead>
                        <tr>
                            <th>作业ID</th>
                            <th>学校</th>
                            <th>班级</th>
                            <th>科目</th>
                            <th>截止日期</th>
                            <th>创建时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="7" class="text-center">加载中...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- 模板管理 -->
            <div id="templates" class="tab-pane" style="display: none;">
                <h2>模板管理</h2>
                <div class="filter-section">
                    <input type="text" class="filter-input" placeholder="搜索模板名称" id="templateFilter">
                    <button class="btn btn-primary" onclick="filterTemplates()">搜索</button>
                    <button class="btn btn-secondary" onclick="resetTemplateFilter()">重置</button>
                </div>
                <table class="data-table" id="templatesTable">
                    <thead>
                        <tr>
                            <th>模板ID</th>
                            <th>模板名称</th>
                            <th>组件数</th>
                            <th>创建时间</th>
                            <th>使用次数</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="6" class="text-center">加载中...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- 系统日志 -->
            <div id="logs" class="tab-pane" style="display: none;">
                <h2>系统日志</h2>
                <div class="filter-section">
                    <select class="filter-input" id="logLevelFilter">
                        <option value="">所有级别</option>
                        <option value="info">信息</option>
                        <option value="debug">调试</option>
                        <option value="warn">警告</option>
                        <option value="error">错误</option>
                    </select>
                    <input type="text" class="filter-input" placeholder="搜索日志内容" id="logContentFilter">
                    <button class="btn btn-primary" onclick="filterLogs()">搜索</button>
                    <button class="btn btn-secondary" onclick="resetLogFilter()">重置</button>
                </div>
                <div class="log-container" id="logsContainer">
                    <div class="loading">加载中...</div>
                </div>
                <div class="pagination" id="logsPagination"></div>
            </div>
        </div>
    </div>
    
    <!-- 详情模态框 -->
    <div class="modal" id="detailModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title" id="modalTitle">详情</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div id="modalBody">
                <!-- 动态内容 -->
            </div>
            <div class="mt-20 text-center">
                <button class="btn btn-secondary" onclick="closeModal()">关闭</button>
            </div>
        </div>
    </div>
    
    <script>
        // 全局变量
        let currentTab = 'dashboard';
        let logsPage = 1;
        const logsPerPage = 50;
        
        // 从PHP获取的数据
        const schoolsData = <?php echo $schoolsDataJson; ?>;
        const allHomework = <?php echo $allHomeworkJson; ?>;
        const schoolHomeworkCounts = <?php echo $schoolHomeworkCountsJson; ?>;
        const stats = <?php echo $statsJson; ?>
        
        // 页面加载完成后初始化
        document.addEventListener('DOMContentLoaded', function() {
            initTabs();
            loadDashboard();
        });
        
        // 初始化标签页
        function initTabs() {
            const tabs = document.querySelectorAll('.nav-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    const tabId = this.getAttribute('data-tab');
                    
                    // 如果点击的是当前激活的标签，不执行任何操作
                    if (currentTab === tabId) return;
                    
                    // 获取当前和目标标签内容
                    const currentPane = document.getElementById(currentTab);
                    const targetPane = document.getElementById(tabId);
                    
                    // 移除所有活动状态
                    tabs.forEach(t => t.classList.remove('active'));
                    // 添加当前活动状态
                    this.classList.add('active');
                    
                    // 隐藏当前内容并显示目标内容
                    if (currentPane) {
                        currentPane.style.animation = 'slideOutLeft 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards';
                        
                        // 等待动画完成后隐藏
                        setTimeout(() => {
                            currentPane.style.display = 'none';
                            currentPane.style.animation = '';
                        }, 400);
                    }
                    
                    // 显示目标内容并添加动画
                    if (targetPane) {
                        targetPane.style.display = 'block';
                        targetPane.style.animation = 'slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards';
                    }
                    
                    currentTab = tabId;
                    
                    // 加载对应内容
                    switch(tabId) {
                        case 'dashboard':
                            loadDashboard();
                            break;
                        case 'schools':
                            loadSchools();
                            break;
                        case 'homework':
                            loadHomework();
                            break;
                        case 'templates':
                            loadTemplates();
                            break;
                        case 'logs':
                            loadLogs();
                            break;
                    }
                });
            });
        }
        
        // 加载仪表盘数据
        function loadDashboard() {
            // 使用真实统计数据
            document.getElementById('totalSchools').textContent = stats.totalSchools;
            document.getElementById('totalClasses').textContent = stats.totalClasses;
            document.getElementById('totalHomework').textContent = stats.totalHomework;
            document.getElementById('totalTemplates').textContent = stats.totalTemplates;
            
            // 显示最近作业
            let activityHtml = '';
            
            if (allHomework.length > 0) {
                // 按时间戳排序，最新的在前
                const recentHomework = [...allHomework]
                    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                    .slice(0, 6);
                
                recentHomework.forEach(homework => {
                    const time = new Date((homework.timestamp || Date.now()) * 1000).toLocaleString('zh-CN');
                    activityHtml += `
                        <div class="log-entry info">
                            <strong>${time}</strong> - ${homework.school}/${homework.class} - ${getSubjectName(homework.subject)}作业
                        </div>
                    `;
                });
            } else {
                activityHtml = '<div class="text-center">暂无作业数据</div>';
            }
            
            document.getElementById('recentActivity').innerHTML = activityHtml;
            
            // 初始化学校作业分布
            initSchoolHomeworkDistribution();
        }
        
        // 初始化学校作业分布
        function initSchoolHomeworkDistribution() {
            renderSchoolHomeworkBarChart();
            renderSchoolHomeworkPieChart();
        }
        
        // 渲染学校作业数量条形图
        function renderSchoolHomeworkBarChart() {
            const container = document.getElementById('schoolHomeworkBarChart');
            const schools = Object.keys(schoolHomeworkCounts);
            const counts = Object.values(schoolHomeworkCounts);
            
            if (schools.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 40px; color: #64748b;">暂无学校作业数据</div>';
                return;
            }
            
            // 计算最大值
            const maxCount = Math.max(...counts, 1);
            const barHeight = 40;
            
            // 颜色数组
            const colors = [
                '#3b82f6',
                '#10b981',
                '#f59e0b',
                '#ef4444',
                '#8b5cf6',
                '#ec4899',
                '#06b6d4',
                '#84cc16',
                '#f97316',
                '#84cc16'
            ];
            
            let html = '';
            
            for (let i = 0; i < schools.length; i++) {
                const school = schools[i];
                const count = counts[i];
                const color = colors[i % colors.length];
                const barWidth = (count / maxCount) * 100;
                
                html += `
                    <div style="display: flex; align-items: center; gap: 10px; height: ${barHeight}px;">
                        <div style="width: 100px; font-size: 14px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${school}</div>
                        <div style="flex: 1; height: 20px; background: #f1f5f9; border-radius: 10px; overflow: hidden;">
                            <div style="height: 100%; width: ${barWidth}%; background: ${color}; border-radius: 10px; transition: width 0.5s ease;"></div>
                        </div>
                        <div style="width: 60px; text-align: right; font-size: 14px; font-weight: 600; color: #334155;">${count}</div>
                    </div>
                `;
            }
            
            container.innerHTML = html;
        }
        
        // 渲染学校作业占比饼状图
        function renderSchoolHomeworkPieChart() {
            const container = document.getElementById('schoolHomeworkPieChart');
            const schools = Object.keys(schoolHomeworkCounts);
            const counts = Object.values(schoolHomeworkCounts);
            
            if (schools.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 40px; color: #64748b;">暂无学校作业数据</div>';
                return;
            }
            
            // 计算总数
            const total = counts.reduce((sum, count) => sum + count, 0);
            
            // 颜色数组
            const colors = [
                '#3b82f6',
                '#10b981',
                '#f59e0b',
                '#ef4444',
                '#8b5cf6',
                '#ec4899',
                '#06b6d4',
                '#84cc16',
                '#f97316',
                '#84cc16'
            ];
            
            // 计算饼图数据
            const radius = 100;
            const centerX = radius + 20;
            const centerY = radius + 20;
            let currentAngle = -90; // 从顶部开始
            
            // 生成SVG路径
            let svgPaths = '';
            let legendItems = '';
            
            for (let i = 0; i < schools.length; i++) {
                const school = schools[i];
                const count = counts[i];
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                const color = colors[i % colors.length];
                const sliceAngle = (count / total) * 360;
                
                // 计算路径
                const endAngle = currentAngle + sliceAngle;
                const largeArcFlag = sliceAngle > 180 ? 1 : 0;
                
                const startX = centerX + radius * Math.cos((currentAngle * Math.PI) / 180);
                const startY = centerY + radius * Math.sin((currentAngle * Math.PI) / 180);
                const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
                const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
                
                const path = `
                    <path 
                        d="M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z" 
                        fill="${color}" 
                        stroke="white" 
                        stroke-width="2"
                        style="transition: opacity 0.3s ease;"
                        onmouseover="this.style.opacity='0.8'"
                        onmouseout="this.style.opacity='1'"
                    />
                `;
                
                svgPaths += path;
                
                // 生成图例
                legendItems += `
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 14px;">
                        <div style="width: 12px; height: 12px; background: ${color}; border-radius: 2px;"></div>
                        <div style="flex: 1; color: #64748b;">${school}</div>
                        <div style="color: #334155; font-weight: 600;">${percentage}%</div>
                    </div>
                `;
                
                currentAngle = endAngle;
            }
            
            // 生成SVG
            const svg = `
                <div style="display: flex; gap: 30px; align-items: center;">
                    <svg width="${radius * 2 + 40}" height="${radius * 2 + 40}" viewBox="0 0 ${radius * 2 + 40} ${radius * 2 + 40}">
                        ${svgPaths}
                        <!-- 中心圆 -->
                        <circle cx="${centerX}" cy="${centerY}" r="40" fill="white" stroke="#e2e8f0" stroke-width="2"/>
                        <text x="${centerX}" y="${centerY - 5}" text-anchor="middle" font-size="14" font-weight="600" fill="#334155">总计</text>
                        <text x="${centerX}" y="${centerY + 15}" text-anchor="middle" font-size="18" font-weight="700" fill="#3b82f6">${total}</text>
                    </svg>
                    <div style="min-width: 150px;">
                        ${legendItems}
                    </div>
                </div>
            `;
            
            container.innerHTML = svg;
        }
        
        // 加载学校数据
        function loadSchools() {
            let html = '';
            
            if (Object.keys(schoolsData).length > 0) {
                Object.entries(schoolsData).forEach(([schoolCode, school]) => {
                    let classCount = 0;
                    let homeworkCount = 0;
                    let lastUpdated = '未知';
                    
                    if (school.classes) {
                        classCount = Object.keys(school.classes).length;
                        
                        // 统计作业数和最后更新时间
                        let latestUpdate = 0;
                        Object.values(school.classes).forEach(cls => {
                            if (cls.homeworkData) {
                                homeworkCount += cls.homeworkData.length;
                            }
                            if (cls.lastUpdated && cls.lastUpdated > latestUpdate) {
                                latestUpdate = cls.lastUpdated;
                            }
                        });
                        
                        if (latestUpdate > 0) {
                            lastUpdated = new Date(latestUpdate * 1000).toLocaleString('zh-CN');
                        }
                    }
                    
                    html += `
                        <tr>
                            <td>${schoolCode}</td>
                            <td>${classCount}</td>
                            <td>${homeworkCount}</td>
                            <td>${lastUpdated}</td>
                            <td>
                                <button class="btn btn-primary" onclick="viewSchoolDetails('${schoolCode}')" style="padding: 6px 12px; font-size: 12px;">
                                    查看
                                </button>
                            </td>
                        </tr>
                    `;
                });
            } else {
                html = '<tr><td colspan="5" class="text-center">暂无学校数据</td></tr>';
            }
            
            document.querySelector('#schoolsTable tbody').innerHTML = html;
        }
        
        // 加载作业数据
        function loadHomework() {
            let html = '';
            
            if (allHomework.length > 0) {
                allHomework.forEach((homework, index) => {
                    const dueDate = homework.dueDate || '未设置';
                    const createdAt = new Date((homework.timestamp || Date.now()) * 1000).toLocaleString('zh-CN');
                    
                    html += `
                        <tr>
                            <td>homework-${index + 1}</td>
                            <td>${homework.school}</td>
                            <td>${homework.class}</td>
                            <td>${getSubjectName(homework.subject)}</td>
                            <td>${dueDate}</td>
                            <td>${createdAt}</td>
                            <td>
                                <button class="btn btn-primary" onclick="viewHomeworkDetails(${index})" style="padding: 6px 12px; font-size: 12px;">
                                    查看
                                </button>
                            </td>
                        </tr>
                    `;
                });
            } else {
                html = '<tr><td colspan="7" class="text-center">暂无作业数据</td></tr>';
            }
            
            document.querySelector('#homeworkTable tbody').innerHTML = html;
        }
        
        // 加载模板数据
        function loadTemplates() {
            let html = '';
            let templateIndex = 1;
            
            let allTemplates = [];
            
            // 收集所有模板
            Object.entries(schoolsData).forEach(([schoolCode, school]) => {
                if (school.classes) {
                    Object.entries(school.classes).forEach(([classCode, cls]) => {
                        if (cls.templates) {
                            cls.templates.forEach(template => {
                                template.school = schoolCode;
                                template.class = classCode;
                                allTemplates.push(template);
                            });
                        }
                    });
                }
            });
            
            if (allTemplates.length > 0) {
                allTemplates.forEach(template => {
                    const components = template.components ? template.components.length : 0;
                    const createdAt = template.createdAt ? new Date(template.createdAt).toLocaleString('zh-CN') : '未知';
                    
                    html += `
                        <tr>
                            <td>template-${templateIndex++}</td>
                            <td>${template.name || '未命名模板'}</td>
                            <td>${components}</td>
                            <td>${createdAt}</td>
                            <td>0</td>
                            <td>
                                <button class="btn btn-primary" onclick="viewTemplateDetails(${templateIndex - 2})" style="padding: 6px 12px; font-size: 12px;">
                                    查看
                                </button>
                            </td>
                        </tr>
                    `;
                });
            } else {
                html = '<tr><td colspan="6" class="text-center">暂无模板数据</td></tr>';
            }
            
            document.querySelector('#templatesTable tbody').innerHTML = html;
        }
        
        // 加载日志
        function loadLogs() {
            // 模拟日志数据
            const logs = [
                { level: 'info', time: '2026-02-02 16:45:32', message: '用户 123 登录成功' },
                { level: 'debug', time: '2026-02-02 16:44:18', message: '请求参数: {"action":"student","schoolCode":"123","classCode":"091"}' },
                { level: 'info', time: '2026-02-02 16:43:02', message: '添加了新作业：语文作业' },
                { level: 'warn', time: '2026-02-02 16:41:45', message: '学校 456 班级 789 密码验证失败' },
                { level: 'info', time: '2026-02-02 16:40:33', message: '创建了新模板：数学练习' },
                { level: 'error', time: '2026-02-02 16:39:12', message: '数据库连接失败' },
                { level: 'info', time: '2026-02-02 16:38:55', message: '用户 789 查询作业成功' },
                { level: 'debug', time: '2026-02-02 16:37:42', message: '返回结果: {"success":true,"message":"成功","homeworkData":[...]}' },
                { level: 'info', time: '2026-02-02 16:36:28', message: '更新了模板：英语填空模板' },
                { level: 'warn', time: '2026-02-02 16:35:15', message: '文件上传大小超过限制' }
            ];
            
            let html = '';
            logs.forEach(log => {
                html += `
                    <div class="log-entry ${log.level}">
                        <strong>${log.time}</strong> [${log.level.toUpperCase()}] - ${log.message}
                    </div>
                `;
            });
            
            document.getElementById('logsContainer').innerHTML = html;
            
            // 生成分页
            generateLogsPagination(1, 2); // 模拟2页
        }
        
        // 生成日志分页
        function generateLogsPagination(currentPage, totalPages) {
            let html = '';
            for(let i = 1; i <= totalPages; i++) {
                html += `
                    <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changeLogsPage(${i})">
                        ${i}
                    </button>
                `;
            }
            document.getElementById('logsPagination').innerHTML = html;
        }
        
        // 切换日志页码
        function changeLogsPage(page) {
            logsPage = page;
            loadLogs();
        }
        
        // 查看学校详情
        function viewSchoolDetails(schoolCode) {
            const modalTitle = document.getElementById('modalTitle');
            const modalBody = document.getElementById('modalBody');
            
            modalTitle.textContent = `学校详情 - ${schoolCode}`;
            
            const school = schoolsData[schoolCode];
            let classListHtml = '';
            let homeworkListHtml = '';
            
            if (school && school.classes) {
                // 班级列表
                Object.entries(school.classes).forEach(([classCode, cls]) => {
                    classListHtml += `
                        <li style="padding: 8px; border-bottom: 1px solid #e9ecef;">
                            ${classCode} - 密码: ${cls.password || '未知'}
                        </li>
                    `;
                });
                
                // 最近作业
                let schoolHomework = allHomework.filter(hw => hw.school === schoolCode);
                if (schoolHomework.length > 0) {
                    schoolHomework = schoolHomework
                        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                        .slice(0, 5);
                    
                    schoolHomework.forEach(homework => {
                        homeworkListHtml += `
                            <li style="padding: 8px; border-bottom: 1px solid #e9ecef;">
                                ${homework.class} - ${getSubjectName(homework.subject)}作业 - 截止: ${homework.dueDate || '未设置'}
                            </li>
                        `;
                    });
                } else {
                    homeworkListHtml = '<li style="padding: 8px; text-align: center;">暂无作业</li>';
                }
            } else {
                classListHtml = '<li style="padding: 8px; text-align: center;">暂无班级</li>';
                homeworkListHtml = '<li style="padding: 8px; text-align: center;">暂无作业</li>';
            }
            
            modalBody.innerHTML = `
                <div class="form-group">
                    <label class="form-label">学校代码</label>
                    <input type="text" class="form-control" value="${schoolCode}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">班级列表</label>
                    <ul style="list-style: none; padding: 0;">
                        ${classListHtml}
                    </ul>
                </div>
                <div class="form-group">
                    <label class="form-label">最近作业</label>
                    <ul style="list-style: none; padding: 0;">
                        ${homeworkListHtml}
                    </ul>
                </div>
            `;
            
            document.getElementById('detailModal').style.display = 'flex';
        }
        
        // 查看作业详情
        function viewHomeworkDetails(homeworkIndex) {
            const homework = allHomework[homeworkIndex];
            if (!homework) return;
            
            const modalTitle = document.getElementById('modalTitle');
            const modalBody = document.getElementById('modalBody');
            
            modalTitle.textContent = `作业详情 - ${homework.school}/${homework.class}`;
            
            const createdAt = new Date((homework.timestamp || Date.now()) * 1000).toLocaleString('zh-CN');
            
            modalBody.innerHTML = `
                <div class="form-group">
                    <label class="form-label">学校代码</label>
                    <input type="text" class="form-control" value="${homework.school}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">班级代码</label>
                    <input type="text" class="form-control" value="${homework.class}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">科目</label>
                    <input type="text" class="form-control" value="${getSubjectName(homework.subject)}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">截止日期</label>
                    <input type="text" class="form-control" value="${homework.dueDate || '未设置'}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">作业内容</label>
                    <textarea class="form-control" rows="4" readonly>${homework.content || '无内容'}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">创建时间</label>
                    <input type="text" class="form-control" value="${createdAt}" readonly>
                </div>
            `;
            
            document.getElementById('detailModal').style.display = 'flex';
        }
        
        // 查看模板详情
        function viewTemplateDetails(templateIndex) {
            // 收集所有模板
            let allTemplates = [];
            
            Object.entries(schoolsData).forEach(([schoolCode, school]) => {
                if (school.classes) {
                    Object.entries(school.classes).forEach(([classCode, cls]) => {
                        if (cls.templates) {
                            cls.templates.forEach(template => {
                                template.school = schoolCode;
                                template.class = classCode;
                                allTemplates.push(template);
                            });
                        }
                    });
                }
            });
            
            const template = allTemplates[templateIndex];
            if (!template) return;
            
            const modalTitle = document.getElementById('modalTitle');
            const modalBody = document.getElementById('modalBody');
            
            modalTitle.textContent = `模板详情 - ${template.name || '未命名模板'}`;
            
            let componentsHtml = '';
            if (template.components) {
                template.components.forEach(component => {
                    componentsHtml += `
                        <li style="padding: 8px; border-bottom: 1px solid #e9ecef;">
                            ${component.type || '未知类型'}: ${component.content || '无内容'}
                        </li>
                    `;
                });
            } else {
                componentsHtml = '<li style="padding: 8px; text-align: center;">暂无组件</li>';
            }
            
            modalBody.innerHTML = `
                <div class="form-group">
                    <label class="form-label">学校代码</label>
                    <input type="text" class="form-control" value="${template.school}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">班级代码</label>
                    <input type="text" class="form-control" value="${template.class}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">模板名称</label>
                    <input type="text" class="form-control" value="${template.name || '未命名模板'}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">组件列表</label>
                    <ul style="list-style: none; padding: 0;">
                        ${componentsHtml}
                    </ul>
                </div>
            `;
            
            document.getElementById('detailModal').style.display = 'flex';
        }
        
        // 关闭模态框
        function closeModal() {
            document.getElementById('detailModal').style.display = 'none';
        }
        
        // 过滤学校
        function filterSchools() {
            const filter = document.getElementById('schoolFilter').value.toLowerCase();
            const rows = document.querySelectorAll('#schoolsTable tbody tr');
            
            rows.forEach(row => {
                // 检查是否是“暂无学校数据”的提示行
                if (row.cells.length === 1 && row.cells[0].colSpan) {
                    row.style.display = '';
                    return;
                }
                
                const schoolCode = row.cells[0].textContent.toLowerCase();
                if(schoolCode.includes(filter)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }
        
        // 重置学校过滤
        function resetSchoolFilter() {
            document.getElementById('schoolFilter').value = '';
            filterSchools();
        }
        
        // 过滤作业
        function filterHomework() {
            const filter = document.getElementById('homeworkFilter').value.toLowerCase();
            const subjectFilter = document.getElementById('subjectFilter').value;
            const rows = document.querySelectorAll('#homeworkTable tbody tr');
            
            rows.forEach(row => {
                // 检查是否是“暂无作业数据”的提示行
                if (row.cells.length === 1 && row.cells[0].colSpan) {
                    row.style.display = '';
                    return;
                }
                
                const homeworkId = row.cells[0].textContent.toLowerCase();
                const subject = row.cells[3].textContent;
                
                const matchesFilter = homeworkId.includes(filter);
                let matchesSubject = true;
                
                if (subjectFilter) {
                    const subjectName = getSubjectName(subjectFilter);
                    matchesSubject = subject.includes(subjectName);
                }
                
                if(matchesFilter && matchesSubject) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }
        
        // 重置作业过滤
        function resetHomeworkFilter() {
            document.getElementById('homeworkFilter').value = '';
            document.getElementById('subjectFilter').value = '';
            filterHomework();
        }
        
        // 过滤模板
        function filterTemplates() {
            const filter = document.getElementById('templateFilter').value.toLowerCase();
            const rows = document.querySelectorAll('#templatesTable tbody tr');
            
            rows.forEach(row => {
                // 检查是否是“暂无模板数据”的提示行
                if (row.cells.length === 1 && row.cells[0].colSpan) {
                    row.style.display = '';
                    return;
                }
                
                const templateName = row.cells[1].textContent.toLowerCase();
                if(templateName.includes(filter)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }
        
        // 重置模板过滤
        function resetTemplateFilter() {
            document.getElementById('templateFilter').value = '';
            filterTemplates();
        }
        
        // 过滤日志
        function filterLogs() {
            const levelFilter = document.getElementById('logLevelFilter').value;
            const contentFilter = document.getElementById('logContentFilter').value.toLowerCase();
            const logEntries = document.querySelectorAll('.log-entry');
            
            logEntries.forEach(entry => {
                // 确定日志级别
                let level = 'info';
                if (entry.classList.contains('debug')) level = 'debug';
                else if (entry.classList.contains('warn')) level = 'warn';
                else if (entry.classList.contains('error')) level = 'error';
                
                const content = entry.textContent.toLowerCase();
                
                const matchesLevel = !levelFilter || level === levelFilter;
                const matchesContent = content.includes(contentFilter);
                
                if(matchesLevel && matchesContent) {
                    entry.style.display = '';
                } else {
                    entry.style.display = 'none';
                }
            });
        }
        
        // 重置日志过滤
        function resetLogFilter() {
            document.getElementById('logLevelFilter').value = '';
            document.getElementById('logContentFilter').value = '';
            loadLogs();
        }
        
        // 获取科目名称
        function getSubjectName(subjectValue) {
            const subjects = {
                'chinese': '语文',
                'math': '数学',
                'english': '英语',
                'physics': '物理',
                'chemistry': '化学',
                'biology': '生物',
                'history': '历史',
                'geography': '地理',
                'politics': '道法',
                'other': '其他'
            };
            return subjects[subjectValue] || subjectValue;
        }
    </script>
</body>
</html>