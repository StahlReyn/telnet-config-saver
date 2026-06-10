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
PORT_TIMEOUT = 1.0              # Seconds to wait for a response
MAX_WORKER = 100             # Max threads for scanning ports
CONFIG_TIMEOUT = 30.0            # Seconds to wait for config retrieval

COLOR_RESET = "\033[0m"
COLOR_RED = "\033[31m"

def print_with_timestamp(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    print(f"[{timestamp}] {message}")

# Print Error with Red Color
def print_error(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    print(f"{COLOR_RED}[{timestamp}] ERROR: {message}{COLOR_RESET}", file=sys.stderr)

def check_port(host, port):
    """Attempts a TCP connection to verify if a port is open."""
    # AF_INET specifies IPv4, SOCK_STREAM specifies TCP
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(PORT_TIMEOUT)
        # connect_ex returns 0 if the connection succeeded
        result = sock.connect_ex((host, port))
        if result == 0:
            return port
    return None

def scan_ports(host, start, end):
    print_with_timestamp(f"Scanning {host} from port {start} to {end}...")
    open_ports = []
    
    # Use a thread pool to test multiple ports in parallel
    with ThreadPoolExecutor(max_workers=MAX_WORKER) as executor:
        # Map the check_port function across the desired port range
        futures = [executor.submit(check_port, host, port) for port in range(start, end + 1)]
        
        for future in futures:
            port = future.result()
            if port is not None:
                print_with_timestamp(f"[+] Port {port} is OPEN")
                open_ports.append(port)
                
    return open_ports

def main():
    cur_path = create_folder_structure(base_path="output")

    discovered = scan_ports(device['host'], PORT_START, PORT_END)
    print_with_timestamp(f"Scan complete. Discovered open ports: {discovered}")
    port_list = discovered

    # Submit config collection for each open port in parallel
    with ThreadPoolExecutor(max_workers=min(MAX_WORKER, len(port_list) or 1)) as executor:
        futures = []

        for port in port_list:
            port_device = {**device, 'port': port}
            print_with_timestamp(f"Submitting connection to {port_device['host']} on port {port}...")
            futures.append(executor.submit(grab_config, device=port_device, filepath=cur_path))

        for future in futures:
            try:
                future.result()
            except NetmikoTimeoutException:
                print_error("Connection timed out. Check the IP address or network connectivity.")
            except NetmikoAuthenticationException:
                print_error("Authentication failed. Verify username and passwords.")
            except Exception as e:
                print_error(f"An unexpected error occurred: {e}")

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
    print_with_timestamp(f"Connecting to {device['host']} via Telnet...")
    # Establish connection
    net_connect = ConnectHandler(**device)
    net_connect.enable()
    net_connect.set_base_prompt()

    hostname = net_connect.base_prompt
    print_with_timestamp("Got Hostname: " + hostname + " | Retrieving configuration...")
    config_output = net_connect.send_command("show running-config", read_timeout=CONFIG_TIMEOUT)
    
    # Save the output to a local text file
    filename = filepath / f"config_{device['port']}_{hostname}.ios"
    with open(filename, "w") as f:
        f.write(config_output)
        
    print_with_timestamp(f"Success! Configuration saved to {filename}")
    
    # Close connection cleanly
    net_connect.disconnect()

if __name__ == "__main__":
    main()