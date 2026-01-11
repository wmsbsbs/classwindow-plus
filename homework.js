const path = require('path');
const fs = require('fs');
const { app } = require('electron/main');

let HOMEWORK_PATH;

// 初始化作业数据路径
const initHomeworkPath = () => {
  if (app.isPackaged) {
    // 在打包应用中，将作业数据存储在可执行文件的同级目录
    const appDir = path.dirname(app.getPath('exe'));
    const DATA_DIR = path.join(appDir, 'data');
    HOMEWORK_PATH = path.join(DATA_DIR, 'homework.json');
  } else {
    HOMEWORK_PATH = path.join(__dirname, 'data/homework.json');
  }
};

// 确保数据目录存在
const ensureDataDir = () => {
  const dir = path.dirname(HOMEWORK_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 读取作业数据
const loadHomework = () => {
  try {
    if (fs.existsSync(HOMEWORK_PATH)) {
      const data = fs.readFileSync(HOMEWORK_PATH, 'utf8');
      const parsed = JSON.parse(data);
      // 确保返回的是数组格式
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.warn('读取作业数据失败:', err);
  }
  return [];
};

// 保存作业数据
const saveHomework = (homeworkList) => {
  try {
    ensureDataDir();
    fs.writeFileSync(HOMEWORK_PATH, JSON.stringify(homeworkList, null, 2));
  } catch (err) {
    console.error('保存作业数据失败:', err);
  }
};

// 添加新作业
const addHomework = (homework) => {
  try {
    const homeworkList = loadHomework();
    homeworkList.unshift(homework); // 添加到开头
    saveHomework(homeworkList);
    return homeworkList;
  } catch (err) {
    console.error('添加作业失败:', err);
    return [];
  }
};

// 删除作业
const deleteHomework = (index) => {
  try {
    const homeworkList = loadHomework();
    if (index >= 0 && index < homeworkList.length) {
      homeworkList.splice(index, 1);
      saveHomework(homeworkList);
      return homeworkList;
    }
    return homeworkList;
  } catch (err) {
    console.error('删除作业失败:', err);
    return [];
  }
};

// 更新作业
const updateHomework = (index, homework) => {
  try {
    const homeworkList = loadHomework();
    if (index >= 0 && index < homeworkList.length) {
      homeworkList[index] = homework;
      saveHomework(homeworkList);
      return homeworkList;
    }
    return homeworkList;
  } catch (err) {
    console.error('更新作业失败:', err);
    return [];
  }
};

module.exports = {
  initHomeworkPath,
  loadHomework,
  saveHomework,
  addHomework,
  deleteHomework,
  updateHomework
};