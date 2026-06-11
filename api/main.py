from api.service_policy import get_service_policy, set_service_policy_bandwidth
from fastapi import FastAPI # type: ignore
from pydantic import BaseModel # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore

app = FastAPI()

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

class ServicePolicyConfig(BaseModel):
    interface: str
    service_instance_id: int
    bandwidth: str
    
@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/interfaces")
def read_item(device: DeviceConfig):
    try:
        output = get_service_policy(device.model_dump())
        return output
    except Exception as e:
        return {"error": str(e)}

@app.post("/config/service-policy-bandwidth")
def config_service_policy_bandwidth(device: DeviceConfig, service_policy: ServicePolicyConfig):
    try:
        output = set_service_policy_bandwidth(
            device.model_dump(), 
            service_policy.model_dump()
        )
        return output
    except Exception as e:
        return {"error": str(e)}