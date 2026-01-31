export interface registerNewUserRequestBody {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
}

export interface loginUserRequestBody {
  email: string;
  password: string;
}
