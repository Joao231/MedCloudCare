FROM nginx:stable-alpine
RUN apk --no-cache add curl
COPY platform/viewer/container/etc/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY platform/viewer/container/etc/nginx/nginx_conf.conf /etc/nginx/nginx.conf
COPY platform/viewer/dist/ /usr/share/nginx/html
COPY platform/.htpasswd etc/nginx/conf/.htpasswd

EXPOSE 80
