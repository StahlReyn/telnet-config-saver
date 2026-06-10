from api.service_policy import get_service_policy
from fastapi import FastAPI # type: ignore

app = FastAPI()

TEST_DEVICE = {
    'device_type': 'cisco_ios_telnet',
    'host': '172.19.20.218',
    'username': 'cisco',
    'password': 'cisco',
    'secret': 'cisco', # Cisco enable mode
    'port': 30001,
}

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/interfaces")
def read_item():
    output = get_service_policy(TEST_DEVICE)
    return output