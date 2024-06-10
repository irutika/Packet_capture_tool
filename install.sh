#!/bin/bash

exec 2>$(pwd)/error.log  

#install gcc compiler and development libraries for python3
yum install gcc python3-devel

# Install Python and pip
yum install -y python3 python3-pip

# Install Flask and other Python dependencies
/usr/bin/pip3 install Flask waitress psutil

# Install datetime  
/usr/bin/pip3 install datetime

# Install tzlocal
/usr/bin/pip3 install tzlocal

#tcpdump installation
rpm -qa | grep -qw tcpdump || yum install -y tcpdump

#permission
chmod +x app.py

chmod +x firewallConfig.sh

#moving files and creating directory if necessary
mkdir -p /bizrtc/bizcapturetool/capture_files
mkdir -p /bizrtc/bizcapturetool && cp -r app.py config.ini firewallConfig.sh  error.log static templates /bizrtc/bizcapturetool

./firewallConfig.sh

#permission
sudo chmod u+w /bizrtc/bizcapturetool/capture_files/  # Grant write for user

#copy service file to systemd
cp bizcapture.service /etc/systemd/system/ 

#reload 
systemctl daemon-reload

#enable service
systemctl enable bizcapture

#start service
systemctl start bizcapture

tput setaf 2; echo "Note:The application runs on port 5000 by default. If you wish to configure or change the port, please edit the 'config.ini'file in the bizrtc/bizcapturetool directory accordingly.After making any changes to the port in config.ini, be sure to run the script ./firewallConfig.sh to update the firewall rules accordingly.To start/stop/check bizcapture service: systemctl start/stop/status bizcapture.service."; tput sgr0 

