@echo off
echo ============================================
echo 寝室大亨 - 上传到GitHub
echo ============================================
echo.
echo 请按以下步骤操作：
echo.
echo 1. 确保你已在GitHub创建仓库：https://github.com/new
echo    仓库名：dorm-tycoon
echo.
echo 2. 本项目路径：%CD%
echo.
echo 3. 按任意键开始推送...
pause > nul
echo.
echo 正在推送到GitHub...
git push -u origin main
echo.
echo ============================================
echo.
echo 推送完成！
echo 访问你的仓库：https://github.com/wangziyue0319-jpg/dorm-tycoon
echo.
pause
