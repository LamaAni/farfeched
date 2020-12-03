# Start from ubuntu
FROM ubuntu:20.10

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
ENV SCRIPTS_PATH "${SCRIPTS_PATH}"
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

COPY ./docker/entrypoint /scripts/entrypoint


# Configure sshd
COPY ./docker/sshd_config /etc/ssh/sshd_config
COPY ./.ssh_host_keys/* /etc/ssh/

RUN chmod +x /scripts/entrypoint /scripts/image/create_farfetched_user && \
    chmod -R 0600 /etc/ssh/ && \
    ln -sf /scripts/image/create_farfetched_user /usr/bin/create_farfetched_user

#########################
# Configure the user environment

ARG USER=developer
ARG HOME=/home/${USER}
ARG WORKSPACE_MOUNT_PATH="/workspace"
ARG VSCODE_EXTENSIONS=""

ENV VSCODE_EXTENSIONS="$VSCODE_EXTENSIONS"
ENV WORKSPACE_MOUNT_PATH $WORKSPACE_MOUNT_PATH
ENV HOME $HOME
ENV DEFAULT_FARFETCHED_USERNAME=${USER}

WORKDIR /defaults
COPY ./docker/vscode_default_settings.json  .
COPY ./docker/vscode_default_settings.json  .

RUN create_farfetched_user ${DEFAULT_FARFETCHED_USERNAME}

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

ENV TERMINATE_PORT="${TERMINATE_PORT}"
ENV SSH_PORT="${SSH_PORT}"
ENV TTYD_PORT="${TTYD_PORT}"
ENV TTYD_SHELL="${TTYD_SHELL}"
ENV VSCODE_PORT="${VSCODE_PORT}"
ENV VSCODE_HTTPS_CERTIFICATE="${VSCODE_HTTPS_CERTIFICATE}"
ENV PRESIST_FOLDERS="${PRESIST_FOLDERS}"
ENV START_VSCODE_HTTP_SERVER="${START_VSCODE_HTTP_SERVER}"
ENV START_SSH_SERVER="${START_SSH_SERVER}"
ENV START_TTYD_SERVER="${START_TTYD_SERVER}"

EXPOSE ${TERMINATE_PORT}
EXPOSE $SSH_PORT
EXPOSE $TTYD_PORT
EXPOSE $VSCODE_PORT

USER ${USER}
WORKDIR ${HOME}

CMD [ "/scripts/entrypoint" ]
