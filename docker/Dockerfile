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

RUN chmod +x /scripts/entrypoint && \
    chmod -R 0600 /etc/ssh/

#########################
# Configure the user environment

ARG USER=developer
ARG HOME=/home/${USER}
ARG WORKSPACE_MOUNT_PATH="/workspace"
ARG VSCODE_EXTENSIONS=""

ENV VSCODE_EXTENSIONS="$VSCODE_EXTENSIONS"
ENV WORKSPACE_MOUNT_PATH $WORKSPACE_MOUNT_PATH
ENV HOME $HOME
ENV DEV_USER ${USER}


RUN groupadd developers && \
    useradd -ms /bin/bash -g developers $DEV_USER -p "" && \
    adduser $DEV_USER sudo && \
    echo "$DEV_USER ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/$DEV_USER" && \
    chmod 0440 /etc/sudoers.d/$DEV_USER && \
    mkdir -p "$WORKSPACE_MOUNT_PATH"

USER ${USER}
WORKDIR ${HOME}

# Change permissions
RUN ${SCRIPTS_PATH}/image/fix_folder_permissions "/workspace" && \
    ${SCRIPTS_PATH}/image/install_vscode_server_user_extensions

# Configure vscode
COPY ./docker/vscode_default_settings.json  /home/${USER}/.config/Code/User/settings.json
COPY ./docker/vscode_default_settings.json  /home/${USER}/.local/share/code-server/User/settings.json

ARG TTYD_PORT="9000"
ARG TTYD_SHELL="bash"
ARG VSCODE_PORT="9001"
ARG EXTRA_HOMELINKED_VOLUMES="/mnt/homelinked_volumes"
ARG CODE_SERVER_HTTPS_CERTIFICATE=""

EXPOSE $TTYD_PORT
EXPOSE $VSCODE_PORT

ENV TTYD_PORT=$TTYD_PORT
ENV TTYD_SHELL=$TTYD_SHELL
ENV VSCODE_PORT=$VSCODE_PORT
ENV EXTRA_HOMELINKED_VOLUMES=$EXTRA_HOMELINKED_VOLUMES
ENV CODE_SERVER_HTTPS_CERTIFICATE="${CODE_SERVER_HTTPS_CERTIFICATE}"

ARG START_VSCODE_HTTP_SERVER="true"
ARG START_SSH_SERVER="true"
ARG START_TTYD_SERVER="true"

ENV START_VSCODE_HTTP_SERVER=${START_VSCODE_HTTP_SERVER}
ENV START_SSH_SERVER=${START_SSH_SERVER}
ENV START_TTYD_SERVER=${START_TTYD_SERVER}

CMD [ "/scripts/entrypoint" ]
