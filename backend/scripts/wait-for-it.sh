#!/bin/bash
# backend/scripts/wait-for-it.sh
# Wait for a service to be available before proceeding
# Usage: wait-for-it.sh host:port [-t timeout] [-- command args]
# -t TIMEOUT: Timeout in seconds, zero for no timeout
# -- COMMAND ARGS: Execute command with args after the service is available

cmdname=$(basename $0)

# Default values
TIMEOUT=15
QUIET=0
PROTOCOL="tcp"
VERBOSE=0
CHILD=0

# Function to print usage information
function usage() {
    cat << USAGE >&2
Usage:
    $cmdname host:port [-t timeout] [-- command args]
    -t TIMEOUT: Timeout in seconds, zero for no timeout
    -q: Do not output any status messages
    -P PROTOCOL: Connection protocol (tcp/http/https) [default: tcp]
    -v: Verbose output
    -- COMMAND ARGS: Execute command with args after the test finishes
USAGE
    exit 1
}

# Process command line arguments
while [[ $# -gt 0 ]]
do
    case "$1" in
        *:* )
        hostport=(${1//:/ })
        HOST=${hostport[0]}
        PORT=${hostport[1]}
        shift 1
        ;;
        -t)
        TIMEOUT="$2"
        if [[ $TIMEOUT == "" ]]; then usage; fi
        shift 2
        ;;
        -q)
        QUIET=1
        shift 1
        ;;
        -P)
        PROTOCOL="$2"
        if [[ $PROTOCOL == "" ]]; then usage; fi
        shift 2
        ;;
        -v)
        VERBOSE=1
        shift 1
        ;;
        --)
        shift
        CLI=("$@")
        CHILD=1
        break
        ;;
        --help)
        usage
        ;;
        *)
        echo "Unknown argument: $1"
        usage
        ;;
    esac
done

if [[ "$HOST" == "" || "$PORT" == "" ]]; then
    echo "Error: You need to provide a host and port to test."
    usage
fi

# Function to log status messages
function log_message() {
    if [[ "$QUIET" -ne 1 ]]; then
        echo "$@"
    fi
}

# Function to check TCP connection
function tcp_check() {
    local start_ts=$(date +%s)
    local timeout=${TIMEOUT}
    
    if [[ $TIMEOUT -eq 0 ]]; then
        timeout=3600 # 1 hour
    fi
    
    while :
    do
        (echo > /dev/tcp/$HOST/$PORT) >/dev/null 2>&1
        result=$?
        if [[ $result -eq 0 ]]; then
            if [[ $VERBOSE -eq 1 ]]; then
                end_ts=$(date +%s)
                log_message "$HOST:$PORT is available after $((end_ts - start_ts)) seconds"
            fi
            break
        fi
        
        current_ts=$(date +%s)
        if [[ $((current_ts - start_ts)) -gt $timeout ]]; then
            log_message "Timeout occurred after waiting $timeout seconds for $HOST:$PORT"
            exit 1
        fi
        
        sleep 1
    done
}

# Function to check HTTP/HTTPS connection
function http_check() {
    local url="${PROTOCOL}://${HOST}:${PORT}"
    local start_ts=$(date +%s)
    local timeout=${TIMEOUT}
    
    if [[ $TIMEOUT -eq 0 ]]; then
        timeout=3600 # 1 hour
    fi
    
    if ! command -v curl &> /dev/null; then
        log_message "Error: curl command not available. Using TCP check instead."
        tcp_check
        return
    fi
    
    while :
    do
        curl --silent --output /dev/null "${url}" >/dev/null 2>&1
        result=$?
        if [[ $result -eq 0 ]]; then
            if [[ $VERBOSE -eq 1 ]]; then
                end_ts=$(date +%s)
                log_message "$url is available after $((end_ts - start_ts)) seconds"
            fi
            break
        fi
        
        current_ts=$(date +%s)
        if [[ $((current_ts - start_ts)) -gt $timeout ]]; then
            log_message "Timeout occurred after waiting $timeout seconds for $url"
            exit 1
        fi
        
        sleep 1
    done
}

log_message "Waiting for $HOST:$PORT..."

# Choose the appropriate check method
case "$PROTOCOL" in
    tcp)
    tcp_check
    ;;
    http|https)
    http_check
    ;;
    *)
    log_message "Unknown protocol: $PROTOCOL. Using TCP check."
    tcp_check
    ;;
esac

# Execute the command if specified
if [[ $CHILD -gt 0 ]]; then
    log_message "Executing: ${CLI[*]}"
    exec "${CLI[@]}"
fi

exit 0
