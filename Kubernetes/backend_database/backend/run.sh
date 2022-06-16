#!/bin/sh

python3 manage.py makemigrations

python3 manage.py migrate

exec gunicorn -b 0.0.0.0:8000 -w 3 --timeout 900 -k gevent medical_app.wgsi
             


