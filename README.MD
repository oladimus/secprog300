# E2EE Messager
This is a web application focusing on authentication and 1-1 end-to-end encrypted messaging between friends.

## Features
- Authentication (JWT with cookies)
  - Password validation
  - Progressive rate limiting on login & register
  - Logging of login attempts
- Adding, deleting, accepting friends
- Messaging with friends (end-to-end encrypted)

## Instructions to run
To run locally: `docker-compose up --build`
The application can be found on http://localhost:5173
To test the E2EE messaging locally: have two browsers running at the same that don't share cookies/storage (Incognito tabs in Chrome for example). Register two different accounts and login (with the different browsers). When you login, a password is asked for encrypting a private key that will be stored in the browsers indexedDB. You will also need to enter this password when accessing messages. You can also redo this process in settings if something goes wrong. Go to friends tab, add the other user you made as a friend by typing their name and pressing the add button, on the other user accept the friend request in the friends tab. Now you can go to chat (with the password) and message the other user.

To easily inspect database:
`cd backend`
make virtual env `python3 -m venv env`
`source env/bin/activate`
`pip install -r requirements.txt`
`python manage.py createsuperuser`
Go to localhost:8000/notadmin and login with superuser

## Requirements
- Docker
- Docker Compose
- A modern browser for Web crypto API to work (Chrome, Firefox)

## Used tools
- Django (Python 3)
- React (TypeScript)
- Redis (caching)
- Docker (containerization)
- GitHub Actions (self-hosted runner) CI Pipeline for security scanning
