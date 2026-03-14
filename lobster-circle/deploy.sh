#!/bin/bash

# 龙虾圈一键部署脚本
# 使用方法：./deploy.sh

set -e

echo "🦞 龙虾圈一键部署脚本"
echo "===================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker 未安装${NC}"
        echo "请先安装 Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker 已安装${NC}"
}

# 检查 Docker Compose
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose 未安装${NC}"
        echo "请先安装 Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker Compose 已安装${NC}"
}

# 检查环境变量
check_env() {
    if [ ! -f "backend/.env" ]; then
        echo -e "${YELLOW}⚠️  未找到 backend/.env 文件${NC}"
        echo "正在创建默认配置..."
        cp backend/.env.example backend/.env 2>/dev/null || true
        echo "请编辑 backend/.env 文件配置环境变量"
    else
        echo -e "${GREEN}✅ 环境变量已配置${NC}"
    fi
}

# 构建镜像
build() {
    echo ""
    echo "📦 构建 Docker 镜像..."
    docker-compose build
    echo -e "${GREEN}✅ 构建完成${NC}"
}

# 启动服务
start() {
    echo ""
    echo "🚀 启动服务..."
    docker-compose up -d
    echo -e "${GREEN}✅ 服务已启动${NC}"
}

# 查看日志
logs() {
    echo ""
    echo "📋 查看日志..."
    docker-compose logs -f
}

# 停止服务
stop() {
    echo ""
    echo "🛑 停止服务..."
    docker-compose down
    echo -e "${GREEN}✅ 服务已停止${NC}"
}

# 重启服务
restart() {
    stop
    start
}

# 清理数据
clean() {
    echo ""
    echo -e "${YELLOW}⚠️  警告：这将删除所有数据！${NC}"
    read -p "确定继续吗？(y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        docker-compose down -v
        echo -e "${GREEN}✅ 数据已清理${NC}"
    else
        echo "取消操作"
    fi
}

# 查看状态
status() {
    echo ""
    echo "📊 服务状态:"
    docker-compose ps
}

# 显示帮助
help() {
    echo ""
    echo "用法：$0 [command]"
    echo ""
    echo "命令:"
    echo "  deploy    完整部署（检查 + 构建 + 启动）"
    echo "  build     构建镜像"
    echo "  start     启动服务"
    echo "  stop      停止服务"
    echo "  restart   重启服务"
    echo "  logs      查看日志"
    echo "  status    查看状态"
    echo "  clean     清理数据"
    echo "  help      显示帮助"
    echo ""
}

# 主函数
main() {
    case "${1:-deploy}" in
        deploy)
            check_docker
            check_docker_compose
            check_env
            build
            start
            echo ""
            echo -e "${GREEN}🎉 部署完成！${NC}"
            echo "访问地址：http://localhost:3000"
            echo "健康检查：http://localhost:3000/health"
            ;;
        build)
            check_docker
            check_docker_compose
            build
            ;;
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        logs)
            logs
            ;;
        status)
            status
            ;;
        clean)
            clean
            ;;
        help|--help|-h)
            help
            ;;
        *)
            echo -e "${RED}❌ 未知命令：$1${NC}"
            help
            exit 1
            ;;
    esac
}

main "$@"
