@echo off
REM jog.gov.hu lokalis tukor - dupla kattintasra elindul es megnyilik a bongeszoben.
REM (npm nelkul is mukodik; a serve.py inditja a szervert + nyitja a bongeszot)
python "%~dp0scripts\serve.py"
pause
