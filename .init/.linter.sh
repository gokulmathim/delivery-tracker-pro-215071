#!/bin/bash
cd /home/kavia/workspace/code-generation/delivery-tracker-pro-215071/delivery_tracker_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

