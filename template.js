// 模板管理模块

// 模板存储键名
const TEMPLATE_STORAGE_KEY = 'homeworkTemplates';

// 模板组件类型
const COMPONENT_TYPES = {
    FIXED_TEXT: 'fixedText',
    NUMBER_SELECT: 'numberSelect',
    TEXT_DROPDOWN: 'textDropdown'
};

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

// 保存模板
function saveTemplate(template) {
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
                content += component.content + ' ';
                break;
                
            case COMPONENT_TYPES.NUMBER_SELECT:
                const numberValue = values[component.id] !== undefined ? values[component.id] : component.defaultValue;
                content += `${numberValue} `;
                break;
                
            case COMPONENT_TYPES.TEXT_DROPDOWN:
                const textValue = values[component.id] !== undefined ? values[component.id] : component.defaultValue;
                content += `${textValue} `;
                break;
        }
    });
    
    return content.trim();
}

// 导出模板管理功能
module.exports = {
    COMPONENT_TYPES,
    getAllTemplates,
    getTemplateById,
    saveTemplate,
    deleteTemplate,
    createNewTemplate,
    createComponent,
    renderTemplateToContent
};
