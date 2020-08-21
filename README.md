
# appunti-web

https://beta.emilianomaccaferri.com

# TODO

* aes encryption in-db per i campi degli utenti (gdpr guyssss)
  

# Come fare le cosine

**IMPORTANTE: COMMITTARE CON `git commit --author="Nome &lt;email&gt;"`**<br>

Per modificare la configurazione usare il file `.env` sul server.<br>

Per guardare lo stato/l'output del processo fare `pm2 appunti-web logs`.<br>

VI PREGO COMMENTATE<br>

# API
## Base endpoint: `/`
### `/`

* Route di default (index)

* Non fa nulla in particolare
---
## Base endpoint `/auth`

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
---
## Base endpoint: `/notes`

### `GET /notes/:noteId`

##### Description
Gets information about the specified notes.

##### Response
```json
{
    "id": 11,
    "title": "Integrali generalizzati",
    "original_filename": "integrali_generalizzati.pdf",
    "uploaded_at": "2020-08-19T21:44:08.000Z",
    "storage_url": "/public/notes/a71bb01a8274c99f012cce000b3d5ce012bd195d3eb2bf36362bb6bf6c5a834eacafee82f9dbde2e9986a97aec5e4791689f92702a8ca6593c02083a85c87457.pdf",
    "subject_id": 1,
    "author_id": 11
}
```

### `POST /notes/`

##### Description

Reads the notes from the form-data channel and stores them within the /public folder.
There isn't any file-type check, thus notes can be of any kind of format (pdf, images or archives).

##### Body parameters
| Name | Type | Description | Required
| ---- | ---- | ----------- | --------
| notes | `file` | The notes file to upload. | Yes
| title | `string` | The title of the notes file that will be displayed. | Yes
| subjectId | `number` | The ID of the subject these notes refer to. | Yes

### `DELETE /notes/:noteId`

##### Description
Deletes the specified notes.

### `POST /notes/:noteId`

##### Description
Updates the specified notes. 

##### Body parameters
| Name | Type | Description | Required
| ---- | ---- | ----------- | --------
| title | `string` | The new title of the notes. | Yes
| subjectId | `number` | The ID of the new subject. | Yes

### `GET /notes/`

##### Description

Gets all the notes uploaded, with optional filters.

##### Query parameters

| Name | Type | Description | Required
| ---- | ---- | ----------- | --------
| subjectId | `number` | The ID of the subject of the notes to get. | No
| authorId | `string` | The ID of the author of the notes to get. | No
| authorId | `"asc" or "desc"`| Defines the way notes will be ordered (always by title). | No

##### Response
```json
[
    {
        "id": 11,
        "title": "Integrali generalizzati",
        "original_filename": "integrali_generalizzati.pdf",
        "uploaded_at": "2020-08-19T21:44:08.000Z",
        "storage_url": "/public/notes/a71bb01a8274c99f012cce000b3d5ce012bd195d3eb2bf36362bb6bf6c5a834eacafee82f9dbde2e9986a97aec5e4791689f92702a8ca6593c02083a85c87457.pdf",
        "subject_id": 1,
        "author_id": 11
    },
    {
        "id": 12,
        "title": "Analisi dei costi",
        "original_filename": "economia_analisi_costi_es1.pdf",
        "uploaded_at": "2020-08-19T22:42:59.000Z",
        "storage_url": "/public/notes/bb0f86b70cea87c36879ddfdeb4ff61309cf2c6c242ea771ac4648168b99285667f2c223c87abed698f4fd9888bd75190853599e899cf0f6dca10b54653f4308.pdf",
        "subject_id": 1,
        "author_id": 11
    }
]
```
