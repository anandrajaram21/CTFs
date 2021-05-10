#! /usr/bin/env bash
# This is just so secure

cd "$(dirname -- "${BASH_SOURCE[0]}")" || { echo "Failed to change to working directory"; exit 1; }

if [[ -z "$PIPE_DIR" ]]; then
    pipe_dir=.
else
    pipe_dir="$PIPE_DIR"
fi

pipe_in="$(mktemp -u pipe-in-XXXXXXXXXX -p "$pipe_dir")"
pipe_stop="$(mktemp -u pipe-stop-XXXXXXXXXX -p "$pipe_dir")"
export pipe_in
export pipe_stop

mkfifo "$pipe_in" "$pipe_stop" || { echo "mkfifo failed"; exit 1; }

commands='python3 haxlabs.py < "$pipe_in"; bash --rcfile ./.bashrc'

# Use unbuffer to make an interactive shell so our fancy prompt actually show up!

cat "$pipe_stop" | unbuffer -p bash -c "$commands" 2>&1 &

function on_exit() {
    echo "Stopping..." >&2
    echo > "$pipe_stop"
    rm "$pipe_in" "$pipe_stop"
}

trap on_exit EXIT

cat > "$pipe_in"
exit 0
