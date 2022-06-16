# pull the official base image
#FROM alpine:3.2
#FROM projectmonai/monai
#FROM pytorch/pytorch:latest



# install dependencies
#RUN apk update \
    #&& apk add --no-cache --virtual .build-deps \
    #gcc \
    #g++ \
    #&& pip install --no-cache-dir \
    #--upgrade pip \
    #--upgrade pip setuptools wheel \
    #torch==1.9.0+cpu -f https://download.pytorch.org/whl/torch_stable.html\
    #torchvision==0.10.0+cpu -f https://download.pytorch.org/whl/torch_stable.html\
    #torchaudio==0.9.0 -f https://download.pytorch.org/whl/torch_stable.html \
    #Django==2.2.12 \
    #djangorestframework==3.11.0 \
    #django-cors-headers 
    #scikit-build \
    #cmake \
    #numpy 
    #monailabel

FROM python:3.8-slim

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1


RUN apt-get update && apt-get install --no-install-recommends -y gcc g++ && \
    pip install \
    --upgrade pip \
    --upgrade pip setuptools wheel \
    torch==1.9.0+cpu -f https://download.pytorch.org/whl/torch_stable.html \
    torchvision==0.10.0+cpu -f https://download.pytorch.org/whl/torch_stable.html \
    torchaudio===0.9.0 -f https://download.pytorch.org/whl/torch_stable.html \
    gunicorn \
    gevent \
    Django==2.2.12 \
    djangorestframework==3.11.0 \
    django-cors-headers \
    scikit-build \
    monailabel

# set work directory
WORKDIR /usr/src/app
# copy project
COPY . /usr/src/app
COPY container_api/requirements.txt /usr/src/app

RUN pip install -r requirements.txt
RUN pip install gunicorn
EXPOSE 7000

#CMD ["python3", "manage.py", "runserver", "0.0.0.0:7000"]
CMD ["gunicorn", "-b", "0.0.0.0:7000", "-w", "3", "-k", "sync", "--timeout", "3600", "django_container.wsgi"]


#RUN pip install --upgrade pip
#RUN pip install --upgrade pip setuptools wheel

#RUN apk update && apk add python3-dev \
                          #gcc \
                          #libc-dev \
                          #libffi-dev
    #apk --update add --no-cache && \
    #g++ \
    #-gfortran \
    #db \
    #libgeos-dev \ 
    #make \
    #python3 python3-dev gcc \
    #gfortran musl-dev && \
#RUN pip install \
    #-r requirements.txt \
    #install --upgrade pip \
    #pip install --upgrade pip setuptools wheel \
    #torch==1.9.0+cpu -f https://download.pytorch.org/whl/torch_stable.html \
    #torchvision==0.10.0+cpu -f https://download.pytorch.org/whl/torch_stable.html \
    #torchaudio===0.9.0 -f https://download.pytorch.org/whl/torch_stable.html \
    #gunicorn \
    #gevent \
    #Django==2.2.12 \
    #djangorestframework==3.11.0 \
    #django-cors-headers \
    #scikit-build \
    #monailabel

#RUN /opt/conda/bin/conda install --yes monailabel-weekly









#RUN pip install torch==1.9.0+cpu torchvision==0.10.0+cpu torchaudio==0.9.0 -f https://download.pytorch.org/whl/torch_stable.html

#RUN apt-get update \
     #&& apt-get install -y \ 
        #gcc \
        #g++ \
        #libgl1-mesa-glx \
        #libx11-xcb1 \
     #&& apt-get clean all \
     #&& rm -r /var/lib/apt/lists/*

#RUN /opt/conda/bin/conda install --yes \
    #astropy \
    #matplotlib \
    #pandas \
    #scikit-learn \
    #scikit-image 


#COPY requirements.txt /usr/src/app
#RUN pip install -r requirements.txt

