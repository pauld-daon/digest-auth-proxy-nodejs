del "logs\*" /Q
del "npm-debug.log" /Q
del "Digest_Auth_Proxy_NodeJS.zip" /Q
zip -r Digest_Auth_Proxy_NodeJS.zip . --exclude "*.git" "node_modules/*" "README.pdf" "release.bat"