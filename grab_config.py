import sys
import re
from netmiko import ConnectHandler
from netmiko.exceptions import NetmikoTimeoutException, NetmikoAuthenticationException
from datetime import datetime
from pathlib import Path

# Define device connection parameters
# Change 'cisco_ios_telnet' to 'hp_procurve_telnet', 'juniper_junos_telnet', etc., if needed.
device = {
    'device_type': 'cisco_ios_telnet',
    'host': '172.19.20.218',
    'username': 'admin',
    'password': 'pnet',
    'secret': 'any', # Cisco enable mode
    'port': 30001,
}

port_list = [30001, 30006, 30002, 30005]

import socket
from concurrent.futures import ThreadPoolExecutor

# Target settings
PORT_START = 30000
PORT_END = 30030            # max is 65535
TIMEOUT = 1.0              # Seconds to wait for a response

def check_port(host, port):
    """Attempts a TCP connection to verify if a port is open."""
    # AF_INET specifies IPv4, SOCK_STREAM specifies TCP
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(TIMEOUT)
        # connect_ex returns 0 if the connection succeeded
        result = sock.connect_ex((host, port))
        if result == 0:
            return port
    return None

def scan_ports(host, start, end):
    print(f"Scanning {host} from port {start} to {end}...")
    open_ports = []
    
    # Use a thread pool to test multiple ports in parallel
    with ThreadPoolExecutor(max_workers=100) as executor:
        # Map the check_port function across the desired port range
        futures = [executor.submit(check_port, host, port) for port in range(start, end + 1)]
        
        for future in futures:
            port = future.result()
            if port is not None:
                print(f"[+] Port {port} is OPEN")
                open_ports.append(port)
                
    return open_ports

def main():
    cur_path = create_folder_structure(base_path="output")

    discovered = scan_ports(device['host'], PORT_START, PORT_END)
    print(f"\nScan complete. Discovered open ports: {discovered}")
    port_list = discovered

    for port in port_list:
        device['port'] = port
        print(f"\nAttempting to connect to {device['host']} on port {port}...")
        try:
            grab_config(device=device, filepath=cur_path)
        except NetmikoTimeoutException:
            print("Error: Connection timed out. Check the IP address or network connectivity.")
        except NetmikoAuthenticationException:
            print("Error: Authentication failed. Verify username and passwords.")
        except Exception as e:
            print(f"An unexpected error occurred: {e}")

def create_folder_structure(base_path):
    # Output folder
    cur_path = Path(base_path)
    cur_path.mkdir(parents=True, exist_ok=True)

    # Year and Month Number inside Output
    year_month_name = datetime.now().strftime("%Y-%m")
    cur_path = cur_path / year_month_name
    cur_path.mkdir(parents=True, exist_ok=True)

    # Day Folder inside month
    day_folder = datetime.now().strftime("%d")
    cur_path = cur_path / day_folder
    cur_path.mkdir(parents=True, exist_ok=True)
    return cur_path

def grab_config(device, filepath=None):
    print(f"Connecting to {device['host']} via Telnet...")
    # Establish connection
    net_connect = ConnectHandler(**device)
    net_connect.enable()

    # Get the prompt and strip the ending character (e.g., '>' or '#')
    raw_prompt = net_connect.find_prompt()
    hostname = re.sub(r'(\([^)]+\))?[#>]', '', raw_prompt)
    print("Got Hostname: " + hostname)
    
    print("Retrieving configuration...")
    config_output = net_connect.send_command("show running-config")
    
    # Save the output to a local text file
    filename = filepath / f"config_{device['port']}_{hostname}.ios"
    with open(filename, "w") as f:
        f.write(config_output)
        
    print(f"Success! Configuration saved to {filename}")
    
    # Close connection cleanly
    net_connect.disconnect()

if __name__ == "__main__":
    main()