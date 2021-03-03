#!/bin/bash

set -i
source ~/.bashrc
cd ~/NTU/semmed-label-system
git checkout main
git pull
npm install
npm run build

if [[ ! $(pm2 pid LabelSystem) ]]
then
    pm2 start npm --name LabelSystem -- start --watch
else
    pm2 restart LabelSystem
fi

if [[ ! $(pm2 pid ApiServer) ]]
then
    pm2 start npm --name ApiServer -- run api --watch
else
    pm2 restart ApiServer
fi