@echo off
REM Batch script to run the exportApp.js Node.js script

REM Define default paths
SET "APP_DIR=hype-studio"
SET "OUTPUT_FILE=combinedHypeStudio.txt"

REM Check if the first argument (application directory) is provided
IF NOT "%~1"=="" (
    SET "APP_DIR=%~1"
)

REM Check if the second argument (output file path) is provided
IF NOT "%~2"=="" (
    SET "OUTPUT_FILE=%~2"
)

REM Run the Node.js script with the specified or default arguments
node packager.js --appDir "%APP_DIR%" --outputFile "%OUTPUT_FILE%"

REM Pause the script to keep the command prompt window open
pause
