# Start from ubuntu
FROM ubuntu:20.10

USER root

RUN apt-get update -yqq && \
    apt-get upgrade -yqq && \
    apt-get install -yqq apt-utils && \
    apt-get install -yqq \
    build-essential \
    openssh-server \
    openssh-sftp-server \
    gcc \
    lsb-core \
    python3 python3-pip \
    python2 \
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
    apt-get clean \
    ##
    && \
    localedef -i en_US -f UTF-8 en_US.UTF-8

# Adding scripts
ARG SCRIPTS_PATH="/scripts"
ENV SCRIPTS_PATH="${SCRIPTS_PATH}"
COPY scripts $SCRIPTS_PATH
RUN chmod -R +x $SCRIPTS_PATH

ARG APPS_DIR="/apps"
ENV APPS_DIR="${APPS_DIR}"

# Installing helper packages extensions
RUN /scripts/installs/install_vscode_server &&\
    /scripts/installs/install_ttyd && \
    /scripts/installs/install_kubeutils && \
    # /scripts/installs/install_gsfuse && \
    /scripts/installs/install_k9s &&\
    apt-get clean

# Configure sshd
COPY ./docker/sshd_config /etc/ssh/sshd_config
COPY ./.ssh_host_keys/* /etc/ssh/

# Add image scripts
COPY ./docker/scripts ${SCRIPTS_PATH}/image


#########################
# Configure the user environment

ARG WORKSPACE_MOUNT_PATH="/workspace"
ARG VSCODE_EXTENSIONS=""

ENV VSCODE_EXTENSIONS="$VSCODE_EXTENSIONS"
ENV WORKSPACE_MOUNT_PATH $WORKSPACE_MOUNT_PATH

WORKDIR /defaults/user_home
WORKDIR /defaults
COPY ./docker/vscode_default_settings.json  .
COPY ./docker/vscode_default_settings.json  .

# Back to working on workspace

ARG TERMINATE_PORT="9999"
ARG SSH_PORT="22"
ARG TTYD_PORT="9000"
ARG TTYD_SHELL="bash"
ARG VSCODE_PORT="9001"
ARG VSCODE_HTTPS_CERTIFICATE=""
ARG PRESIST_FOLDERS=""
ARG START_VSCODE_HTTP_SERVER="true"
ARG START_SSH_SERVER="true"
ARG START_TTYD_SERVER="true"
ARG USER_INIT_HOOK=""
ARG INIT_HOOK=""

ENV TERMINATE_PORT="${TERMINATE_PORT}"\
    SSH_PORT="${SSH_PORT}"\
    TTYD_PORT="${TTYD_PORT}"\
    TTYD_SHELL="${TTYD_SHELL}"\
    VSCODE_PORT="${VSCODE_PORT}"\
    VSCODE_HTTPS_CERTIFICATE="${VSCODE_HTTPS_CERTIFICATE}"\
    PRESIST_FOLDERS="${PRESIST_FOLDERS}"\
    START_VSCODE_HTTP_SERVER="${START_VSCODE_HTTP_SERVER}"\
    START_SSH_SERVER="${START_SSH_SERVER}"\
    START_TTYD_SERVER="${START_TTYD_SERVER}"\
    INIT_HOOK="${INIT_HOOK}"\
    USER_INIT_HOOK="${USER_INIT_HOOK}"

EXPOSE ${TERMINATE_PORT} $SSH_PORT $TTYD_PORT $VSCODE_PORT

RUN \
    #prepare env workdir
    mkdir -p "$WORKSPACE_MOUNT_PATH" &&\
    sudo groupadd developers && \
    # Change permissions
    chmod -R +x ${SCRIPTS_PATH} && \
    chmod -R 0600 /etc/ssh/ && \
    chmod -R 0777 $WORKSPACE_MOUNT_PATH && \
    chmod -R 0777 /defaults/user_home && \
    chgrp -R developers /defaults/user_home && \
    ln -sf /scripts/image/init_farfetched /usr/bin/init_farfetched\
    && \
    # Install extension
    "${SCRIPTS_PATH}/image/install_vscode_extensions" "$VSCODE_EXTENSIONS"

# Back to root home folder.
WORKDIR /root
CMD [ "/scripts/image/entrypoint" ]
