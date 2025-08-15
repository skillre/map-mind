# Docker构建问题修复指南

## 问题描述

在Docker构建过程中遇到以下错误：
```
failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
```

这个错误表明在Docker构建阶段执行`npm run build`命令时失败了，退出代码为1。

## 已实施的修复

我们已经对Docker配置文件进行了以下修改，以解决这个问题：

### 1. Dockerfile修改

- 修改了文件复制顺序，确保所有必要文件（包括copy.js）都被正确复制到容器中
- 调整了工作目录结构，确保构建命令在正确的目录中执行
- 添加了构建失败时的错误输出，以便更好地诊断问题
- 更新了部署阶段的文件复制路径，以匹配新的目录结构

### 2. docker-compose.yml修改

- 添加了更多构建参数，包括NODE_ENV和NPM_CONFIG_LOGLEVEL
- 增加了共享内存大小设置，解决可能的内存不足问题

### 3. 创建修复脚本

我们创建了一个名为`fix-npm-build.sh`的脚本，它可以：

- 清理Docker缓存
- 预拉取基础镜像
- 检查项目结构
- 在本地环境尝试构建
- 修改构建脚本以便调试
- 使用优化的参数进行Docker构建

## 如何使用修复脚本

1. 确保脚本有执行权限：
   ```bash
   chmod +x fix-npm-build.sh
   ```

2. 运行脚本：
   ```bash
   ./fix-npm-build.sh
   ```

3. 脚本会自动执行一系列检查和修复步骤，并尝试构建Docker镜像

## 手动修复步骤

如果修复脚本不能解决问题，您可以尝试以下手动步骤：

### 1. 检查npm依赖

```bash
cd web
npm install
npm run build
```

检查是否有任何错误输出，并解决相关依赖问题。

### 2. 检查copy.js脚本

确保copy.js脚本存在并且可以正常工作：

```bash
node copy.js
```

### 3. 使用--no-cache重新构建

```bash
docker-compose build --no-cache
```

### 4. 检查构建日志

使用以下命令查看详细的构建日志：

```bash
DOCKER_BUILDKIT=1 docker build --progress=plain --no-cache .
```

## 常见问题

### 1. 内存不足

如果构建过程中出现内存不足的错误，可以尝试增加Docker的可用内存，或者在构建命令中添加`--memory=4g`参数。

### 2. 网络问题

如果构建过程中出现网络超时或连接问题，可以尝试使用国内镜像源或者配置Docker代理。

### 3. 文件权限问题

确保所有文件都有正确的权限，特别是脚本文件应该有执行权限。

## 联系支持

如果以上步骤都无法解决问题，请提供以下信息联系技术支持：

1. 完整的构建日志
2. Docker和docker-compose版本信息
3. 操作系统信息
4. 项目结构信息