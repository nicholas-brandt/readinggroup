FROM docker.io/denoland/deno:alpine

RUN echo "https://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories
RUN apk update
RUN apk upgrade
RUN apk add swaks bash perl-net-dns python3 py3-pip