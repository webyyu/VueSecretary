# 语音克隆与合成功能测试

本目录包含用于测试语音克隆和合成功能的自动化测试脚本。这些脚本可以帮助验证语音克隆和合成功能是否正常工作，并在开发过程中快速发现问题。

## 脚本说明

### 1. setup.js

环境设置脚本，用于安装测试所需的依赖和配置测试环境。

功能：
- 安装测试所需的npm包
- 检查环境配置文件
- 添加测试命令到package.json

使用方法：
```bash
node src/tests/setup.js
```

### 2. voiceCloneTest.js

语音克隆与合成基础功能测试脚本，使用数据库中现有的音频记录进行测试。

功能：
- 连接MongoDB数据库
- 从数据库获取测试数据
- 触发语音克隆流程
- 检查语音合成状态
- 查询相关的CosyVoice记录

使用方法：
```bash
npm run test:voice-clone
# 或
node src/tests/voiceCloneTest.js
```

### 3. voiceCloneUploadTest.js

完整的语音文件上传、克隆与合成流程测试脚本。

功能：
- 准备测试音频文件
- 上传语音文件并自动触发克隆
- 等待并检查克隆状态
- 检查语音合成状态
- 测试Flask API直接调用能力

使用方法：
```bash
npm run test:voice-upload
# 或
node src/tests/voiceCloneUploadTest.js
```

## 测试前准备

1. 确保MongoDB服务正在运行，默认连接地址为 `mongodb://localhost:27017/supertimer`
2. 确保Express后端服务已启动并监听在 `http://localhost:3000`
3. 确保Flask服务已启动并监听在 `http://localhost:5000`
4. 确保数据库中存在至少一条语音记录(`voices`集合)和反馈消息记录(`feedbackmessages`集合)
5. 首次运行测试前，请先执行环境设置脚本：`node src/tests/setup.js`

## 测试输出

测试脚本会在控制台打印详细的测试步骤和结果，使用彩色文本增强可读性。测试过程中会输出：

- 每个步骤的执行过程
- API请求和响应的摘要
- 等待过程的提示
- 最终测试结果

如果测试过程中遇到错误，会打印详细的错误信息和堆栈跟踪，以帮助快速定位问题。

## 常见问题解决

1. **连接MongoDB失败**
   - 检查MongoDB服务是否正在运行
   - 检查连接URI是否正确
   - 检查数据库名称是否正确

2. **连接Express后端失败**
   - 确认Express服务是否启动
   - 检查端口配置是否正确
   - 确认用户认证信息是否有效

3. **连接Flask服务失败**
   - 确认Flask服务是否启动
   - 检查Flask服务URL配置是否正确
   - 确认Flask服务接口是否按预期工作

4. **语音克隆或合成失败**
   - 查看Flask服务日志获取详细错误信息
   - 确认测试音频文件格式是否满足要求
   - 检查CosyVoice记录中的error字段

## 扩展测试

如需扩展测试功能，可以按照以下方向进行：

1. 添加更多错误场景测试
2. 增加性能测试
3. 添加并发测试
4. 实现端到端集成测试

## 测试数据清理

测试过程中会创建新的记录，但不会自动清理。如需清理测试数据，可以：

1. 手动删除特定的CosyVoice记录
2. 使用MongoDB数据库工具筛选并批量删除测试期间创建的记录 