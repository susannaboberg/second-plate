#!/bin/bash

# Run this on your local machine where you want to use the web browser
# You want to connect to the machine where you started running server.js
# Replace 3100 with your port number which needs to match PORT in the .env file where server.js is running
ssh -L 5104:localhost:3100 CSUSERID@CSLINUXMACHINE.cs.williams.edu

# Once you've got server.js running and have done this ssh command you can connect
# through your web browser on your local machine at localhost:3100

