@ECHO OFF
@REM Maven Wrapper startup script for Windows (classic self-contained variant)
SETLOCAL

SET WRAPPER_JAR="%~dp0.mvn\wrapper\maven-wrapper.jar"
SET WRAPPER_PROPS="%~dp0.mvn\wrapper\maven-wrapper.properties"

IF NOT EXIST %WRAPPER_JAR% (
  ECHO Downloading Maven Wrapper jar...
  FOR /F "usebackq tokens=1,2 delims==" %%A IN (%WRAPPER_PROPS%) DO (
    IF "%%A"=="wrapperUrl" SET WRAPPER_URL=%%B
  )
  powershell -Command "Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile %WRAPPER_JAR%"
)

IF NOT "%JAVA_HOME%"=="" (
  SET JAVA_EXE=%JAVA_HOME%\bin\java.exe
) ELSE (
  SET JAVA_EXE=java
)

"%JAVA_EXE%" -classpath %WRAPPER_JAR% "-Dmaven.multiModuleProjectDirectory=%~dp0" org.apache.maven.wrapper.MavenWrapperMain %*

ENDLOCAL
