FROM python:3.8-slim

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1


RUN apt-get update && apt-get install --no-install-recommends -y gcc g++ && \
    pip install \
    --upgrade pip \
    --upgrade pip setuptools wheel \
    numpy \
    pandas \
    matplotlib \
    scipy \
    -U scikit-learn \
    seaborn \
    --user --upgrade tensorflow \
    gunicorn \
    gevent \
    Django==2.2.12 \
    djangorestframework==3.11.0 \
    django-cors-headers
    

# set work directory
WORKDIR /usr/src/app
# copy project
COPY . /usr/src/app
COPY container_api/requirements.txt /usr/src/app

RUN pip install -r requirements.txt

EXPOSE 7000

CMD ["python3", "manage.py", "runserver", "0.0.0.0:7000"]