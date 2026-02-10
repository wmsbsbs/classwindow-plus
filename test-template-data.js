// 测试模板数据的脚本
const fs = require('fs');
const path = require('path');
const os = require('os');

// 模拟localStorage
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

// 设置全局localStorage
global.localStorage = new LocalStorageMock();

// 测试模板数据
console.log('=== 测试模板数据 ===');

// 模拟一些模板数据
const testTemplates = [
  {
    id: 'template-1',
    name: '数学作业模板',
    description: '用于布置数学作业的模板',
    components: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'template-2',
    name: '语文作业模板',
    description: '用于布置语文作业的模板',
    components: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// 存储测试数据
try {
  localStorage.setItem('homeworkTemplates', JSON.stringify(testTemplates));
  console.log('测试数据存储成功');
  
  // 读取测试数据
  const storedTemplates = JSON.parse(localStorage.getItem('homeworkTemplates') || '[]');
  console.log('存储的模板数据:', JSON.stringify(storedTemplates, null, 2));
  
  // 检查模板结构
  storedTemplates.forEach((template, index) => {
    console.log(`\n模板 ${index + 1}:`);
    console.log(`  ID: ${template.id}`);
    console.log(`  名称: ${template.name}`);
    console.log(`  描述: ${template.description}`);
    console.log(`  组件数量: ${template.components ? template.components.length : 0}`);
    console.log(`  创建时间: ${template.createdAt}`);
  });
  
  console.log('\n=== 测试完成 ===');
  
} catch (error) {
  console.error('测试过程中出错:', error.message);
}
