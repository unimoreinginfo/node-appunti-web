## Base endpoint `/auth`

### `POST /auth/register`
### Description
* Register
##### Body parameters

| Name | Type | Description | Required
| ---- | ---- | ----------- | --------
| email | `string` | User's email. | Yes
| name | `string` | User's first name | Yes
| surname | `string` | User's surname | Yes
| password | `string` | User's password | Yes
| unimore_id | `string` | User's UnimoreID | No

#### Response
```json
{
    "success": true
}
```

#### Response
```json
{
    "success": true,
    "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1OTgwMDg4NzAsImV4cCI6MTU5ODAxNjA3MH0.iA76ces4ebpK22cInRSQP2sq5L29EKD-4JeyO7T_2H8",
    "refresh_token_expiry": "1600600871"
}
```

### `POST /auth/login`
### Description
* User login
##### Body parameters

| Name | Type | Description | Required
| ---- | ---- | ----------- | --------
| email | `string` | User's email. | Yes
| password | `string` | Users's password | Yes

#### Response
```json
{
    "success": true,
    "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1OTgwMDg4NzAsImV4cCI6MTU5ODAxNjA3MH0.iA76ces4ebpK22cInRSQP2sq5L29EKD-4JeyO7T_2H8",
    "refresh_token_expiry": "1600600871"
}
```

### `POST /auth/user`
### Description
* Gets logged user
##### Body parameters
None

#### Response
```json
{
    "success": true,
    "result": {
        "id": "a55746552a3404ad989cd4249e6accd7d357b3309952fdf97620092cda32cb81",
        "admin": 0,
        "name": "Emiliano",
        "surname": "Maccaferri",
        "email": "inbox@emilianomaccaferri.com",
        "unimore_id": "272244"
    }
}
```

