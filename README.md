# Guided Image Generation for DSH

一个 DSH Web 插件：在界面右下角添加可拖动的「🎨 图片生成」悬浮按钮，提供提示词引导、直接编辑提示词、比例与质量选择、批量生成、历史回看，并支持填入任意 OpenAI 兼容的图像供应商。

插件本身不内置任何密钥，也不做代理转发。每个使用者填自己的接口地址和 Key，请求从本机直接发往对应供应商。

## 功能

- 八项提示词引导（主体 / 场景 / 构图 / 风格 / 光线 / 色调 / 细节 / 排除项）
- 内置四套模板：写实人像、城市夜景、产品静物、概念场景
- 提示词可直接编辑，也可「按引导重填」
- 比例：1:1、3:2、2:3、16:9、9:16
- 质量：high / medium / low
- 数量：1~4 张，自动加序号；文件名自动去重，不覆盖旧图
- 生成历史：保留最近 12 张缩略图
- 失败提示分类：限流、余额不足、模型下线、缺 Key、超时、连接中断分别给出可读原因
- 悬浮按钮可拖动，位置记忆；`Ctrl+Shift+G` 唤起
- 一键打开输出文件夹

## 环境要求

- DSH（Web 或 Desktop）
- Python 3.10+，`py` 启动器可用（或设置环境变量 `DSH_IMAGE_PYTHON` 指向解释器）

## 安装

把整个目录放进插件位置，然后在 DSH 插件管理器中以本地 bundle 方式安装，或在 profile 的 `package.json` 中登记：

```json
{
  "dependencies": {
    "@local/dsh-guided-image-generation": "link:/absolute/path/to/guided-image-generation"
  },
  "dsh": {
    "profile": {
      "bundles": ["...", "@local/dsh-guided-image-generation"]
    }
  }
}
```

安装后重启 DSH。

## 配置供应商

点面板右上角 **⚙ 供应商**：

| 字段 | 说明 |
|---|---|
| 接口地址 | 任意 OpenAI 兼容地址，需含 `/v1`，默认 `https://api.openai.com/v1` |
| API Key | 你的 Key；留空则尝试读取本机环境变量 `DSH_IMAGE_API_KEY` / `OPENAI_API_KEY` |
| 首选模型 | 默认 `gpt-image-1` |
| 回退模型 | 可选择不启用 |

- 打开设置面板会自动读取 `{接口地址}/models`，列出可用模型供下拉选择
- 「测试连接」请求 `/models` 验证地址与 Key
- 配置保存在**当前浏览器**的 localStorage，不写入仓库，也不会上传

## 架构

```
client.js                 浏览器面板：拖动、引导表单、请求发送、结果展示
index.js                  Host 启动器：拉起本机桥接，注入 Key
cordis.patch.yml          bundle 补丁：插入插件行
server/image_http_server.py  本机桥接，监听 127.0.0.1:8769
server/image_route.py        生图路由：模型链回退、base64/URL 响应解析
```

请求链路：

```
点击生成 → 127.0.0.1:8769/generate → image_route.py → 供应商 → 落盘 → 面板预览
```

桥接端点：

| 路径 | 用途 |
|---|---|
| `POST /generate` | 生成图片 |
| `GET /image?path=` | 预览已生成图片 |
| `GET /models?base=&key=` | 读取供应商模型列表 |
| `GET /check?base=&key=` | 连通性测试 |
| `GET /pickdir` | 弹出系统文件夹选择框 |
| `GET /open?path=` | 打开所在文件夹 |
| `GET /ping` | 健康检查 |

桥接只监听回环地址。端口被占用时后启动的实例会安静退出，不影响已运行的服务。

## 安全说明

- 仓库内不含任何 API Key、供应商地址或用户路径
- Key 由使用者在界面填写，存于各自浏览器 localStorage（明文），请求只发往其填写的供应商
- 生成图片只写入使用者选择的目录
- 供应商的内容策略由各家自行决定，本插件不做过滤，也不绕过

## 许可

MIT
