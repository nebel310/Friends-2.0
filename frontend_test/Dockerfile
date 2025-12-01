FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY *.html ./
COPY css ./css
COPY js ./js
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
# COPY . /usr/share/nginx/html
EXPOSE 80