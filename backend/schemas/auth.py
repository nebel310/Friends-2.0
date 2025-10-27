from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from .base import BaseModelWithDates




class SUserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    password_confirm: str
    is_confirmed: bool = False


class SUserLogin(BaseModel):
    email: EmailStr
    password: str


class SUser(BaseModelWithDates):
    id: int
    username: str
    email: EmailStr = 'noscope7529@gmail.com'
    is_confirmed: bool = False