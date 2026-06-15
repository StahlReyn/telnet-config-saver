from api.service_policy import get_service_policy, set_service_policy
from fastapi import FastAPI, Body # type: ignore
from pydantic import BaseModel # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore

app = FastAPI()
# py -m fastapi run api/main.py --host 192.168.197.241 --port 8000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            
    allow_credentials=False,          
    allow_methods=["*"],              # Allows all standard HTTP methods (GET, POST, etc.)
    allow_headers=["*"],              # Allows all headers
)

class DeviceConfig(BaseModel):
    device_type: str
    host: str
    username: str
    password: str
    secret: str
    port: int

class ServicePolicySingle(BaseModel):
    interface: str
    service_instance_id: int
    policy_name: str

class ServicePolicyPayload(BaseModel):
    device: DeviceConfig
    policy: ServicePolicySingle

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/interfaces")
def post_interfaces(device: DeviceConfig):
    try:
        output = get_service_policy(device.model_dump())
        return output
    except Exception as e:
        return {"error": str(e)}

@app.post("/config/service-policy/bandwidth")
def config_service_policy_bandwidth(payload: ServicePolicyPayload):
    device: DeviceConfig = payload.device
    policy: ServicePolicySingle = payload.policy
    try:
        output = set_service_policy(
            device=device.model_dump(), 
            interface=policy.interface,
            service_instance_id=policy.service_instance_id,
            policies={
                "input": f"police-{policy.policy_name}",
                "output": f"shape-{policy.policy_name}"
            }
        )
        return output
    except Exception as e:
        return {"error": str(e)}

@app.post("/config/service-policy/input")
def config_service_policy_input(payload: ServicePolicyPayload):
    device: DeviceConfig = payload.device
    policy: ServicePolicySingle = payload.policy
    try:
        output = set_service_policy(
            device=device.model_dump(), 
            interface=policy.interface,
            service_instance_id=policy.service_instance_id,
            policies={
                "input": policy.policy_name
            }
        )
        return output
    except Exception as e:
        return {"error": str(e)}

@app.post("/config/service-policy/output")
def config_service_policy_output(payload: ServicePolicyPayload):
    device: DeviceConfig = payload.device
    policy: ServicePolicySingle = payload.policy
    try:
        output = set_service_policy(
            device=device.model_dump(), 
            interface=policy.interface,
            service_instance_id=policy.service_instance_id,
            policies={
                "output": policy.policy_name
            }
        )
        return output
    except Exception as e:
        return {"error": str(e)}