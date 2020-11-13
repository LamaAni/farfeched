# Start from ubuntu
FROM ubuntu:20.10

RUN apt-get update -yqq && \
    apt-get upgrade -yqq && \
    apt-get install -yqq apt-utils && \
    apt-get install -yqq \
    build-essential \
    gcc \
    lsb-core \
    python3 python3-pip \
    nodejs \
    htop \
    netcat \
    sudo \
    git \
    curl \
    npm \
    nano \
    wget \
    ##
    && \
    localedef -i en_US -f UTF-8 en_US.UTF-8

# Adding scripts
ARG SCRIPTS_PATH="/scripts"
ENV SCRIPTS_PATH "${SCRIPTS_PATH}"
COPY scripts $SCRIPTS_PATH
RUN chmod -R +x $SCRIPTS_PATH

ARG APPS_DIR="/apps"
ENV APPS_DIR="${APPS_DIR}"

# Installing helper packages extensions


RUN apt-get update -y && \
    /scripts/installs/install_vscode_server &&\
    /scripts/installs/install_ttyd && \
    /scripts/installs/install_kubeutils && \
    /scripts/installs/install_k9s && \
    # /scripts/installs/install_gsfuse && \
    apt-get clean

RUN apt-get clean

COPY ./docker/entrypoint /scripts/entrypoint
RUN chmod +x /scripts/entrypoint

#########################
# Configure the user environment

ARG USER=me
ARG HOME=/home/${USER}
ARG WORKSPACE_MOUNT_PATH="/workspace"
ARG VSCODE_EXTENSIONS=""

ENV VSCODE_EXTENSIONS="$VSCODE_EXTENSIONS"
ENV WORKSPACE_MOUNT_PATH $WORKSPACE_MOUNT_PATH
ENV HOME $HOME
ENV DEV_USER ${USER}

RUN groupadd developers && useradd -ms /bin/bash -g developers $DEV_USER && \
    adduser $DEV_USER sudo && \
    echo "$DEV_USER ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/$DEV_USER" && \
    chmod 0440 /etc/sudoers.d/$DEV_USER

USER ${USER}


WORKDIR $WORKSPACE_MOUNT_PATH

WORKDIR ${HOME}

# Change permissions
RUN ${SCRIPTS_PATH}/image/fix_folder_permissions $APPS_DIR &&\
    ${SCRIPTS_PATH}/image/install_vscode_server_user_extensions

# Install default bash config
RUN npm install https://github.com/LamaAni/zlib-bash-config.git && \
    echo "/scripts/image/bind_mounts" >> $HOME/.bashrc

ARG TTYD_PORT="9000"
ARG TTYD_SHELL="bash"
ARG VSCODE_PORT="9001"
ARG EXTRA_HOMELINKED_VOLUMES="/mnt/homelinked_volumes"

EXPOSE $TTYD_PORT
EXPOSE $VSCODE_PORT

ENV TTYD_PORT=$TTYD_PORT
ENV TTYD_SHELL=$TTYD_SHELL
ENV VSCODE_PORT=$VSCODE_PORT
ENV EXTRA_HOMELINKED_VOLUMES=$EXTRA_HOMELINKED_VOLUMES

CMD [ "/scripts/entrypoint" ]
