#!/bin/sh

python3 manage.py makemigrations container_api; python3 manage.py migrate && gunicorn -b 0.0.0.0:8000 -w 3 --timeout 3600 medical_app.wsgi