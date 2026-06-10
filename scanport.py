import socket
from concurrent.futures import ThreadPoolExecutor
from printutil import print_with_timestamp

PORT_TIMEOUT = 1.0              # Seconds to wait for a response
MAX_WORKER = 100             # Max threads for scanning ports

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