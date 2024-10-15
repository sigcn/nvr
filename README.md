# NVR
这是一个网络视频录像机软件。

### 动机
针对有 Home Server 或 NAS 等家庭长期在线设备的用户，再购买一个 NVR 硬件的话，显得不是很体面（哈哈）。而且，NVR 软件很少，开源的就更少了。所以才有开源一个 NVR 软件的想法。

### 技术栈
1. 使用 Go 开发一个守护进程 nvrd，负责和摄像头等设备交互，并提供一组 HTTP/WebSocket API
2. 使用 Vue3 开发一个 Web 程序，对接 nvrd 提供的 API 和用户交互
3. 实时画面选用 MPEG-TS 作为封装格式。视频编码：保持摄像头原编码，音频编码：AAC
4. 录制视频选用 MP4 作为封装格式。视频编码：保持摄像头原编码，音频编码：AAC

### 第一个版本
为了尽快提供一个可以使用的版本，第一个版本只会实现很少的核心功能：

1. 账户模块 （仅提供一个超级管理员，暂不实现用户管理等功能）
2. 摄像头模块（手动添加，实时画面，暂不实现摄像头的平移-俯仰-对焦等控制功能）
3. 录制模块（每个摄像头每个小时一个视频文件，按天分类存储在文件系统上）

### 许可证
[GNU General Public License v3.0](https://github.com/sigcn/nvr/blob/main/LICENSE)
