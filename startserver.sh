#!/bin/sh
clear
if [ ! -f wait-for ]; then
  # script poi usato per aspettare che mysql sia avviato prima di avviare index.py
  wget https://raw.githubusercontent.com/eficode/wait-for/v2.1.0/wait-for
  chmod +x wait-for
fi
docker-compose build
docker-compose up $1