# Base endpoint: `/users`

### `GET /`
Retrieves the list of users created.

##### Query parameters
| Name | Type | Required 
| ---- | ----- | ------- 
| page | `number` | No 

##### Response
```json
{
    "success": true,
    "result": [
        {
            "id": "7b0e17bd33df21b194ea5675c91fa84aee982cc6dc2a103592250dc8a7ce3f2d",
            "admin": 0,
            "name": "Marco",
            "surname": "Rossi",
            "email": "marco.rossi@gmail.com",
            "unimore_id": "265116"
        }
    ]
}
```

---

### `GET /:user_id`
Gets information about the specified user.

##### Response
```json
{
    "success": true,
    "result": {
        "id": "7b0e17bd33df21b194ea5675c91fa84aee982cc6dc2a103592250dc8a7ce3f2d",
        "admin": 0,
        "password": "$2a$08$.lvdSAYBv/3CpJqmP0mJRemXGlReyAcvSqYiT1EkIuxNecpH1Oryi",
        "name": "Marco",
        "surname": "Rossi",
        "email": "marco.rossi@gmail.com",
        "unimore_id": "265116"
    }
}
```

---

### `POST /:user_id`
Updates the personal information of the specified user.

##### Constraints
* Auth required.
* Admin required if the user being updated doesn't correspond to the logged in user.

##### Parameters
| Name | Type | Required | Available |
| ---- | ----- | ------- | --------- |
| name | string | No | Always |
| surname | string | No | Always |
| unimore_id | int | No | Always |
| password | string | No | Only if admin |
| admin | int | No | Only if admin |

##### Response
```json
{
    "success": true,
}
```

---

### `POST /:user_id/password`
Updates the specified user's password.

##### Constraints
* Auth required.
* Admin required if the user being updated doesn't correspond to the logged in user.

##### Parameters
| Name | Type | Required |
| ---- | ----- | ------- |
| old_password | string | Yes if not admin |
| new_password | string | Yes |

##### Response
```json
{
    "success": true,
}
```

---

### `DELETE /:user_id`
Deletes the specified user.

##### Constraints
* Auth required.
* Require admin.

##### Response
```json
{
    "success": true
}
```
