FROM debian:bullseye

EXPOSE 8545

# install dependencies from package manager
RUN apt update && apt install -y \
    sudo \
    curl

# install nodejs, npm & yarn
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && apt-get install -y nodejs
RUN npm install -g yarn

# create 'dev' user, add it to sudo group and set password
RUN mkdir /home/dev
RUN useradd dev && chown -R dev /home/dev
RUN adduser dev sudo
RUN echo "dev:dev"|chpasswd 

# create app dir and copy project to it
RUN mkdir /home/dev/app
COPY . /home/dev/app
RUN chown -R dev:dev /home/dev/app

USER dev
WORKDIR /home/dev/app
RUN yarn && npx hardhat compile --quiet

CMD ./start_testenv.sh
