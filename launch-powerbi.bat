@echo off
echo ========================================================
echo Launching Microsoft Power BI Desktop...
echo Datasets folder: %~dp0data\raw
echo DAX measures:    %~dp0powerbi\measures\dax_measures.dax
echo Setup guide:     %~dp0powerbi\reports-guide\powerbi_setup_guide.md
echo ========================================================

if exist "C:\Program Files\Microsoft Power BI Desktop\bin\PBIDesktop.exe" (
    start "" "C:\Program Files\Microsoft Power BI Desktop\bin\PBIDesktop.exe"
) else (
    echo Opening Power BI Desktop...
    start pbit:
)

pause
