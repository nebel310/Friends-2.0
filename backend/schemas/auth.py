from pydantic import BaseModel, ConfigDict, EmailStr
from .base import BaseModelWithDates




class SUserRegister(BaseModel):
    username: str
    email: EmailStr = 'onlyreal@gmail.com'
    password: str
    password_confirm: str
    is_confirmed: bool = True


class SUserLogin(BaseModel):
    email: EmailStr
    password: str


class SUser(BaseModelWithDates):
    id: int
    username: str
    email: EmailStr
    is_confirmed: bool = False