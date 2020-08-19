CREATE TABLE users(
    id INT AUTO_INCREMENT,
    name VARCHAR(256) NOT NULL,
    surname VARCHAR(256) NOT NULL,
    email VARCHAR(256) NOT NULL UNIQUE,
    password VARCHAR(256) NOT NULL,
    admin INT NOT NULL,
    unimore_id INT, -- Actually can be null and set by the user at a later time. 

    PRIMARY KEY (id)
);

CREATE TABLE subjects(
    id INT AUTO_INCREMENT,
    name VARCHAR(1024) NOT NULL,
    professor_name VARCHAR(1024),
    professor_surname VARCHAR(1024),

    PRIMARY KEY (id)
);

CREATE TABLE notes(
    id INT AUTO_INCREMENT,
    title VARCHAR(1024),
    file_id VARCHAR(256), -- The file_id refers to the name of the note's file in the storage, excluding the extension (that is always .pdf).
    subject_id INT,
    author_id INT,
    uploaded_at DATETIME,

    PRIMARY KEY (id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (author_id) REFERENCES users(id)
);

