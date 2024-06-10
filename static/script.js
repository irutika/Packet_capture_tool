document.addEventListener('DOMContentLoaded', function() {
    
    const tcpCheckbox = document.getElementById('tcpCheckbox');
    const udpCheckbox = document.getElementById('udpCheckbox');
    const protocolRadio = document.getElementById('protocolRadio');
    const customRadio = document.getElementById('customRadio');
    const allFilterInput = document.getElementById('allFilter');
    const customFilter = document.getElementById('customFilter');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const captureStatus = document.getElementById('captureStatus');
    const interfaceDropdown = document.getElementById('interfaceDropdown');
	const currentTimeElement = document.getElementById('current-time');


    customFilter.disabled = true;
	allFilterInput.checked = true;
	
    
    protocolRadio.addEventListener('change', function () {
      if (protocolRadio.checked) {
        customRadio.checked = false;
        customFilter.disabled = true;
        tcpCheckbox.disabled = false;
        udpCheckbox.disabled = false;
        allFilterInput.checked = false;
        customFilter.value = ''; 
      }
    });

    customRadio.addEventListener('change', function () {
      if (customRadio.checked) {
        protocolRadio.checked = false;
        tcpCheckbox.disabled = true;
        udpCheckbox.disabled = true;
        tcpCheckbox.checked = false;
        udpCheckbox.checked = false;
        customFilter.disabled = false;
        allFilterInput.checked = false;
        customFilter.value = ''; 
      }
    });

    allFilterInput.addEventListener('change', function () {
      if (allFilterInput.checked) {
        tcpCheckbox.disabled = true;
        udpCheckbox.disabled = true;
        tcpCheckbox.checked = false;
        udpCheckbox.checked = false;
        customFilter.disabled = true;
        customFilter.value = '';
        selectedFilters = [];

      } else {
        protocolRadio.disabled = false;
        customRadio.disabled = false;
        if (protocolRadio.checked) {
          tcpCheckbox.disabled = false;
          udpCheckbox.disabled = false;
        } else if (customRadio.checked) {
          customFilter.disabled = false;
        }
      }
    });

    tcpCheckbox.addEventListener('change', updateSelectedFilters);
    udpCheckbox.addEventListener('change', updateSelectedFilters);
    customFilter.addEventListener('input', function () {
      if (customRadio.checked) {
        updateSelectedFilters();
      }
    });

    let selectedFilters = [];
    function updateSelectedFilters() {
      selectedFilters = [];
      if (tcpCheckbox.checked) selectedFilters.push('tcp');
      if (udpCheckbox.checked) selectedFilters.push('udp');
      if (customRadio.checked && customFilter.value.trim() !== '') {
        selectedFilters.push(customFilter.value.trim());
      }
    }

    
    function startCapture() {
	  downloadBtn.disabled = true;	
      const selectedInterface = interfaceDropdown.value;
      
	  if (protocolRadio.checked && selectedFilters.indexOf('tcp')===-1 && selectedFilters.indexOf('udp')===-1) {
		  alert("Please select atleast one protocol (TCP or UDP).");
		  return;
	  }
	  
	  if (customRadio.checked && customFilter.value.trim()==='') {
		  alert("Please enter a custom filter.");
		  return;
	  }
	  
	  let url = `/bizcapture?capture=ON&interface=${selectedInterface}`;

      if (selectedFilters.length > 0) {
        url += `&protocol=${selectedFilters.join(',')}`;
      }
	  

      fetch(url, {
        method: 'GET',
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            updateUI(data.status, data.success);
          } else {
            updateUI("Error: " + data.status, data.success); 
          }
        })
        .catch(error => {
          alert('An error occurred while starting the capture.');
          console.error('Error:', error);
        });
      }


    function stopCapture() {
      fetch('/bizcapture?capture=OFF', {
        method: 'GET',
      })
        .then(response => response.json())
        .then(data => updateUI(data.status, data.success))
        .catch(error => {
          alert('An error occurred while stopping the capture.');
          console.error('Error:', error);
        });
    }


    function downloadCapture() {
      window.location.href = '/bizcapture?capture=download';
    }

    function checkCaptureStatus() {
      fetch('/capture_status', {
        method: 'GET',
      })
        .then(response => response.json())
        .then(data => updateUI(data.status, data.success))
        .catch(error => console.error('Error:', error));
    }
	
	
    function updateUI(status, success) {
      captureStatus.textContent = status;
      if (success) {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        downloadBtn.disabled = true;
      } else {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        downloadBtn.disabled = false;
      }
    }
	
	downloadBtn.disabled = true;
    
    setInterval(checkCaptureStatus, 1000);
   
    startBtn.addEventListener('click', startCapture);
    stopBtn.addEventListener('click', stopCapture);
    downloadBtn.addEventListener('click', downloadCapture);
});

