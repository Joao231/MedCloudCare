FROM python:3.8-slim

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /usr/src/app

COPY requirements.txt requirements.txt
RUN apt-get update && apt-get install --no-install-recommends -y gcc g++ && \
    pip install \
    --upgrade pip \
    --upgrade pip setuptools wheel \
    torch==1.9.0+cpu -f https://download.pytorch.org/whl/torch_stable.html \
    torchvision==0.10.0+cpu -f https://download.pytorch.org/whl/torch_stable.html \
    torchaudio===0.9.0 -f https://download.pytorch.org/whl/torch_stable.html \
	-r requirements.txt 
RUN pip install django-allauth
RUN pip install social-auth-app-django
RUN pip install uwsgi
COPY . /usr/src/app

CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]