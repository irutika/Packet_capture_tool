from flask import Flask, render_template, jsonify, send_file, request
from waitress import serve
import subprocess
import psutil
import os
import configparser
import logging
import threading
from datetime import datetime
import tzlocal


logging.basicConfig(level=logging.DEBUG)

config = configparser.ConfigParser()
config.read("config.ini")

app = Flask(__name__)
app.template_folder = os.path.join(os.path.dirname(__file__), 'templates')

capture_path = '/bizrtc/bizcapturetool/capture_files/capture.pcap'
capture_process = None
capture_error = []
 

@app.route('/bizcapture', methods=['GET'])
def biz_capture():
    action = request.args.get("capture")
    interface = request.args.get("interface", "any")
    filters = request.args.getlist("protocol")
    custom = request.args.get('customFilter')
    
    for i in range(len(filters)):
        filters[i] = filters[i].replace(",", " or ") 
                  
    if action == "ON":
        return start_capture(interface, filters, custom)
    elif action == "OFF":
        return stop_capture()
    elif action == "download":
        return download_capture()
    else:
        return jsonify(status="Invalid input.", success=False)
        
       
@app.route('/', methods=['GET'])
def index():
    now = datetime.now(tzlocal.get_localzone())
    date_time = now.strftime("%a %b %d %H:%M:%S %Z %Y")
    
    interfaces = get_network_interfaces()
    return render_template("index.html", interfaces=interfaces, date_time=date_time)    
    
    
def start_capture_thread(interface, filters, custom):
    global capture_process, capture_error

    cmd = ['tcpdump', '-i', interface, '-w', capture_path]
        
    if filters:
         cmd.extend(filters)
            
    if custom:
         cmd.extend(custom) 
         
    print(cmd)   
    
    try:
       subprocess.run(cmd, check=True)
       capture_error = []
       capture_process = True

    except subprocess.CalledProcessError as e:
       capture_error.append(str(e))
       capture_process = False
       print(capture_error)

      
@app.route('/start_capture', methods=['POST'])
def start_capture(interface, filters, custom):
    global capture_process, capture_error
 
    if not capture_process:
        capture_error.clear()
        capture_thread = threading.Thread(target=start_capture_thread, args=(interface, filters, custom))
        capture_thread.start()
        capture_process = True
        return jsonify(status="Capture started.", success=True)

    return jsonify(status="Capture is already running.", success=False)


@app.route('/stop_capture', methods=['POST'])
def stop_capture():
    global capture_process
   
    if capture_process:
        subprocess.run(['pkill', '-f', 'tcpdump'])
        capture_process = False
        return jsonify(status="Capture stopped.", success=True)
        
    return jsonify(status="Capture is not running.", success=False)
    

@app.route("/download_capture", methods=['GET'])
def download_capture():
    if os.path.exists(capture_path):
        return send_file(capture_path, as_attachment=True)
    else:
        return jsonify(status="Capture file not found", success=False)

  
@app.route("/capture_status", methods=["GET"])
def capture_status():
    global capture_process, capture_error
       
    if capture_error and capture_error[-1]:
        return jsonify(status="Error: " + capture_error[-1], success=False)

    if capture_process:
   
        if any(p.name() == "tcpdump" for p in psutil.process_iter()):
           return jsonify(status="Capture is running.", success=True)
        else:
           capture_process = False
           return jsonify(status="Capture stopped.", success=False)
           
    else:
        return jsonify(status="Capture is not running.", success=False)
            
            
def get_network_interfaces():
    interfaces = list(psutil.net_if_addrs().keys())
    return interfaces
    
     
if __name__ == '__main__':
    app.debug = True
    serve(app, host=config['Server']['bind_address'], port=int(config['Server']['port']))



