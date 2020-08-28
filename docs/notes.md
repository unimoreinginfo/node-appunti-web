## Base endpoint: `/notes`

### `GET /notes/:id`

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
| subject_id | `number` | The ID of the subject these notes refer to. | Yes

### `DELETE /notes/:id`

##### Description
Deletes the specified notes.

### `POST /notes/:noteId`

##### Description
Updates the specified notes. 

##### Body parameters
| Name | Type | Description | Required
| ---- | ---- | ----------- | --------
| title | `string` | The new title of the notes. | Yes
| subject_id | `number` | The ID of the new subject. | Yes

### `GET /notes/:page`

##### Description

Gets all the notes uploaded 10 by 10, with optional filters.

##### Query parameters

| Name | Type | Description | Required | Default
| ---- | ---- | ----------- | --------
| subject_id | `number` | The ID of the subject of the notes to get. | No
| author_id | `string` | Note author's ID | No
| order_by | `"asc" or "desc"`| Defines the way notes will be ordered (always by title). | No

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
### `GET /notes/search`

##### Description

Searches by title

##### Query parameters

| Name | Type | Description | Required | Default
| ---- | ---- | ----------- | --------
| q | `string` | Search query | Yes

##### Response
```json
[
    {
	    "id": "035fef01806ddfb9faa6c315e1089133eda2f11c49ad7aaccebc5d5b34a8b77784fd4e1fae8798bf5c85fcd57757a8da79217d296169d936a070aa812c9aa88e",
	    "title": "risultati scritto lesssssgooo",
	    "subject_id": 3
    }
]
```
### `GET /:subject_id/:note_id`

##### Description

Gets info about a certain note (identified by subject_id and note_id)

##### Query parameters
None
##### Response
```json
{
  "result": 
    {
      "note_id": "035fef01806ddfb9faa6c315e1089133eda2f11c49ad7aaccebc5d5b34a8b77784fd4e1fae8798bf5c85fcd57757a8da79217d296169d936a070aa812c9aa88e",
      "title": "risultati scritto lesssssgooo",
      "uploaded_at": "2020-08-28T17:23:32.000Z",
      "storage_url": "/public/notes/035fef01806ddfb9faa6c315e1089133eda2f11c49ad7aaccebc5d5b34a8b77784fd4e1fae8798bf5c85fcd57757a8da79217d296169d936a070aa812c9aa88e",
      "subject_id": 3,
      "author_id": "a55746552a3404ad989cd4249e6accd7d357b3309952fdf97620092cda32cb81"
    }
  ],
  "files": [
    "01_Risultati Scritto del 07.01.2020.pdf"
  ]
}
```
