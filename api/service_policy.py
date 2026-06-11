from netmiko import ConnectHandler
from netmiko.exceptions import NetmikoTimeoutException, NetmikoAuthenticationException
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

# Define device connection parameters
# Change 'cisco_ios_telnet' to 'hp_procurve_telnet', 'juniper_junos_telnet', etc., if needed.
TEST_DEVICE = {
    'device_type': 'cisco_ios_telnet',
    'host': '172.19.20.218',
    'username': 'cisco',
    'password': 'cisco',
    'secret': 'cisco', # Cisco enable mode
    'port': 30001,
}

SHOW_TIMEOUT = 20.0

# Example:
# interface Loopback0
# interface GigabitEthernet1
# interface GigabitEthernet2
# interface GigabitEthernet3
#  description *** VPN1234 MTS ***
#  service instance 1 ethernet
#   description *** VPN1234 MTS ***
#   service-policy input police-20M
#   service-policy output shape-20M
#  service instance 2 ethernet
#   description *** VPN1234 MTS ***
# interface GigabitEthernet4
#  description *** VPN4321 STS ***
#  service instance 1 ethernet
#   description *** VPN4321 STS ***
#   service-policy input police-10M
#   service-policy output shape-10M
#  service instance 2 ethernet
#   description *** VPN4321 STS ***
# interface BDI100
#  passive-interface Loopback0


def get_service_policy(device):
    print("Connecting...")
    net_connect = ConnectHandler(**device)

    if not net_connect.check_enable_mode():
        net_connect.enable()

    print("Getting Output...")
    raw_output = net_connect.send_command(
        "show running-config | include interface|description|service instance|service-policy",
        read_timeout=SHOW_TIMEOUT,
        use_textfsm=True,
    )

    print("Got Output:")
    output = {}
    if type(raw_output) is str:
        output = parse_raw_output(raw_output)
    else:
        print("Error: Non String Raw Output")

    net_connect.disconnect()
    return output

def parse_raw_output(raw_output:str):
    lines = raw_output.split("\n")
    cur_interface = {}
    cur_service_instance = {}
    output = {}
    for line in lines:
        line = line.strip()
        tokens = line.split(" ")
        match tokens[0]:
            case "interface":
                cur_interface = {
                    'description': '',
                    'service_instance': []
                }
                output[tokens[1]] = cur_interface
                cur_service_instance = None
            case "service": # service instance gets split to 2
                cur_service_instance = {
                    'id': int(tokens[2]),
                    'service-policy': {}
                }
                cur_interface['service_instance'].append(cur_service_instance)
            case "service-policy":
                if cur_service_instance is None:
                    print("No service instance before service-policy")
                else:
                    cur_service_instance['service-policy'][tokens[1]] = tokens[2]
            case "description":
                desc = line.split(" ", 1)[1] # Description may contain space, only separate first
                if cur_service_instance is not None:
                    cur_service_instance["description"] = desc
                else:
                    cur_interface["description"] = desc
    return output

def set_service_policy_bandwidth(device, service_policy):
    interface: str = service_policy["interface"]
    service_instance_id: int = service_policy["service_instance_id"]
    bandwidth: str = service_policy["bandwidth"]

    print("Connecting...")
    net_connect = ConnectHandler(**device)

    if not net_connect.check_enable_mode():
        net_connect.enable()
    
    print("Find Current Config")
    current_policy_lines = get_current_policy(net_connect, interface, service_instance_id)
    
    print("Sending Config...")
    commands = [
        f"interface {interface}",
        f"service instance {service_instance_id} ethernet",
    ]

    for line in current_policy_lines:
        commands.append(f"no {line}")
    
    commands.append(f"service-policy input police-{bandwidth}")
    commands.append(f"service-policy output shape-{bandwidth}")

    print(commands)
    net_connect.send_config_set(commands)
    net_connect.disconnect()

def get_current_policy(net_connect, interface, service_instance_id):
    current_policy_lines = []
    show_command = f"show running-config interface {interface} | section service instance {service_instance_id} ethernet"
    print(show_command)
    raw_output = net_connect.send_command(
        show_command,
        read_timeout=SHOW_TIMEOUT
    )

    print(raw_output)
    raw_output_lines = raw_output.split("\n")
    for line in raw_output_lines:
        line = line.strip()
        if line.startswith("service-policy"):
            current_policy_lines.append(line)
    return current_policy_lines

def main():
    output = get_service_policy(TEST_DEVICE)
    print(output)

if __name__ == "__main__":
    main()