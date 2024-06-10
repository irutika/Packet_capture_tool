#!/bin/bash

port=$(awk -F= '/^port/ {print $2}' config.ini)


sed -i "71i-A RH-Firewall-1-INPUT -p tcp --dport $port -j ACCEPT" /etc/sysconfig/iptables
/user/bin/service iptables restart

firewall-cmd --permanent --add-port="$port"/tcp

firewall-cmd --reload


