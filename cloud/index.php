<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>学生作业查询</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 16px;
        }
        
        header {
            background-color: #3498db;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        h1 {
            font-size: 20px;
            margin-bottom: 10px;
        }
        
        .subtitle {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .login-form {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
        }
        
        .form-group {
            margin-bottom: 16px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            font-size: 14px;
        }
        
        input[type="text"] {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            background-color: #f9f9f9;
        }
        
        button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 14px;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s;
            width: 100%;
            margin-top: 8px;
        }
        
        button:hover {
            background-color: #2980b9;
        }
        
        .homework-list {
            background-color: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            display: none;
            margin: 24px 0;
        }
        
        /* 作业列表响应式设计 */
        @media (max-width: 767px) {
            .homework-list {
                padding: 16px;
                margin: 16px 0;
            }
        }
        
        /* 作业元信息样式 */
        .homework-meta {
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: 14px;
            color: #666;
        }
        
        /* 截止日期样式 */
        .due-date {
            font-weight: 500;
        }
        
        /* 过期样式 */
        .due-date.overdue {
            color: #e74c3c;
            font-weight: 600;
        }
        
        /* 作业内容样式 */
        .homework-content {
            margin-top: 12px;
            line-height: 1.6;
            color: #333;
        }
        
        .homework-item {
            border: 1px solid #e9ecef;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            transition: all 0.3s ease;
            background-color: #fff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .homework-item:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
            border-color: #3498db;
        }
        
        .homework-header {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
            gap: 12px;
        }
        
        /* 作业头部响应式设计 */
        @media (max-width: 767px) {
            .homework-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
            }
            
            .homework-meta {
                width: 100%;
            }
        }
        
        .subject-tag {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            color: white;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
        }
        
        .subject-tag:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .subject-tag.chinese {
            background-color: #E74C3C;
        }
        
        .subject-tag.math {
            background-color: #3498DB;
        }
        
        .subject-tag.english {
            background-color: #F39C12;
        }
        
        .subject-tag.physics {
            background-color: #2980B9;
        }
        
        .subject-tag.chemistry {
            background-color: #9B59B6;
        }
        
        .subject-tag.biology {
            background-color: #27AE60;
        }
        
        .subject-tag.history {
            background-color: #E67E22;
        }
        
        .subject-tag.geography {
            background-color: #27AE60;
        }
        
        .subject-tag.politics {
            background-color: #1ABC9C;
        }
        
        .subject-tag.other {
            background-color: #95A5A6;
        }
        
        .homework-meta {
            font-size: 13px;
            color: #666;
            margin-top: 4px;
            width: 100%;
        }
        
        .due-date {
            margin-left: 0;
            margin-top: 4px;
            display: block;
        }
        
        .due-date.overdue {
            color: #e74c3c;
            font-weight: bold;
        }
        
        .homework-content {
            margin-top: 12px;
            line-height: 1.5;
            font-size: 15px;
            color: #333;
        }
        
        .error-message {
            color: #e74c3c;
            margin-top: 10px;
            font-size: 14px;
        }
        
        .back-button {
            background-color: #95a5a6;
            margin-top: 20px;
            padding: 12px;
        }
        
        .back-button:hover {
            background-color: #7f8c8d;
        }
        
        .school-info {
            margin-bottom: 20px;
            padding: 16px;
            background-color: #f9f9f9;
            border-radius: 6px;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .school-info strong {
            color: #333;
        }
        
        /* 响应式设计优化 */
        @media (max-width: 768px) {
            .container {
                padding: 12px;
            }
            
            header {
                padding: 16px;
            }
            
            h1 {
                font-size: 18px;
            }
            
            .login-form, .homework-list {
                padding: 16px;
            }
            
            .homework-item {
                padding: 14px;
                margin-bottom: 14px;
            }
            
            .subject-tag {
                font-size: 13px;
                padding: 5px 10px;
            }
            
            .homework-content {
                font-size: 14px;
            }
            
            .school-info {
                font-size: 13px;
                padding: 14px;
            }
        }
        
        /* 小屏幕手机优化 */
        @media (max-width: 480px) {
            .container {
                padding: 8px;
            }
            
            header {
                padding: 12px;
            }
            
            h1 {
                font-size: 16px;
            }
            
            .login-form, .homework-list {
                padding: 12px;
            }
            
            .homework-item {
                padding: 12px;
                margin-bottom: 12px;
            }
            
            .subject-tag {
                font-size: 12px;
                padding: 4px 8px;
            }
            
            .homework-content {
                font-size: 13px;
                line-height: 1.4;
            }
            
            .school-info {
                font-size: 12px;
                padding: 12px;
            }
            
            button {
                padding: 12px;
                font-size: 14px;
            }
            
            input[type="text"] {
                padding: 10px;
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>学生作业查询系统</h1>
            <div class="subtitle">输入学校代码和班级代码查看作业</div>
        </header>
        
        <div class="login-form" id="loginForm">
            <h2>身份验证</h2>
            <div class="form-group">
                <label>身份</label>
                <div style="display: flex; gap: 10px;">
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="radio" name="identity" value="student" checked>
                        学生
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="radio" name="identity" value="teacher">
                        老师
                    </label>
                </div>
            </div>
            <div class="form-group">
                <label for="schoolCode">学校代码</label>
                <input type="text" id="schoolCode" placeholder="例如：school123">
            </div>
            <div class="form-group">
                <label for="classCode">班级代码</label>
                <input type="text" id="classCode" placeholder="例如：class01">
            </div>
            <div class="form-group" id="teacherPasswordGroup" style="display: none;">
                <label for="teacherPassword">老师密码</label>
                <input type="password" id="teacherPassword" placeholder="请输入老师密码">
            </div>
            <button id="submitBtn">查询作业</button>
            <div class="error-message" id="errorMessage"></div>
        </div>
        
        <div class="homework-form" id="homeworkForm" style="display: none; padding: 32px; background: linear-gradient(135deg, #f8f9fa, #ffffff); border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin: 24px 0;">
            <h2 style="margin-bottom: 32px; color: #2c3e50; font-size: 28px; font-weight: 700; text-align: center;">布置作业</h2>
            <div class="school-info" id="teacherSchoolInfo" style="margin-bottom: 32px; padding: 20px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e9ecef; box-shadow: 0 2px 8px rgba(0,0,0,0.05); font-size: 16px; color: #495057;"></div>
            
            <!-- 拖拽式作业编辑器 -->
            <div class="form-container" style="display: flex; gap: 24px; margin-top: 24px; min-height: 500px;">
                <!-- 模板库区域 -->
                <div class="template-library" style="width: 280px; background: #ffffff; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; overflow-y: auto; border: 1px solid #e9ecef; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 18px; color: #2c3e50; font-weight: 600; display: flex; align-items: center;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        模板库
                    </h3>
                    <div id="templateLibraryList" style="flex: 1;">
                        <!-- 模板项将在这里动态添加 -->
                    </div>
                </div>
                
                <!-- 作业编辑区域 -->
                <div class="homework-editor" id="homeworkEditor" style="flex: 1; background: white; border-radius: 12px; padding: 28px; overflow: hidden; position: relative; display: flex; flex-direction: column; min-width: 0; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <!-- 作业头部信息 -->
                    <div class="homework-header" style="background: white; border-radius: 12px; padding: 0; margin-bottom: 28px;">
                        <!-- 作业类型选择 -->
                        <div style="margin-bottom: 28px; padding: 24px; background-color: #f8f9fa; border-radius: 12px; border: 1px solid #e9ecef;">
                            <label style="display: block; margin-bottom: 16px; font-size: 18px; font-weight: 600; color: #2c3e50;">作业类型</label>
                            <div style="display: flex; gap: 32px; align-items: center;">
                                <label style="display: flex; align-items: center; gap: 10px; font-size: 16px; color: #495057; cursor: pointer; padding: 12px 20px; border-radius: 8px; transition: all 0.3s ease;">
                                    <input type="radio" name="homeworkType" value="normal" checked style="accent-color: #3498db; transform: scale(1.3);">
                                    <span>普通作业</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 10px; font-size: 16px; color: #495057; cursor: pointer; padding: 12px 20px; border-radius: 8px; transition: all 0.3s ease;">
                                    <input type="radio" name="homeworkType" value="template" style="accent-color: #3498db; transform: scale(1.3);">
                                    <span>模板作业</span>
                                </label>
                            </div>
                            <div id="templateTestNotice" style="margin-top: 16px; padding: 16px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 8px; font-size: 14px; color: #856404; display: none;">
                                <strong>提示：</strong>模板作业功能目前还在测试中，可能存在一些问题。
                            </div>
                        </div>
                        
                        <!-- 表单网格 -->
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin-bottom: 28px;">
                            <div style="display: flex; flex-direction: column;">
                                <label style="display: block; margin-bottom: 12px; font-size: 16px; font-weight: 600; color: #495057;">科目</label>
                                <select id="newSubject" style="width: 100%; padding: 14px 16px; border: 1px solid #ced4da; border-radius: 10px; font-size: 16px; background-color: #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.05); transition: all 0.3s ease;">
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
                            </div>
                            <div style="display: flex; flex-direction: column;">
                                <label style="display: block; margin-bottom: 12px; font-size: 16px; font-weight: 600; color: #495057;">截止日期</label>
                                <input type="date" id="newDueDate" style="width: 100%; padding: 14px 16px; border: 1px solid #ced4da; border-radius: 10px; font-size: 16px; background-color: #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.05); transition: all 0.3s ease;">
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 28px; display: flex; flex-direction: column;">
                            <label style="display: block; margin-bottom: 12px; font-size: 16px; font-weight: 600; color: #495057;">作业标题</label>
                            <input type="text" id="homeworkTitle" placeholder="请输入作业标题" style="width: 100%; padding: 14px 16px; border: 1px solid #ced4da; border-radius: 10px; font-size: 16px; background-color: #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.05); transition: all 0.3s ease;">
                        </div>
                        
                        <!-- 普通作业内容输入 -->
                        <div id="normalHomeworkGroup" style="margin-bottom: 28px; display: flex; flex-direction: column;">
                            <label style="display: block; margin-bottom: 12px; font-size: 16px; font-weight: 600; color: #495057;">作业内容</label>
                            <textarea id="newContent" rows="6" placeholder="请输入作业内容" style="width: 100%; padding: 16px; border: 1px solid #ced4da; border-radius: 10px; font-size: 16px; background-color: #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.05); transition: all 0.3s ease; resize: vertical; font-family: inherit;"></textarea>
                        </div>
                        
                        <!-- 模板作业区域 -->
                        <div id="templateHomeworkGroup" style="margin-bottom: 28px; padding: 24px; background-color: #f8f9fa; border-radius: 12px; border: 1px solid #e9ecef; display: none;">
                            <label style="display: block; margin-bottom: 16px; font-size: 18px; font-weight: 600; color: #2c3e50;">模板作业</label>
                            <p style="font-size: 16px; color: #6c757d; margin-bottom: 0;">从左侧模板库选择模板添加到作业内容区域</p>
                        </div>
                    </div>
                    
                    <!-- 作业内容区域 -->
                    <div class="homework-content-area" id="homeworkContentArea" style="flex: 1; border: 1px solid #e9ecef; border-radius: 12px; padding: 28px; overflow-y: auto; background-color: #f8f9fa; box-shadow: inset 0 2px 8px rgba(0,0,0,0.05);">
                        <div class="empty-state" style="text-align: center; color: #6c757d; padding: 80px 20px;">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 32px; opacity: 0.4;">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <p style="font-size: 18px; margin-bottom: 12px; font-weight: 500;">从左侧模板库中拖拽模板到此处</p>
                            <p style="font-size: 14px; color: #adb5bd;">或直接输入作业内容</p>
                        </div>
                        <div id="homeworkContent" style="min-height: 300px;"></div>
                    </div>
                    
                    <!-- 作业操作按钮 -->
                    <div class="homework-actions" style="display: flex; gap: 16px; margin-top: 28px; padding-top: 28px; border-top: 1px solid #e9ecef;">
                        <button id="addHomeworkBtn" style="flex: 1; padding: 16px 24px; background: linear-gradient(135deg, #27ae60, #219653); color: white; border: none; border-radius: 12px; cursor: pointer; font-family: inherit; font-size: 16px; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(39, 174, 96, 0.4); display: flex; align-items: center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 10px;">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            添加作业
                        </button>
                        <button id="manageTemplatesBtn" style="flex: 1; padding: 16px 24px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); color: #495057; border: 1px solid #dee2e6; border-radius: 12px; cursor: pointer; font-family: inherit; font-size: 16px; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 10px;">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            管理模板
                        </button>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 40px; display: flex; justify-content: center;">
                <button class="back-button" id="teacherBackBtn" style="padding: 14px 40px; background: linear-gradient(135deg, #6c757d, #5a6268); color: white; border: none; border-radius: 10px; cursor: pointer; font-family: inherit; font-size: 16px; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(108, 117, 125, 0.4); display: flex; align-items: center;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 10px;">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    返回
                </button>
            </div>
            <div class="error-message" id="teacherErrorMessage" style="margin-top: 32px; padding: 16px; border-radius: 8px; font-size: 16px;"></div>
            <div id="teacherHomeworkList" style="margin-top: 40px;"></div>
        </div>
        
        <!-- 响应式布局 -->
        <style>
            /* 桌面端布局 */
            @media (min-width: 1024px) {
                .form-container {
                    flex-direction: row !important;
                }
                .template-library {
                    width: 250px !important;
                }
            }
            
            /* 平板端布局 */
            @media (min-width: 768px) and (max-width: 1023px) {
                .form-container {
                    flex-direction: column !important;
                }
                .template-library {
                    width: 100% !important;
                    max-height: 200px !important;
                }
            }
            
            /* 手机端布局 */
            @media (max-width: 767px) {
                .form-container {
                    flex-direction: column !important;
                    gap: 15px !important;
                }
                .template-library {
                    width: 100% !important;
                    max-height: 180px !important;
                    padding: 10px !important;
                }
                .homework-editor {
                    padding: 15px !important;
                }
                .homework-header {
                    padding: 10px !important;
                }
                .homework-content-area {
                    padding: 15px !important;
                }
                .homework-actions {
                    flex-direction: column !important;
                }
            }
            
            /* 模板项样式 */
            .template-item {
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 10px;
                padding: 16px;
                margin-bottom: 12px;
                cursor: move;
                transition: all 0.3s ease;
                user-select: none;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            
            .template-item:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transform: translateY(-2px);
                border-color: #3498db;
            }
            
            .template-item.dragging {
                opacity: 0.6;
                transform: rotate(5deg) scale(0.98);
                box-shadow: 0 8px 20px rgba(0,0,0,0.2);
            }
            
            .template-item .template-name {
                font-weight: 600;
                margin-bottom: 8px;
                font-size: 16px;
                color: #2c3e50;
            }
            
            .template-item .template-desc {
                font-size: 14px;
                color: #6c757d;
                margin-bottom: 12px;
                line-height: 1.4;
            }
            
            .template-item .template-type {
                font-size: 12px;
                color: #adb5bd;
                text-align: right;
                margin-bottom: 12px;
                padding-top: 8px;
                border-top: 1px solid #f1f3f5;
            }
            
            .add-template-btn {
                width: 100%;
                padding: 10px 16px;
                background: linear-gradient(135deg, #3498db, #2980b9);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-family: inherit;
                font-size: 14px;
                font-weight: 500;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
            }
            
            .add-template-btn:hover {
                background: linear-gradient(135deg, #2980b9, #1f618d);
                box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
                transform: translateY(-1px);
            }
            
            .add-template-btn svg {
                margin-right: 6px;
            }
            
            /* 错误信息样式 */
            .error-message {
                background-color: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
                border-radius: 8px;
                padding: 16px;
                margin-top: 16px;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            
            /* 成功信息样式 */
            .success-message {
                background-color: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
                border-radius: 8px;
                padding: 16px;
                margin-top: 16px;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            
            /* 按钮点击效果 */
            button:active {
                transform: scale(0.98);
                transition: transform 0.1s ease;
            }
            
            /* 拖拽效果 */
            .homework-editor.drag-over {
                border-color: #3498db !important;
                background-color: #f0f8ff !important;
            }
            
            /* 作业条目样式 */
            .template-component {
                background: white;
                border: 2px solid #e0e0e0;
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 16px;
                position: relative;
                transition: all 0.2s;
                min-width: 300px;
                max-width: 500px;
                width: 100%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                background-image: radial-gradient(circle at 50% 0%, transparent 12px, white 12px, white 100%);
                background-size: 100% calc(100% + 10px);
                background-position: 0 -10px;
                background-repeat: no-repeat;
                z-index: 1;
            }
            
            .template-component:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transform: translateY(-1px);
            }
            
            .component-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .component-type {
                font-weight: bold;
                font-size: 14px;
                color: #333;
            }
            
            .action-btn {
                width: 24px;
                height: 24px;
                border: none;
                background: none;
                cursor: pointer;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #666;
                transition: all 0.2s;
            }
            
            .action-btn:hover {
                background-color: rgba(0,0,0,0.1);
                color: #333;
            }
            
            .entry-content {
                margin-top: 10px;
            }
            
            .template-components {
                margin-top: 8px;
                padding: 8px;
                background-color: rgba(0, 0, 0, 0.02);
                border-radius: 4px;
                font-size: 12px;
            }
            
            .components-title {
                font-weight: 500;
                margin-bottom: 4px;
                color: #333;
            }
            
            .components-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .component-item {
                padding: 4px 8px;
                background-color: rgba(0, 0, 0, 0.03);
                border-radius: 3px;
                color: #666;
                word-break: break-all;
            }
            
            .homework-entry {
                margin-bottom: 16px;
            }
            
            .homework-entry h4 {
                margin-bottom: 8px;
                color: #333;
            }
            
            .homework-entry .entry-content {
                padding: 8px;
                background-color: rgba(0, 0, 0, 0.02);
                border-radius: 4px;
            }
        </style>
        
        <div class="template-manager" id="templateManager" style="display: none;">
            <h2>模板管理</h2>
            <div class="school-info" id="templateSchoolInfo"></div>
            <button id="addTemplateBtn" style="margin-bottom: 20px;">添加模板</button>
            <div id="templateList"></div>
            <button class="back-button" id="templateBackBtn">返回</button>
            <div class="error-message" id="templateErrorMessage"></div>
        </div>
        
        <style>
            /* 模板管理界面响应式设计 */
            @media (max-width: 767px) {
                .template-manager {
                    padding: 12px;
                }
                
                .template-manager h2 {
                    font-size: 18px;
                    margin-bottom: 16px;
                }
                
                #addTemplateBtn {
                    width: 100%;
                    padding: 12px;
                    font-size: 14px;
                    margin-bottom: 16px;
                }
                
                #templateList {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                
                #templateList .homework-item {
                    width: 100%;
                    margin-bottom: 0;
                }
                
                #templateList .homework-item h3 {
                    font-size: 16px;
                    margin-bottom: 8px;
                }
                
                #templateList .homework-item p {
                    font-size: 14px;
                    margin-bottom: 8px;
                }
                
                #templateList .homework-item div {
                    flex-direction: column;
                    gap: 8px;
                }
                
                #templateList .homework-item button {
                    padding: 10px;
                    font-size: 14px;
                }
                
                #templateBackBtn {
                    width: 100%;
                    margin-top: 16px;
                    padding: 12px;
                }
            }
        </style>
        
        <div class="template-editor" id="templateEditor" style="display: none;">
            <h2>编辑模板</h2>
            <div class="designer-container" style="display: flex; flex-direction: column; gap: 20px; margin-top: 20px;">
                <!-- 组件库 -->
                <div class="component-library" style="background: #f5f5f5; border-radius: 8px; padding: 15px; display: flex; flex-direction: column; overflow-y: auto; border: 1px solid #e0e0e0;">
                    <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #333;">组件库</h3>
                    
                    <!-- 固定文本组件 -->
                    <div class="component-item" style="background: white; border: 1px solid #ddd; border-radius: 6px; padding: 16px; margin-bottom: 12px; transition: all 0.2s; user-select: none; display: flex; flex-direction: column;">
                        <div class="component-title" style="font-weight: bold; margin-bottom: 5px; font-size: 14px;">固定文本</div>
                        <div class="component-desc" style="font-size: 12px; color: #666; margin-bottom: 12px;">添加固定文本内容</div>
                        <button class="add-component-btn" data-component-type="fixedText" style="align-self: flex-start; padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 12px; display: flex; align-items: center; gap: 4px; transition: all 0.2s ease; min-width: 80px; min-height: 32px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            添加
                        </button>
                    </div>
                    
                    <!-- 数字选择组件 -->
                    <div class="component-item" style="background: white; border: 1px solid #ddd; border-radius: 6px; padding: 16px; margin-bottom: 12px; transition: all 0.2s; user-select: none; display: flex; flex-direction: column;">
                        <div class="component-title" style="font-weight: bold; margin-bottom: 5px; font-size: 14px;">数字选择</div>
                        <div class="component-desc" style="font-size: 12px; color: #666; margin-bottom: 12px;">添加可选择的数字范围</div>
                        <button class="add-component-btn" data-component-type="numberSelect" style="align-self: flex-start; padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 12px; display: flex; align-items: center; gap: 4px; transition: all 0.2s ease; min-width: 80px; min-height: 32px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            添加
                        </button>
                    </div>
                    
                    <!-- 文本下拉组件 -->
                    <div class="component-item" style="background: white; border: 1px solid #ddd; border-radius: 6px; padding: 16px; margin-bottom: 12px; transition: all 0.2s; user-select: none; display: flex; flex-direction: column;">
                        <div class="component-title" style="font-weight: bold; margin-bottom: 5px; font-size: 14px;">文本下拉选择</div>
                        <div class="component-desc" style="font-size: 12px; color: #666; margin-bottom: 12px;">添加可选择的文本选项</div>
                        <button class="add-component-btn" data-component-type="textDropdown" style="align-self: flex-start; padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 12px; display: flex; align-items: center; gap: 4px; transition: all 0.2s ease; min-width: 80px; min-height: 32px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            添加
                        </button>
                    </div>
                </div>
                
                <!-- 设计区域 -->
                <div class="design-area" style="flex: 1; background: white; border: 2px dashed #ddd; border-radius: 8px; padding: 20px; overflow-y: auto; position: relative;">
                    <div class="template-info" style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                        <div class="input-group" style="margin-bottom: 15px;">
                            <label for="templateName">模板名称</label>
                            <input type="text" id="templateName" placeholder="请输入模板名称" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9;">
                        </div>
                        <div class="input-group" style="margin-bottom: 15px;">
                            <label for="templateDescription">模板描述</label>
                            <textarea id="templateDescription" rows="3" placeholder="请输入模板描述" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9; resize: vertical;"></textarea>
                        </div>
                    </div>
                    
                    <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #333;">设计画布</h3>
                    <div class="template-components" id="templateComponents" style="min-height: 300px; display: flex; flex-direction: column; gap: 0; align-items: center; padding: 20px 0;">
                        <div class="empty-state" id="emptyState" style="text-align: center; color: #999; padding: 40px 20px;">
                            <p>从左侧组件库中添加组件到此处开始设计模板</p>
                        </div>
                    </div>
                    
                    <div class="designer-actions" style="display: flex; gap: 10px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                        <button id="saveTemplateBtn" style="flex: 1; padding: 16px 24px; background: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 16px; min-width: 120px; min-height: 48px; transition: all 0.2s ease;">保存模板</button>
                        <button id="cancelTemplateBtn" style="background-color: #95a5a6; flex: 1; padding: 16px 24px; color: #333; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 16px; min-width: 120px; min-height: 48px; transition: all 0.2s ease;">取消</button>
                    </div>
                </div>
                
                <!-- 属性编辑面板 -->
                <div class="property-panel" style="background: #f5f5f5; border-radius: 8px; padding: 15px; display: flex; flex-direction: column; overflow-y: auto; border: 1px solid #e0e0e0;">
                    <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #333;">属性编辑</h3>
                    <div id="propertyContent" style="flex: 1;">
                        <p style="color: #999; text-align: center; margin-top: 30px;">选择一个组件来编辑属性</p>
                    </div>
                </div>
            </div>
            
            <!-- 响应式布局 -->
            <style>
                /* 基础布局 - 默认竖向排列 */
                .designer-container {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 15px !important;
                }
                
                .component-library {
                    width: 100% !important;
                    max-height: 200px !important;
                }
                
                .property-panel {
                    width: 100% !important;
                    max-height: 300px !important;
                }
                
                /* 桌面端布局 */
                @media (min-width: 1024px) {
                    .designer-container {
                        flex-direction: row !important;
                    }
                    .component-library {
                        width: 250px !important;
                        max-height: none !important;
                    }
                    .property-panel {
                        width: 300px !important;
                        max-height: none !important;
                    }
                }
                
                /* 平板端布局 */
                @media (min-width: 768px) and (max-width: 1023px) {
                    .designer-container {
                        flex-direction: column !important;
                    }
                    .component-library {
                        max-height: 200px !important;
                    }
                    .property-panel {
                        max-height: 300px !important;
                    }
                }
                
                /* 手机端布局 */
                @media (max-width: 767px) {
                    .designer-container {
                        flex-direction: column !important;
                        gap: 15px !important;
                    }
                    .component-library {
                        max-height: 180px !important;
                        padding: 10px !important;
                    }
                    .design-area {
                        padding: 15px !important;
                    }
                    .property-panel {
                        max-height: 250px !important;
                        padding: 10px !important;
                    }
                    .component-item {
                        padding: 12px !important;
                        margin-bottom: 8px !important;
                    }
                    .designer-actions {
                        flex-direction: column !important;
                    }
                }
            </style>
            <div class="error-message" id="templateEditorErrorMessage" style="margin-top: 20px;"></div>
        </div>
        
        <!-- 组件添加对话框 -->
        <div id="addComponentDialog" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); z-index: 1000;">
            <div style="background-color: white; border-radius: 8px; padding: 20px; max-width: 500px; margin: 100px auto; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);">
                <h3>添加组件</h3>
                <div class="form-group">
                    <label>组件类型</label>
                    <select id="componentTypeSelect" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9;">
                        <option value="">请选择组件类型</option>
                        <option value="fixedText">固定文本</option>
                        <option value="numberSelect">数字选择</option>
                        <option value="textDropdown">文本下拉选择</option>
                    </select>
                </div>
                <div id="componentProperties" style="margin-top: 20px;">
                    <!-- 组件属性将根据选择的类型动态显示 -->
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button id="confirmAddComponentBtn" style="flex: 1; background-color: #3498db;">确认添加</button>
                    <button id="cancelAddComponentBtn" style="background-color: #95a5a6; flex: 1;">取消</button>
                </div>
            </div>
        </div>
        
        <!-- 组件编辑对话框 -->
        <div id="editComponentDialog" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); z-index: 1000;">
            <div style="background-color: white; border-radius: 8px; padding: 20px; max-width: 500px; margin: 100px auto; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);">
                <h3>编辑组件</h3>
                <div id="editComponentProperties" style="margin-top: 20px;">
                    <!-- 组件属性将动态显示 -->
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button id="confirmEditComponentBtn" style="flex: 1; background-color: #3498db;">确认修改</button>
                    <button id="cancelEditComponentBtn" style="background-color: #95a5a6; flex: 1;">取消</button>
                </div>
            </div>
        </div>
        
        <div class="homework-list" id="homeworkList">
            <div class="school-info" id="schoolInfo"></div>
            <div id="studentHomeworkContent"></div>
            <button class="back-button" id="backBtn">返回</button>
        </div>
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const loginForm = document.getElementById('loginForm');
            const homeworkList = document.getElementById('homeworkList');
            const homeworkForm = document.getElementById('homeworkForm');
            const templateManager = document.getElementById('templateManager');
            const templateEditor = document.getElementById('templateEditor');
            const submitBtn = document.getElementById('submitBtn');
            const backBtn = document.getElementById('backBtn');
            const teacherBackBtn = document.getElementById('teacherBackBtn');
            const addHomeworkBtn = document.getElementById('addHomeworkBtn');
            const manageTemplatesBtn = document.getElementById('manageTemplatesBtn');
            const templateBackBtn = document.getElementById('templateBackBtn');
            const addTemplateBtn = document.getElementById('addTemplateBtn');
            const saveTemplateBtn = document.getElementById('saveTemplateBtn');
            const cancelTemplateBtn = document.getElementById('cancelTemplateBtn');
            const errorMessage = document.getElementById('errorMessage');
            const teacherErrorMessage = document.getElementById('teacherErrorMessage');
            const templateErrorMessage = document.getElementById('templateErrorMessage');
            const templateEditorErrorMessage = document.getElementById('templateEditorErrorMessage');
            const schoolCodeInput = document.getElementById('schoolCode');
            const classCodeInput = document.getElementById('classCode');
            const teacherPasswordInput = document.getElementById('teacherPassword');
            const teacherPasswordGroup = document.getElementById('teacherPasswordGroup');
            const schoolInfo = document.getElementById('schoolInfo');
            const teacherSchoolInfo = document.getElementById('teacherSchoolInfo');
            const templateSchoolInfo = document.getElementById('templateSchoolInfo');
            const studentHomeworkContent = document.getElementById('studentHomeworkContent');
            const teacherHomeworkList = document.getElementById('teacherHomeworkList');
            const templateList = document.getElementById('templateList');
            const templateComponents = document.getElementById('templateComponents');
            const newSubjectSelect = document.getElementById('newSubject');
            const newContentTextarea = document.getElementById('newContent');
            const newDueDateInput = document.getElementById('newDueDate');
            const templateSelect = document.getElementById('templateSelect');
            const templateNameInput = document.getElementById('templateName');
            const templateDescriptionTextarea = document.getElementById('templateDescription');
            const identityRadios = document.querySelectorAll('input[name="identity"]');
            const homeworkTypeRadios = document.querySelectorAll('input[name="homeworkType"]');
            const normalHomeworkGroup = document.getElementById('normalHomeworkGroup');
            const templateHomeworkGroup = document.getElementById('templateHomeworkGroup');
            
            // 模板存储键名
            const TEMPLATE_STORAGE_KEY = 'homeworkTemplates';
            
            // 模板组件类型
            const COMPONENT_TYPES = {
                FIXED_TEXT: 'fixedText',
                NUMBER_SELECT: 'numberSelect',
                TEXT_DROPDOWN: 'textDropdown'
            };
            
            // 当前编辑的模板
            let currentTemplate = null;
            
            // 身份切换事件
            identityRadios.forEach(radio => {
                radio.addEventListener('change', function() {
                    if (this.value === 'teacher') {
                        teacherPasswordGroup.style.display = 'block';
                    } else {
                        teacherPasswordGroup.style.display = 'none';
                    }
                });
            });
            
            // 设置默认作业截止日期为第二天
            function setDefaultDueDate() {
                const newDueDateInput = document.getElementById('newDueDate');
                if (newDueDateInput) {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const formattedDate = tomorrow.toISOString().split('T')[0];
                    newDueDateInput.value = formattedDate;
                }
            }
            
            // 初始化作业类型状态
            function initHomeworkTypeState() {
                const templateLibrary = document.querySelector('.template-library');
                const homeworkContentArea = document.getElementById('homeworkContentArea');
                const initialType = document.querySelector('input[name="homeworkType"]:checked').value;
                
                if (initialType === 'normal') {
                    templateLibrary.style.display = 'none';
                    homeworkContentArea.style.display = 'none';
                }
            }
            
            // 调用初始化函数
            initHomeworkTypeState();
            setDefaultDueDate();
            
            // 作业类型切换事件
            homeworkTypeRadios.forEach(radio => {
                radio.addEventListener('change', function() {
                    const templateTestNotice = document.getElementById('templateTestNotice');
                    const templateLibrary = document.querySelector('.template-library');
                    const homeworkContentArea = document.getElementById('homeworkContentArea');
                    
                    if (this.value === 'template') {
                        // 模板作业
                        normalHomeworkGroup.style.display = 'none';
                        templateHomeworkGroup.style.display = 'block';
                        templateTestNotice.style.display = 'block';
                        templateLibrary.style.display = 'flex';
                        homeworkContentArea.style.display = 'block';
                        loadTemplates();
                    } else {
                        // 普通作业
                        normalHomeworkGroup.style.display = 'block';
                        templateHomeworkGroup.style.display = 'none';
                        templateTestNotice.style.display = 'none';
                        templateLibrary.style.display = 'none';
                        homeworkContentArea.style.display = 'none';
                    }
                });
            });
            
            // 管理模板按钮点击事件
            manageTemplatesBtn.addEventListener('click', function() {
                homeworkForm.style.display = 'none';
                templateManager.style.display = 'block';
                
                // 更新学校信息
                const schoolCode = schoolCodeInput.value.trim();
                const classCode = classCodeInput.value.trim();
                templateSchoolInfo.innerHTML = `
                    <strong>学校：</strong>${schoolCode}<br>
                    <strong>班级：</strong>${classCode}
                `;
                
                loadTemplates();
            });
            
            // 加载作业模板库
            function loadHomeworkTemplateLibrary() {
                let templates = getAllTemplates();
                
                // 检查是否需要添加默认模板
                if (templates.length === 0) {
                    // 添加默认的自定义文本模板
                    const defaultTemplate = createNewTemplate('自定义文本');
                    defaultTemplate.description = '用于添加自定义文本内容的模板';
                    defaultTemplate.components = [
                        createComponent(COMPONENT_TYPES.FIXED_TEXT, {
                            content: '自定义文本内容'
                        })
                    ];
                    saveTemplateToStorage(defaultTemplate);
                    templates = getAllTemplates();
                }
                
                const templateLibraryList = document.getElementById('templateLibraryList');
                
                if (templates.length === 0) {
                    templateLibraryList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">暂无模板</p>';
                    return;
                }
                
                let html = '';
                templates.forEach(template => {
                    html += `
                        <div class="template-item" draggable="true" data-id="${template.id}">
                            <div class="template-name">${template.name}</div>
                            <div class="template-desc">${template.description || '无描述'}</div>
                            <div class="template-type">组件数: ${template.components.length}</div>
                            <button class="add-template-btn" data-template-id="${template.id}" title="添加到作业">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                添加
                            </button>
                        </div>
                    `;
                });
                
                templateLibraryList.innerHTML = html;
                
                // 添加拖拽事件监听器
                document.querySelectorAll('.template-item').forEach(item => {
                    item.addEventListener('dragstart', function(e) {
                        e.dataTransfer.setData('text/plain', this.dataset.id);
                        this.classList.add('dragging');
                    });
                    
                    item.addEventListener('dragend', function() {
                        this.classList.remove('dragging');
                    });
                });
                
                // 添加添加按钮点击事件监听器
                document.querySelectorAll('.add-template-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const templateId = this.getAttribute('data-template-id');
                        addHomeworkEntry(templateId);
                    });
                });
            }
            
            // 作业条目管理
            let homeworkEntries = [];
            
            // 为作业内容区域添加拖拽目标事件
            const homeworkContentArea = document.getElementById('homeworkContentArea');
            if (homeworkContentArea) {
                homeworkContentArea.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    this.classList.add('drag-over');
                });
                
                homeworkContentArea.addEventListener('dragleave', function() {
                    this.classList.remove('drag-over');
                });
                
                homeworkContentArea.addEventListener('drop', function(e) {
                    e.preventDefault();
                    this.classList.remove('drag-over');
                    
                    const templateId = e.dataTransfer.getData('text/plain');
                    const template = getTemplateById(templateId);
                    
                    if (template) {
                        // 创建作业条目
                        addHomeworkEntry(templateId);
                    }
                });
            }
            
            // 添加作业条目
            function addHomeworkEntry(templateId) {
                const subject = document.getElementById('newSubject').value;
                const dueDate = document.getElementById('newDueDate').value;
                const homeworkTitle = document.getElementById('homeworkTitle').value;
                
                const template = getTemplateById(templateId);
                
                // 创建作业条目
                const entry = {
                    id: `entry-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    templateId: templateId,
                    template: template,
                    type: 'template',
                    subject: subject,
                    dueDate: dueDate,
                    title: homeworkTitle,
                    values: {}
                };
                
                // 添加到作业列表
                homeworkEntries.push(entry);
                
                // 渲染作业条目
                renderHomeworkEntry(entry);
                
                // 清空空状态提示
                const emptyState = document.querySelector('.empty-state');
                if (emptyState) {
                    emptyState.remove();
                }
            }
            
            // 渲染作业条目
            function renderHomeworkEntry(entry) {
                const homeworkContent = document.getElementById('homeworkContent');
                const entryElement = document.createElement('div');
                entryElement.className = 'template-component';
                entryElement.dataset.entryId = entry.id;
                
                let entryHTML = `
                    <div class="component-header">
                        <div class="component-type">
                            ${entry.template ? entry.template.name : '自定义作业'}
                        </div>
                    </div>
                    <button class="action-btn delete-btn" title="删除" onclick="deleteHomeworkEntry('${entry.id}')" style="position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; border: none; background: none; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <div class="entry-content">
                `;
                
                if (entry.template) {
                    // 渲染模板组件
                    entryHTML += `<div class="template-components">
                        <div class="components-title">组件:</div>
                        <div class="components-list">
                    `;
                    
                    entry.template.components.forEach((component, index) => {
                        switch (component.type) {
                            case COMPONENT_TYPES.FIXED_TEXT:
                                entryHTML += `<div class="component-item">固定文本: ${component.content.substring(0, 30)}${component.content.length > 30 ? '...' : ''}</div>`;
                                break;
                            case COMPONENT_TYPES.NUMBER_SELECT:
                                entryHTML += `<div class="component-item">数字选择: ${component.label} (${component.min}-${component.max})</div>`;
                                break;
                            case COMPONENT_TYPES.TEXT_DROPDOWN:
                                entryHTML += `<div class="component-item">文本下拉: ${component.label} (${component.options.length}个选项)</div>`;
                                break;
                            default:
                                entryHTML += `<div class="component-item">未知组件</div>`;
                                break;
                        }
                    });
                    
                    entryHTML += `
                        </div>
                    </div>
                    `;
                }
                
                entryHTML += `
                    </div>
                `;
                
                entryElement.innerHTML = entryHTML;
                homeworkContent.appendChild(entryElement);
            }
            
            // 删除作业条目
            function deleteHomeworkEntry(entryId) {
                // 从作业列表中移除
                homeworkEntries = homeworkEntries.filter(entry => entry.id !== entryId);
                
                // 从DOM中移除
                const entryElement = document.querySelector(`.template-component[data-entry-id="${entryId}"]`);
                if (entryElement) {
                    entryElement.remove();
                }
                
                // 如果作业列表为空，显示空状态提示
                const homeworkContent = document.getElementById('homeworkContent');
                if (homeworkEntries.length === 0 && homeworkContent.children.length === 0) {
                    const emptyState = document.createElement('div');
                    emptyState.className = 'empty-state';
                    emptyState.innerHTML = '<p>从左侧模板库中拖拽模板到此处，或直接输入作业内容</p>';
                    document.getElementById('homeworkContentArea').appendChild(emptyState);
                }
            }
            
            // 渲染模板为作业内容（用于提交作业时）
            function renderHomeworkForSubmission() {
                let content = '';
                
                // 添加作业标题
                const homeworkTitle = document.getElementById('homeworkTitle').value;
                if (homeworkTitle) {
                    content += `<h3>${homeworkTitle}</h3>`;
                }
                
                // 添加每个作业条目的内容
                homeworkEntries.forEach(entry => {
                    if (entry.template) {
                        content += `<div class="homework-entry">
                            <h4>${entry.template.name}</h4>
                            <div class="entry-content">${renderTemplateToContent(entry.template, entry.values)}</div>
                        </div>`;
                    }
                });
                
                return content;
            }
            
            // 模板管理返回按钮点击事件
            templateBackBtn.addEventListener('click', function() {
                templateManager.style.display = 'none';
                homeworkForm.style.display = 'block';
            });
            
            // 添加模板按钮点击事件
            addTemplateBtn.addEventListener('click', function() {
                openTemplateEditor();
            });
            
            // 保存模板按钮点击事件
            saveTemplateBtn.addEventListener('click', function() {
                saveTemplate();
            });
            
            // 取消模板编辑按钮点击事件
            cancelTemplateBtn.addEventListener('click', function() {
                templateEditor.style.display = 'none';
                templateManager.style.display = 'block';
            });
            

            
            // 组件类型选择事件
            document.getElementById('componentTypeSelect').addEventListener('change', function() {
                updateComponentProperties();
            });
            
            // 确认添加组件按钮点击事件
            document.getElementById('confirmAddComponentBtn').addEventListener('click', function() {
                confirmAddComponent();
            });
            
            // 取消添加组件按钮点击事件
            document.getElementById('cancelAddComponentBtn').addEventListener('click', function() {
                closeAddComponentDialog();
            });
            
            // 确认编辑组件按钮点击事件
            document.getElementById('confirmEditComponentBtn').addEventListener('click', function() {
                confirmEditComponent();
            });
            
            // 取消编辑组件按钮点击事件
            document.getElementById('cancelEditComponentBtn').addEventListener('click', function() {
                closeEditComponentDialog();
            });
            
            // 提交按钮点击事件
            submitBtn.addEventListener('click', function() {
                const schoolCode = schoolCodeInput.value.trim();
                const classCode = classCodeInput.value.trim();
                const selectedIdentity = document.querySelector('input[name="identity"]:checked').value;
                
                if (!schoolCode || !classCode) {
                    errorMessage.textContent = '请输入完整的学校代码和班级代码';
                    return;
                }
                
                if (selectedIdentity === 'teacher') {
                    const teacherPassword = teacherPasswordInput.value.trim();
                    if (!teacherPassword) {
                        errorMessage.textContent = '请输入老师密码';
                        return;
                    }
                    
                    // 发送老师登录请求
                    fetch('homework-sync.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            action: 'teacherLogin',
                            schoolCode: schoolCode,
                            classCode: classCode,
                            password: teacherPassword
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // 显示老师作业管理界面
                            loginForm.style.display = 'none';
                            homeworkForm.style.display = 'block';
                            
                            // 更新学校信息
                            teacherSchoolInfo.innerHTML = `
                                <strong>学校：</strong>${schoolCode}<br>
                                <strong>班级：</strong>${classCode}<br>
                                <strong>最后更新：</strong>${new Date(data.lastUpdated * 1000).toLocaleString()}
                            `;
                            
                            // 加载作业模板库
                            loadHomeworkTemplateLibrary();
                            
                            // 渲染作业列表
                            renderTeacherHomeworkList(data.homeworkData);
                        } else {
                            errorMessage.textContent = data.message || '登录失败';
                        }
                    })
                    .catch(error => {
                        console.error('登录失败:', error);
                        errorMessage.textContent = '网络错误，请稍后重试';
                    });
                } else {
                    // 学生查询作业
                    fetch('homework-sync.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            action: 'student',
                            schoolCode: schoolCode,
                            classCode: classCode
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // 显示作业列表
                            loginForm.style.display = 'none';
                            homeworkList.style.display = 'block';
                            
                            // 更新学校信息
                            schoolInfo.innerHTML = `
                                <strong>学校：</strong>${schoolCode}<br>
                                <strong>班级：</strong>${classCode}<br>
                                <strong>最后更新：</strong>${new Date(data.lastUpdated * 1000).toLocaleString()}
                            `;
                            
                            // 渲染作业列表
                            renderHomeworkList(data.homeworkData);
                        } else {
                            errorMessage.textContent = data.message || '查询失败';
                        }
                    })
                    .catch(error => {
                        console.error('查询失败:', error);
                        errorMessage.textContent = '网络错误，请稍后重试';
                    });
                }
            });
            
            // 学生返回按钮点击事件
            backBtn.addEventListener('click', function() {
                homeworkList.style.display = 'none';
                loginForm.style.display = 'block';
                errorMessage.textContent = '';
            });
            
            // 老师返回按钮点击事件
            teacherBackBtn.addEventListener('click', function() {
                homeworkForm.style.display = 'none';
                loginForm.style.display = 'block';
                teacherErrorMessage.textContent = '';
                resetHomeworkForm();
            });
            
            // 重置作业表单
            function resetHomeworkForm() {
                newSubjectSelect.value = 'chinese';
                newContentTextarea.value = '';
                newDueDateInput.value = '';
            }
            
            // 添加作业按钮点击事件
            addHomeworkBtn.addEventListener('click', function() {
                const schoolCode = schoolCodeInput.value.trim();
                const classCode = classCodeInput.value.trim();
                const subject = newSubjectSelect.value;
                const dueDate = newDueDateInput.value;
                const homeworkTitle = document.getElementById('homeworkTitle').value;
                
                // 获取当前选择的作业类型
                const selectedHomeworkType = document.querySelector('input[name="homeworkType"]:checked').value;
                
                if (selectedHomeworkType === 'normal') {
                    // 普通作业
                    const content = newContentTextarea.value.trim();
                    
                    if (!content) {
                        teacherErrorMessage.textContent = '请输入作业内容';
                        return;
                    }
                    
                    // 构建作业内容
                    let finalContent = '';
                    if (homeworkTitle) {
                        finalContent += `<h3>${homeworkTitle}</h3>`;
                    }
                    finalContent += content.replace(/\n/g, '<br>');
                    
                    // 发送添加作业请求
                    fetch('homework-sync.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            action: 'addHomework',
                            schoolCode: schoolCode,
                            classCode: classCode,
                            subject: subject,
                            content: finalContent,
                            dueDate: dueDate
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        // 作业添加完成
                        teacherErrorMessage.textContent = '成功添加作业';
                        // 重新渲染作业列表
                        renderTeacherHomeworkList(data.homeworkData);
                        // 重置表单
                        resetHomeworkForm();
                        // 3秒后清除错误信息
                        setTimeout(() => {
                            teacherErrorMessage.textContent = '';
                        }, 3000);
                    })
                    .catch(error => {
                        console.error('添加失败:', error);
                        teacherErrorMessage.textContent = '网络错误，请稍后重试';
                    });
                } else {
                    // 模板作业
                    if (homeworkEntries.length === 0) {
                        teacherErrorMessage.textContent = '请添加至少一个模板';
                        return;
                    }
                    
                    // 为每个作业条目创建一个单独的作业
                    let addedCount = 0;
                    let totalCount = homeworkEntries.length;
                    
                    homeworkEntries.forEach((entry, index) => {
                        // 构建作业内容
                        let content = '';
                        
                        // 添加作业标题
                        if (homeworkTitle) {
                            content += `<h3>${homeworkTitle}</h3>`;
                        }
                        
                        // 添加当前作业条目的内容
                        if (entry.template) {
                            content += `<div class="homework-entry">
                                <h4>${entry.template.name}</h4>
                                <div class="entry-content">${renderTemplateToContent(entry.template, entry.values)}</div>
                            </div>`;
                        }
                        
                        // 发送添加作业请求
                        fetch('homework-sync.php', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                action: 'addHomework',
                                schoolCode: schoolCode,
                                classCode: classCode,
                                subject: subject,
                                content: content,
                                dueDate: dueDate
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            addedCount++;
                            
                            if (addedCount === totalCount) {
                                // 所有作业都添加完成
                                teacherErrorMessage.textContent = `成功添加 ${totalCount} 个作业`;
                                // 重新渲染作业列表
                                renderTeacherHomeworkList(data.homeworkData);
                                // 重置表单
                                resetHomeworkForm();
                                // 清空作业条目
                                homeworkEntries = [];
                                const homeworkContent = document.getElementById('homeworkContent');
                                homeworkContent.innerHTML = '';
                                // 显示空状态提示
                                const emptyState = document.createElement('div');
                                emptyState.className = 'empty-state';
                                emptyState.innerHTML = '<p>从左侧模板库中拖拽模板到此处，或直接输入作业内容</p>';
                                document.getElementById('homeworkContentArea').appendChild(emptyState);
                                // 3秒后清除错误信息
                                setTimeout(() => {
                                    teacherErrorMessage.textContent = '';
                                }, 3000);
                            }
                        })
                        .catch(error => {
                            console.error('添加失败:', error);
                            teacherErrorMessage.textContent = '网络错误，请稍后重试';
                        });
                    });
                }
            });
            
            // 渲染学生作业列表
            function renderHomeworkList(homeworkData) {
                if (!homeworkData || homeworkData.length === 0) {
                    studentHomeworkContent.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">暂无作业</p>';
                    return;
                }
                
                // 按截止日期排序
                homeworkData.sort((a, b) => {
                    const dateA = a.dueDate ? new Date(a.dueDate) : new Date(0);
                    const dateB = b.dueDate ? new Date(b.dueDate) : new Date(0);
                    return dateA - dateB;
                });
                
                let html = '';
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                homeworkData.forEach(homework => {
                    // 检查是否过期
                    let isOverdue = false;
                    let dueDateStr = '无截止日期';
                    if (homework.dueDate) {
                        const dueDate = new Date(homework.dueDate);
                        const dueDateOnly = new Date(dueDate);
                        dueDateOnly.setHours(0, 0, 0, 0);
                        
                        isOverdue = dueDateOnly < today;
                        dueDateStr = `截止: ${dueDate.getFullYear()}-${String(dueDate.getMonth()+1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
                    }
                    
                    // 格式化时间戳
                    const timestamp = homework.timestamp ? new Date(homework.timestamp) : new Date();
                    const timeStr = `${timestamp.getFullYear()}-${String(timestamp.getMonth()+1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}`;
                    
                    // 将换行符替换为<br>标签
                    const contentWithLineBreaks = homework.content.replace(/\n/g, '<br>');
                    
                    html += `
                        <div class="homework-item">
                            <div class="homework-header">
                                <span class="subject-tag ${homework.subject}">${getSubjectName(homework.subject)}</span>
                                <div class="homework-meta">
                                    <span>${timeStr}</span>
                                    <span class="due-date ${isOverdue ? 'overdue' : ''}">${dueDateStr}</span>
                                </div>
                            </div>
                            <div class="homework-content">${contentWithLineBreaks}</div>
                        </div>
                    `;
                });
                
                studentHomeworkContent.innerHTML = html;
            }
            
            // 渲染老师作业列表（带删除功能）
            function renderTeacherHomeworkList(homeworkData) {
                if (!homeworkData || homeworkData.length === 0) {
                    teacherHomeworkList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">暂无作业</p>';
                    return;
                }
                
                // 按截止日期排序
                homeworkData.sort((a, b) => {
                    const dateA = a.dueDate ? new Date(a.dueDate) : new Date(0);
                    const dateB = b.dueDate ? new Date(b.dueDate) : new Date(0);
                    return dateA - dateB;
                });
                
                let html = '<h3>已布置的作业</h3>';
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                homeworkData.forEach((homework, index) => {
                    // 检查是否过期
                    let isOverdue = false;
                    let dueDateStr = '无截止日期';
                    if (homework.dueDate) {
                        const dueDate = new Date(homework.dueDate);
                        const dueDateOnly = new Date(dueDate);
                        dueDateOnly.setHours(0, 0, 0, 0);
                        
                        isOverdue = dueDateOnly < today;
                        dueDateStr = `截止: ${dueDate.getFullYear()}-${String(dueDate.getMonth()+1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
                    }
                    
                    // 格式化时间戳
                    const timestamp = homework.timestamp ? new Date(homework.timestamp) : new Date();
                    const timeStr = `${timestamp.getFullYear()}-${String(timestamp.getMonth()+1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}`;
                    
                    // 将换行符替换为<br>标签
                    const contentWithLineBreaks = homework.content.replace(/\n/g, '<br>');
                    
                    html += `
                        <div class="homework-item">
                            <div class="homework-header">
                                <span class="subject-tag ${homework.subject}">${getSubjectName(homework.subject)}</span>
                                <div class="homework-meta">
                                    <span>${timeStr}</span>
                                    <span class="due-date ${isOverdue ? 'overdue' : ''}">${dueDateStr}</span>
                                </div>
                            </div>
                            <div class="homework-content">${contentWithLineBreaks}</div>
                            <button class="delete-homework-btn" data-index="${index}" style="background-color: #e74c3c; margin-top: 10px; padding: 8px;">删除</button>
                        </div>
                    `;
                });
                
                teacherHomeworkList.innerHTML = html;
                
                // 添加删除按钮点击事件
                document.querySelectorAll('.delete-homework-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const index = parseInt(this.dataset.index);
                        deleteHomework(index);
                    });
                });
            }
            
            // 删除作业
            function deleteHomework(index) {
                const schoolCode = schoolCodeInput.value.trim();
                const classCode = classCodeInput.value.trim();
                
                if (confirm('确定要删除这个作业吗？')) {
                    // 发送删除作业请求
                    fetch('homework-sync.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            action: 'deleteHomework',
                            schoolCode: schoolCode,
                            classCode: classCode,
                            index: index
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            teacherErrorMessage.textContent = '作业删除成功';
                            // 重新渲染作业列表
                            renderTeacherHomeworkList(data.homeworkData);
                            // 3秒后清除错误信息
                            setTimeout(() => {
                                teacherErrorMessage.textContent = '';
                            }, 3000);
                        } else {
                            teacherErrorMessage.textContent = data.message || '删除失败';
                        }
                    })
                    .catch(error => {
                        console.error('删除失败:', error);
                        teacherErrorMessage.textContent = '网络错误，请稍后重试';
                    });
                }
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
            
            // 加载模板列表
            function loadTemplates() {
                let templates = getAllTemplates();
                
                // 检查是否需要添加默认模板
                if (templates.length === 0) {
                    // 添加默认的自定义文本模板
                    const defaultTemplate = createNewTemplate('自定义文本');
                    defaultTemplate.description = '用于添加自定义文本内容的模板';
                    defaultTemplate.components = [
                        createComponent(COMPONENT_TYPES.FIXED_TEXT, {
                            content: '自定义文本内容'
                        })
                    ];
                    saveTemplateToStorage(defaultTemplate);
                    templates = getAllTemplates();
                }
                
                if (templates.length === 0) {
                    templateList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">暂无模板</p>';
                    return;
                }
                
                let html = '';
                templates.forEach(template => {
                    html += `
                        <div class="homework-item">
                            <h3>${template.name}</h3>
                            <p>${template.description || '无描述'}</p>
                            <p>组件数量: ${template.components.length}</p>
                            <div style="display: flex; gap: 10px; margin-top: 10px;">
                                <button class="edit-template-btn" data-id="${template.id}" style="flex: 1; background-color: #3498db;">编辑</button>
                                <button class="delete-template-btn" data-id="${template.id}" style="flex: 1; background-color: #e74c3c;">删除</button>
                            </div>
                        </div>
                    `;
                });
                
                templateList.innerHTML = html;
                
                // 添加编辑按钮点击事件
                document.querySelectorAll('.edit-template-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const templateId = this.dataset.id;
                        openTemplateEditor(templateId);
                    });
                });
                
                // 添加删除按钮点击事件
                document.querySelectorAll('.delete-template-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const templateId = this.dataset.id;
                        if (confirm('确定要删除这个模板吗？')) {
                            deleteTemplate(templateId);
                            loadTemplates();
                        }
                    });
                });
                
                // 更新模板选择下拉框
                updateTemplateSelect();
            }
            
            // 更新模板选择下拉框
            function updateTemplateSelect() {
                const templates = getAllTemplates();
                let html = '<option value="">请选择模板</option>';
                
                templates.forEach(template => {
                    html += `<option value="${template.id}">${template.name}</option>`;
                });
                
                templateSelect.innerHTML = html;
            }
            
            // 打开模板编辑器
            function openTemplateEditor(templateId = null) {
                templateManager.style.display = 'none';
                templateEditor.style.display = 'block';
                
                if (templateId) {
                    // 编辑现有模板
                    const template = getTemplateById(templateId);
                    if (template) {
                        currentTemplate = template;
                        templateNameInput.value = template.name;
                        templateDescriptionTextarea.value = template.description || '';
                        renderTemplateComponents(template.components);
                    }
                } else {
                    // 创建新模板
                    currentTemplate = null;
                    templateNameInput.value = '';
                    templateDescriptionTextarea.value = '';
                    templateComponents.innerHTML = '';
                }
            }
            
            // 渲染模板组件
            function renderTemplateComponents(components) {
                let html = '';
                
                if (components.length === 0) {
                    html = `
                        <div class="empty-state" style="text-align: center; color: #999; padding: 40px 20px;">
                            <p>从左侧组件库中添加组件到此处开始设计模板</p>
                        </div>
                    `;
                } else {
                    components.forEach((component, index) => {
                        html += `
                            <div class="template-component" data-index="${index}" style="background: white; border: 2px solid #e0e0e0; border-radius: 10px; padding: 15px; margin-bottom: -10px; position: relative; transition: all 0.2s; min-width: 300px; max-width: 500px; width: 80%; box-shadow: 0 2px 8px rgba(0,0,0,0.1); background-image: radial-gradient(circle at 50% 0%, transparent 12px, white 12px, white 100%); background-size: 100% calc(100% + 10px); background-position: 0 -10px; background-repeat: no-repeat; z-index: 1;">
                                <div class="component-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <div class="component-type" style="font-weight: bold; font-size: 14px; color: #333;">${getComponentTypeName(component.type)}</div>
                                    <div class="component-actions" style="display: flex; gap: 5px;">
                                        <button class="action-btn" title="编辑" data-index="${index}" style="width: 24px; height: 24px; border: none; background: none; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666;">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button class="action-btn" title="删除" data-index="${index}" style="width: 24px; height: 24px; border: none; background: none; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666;">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                                <line x1="14" y1="11" x2="14" y2="17"></line>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="component-content" style="margin-top: 10px;">
                                    ${renderComponentDetails(component)}
                                </div>
                            </div>
                        `;
                    });
                }
                
                templateComponents.innerHTML = html;
                
                // 添加组件点击事件，用于选择组件
                document.querySelectorAll('.template-component').forEach((componentEl, index) => {
                    componentEl.addEventListener('click', function() {
                        // 移除之前的选择状态
                        document.querySelectorAll('.template-component').forEach(el => {
                            el.style.borderColor = '#e0e0e0';
                            el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        });
                        
                        // 添加当前选择状态
                        this.style.borderColor = '#3498db';
                        this.style.boxShadow = '0 0 0 2px rgba(52, 152, 219, 0.3)';
                        
                        // 显示属性面板
                        const componentIndex = parseInt(this.dataset.index);
                        showComponentProperties(componentIndex);
                    });
                });
                
                // 添加编辑按钮点击事件
                document.querySelectorAll('.action-btn[title="编辑"]').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const index = parseInt(this.dataset.index);
                        openEditComponentDialog(index);
                    });
                });
                
                // 添加删除按钮点击事件
                document.querySelectorAll('.action-btn[title="删除"]').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const index = parseInt(this.dataset.index);
                        if (confirm('确定要删除这个组件吗？')) {
                            if (currentTemplate) {
                                currentTemplate.components.splice(index, 1);
                                renderTemplateComponents(currentTemplate.components);
                                // 清空属性面板
                                document.getElementById('propertyContent').innerHTML = '<p style="color: #999; text-align: center; margin-top: 30px;">选择一个组件来编辑属性</p>';
                            }
                        }
                    });
                });
            }
            
            // 获取组件类型名称
            function getComponentTypeName(type) {
                const typeNames = {
                    'fixedText': '固定文本',
                    'numberSelect': '数字选择',
                    'textDropdown': '文本下拉选择'
                };
                return typeNames[type] || type;
            }
            
            // 渲染组件详情
            function renderComponentDetails(component) {
                switch (component.type) {
                    case COMPONENT_TYPES.FIXED_TEXT:
                        return `<p>内容: ${component.content}</p>`;
                    case COMPONENT_TYPES.NUMBER_SELECT:
                        return `
                            <p>标签: ${component.label}</p>
                            <p>范围: ${component.min} - ${component.max}</p>
                            <p>步长: ${component.step}</p>
                            <p>默认值: ${component.defaultValue}</p>
                        `;
                    case COMPONENT_TYPES.TEXT_DROPDOWN:
                        return `
                            <p>标签: ${component.label}</p>
                            <p>选项: ${component.options.join(', ')}</p>
                            <p>默认值: ${component.defaultValue}</p>
                        `;
                    default:
                        return '<p>未知组件类型</p>';
                }
            }
            
            // 打开添加组件对话框
            function openAddComponentDialog() {
                document.getElementById('componentTypeSelect').value = '';
                document.getElementById('componentProperties').innerHTML = '';
                document.getElementById('addComponentDialog').style.display = 'block';
            }
            
            // 关闭添加组件对话框
            function closeAddComponentDialog() {
                document.getElementById('addComponentDialog').style.display = 'none';
            }
            
            // 更新组件属性表单
            function updateComponentProperties() {
                const componentType = document.getElementById('componentTypeSelect').value;
                const propertiesContainer = document.getElementById('componentProperties');
                
                let html = '';
                
                switch (componentType) {
                    case COMPONENT_TYPES.FIXED_TEXT:
                        html = `
                            <div class="form-group">
                                <label for="fixedTextContent">文本内容</label>
                                <textarea id="fixedTextContent" rows="3" placeholder="请输入固定文本内容" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9; resize: vertical;"></textarea>
                            </div>
                        `;
                        break;
                    case COMPONENT_TYPES.NUMBER_SELECT:
                        html = `
                            <div class="form-group">
                                <label for="numberSelectLabel">标签文本</label>
                                <input type="text" id="numberSelectLabel" placeholder="请输入数字选择标签" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9;">
                            </div>
                            <div class="form-group">
                                <label for="numberSelectMin">最小值</label>
                                <input type="number" id="numberSelectMin" value="1" min="0" max="100" step="1" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9;">
                            </div>
                            <div class="form-group">
                                <label for="numberSelectMax">最大值</label>
                                <input type="number" id="numberSelectMax" value="10" min="1" max="200" step="1" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9;">
                            </div>
                            <div class="form-group">
                                <label for="numberSelectStep">步长</label>
                                <input type="number" id="numberSelectStep" value="1" min="1" max="10" step="1" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9;">
                            </div>
                            <div class="form-group">
                                <label for="numberSelectDefault">默认值</label>
                                <input type="number" id="numberSelectDefault" value="1" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9;">
                            </div>
                        `;
                        break;
                    case COMPONENT_TYPES.TEXT_DROPDOWN:
                        html = `
                            <div class="form-group">
                                <label for="textDropdownLabel">标签文本</label>
                                <input type="text" id="textDropdownLabel" placeholder="请输入下拉选择标签" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9;">
                            </div>
                            <div class="form-group">
                                <label for="textDropdownOptions">选项（用逗号分隔）</label>
                                <input type="text" id="textDropdownOptions" placeholder="请输入选项，用逗号分隔" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9;">
                            </div>
                            <div class="form-group">
                                <label for="textDropdownDefault">默认值</label>
                                <input type="text" id="textDropdownDefault" placeholder="请输入默认值" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9;">
                            </div>
                        `;
                        break;
                }
                
                propertiesContainer.innerHTML = html;
            }
            
            // 确认添加组件
            function confirmAddComponent() {
                const componentType = document.getElementById('componentTypeSelect').value;
                
                if (!componentType) {
                    alert('请选择组件类型');
                    return;
                }
                
                let component;
                
                switch (componentType) {
                    case COMPONENT_TYPES.FIXED_TEXT:
                        const content = document.getElementById('fixedTextContent').value.trim();
                        if (!content) {
                            alert('请输入文本内容');
                            return;
                        }
                        component = createComponent(COMPONENT_TYPES.FIXED_TEXT, { content });
                        break;
                    case COMPONENT_TYPES.NUMBER_SELECT:
                        const label = document.getElementById('numberSelectLabel').value.trim();
                        const min = parseInt(document.getElementById('numberSelectMin').value) || 1;
                        const max = parseInt(document.getElementById('numberSelectMax').value) || 10;
                        const step = parseInt(document.getElementById('numberSelectStep').value) || 1;
                        const defaultValue = parseInt(document.getElementById('numberSelectDefault').value) || 1;
                        
                        if (!label) {
                            alert('请输入标签文本');
                            return;
                        }
                        
                        component = createComponent(COMPONENT_TYPES.NUMBER_SELECT, { label, min, max, step, defaultValue });
                        break;
                    case COMPONENT_TYPES.TEXT_DROPDOWN:
                        const dropdownLabel = document.getElementById('textDropdownLabel').value.trim();
                        const optionsStr = document.getElementById('textDropdownOptions').value;
                        const options = optionsStr ? optionsStr.split(',').map(opt => opt.trim()) : [];
                        const dropdownDefault = document.getElementById('textDropdownDefault').value;
                        
                        if (!dropdownLabel) {
                            alert('请输入标签文本');
                            return;
                        }
                        
                        component = createComponent(COMPONENT_TYPES.TEXT_DROPDOWN, { label: dropdownLabel, options, defaultValue: dropdownDefault });
                        break;
                }
                
                if (component) {
                    if (!currentTemplate) {
                        currentTemplate = createNewTemplate('新模板');
                    }
                    currentTemplate.components.push(component);
                    renderTemplateComponents(currentTemplate.components);
                    closeAddComponentDialog();
                }
            }
            
            // 打开编辑组件对话框
            function openEditComponentDialog(componentIndex) {
                const component = currentTemplate.components[componentIndex];
                if (!component) return;
                
                const propertiesContainer = document.getElementById('editComponentProperties');
                let html = '';
                
                switch (component.type) {
                    case COMPONENT_TYPES.FIXED_TEXT:
                        html = `
                            <input type="hidden" id="editComponentIndex" value="${componentIndex}">
                            <div class="form-group">
                                <label for="editFixedTextContent">文本内容</label>
                                <textarea id="editFixedTextContent" rows="3" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9; resize: vertical;">${component.content}</textarea>
                            </div>
                        `;
                        break;
                    case COMPONENT_TYPES.NUMBER_SELECT:
                        html = `
                            <input type="hidden" id="editComponentIndex" value="${componentIndex}">
                            <div class="form-group">
                                <label for="editNumberSelectLabel">标签文本</label>
                                <input type="text" id="editNumberSelectLabel" value="${component.label}" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9;">
                            </div>
                            <div class="form-group">
                                <label for="editNumberSelectMin">最小值</label>
                                <input type="number" id="editNumberSelectMin" value="${component.min}" min="0" max="100" step="1" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9;">
                            </div>
                            <div class="form-group">
                                <label for="editNumberSelectMax">最大值</label>
                                <input type="number" id="editNumberSelectMax" value="${component.max}" min="1" max="200" step="1" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9;">
                            </div>
                            <div class="form-group">
                                <label for="editNumberSelectStep">步长</label>
                                <input type="number" id="editNumberSelectStep" value="${component.step}" min="1" max="10" step="1" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9;">
                            </div>
                            <div class="form-group">
                                <label for="editNumberSelectDefault">默认值</label>
                                <input type="number" id="editNumberSelectDefault" value="${component.defaultValue}" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9;">
                            </div>
                        `;
                        break;
                    case COMPONENT_TYPES.TEXT_DROPDOWN:
                        html = `
                            <input type="hidden" id="editComponentIndex" value="${componentIndex}">
                            <div class="form-group">
                                <label for="editTextDropdownLabel">标签文本</label>
                                <input type="text" id="editTextDropdownLabel" value="${component.label}" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9;">
                            </div>
                            <div class="form-group">
                                <label for="editTextDropdownOptions">选项（用逗号分隔）</label>
                                <input type="text" id="editTextDropdownOptions" value="${component.options.join(', ')}" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9;">
                            </div>
                            <div class="form-group">
                                <label for="editTextDropdownDefault">默认值</label>
                                <input type="text" id="editTextDropdownDefault" value="${component.defaultValue}" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; background-color: #f9f9f9;">
                            </div>
                        `;
                        break;
                }
                
                propertiesContainer.innerHTML = html;
                document.getElementById('editComponentDialog').style.display = 'block';
            }
            
            // 确认编辑组件
            function confirmEditComponent() {
                const componentIndex = parseInt(document.getElementById('editComponentIndex').value);
                const component = currentTemplate.components[componentIndex];
                
                if (!component) return;
                
                switch (component.type) {
                    case COMPONENT_TYPES.FIXED_TEXT:
                        component.content = document.getElementById('editFixedTextContent').value.trim();
                        break;
                    case COMPONENT_TYPES.NUMBER_SELECT:
                        component.label = document.getElementById('editNumberSelectLabel').value.trim();
                        component.min = parseInt(document.getElementById('editNumberSelectMin').value) || 1;
                        component.max = parseInt(document.getElementById('editNumberSelectMax').value) || 10;
                        component.step = parseInt(document.getElementById('editNumberSelectStep').value) || 1;
                        component.defaultValue = parseInt(document.getElementById('editNumberSelectDefault').value) || 1;
                        break;
                    case COMPONENT_TYPES.TEXT_DROPDOWN:
                        component.label = document.getElementById('editTextDropdownLabel').value.trim();
                        const optionsStr = document.getElementById('editTextDropdownOptions').value;
                        component.options = optionsStr ? optionsStr.split(',').map(opt => opt.trim()) : [];
                        component.defaultValue = document.getElementById('editTextDropdownDefault').value;
                        break;
                }
                
                renderTemplateComponents(currentTemplate.components);
                closeEditComponentDialog();
            }
            
            // 关闭编辑组件对话框
            function closeEditComponentDialog() {
                document.getElementById('editComponentDialog').style.display = 'none';
            }
            
            // 显示组件属性
            function showComponentProperties(componentIndex) {
                const component = currentTemplate.components[componentIndex];
                if (!component) return;
                
                const propertyContent = document.getElementById('propertyContent');
                let html = '';
                
                switch (component.type) {
                    case COMPONENT_TYPES.FIXED_TEXT:
                        html = `
                            <div class="property-group" style="margin-bottom: 20px;">
                                <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 14px; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px;">固定文本属性</h4>
                                <div class="property-item" style="margin-bottom: 15px;">
                                    <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #666;">文本内容</label>
                                    <textarea id="propFixedTextContent" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; background-color: #f9f9f9; resize: vertical;">${component.content}</textarea>
                                </div>
                                <button class="update-property-btn" data-property="content" data-index="${componentIndex}" style="width: 100%; padding: 8px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">更新属性</button>
                            </div>
                        `;
                        break;
                    case COMPONENT_TYPES.NUMBER_SELECT:
                        html = `
                            <div class="property-group" style="margin-bottom: 20px;">
                                <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 14px; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px;">数字选择属性</h4>
                                <div class="property-item" style="margin-bottom: 15px;">
                                    <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #666;">标签文本</label>
                                    <input type="text" id="propNumberSelectLabel" value="${component.label}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; background-color: #f9f9f9;">
                                </div>
                                <div class="property-item" style="margin-bottom: 15px;">
                                    <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #666;">最小值</label>
                                    <input type="number" id="propNumberSelectMin" value="${component.min}" min="0" max="100" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; background-color: #f9f9f9;">
                                </div>
                                <div class="property-item" style="margin-bottom: 15px;">
                                    <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #666;">最大值</label>
                                    <input type="number" id="propNumberSelectMax" value="${component.max}" min="1" max="200" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; background-color: #f9f9f9;">
                                </div>
                                <div class="property-item" style="margin-bottom: 15px;">
                                    <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #666;">步长</label>
                                    <input type="number" id="propNumberSelectStep" value="${component.step}" min="1" max="10" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; background-color: #f9f9f9;">
                                </div>
                                <div class="property-item" style="margin-bottom: 15px;">
                                    <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #666;">默认值</label>
                                    <input type="number" id="propNumberSelectDefault" value="${component.defaultValue}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; background-color: #f9f9f9;">
                                </div>
                                <button class="update-property-btn" data-property="numberSelect" data-index="${componentIndex}" style="width: 100%; padding: 8px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">更新属性</button>
                            </div>
                        `;
                        break;
                    case COMPONENT_TYPES.TEXT_DROPDOWN:
                        html = `
                            <div class="property-group" style="margin-bottom: 20px;">
                                <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 14px; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px;">文本下拉属性</h4>
                                <div class="property-item" style="margin-bottom: 15px;">
                                    <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #666;">标签文本</label>
                                    <input type="text" id="propTextDropdownLabel" value="${component.label}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; background-color: #f9f9f9;">
                                </div>
                                <div class="property-item" style="margin-bottom: 15px;">
                                    <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #666;">选项（用逗号分隔）</label>
                                    <input type="text" id="propTextDropdownOptions" value="${component.options.join(', ')}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; background-color: #f9f9f9;">
                                </div>
                                <div class="property-item" style="margin-bottom: 15px;">
                                    <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #666;">默认值</label>
                                    <input type="text" id="propTextDropdownDefault" value="${component.defaultValue}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; background-color: #f9f9f9;">
                                </div>
                                <button class="update-property-btn" data-property="textDropdown" data-index="${componentIndex}" style="width: 100%; padding: 8px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">更新属性</button>
                            </div>
                        `;
                        break;
                }
                
                propertyContent.innerHTML = html;
                
                // 添加更新属性按钮点击事件
                document.querySelectorAll('.update-property-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const propertyType = this.dataset.property;
                        const componentIndex = parseInt(this.dataset.index);
                        updateComponentProperties(propertyType, componentIndex);
                    });
                });
            }
            
            // 更新组件属性
            function updateComponentProperties(propertyType, componentIndex) {
                const component = currentTemplate.components[componentIndex];
                if (!component) return;
                
                switch (propertyType) {
                    case 'content':
                        component.content = document.getElementById('propFixedTextContent').value.trim();
                        break;
                    case 'numberSelect':
                        component.label = document.getElementById('propNumberSelectLabel').value.trim();
                        component.min = parseInt(document.getElementById('propNumberSelectMin').value) || 1;
                        component.max = parseInt(document.getElementById('propNumberSelectMax').value) || 10;
                        component.step = parseInt(document.getElementById('propNumberSelectStep').value) || 1;
                        component.defaultValue = parseInt(document.getElementById('propNumberSelectDefault').value) || 1;
                        break;
                    case 'textDropdown':
                        component.label = document.getElementById('propTextDropdownLabel').value.trim();
                        const optionsStr = document.getElementById('propTextDropdownOptions').value;
                        component.options = optionsStr ? optionsStr.split(',').map(opt => opt.trim()) : [];
                        component.defaultValue = document.getElementById('propTextDropdownDefault').value;
                        break;
                }
                
                // 重新渲染组件
                renderTemplateComponents(currentTemplate.components);
                
                // 重新选择组件
                setTimeout(() => {
                    const componentEl = document.querySelector(`.template-component[data-index="${componentIndex}"]`);
                    if (componentEl) {
                        componentEl.click();
                    }
                }, 100);
            }
            
            // 为组件库中的添加按钮添加点击事件
            document.querySelectorAll('.add-component-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const componentType = this.dataset.componentType;
                    addComponentFromLibrary(componentType);
                });
            });
            
            // 从组件库添加组件
            function addComponentFromLibrary(componentType) {
                let component;
                
                switch (componentType) {
                    case COMPONENT_TYPES.FIXED_TEXT:
                        component = createComponent(COMPONENT_TYPES.FIXED_TEXT, { content: '固定文本内容' });
                        break;
                    case COMPONENT_TYPES.NUMBER_SELECT:
                        component = createComponent(COMPONENT_TYPES.NUMBER_SELECT, { label: '选择数字', min: 1, max: 10, step: 1, defaultValue: 1 });
                        break;
                    case COMPONENT_TYPES.TEXT_DROPDOWN:
                        component = createComponent(COMPONENT_TYPES.TEXT_DROPDOWN, { label: '选择选项', options: ['选项1', '选项2', '选项3'], defaultValue: '选项1' });
                        break;
                }
                
                if (component) {
                    if (!currentTemplate) {
                        currentTemplate = createNewTemplate('新模板');
                    }
                    currentTemplate.components.push(component);
                    renderTemplateComponents(currentTemplate.components);
                }
            }
            
            // 保存模板
            function saveTemplate() {
                const name = templateNameInput.value.trim();
                if (!name) {
                    templateEditorErrorMessage.textContent = '请输入模板名称';
                    return;
                }
                
                if (!currentTemplate) {
                    currentTemplate = createNewTemplate(name);
                }
                
                currentTemplate.name = name;
                currentTemplate.description = templateDescriptionTextarea.value.trim();
                currentTemplate.updatedAt = new Date().toISOString();
                
                if (saveTemplateToStorage(currentTemplate)) {
                    templateEditorErrorMessage.textContent = '模板保存成功';
                    setTimeout(() => {
                        templateEditor.style.display = 'none';
                        templateManager.style.display = 'block';
                        loadTemplates();
                    }, 1000);
                } else {
                    templateEditorErrorMessage.textContent = '模板保存失败';
                }
            }
            
            // 获取所有模板
            function getAllTemplates() {
                try {
                    const templates = localStorage.getItem(TEMPLATE_STORAGE_KEY);
                    return templates ? JSON.parse(templates) : [];
                } catch (e) {
                    console.error('获取模板数据失败:', e);
                    return [];
                }
            }
            
            // 获取单个模板
            function getTemplateById(id) {
                const templates = getAllTemplates();
                return templates.find(template => template.id === id);
            }
            
            // 保存模板到本地存储
            function saveTemplateToStorage(template) {
                try {
                    const templates = getAllTemplates();
                    const index = templates.findIndex(t => t.id === template.id);
                    
                    if (index >= 0) {
                        // 更新现有模板
                        templates[index] = template;
                    } else {
                        // 添加新模板
                        templates.push(template);
                    }
                    
                    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
                    return true;
                } catch (e) {
                    console.error('保存模板失败:', e);
                    return false;
                }
            }
            
            // 删除模板
            function deleteTemplate(id) {
                try {
                    const templates = getAllTemplates();
                    const filteredTemplates = templates.filter(template => template.id !== id);
                    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(filteredTemplates));
                    return true;
                } catch (e) {
                    console.error('删除模板失败:', e);
                    return false;
                }
            }
            
            // 创建新模板
            function createNewTemplate(name, description = '') {
                return {
                    id: `template-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    name: name,
                    description: description,
                    components: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            }
            
            // 创建模板组件
            function createComponent(type, config = {}) {
                const baseComponent = {
                    id: `component-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    type: type,
                    order: Date.now()
                };
                
                switch (type) {
                    case COMPONENT_TYPES.FIXED_TEXT:
                        return {
                            ...baseComponent,
                            content: config.content || '',
                            fontSize: config.fontSize || 'medium',
                            fontWeight: config.fontWeight || 'normal'
                        };
                    
                    case COMPONENT_TYPES.NUMBER_SELECT:
                        return {
                            ...baseComponent,
                            label: config.label || '选择数字',
                            min: config.min || 1,
                            max: config.max || 10,
                            step: config.step || 1,
                            defaultValue: config.defaultValue || 1
                        };
                    
                    case COMPONENT_TYPES.TEXT_DROPDOWN:
                        return {
                            ...baseComponent,
                            label: config.label || '选择选项',
                            options: config.options || [],
                            defaultValue: config.defaultValue || ''
                        };
                    
                    default:
                        throw new Error(`未知的组件类型: ${type}`);
                }
            }
            
            // 渲染模板为作业内容
            function renderTemplateToContent(template, values = {}) {
                let content = '';
                
                // 按顺序渲染组件
                const sortedComponents = [...template.components].sort((a, b) => a.order - b.order);
                
                sortedComponents.forEach(component => {
                    switch (component.type) {
                        case COMPONENT_TYPES.FIXED_TEXT:
                            content += `${component.content}<br>`;
                            break;
                            
                        case COMPONENT_TYPES.NUMBER_SELECT:
                            const numberValue = values[component.id] !== undefined ? values[component.id] : component.defaultValue;
                            content += `${component.label}: ${numberValue}<br>`;
                            break;
                            
                        case COMPONENT_TYPES.TEXT_DROPDOWN:
                            const textValue = values[component.id] !== undefined ? values[component.id] : component.defaultValue;
                            content += `${component.label}: ${textValue}<br>`;
                            break;
                    }
                });
                
                return content.trim();
            }
        });
    </script>
</body>
</html>
