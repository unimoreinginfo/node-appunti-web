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

| Name | Type | Description | Required 
| ---- | ---- | ----------- | --------
| subject_id | `number` | The ID of the subject of the notes to get. | No
| author_id | `string` | Note author's ID | No
| order_by | `"asc" or "desc"`| Defines the way notes will be ordered (always by title). | No

##### Response
```json
[
    {
        "number": 1,
        "note_id": "035fef01806ddfb9faa6c315e1089133eda2f11c49ad7aaccebc5d5b34a8b77784fd4e1fae8798bf5c85fcd57757a8da79217d296169d936a070aa812c9aa88e",
        "title": "risultati scritto lesssssgooo",
        "uploaded_at": "2020-08-28T17:23:32.000Z",
        "storage_url": "/public/notes/035fef01806ddfb9faa6c315e1089133eda2f11c49ad7aaccebc5d5b34a8b77784fd4e1fae8798bf5c85fcd57757a8da79217d296169d936a070aa812c9aa88e",
        "subject_id": 3,
        "author_id": "a55746552a3404ad989cd4249e6accd7d357b3309952fdf97620092cda32cb81"
    },
    {
        "number": 2,
        "note_id": "07a10ec00e3cdf7c3627e38ec5b17e4160c2c62577117958be77d629729a6d0ef683938edc8e6542b3fc955eda29f4d499b8d7796cf14f2415fd4141bd3a17ce",
        "title": "risultati scritto lesssssgooo",
        "uploaded_at": "2020-08-28T17:23:33.000Z",
        "storage_url": "/public/notes/07a10ec00e3cdf7c3627e38ec5b17e4160c2c62577117958be77d629729a6d0ef683938edc8e6542b3fc955eda29f4d499b8d7796cf14f2415fd4141bd3a17ce",
        "subject_id": 3,
        "author_id": "a55746552a3404ad989cd4249e6accd7d357b3309952fdf97620092cda32cb81"
    },
    {
        "number": 3,
        "note_id": "09bc5d06a51c44934f550f7dcb2a434cd6cbfae9a6618d8de2f40396d477a23ed166349485ee9d43cbd799d3ad431880b150cc8967483ca319cde1bcf376f19c",
        "title": "risultati scritto lesssssgooo",
        "uploaded_at": "2020-08-28T17:23:27.000Z",
        "storage_url": "/public/notes/09bc5d06a51c44934f550f7dcb2a434cd6cbfae9a6618d8de2f40396d477a23ed166349485ee9d43cbd799d3ad431880b150cc8967483ca319cde1bcf376f19c",
        "subject_id": 3,
        "author_id": "a55746552a3404ad989cd4249e6accd7d357b3309952fdf97620092cda32cb81"
    },
    {
        "number": 4,
        "note_id": "0e02acb77af294e6b0acf4f5511ef997698084cffa19db5e7a9ce3952313dbc1d3960d33709ad6b38ff896daee7e57375638dc0381eb7debd758a72ee493a3f6",
        "title": "risultati scritto lesssssgooo",
        "uploaded_at": "2020-08-28T17:23:31.000Z",
        "storage_url": "/public/notes/0e02acb77af294e6b0acf4f5511ef997698084cffa19db5e7a9ce3952313dbc1d3960d33709ad6b38ff896daee7e57375638dc0381eb7debd758a72ee493a3f6",
        "subject_id": 3,
        "author_id": "a55746552a3404ad989cd4249e6accd7d357b3309952fdf97620092cda32cb81"
    },
    {
        "number": 5,
        "note_id": "0f4bd91400cacfb5ba326cdc2aa633ff2544324373a15b128f08f443254605e7554fe45e4fecc3b46b0e46b1d3c0726c7c320ee22c95b1aaf7daa24a8d262beb",
        "title": "risultati scritto lesssssgooo",
        "uploaded_at": "2020-08-28T17:23:22.000Z",
        "storage_url": "/public/notes/0f4bd91400cacfb5ba326cdc2aa633ff2544324373a15b128f08f443254605e7554fe45e4fecc3b46b0e46b1d3c0726c7c320ee22c95b1aaf7daa24a8d262beb",
        "subject_id": 3,
        "author_id": "a55746552a3404ad989cd4249e6accd7d357b3309952fdf97620092cda32cb81"
    },
    {
        "number": 6,
        "note_id": "11e5b277e7466b6c066cc325431faf43d0436c1e3c326a64ec99ba9b28b59f4ccfae3c89dc295d915f49b56891ddd6ef7e6d447825dc8fba30f8720364a69e7d",
        "title": "risultati scritto lesssssgooo",
        "uploaded_at": "2020-08-28T17:23:26.000Z",
        "storage_url": "/public/notes/11e5b277e7466b6c066cc325431faf43d0436c1e3c326a64ec99ba9b28b59f4ccfae3c89dc295d915f49b56891ddd6ef7e6d447825dc8fba30f8720364a69e7d",
        "subject_id": 3,
        "author_id": "a55746552a3404ad989cd4249e6accd7d357b3309952fdf97620092cda32cb81"
    },
    {
        "number": 7,
        "note_id": "232cdb1e5326c9bb7e8199cb004b412ed689425d0c9a4dc9a8e2ac7f77bcb3b525160d11f4b78f2a1791b7e49b7aea826f9d06d38c08b13d85d88240f5a45d8f",
        "title": "risultati scritto lesssssgooo",
        "uploaded_at": "2020-08-28T17:23:31.000Z",
        "storage_url": "/public/notes/232cdb1e5326c9bb7e8199cb004b412ed689425d0c9a4dc9a8e2ac7f77bcb3b525160d11f4b78f2a1791b7e49b7aea826f9d06d38c08b13d85d88240f5a45d8f",
        "subject_id": 3,
        "author_id": "a55746552a3404ad989cd4249e6accd7d357b3309952fdf97620092cda32cb81"
    },
    {
        "number": 8,
        "note_id": "280107cf149cf4b1d9b4a8d4c3942aa5ea39d9fbe6d976edba92d48b4aea3885e6a54c9af8643cebfd339bde02f35ce920c48687e077d2622ac987519e16769d",
        "title": "risultati scritto lesssssgooo",
        "uploaded_at": "2020-08-28T17:23:27.000Z",
        "storage_url": "/public/notes/280107cf149cf4b1d9b4a8d4c3942aa5ea39d9fbe6d976edba92d48b4aea3885e6a54c9af8643cebfd339bde02f35ce920c48687e077d2622ac987519e16769d",
        "subject_id": 3,
        "author_id": "a55746552a3404ad989cd4249e6accd7d357b3309952fdf97620092cda32cb81"
    },
    {
        "number": 9,
        "note_id": "2926c49cc3842f74109c211a0a6b60f060e2649ca5a5c1da072fce59a313a3038d7854d48d07a46299d5db3bf8e696103a30d4f153e97a0a99875f8dd4fc78d2",
        "title": "prova teams fisica",
        "uploaded_at": "2020-08-28T15:57:15.000Z",
        "storage_url": "/public/notes/2926c49cc3842f74109c211a0a6b60f060e2649ca5a5c1da072fce59a313a3038d7854d48d07a46299d5db3bf8e696103a30d4f153e97a0a99875f8dd4fc78d2",
        "subject_id": 4,
        "author_id": "a55746552a3404ad989cd4249e6accd7d357b3309952fdf97620092cda32cb81"
    },
    {
        "number": 10,
        "note_id": "2d351a67a2ca50e3124f6ab0455c13cb0f2cc1da893bcbf9cbfcdf76b492b4ed253a0ed865f0d3711d06b1331c830ddc143064b297bdfbfc3ac98a0f02bab1d0",
        "title": "risultati scritto lesssssgooo",
        "uploaded_at": "2020-08-28T17:23:34.000Z",
        "storage_url": "/public/notes/2d351a67a2ca50e3124f6ab0455c13cb0f2cc1da893bcbf9cbfcdf76b492b4ed253a0ed865f0d3711d06b1331c830ddc143064b297bdfbfc3ac98a0f02bab1d0",
        "subject_id": 3,
        "author_id": "a55746552a3404ad989cd4249e6accd7d357b3309952fdf97620092cda32cb81"
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
